/**
 * PATCH /api/admin/supporters/[id]/flag
 *
 * Actions from the Flagged Names admin tab:
 *   - unflag   → keep current name, clear nameFlagged flag
 *   - restore  → set name = originalName (only if it passes validation), clear flag
 *   - rename   → set name = payload.name (validated), clear flag
 *   - delete   → hard-delete the supporter row
 *
 * Busts public contributor caches on any mutation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { logAuditAuto } from "@/lib/audit-log";
import { validateContributorName } from "@/lib/validators/contributor-name";

const CONTRIBUTOR_CACHE_KEYS = [
  "ftp:contributors:v1",
  "ftp:contributors:v2",
  "ftp:contributors:all",
  "ftp:contributors:leaderboard",
  "ftp:contributors:district-rankings",
  "ftp:contributors:top-tier",
  "ftp:contributors:top-tier:v3",
  "ftp:contributors:growth-trend",
];

async function bustCaches() {
  await Promise.all(CONTRIBUTOR_CACHE_KEYS.map((k) => cacheSet(k, null, 1)));
}

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
  const action = body.action as "unflag" | "restore" | "rename" | "delete" | undefined;

  const existing = await prisma.supporter.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "delete") {
    await prisma.supporter.delete({ where: { id } });
    await bustCaches();
    await logAuditAuto({
      action: "supporter_flag_delete",
      resource: "Supporter",
      resourceId: id,
      details: { name: existing.name, originalName: existing.originalName, tier: existing.tier },
    });
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (action === "unflag") {
    await prisma.supporter.update({
      where: { id },
      data: { nameFlagged: false },
    });
    await bustCaches();
    await logAuditAuto({
      action: "supporter_flag_approve",
      resource: "Supporter",
      resourceId: id,
      details: { name: existing.name },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    if (!existing.originalName) {
      return NextResponse.json({ error: "No original name to restore" }, { status: 400 });
    }
    const check = validateContributorName(existing.originalName);
    if (!check.ok) {
      return NextResponse.json(
        { error: `Original name still fails validation: ${check.reason}` },
        { status: 400 },
      );
    }
    await prisma.supporter.update({
      where: { id },
      data: { name: check.cleaned, nameFlagged: false, originalName: null },
    });
    await bustCaches();
    await logAuditAuto({
      action: "supporter_flag_restore",
      resource: "Supporter",
      resourceId: id,
      details: { restored: check.cleaned, from: existing.name },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "rename") {
    const check = validateContributorName(body.name);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
    await prisma.supporter.update({
      where: { id },
      data: { name: check.cleaned, nameFlagged: false },
    });
    await bustCaches();
    await logAuditAuto({
      action: "supporter_flag_rename",
      resource: "Supporter",
      resourceId: id,
      details: { renamed: check.cleaned, from: existing.name },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
