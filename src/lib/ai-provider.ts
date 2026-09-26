/**
 * ForThePeople.in — Unified AI Provider (OpenRouter)
 * Routes to different models based on task purpose.
 * All AI calls in the codebase go through callAI().
 *
 * Sept 2026 rewrite (audit items 3.6 and 9.3). What changed and why:
 *   1. MODEL IDS — every ":free" model we used was removed from OpenRouter
 *      on 22 Aug 2026, so every AI call 404'd for five weeks. The ids below
 *      were verified live against GET https://openrouter.ai/api/v1/models
 *      on 2026-09-27. See docs/RUNBOOKS/ai-models.md for how to rotate them.
 *   2. MODEL DISCOVERY — we fetch the live model list at most once per 6 h
 *      (cached in Redis "ftp:ai:models") and skip any chain model that is
 *      not on it. If the fetch fails we fall back to the static list.
 *   3. CIRCUIT BREAKER — a model that answers 404/400 "not found" is marked
 *      dead for 24 h ("ftp:ai:cb:<model>"); a 429 marks it busy for 10 min.
 *      We never hammer a dead model 6× per call again.
 *   4. ATTEMPT CAP — at most 3 models are tried per call.
 *   5. ONE LOG ROW PER CALL — AIUsageLog gets exactly one row per callAI()
 *      (the attempted models are listed in errorMsg), instead of one row
 *      per failed fallback (that was ~60k junk rows since August).
 *   6. REAL COST — costUSD / costINR are computed from PRICE_TABLE
 *      (USD per 1M tokens, 84 INR/USD) instead of the hard-coded 0.
 *   7. DEGRADED FLAG — when every model fails we set "ftp:ai:degraded"
 *      (24 h TTL, read by /api/health) and email the admin at most once a day.
 */

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendAdminAlert } from "@/lib/admin-alerts";

// ── Types ───────────────────────────────────────────────────
export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  purpose?: string;
  model?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
  district?: string;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  usedFallback: boolean;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ── Tiered model routing ────────────────────────────────────
// TIER 1 (free, ₹0): classification, summaries, formatting, news analysis.
//   These are "pick a category / extract a few fields" tasks; a free model
//   handles them fine and the fallback chain catches rate-limit misses.
// TIER 2 (cheap): citizen-facing insights and documents.
//   gemini-2.5-flash-lite is $0.10/$0.40 per 1M tokens — 15× cheaper on
//   output than gemini-2.5-pro, which burned $4.56 in two days in April.
// TIER 2+ : very large documents only.
// TIER 3 (premium): fact-checks, where accuracy matters most.
export function getModelForPurpose(purpose: string): string {
  switch (purpose) {
    case "classify":
    case "summarize":
    case "format":
    case "news-analysis":
      return "google/gemma-4-31b-it:free";

    case "insight":
    case "document":
      return "google/gemini-2.5-flash-lite";

    case "document-large":
      return "google/gemini-2.5-pro";

    case "fact-check":
      return "anthropic/claude-sonnet-4";

    default:
      return "google/gemma-4-31b-it:free";
  }
}

// Fallback chain: if the primary model fails (rate limit, removed, 5xx),
// try these in order. All free. Verified live 2026-09-27.
export const FREE_FALLBACK_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "qwen/qwen3.8-27b:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
];

// Paid backstop: ONLY used when the owner opts in with AI_PAID_FALLBACK=1
// in Vercel env. gpt-oss-20b is $0.018/$0.09 per 1M tokens — worst case
// about $1/month (~₹85) if every Tier-1 call lands here.
function getPaidBackstop(): string[] {
  return process.env.AI_PAID_FALLBACK === "1" ? ["openai/gpt-oss-20b"] : [];
}

// Never try more than this many models for a single callAI().
const MAX_ATTEMPTS_PER_CALL = 3;

