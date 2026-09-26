/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Homepage Preview API
// GET /api/data/homepage-preview
// Returns live data snippets for active districts (for cards)
// ═══════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

// v2 (Sept 2026): weather now carries recordedAt and is null when older
// than WEATHER_MAX_AGE_MS, so the homepage never shows an April temperature
// as "Latest weather reading" again (audit item 3.7). Key bumped so the old
// cached shape is never served.
const CACHE_KEY = "ftp:homepage-preview:v2";

// A temperature older than this is not "current" — hide it rather than
// mislead. The weather cron runs every 30 min, so 6 h means 12 missed runs.
const WEATHER_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const cached = await cacheGet<object>(CACHE_KEY);
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  try {
    // Get active districts
    const activeDistricts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, nameLocal: true, tagline: true, goLiveDate: true, state: { select: { slug: true } } },
    });

    // For each district, fetch latest weather, dam, crop in one pass
    const previews = await Promise.all(
      activeDistricts.map(async (d) => {
        const [weather, dam, crop, news, healthScore] = await Promise.all([
          prisma.weatherReading.findFirst({
            where: { districtId: d.id },
            orderBy: { recordedAt: "desc" },
            select: { temperature: true, conditions: true, recordedAt: true },
          }),
          prisma.damReading.findFirst({
            where: { districtId: d.id },
            orderBy: { recordedAt: "desc" },
            select: { damName: true, storagePct: true, recordedAt: true },
          }),
          prisma.cropPrice.findFirst({
            where: { districtId: d.id },
            orderBy: { date: "desc" },
            select: { commodity: true, modalPrice: true, date: true },
          }),
          prisma.newsItem.findFirst({
            where: { districtId: d.id },
            orderBy: { publishedAt: "desc" },
            select: { title: true, publishedAt: true, source: true },
          }),
          prisma.districtHealthScore.findUnique({
            where: { districtId: d.id },
            select: { grade: true, overallScore: true },
          }),
        ]);

        return {
          slug: d.slug,
          stateSlug: (d as { state?: { slug: string } }).state?.slug ?? "karnataka",
          name: d.name,
          nameLocal: d.nameLocal,
          tagline: d.tagline,
          goLiveDate: d.goLiveDate ? d.goLiveDate.toISOString() : null,
          // Stale readings become null — the card then simply omits weather.
          weather:
            weather && Date.now() - weather.recordedAt.getTime() <= WEATHER_MAX_AGE_MS
              ? {
                  temp: weather.temperature != null ? Math.round(weather.temperature) : null,
                  conditions: weather.conditions,
                  recordedAt: weather.recordedAt.toISOString(),
                }
              : null,
          dam: dam
            ? {
                name: dam.damName,
                storagePct: Math.round(dam.storagePct),
              }
            : null,
          crop: crop
            ? {
                commodity: crop.commodity,
                price: Math.round(crop.modalPrice),
              }
            : null,
          news: news
            ? {
                title: news.title,
                source: news.source,
                publishedAt: news.publishedAt.toISOString(),
              }
            : null,
          healthGrade: healthScore?.grade ?? null,
          healthScore: healthScore ? Math.round(healthScore.overallScore) : null,
        };
      })
    );

    // Also fetch top 3 crops across all active districts for the crops card
    const topCrops = await prisma.cropPrice.findMany({
      where: { districtId: { in: activeDistricts.map((d) => d.id) } },
      orderBy: { date: "desc" },
      take: 30,
      select: { commodity: true, modalPrice: true, date: true, districtId: true },
    });

    // Deduplicate by commodity, keep latest
    const seenCommodities = new Set<string>();
    const latestCrops = topCrops
      .filter((c) => {
        if (seenCommodities.has(c.commodity)) return false;
        seenCommodities.add(c.commodity);
        return true;
      })
      .slice(0, 3);

    // Latest news across all districts
    const latestNews = await prisma.newsItem.findMany({
      where: { districtId: { in: activeDistricts.map((d) => d.id) } },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { title: true, source: true, publishedAt: true, districtId: true },
    });

    // Dam levels for the dams card
    const latestDams = await prisma.damReading.findMany({
      where: { districtId: { in: activeDistricts.map((d) => d.id) } },
      orderBy: { recordedAt: "desc" },
      take: 10,
      select: { damName: true, storagePct: true, districtId: true },
    });
    // Deduplicate by damName
    const seenDams = new Set<string>();
    const uniqueDams = latestDams
      .filter((d) => {
        if (seenDams.has(d.damName)) return false;
        seenDams.add(d.damName);
        return true;
      })
      .slice(0, 3);

    const result = {
      districtPreviews: previews,
      topCrops: latestCrops,
      latestNews,
      latestDams: uniqueDams,
      fromCache: false,
    };

    await cacheSet(CACHE_KEY, result, 300);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[homepage-preview]", err);
    return NextResponse.json({ districtPreviews: [], topCrops: [], latestNews: [], latestDams: [], fromCache: false, error: true });
  }
}
