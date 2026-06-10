/**
 * ForThePeople.in — Update log viewer
 * GET /api/admin/update-log?source=&districtId=&moduleName=&from=&to=&page=1&limit=50
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

  const where: Prisma.UpdateLogWhereInput = {};
  if (sp.get("source")) where.source = sp.get("source")!;
  if (sp.get("districtId")) where.districtId = sp.get("districtId")!;
  if (sp.get("moduleName")) where.moduleName = sp.get("moduleName")!;
  if (sp.get("tableName")) where.tableName = sp.get("tableName")!;
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [entries, total] = await Promise.all([
    prisma.updateLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip,
    }),
    prisma.updateLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, limit });
}
