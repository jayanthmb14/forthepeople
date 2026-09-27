/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/dam-history?district=mandya
// Every stored reading for the district's dams (the collector keeps the
// newest 48 per dam), newest first. The water page uses it for each dam's
// storage trend; /api/data/water only sends the newest 20 readings in all.
// Read-only, cached like the other data routes.
// Response: { data: DamReading[], meta: { module, district, updatedAt, fromCache, lastUpdated } }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";

const MODULE = "dam-history";
const TTL_SECONDS = 300;
/** 48 readings per dam is what the collector keeps; this covers several dams. */
const MAX_ROWS = 240;
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

type Payload = { data: unknown; meta: Record<string, unknown> };

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  if (!SLUG_RE.test(districtSlug)) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const key = cacheKey(districtSlug, MODULE);
  const cached = await cacheGet<Payload>(key);
  if (cached) {
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}`);
    return resp;
  }

  try {
    const meta = { module: MODULE, district: districtSlug, updatedAt: new Date().toISOString(), fromCache: false };
    const district = await prisma.district.findFirst({ where: { slug: districtSlug }, select: { id: true } });
    let result: Payload;
    if (!district) {
      result = { data: null, meta: { ...meta, error: "District not found" } };
    } else {
      const data = await prisma.damReading.findMany({
        where: { districtId: district.id },
        orderBy: { recordedAt: "desc" },
        take: MAX_ROWS,
      });
      result = { data, meta: { ...meta, lastUpdated: data[0]?.recordedAt?.toISOString() ?? null } };
      await cacheSet(key, result, TTL_SECONDS);
    }
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}`);
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error(`[API] ${MODULE} error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
