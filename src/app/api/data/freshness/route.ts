/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/freshness?district=mandya
// Returns data staleness per module for a district.
// Traffic light: green (<expected), amber (<3×), red (>3×)
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Expected max age in minutes for each data type
const EXPECTED_MAX_AGE: Record<string, number> = {
  weather:       10,   // scraper runs every 5 min
  crops:         1440, // scraper runs daily (AGMARKNET)
  dam:           60,   // scraper runs every 30 min
  news:          120,  // scraper runs every 1h
  alerts:        120,  // scraper runs every 2h
  insights:      120,  // cron runs every 2h
};

function trafficLight(ageMinutes: number | null, maxAgeMinutes: number): "green" | "amber" | "red" | "unknown" {
  if (ageMinutes === null) return "unknown";
  if (ageMinutes <= maxAgeMinutes) return "green";
  if (ageMinutes <= maxAgeMinutes * 3) return "amber";
  return "red";
}

function formatAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return "no data";
  if (ageMinutes < 60) return `${Math.round(ageMinutes)} min ago`;
  if (ageMinutes < 1440) return `${Math.round(ageMinutes / 60)}h ago`;
  return `${Math.round(ageMinutes / 1440)}d ago`;
}

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  if (!districtSlug) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  const now = Date.now();

  const [weather, crops, dam, news, alertsCount, insights] = await Promise.all([
    prisma.weatherReading.findFirst({
      where: { districtId: district.id },
      orderBy: { recordedAt: "desc" },
      select: { recordedAt: true },
    }),
    prisma.cropPrice.findFirst({
      where: { districtId: district.id },
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true, date: true },
    }),
    prisma.damReading.findFirst({
      where: { districtId: district.id },
      orderBy: { recordedAt: "desc" },
      select: { recordedAt: true },
    }),
    prisma.newsItem.findFirst({
      where: { districtId: district.id },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    }),
    prisma.localAlert.count({ where: { districtId: district.id, active: true } }),
    prisma.aIModuleInsight.findFirst({
      where: { districtId: district.id },
      orderBy: { generatedAt: "desc" },
      select: { generatedAt: true },
    }),
  ]);

  function ageMin(date: Date | null | undefined): number | null {
    if (!date) return null;
    return (now - new Date(date).getTime()) / 60000;
  }

  const weatherAge = ageMin(weather?.recordedAt);
  const cropsAge   = ageMin(crops?.fetchedAt);
  const damAge     = ageMin(dam?.recordedAt);
  const newsAge    = ageMin(news?.publishedAt);
  const insightAge = ageMin(insights?.generatedAt);

  const data = {
    district: district.name,
    districtSlug,
    checkedAt: new Date().toISOString(),
    modules: {
      weather: {
        status: trafficLight(weatherAge, EXPECTED_MAX_AGE.weather),
        age: formatAge(weatherAge),
        lastUpdated: weather?.recordedAt ?? null,
      },
      crops: {
        status: trafficLight(cropsAge, EXPECTED_MAX_AGE.crops),
        age: formatAge(cropsAge),
        lastUpdated: crops?.fetchedAt ?? null,
        dataDate: crops?.date ?? null,
      },
      dam: {
        status: trafficLight(damAge, EXPECTED_MAX_AGE.dam),
        age: formatAge(damAge),
        lastUpdated: dam?.recordedAt ?? null,
      },
      news: {
        status: trafficLight(newsAge, EXPECTED_MAX_AGE.news),
        age: formatAge(newsAge),
        lastUpdated: news?.publishedAt ?? null,
      },
      alerts: {
        activeCount: alertsCount,
        status: "ok" as const,
      },
      aiInsights: {
        status: trafficLight(insightAge, EXPECTED_MAX_AGE.insights),
        age: formatAge(insightAge),
        lastUpdated: insights?.generatedAt ?? null,
      },
    },
    summary: {
      green: 0,
      amber: 0,
      red: 0,
      unknown: 0,
    },
  };

  // Tally summary
  for (const mod of Object.values(data.modules)) {
    if ("status" in mod && mod.status !== "ok") {
      const s = mod.status as "green" | "amber" | "red" | "unknown";
      data.summary[s]++;
    }
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
