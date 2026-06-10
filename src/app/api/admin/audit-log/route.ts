/**
 * ForThePeople.in — Audit log viewer
 * GET /api/admin/audit-log?page=1&limit=50&action=&from=&to=
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(200, Number(sp.get("limit") ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.AdminAuditLogWhereInput = {};
  const action = sp.get("action");
  const adminUserId = sp.get("adminUserId");
  const from = sp.get("from");
  const to = sp.get("to");
  const resource = sp.get("resource");

  if (action) where.action = action;
  if (adminUserId) where.adminUserId = adminUserId;
  if (resource) where.resource = resource;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [entries, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        actorLabel: true,
        adminUserId: true,
        action: true,
        resource: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        timestamp: true,
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, limit });
}
