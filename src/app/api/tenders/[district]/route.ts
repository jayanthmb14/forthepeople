// GET /api/tenders/[district]
// Lists tenders for a district with rich filtering.
// Query params:
//   status        — 'LIVE' | 'CLOSING_SOON' | 'AWARDED' | 'ARCHIVE' | raw status string
//   valueMin, valueMax  — in Rupees
//   category      — slug
//   authority     — shortCode
//   daysToDeadline — integer, caps bidSubmissionEnd window
//   mseReserved, startupExempt — 'true'
//   search        — substring match on title
//   page, pageSize, sortBy

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveDistrictName, serializeForJson } from "@/lib/tenders/tender-helpers";
import { parseTenderQuery } from "@/lib/tenders/list-query";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ district: string }> },
) {
  const { district: districtSlug } = await ctx.params;
  const districtName = await resolveDistrictName(districtSlug);
  if (!districtName) {
    return NextResponse.json({ error: { code: "DISTRICT_NOT_ACTIVE", message: `District '${districtSlug}' is not active.` } }, { status: 404 });
  }

  // Query string → where / order; malformed numbers are a 400 (src/lib/tenders/list-query.ts).
  const parsed = parseTenderQuery(new URL(req.url).searchParams, districtName);
  if (!parsed.ok) {
    return NextResponse.json({ error: { code: parsed.code, message: parsed.message } }, { status: 400 });
  }
  const { page, pageSize, where, orderBy } = parsed.query;

  const [total, tenders] = await Promise.all([
    prisma.tender.count({ where }),
    prisma.tender.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        authority: { select: { name: true, shortCode: true, authorityType: true } },
        category: { select: { name: true, slug: true } },
        redFlags: { select: { flagType: true, factualStatement: true } },
        _count: { select: { corrigenda: true, documents: true } },
      },
    }),
  ]);

  return NextResponse.json(serializeForJson({
    tenders,
    total,
    page,
    pageSize,
    districtName,
  }));
}
