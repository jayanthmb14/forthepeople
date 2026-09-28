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
//
// Chosen 27 Sep 2026 from a test on 28 real headlines with the news-analysis
// prompt, scored against Claude Sonnet 5 (valid JSON / same "about this
// district" call / same module):
//   gpt-5.6-luna 28/28/22 · jev-router 28/26/19 (free, conservative)
//   gemini-3.1-flash-lite 28/27/17 · glm-5.3-flashx 28/27/17
//   deepseek-v4.1-flash 26/22/16 · glm-5.3-flash 22 valid (timeouts)
//   gemma-4 free 0 (rate-limited that day) · qwen3.7-flash 2 valid
// ═══════════════════════════════════════════════════════════

// ── Tier 1: free models for classify / summarize / format / news-analysis ──
// Order matters: the first live, non-broken model answers.
//   jev-router       TypeSafe's router (OpenRouter): picks a model + effort per
//                    request. On 2026-09-27 it routed to a free stealth model,
//                    so it cost $0. Stealth models end without notice, which
//                    is why the free Gemma and the paid backstop sit behind it.
//                    It rejects response_format/reasoning (PLAIN_PARAMS_MODELS).
//   gemma-4-26b-a4b  MoE with 4B active params: fast, often rate-limited
//   openrouter/free  OpenRouter's own router across the free models; it keeps
//                    working when individual free slugs are renamed
export const TIER1_FREE_MODELS = [
  "typesafe/jev-router",
  "google/gemma-4-26b-a4b-it:free",
  "openrouter/free",
] as const;

// Paid backstop for Tier 1. ONLY used when AI_PAID_FALLBACK=1 (set in Vercel
// on 2026-09-27), and always in the LAST slot of the chain. The most accurate
// model in the 27 Sep test; about $0.0004 per news article.
export const TIER1_PAID_BACKSTOP = "openai/gpt-5.6-luna";

// ── Tier 2: citizen-facing insights and documents (cheap, paid) ──
// gpt-5.6-luna ($0.20 / $1.20) beat gemini-3.1-flash-lite ($0.25 / $1.50) on
// accuracy and price in the 27 Sep test; flash-lite is the fallback. After
// these the call falls through to the free Tier-1 chain.
export const TIER2_MODELS = ["openai/gpt-5.6-luna", "google/gemini-3.1-flash-lite"] as const;

// ── Tier 3: fact-check (admin-triggered only) ──
// No free fallback: a fact-check done by a small free model is worse than
// no fact-check.
// Sonnet 5 ($2 / $10) is newer and cheaper than Sonnet 4.6 ($3 / $15).
export const FACT_CHECK_MODELS = ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4.5"] as const;

// Models that "think" before answering. We send
//   reasoning: { effort: "low", exclude: true }
// so the thinking stays short and never leaks into the answer text, and we
// give them extra max_tokens headroom (thinking counts against max_tokens).
export const REASONING_MODELS: ReadonlySet<string> = new Set([
  "openai/gpt-5.6-luna",
  "openai/gpt-oss-20b",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openrouter/free", // may route to a reasoning model
]);

// Routers that choose their own reasoning effort and reject response_format /
// reasoning: send them the plain request (no failed first attempt).
export const PLAIN_PARAMS_MODELS: ReadonlySet<string> = new Set(["typesafe/jev-router"]);
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
  // Tier 1 (free). jev-router bills at the routed model's price; it routed to
  // a free stealth model on 2026-09-27. OpenRouter's dashboard is the truth.
  "typesafe/jev-router": [0, 0],
  "google/gemma-4-26b-a4b-it:free": [0, 0],
  "google/gemma-4-31b-it:free": [0, 0],
  "nvidia/nemotron-3-super-120b-a12b:free": [0, 0],
  "openrouter/free": [0, 0],
  // Paid
  "openai/gpt-5.6-luna": [0.2, 1.2],
  "anthropic/claude-sonnet-5": [2, 10],
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

/** The one USD → INR rate for AI-cost figures (approximate; admin screens only). */
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
