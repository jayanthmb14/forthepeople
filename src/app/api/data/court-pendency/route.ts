/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/court-pendency?district=mandya&state=karnataka
// The courts page's data: the district's NJDG snapshot (cases waiting,
// how old they are, filed / decided per year, how long decisions took,
// the state's High Court), written by /api/cron/scrape-courts.
// When the snapshot is missing (Redis lost it, or the district has not
// been read yet) it also sends the CourtStat rows that collector wrote
// ("NJDG district dashboard · read <date>") so the page still has this
// year's figures. Hand-seeded CourtStat rows (no source, round numbers)
// are never sent.
// Read-only. Response:
//   { data: { covered, snapshot, rows }, meta: { module, district, updatedAt, lastUpdated } }
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { hasNjdgSource } from "@/lib/courts/sources";
import { readCourtsSnapshot } from "@/lib/courts/store";
import { courtStatReadDate } from "@/lib/courts/snapshot";
import { NJDG_COURTSTAT } from "@/lib/data-filters";

const MODULE = "court-pendency";
const TTL_SECONDS = 600;
const SLUG_RE = /^[a-z0-9-]{1,64}$/;

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district") ?? "";
  if (!SLUG_RE.test(districtSlug)) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  try {
    const meta = { module: MODULE, district: districtSlug, updatedAt: new Date().toISOString(), fromCache: false };
    const covered = hasNjdgSource(districtSlug);
    const snapshot = covered ? await readCourtsSnapshot(districtSlug) : null;

    let rows: Array<{ courtName: string; year: number; filed: number; disposed: number; pending: number; readOn: string | null }> = [];
    if (covered && !snapshot) {
      const district = await prisma.district.findFirst({ where: { slug: districtSlug }, select: { id: true } });
      if (district) {
        const found = await prisma.courtStat.findMany({
          where: { districtId: district.id, ...NJDG_COURTSTAT },
          orderBy: [{ year: "desc" }, { courtName: "asc" }],
          take: 60,
        });
        rows = found.map((r) => ({
          courtName: r.courtName,
          year: r.year,
          filed: r.filed,
          disposed: r.disposed,
          pending: r.pending,
          readOn: courtStatReadDate(r.source),
        }));
      }
    }

    const lastUpdated = snapshot?.fetchedAt ?? rows.map((r) => r.readOn).filter(Boolean).sort().at(-1) ?? null;
    const resp = NextResponse.json({ data: { covered, snapshot, rows }, meta: { ...meta, lastUpdated } });
    resp.headers.set("Cache-Control", `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}`);
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error(`[API] ${MODULE} error:`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
