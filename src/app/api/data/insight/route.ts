/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Pre-computed Module Insight API
// GET /api/data/insight?module=crops&district=mandya
// Serves from AIModuleInsight DB table (near-zero latency)
// Redis cache: 5 min | Falls back to null if not yet generated
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_TTL = 5 * 60; // 5 minutes

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const moduleSlug = sp.get("module") ?? "";
  const districtSlug = sp.get("district") ?? "";

  if (!moduleSlug || !districtSlug) {
    return NextResponse.json({ error: "module and district required" }, { status: 400 });
  }

  const cacheKey = `ftp:insight:${districtSlug}:${moduleSlug}`;

  // 1. Redis cache hit
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(
      { insight: cached, fromCache: true },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600` } }
    );
  }

  // 2. DB lookup
  try {
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true },
    });
    if (!district) {
      return NextResponse.json({ insight: null });
    }

    const row = await prisma.aIModuleInsight.findUnique({
      where: { districtId_module: { districtId: district.id, module: moduleSlug } },
      select: {
        severity: true,
        opinion: true,
        recommendation: true,
        aiProvider: true,
        aiModel: true,
        generatedAt: true,
        expiresAt: true,
      },
    });

    if (!row) {
      return NextResponse.json({ insight: null });
    }

    const insight = {
      severity: row.severity,
      opinion: row.opinion,
      recommendation: row.recommendation,
      aiProvider: row.aiProvider,
      aiModel: row.aiModel,
      generatedAt: row.generatedAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString() ?? null,
      fromCache: false,
    };

    await cacheSet(cacheKey, insight, CACHE_TTL);

    return NextResponse.json(
      { insight },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600` } }
    );
  } catch (err) {
    console.error("[insight]", err);
    return NextResponse.json({ insight: null });
  }
}
