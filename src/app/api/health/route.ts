/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/health          -> always HTTP 200, "status" field says the truth
// GET /api/health?strict=1 -> HTTP 503 when degraded (for uptime monitors)
//
// Sept 2026 rewrite (audit item 3.15). The old version reported "healthy"
// through a 35-day AI outage and a 13-day deploy block because it only
// checked that a settings row existed and which env vars were set. It also
// leaked which secrets were configured. This version:
//   - reads every cron's last run from Redis ("ftp:cron:<name>", written by
//     src/lib/cron-auth.ts) and compares it with the schedule in vercel.json:
//     a cron with no successful run inside 2× its interval is "stale"
//   - reads "ftp:ai:degraded" (set by src/lib/ai-provider.ts on total failure)
//   - says NOTHING about which secrets exist
// v5 additions (Sept 2026 audit: health said "AI ✅ ok" through the whole
// outage because the flag above was never set in production):
//   - degraded when the last SUCCESSFUL AI call (AIUsageLog) is > 24 h old
//   - degraded when any scheduled cron has no run recorded at all
//   - degraded when a model in the AI chain is retired by OpenRouter within
//     30 days (src/lib/ai-models.ts + dates seen at model discovery)
// Response shape keeps the { status, timestamp, checks, meta } envelope.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCronRun, cronIntervalMinutes, type CronRunRecord } from "@/lib/cron-auth";
import { getAIDegradedState, getModelExpiryWarnings, getModelForPurpose } from "@/lib/ai-provider";
import vercelConfig from "../../../../vercel.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_ALERT_DAYS = 14;
/** The AI layer is "stale" when nothing succeeded for this long. */
const AI_SUCCESS_MAX_AGE_H = 24;

type CronHealth = {
  name: string;
  path: string;
  schedule: string;
  intervalMinutes: number;
  /** "ok" = succeeded inside 2× interval; "stale" = not; "unknown" = never recorded */
  status: "ok" | "stale" | "unknown";
  lastSuccessAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastCount: number | null;
  ageMinutes: number | null;
};

