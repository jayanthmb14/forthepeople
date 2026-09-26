/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/health-score?district=mandya
// Returns pre-computed district health score with breakdown
// Redis cache: 1 hour
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  if (!districtSlug) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }

  const cacheKey = `ftp:health-score:${districtSlug}`;

  // 1. Redis cache
  try {
    const cached = redis ? await redis.get(cacheKey) : null;
    if (cached) {
      return NextResponse.json(
        typeof cached === "string" ? JSON.parse(cached) : cached,
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
      );
    }
  } catch { /* non-fatal */ }

  // 2. DB lookup
  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  const score = await prisma.districtHealthScore.findUnique({
    where: { districtId: district.id },
  });

  if (!score) {
    return NextResponse.json({ score: null, message: "Score calculating…" });
  }

  const response = {
    overallScore: score.overallScore,
    grade: score.grade,
    trend: score.trend,
    previousScore: score.previousScore,
    categories: {
      governance:      { score: score.governance,      weight: 15 },
      education:       { score: score.education,       weight: 12 },
      health:          { score: score.health,          weight: 12 },
      infrastructure:  { score: score.infrastructure,  weight: 12 },
      waterSanitation: { score: score.waterSanitation, weight: 10 },
      economy:         { score: score.economy,         weight: 10 },
      safety:          { score: score.safety,          weight: 10 },
      agriculture:     { score: score.agriculture,     weight: 8  },
      digitalAccess:   { score: score.digitalAccess,   weight: 5  },
      citizenWelfare:  { score: score.citizenWelfare,  weight: 6  },
    },
    breakdown: score.breakdown,
    generatedAt: score.generatedAt,
    expiresAt: score.expiresAt,
  };

  try {
    if (redis) await redis.set(cacheKey, JSON.stringify(response), { ex: 3600 });
  } catch { /* non-fatal */ }

  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
