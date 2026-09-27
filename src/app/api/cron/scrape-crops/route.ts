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
//
// Sept 2026 (v5): the job gets the budget's deadline so it never starts a
// request it cannot finish; the district order rotates daily so a budget
// cut-off does not always hit the same districts; and when data.gov.in is
// down for the first two districts in a row the run stops early instead
// of spending four minutes on timeouts.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { collectCrops } from "@/scraper/jobs/crops";
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

  const sorted = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });
  // Rotate the starting district by day so a budget cut-off moves around.
  const shift = sorted.length > 0 ? Math.floor(runStart / 86_400_000) % sorted.length : 0;
  const activeDistricts = [...sorted.slice(shift), ...sorted.slice(0, shift)];
  const deadlineMs = runStart + TIME_BUDGET_MS;
  let sourceDownStreak = 0;
  let sourceDownStop = false;

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
      const result = await collectCrops(ctx, { deadlineMs });
      const durationMs = Date.now() - districtStart;
      results.push({ district: row.slug, success: result.success, newCount: result.recordsNew, durationMs, error: result.error });
      // Print what the job told us — these used to be silently dropped.
      console.log(`[scrape-crops/${row.slug}] ${durationMs}ms, ${result.recordsNew} new | ${logs.join(" | ")}`);

      // Circuit breaker: data.gov.in down for the first two districts → stop.
      sourceDownStreak = result.sourceDown ? sourceDownStreak + 1 : 0;
      if (sourceDownStreak >= 2 && results.every((r) => !r.success)) {
        sourceDownStop = true;
        console.warn(`[scrape-crops] data.gov.in is not answering; stopping after ${results.length} district(s)`);
        break;
      }
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
  const outcome = sourceDownStop
    ? "error"
    : runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
  const allFailed = outcome === "error";

  await cronFinished(CRON_NAME, runStart, {
    status: outcome,
    count: totalNew,
    failures,
    attempted: results.length,
    error: sourceDownStop
      ? `data.gov.in AGMARKNET not answering (${failures[0]?.error ?? "no answer"}); stopped after ${results.length} of ${activeDistricts.length} districts`
      : undefined,
  });

  return NextResponse.json({
    ok: !allFailed,
    partial,
    sourceDown: sourceDownStop,
    districts: results.length,
    totalNewRecords: totalNew,
    durationMs: Date.now() - runStart,
    results,
  });
}
