/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
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
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { scrapeDams } from "@/scraper/jobs/dams";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
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

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const results: Array<{ district: string; success: boolean; newCount: number; error?: string }> = [];
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
      results.push({ district: d.slug, success: result.success, newCount: result.recordsNew, error: result.error });
      console.log(`[scrape-dams/${d.slug}] ${result.success ? "ok" : "fail"}, ${result.recordsNew} new | ${logs.join(" | ")}`);
      if (result.success && result.recordsNew > 0 && redis) {
        await redis.del(cacheKey(d.slug, "dam")).catch(() => {});
        await redis.del(cacheKey(d.slug, "water")).catch(() => {});
      }
    } catch (err) {
      Sentry.captureException(err);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ district: d.slug, success: false, newCount: 0, error: msg });
      console.error(`[scrape-dams/${d.slug}] threw: ${msg}`);
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newCount, 0);
  const failed = results.filter((r) => !r.success);
  const allFailed = results.length > 0 && failed.length === results.length;

  await cronFinished(CRON_NAME, runStart, {
    status: allFailed ? "error" : "ok",
    count: totalNew,
    error: allFailed ? `all ${results.length} districts failed: ${failed[0]?.error ?? "unknown"}` : undefined,
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
