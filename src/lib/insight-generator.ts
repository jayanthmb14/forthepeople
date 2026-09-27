/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Insight Generator — uses callAIJSON (purpose "insight" = Tier 2,
// see src/lib/ai-models.ts)
//
// v5: a module whose data is empty (or whose data could not be read) is
// skipped — no AI call, nothing written — instead of asking a paid model to
// judge nothing. A failed AI call is logged with its message and writes
// nothing (the previous insight stays until it expires).
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { callAIJSON } from "@/lib/ai-provider";
import { ModuleInsightConfig, getTtlMs } from "./insight-config";
import { isEmptyModuleData } from "./insight-data";

type Severity = "good" | "watch" | "alert" | "critical";

interface GeneratedInsight {
  severity: Severity;
  opinion: string;
  recommendation: string;
  aiProvider: string;
  aiModel: string;
}

// ── Fetch module data from our own API ────────────────────
/** ok=false when the data API could not be read; data is the payload's "data". */
async function fetchModuleData(
  module: string,
  districtSlug: string,
  stateSlug: string
): Promise<{ ok: boolean; data: unknown; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";
    const url = `${baseUrl}/api/data/${module}?district=${districtSlug}&state=${stateSlug}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ForThePeople-InsightBot/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, data: null, error: `data API HTTP ${res.status}` };
    const json = (await res.json()) as unknown;
    // The data API answers { data, meta }; an unknown module gives data: null.
    const data = json && typeof json === "object" && "data" in json ? (json as { data: unknown }).data : json;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Build system + user prompts ───────────────────────────
function buildPrompts(
  config: ModuleInsightConfig,
  districtName: string,
  stateName: string,
  data: unknown
): { systemPrompt: string; userPrompt: string } {
  const snippet = JSON.stringify(data, null, 2).slice(0, 3000);

  const systemPrompt = `You are a civic data analyst for ForThePeople.in — India's citizen transparency platform.
Your role: Analyse government data and provide clear, actionable assessments for ordinary citizens.
Always respond ONLY with valid JSON in the exact schema requested. No markdown, no explanation.`;

  const userPrompt = `Analyse the following ${config.label} data for ${districtName}, ${stateName}.
Focus: ${config.promptHint}

Data:
${snippet}

Return a JSON object with exactly these three fields:
- severity: one of "good", "watch", "alert", or "critical"
- opinion: 2-3 sentence plain English assessment for citizens
- recommendation: 1-2 concrete actions citizens or officials should take

Severity meaning:
- good: metrics are healthy, no immediate concerns
- watch: minor issues worth monitoring
- alert: significant problems needing attention soon
- critical: urgent action required immediately`;

  return { systemPrompt, userPrompt };
}

// ── Generate and persist one insight ─────────────────────
export type InsightOutcome =
  | { status: "ok"; model: string }
  | { status: "empty"; reason: string }
  | { status: "error"; error: string };

/**
 * Generate one module insight and store it.
 *   "ok"    written
 *   "empty" skipped: no data for this module (or the data API failed) — no AI call
 *   "error" the AI call failed or gave a half answer — nothing written
 */
export async function generateInsightDetailed(
  config: ModuleInsightConfig,
  districtId: string,
  districtSlug: string,
  districtName: string,
  stateSlug: string,
  stateName: string,
  opts: { deadlineAt?: number } = {},
): Promise<InsightOutcome> {
  const fetched = await fetchModuleData(config.module, districtSlug, stateSlug);
  if (!fetched.ok) return { status: "empty", reason: fetched.error ?? "data API failed" };
  if (isEmptyModuleData(fetched.data)) return { status: "empty", reason: "no data for this module" };

  try {
    const { systemPrompt, userPrompt } = buildPrompts(config, districtName, stateName, fetched.data);

    // The answer is parsed inside callAIJSON, so prose or broken JSON moves
    // to the next model instead of failing here.
    const { data: parsed, ...response } = await callAIJSON<{ severity?: unknown; opinion?: unknown; recommendation?: unknown }>({
      systemPrompt,
      userPrompt,
      purpose: "insight",
      jsonShape: "object",
      maxTokens: 2048,
      temperature: 0.3,
      district: districtSlug,
      timeoutMs: 45_000,
      deadlineAt: opts.deadlineAt,
    });

    // Both texts are shown to citizens: a half answer is not written.
    const opinion = typeof parsed.opinion === "string" ? parsed.opinion.trim() : "";
    const recommendation = typeof parsed.recommendation === "string" ? parsed.recommendation.trim() : "";
    if (!opinion || !recommendation) {
      return { status: "error", error: `${response.model} answered without an opinion or recommendation` };
    }
    const severity: Severity =
      parsed.severity === "good" || parsed.severity === "watch" || parsed.severity === "alert" || parsed.severity === "critical"
        ? parsed.severity
        : "watch";

    const result: GeneratedInsight = {
      severity,
      opinion,
      recommendation,
      aiProvider: response.provider,
      aiModel: response.model,
    };

    const expiresAt = new Date(Date.now() + getTtlMs(config));

    await prisma.aIModuleInsight.upsert({
      where: { districtId_module: { districtId, module: config.module } },
      update: {
        severity: result.severity,
        opinion: result.opinion,
        recommendation: result.recommendation,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        expiresAt,
        generatedAt: new Date(),
      },
      create: {
        districtId,
        module: config.module,
        severity: result.severity,
        opinion: result.opinion,
        recommendation: result.recommendation,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        expiresAt,
      },
    });

    return { status: "ok", model: result.aiModel };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[insights] ${config.module}/${districtSlug} failed:`, error.slice(0, 300));
    return { status: "error", error };
  }
}

