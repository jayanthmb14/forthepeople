/**
 * PATCH /api/admin/suggestions/[id]   update status / admin notes
 * DELETE /api/admin/suggestions/[id]  hard-delete suggestion
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";

const VALID_STATUSES = new Set([
  "PENDING",
  "REVIEWED",
  "ACCEPTED",
  "REJECTED",
  "SPAM",
  "IMPLEMENTED",
]);

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

  const data: { status?: string; adminNotes?: string | null } = {};
  if (typeof body.status === "string" && VALID_STATUSES.has(body.status)) {
    data.status = body.status;
  }
  if (typeof body.adminNotes === "string") {
    data.adminNotes = body.adminNotes.slice(0, 2000);
  } else if (body.adminNotes === null) {
    data.adminNotes = null;
  }
  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // @ts-expect-error — status is a Prisma enum; runtime-validated above.
  const updated = await prisma.suggestion.update({ where: { id }, data });

  await logAuditAuto({
    action: "suggestion_update",
    resource: "Suggestion",
    resourceId: id,
    details: { ...data },
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
  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.suggestion.delete({ where: { id } });
  await logAuditAuto({
    action: "suggestion_delete",
    resource: "Suggestion",
    resourceId: id,
    details: { title: existing.title, status: existing.status },
  });
  return NextResponse.json({ ok: true });
}
