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
import type { Prisma } from "@/generated/prisma";
import { NOT_STUB_TENDER } from "@/lib/data-filters";

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

  const { searchParams } = new URL(req.url);
  const statusArg = searchParams.get("status") ?? "LIVE";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const sortBy = searchParams.get("sortBy") ?? "deadline";
  const search = searchParams.get("search")?.trim();

  // Seeded placeholder rows are never listed (data-filters.ts, Sept 2026 audit).
  const where: Prisma.TenderWhereInput = { locationDistrict: districtName, ...NOT_STUB_TENDER };

  // Primary status bucket
  const now = new Date();
  if (statusArg === "LIVE") where.bidSubmissionEnd = { gte: now };
  else if (statusArg === "CLOSING_SOON") where.bidSubmissionEnd = { gte: now, lte: new Date(now.getTime() + 48 * 3600_000) };
  else if (statusArg === "AWARDED") where.status = "AWARDED";
  else if (statusArg === "ARCHIVE") where.bidSubmissionEnd = { lt: now };
  else where.status = statusArg;

  // Facets
  const valueMin = searchParams.get("valueMin");
  const valueMax = searchParams.get("valueMax");
  if (valueMin || valueMax) {
    where.estimatedValueInr = {};
    if (valueMin) (where.estimatedValueInr as Prisma.BigIntFilter).gte = BigInt(valueMin);
    if (valueMax) (where.estimatedValueInr as Prisma.BigIntFilter).lte = BigInt(valueMax);
  }
  const categorySlug = searchParams.get("category");
  if (categorySlug) where.category = { slug: categorySlug };
  const authorityCode = searchParams.get("authority");
  if (authorityCode) where.authority = { shortCode: authorityCode };
  const daysToDeadline = searchParams.get("daysToDeadline");
  if (daysToDeadline) {
    where.bidSubmissionEnd = {
      ...(where.bidSubmissionEnd as Prisma.DateTimeFilter),
      lte: new Date(now.getTime() + parseInt(daysToDeadline, 10) * 86400_000),
    };
  }
  if (searchParams.get("mseReserved") === "true") where.mseReserved = true;
  if (searchParams.get("startupExempt") === "true") where.startupExempt = true;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const orderBy: Prisma.TenderOrderByWithRelationInput =
    sortBy === "value" ? { estimatedValueInr: "desc" } :
    sortBy === "published" ? { publishedAt: "desc" } :
    { bidSubmissionEnd: "asc" };

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
