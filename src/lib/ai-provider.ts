/**
 * ForThePeople.in — Unified AI Provider (OpenRouter)
 * Routes to different models based on task purpose.
 * All AI calls in the codebase go through callAI() / callAIJSON().
 *
 * WHAT LIVES WHERE
 *   src/lib/ai-models.ts  — the model list, chain rules, expiry dates, prices (pure)
 *   src/lib/ai-json.ts    — robust JSON extraction from model answers (pure)
 *   this file             — the HTTP call, discovery, circuit breaker, logging
 *
 * HISTORY (why it looks like this)
 *   Aug 2026: every ":free" model we used was retired; every call 404'd for
 *   five weeks and nobody noticed. Sept 2026 rewrite added: live model
 *   discovery, a circuit breaker, one log row per call, real costs, and a
 *   degraded flag for /api/health. The v5 pass (Sept 27) fixed what was
 *   still wrong:
 *   1. CHAIN — new ids (see ai-models.ts). The paid backstop now keeps the
 *      LAST slot; before, the chain was cut to 3 before it was ever reached.
 *   2. JSON MODE — callers that want an object get response_format
 *      json_object; the answer is parsed INSIDE the fallback loop, so a model
 *      that answers with prose, reasoning or broken JSON counts as a failure
 *      and the next model is tried. Empty / reasoning-only answers too.
 *   3. REASONING MODELS — asked for low effort with the reasoning hidden,
 *      plus max_tokens headroom, so the thinking cannot eat the answer.
 *   4. TIME — per-call timeoutMs and an absolute deadlineAt, so a cron can
 *      stop calling models when its own time budget runs out.
 *   5. 402 (out of credit) — breaker for that model + one admin email a day.
 *   6. EXPIRY GUARD — discovery records OpenRouter's expiration_date for our
 *      chain models; /api/health reports degraded 30 days before one expires.
 */

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendAdminAlert } from "@/lib/admin-alerts";
import {
  ALL_CHAIN_MODELS,
  ANTHROPIC_DIRECT_DEFAULT,
  EXPIRY_WARNING_DAYS,
  KNOWN_MODEL_EXPIRY,
  PLAIN_PARAMS_MODELS,
  REASONING_MODELS,
  REASONING_TOKEN_HEADROOM,
  estimateCost as estimateCostPure,
  findExpiringModels,
  getModelForPurpose as getModelForPurposePure,
  planChain,
  selectChain,
  type ExpiringModel,
  type TokenUsage,
} from "@/lib/ai-models";
import { extractJSON, type JSONShape } from "@/lib/ai-json";

// ── Types ───────────────────────────────────────────────────
export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  purpose?: string;
  /** Pin a specific model id (tried first). Normally leave unset. */
  model?: string;
  /** Answer must be JSON. The answer is parsed before a model counts as successful. */
  jsonMode?: boolean;
  /**
   * The JSON shape the caller wants. "object" also sends OpenRouter's
   * response_format json_object (models then MUST answer with an object).
   * "array" / "any" only instruct via the prompt. Default "any".
   */
  jsonShape?: JSONShape;
  maxTokens?: number;
  temperature?: number;
  district?: string;
  /** Per-model-attempt timeout in ms (default 60 s). Crons should pass ~25–45 s. */
  timeoutMs?: number;
  /** Absolute epoch-ms deadline: no model attempt starts after it. */
  deadlineAt?: number;
}

export interface AIResponse {
  text: string;
  provider: string;
  /** The model that actually answered (as reported by OpenRouter). */
  model: string;
  usedFallback: boolean;
  /** Parsed JSON when jsonMode was set. */
  json?: unknown;
}

// ── Re-export kept for /api/health ──────────────────────────
export const getModelForPurpose = getModelForPurposePure;

function paidFallbackEnabled(): boolean {
  return process.env.AI_PAID_FALLBACK === "1";
}

const DEFAULT_TIMEOUT_MS = 60_000;
/** Do not start a model attempt with less time than this before deadlineAt. */
const MIN_ATTEMPT_MS = 5_000;