function assessCron(path: string, schedule: string, rec: CronRunRecord | null): CronHealth {
  const name = path.replace(/^\/api\/cron\//, "");
  const intervalMinutes = cronIntervalMinutes(schedule);
  const base: CronHealth = {
    name,
    path,
    schedule,
    intervalMinutes,
    status: "unknown",
    lastSuccessAt: rec?.lastSuccessAt ?? null,
    lastRunAt: rec?.finishedAt ?? rec?.startedAt ?? null,
    lastStatus: rec?.status ?? null,
    lastError: rec?.error || null,
    lastCount: rec?.count ?? null,
    ageMinutes: null,
  };
  if (!rec) return base;

  // Age is measured from the last SUCCESS. A cron that keeps erroring has
  // an ever-growing age even though it "ran", which is the point.
  const anchor = rec.lastSuccessAt ?? rec.startedAt;
  if (!anchor) return base;
  const ageMinutes = Math.round((Date.now() - new Date(anchor).getTime()) / 60_000);
  base.ageMinutes = ageMinutes;
  const withinWindow = ageMinutes <= intervalMinutes * 2;
  base.status = rec.lastSuccessAt && withinWindow ? "ok" : "stale";
  return base;
}

export async function GET(req: NextRequest) {
  const strict = req.nextUrl.searchParams.get("strict") === "1";
  const checks: Record<string, string> = {};
  const meta: Record<string, unknown> = {};
  const problems: string[] = [];

  // ── Database ──
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "✅ Connected";
    meta.database = { responseMs: Date.now() - t0 };
  } catch (e) {
    checks.database = "❌ " + (e instanceof Error ? e.message : "Failed");
    problems.push("database");
  }

  // ── Crons: every entry in vercel.json vs its last recorded run ──
  const crons = (vercelConfig as { crons?: Array<{ path: string; schedule: string }> }).crons ?? [];
  const cronHealth = await Promise.all(
    crons.map(async (c) => assessCron(c.path, c.schedule, await getCronRun(c.path.replace(/^\/api\/cron\//, "")))),
  );
  const staleCrons = cronHealth.filter((c) => c.status === "stale").map((c) => c.name);
  const unknownCrons = cronHealth.filter((c) => c.status === "unknown").map((c) => c.name);
  if (staleCrons.length > 0 || unknownCrons.length > 0) {
    // A cron with no recorded run is not "fine": we cannot show it ever worked.
    const parts: string[] = [];
    if (staleCrons.length > 0) parts.push(`${staleCrons.length} stale: ${staleCrons.join(", ")}`);
    if (unknownCrons.length > 0) parts.push(`${unknownCrons.length} never recorded: ${unknownCrons.join(", ")}`);
    checks.crons = `❌ ${parts.join("; ")}`;
    problems.push("crons");
  } else {
    checks.crons = `✅ ${cronHealth.length}/${cronHealth.length} crons ran on schedule`;
  }
  meta.crons = cronHealth;
  meta.staleCrons = staleCrons;
  meta.unknownCrons = unknownCrons;

  // ── AI: (1) flag set by ai-provider when every model fails, and
  //        (2) the last SUCCESSFUL call recorded in AIUsageLog ──
  const aiDegraded = await getAIDegradedState();
  let lastAISuccess: { createdAt: Date; model: string; purpose: string } | null = null;
  let aiLogReadable = true;
  try {
    lastAISuccess = await prisma.aIUsageLog.findFirst({
      // Bounded so a long outage does not scan the whole table.
      where: { success: true, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, model: true, purpose: true },
    });
  } catch {
    aiLogReadable = false;
  }
  const lastSuccessAgeH = lastAISuccess ? (Date.now() - lastAISuccess.createdAt.getTime()) / 3_600_000 : null;
  const aiStale = aiLogReadable && (lastSuccessAgeH === null || lastSuccessAgeH > AI_SUCCESS_MAX_AGE_H);

  if (aiDegraded) {
    checks.ai = `❌ degraded since ${aiDegraded.at}`;
    problems.push("ai");
  } else if (aiStale) {
    checks.ai = lastAISuccess
      ? `❌ no successful AI call for ${Math.round(lastSuccessAgeH ?? 0)} h (last ${lastAISuccess.createdAt.toISOString()})`
      : "❌ no successful AI call in the last 30 days";
    problems.push("ai");
  } else if (!aiLogReadable) {
    checks.ai = "⚠️ AI usage log unavailable";
  } else {
    checks.ai = `✅ ok (last success ${Math.round((lastSuccessAgeH ?? 0) * 10) / 10} h ago)`;
  }
  meta.ai = {
    status: aiDegraded || aiStale ? "degraded" : "ok",
    ...(aiDegraded ? { since: aiDegraded.at, error: aiDegraded.error } : {}),
    lastSuccessAt: lastAISuccess?.createdAt.toISOString() ?? null,
    lastSuccessModel: lastAISuccess?.model ?? null,
    lastSuccessPurpose: lastAISuccess?.purpose ?? null,
    maxAgeHours: AI_SUCCESS_MAX_AGE_H,
  };

  // ── AI model expiry guard: a chain model retires within 30 days ──
  const expiring = await getModelExpiryWarnings().catch(() => []);
  if (expiring.length > 0) {
    checks.aiModels = `❌ ${expiring.map((e) => `${e.model} retires ${e.expiresOn} (${e.daysLeft} d)`).join("; ")}`;
    problems.push("ai-models");
  } else {
    checks.aiModels = "✅ no chain model retiring within 30 days";
  }
  meta.aiModelExpiry = expiring;

  // ── AI provider label (routing only — never which keys exist) ──
  checks.aiProvider = `✅ openrouter (tier1 ${getModelForPurpose("classify")} · insight ${getModelForPurpose("insight")} · fact-check ${getModelForPurpose("fact-check")})`;
  meta.aiProvider = {
    source: "openrouter",
    tier1: getModelForPurpose("classify"),
    insight: getModelForPurpose("insight"),
    documentLarge: getModelForPurpose("document-large"),
    factCheck: getModelForPurpose("fact-check"),
    paidFallback: process.env.AI_PAID_FALLBACK === "1",
  };

  // ── Last fact check ──
  try {
    const lastFC = await prisma.factCheck.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true, issuesFound: true },
    });
    if (lastFC) {
      checks.lastFactCheck = `✅ ${lastFC.createdAt.toISOString().split("T")[0]} — ${lastFC.status} (${lastFC.issuesFound} issues)`;
      meta.lastFactCheck = { date: lastFC.createdAt.toISOString(), status: lastFC.status, issuesFound: lastFC.issuesFound };
    } else {
      checks.lastFactCheck = "⚠️ Never run";
    }
  } catch {
    checks.lastFactCheck = "⚠️ Unavailable";
  }

  // ── Active + stale alert counts ──
  try {
    const staleDate = new Date(Date.now() - STALE_ALERT_DAYS * 86_400_000);
    const [activeAlerts, staleAlerts] = await Promise.all([
      prisma.localAlert.count({ where: { active: true } }),
      prisma.localAlert.count({ where: { active: true, createdAt: { lt: staleDate } } }),
    ]);
    checks.alerts = staleAlerts > 0
      ? `⚠️ ${activeAlerts} active (${staleAlerts} stale >14d)`
      : `✅ ${activeAlerts} active alerts`;
    meta.alerts = { active: activeAlerts, stale: staleAlerts };
  } catch {
    checks.alerts = "⚠️ Unavailable";
  }

  const status = problems.length === 0 ? "healthy" : "degraded";
  const body = {
    status,
    timestamp: new Date().toISOString(),
    problems,
    checks,
    meta,
  };

  return NextResponse.json(body, {
    status: strict && status !== "healthy" ? 503 : 200,
    // Monitors must always see the live answer, never a CDN copy.
    headers: { "Cache-Control": "private, no-store" },
  });
}