// ── Price table (USD per 1 MILLION tokens: [input, output]) ─
// Source: OpenRouter /api/v1/models pricing on 2026-09-27. Unknown models
// are logged at $0 so a missing entry never blocks a call — add new ids
// here when you rotate models (see docs/RUNBOOKS/ai-models.md).
const PRICE_TABLE: Record<string, [number, number]> = {
  "google/gemma-4-31b-it:free": [0, 0],
  "google/gemma-4-26b-a4b-it:free": [0, 0],
  "nvidia/nemotron-3-super-120b-a12b:free": [0, 0],
  "qwen/qwen3.8-27b:free": [0, 0],
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": [0, 0],
  "nvidia/nemotron-3-ultra-550b-a55b:free": [0, 0],
  "google/gemini-2.5-flash-lite": [0.1, 0.4],
  "google/gemini-2.5-flash": [0.3, 2.5],
  "google/gemini-2.5-pro": [1.25, 10],
  "anthropic/claude-sonnet-4": [3, 15],
  "openai/gpt-oss-20b": [0.018, 0.09],
  // Anthropic direct (FTP_AI_PROVIDER=anthropic path, scripts only)
  "claude-haiku-4-5-20251001": [1, 5],
};

const INR_PER_USD = 84;

/** Compute the cost of one call. Returns {usd, inr}; 0 for unknown models. */
export function estimateCost(model: string, usage: TokenUsage | undefined): { usd: number; inr: number } {
  if (!usage) return { usd: 0, inr: 0 };
  const [inPrice, outPrice] = PRICE_TABLE[model] ?? [0, 0];
  const usd = (usage.prompt_tokens / 1_000_000) * inPrice + (usage.completion_tokens / 1_000_000) * outPrice;
  return { usd, inr: usd * INR_PER_USD };
}

// ── Redis keys ──────────────────────────────────────────────
const KEY_LIVE_MODELS = "ftp:ai:models"; // cached id list from OpenRouter
const KEY_DEGRADED = "ftp:ai:degraded"; // set on total failure, read by /api/health
const KEY_ALERTED = "ftp:ai:alerted"; // rate-limits the admin email to 1/day
const cbKey = (model: string) => `ftp:ai:cb:${model}`; // circuit breaker per model

const LIVE_MODELS_TTL_S = 6 * 60 * 60; // 6 hours
const DEGRADED_TTL_S = 24 * 60 * 60; // 24 hours
const CB_NOT_FOUND_TTL_S = 24 * 60 * 60; // model removed/unavailable -> 24 h
const CB_RATE_LIMIT_TTL_S = 10 * 60; // 429 -> 10 min

// ── Model discovery ─────────────────────────────────────────
// In-memory copy so a warm lambda does not hit Redis on every call.
let liveModelsMem: { ids: Set<string>; fetchedAt: number } | null = null;
const LIVE_MODELS_MEM_TTL_MS = 30 * 60 * 1000; // 30 min in-process

/**
 * Returns the set of model ids OpenRouter currently serves, or null when
 * we could not find out (no Redis AND fetch failed). Callers treat null
 * as "use the static list unchanged".
 */
async function getLiveModelIds(): Promise<Set<string> | null> {
  // 1. In-process cache
  if (liveModelsMem && Date.now() - liveModelsMem.fetchedAt < LIVE_MODELS_MEM_TTL_MS) {
    return liveModelsMem.ids;
  }

  // 2. Redis cache (shared across lambdas, 6 h)
  if (redis) {
    try {
      const cached = await redis.get<string[]>(KEY_LIVE_MODELS);
      if (Array.isArray(cached) && cached.length > 0) {
        liveModelsMem = { ids: new Set(cached), fetchedAt: Date.now() };
        return liveModelsMem.ids;
      }
    } catch {
      /* fall through to fetch */
    }
  }

  // 3. Fetch from OpenRouter (public endpoint, no key needed)
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: Array<{ id?: string }> };
    const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === "string");
    if (ids.length === 0) throw new Error("empty model list");

    liveModelsMem = { ids: new Set(ids), fetchedAt: Date.now() };
    if (redis) {
      redis.set(KEY_LIVE_MODELS, ids, { ex: LIVE_MODELS_TTL_S }).catch(() => {});
    }
    return liveModelsMem.ids;
  } catch (err) {
    console.warn("[AI] model discovery failed, using static list:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Circuit breaker ─────────────────────────────────────────
/** Returns the subset of `models` that are NOT currently circuit-broken. */
async function filterOpenCircuits(models: string[]): Promise<string[]> {
  if (!redis || models.length === 0) return models;
  try {
    const flags = await redis.mget<(string | null)[]>(...models.map(cbKey));
    return models.filter((_, i) => !flags[i]);
  } catch {
    return models; // Redis hiccup — try everything rather than nothing
  }
}

async function tripCircuit(model: string, reason: string, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(cbKey(model), reason.slice(0, 120), { ex: ttlSeconds });
  } catch {
    /* non-fatal */
  }
}

// ── OpenRouter error with HTTP status so we can classify it ─
class OpenRouterError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`OpenRouter ${status}: ${body.slice(0, 200)}`);
    this.name = "OpenRouterError";
    this.status = status;
    this.body = body;
  }
}

