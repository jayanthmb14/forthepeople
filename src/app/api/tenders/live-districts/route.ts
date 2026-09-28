// GET /api/tenders/live-districts
// Returns the set of districts where Tenders (Module 30) is live.
// Used by TenderLockedState to show "what's covered elsewhere".

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tendersCollectedFor } from "@/lib/constants/tender-portals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.district.findMany({
      where: { active: true, tendersActive: true },
      select: {
        slug: true,
        name: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      // Only districts the collector reads (tender-portals.ts).
      districts: rows.filter((d) => tendersCollectedFor(d.state.slug, d.slug)).map((d) => ({
        districtSlug: d.slug,
        districtName: d.name,
        stateSlug: d.state.slug,
        stateName: d.state.name,
      })),
    });
  } catch {
    return NextResponse.json({ districts: [] });
  }
}
