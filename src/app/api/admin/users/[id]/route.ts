/**
 * ForThePeople.in — Admin user update / deactivate
 * PATCH  /api/admin/users/[id]
 * DELETE /api/admin/users/[id] — soft delete (isActive=false)
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_ROLES = new Set(["owner", "admin", "viewer"]);

type Ctx = { params: Promise<{ id: string }> };

async function isAuthed(): Promise<boolean> {
  const { ok } = await requireAdmin();
  return ok;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!VALID_ROLES.has(body.role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }
    data.role = body.role;
  }
  if (body.email !== undefined) data.email = body.email || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (Array.isArray(body.permissions)) data.permissions = body.permissions;
  if (typeof body.password === "string" && body.password.length >= 8) {
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  const user = await prisma.adminUser.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await logAuditAuto({
    action: "user_update",
    resource: "AdminUser",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.adminUser.update({ where: { id }, data: { isActive: false } });
  await logAuditAuto({ action: "user_deactivate", resource: "AdminUser", resourceId: id });
  return NextResponse.json({ ok: true });
}
