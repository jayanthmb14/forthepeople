/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Crop prices collector — runs daily 9AM IST (3:30 UTC)
// AGMARKNET / data.gov.in API
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-crops"
//
// Sept 2026 fix (audit 3.8): this cron hit Vercel's 300 s limit on every
// run since June and wrote nothing. Three causes, all fixed:
//   1. the data.gov.in fetch had no timeout  -> crops.ts now aborts at 20 s
//   2. one findFirst + create per record     -> one findMany + createMany
//   3. per-district logs were collected into an array and never printed
//      -> printed below, plus per-district duration
// On top of that this route keeps a 250 s overall budget: if the remaining
// districts would not fit, it stops cleanly and reports partial: true
// instead of being killed mid-write.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { scrapeCrops } from "@/scraper/jobs/crops";
import { alertCronFailed } from "@/lib/admin-alerts";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 300;
const CRON_NAME = "scrape-crops";

// Stop starting new districts after this much wall-clock time, leaving
// ~50 s of headroom under maxDuration for the last district + response.
const TIME_BUDGET_MS = 250_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);

  const activeDistricts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const results: Array<{
    district: string;
    success: boolean;
    newCount: number;
    durationMs: number;
    error?: string;
  }> = [];
  let partial = false;

  for (const row of activeDistricts) {
    // ── Budget guard: exit cleanly rather than being killed at 300 s ──
    const elapsed = Date.now() - runStart;
    if (elapsed > TIME_BUDGET_MS) {
      partial = true;
      console.warn(
        `[scrape-crops] time budget exhausted after ${Math.round(elapsed / 1000)}s — ` +
          `${activeDistricts.length - results.length} district(s) left for the next run`,
      );
      break;
    }

    const state = row.state;
    if (!state) {
      results.push({ district: row.slug, success: false, newCount: 0, durationMs: 0, error: "Missing state relation" });
      continue;
    }

    const logs: string[] = [];
    const ctx: JobContext = {
      districtSlug: row.slug,
      districtId: row.id,
      districtName: row.name,
      stateSlug: state.slug,
      stateName: state.name,
      log: (msg) => logs.push(msg),
    };

    const districtStart = Date.now();
    try {
      const result = await scrapeCrops(ctx);
      const durationMs = Date.now() - districtStart;
      results.push({ district: row.slug, success: result.success, newCount: result.recordsNew, durationMs, error: result.error });
      // Print what the job told us — these used to be silently dropped.
      console.log(`[scrape-crops/${row.slug}] ${durationMs}ms, ${result.recordsNew} new | ${logs.join(" | ")}`);
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : String(err);
      alertCronFailed(CRON_NAME, msg).catch(() => {});
      results.push({ district: row.slug, success: false, newCount: 0, durationMs: Date.now() - districtStart, error: msg });
      console.error(`[scrape-crops/${row.slug}] threw: ${msg} | ${logs.join(" | ")}`);
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const failures = results.filter((r) => !r.success).map((r) => ({ district: r.district, error: r.error }));
  const outcome = runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
  const allFailed = outcome === "error";

  await cronFinished(CRON_NAME, runStart, {
    status: outcome,
    count: totalNew,
    failures,
    attempted: results.length,
  });

  return NextResponse.json({
    ok: !allFailed,
    partial,
    districts: results.length,
    totalNewRecords: totalNew,
    durationMs: Date.now() - runStart,
    results,
  });
}
