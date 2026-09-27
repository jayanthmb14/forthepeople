/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// AI model list, routing and cost table — PURE (no DB, no Redis, no fetch).
//
// This is the one file to edit when OpenRouter renames or retires a model.
// src/lib/ai-provider.ts does the calling; this file only decides WHICH
// models a call may try, in what order, and what they cost. Keeping it pure
// means the chain rules are unit-tested (tests/ai-models.test.ts).
//
// Every id below was checked against GET https://openrouter.ai/api/v1/models
// on 2026-09-27 (live, no expiration_date set). See docs/RUNBOOKS/ai-models.md.
// ═══════════════════════════════════════════════════════════

// ── Tier 1: free models for classify / summarize / format / news-analysis ──
// Order matters: the first live, non-broken model answers.
//   gemma-4-26b-a4b  MoE with 4B active params: fast, fits cron time budgets
//   gemma-4-31b      larger, but often rate-limited upstream (429)
//   nemotron-3-super reasoning model: we ask for low effort and hide the reasoning
//   openrouter/free  OpenRouter's own router across the free models; it keeps
//                    working when individual free slugs are renamed
export const TIER1_FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openrouter/free",
] as const;

// Paid backstop for Tier 1. ONLY used when AI_PAID_FALLBACK=1, and always in
// the LAST slot of the chain (it used to be cut off by the attempt cap, so it
// could never be reached). $0.018 / $0.09 per 1M tokens.
export const TIER1_PAID_BACKSTOP = "openai/gpt-oss-20b";

// ── Tier 2: citizen-facing insights and documents (cheap, paid) ──
// gemini-3.1-flash-lite replaces gemini-2.5-flash-lite, which OpenRouter
// retires on 2026-10-20. gemma-4-31b (paid) is the budget fallback; after
// that the call falls through to the free Tier-1 chain.
export const TIER2_MODELS = ["google/gemini-3.1-flash-lite", "google/gemma-4-31b-it"] as const;

// ── Tier 3: fact-check (admin-triggered only) ──
// No free fallback: a fact-check done by a small free model is worse than
// no fact-check.
export const FACT_CHECK_MODELS = ["anthropic/claude-sonnet-4.6", "anthropic/claude-haiku-4.5"] as const;

// Models that "think" before answering. We send
//   reasoning: { effort: "low", exclude: true }
// so the thinking stays short and never leaks into the answer text, and we
// give them extra max_tokens headroom (thinking counts against max_tokens).
export const REASONING_MODELS: ReadonlySet<string> = new Set([
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b",
  "openrouter/free", // may route to a reasoning model
]);
export const REASONING_TOKEN_HEADROOM = 1024;

export type AITier = "tier1" | "tier2" | "fact-check";

/** Which tier a `purpose` belongs to. Unknown purposes are Tier 1 (free). */
export function tierForPurpose(purpose: string): AITier {
  switch (purpose) {
    case "insight":
    case "document":
    case "document-large":
      return "tier2";
    case "fact-check":
      return "fact-check";
    default:
      // classify, summarize, format, news-analysis, anything else
      return "tier1";
  }
}

/** The first model a purpose tries (what /api/health and the admin panel show). */
export function getModelForPurpose(purpose: string): string {
  switch (tierForPurpose(purpose)) {
    case "tier2":
      return TIER2_MODELS[0];
    case "fact-check":
      return FACT_CHECK_MODELS[0];
    default:
      return TIER1_FREE_MODELS[0];
  }
}

// Never try more models than this for one call (bounds the time a call can
// take). The reserved paid slot counts towards the cap.
export const MAX_ATTEMPTS: Record<AITier, number> = {
  tier1: 4,
  tier2: 4,
  "fact-check": 2,
};

export interface ChainPlan {
  tier: AITier;
  /** Models in preference order (before discovery / breaker filtering). */
  candidates: string[];
  /** Models that must keep the LAST slot(s) even when the cap cuts the list. */
  reserved: string[];
  maxAttempts: number;
}

/**
 * The ordered list of models a call MAY try, before we know which are live.
 * `pinned` = the caller asked for a specific model; it goes first.
 */
export function planChain(purpose: string, opts: { paidFallback: boolean; pinned?: string }): ChainPlan {
  const tier = tierForPurpose(purpose);
  let base: string[];
  let reserved: string[] = [];
  if (tier === "fact-check") {
    base = [...FACT_CHECK_MODELS];
  } else if (tier === "tier2") {
    base = [...TIER2_MODELS, ...TIER1_FREE_MODELS];
  } else {
    base = [...TIER1_FREE_MODELS];
    if (opts.paidFallback) reserved = [TIER1_PAID_BACKSTOP];
  }
  const candidates = dedupe([...(opts.pinned ? [opts.pinned] : []), ...base]).filter((m) => !reserved.includes(m));
  return { tier, candidates, reserved, maxAttempts: MAX_ATTEMPTS[tier] };
}

