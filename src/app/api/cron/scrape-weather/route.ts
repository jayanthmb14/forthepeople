/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Vercel Cron: Weather collector — every 30 minutes
// GET /api/cron/scrape-weather      schedule "*/30 * * * *" (vercel.json)
// Auth: verifyCron() — Bearer (Vercel) or x-cron-secret (manual)
// Run state: Redis "ftp:cron:scrape-weather"
//
// WHY (Sept 2026 audit, item 3.7): weather only ever ran inside a Railway
// node-cron container that expired in April, so the homepage was showing
// April temperatures as "Latest weather reading". This route is the first
// Vercel-scheduled weather job. It loops every active district and calls
// the existing scrapeWeather() job (which has an 8 s fetch timeout).
//
// Districts are processed in small parallel batches so 10-30 districts
// finish well inside maxDuration = 60 even if a few time out.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheKey } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { scrapeWeather } from "@/scraper/jobs/weather";
import { verifyCron, cronStarted, cronFinished } from "@/lib/cron-auth";
import type { JobContext } from "@/scraper/types";

export const runtime = "nodejs";
export const maxDuration = 60;
const CRON_NAME = "scrape-weather";

// How many districts to fetch at once. OpenWeather's free tier allows
// 60 calls/min, so 5 in flight is comfortably safe.
const BATCH_SIZE = 5;
// Stop starting new batches after this long (leaves ~15 s for the last batch).
const TIME_BUDGET_MS = 45_000;

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runStart = await cronStarted(CRON_NAME);

  if (!process.env.OPENWEATHER_API_KEY) {
    const reason = "OPENWEATHER_API_KEY is not set in the environment";
    await cronFinished(CRON_NAME, runStart, { status: "error", error: reason });
    return NextResponse.json({ ok: false, skipped: true, reason }, { status: 500 });
  }

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const results: Array<{ district: string; success: boolean; error?: string }> = [];
  let partial = false;

  for (let i = 0; i < districts.length; i += BATCH_SIZE) {
    if (Date.now() - runStart > TIME_BUDGET_MS) {
      partial = true;
      console.warn(`[scrape-weather] time budget exhausted; ${districts.length - i} district(s) left`);
      break;
    }

    const batch = districts.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (d) => {
        const logs: string[] = [];
        const ctx: JobContext = {
          districtId: d.id,
          districtSlug: d.slug,
          districtName: d.name,
          stateSlug: d.state?.slug ?? "karnataka",
          stateName: d.state?.name ?? "Karnataka",
          log: (msg) => logs.push(msg),
        };
        const result = await scrapeWeather(ctx);
        console.log(`[scrape-weather/${d.slug}] ${result.success ? "ok" : "fail"} | ${logs.join(" | ")}`);

        // Bust the district's cached weather so the page shows the new reading.
        if (result.success && redis) {
          await redis.del(cacheKey(d.slug, "weather")).catch(() => {});
        }
        return { district: d.slug, success: result.success, error: result.error };
      }),
    );

    for (let j = 0; j < settled.length; j++) {
      const s = settled[j];
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        Sentry.captureException(s.reason);
        results.push({
          district: batch[j].slug,
          success: false,
          error: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
      }
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const allFailed = results.length > 0 && succeeded === 0;
  await cronFinished(CRON_NAME, runStart, {
    status: allFailed ? "error" : "ok",
    count: succeeded,
    error: allFailed ? `all ${results.length} districts failed: ${results[0]?.error ?? "unknown"}` : undefined,
  });

  return NextResponse.json({
    ok: !allFailed,
    partial,
    districts: results.length,
    succeeded,
    durationMs: Date.now() - runStart,
    results,
  });
}
