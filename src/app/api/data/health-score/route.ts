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
import { storedWeights } from "@/lib/health-score";
import { isSlug, publicCacheControl } from "@/lib/read-api";

export const runtime = "nodejs";

const CACHE_SECONDS = 3600;

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  if (!districtSlug) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }
  if (!isSlug(districtSlug)) {
    return NextResponse.json({ error: "invalid district" }, { status: 400 });
  }

  const cacheKey = `ftp:health-score:${districtSlug}`;

  // 1. Redis cache
  try {
    const cached = redis ? await redis.get(cacheKey) : null;
    if (cached) {
      return NextResponse.json(
        typeof cached === "string" ? JSON.parse(cached) : cached,
        { headers: { "Cache-Control": publicCacheControl(CACHE_SECONDS) } }
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

  // The weights this grade was computed with (they depend on the district
  // type: a metro weighs infrastructure 13, agriculture 5), not the base set.
  const w = storedWeights(score.weights);
  const response = {
    overallScore: score.overallScore,
    grade: score.grade,
    trend: score.trend,
    previousScore: score.previousScore,
    categories: {
      governance:      { score: score.governance,      weight: w.governance },
      education:       { score: score.education,       weight: w.education },
      health:          { score: score.health,          weight: w.health },
      infrastructure:  { score: score.infrastructure,  weight: w.infrastructure },
      waterSanitation: { score: score.waterSanitation, weight: w.waterSanitation },
      economy:         { score: score.economy,         weight: w.economy },
      safety:          { score: score.safety,          weight: w.safety },
      agriculture:     { score: score.agriculture,     weight: w.agriculture },
      digitalAccess:   { score: score.digitalAccess,   weight: w.digitalAccess },
      citizenWelfare:  { score: score.citizenWelfare,  weight: w.citizenWelfare },
    },
    breakdown: score.breakdown,
    generatedAt: score.generatedAt,
    expiresAt: score.expiresAt,
  };

  try {
    if (redis) await redis.set(cacheKey, JSON.stringify(response), { ex: CACHE_SECONDS });
  } catch { /* non-fatal */ }

  return NextResponse.json(response, {
    headers: { "Cache-Control": publicCacheControl(CACHE_SECONDS) },
  });
}