// ── Redis keys ──────────────────────────────────────────────
const KEY_LIVE_MODELS = "ftp:ai:models"; // cached id list from OpenRouter
const KEY_MODEL_EXPIRY = "ftp:ai:model-expiry"; // {model: "YYYY-MM-DD"} for chain models
const KEY_DEGRADED = "ftp:ai:degraded"; // set on total failure, read by /api/health
const KEY_ALERTED = "ftp:ai:alerted"; // rate-limits the degraded email to 1/day
const KEY_ALERTED_402 = "ftp:ai:alerted:402"; // rate-limits the out-of-credit email
const KEY_ALERTED_EXPIRY = "ftp:ai:alerted:expiry"; // rate-limits the expiry email
const cbKey = (model: string) => `ftp:ai:cb:${model}`; // circuit breaker per model

const LIVE_MODELS_TTL_S = 6 * 60 * 60; // 6 hours
const MODEL_EXPIRY_TTL_S = 3 * 24 * 60 * 60; // 3 days (refreshed on every discovery)
const DEGRADED_TTL_S = 24 * 60 * 60; // 24 hours
const CB_NOT_FOUND_TTL_S = 24 * 60 * 60; // model removed/unavailable -> 24 h
const CB_RATE_LIMIT_TTL_S = 10 * 60; // 429 -> 10 min
const CB_NO_CREDIT_TTL_S = 60 * 60; // 402 -> 1 h

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
    const json = (await res.json()) as { data?: Array<{ id?: string; expiration_date?: string | null }> };
    const rows = json.data ?? [];
    const ids = rows.map((m) => m.id).filter((id): id is string => typeof id === "string");
    if (ids.length === 0) throw new Error("empty model list");

    liveModelsMem = { ids: new Set(ids), fetchedAt: Date.now() };
    if (redis) {
      redis.set(KEY_LIVE_MODELS, ids, { ex: LIVE_MODELS_TTL_S }).catch(() => {});
    }

    // Expiry guard: remember OpenRouter's retirement dates for OUR models.
    const expiry: Record<string, string> = {};
    for (const m of rows) {
      if (m.id && ALL_CHAIN_MODELS.includes(m.id) && typeof m.expiration_date === "string" && m.expiration_date) {
        expiry[m.id] = m.expiration_date.slice(0, 10);
      }
    }
    recordModelExpiry(expiry).catch(() => {});

    return liveModelsMem.ids;
  } catch (err) {
    console.warn("[AI] model discovery failed, using static list:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Model expiry guard ──────────────────────────────────────
async function recordModelExpiry(liveExpiry: Record<string, string>): Promise<void> {
  if (redis) {
    try {
      await redis.set(KEY_MODEL_EXPIRY, liveExpiry, { ex: MODEL_EXPIRY_TTL_S });
    } catch {
      /* non-fatal */
    }
  }
  const expiring = findExpiringModels(ALL_CHAIN_MODELS, { ...KNOWN_MODEL_EXPIRY, ...liveExpiry }, new Date());
  if (expiring.length === 0) return;
  console.warn(
    `[AI] chain models expiring within ${EXPIRY_WARNING_DAYS} days: ` +
      expiring.map((e) => `${e.model} (${e.expiresOn})`).join(", "),
  );
  if (await claimDailyAlert(KEY_ALERTED_EXPIRY)) {
    sendAdminAlert({
      level: "warning",
      title: "AI model retiring soon",
      message:
        "OpenRouter will retire a model our AI chain uses. Replace it in src/lib/ai-models.ts " +
        "before that date (runbook: docs/RUNBOOKS/ai-models.md).",
      details: Object.fromEntries(expiring.map((e) => [e.model, `${e.expiresOn} (${e.daysLeft} days)`])),
      module: "ai-provider",
    }).catch(() => {});
  }
}

/**
 * Used by /api/health: chain models that OpenRouter retires within 30 days
 * (from the static list in ai-models.ts plus the dates seen at discovery).
 */
export async function getModelExpiryWarnings(now: Date = new Date()): Promise<ExpiringModel[]> {
  let live: Record<string, string> = {};
  if (redis) {
    try {
      live = (await redis.get<Record<string, string>>(KEY_MODEL_EXPIRY)) ?? {};
    } catch {
      /* static list only */
    }
  }
  return findExpiringModels(ALL_CHAIN_MODELS, { ...KNOWN_MODEL_EXPIRY, ...live }, now);
}

// ── Circuit breaker ─────────────────────────────────────────
/** The subset of `models` whose circuit breaker is currently open. */
async function getBrokenModels(models: string[]): Promise<Set<string>> {
  if (!redis || models.length === 0) return new Set();
  try {
    const flags = await redis.mget<(string | null)[]>(...models.map(cbKey));
    return new Set(models.filter((_, i) => Boolean(flags[i])));
  } catch {
    return new Set(); // Redis hiccup — try everything rather than nothing
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

/** SET NX guard so an alert is emailed at most once a day. */
async function claimDailyAlert(key: string): Promise<boolean> {
  if (!redis) return true;
  try {
    const set = await redis.set(key, "1", { nx: true, ex: DEGRADED_TTL_S });
    return set !== null;
  } catch {
    return false; // if Redis is down, do not risk flooding the inbox
  }
}

// ── Errors we classify ──────────────────────────────────────
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

/**
 * Thrown when the caller's deadlineAt left no time to try any model. This is
 * the caller running out of its own time budget, NOT the AI being down.
 */
export class AIDeadlineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIDeadlineError";
  }
}

/** The model answered, but with nothing usable (empty, reasoning only, or an error finish). */
class EmptyAnswerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmptyAnswerError";
  }
}

