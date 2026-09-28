/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Scheme coverage — /api/data/scheme-coverage?district=mandya
// For every scheme listed for this district, the OTHER live districts on
// ForThePeople.in that list a scheme with the same name (names compared
// without case, spaces or punctuation: "Ayushman Bharat - PM-JAY" =
// "Ayushman Bharat — PMJAY"). The schemes page shows it as "also listed
// for Mumbai, Pune …" under "Where it runs". Read-only Prisma; cached 1 h.
// Response: { data: { [key]: { districts: [{slug,name,stateSlug,stateName}] } }, meta }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";
import { publicCacheControl } from "@/lib/read-api";

const TTL = 3600;

/** Same rule as the page (schemeKey in schemes/scheme-kinds.ts). */
function schemeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type Place = { slug: string; name: string; stateSlug: string; stateName: string };

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const key = cacheKey(districtSlug, "scheme-coverage");
  const cached = await cacheGet<{ data: unknown; meta: Record<string, unknown> }>(key);
  if (cached) {
    const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
    resp.headers.set("Cache-Control", publicCacheControl(TTL));
    return resp;
  }

  try {
    const meta = { module: "scheme-coverage", district: districtSlug, updatedAt: new Date().toISOString(), fromCache: false };
    const district = await prisma.district.findFirst({ where: { slug: districtSlug }, select: { id: true } });
    if (!district) return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });

    const own = await prisma.scheme.findMany({ where: { districtId: district.id, active: true }, select: { name: true } });
    const wanted = new Set(own.map((s) => schemeKey(s.name)).filter(Boolean));

    const data: Record<string, { districts: Place[] }> = {};
    if (wanted.size > 0) {
      // Every scheme row in another live district. The table is small
      // (a few hundred rows), so matching the names here is cheaper than
      // one query per scheme.
      const rows = await prisma.scheme.findMany({
        where: { districtId: { not: district.id }, active: true, district: { active: true } },
        select: {
          name: true,
          district: { select: { slug: true, name: true, state: { select: { slug: true, name: true } } } },
        },
      });
      for (const r of rows) {
        const k = schemeKey(r.name);
        if (!wanted.has(k) || !r.district) continue;
        const list = (data[k] ??= { districts: [] }).districts;
        if (!list.some((p) => p.slug === r.district!.slug)) {
          list.push({ slug: r.district.slug, name: r.district.name, stateSlug: r.district.state.slug, stateName: r.district.state.name });
        }
      }
      for (const v of Object.values(data)) v.districts.sort((a, b) => a.stateName.localeCompare(b.stateName) || a.name.localeCompare(b.name));
    }

    const result = { data, meta };
    await cacheSet(key, result, TTL);
    const resp = NextResponse.json(result);
    resp.headers.set("Cache-Control", publicCacheControl(TTL));
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[API] scheme-coverage error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