/** Looks like "this model id does not exist / is not served any more". */
function isModelGone(err: unknown): boolean {
  if (!(err instanceof OpenRouterError)) return false;
  if (err.status !== 404 && err.status !== 400) return false;
  const b = err.body.toLowerCase();
  return (
    b.includes("not found") ||
    b.includes("unavailable") ||
    b.includes("no endpoints") ||
    b.includes("not a valid model") ||
    b.includes("does not exist") ||
    err.status === 404
  );
}

function isRateLimited(err: unknown): boolean {
  return err instanceof OpenRouterError && err.status === 429;
}

// ── OpenRouter call ─────────────────────────────────────────
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

async function callOpenRouter(
  req: AIRequest,
  model: string,
  maxTokens: number,
  temp: number,
): Promise<{ text: string; usage?: TokenUsage }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  let sys = req.systemPrompt;
  if (req.jsonMode) {
    sys += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no preamble. Pure JSON only.";
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://forthepeople.in",
      "X-Title": "ForThePeople.in",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: req.userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: temp,
    }),
    // A hung upstream must not eat a whole cron budget. 60 s is generous
    // for a 2k-token completion.
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new OpenRouterError(res.status, errBody);
  }

  const data = await res.json();
  let text: string = data.choices?.[0]?.message?.content || "";

  if (req.jsonMode) {
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  }

  return { text, usage: data.usage };
}

// ── Usage logging (exactly ONE row per callAI) ──────────────
async function logUsage(
  provider: string,
  model: string,
  purpose: string,
  district: string | undefined,
  usage: TokenUsage | undefined,
  durationMs: number,
  success: boolean,
  errorMsg?: string,
) {
  try {
    const cost = estimateCost(model, usage);
    await prisma.aIUsageLog.create({
      data: {
        provider,
        model,
        purpose,
        district: district || null,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
        costUSD: cost.usd,
        costINR: cost.inr,
        durationMs,
        success,
        errorMsg: errorMsg?.slice(0, 500),
      },
    });
  } catch {
    // Never let logging break the AI call
  }
}

// ── Degraded flag + once-a-day admin alert ──────────────────
async function markDegraded(summary: string): Promise<void> {
  if (redis) {
    try {
      await redis.set(KEY_DEGRADED, { at: new Date().toISOString(), error: summary.slice(0, 300) }, { ex: DEGRADED_TTL_S });
    } catch {
      /* non-fatal */
    }
  }

  // Email at most once per day. SET NX returns null when the key exists.
  let shouldAlert = true;
  if (redis) {
    try {
      const set = await redis.set(KEY_ALERTED, "1", { nx: true, ex: DEGRADED_TTL_S });
      shouldAlert = set !== null;
    } catch {
      shouldAlert = false; // if Redis is down, do not risk flooding the inbox
    }
  }
  if (shouldAlert) {
    sendAdminAlert({
      level: "critical",
      title: "AI provider degraded: every model failed",
      message:
        "callAI() could not get a response from any model in the chain. " +
        "Check https://openrouter.ai/api/v1/models for renamed :free ids and update src/lib/ai-provider.ts " +
        "(runbook: docs/RUNBOOKS/ai-models.md).",
      details: { Error: summary.slice(0, 300), Time: new Date().toISOString() },
      module: "ai-provider",
    }).catch(() => {});
  }
}

async function clearDegraded(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(KEY_DEGRADED);
  } catch {
    /* non-fatal */
  }
}

/** Used by /api/health. Returns null when healthy, else {at, error}. */
export async function getAIDegradedState(): Promise<{ at: string; error: string } | null> {
  if (!redis) return null;
  try {
    const v = await redis.get<{ at: string; error: string }>(KEY_DEGRADED);
    return v ?? null;
  } catch {
    return null;
  }
}

