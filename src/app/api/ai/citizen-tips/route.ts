/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — AI Citizen Tips (READ-ONLY)
// GET /api/ai/citizen-tips?district=mandya
// Serves ONLY from Redis cache — never generates live AI on public GET.
// Tips are generated weekly by /api/cron/generate-citizen-tips (cron).
// Cache TTL: 7 days. When empty, returns no tips and no promised date.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { citizenTipsKey } from "@/lib/citizen-tips";
import { cacheGet } from "@/lib/cache";

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days — must match cron TTL

interface TipsResponse {
  tips: Array<{
    category: string; icon: string; title: string;
    description: string; urgency: string;
  }>;
  month: number | null;
  year: number | null;
  generatedAt: string | null;
  generatedBy?: string;
}

// ── Route handler — READ-ONLY (public) ───────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtSlug = searchParams.get("district");

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const cacheKey = citizenTipsKey(districtSlug);

  const cached = await cacheGet<TipsResponse>(cacheKey);
  if (cached && cached.tips && cached.tips.length > 0) {
    return NextResponse.json(
      { ...cached, fromCache: true },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL}`,
        },
      }
    );
  }

  // No tips stored. Say nothing about when new ones come: the weekly cron
  // has not written any since the AI provider broke in Aug 2026, and a
  // computed "next Sunday" promised tips that never came (Sept 2026 audit).
  // No month either, so the page does not label an empty list "September".
  return NextResponse.json({
    tips: [],
    month: null,
    year: null,
    generatedAt: null,
    fromCache: false,
  });
}