/** Looks like "this model id does not exist / is not served any more". */
function isModelGone(err: unknown): boolean {
  if (!(err instanceof OpenRouterError)) return false;
  if (err.status !== 404 && err.status !== 400) return false;
  if (isParamRejection(err)) return false;
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

/** 400/404 because an optional parameter (response_format, reasoning) is not supported. */
function isParamRejection(err: unknown): boolean {
  if (!(err instanceof OpenRouterError)) return false;
  if (err.status !== 404 && err.status !== 400) return false;
  const b = err.body.toLowerCase();
  return b.includes("parameter") || b.includes("response_format") || b.includes("reasoning");
}

function isRateLimited(err: unknown): boolean {
  return err instanceof OpenRouterError && err.status === 429;
}

function isOutOfCredit(err: unknown): boolean {
  return err instanceof OpenRouterError && err.status === 402;
}

// ── OpenRouter call ─────────────────────────────────────────
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface CallOptions {
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  /** false = retry without response_format / reasoning (a provider rejected them) */
  optionalParams: boolean;
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string" ? (p as { text: string }).text : ""))
      .join("");
  }
  return "";
}

async function callOpenRouter(
  req: AIRequest,
  model: string,
  opts: CallOptions,
): Promise<{ text: string; usage?: TokenUsage; answeredBy: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  let sys = req.systemPrompt;
  if (req.jsonMode) {
    sys += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no preamble, no explanation. Pure JSON only.";
  }

  const reasoning = REASONING_MODELS.has(model);
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: req.userPrompt },
    ],
    max_tokens: opts.maxTokens + (reasoning ? REASONING_TOKEN_HEADROOM : 0),
    temperature: opts.temperature,
  };
  if (opts.optionalParams && !PLAIN_PARAMS_MODELS.has(model)) {
    if (req.jsonMode && req.jsonShape === "object") body.response_format = { type: "json_object" };
    if (reasoning) body.reasoning = { effort: "low", exclude: true };
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://forthepeople.in",
      "X-Title": "ForThePeople.in",
    },
    body: JSON.stringify(body),
    // A hung upstream must not eat a whole cron budget.
    signal: AbortSignal.timeout(opts.timeoutMs),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new OpenRouterError(res.status, errBody);
  }

  const data = (await res.json()) as {
    model?: string;
    usage?: TokenUsage;
    error?: { code?: number; message?: string };
    choices?: Array<{ finish_reason?: string; error?: { message?: string }; message?: { content?: unknown; reasoning?: unknown } }>;
  };

  // OpenRouter can return 200 with an error object (upstream failed mid-stream).
  if (data.error) {
    throw new OpenRouterError(Number(data.error.code) || 502, data.error.message ?? "upstream error");
  }
  const choice = data.choices?.[0];
  if (!choice) throw new EmptyAnswerError("no choices in response");
  if (choice.error || choice.finish_reason === "error") {
    throw new EmptyAnswerError(`finish_reason error: ${choice.error?.message ?? "unknown"}`);
  }

  let text = contentToText(choice.message?.content).trim();
  if (!text) {
    throw new EmptyAnswerError(choice.message?.reasoning ? "reasoning only, no answer" : "empty answer");
  }
  if (req.jsonMode) {
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  }

  return { text, usage: data.usage, answeredBy: typeof data.model === "string" && data.model ? data.model : model };
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
    const cost = estimateCostPure(model, usage);
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

  if (await claimDailyAlert(KEY_ALERTED)) {
    sendAdminAlert({
      level: "critical",
      title: "AI provider degraded: every model failed",
      message:
        "callAI() could not get a usable answer from any model in the chain. " +
        "Check https://openrouter.ai/api/v1/models for renamed ids and update src/lib/ai-models.ts " +
        "(runbook: docs/RUNBOOKS/ai-models.md).",
      details: { Error: summary.slice(0, 300), Time: new Date().toISOString() },
      module: "ai-provider",
    }).catch(() => {});
  }
}