// ── Settings cache (for backward compat with admin panel) ───
let cachedSettings: {
  activeProvider: string;
  geminiModel: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  anthropicSource: string;
  fallbackEnabled: boolean;
  fallbackProvider: string;
  maxTokens: number;
  temperature: number;
} | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

export function invalidateAISettingsCache() {
  cachedSettings = null;
  cacheTs = 0;
}

export function invalidateKeyCache(_provider?: string) {
  // No-op — kept for backward compat with admin API routes
}

export async function getAPIKey(_provider?: string): Promise<string | null> {
  return process.env.OPENROUTER_API_KEY ?? null;
}

const DEFAULT_SETTINGS = {
  activeProvider: "openrouter",
  geminiModel: "gemini-2.5-flash",
  anthropicModel: "claude-sonnet-4",
  anthropicBaseUrl: "https://openrouter.ai/api/v1",
  anthropicSource: "openrouter",
  fallbackEnabled: true,
  fallbackProvider: "gemini",
  maxTokens: 2048,
  temperature: 0.3,
};

async function getSettings() {
  if (cachedSettings && Date.now() - cacheTs < CACHE_TTL) return cachedSettings;
  try {
    const s = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    cachedSettings = {
      ...DEFAULT_SETTINGS,
      geminiModel: s?.geminiModel ?? DEFAULT_SETTINGS.geminiModel,
      anthropicModel: s?.anthropicModel ?? DEFAULT_SETTINGS.anthropicModel,
      fallbackEnabled: s?.fallbackEnabled ?? DEFAULT_SETTINGS.fallbackEnabled,
      fallbackProvider: s?.fallbackProvider ?? DEFAULT_SETTINGS.fallbackProvider,
      maxTokens: s?.maxTokens ?? DEFAULT_SETTINGS.maxTokens,
      temperature: s?.temperature ?? DEFAULT_SETTINGS.temperature,
    };
    cacheTs = Date.now();
    return cachedSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// ── Optional Anthropic provider — used by scripts that prefer the user's
//    own Claude key (set FTP_AI_PROVIDER=anthropic). ANTHROPIC_BASE_URL is
//    honoured automatically by the SDK so Claude Code proxy URLs work.
async function callAnthropic(
  request: AIRequest,
  maxTokens: number,
  temperature: number,
): Promise<{ text: string; usage: TokenUsage | undefined }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  // Lazy import so non-script code paths don't pay the SDK boot cost.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey, baseURL: process.env.ANTHROPIC_BASE_URL });
  const model = request.model ?? "claude-haiku-4-5-20251001";
  const resp = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: request.systemPrompt,
    messages: [{ role: "user", content: request.userPrompt }],
  });
  const text = resp.content
    .map((b) => (b.type === "text" ? (b as { type: "text"; text: string }).text : ""))
    .join("");
  const u = resp.usage;
  return {
    text,
    usage: u
      ? {
          prompt_tokens: u.input_tokens ?? 0,
          completion_tokens: u.output_tokens ?? 0,
          total_tokens: (u.input_tokens ?? 0) + (u.output_tokens ?? 0),
        }
      : undefined,
  };
}

// ── Build the ordered list of models to try for this call ───
/**
 * Chain = [primary, ...free fallbacks, ...paid backstop]
 *   minus models not on OpenRouter's live list (when we know it)
 *   minus models whose circuit breaker is open
 *   capped at MAX_ATTEMPTS_PER_CALL.
 * The primary is kept even if discovery says it is missing when the caller
 * pinned it explicitly via request.model (they may know better, e.g. a
 * brand-new id) — otherwise it is filtered like the rest.
 */
async function buildModelChain(primary: string, pinned: boolean): Promise<string[]> {
  const ordered = [primary, ...FREE_FALLBACK_MODELS.filter((m) => m !== primary), ...getPaidBackstop()];
  // de-dupe while preserving order
  const unique = ordered.filter((m, i) => ordered.indexOf(m) === i);

  const live = await getLiveModelIds();
  const onLiveList = live
    ? unique.filter((m) => live.has(m) || (pinned && m === primary))
    : unique;

  if (live && onLiveList.length < unique.length) {
    const dropped = unique.filter((m) => !onLiveList.includes(m));
    console.warn(`[AI] skipping models not on OpenRouter live list: ${dropped.join(", ")}`);
  }

  const open = await filterOpenCircuits(onLiveList);
  return open.slice(0, MAX_ATTEMPTS_PER_CALL);
}

