/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Public read-only JSON API for AI crawlers and third-party apps
// Returns a structured snapshot of a district's key metrics
// No authentication required; rate-limited by Vercel Edge

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OFFICIAL_ALERTS, shownCropPrices } from "@/lib/data-filters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;

  try {
    const [overview, latestWeather, latestDam, latestCrops, activeAlerts] = await Promise.all([
      prisma.district.findFirst({
        where: { slug: district },
        select: {
          name: true, nameLocal: true, tagline: true,
          population: true, area: true, literacy: true, sexRatio: true,
          taluks: { select: { name: true, slug: true } },
        },
      }),
      prisma.weatherReading.findFirst({
        where: { district: { slug: district } },
        orderBy: { recordedAt: "desc" },
        select: { temperature: true, conditions: true, humidity: true, windSpeed: true, rainfall: true, recordedAt: true },
      }),
      prisma.damReading.findFirst({
        where: { district: { slug: district } },
        orderBy: { recordedAt: "desc" },
        select: { damName: true, storagePct: true, waterLevel: true, maxLevel: true, storage: true, maxStorage: true, inflow: true, outflow: true, recordedAt: true },
      }),
      prisma.cropPrice.findMany({
        where: { district: { slug: district }, ...shownCropPrices(district) },
        orderBy: { date: "desc" },
        take: 5,
        distinct: ["commodity"],
        select: { commodity: true, market: true, modalPrice: true, minPrice: true, maxPrice: true, date: true },
      }),
      prisma.localAlert.findMany({
        where: { district: { slug: district }, active: true, ...OFFICIAL_ALERTS },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { title: true, severity: true, type: true, description: true, createdAt: true },
      }),
    ]);

    if (!overview) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    return NextResponse.json({
      district: overview,
      liveData: {
        weather: latestWeather,
        dam: latestDam,
        cropPrices: latestCrops,
        activeAlerts,
      },
      meta: {
        source: "ForThePeople.in",
        license: "NDSAP Open Data Policy 2012",
        apiVersion: "1.0",
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
