// GET /api/tenders/[district]/transparency
// Live + recent tenders that carry at least one red flag, grouped by flag type.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveDistrictName, serializeForJson } from "@/lib/tenders/tender-helpers";
import { NOT_STUB_TENDER } from "@/lib/data-filters";
import { redFlagsComputed } from "@/lib/tenders/tender-redflags";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ district: string }> }) {
  const { district: districtSlug } = await ctx.params;
  const districtName = await resolveDistrictName(districtSlug);
  if (!districtName) {
    return NextResponse.json({ error: { code: "DISTRICT_NOT_ACTIVE", message: `District '${districtSlug}' is not active.` } }, { status: 404 });
  }

  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400_000);

  // Until the red-flag check has run, an empty list means "not checked".
  const flagsChecked = await redFlagsComputed();
  const tenders = await prisma.tender.findMany({
    where: {
      locationDistrict: districtName,
      ...NOT_STUB_TENDER,
      publishedAt: { gte: sixtyDaysAgo },
      redFlags: { some: {} },
    },
    include: {
      authority: { select: { name: true, shortCode: true } },
      category: { select: { name: true, slug: true } },
      redFlags: true,
    },
    orderBy: { bidSubmissionEnd: "asc" },
    take: 100,
  });

  // Group by flagType
  const byFlag: Record<string, Array<{ tenderId: string; title: string; factualStatement: string; referenceRule: string | null; authority: string; value: string | null }>> = {};
  for (const t of tenders) {
    for (const flag of t.redFlags) {
      if (!byFlag[flag.flagType]) byFlag[flag.flagType] = [];
      byFlag[flag.flagType].push({
        tenderId: t.id,
        title: t.title,
        factualStatement: flag.factualStatement,
        referenceRule: flag.referenceRule,
        authority: t.authority?.name ?? "—",
        value: t.estimatedValueInr?.toString() ?? null,
      });
    }
  }

  return NextResponse.json(serializeForJson({
    districtName,
    flagGroups: byFlag,
    totalTenders: tenders.length,
    flagsChecked,
  }));
}
