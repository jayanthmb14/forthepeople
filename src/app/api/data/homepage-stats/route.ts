/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Homepage Stats API
// GET /api/data/homepage-stats
// Returns aggregated counts for hero stats bar
//
// Sept 2026 audit: this public route had its own count (6 tables → 2,689
// "data points" while the home page said 4,917) and a hand-typed 780. It
// now uses the home page's own count (loadDataPointCount) and the shared
// district total, so the two always agree. Nothing on the site calls it.
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { DASHBOARDS_PER_DISTRICT, TOTAL_INDIA_DISTRICTS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { loadDataPointCount } from "@/components/home/home-data";

const CACHE_KEY = "ftp:homepage-stats:v4";

export async function GET() {
  const cached = await cacheGet<object>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const [
      dataPoints,
      activeDistricts,
      latestNews,
      latestInfraUpdate,
      latestLocalAlert,
    ] = await Promise.all([
      loadDataPointCount(),
      prisma.district.count({ where: { active: true } }),
      prisma.newsItem.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
      prisma.infraUpdate.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }).catch(() => null),
      prisma.localAlert.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }).catch(() => null),
    ]);

    // The same count as the home page's "data points tracked" (null when the count failed).
    const totalDataPoints = dataPoints;

    // mostRecentAt: the newest news, infrastructure update or local alert.
    const times = [
      latestNews?.fetchedAt,
      latestInfraUpdate?.createdAt,
      latestLocalAlert?.createdAt,
    ].filter(Boolean) as Date[];
    const mostRecentAt = times.length ? new Date(Math.max(...times.map((t) => t.getTime()))) : null;

    const result = {
      activeDistricts,
      modulesPerDistrict: DASHBOARDS_PER_DISTRICT,
      totalDataPoints,
      mostRecentAt: mostRecentAt?.toISOString() ?? null,
      plannedDistricts: TOTAL_INDIA_DISTRICTS,
      fromCache: false,
    };

    await cacheSet(CACHE_KEY, result, 300); // 5 min cache
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[homepage-stats]", err);
    try {
      const fallbackCount = await prisma.district.count({ where: { active: true } });
      return NextResponse.json({
        activeDistricts: fallbackCount,
        modulesPerDistrict: DASHBOARDS_PER_DISTRICT,
        totalDataPoints: null,
        mostRecentAt: null,
        plannedDistricts: TOTAL_INDIA_DISTRICTS,
        fromCache: false,
        error: true,
      });
    } catch {
      return NextResponse.json({
        activeDistricts: 0,
        modulesPerDistrict: DASHBOARDS_PER_DISTRICT,
        totalDataPoints: null,
        mostRecentAt: null,
        plannedDistricts: TOTAL_INDIA_DISTRICTS,
        fromCache: false,
        error: true,
      });
    }
  }
}
