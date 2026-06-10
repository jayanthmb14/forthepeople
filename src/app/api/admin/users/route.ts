/**
 * ForThePeople.in — Admin user management (foundation)
 * GET  /api/admin/users  — list users
 * POST /api/admin/users  — create user
 *
 * NOTE: This is scaffolding. Per-user login is not yet wired into the auth flow;
 * the legacy ADMIN_PASSWORD cookie still gates the admin panel. Roles here are
 * used for future UI filtering and role-based permissions.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAuditAuto } from "@/lib/audit-log";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_ROLES = new Set(["owner", "admin", "viewer"]);

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      totpEnabled: true,
      lastLoginAt: true,
      lastLoginIP: true,
      createdAt: true,
      createdBy: true,
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim();
  const email = body.email ? String(body.email).trim() : null;
  const password = String(body.password ?? "");
  const role = String(body.role ?? "viewer");
  const permissions = Array.isArray(body.permissions) ? body.permissions : [];

  if (!username || !password) {
    return NextResponse.json({ error: "username and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "username already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: {
      username,
      email,
      passwordHash,
      role,
      permissions: permissions as unknown as object,
      createdBy: "admin",
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAuditAuto({
    action: "user_create",
    resource: "AdminUser",
    resourceId: user.id,
    details: { username, role },
  });

  return NextResponse.json({ user });
}
