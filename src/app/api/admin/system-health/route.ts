/**
 * ForThePeople.in — Admin System Health API
 * GET /api/admin/system-health
 * Returns DB/Redis status, data freshness with per-cell last-error + expected
 * interval, scraper logs, pending items, revenue.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { redis } from "@/lib/redis";

// Expected update frequency per module (minutes). Used by the UI to colour-code
// freshness cells and in the per-cell popover.
export const EXPECTED_INTERVAL_MIN: Record<string, number> = {
  weather: 5,
  news: 60,
  crops: 15,
  insights: 120,
};

interface FreshnessRow {
  district: string;
  slug: string;
  weather: string | null;
  news: string | null;
  crops: string | null;
  aiInsights: string | null;
  /** Most recent error per module for this district, from ScraperLog. */
  errors: {
    weather: string | null;
    news: string | null;
    crops: string | null;
    insights: string | null;
  };
}

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

async function lastErrorFor(jobPrefix: string, districtSlug: string): Promise<string | null> {
  try {
    const row = await prisma.scraperLog.findFirst({
      where: {
        status: "error",
        jobName: { in: [jobPrefix, `${jobPrefix}/${districtSlug}`] },
        startedAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
      orderBy: { startedAt: "desc" },
      select: { error: true },
    });
    return row?.error ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const result: Record<string, unknown> = {};

  // ── Database health
  try {
    const dbStart = Date.now();
    const [activeDistricts, totalNewsItems] = await Promise.all([
      prisma.district.count({ where: { active: true } }),
      prisma.newsItem.count(),
    ]);
    result.database = {
      status: "healthy",
      responseMs: Date.now() - dbStart,
      activeDistricts,
      totalNewsItems,
    };
  } catch {
    result.database = { status: "error", responseMs: 0, activeDistricts: 0, totalNewsItems: 0 };
  }

  // ── Redis health
  try {
    const redisStart = Date.now();
    if (redis) {
      await redis.ping();
      result.redis = { status: "healthy", responseMs: Date.now() - redisStart };
    } else {
      result.redis = { status: "error", responseMs: 0 };
    }
  } catch {
    result.redis = { status: "error", responseMs: 0 };
  }

  // ── Scrapers (last 24h)
  try {
    const since = new Date(Date.now() - 86_400_000);
    const [logs, total, successful, failed] = await Promise.all([
      prisma.scraperLog.findMany({
        where: { startedAt: { gte: since } },
        orderBy: { startedAt: "desc" },
        take: 50,
      }),
      prisma.scraperLog.count({ where: { startedAt: { gte: since } } }),
      prisma.scraperLog.count({ where: { startedAt: { gte: since }, status: "success" } }),
      prisma.scraperLog.count({ where: { startedAt: { gte: since }, status: "error" } }),
    ]);
    result.scrapers = {
      last24h: { total, successful, failed },
      recentLogs: logs.map((l) => ({
        id: l.id,
        jobName: l.jobName,
        status: l.status,
        recordsAffected: (l.recordsNew ?? 0) + (l.recordsUpdated ?? 0),
        durationMs: l.duration ?? 0,
        error: l.error,
        createdAt: l.startedAt?.toISOString() ?? null,
      })),
    };
  } catch {
    result.scrapers = { last24h: { total: 0, successful: 0, failed: 0 }, recentLogs: [] };
  }

  // ── Data freshness + per-cell last error
  try {
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    const freshness: FreshnessRow[] = await Promise.all(
      districts.map(async (d) => {
        const [weather, news, crops, aiInsight, wErr, nErr, cErr, iErr] = await Promise.all([
          prisma.weatherReading.findFirst({
            where: { districtId: d.id },
            orderBy: { recordedAt: "desc" },
            select: { recordedAt: true },
          }),
          prisma.newsItem.findFirst({
            where: { districtId: d.id },
            orderBy: { publishedAt: "desc" },
            select: { publishedAt: true },
          }),
          prisma.cropPrice.findFirst({
            where: { districtId: d.id },
            orderBy: { date: "desc" },
            select: { date: true },
          }),
          prisma.aIModuleInsight.findFirst({
            where: { districtId: d.id },
            orderBy: { generatedAt: "desc" },
            select: { generatedAt: true },
          }),
          lastErrorFor("weather", d.slug),
          lastErrorFor("news", d.slug),
          lastErrorFor("crops", d.slug),
          lastErrorFor("insights", d.slug),
        ]);
        return {
          district: d.name,
          slug: d.slug,
          weather: weather?.recordedAt?.toISOString() ?? null,
          news: news?.publishedAt?.toISOString() ?? null,
          crops: crops?.date?.toISOString() ?? null,
          aiInsights: aiInsight?.generatedAt?.toISOString() ?? null,
          errors: { weather: wErr, news: nErr, crops: cErr, insights: iErr },
        };
      })
    );
    result.dataFreshness = freshness;
  } catch {
    result.dataFreshness = [];
  }

  // ── Pending items
  try {
    const [reviews, feedback, alerts, unreadAlerts] = await Promise.all([
      prisma.reviewQueue.count({ where: { status: "pending" } }),
      prisma.feedback.count({ where: { status: "new" } }),
      prisma.localAlert.count({ where: { active: true } }),
      prisma.adminAlert.count({ where: { read: false } }),
    ]);
    result.pendingItems = { reviews, feedback, alerts, unreadAlerts };
  } catch {
    result.pendingItems = { reviews: 0, feedback: 0, alerts: 0, unreadAlerts: 0 };
  }

  // ── Contributions
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const [last7, allSuccess] = await Promise.all([
      prisma.supporter.findMany({
        where: { status: "success", createdAt: { gte: sevenDaysAgo } },
        select: { amount: true },
      }),
      prisma.supporter.findMany({
        where: { status: "success" },
        select: { amount: true },
      }),
    ]);
    result.contributions = {
      last7days: last7.reduce((s, x) => s + x.amount, 0),
      totalRevenue: allSuccess.reduce((s, x) => s + x.amount, 0),
    };
  } catch {
    result.contributions = { last7days: 0, totalRevenue: 0 };
  }

  result.expectedIntervals = EXPECTED_INTERVAL_MIN;
  result.serverTimeMs = Date.now() - start;
  result.timestamp = new Date().toISOString();

  return NextResponse.json(result);
}
