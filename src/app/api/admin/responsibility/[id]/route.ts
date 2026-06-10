/**
 * PATCH  /api/admin/responsibility/[id]  update
 * DELETE /api/admin/responsibility/[id]  hard delete
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const MUTABLE_FIELDS = [
  "section",
  "sectionIcon",
  "sectionOrder",
  "action",
  "whyRelevant",
  "reportToName",
  "reportToUrl",
  "reportToPhone",
  "phoneVerified",
  "sourceNotes",
  "itemOrder",
  "active",
] as const;

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of MUTABLE_FIELDS) {
    if (k in body) data[k] = body[k];
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No mutable fields provided" }, { status: 400 });
  }

  const updated = await prisma.responsibilityItem.update({ where: { id }, data });
  await logAuditAuto({
    action: "responsibility_update",
    resource: "ResponsibilityItem",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await prisma.responsibilityItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.responsibilityItem.delete({ where: { id } });
  await logAuditAuto({
    action: "responsibility_delete",
    resource: "ResponsibilityItem",
    resourceId: id,
    details: { section: existing.section, districtId: existing.districtId },
  });
  return NextResponse.json({ ok: true });
}
