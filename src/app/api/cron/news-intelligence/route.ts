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
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runAIAnalyzer } from "@/scraper/jobs/ai-analyzer";
import { alertCronFailed } from "@/lib/admin-alerts";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";

export const runtime = "nodejs";
// The analyzer walks every district's fresh articles through callAI;
// give it the full 5 minutes (it was running on the plan default before).
export const maxDuration = 300;
const CRON_NAME = "news-intelligence";

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  try {
    await runAIAnalyzer();
    await cronFinished(CRON_NAME, runStart, { status: "ok" });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - runStart,
    });
  } catch (err) {
    Sentry.captureException(err);
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/news-intelligence] Error:", err);
    // Previously this only console.error'd — nobody was told. Now it emails
    // the admin (transient network errors are filtered inside alertCronFailed).
    alertCronFailed(CRON_NAME, msg).catch(() => {});
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
