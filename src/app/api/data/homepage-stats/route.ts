/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Homepage Stats API
// GET /api/data/homepage-stats
// Returns aggregated counts for hero stats bar
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { DASHBOARDS_PER_DISTRICT } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:homepage-stats:v3";

export async function GET() {
  const cached = await cacheGet<object>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    const [
      cropCount,
      damCount,
      weatherCount,
      newsCount,
      leaderCount,
      schoolCount,
      activeDistricts,
      latestNews,
      latestInfraUpdate,
      latestLocalAlert,
    ] = await Promise.all([
      prisma.cropPrice.count(),
      prisma.damReading.count(),
      prisma.weatherReading.count(),
      prisma.newsItem.count(),
      prisma.leader.count(),
      prisma.school.count(),
      prisma.district.count({ where: { active: true } }),
      prisma.newsItem.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
      prisma.infraUpdate.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }).catch(() => null),
      prisma.localAlert.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }).catch(() => null),
    ]);

    const totalDataPoints = cropCount + damCount + weatherCount + newsCount + leaderCount + schoolCount;

    // mostRecentAt now reflects healthy data sources, not stale upstream APIs.
    // AGMARKNET (cropPrice.fetchedAt) hasn't published since 2026-04-21 — verified
    // via Session-10 diagnostic logs across all 10 districts.
    // Railway weather scraper (weatherReading.recordedAt) offline since trial
    // credit constraints around 2026-04-21.
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
      plannedDistricts: 780,
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
        totalDataPoints: 0,
        mostRecentAt: null,
        plannedDistricts: 780,
        fromCache: false,
        error: true,
      });
    } catch {
      return NextResponse.json({
        activeDistricts: 0,
        modulesPerDistrict: DASHBOARDS_PER_DISTRICT,
        totalDataPoints: 0,
        mostRecentAt: null,
        plannedDistricts: 780,
        fromCache: false,
        error: true,
      });
    }
  }
}
