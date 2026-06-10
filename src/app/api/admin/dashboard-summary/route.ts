/**
 * ForThePeople.in — Dashboard summary
 * GET /api/admin/dashboard-summary
 * Single roll-up powering the admin dashboard so the UI doesn't fan out into
 * ten separate API calls. Cached in Redis for 30s.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";
import { cacheGet, cacheSet } from "@/lib/cache";
import { isTransientError } from "@/lib/admin-alerts";
import type { OpenRouterUsage } from "../openrouter-usage/route";

export const runtime = "nodejs";

const CACHE_KEY = "ftp:admin:dashboard-summary";
const CACHE_TTL = 30;
const STALE_THRESHOLD_MS = 24 * 3_600_000;

export interface DashboardSummary {
  timestamp: string;
  unreadAlerts: number;
  pendingReviews: number;
  unreadFeedback: number;
  staleDistricts: Array<{ slug: string; name: string; modules: string[] }>;
  emailConfigured: boolean;
  revenue: {
    thisWeek: number;
    total: number;
    supporterCount: number;
    latest: { name: string; amount: number; tier: string; createdAt: string } | null;
  };
  ai: {
    totalCalls: number;
    totalTokens: number;
    totalCostINR: number;
  };
  scrapers: {
    total: number;
    successful: number;
    failed: number;
    successPct: number;
  };
  db: { status: "healthy" | "error"; responseMs: number; activeDistricts: number };
  redis: { status: "healthy" | "error"; responseMs: number };
  openRouter: OpenRouterUsage | null;
  recentActivity: Array<{
    ts: string;
    kind: "payment" | "feedback" | "error" | "system";
    icon: string;
    text: string;
  }>;
}

async function fetchOpenRouterFromCache(): Promise<OpenRouterUsage | null> {
  return cacheGet<OpenRouterUsage>("ftp:admin:openrouter-usage");
}

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await cacheGet<DashboardSummary>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const since24h = new Date(Date.now() - 86_400_000);
  const now = Date.now();

  // ── DB health + activeDistricts
  const dbStart = Date.now();
  let dbStatus: "healthy" | "error" = "healthy";
  let activeDistricts = 0;
  let districts: Array<{ id: string; slug: string; name: string }> = [];
  try {
    districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    });
    activeDistricts = districts.length;
  } catch {
    dbStatus = "error";
  }
  const dbMs = Date.now() - dbStart;

  // ── Redis health
  const redisStart = Date.now();
  let redisStatus: "healthy" | "error" = "error";
  try {
    if (redis) {
      await redis.ping();
      redisStatus = "healthy";
    }
  } catch {
    redisStatus = "error";
  }
  const redisMs = Date.now() - redisStart;

  // ── Counts
  const [unreadAlerts, pendingReviews, unreadFeedback] = await Promise.all([
    prisma.adminAlert.count({ where: { read: false } }).catch(() => 0),
    prisma.reviewQueue.count({ where: { status: "pending" } }).catch(() => 0),
    prisma.feedback.count({ where: { status: "new" } }).catch(() => 0),
  ]);

  // ── Stale districts (any module > 24h since last update)
  const staleDistricts: DashboardSummary["staleDistricts"] = [];
  await Promise.all(
    districts.map(async (d) => {
      const [weather, news, crops, ai] = await Promise.all([
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
      ]);
      const modules: string[] = [];
      const checkStale = (ts: Date | null | undefined, name: string) => {
        if (!ts || now - ts.getTime() > STALE_THRESHOLD_MS) modules.push(name);
      };
      checkStale(weather?.recordedAt, "weather");
      checkStale(news?.publishedAt, "news");
      checkStale(crops?.date, "crops");
      checkStale(ai?.generatedAt, "insights");
      if (modules.length > 0) {
        staleDistricts.push({ slug: d.slug, name: d.name, modules });
      }
    })
  );

  // ── Revenue
  let thisWeek = 0;
  let total = 0;
  let supporterCount = 0;
  let latest: DashboardSummary["revenue"]["latest"] = null;
  try {
    const [weekRows, allRows, latestRow] = await Promise.all([
      prisma.supporter.findMany({
        where: { status: "success", createdAt: { gte: sevenDaysAgo } },
        select: { amount: true },
      }),
      prisma.supporter.findMany({
        where: { status: "success" },
        select: { amount: true },
      }),
      prisma.supporter.findFirst({
        where: { status: "success" },
        orderBy: { createdAt: "desc" },
        select: { name: true, amount: true, tier: true, createdAt: true },
      }),
    ]);
    thisWeek = weekRows.reduce((s, r) => s + r.amount, 0);
    total = allRows.reduce((s, r) => s + r.amount, 0);
    supporterCount = allRows.length;
    if (latestRow) {
      latest = {
        name: latestRow.name,
        amount: latestRow.amount,
        tier: latestRow.tier,
        createdAt: latestRow.createdAt.toISOString(),
      };
    }
  } catch {
    // ignore
  }

  // ── AI counts (all-time from AIProviderSettings) + last 30d cost
  let aiSettings: { totalGeminiCalls: number | null; totalAnthropicCalls: number | null } | null = null;
  try {
    aiSettings = await prisma.aIProviderSettings.findUnique({
      where: { id: "singleton" },
      select: { totalGeminiCalls: true, totalAnthropicCalls: true },
    });
  } catch {
    aiSettings = null;
  }
  let totalTokens = 0;
  let totalCostINR = 0;
  try {
    const logs = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
      select: { totalTokens: true, costINR: true },
    });
    totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
    totalCostINR = logs.reduce((s, l) => s + l.costINR, 0);
  } catch {
    // ignore
  }

  // ── Scrapers (24h)
  let scraperTotal = 0;
  let scraperOk = 0;
  let scraperFail = 0;
  try {
    const [tot, ok, fail] = await Promise.all([
      prisma.scraperLog.count({ where: { startedAt: { gte: since24h } } }),
      prisma.scraperLog.count({ where: { startedAt: { gte: since24h }, status: "success" } }),
      prisma.scraperLog.count({ where: { startedAt: { gte: since24h }, status: "error" } }),
    ]);
    scraperTotal = tot;
    scraperOk = ok;
    scraperFail = fail;
  } catch {
    // ignore
  }
  const successPct = scraperTotal > 0 ? (scraperOk / scraperTotal) * 100 : 100;

  // ── OpenRouter
  const openRouter = await fetchOpenRouterFromCache();

  // ── Recent activity feed (last 20 combined)
  const activity: DashboardSummary["recentActivity"] = [];
  try {
    const [supporters, feedback, scraperErrors] = await Promise.all([
      prisma.supporter.findMany({
        where: { status: "success" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { name: true, amount: true, tier: true, status: true, createdAt: true },
      }),
      prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { district: { select: { name: true } } },
      }),
      prisma.scraperLog.findMany({
        where: { status: "error", startedAt: { gte: since24h } },
        orderBy: { startedAt: "desc" },
        take: 10,
        select: { jobName: true, error: true, startedAt: true },
      }),
    ]);
    for (const s of supporters) {
      activity.push({
        ts: s.createdAt.toISOString(),
        kind: "payment",
        icon: "💰",
        text: `${s.name} — ₹${s.amount.toLocaleString("en-IN")} (${s.tier}) — ${s.status}`,
      });
    }
    for (const f of feedback) {
      activity.push({
        ts: f.createdAt.toISOString(),
        kind: "feedback",
        icon: "💬",
        text: `${f.name ?? "Anonymous"} — ${f.type}: "${(f.subject ?? "").slice(0, 60)}"${f.district ? ` (${f.district.name})` : ""}`,
      });
    }
    for (const e of scraperErrors) {
      // Skip transient gov-portal timeouts — freshness panel still shows them,
      // no need to surface in the global activity feed.
      if (isTransientError(e.error)) continue;
      activity.push({
        ts: e.startedAt.toISOString(),
        kind: "error",
        icon: "⚡",
        text: `Scraper failed: ${e.jobName}${e.error ? ` — ${e.error.slice(0, 80)}` : ""}`,
      });
    }
  } catch {
    // ignore
  }
  activity.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const summary: DashboardSummary = {
    timestamp: new Date().toISOString(),
    unreadAlerts,
    pendingReviews,
    unreadFeedback,
    staleDistricts,
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL),
    revenue: { thisWeek, total, supporterCount, latest },
    ai: {
      totalCalls: (aiSettings?.totalGeminiCalls ?? 0) + (aiSettings?.totalAnthropicCalls ?? 0),
      totalTokens,
      totalCostINR,
    },
    scrapers: {
      total: scraperTotal,
      successful: scraperOk,
      failed: scraperFail,
      successPct,
    },
    db: { status: dbStatus, responseMs: dbMs, activeDistricts },
    redis: { status: redisStatus, responseMs: redisMs },
    openRouter,
    recentActivity: activity.slice(0, 20),
  };

  await cacheSet(CACHE_KEY, summary, CACHE_TTL);
  return NextResponse.json(summary);
}
