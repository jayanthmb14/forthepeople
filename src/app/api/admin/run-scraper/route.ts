/**
 * ForThePeople.in — Manual scraper trigger
 * POST /api/admin/run-scraper
 * Body: { district: string (slug), job: "weather" | "news" | "crops" | "insights" }
 *
 * Runs the chosen scraper for a single district — does NOT hit the cron endpoint
 * which processes every active district. Writes a ScraperLog entry and invalidates
 * the relevant Redis cache keys so the freshness table picks up the result.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";
import { cacheKey } from "@/lib/cache";
import { writeLog } from "@/scraper/logger";
import type { JobContext, ScraperJob, ScraperResult } from "@/scraper/types";
import { scrapeWeather } from "@/scraper/jobs/weather";
import { scrapeNews } from "@/scraper/jobs/news";
import { scrapeCrops } from "@/scraper/jobs/crops";
import { MODULE_INSIGHT_CONFIGS } from "@/lib/insight-config";
import { generateInsight } from "@/lib/insight-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

type JobKind = "weather" | "news" | "crops" | "insights";

const SCRAPER_MAP: Record<Exclude<JobKind, "insights">, { fn: ScraperJob; caches: string[] }> = {
  weather: { fn: scrapeWeather, caches: ["weather", "overview"] },
  news: { fn: scrapeNews, caches: ["news"] },
  crops: { fn: scrapeCrops, caches: ["crops", "overview"] },
};

async function invalidateCache(districtSlug: string, modules: string[]) {
  const r = redis;
  if (!r) return;
  await Promise.all(
    modules.map((m) => r.del(cacheKey(districtSlug, m)).catch(() => 0))
  );
}

export async function POST(req: NextRequest) {
  const { ok: isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { district?: string; job?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const districtSlug = String(body.district ?? "").trim();
  const job = String(body.job ?? "").trim() as JobKind;
  if (!districtSlug || !job) {
    return NextResponse.json({ error: "district and job required" }, { status: 400 });
  }
  if (!["weather", "news", "crops", "insights"].includes(job)) {
    return NextResponse.json({ error: "unknown job" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      state: { select: { slug: true, name: true } },
    },
  });
  if (!district) {
    return NextResponse.json({ error: "district not found" }, { status: 404 });
  }

  const startedAt = new Date();
  const tStart = Date.now();

  if (job === "insights") {
    let ok = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const config of MODULE_INSIGHT_CONFIGS) {
      try {
        const success = await generateInsight(
          config,
          district.id,
          district.slug,
          district.name,
          district.state?.slug ?? "karnataka",
          district.state?.name ?? "Karnataka"
        );
        if (success) ok++;
        else failed++;
      } catch (err) {
        failed++;
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    const result: ScraperResult = {
      success: failed === 0,
      recordsNew: ok,
      recordsUpdated: 0,
      error: errors.length ? errors.slice(0, 3).join(" | ") : undefined,
    };
    await writeLog(`insights/${district.slug}`, startedAt, result);
    return NextResponse.json({
      success: result.success,
      recordsNew: ok,
      recordsUpdated: 0,
      modulesProcessed: ok + failed,
      error: result.error,
      duration: Date.now() - tStart,
    });
  }

  const mapping = SCRAPER_MAP[job];
  const ctx: JobContext = {
    districtSlug: district.slug,
    districtId: district.id,
    districtName: district.name,
    stateSlug: district.state?.slug ?? "karnataka",
    stateName: district.state?.name ?? "Karnataka",
    log: () => {},
  };

  let result: ScraperResult;
  try {
    result = await mapping.fn(ctx);
  } catch (err) {
    result = {
      success: false,
      recordsNew: 0,
      recordsUpdated: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  await writeLog(`${job}/${district.slug}`, startedAt, result);
  if (result.success) {
    await invalidateCache(district.slug, mapping.caches);
  }

  return NextResponse.json({
    success: result.success,
    recordsNew: result.recordsNew,
    recordsUpdated: result.recordsUpdated,
    error: result.error,
    duration: Date.now() - tStart,
  });
}
