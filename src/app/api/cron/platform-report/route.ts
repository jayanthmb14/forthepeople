/**
 * ForThePeople.in — Weekly platform report cron
 * GET /api/cron/platform-report
 * Schedule: Sundays 00:00 UTC — "0 0 * * 0" in vercel.json
 *   (Sept 2026: the route existed but was never scheduled; CLAUDE.md said
 *    "weekly", so it is now actually in vercel.json.)
 * Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
 * Run state: Redis "ftp:cron:platform-report"
 *
 * Time (Sept 2026 fix): one "insight" AI call walks 2 paid models then the
 * free chain, 60 s per model by default. With maxDuration 60 a slow first
 * model got the function killed before cronFinished, leaving the run
 * "running" and no report. Now 300 s, and no model attempt starts after
 * 240 s.
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePlatformReport } from "@/lib/platform-analysis";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "platform-report";
/** No AI model attempt starts after this. */
const BUDGET_MS = 240_000;

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  try {
    const report = await generatePlatformReport("weekly", { deadlineAt: runStart + BUDGET_MS });
    await cronFinished(CRON_NAME, runStart, { status: "ok", count: 1 });
    return NextResponse.json({
      ok: true,
      reportId: report.id,
      aiModel: report.aiModel,
      aiCostUSD: report.aiCostUSD,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await cronFinished(CRON_NAME, runStart, { status: "error", error: msg });
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