// ── Main callAI function ────────────────────────────────────
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const s = await getSettings();
  const maxTokens = request.maxTokens ?? s.maxTokens;
  const temp = request.temperature ?? s.temperature;
  const purpose = request.purpose ?? "summarize";
  const primary = request.model ?? getModelForPurpose(purpose);

  const startTime = Date.now();

  // ── Override path: route through the user's own Anthropic key when
  //    requested via env. Used by long-running scripts so OpenRouter
  //    free-tier 429s don't strangle a backfill run.
  if (process.env.FTP_AI_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const anthropicModel = request.model ?? "claude-haiku-4-5-20251001";
    try {
      const { text, usage } = await callAnthropic(request, maxTokens, temp);
      logUsage("anthropic", anthropicModel, purpose, request.district, usage, Date.now() - startTime, true);
      return { text, provider: "anthropic", model: anthropicModel, usedFallback: false };
    } catch (err) {
      console.error("[AI] Anthropic provider failed; falling back to OpenRouter:", err instanceof Error ? err.message : err);
      // fall through to OpenRouter path
    }
  }

  const chain = await buildModelChain(primary, Boolean(request.model));
  const attempts: string[] = []; // human-readable "model (reason)" list for the log row

  if (chain.length === 0) {
    const summary = `No usable model: chain empty (primary ${primary}; all candidates missing or circuit-broken)`;
    console.error(`[AI] ${summary}`);
    logUsage("openrouter", primary, purpose, request.district, undefined, Date.now() - startTime, false, summary);
    await markDegraded(summary);
    throw new Error(summary);
  }

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    if (i > 0) console.log(`[AI] Falling back to ${model}`);
    try {
      const { text, usage } = await callOpenRouter(request, model, maxTokens, temp);

      // Legacy counter kept for the admin panel + clear any stale error on success
      prisma.aIProviderSettings
        .update({
          where: { id: "singleton" },
          data: { totalGeminiCalls: { increment: 1 }, lastError: null, lastErrorAt: null },
        })
        .catch(() => {});

      // One log row for the whole call. If earlier models failed, say so.
      logUsage(
        "openrouter",
        model,
        purpose,
        request.district,
        usage,
        Date.now() - startTime,
        true,
        attempts.length ? `fallback after: ${attempts.join("; ")}` : undefined,
      );
      clearDegraded().catch(() => {});

      return { text, provider: "openrouter", model, usedFallback: i > 0 };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AI] OpenRouter (${model}) failed:`, msg);

      // Classify the failure and open the breaker so the NEXT call skips it.
      if (isModelGone(err)) {
        attempts.push(`${model} (gone)`);
        await tripCircuit(model, "not-found", CB_NOT_FOUND_TTL_S);
      } else if (isRateLimited(err)) {
        attempts.push(`${model} (429)`);
        await tripCircuit(model, "rate-limited", CB_RATE_LIMIT_TTL_S);
      } else {
        attempts.push(`${model} (${msg.slice(0, 80)})`);
        // 5xx / timeout / network: no breaker, just move to the next model.
      }
      // continue to next model
    }
  }

  // ── Total failure ──
  const summary = `All ${chain.length} model(s) failed for purpose "${purpose}": ${attempts.join("; ")}`;
  logUsage("openrouter", primary, purpose, request.district, undefined, Date.now() - startTime, false, summary);
  prisma.aIProviderSettings
    .update({
      where: { id: "singleton" },
      data: { lastError: summary.slice(0, 500), lastErrorAt: new Date() },
    })
    .catch(() => {});
  await markDegraded(summary);
  throw new Error(summary);
}

// ── Robust JSON extractor ───────────────────────────────────
function extractJSON(text: string): unknown {
  try { return JSON.parse(text.trim()); } catch { /* continue */ }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch { /* continue */ }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }
  throw new Error(`Could not parse JSON: ${text.slice(0, 200)}`);
}

// ── Convenience: JSON mode ──────────────────────────────────
export async function callAIJSON<T = unknown>(
  request: AIRequest
): Promise<{ data: T } & AIResponse> {
  const res = await callAI({ ...request, jsonMode: true });
  const data = extractJSON(res.text) as T;
  return { data, ...res };
}
