/**
 * PATCH /api/admin/supporters/[id]/flag-message
 *
 * Actions:
 *   - keep-cleared → keep message=null, clear messageFlagged flag (discards original)
 *   - restore      → set message=originalMessage (if passes validator), clear flag
 *
 * NEVER deletes the Supporter row — paid-supporter policy.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";
import { bustSupporterCaches } from "@/lib/supporter-cache";

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
  const action = body.action as "keep-cleared" | "restore" | undefined;

  const existing = await prisma.supporter.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "keep-cleared") {
    await prisma.supporter.update({
      where: { id },
      data: { messageFlagged: false, originalMessage: null },
    });
    await bustSupporterCaches();
    await logAuditAuto({
      action: "supporter_message_keep_cleared",
      resource: "Supporter",
      resourceId: id,
      details: { originalCleared: existing.originalMessage },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    if (!existing.originalMessage) {
      return NextResponse.json({ error: "No original message to restore" }, { status: 400 });
    }
    const check = validateSupporterMessage(existing.originalMessage);
    if (!check.ok) {
      return NextResponse.json(
        { error: `Original message still fails validation: ${check.reason}` },
        { status: 400 },
      );
    }
    await prisma.supporter.update({
      where: { id },
      data: { message: check.cleaned, messageFlagged: false, originalMessage: null },
    });
    await bustSupporterCaches();
    await logAuditAuto({
      action: "supporter_message_restore",
      resource: "Supporter",
      resourceId: id,
      details: { restored: check.cleaned },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
