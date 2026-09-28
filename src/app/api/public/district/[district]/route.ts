/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Public read-only JSON API for AI crawlers and third-party apps
// Returns a structured snapshot of a district's key metrics
// No authentication required; rate-limited by Vercel Edge
//
// Every dataset shows its source and date: each live item carries its own
// `source` (and `sourceUrl` for warnings) next to its date, and the people
// figures say whether they are the Census 2011 row. The figures belong to
// those sources — this API does not re-license them.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OFFICIAL_ALERTS, shownCropPrices } from "@/lib/data-filters";
import { withCensusFigures } from "@/lib/census-2011";
import { loadCensus2011 } from "@/lib/census-2011-db";
import { isSlug } from "@/lib/read-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
  if (!isSlug(district)) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  try {
    const [overview, latestWeather, latestDam, latestCrops, activeAlerts] = await Promise.all([
      prisma.district.findFirst({
        where: { slug: district },
        select: {
          id: true, name: true, nameLocal: true, tagline: true,
          population: true, area: true, literacy: true, sexRatio: true, density: true,
          taluks: { select: { name: true, slug: true } },
        },
      }),
      prisma.weatherReading.findFirst({
        where: { district: { slug: district } },
        orderBy: { recordedAt: "desc" },
        select: { temperature: true, conditions: true, humidity: true, windSpeed: true, rainfall: true, recordedAt: true, source: true },
      }),
      prisma.damReading.findFirst({
        where: { district: { slug: district } },
        orderBy: { recordedAt: "desc" },
        select: { damName: true, storagePct: true, waterLevel: true, maxLevel: true, storage: true, maxStorage: true, inflow: true, outflow: true, recordedAt: true, source: true },
      }),
      prisma.cropPrice.findMany({
        where: { district: { slug: district }, ...shownCropPrices(district) },
        orderBy: { date: "desc" },
        take: 5,
        distinct: ["commodity"],
        select: { commodity: true, market: true, modalPrice: true, minPrice: true, maxPrice: true, date: true, source: true },
      }),
      prisma.localAlert.findMany({
        where: { district: { slug: district }, active: true, ...OFFICIAL_ALERTS },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true, severity: true, type: true, description: true, createdAt: true, sourceUrl: true },
      }),
    ]);

    if (!overview) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    // People figures only from the checked Census 2011 row (as on the
    // district overview), never the hand-typed District columns (Sept 2026
    // audit); without that row they are null rather than unverified.
    const census = await loadCensus2011(overview.id);
    const figures = census ? withCensusFigures(overview, census) : null;

    return NextResponse.json({
      district: {
        name: overview.name,
        nameLocal: overview.nameLocal,
        tagline: overview.tagline,
        population: figures?.population ?? null,
        area: figures?.area ?? null,
        literacy: figures?.literacy ?? null,
        sexRatio: figures?.sexRatio ?? null,
        density: figures?.density ?? null,
        figuresSource: census ? "Census of India 2011" : null,
        taluks: overview.taluks,
      },
      liveData: {
        weather: latestWeather,
        dam: latestDam,
        cropPrices: latestCrops,
        activeAlerts,
      },
      meta: {
        publisher: "ForThePeople.in",
        source: "Each item names its own source; the figures remain under that source's terms.",
        apiVersion: "1.1",
        generatedAt: new Date().toISOString(),
      },
    }, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[public/district API]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
