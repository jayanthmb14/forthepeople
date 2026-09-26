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
// Cache TTL: 7 days. When empty, returns nextRefreshDays info.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { cacheGet } from "@/lib/cache";

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days — must match cron TTL

interface TipsResponse {
  tips: Array<{
    category: string; icon: string; title: string;
    description: string; urgency: string;
  }>;
  month: number;
  year: number;
  generatedAt: string | null;
  generatedBy?: string;
  nextRefreshDays?: number;
}

// ── Route handler — READ-ONLY (public) ───────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtSlug = searchParams.get("district");

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const cacheKey = `ftp:ai:citizen-tips:${districtSlug}`;

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

  // Tips not generated yet — return metadata so UI can show "next refresh in X days"
  const now = new Date();
  // Next Sunday midnight UTC (weekly schedule)
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  const nextRefresh = new Date(now);
  nextRefresh.setUTCDate(nextRefresh.getUTCDate() + daysUntilSunday);
  nextRefresh.setUTCHours(6, 0, 0, 0); // Sunday 6AM UTC

  return NextResponse.json({
    tips: [],
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    generatedAt: null,
    nextRefreshDays: daysUntilSunday,
    nextRefreshDate: nextRefresh.toISOString(),
    fromCache: false,
  });
}
