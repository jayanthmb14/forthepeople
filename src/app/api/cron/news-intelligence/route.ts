/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Cron: AI News Intelligence
// GET /api/cron/news-intelligence
// Schedule: every 4 hours (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:news-intelligence"
//
// The analyzer stops starting new districts after 240 s, so the run always
// ends (and records its result) before Vercel's 300 s kill. When every AI
// call in a run failed, the run is recorded as an ERROR (it used to say
// "ok" through a five-week AI outage) and the admin is emailed.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runAIAnalyzer } from "@/scraper/jobs/ai-analyzer";
import { alertCronFailed } from "@/lib/admin-alerts";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "news-intelligence";
const BUDGET_MS = 240_000;

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  try {
    const stats = await runAIAnalyzer({ budgetMs: BUDGET_MS - (Date.now() - runStart) });

    const allFailed = stats.aiCalls > 0 && stats.aiFailures === stats.aiCalls;
    const error = allFailed ? `all ${stats.aiCalls} AI call(s) failed. ${stats.errors[0] ?? ""}`.trim() : undefined;
    await cronFinished(CRON_NAME, runStart, {
      status: allFailed ? "error" : "ok",
      count: stats.insightsSaved,
      error,
    });
    if (allFailed && error) alertCronFailed(CRON_NAME, error).catch(() => {});

    return NextResponse.json(
      {
        ...stats,
        success: !allFailed,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - runStart,
      },
      { status: allFailed ? 502 : 200 },
    );
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/news-intelligence] Error:", err);
    alertCronFailed(CRON_NAME, msg).catch(() => {});
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