/** Boolean wrapper kept for scripts and the admin "run" button: true = written. */
export async function generateInsight(
  config: ModuleInsightConfig,
  districtId: string,
  districtSlug: string,
  districtName: string,
  stateSlug: string,
  stateName: string
): Promise<boolean> {
  const outcome = await generateInsightDetailed(config, districtId, districtSlug, districtName, stateSlug, stateName);
  return outcome.status === "ok";
}

// ── Fetch insight for a module (from DB) ─────────────────
export async function getStoredInsight(districtId: string, module: string) {
  return prisma.aIModuleInsight.findUnique({
    where: { districtId_module: { districtId, module } },
  });
}

// ── Check if insight needs regeneration ──────────────────
export function isExpired(expiresAt: Date): boolean {
  return new Date() >= expiresAt;
}

// ── Data-change detection ─────────────────────────────────
// Before regenerating an insight, check whether the underlying source data
// changed since the last insight was written. Static modules (leaders, budget,
// schools) rarely change after seeding, so this check skips ~60-70% of AI
// calls per generate-insights cron run.
//
// Returns true if there is new/updated data OR the insight is older than the
// per-module staleness ceiling (14 days for static modules). On any error we
// return true — fail-open so we never silently stop regenerating.
const STATIC_MODULE_CEILING_MS = 14 * 24 * 60 * 60 * 1000;

export async function hasDataChanged(districtId: string, module: string): Promise<boolean> {
  try {
    const lastInsight = await prisma.aIModuleInsight.findFirst({
      where: { districtId, module },
      orderBy: { generatedAt: "desc" },
      select: { generatedAt: true },
    });
    if (!lastInsight) return true;

    const since = lastInsight.generatedAt;
    const ageMs = Date.now() - since.getTime();

    switch (module) {
      case "weather":
        return !!(await prisma.weatherReading.findFirst({
          where: { districtId, recordedAt: { gt: since } },
          select: { id: true },
        }));
      case "crops":
        return !!(await prisma.cropPrice.findFirst({
          where: { districtId, date: { gt: since } },
          select: { id: true },
        }));
      case "water":
        return !!(await prisma.damReading.findFirst({
          where: { districtId, recordedAt: { gt: since } },
          select: { id: true },
        }));
      case "news":
      case "alerts":
        return !!(await prisma.newsItem.findFirst({
          where: { districtId, publishedAt: { gt: since } },
          select: { id: true },
        }));
      case "power":
        return !!(await prisma.powerOutage.findFirst({
          where: { districtId, createdAt: { gt: since } },
          select: { id: true },
        }));
      case "infrastructure":
        return !!(await prisma.infraProject.findFirst({
          where: { districtId, updatedAt: { gt: since } },
          select: { id: true },
        }));
      case "leaders":
        // Leader has no updatedAt — fall back to ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "police":
        // PoliceStation has no updatedAt — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "education":
        // School has no timestamp field we can use — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "budget":
        // BudgetEntry has no updatedAt — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "elections":
        // ElectionResult — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "schemes":
        // Scheme has no timestamp field — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "courts":
        // CourtStat — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "industries":
        // LocalIndustry — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      case "famous-personalities":
        // FamousPersonality — ceiling.
        return ageMs > STATIC_MODULE_CEILING_MS;
      default:
        // Unknown module — fall back to time-based ceiling so we don't freeze
        // insights forever.
        return ageMs > STATIC_MODULE_CEILING_MS;
    }
  } catch (err) {
    console.warn("[insights] hasDataChanged error — fail open:", err);
    return true;
  }
}