/**
 * Turn a plan into the concrete chain for this call:
 *   - drop models that are not on OpenRouter's live list (when we know it);
 *     a pinned model is exempt (the caller may know a brand-new id)
 *   - drop models whose circuit breaker is open
 *   - cap at maxAttempts, but ALWAYS keep the reserved (paid) slot last
 */
export function selectChain(
  plan: ChainPlan,
  state: { live: ReadonlySet<string> | null; broken: ReadonlySet<string>; pinned?: string },
): string[] {
  const usable = (m: string) =>
    !state.broken.has(m) && (state.live === null || state.live.has(m) || (state.pinned !== undefined && m === state.pinned));
  const reserved = plan.reserved.filter(usable);
  const room = Math.max(0, plan.maxAttempts - reserved.length);
  const main = plan.candidates.filter(usable).slice(0, room);
  return [...main, ...reserved];
}

/** Every model any chain can use (for discovery, expiry checks and health). */
export const ALL_CHAIN_MODELS: readonly string[] = dedupe([
  ...TIER1_FREE_MODELS,
  TIER1_PAID_BACKSTOP,
  ...TIER2_MODELS,
  ...FACT_CHECK_MODELS,
]);

// ── Model expiry guard ──────────────────────────────────────
// OpenRouter publishes an `expiration_date` on models it is about to retire.
// The live values are cached by ai-provider.ts during model discovery; this
// static list holds the dates we already know, so the guard works even when
// discovery has not run. Add a line here whenever /models shows a date for a
// model we use. (Checked 2026-09-27: none of the chain models has one.)
export const KNOWN_MODEL_EXPIRY: Record<string, string> = {
  // Previous Tier-2 models, kept so a revert to them is caught at once.
  "google/gemini-2.5-flash-lite": "2026-10-20",
  "google/gemini-2.5-flash": "2026-10-20",
  "google/gemini-2.5-pro": "2026-10-20",
};

export const EXPIRY_WARNING_DAYS = 30;

export interface ExpiringModel {
  model: string;
  expiresOn: string; // YYYY-MM-DD
  daysLeft: number; // negative = already past
}

/**
 * Models from `models` whose expiry date falls within `withinDays` of `now`
 * (or has already passed). Sorted soonest first. Invalid dates are ignored.
 */
export function findExpiringModels(
  models: readonly string[],
  expiry: Record<string, string | null | undefined>,
  now: Date,
  withinDays: number = EXPIRY_WARNING_DAYS,
): ExpiringModel[] {
  const out: ExpiringModel[] = [];
  for (const model of models) {
    const raw = expiry[model];
    if (!raw) continue;
    const t = Date.parse(raw.length === 10 ? `${raw}T00:00:00Z` : raw);
    if (!Number.isFinite(t)) continue;
    const daysLeft = Math.floor((t - now.getTime()) / 86_400_000);
    if (daysLeft <= withinDays) out.push({ model, expiresOn: new Date(t).toISOString().slice(0, 10), daysLeft });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ── Price table (USD per 1 MILLION tokens: [input, output]) ─
// Source: OpenRouter /api/v1/models pricing on 2026-09-27. Unknown models
// are logged at $0 so a missing entry never blocks a call. Old ids stay so
// historical AIUsageLog rows keep their cost.
export const PRICE_TABLE: Record<string, [number, number]> = {
  // Tier 1 (free)
  "google/gemma-4-26b-a4b-it:free": [0, 0],
  "google/gemma-4-31b-it:free": [0, 0],
  "nvidia/nemotron-3-super-120b-a12b:free": [0, 0],
  "openrouter/free": [0, 0],
  // Paid
  "openai/gpt-oss-20b": [0.018, 0.09],
  "google/gemma-4-26b-a4b-it": [0.0675, 0.225],
  "google/gemma-4-31b-it": [0.09, 0.34],
  "google/gemini-3.1-flash-lite": [0.25, 1.5],
  "anthropic/claude-sonnet-4.6": [3, 15],
  "anthropic/claude-haiku-4.5": [1, 5],
  // Retired from the chain (historical rows)
  "google/gemini-2.5-flash-lite": [0.1, 0.4],
  "google/gemini-2.5-flash": [0.3, 2.5],
  "google/gemini-2.5-pro": [1.25, 10],
  "anthropic/claude-sonnet-4": [3, 15],
  // Anthropic direct (FTP_AI_PROVIDER=anthropic path, scripts only)
  "claude-haiku-4-5-20251001": [1, 5],
};

export const INR_PER_USD = 84;

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** Cost of one call. Returns {usd, inr}; 0 for unknown or free models. */
export function estimateCost(model: string, usage: TokenUsage | undefined): { usd: number; inr: number } {
  if (!usage) return { usd: 0, inr: 0 };
  const [inPrice, outPrice] = PRICE_TABLE[model] ?? [0, 0];
  const usd = ((usage.prompt_tokens || 0) / 1_000_000) * inPrice + ((usage.completion_tokens || 0) / 1_000_000) * outPrice;
  return { usd, inr: usd * INR_PER_USD };
}

function dedupe(list: readonly string[]): string[] {
  return list.filter((m, i) => list.indexOf(m) === i);
}
