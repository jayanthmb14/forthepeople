/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Weekly budget data collection
// Schedule: Every Monday at 6 AM UTC (11:30 AM IST)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-budget"
//
// Honesty note (Sept 2026): no state has a district-level expenditure
// dataset on data.gov.in yet (see STATE_BUDGET_RESOURCES in
// src/scraper/jobs/budget.ts — every entry is null). Until one is found,
// this route returns {skipped: true, reason} immediately instead of
// pretending to collect. The cron stays scheduled so the day a resource
// id is added (with the dataset's district and year fields — records of
// other districts or without a year are skipped), collection starts
// without a vercel.json change.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeBudget, hasAnyLiveBudgetSource } from "@/scraper/jobs/budget";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-budget";

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);

  // Nothing to collect yet — say so plainly and count it as a healthy run
  // (the cron did what it could; /api/health must not flag it as stale).
  if (!hasAnyLiveBudgetSource()) {
    const reason =
      "No data.gov.in budget resource id configured for any state (STATE_BUDGET_RESOURCES all null)";
    await cronFinished(CRON_NAME, runStart, { status: "skipped", count: 0, error: reason });
    return NextResponse.json({ ok: true, skipped: true, reason, timestamp: new Date().toISOString() });
  }

  try {
    const activeDistricts = await prisma.district.findMany({
      where: { active: true },
      include: { state: true },
    });

    const results: { district: string; new: number; updated: number; error?: string }[] = [];

    for (const district of activeDistricts) {
      const ctx: JobContext = {
        districtId: district.id,
        districtSlug: district.slug,
        districtName: district.name,
        stateSlug: district.state.slug,
        stateName: district.state.name,
        log: (msg: string) => console.log(`[Budget/${district.slug}] ${msg}`),
      };

      const result = await scrapeBudget(ctx);
      results.push({
        district: district.slug,
        new: result.recordsNew,
        updated: result.recordsUpdated,
        error: result.error,
      });

      // Rate limit: 3 second delay between districts
      await new Promise((r) => setTimeout(r, 3000));
    }

    const totalNew = results.reduce((s, r) => s + r.new, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const total = totalNew + totalUpdated;
    const failures = results.filter((r) => r.error).map((r) => ({ district: r.district, error: r.error }));
    await cronFinished(CRON_NAME, runStart, {
      status: runOutcome({ attempted: results.length, failed: failures.length }),
      count: totalNew,
      updated: totalUpdated,
      failures,
      attempted: results.length,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      districts: results,
      total,
    });
  } catch (err) {
    console.error("[Cron/Budget]", err);
    await cronFinished(CRON_NAME, runStart, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
