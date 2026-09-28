// GET /api/tenders/[state]/disclaimer
// Returns disclaimer rows for the tenders module. Composition rule:
//   1. All rows where docType='disclaimer' AND stateSlug=null (universal)
//   2. Then rows where docType='disclaimer' AND stateSlug=<currentState>
// Universal clauses always render first; state-specific clauses append.
// Both are ordered by orderIndex within their bucket.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ state: string }> },
) {
  const { state: stateSlug } = await ctx.params;

  try {
    const [universal, stateSpecific] = await Promise.all([
      prisma.tenderEducationContent.findMany({
        where: { docType: "disclaimer", stateSlug: null },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.tenderEducationContent.findMany({
        where: { docType: "disclaimer", stateSlug },
        orderBy: { orderIndex: "asc" },
      }),
    ]);

    return NextResponse.json({
      stateSlug,
      universal: universal.map((r) => ({ slug: r.slug, title: r.title, bodyMd: r.bodyMd })),
      stateSpecific: stateSpecific.map((r) => ({ slug: r.slug, title: r.title, bodyMd: r.bodyMd })),
    });
  } catch (err) {
    // The detail goes to the log only; the public answer never carries database text.
    console.error("[api/tenders/disclaimer]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
