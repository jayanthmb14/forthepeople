/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/dataset-dates?district=mandya
// For every dataset in src/lib/constants/dataset-collection.ts: how many
// rows we hold for the district and the date of the newest one (or the
// newest period: a year, a fiscal year, a month, a Census round).
// It counts rows the way the pages show them (news-derived Leader /
// CrimeStat / PowerOutage rows and non-local infrastructure are left out,
// as in /api/data/[module]). Read-only, one aggregate per table, cached.
// Response: { district, checkedAt, datasets: { <key>: { rows, newest, period, active? } } }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { collectDatasetDates } from "@/lib/dataset-dates";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import type { DatasetDatesPayload } from "@/lib/constants/dataset-collection";

const MODULE = "dataset-dates";
const TTL_SECONDS = 600;
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  if (!SLUG_RE.test(districtSlug)) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const key = cacheKey(districtSlug, MODULE);
  const headers = { "Cache-Control": `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}` };
  const cached = await cacheGet<DatasetDatesPayload>(key);
  if (cached) return NextResponse.json(cached, { headers });

  try {
    const district = await prisma.district.findFirst({ where: { slug: districtSlug }, select: { id: true, stateId: true } });
    if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });
    const payload: DatasetDatesPayload = {
      district: districtSlug,
      checkedAt: new Date().toISOString(),
      datasets: await collectDatasetDates(district.id, district.stateId),
    };
    await cacheSet(key, payload, TTL_SECONDS);
    return NextResponse.json(payload, { headers });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[API] dataset-dates error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
