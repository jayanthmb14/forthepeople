/**
 * GET  /api/admin/responsibility?district=<slug>&unverifiedOnly=1
 * POST /api/admin/responsibility
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district");
  const unverifiedOnly = sp.get("unverifiedOnly") === "1";

  const where: {
    phoneVerified?: boolean;
    district?: { slug: string };
  } = {};
  if (unverifiedOnly) where.phoneVerified = false;
  if (districtSlug) where.district = { slug: districtSlug };

  const items = await prisma.responsibilityItem.findMany({
    where,
    orderBy: [{ sectionOrder: "asc" }, { itemOrder: "asc" }],
    include: { district: { select: { slug: true, name: true } } },
  });

  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: { items, districts } });
}

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.districtId || !body.section || !body.action || !body.whyRelevant) {
    return NextResponse.json(
      { error: "districtId, section, action, whyRelevant required" },
      { status: 400 },
    );
  }

  const item = await prisma.responsibilityItem.create({
    data: {
      districtId: String(body.districtId),
      section: String(body.section),
      sectionIcon: String(body.sectionIcon ?? ""),
      sectionOrder: Number(body.sectionOrder ?? 99),
      action: String(body.action),
      whyRelevant: String(body.whyRelevant),
      reportToName: body.reportToName ?? null,
      reportToUrl: body.reportToUrl ?? null,
      reportToPhone: body.reportToPhone ?? null,
      phoneVerified: Boolean(body.phoneVerified ?? false),
      sourceNotes: body.sourceNotes ?? null,
      itemOrder: Number(body.itemOrder ?? 99),
      active: body.active !== false,
    },
  });

  await logAuditAuto({
    action: "responsibility_create",
    resource: "ResponsibilityItem",
    resourceId: item.id,
    details: { section: item.section, districtId: item.districtId },
  });

  return NextResponse.json({ data: item });
}
