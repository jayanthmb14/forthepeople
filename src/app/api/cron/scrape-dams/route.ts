/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Dam / reservoir levels — every 6 hours
// GET /api/cron/scrape-dams        schedule "0 */6 * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-dams"
//
// WHY (Sept 2026 audit, item 3.7): dam readings last updated in March,
// because the job only ran in the expired Railway container. Today the
// only live source is the Karnataka Water Resources portal (see
// src/scraper/jobs/dams.ts); districts without a dam config are skipped
// by the job itself, so it is safe to loop every active district.
//
// Sept 2026 (v5): only districts with a live feed are run (hasLiveDamSource);
// the rest are listed as "notCovered" in the response instead of being
// counted as successful runs. Revised same-day readings count as updates.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { dropModuleCaches } from "@/lib/cache";
import { hasLiveDamSource, scrapeDams } from "@/scraper/jobs/dams";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import { runOutcome } from "@/scraper/lib/run-log";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 120;
const CRON_NAME = "scrape-dams";

// Sequential on purpose: every Karnataka district downloads the same
// portal payload, and the portal is fragile — do not hammer it in parallel.
const TIME_BUDGET_MS = 100_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);

  const active = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const districts = active.filter((d) => hasLiveDamSource(d.state?.slug ?? "", d.slug));
  const notCovered = active.filter((d) => !districts.includes(d)).map((d) => d.slug);

  const results: Array<{ district: string; success: boolean; newCount: number; updatedCount: number; error?: string }> = [];
  let partial = false;

  for (const d of districts) {
    if (Date.now() - runStart > TIME_BUDGET_MS) {
      partial = true;
      console.warn(`[scrape-dams] time budget exhausted; ${districts.length - results.length} district(s) left`);
      break;
    }

    const logs: string[] = [];
    const ctx: JobContext = {
      districtId: d.id,
      districtSlug: d.slug,
      districtName: d.name,
      stateSlug: d.state?.slug ?? "karnataka",
      stateName: d.state?.name ?? "Karnataka",
      log: (msg) => logs.push(msg),
    };

    try {
      const result = await scrapeDams(ctx);
      results.push({
        district: d.slug,
        success: result.success,
        newCount: result.recordsNew,
        updatedCount: result.recordsUpdated,
        error: result.error,
      });
      console.log(`[scrape-dams/${d.slug}] ${result.success ? "ok" : "fail"}, ${result.recordsNew} new, ${result.recordsUpdated} revised | ${logs.join(" | ")}`);
      // The data route caches dam levels under "water" (nothing writes a "dam" key).
      if (result.success && result.recordsNew + result.recordsUpdated > 0) {
        await dropModuleCaches(d.slug, ["water"]);
      }
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ district: d.slug, success: false, newCount: 0, updatedCount: 0, error: msg });
      console.error(`[scrape-dams/${d.slug}] threw: ${msg}`);
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const totalUpdated = results.reduce((s, r) => s + r.updatedCount, 0);
  const failures = results.filter((r) => !r.success).map((r) => ({ district: r.district, error: r.error }));
  const outcome = runOutcome({ attempted: results.length, failed: failures.length, budgetExhausted: partial });
  const allFailed = outcome === "error";

  await cronFinished(CRON_NAME, runStart, {
    status: outcome,
    count: totalNew,
    updated: totalUpdated,
    failures,
    attempted: results.length,
  });

  return NextResponse.json({
    ok: !allFailed,
    partial,
    districts: results.length,
    totalNewRecords: totalNew,
    totalRevisedRecords: totalUpdated,
    notCovered,
    durationMs: Date.now() - runStart,
    results,
  });
}