async function alertOutOfCredit(model: string): Promise<void> {
  if (!(await claimDailyAlert(KEY_ALERTED_402))) return;
  sendAdminAlert({
    level: "critical",
    title: "OpenRouter credit is used up (HTTP 402)",
    message:
      "A paid model answered 402 Payment Required, so paid AI calls (insights, paid fallback, fact-checks) fail " +
      "until the OpenRouter balance is topped up. Free models keep working.",
    details: { Model: model, Time: new Date().toISOString() },
    module: "ai-provider",
  }).catch(() => {});
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

// ── Admin-editable defaults (AIProviderSettings row) ────────
// callAI reads only maxTokens and temperature from it (a caller's own
// values win). The row's model fields are shown in the admin panel only;
// model ids live in ai-models.ts.
interface CallDefaults {
  maxTokens: number;
  temperature: number;
}
const DEFAULT_SETTINGS: CallDefaults = { maxTokens: 2048, temperature: 0.3 };
let cachedSettings: CallDefaults | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

export function invalidateAISettingsCache() {
  cachedSettings = null;
  cacheTs = 0;
}

/** Used by /api/admin/ai-settings to say whether a key is set (every provider goes through OpenRouter). */
export async function getAPIKey(_provider?: string): Promise<string | null> {
  return process.env.OPENROUTER_API_KEY ?? null;
}

async function getSettings(): Promise<CallDefaults> {
  if (cachedSettings && Date.now() - cacheTs < CACHE_TTL) return cachedSettings;
  try {
    const s = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    cachedSettings = {
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
//    Never set FTP_AI_PROVIDER in Vercel (see docs/RUNBOOKS/ai-models.md).
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
  const model = request.model ?? ANTHROPIC_DIRECT_DEFAULT;
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
 * Chain = plan from ai-models.ts (tier order, paid slot reserved last)
 *   minus models not on OpenRouter's live list (when we know it)
 *   minus models whose circuit breaker is open
 *   capped at the tier's max attempts.
 */
async function buildModelChain(purpose: string, pinned: string | undefined): Promise<string[]> {
  const plan = planChain(purpose, { paidFallback: paidFallbackEnabled(), pinned });
  const all = [...plan.candidates, ...plan.reserved];

  const live = await getLiveModelIds();
  if (live) {
    const dropped = all.filter((m) => !live.has(m) && m !== pinned);
    if (dropped.length) console.warn(`[AI] skipping models not on OpenRouter live list: ${dropped.join(", ")}`);
  }
  const broken = await getBrokenModels(all);
  return selectChain(plan, { live, broken, pinned });
}

// ── Main callAI function ────────────────────────────────────
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const s = await getSettings();
  const maxTokens = request.maxTokens ?? s.maxTokens;
  const temp = request.temperature ?? s.temperature;
  const purpose = request.purpose ?? "summarize";
  const shape: JSONShape = request.jsonShape ?? "any";

  const startTime = Date.now();

  // ── Override path: route through the user's own Anthropic key when
  //    requested via env. Used by long-running scripts so OpenRouter
  //    free-tier 429s don't strangle a backfill run.
  if (process.env.FTP_AI_PROVIDER === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const anthropicModel = request.model ?? ANTHROPIC_DIRECT_DEFAULT;
    try {
      const { text, usage } = await callAnthropic(request, maxTokens, temp);
      const json = request.jsonMode ? extractJSON(text, shape) : undefined;
      logUsage("anthropic", anthropicModel, purpose, request.district, usage, Date.now() - startTime, true);
      return { text, provider: "anthropic", model: anthropicModel, usedFallback: false, json };
    } catch (err) {
      console.error("[AI] Anthropic provider failed; falling back to OpenRouter:", err instanceof Error ? err.message : err);
      // fall through to OpenRouter path
    }
  }

  const chain = await buildModelChain(purpose, request.model);
  const attempts: string[] = []; // human-readable "model (reason)" list for the log row

  if (chain.length === 0) {
    const summary = `No usable model: chain empty for purpose "${purpose}" (all candidates missing or circuit-broken)`;
    console.error(`[AI] ${summary}`);
    logUsage("openrouter", getModelForPurposePure(purpose), purpose, request.district, undefined, Date.now() - startTime, false, summary);
    await markDegraded(summary);
    throw new Error(summary);
  }

  let deadlineHit = false;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];

    // Respect the caller's absolute deadline (cron time budgets).
    let timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (request.deadlineAt) {
      const left = request.deadlineAt - Date.now();
      if (left < MIN_ATTEMPT_MS) {
        attempts.push(`${model} (skipped: deadline)`);
        deadlineHit = true;
        break;
      }
      timeoutMs = Math.min(timeoutMs, left);
    }

    if (i > 0) console.log(`[AI] Falling back to ${model}`);
    try {
      const callOpts: CallOptions = { maxTokens, temperature: temp, timeoutMs, optionalParams: true };
      let result: Awaited<ReturnType<typeof callOpenRouter>>;
      try {
        result = await callOpenRouter(request, model, callOpts);
      } catch (err) {
        // A provider that rejects response_format / reasoning: retry once plain.
        if (!isParamRejection(err)) throw err;
        console.warn(`[AI] ${model} rejected optional params; retrying without them`);
        result = await callOpenRouter(request, model, { ...callOpts, optionalParams: false });
      }

      // In JSON mode an unparseable answer is a failed attempt, not a success.
      let json: unknown;
      if (request.jsonMode) {
        try {
          json = extractJSON(result.text, shape);
        } catch (parseErr) {
          attempts.push(`${model} (bad JSON)`);
          console.error(`[AI] ${model} returned unusable JSON:`, parseErr instanceof Error ? parseErr.message.slice(0, 160) : parseErr);
          continue;
        }
      }

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
        result.usage,
        Date.now() - startTime,
        true,
        attempts.length ? `fallback after: ${attempts.join("; ")}` : undefined,
      );
      clearDegraded().catch(() => {});

      return { text: result.text, provider: "openrouter", model: result.answeredBy, usedFallback: i > 0, json };
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
      } else if (isOutOfCredit(err)) {
        attempts.push(`${model} (402 no credit)`);
        await tripCircuit(model, "no-credit", CB_NO_CREDIT_TTL_S);
        await alertOutOfCredit(model);
      } else if (err instanceof EmptyAnswerError) {
        attempts.push(`${model} (${msg.slice(0, 60)})`);
      } else {
        attempts.push(`${model} (${msg.slice(0, 80)})`);
        // 5xx / timeout / network: no breaker, just move to the next model.
      }
    }
  }

  // ── Total failure ──
  const triedAny = attempts.some((a) => !a.endsWith("(skipped: deadline)"));
  if (deadlineHit && !triedAny) {
    // Nothing was actually tried: no log row, no degraded flag.
    throw new AIDeadlineError(`No time left in the caller's budget for purpose "${purpose}"`);
  }
  const summary = `All ${chain.length} model(s) failed for purpose "${purpose}": ${attempts.join("; ")}`;
  logUsage("openrouter", chain[0], purpose, request.district, undefined, Date.now() - startTime, false, summary);
  prisma.aIProviderSettings
    .update({
      where: { id: "singleton" },
      data: { lastError: summary.slice(0, 500), lastErrorAt: new Date() },
    })
    .catch(() => {});
  // Running out of the caller's time budget is not the AI being down.
  if (!deadlineHit) await markDegraded(summary);
  throw new Error(summary);
}

// ── Convenience: JSON mode ──────────────────────────────────
/**
 * callAI with jsonMode on; `data` is the parsed answer. The answer is parsed
 * inside the fallback loop, so a model that returns prose or broken JSON is
 * skipped and the next model is tried. Throws when no model gives usable JSON.
 * Pass jsonShape "object" to also request OpenRouter's JSON mode.
 */
export async function callAIJSON<T = unknown>(request: AIRequest): Promise<{ data: T } & AIResponse> {
  // In JSON mode both paths (OpenRouter, direct Anthropic) parse the answer
  // before they return, so `json` is always set here.
  const res = await callAI({ ...request, jsonMode: true });
  return { data: res.json as T, ...res };
}
