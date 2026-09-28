/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: District health scores — weekly
// GET /api/cron/health-score        schedule "30 1 * * 0" (vercel.json)
//   (Sundays 01:30 UTC = 07:00 IST)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:health-score" + one ScraperLog row
//
// WHY (Sept 2026): the score shown on each district overview is stored
// with a 7-day expiry, but only scripts/calculate-health-scores.ts ever
// wrote it, so every score had expired (last computed 24 Apr). This cron
// recomputes every active district with calculateDistrictHealthScore()
// (src/lib/health-score.ts), which now also records how many of the
// sub-measures were backed by data (breakdown.dataCoverage).
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { redis } from "@/lib/redis";
import { calculateDistrictHealthScore } from "@/lib/health-score";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import { listActiveDistricts } from "@/scraper/lib/cron-districts";
import { withCronErrors } from "@/scraper/lib/cron-run";

export const runtime = "nodejs";
export const maxDuration = 120;
const CRON_NAME = "health-score";
const TIME_BUDGET_MS = 100_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);
  return withCronErrors(CRON_NAME, runStart, () => scoreAll(runStart));
}

/** Everything after cronStarted(); a throw is recorded by withCronErrors. */
async function scoreAll(runStart: number): Promise<Response> {
  const districts = await listActiveDistricts();

  const results: Array<{
    district: string;
    success: boolean;
    score?: number;
    grade?: string;
    measured?: number;
    total?: number;
    error?: string;
  }> = [];
  let partial = false;

  for (const d of districts) {
    if (Date.now() - runStart > TIME_BUDGET_MS) {
      partial = true;
      console.warn(`[health-score] time budget exhausted; ${districts.length - results.length} district(s) left`);
      break;
    }
    try {
      const s = await calculateDistrictHealthScore(d.id);
      results.push({ district: d.slug, success: true, score: s.overallScore, grade: s.grade, measured: s.measured, total: s.total });
      if (redis) await redis.del(`ftp:health-score:${d.slug}`).catch(() => {});
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ district: d.slug, success: false, error: msg });
      console.error(`[health-score/${d.slug}] ${msg}`);
    }
  }

  const failures = results.filter((r) => !r.success).map((r) => ({ district: r.district, error: r.error }));
  const outcome = runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
  await cronFinished(CRON_NAME, runStart, {
    status: outcome,
    count: 0,
    updated: results.filter((r) => r.success).length,
    failures,
    attempted: results.length,
  });

  return NextResponse.json({
    ok: outcome !== "error",
    partial,
    districts: results.length,
    durationMs: Date.now() - runStart,
    results,
  });
}
