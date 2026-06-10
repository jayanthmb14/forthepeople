/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// GET /api/admin/scraper-logs — returns last 50 scraper log entries
// DELETE /api/admin/scraper-logs?olderThanDays=30 — purge old logs (cookie-auth)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.scraperLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      jobName: true,
      status: true,
      startedAt: true,
      completedAt: true,
      duration: true,
      recordsNew: true,
      recordsUpdated: true,
      error: true,
    },
  });

  return NextResponse.json({ logs });
}

export async function DELETE(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Number(req.nextUrl.searchParams.get("olderThanDays") ?? 30);
  if (!days || days < 1) {
    return NextResponse.json({ error: "olderThanDays must be >= 1" }, { status: 400 });
  }
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const result = await prisma.scraperLog.deleteMany({
    where: { startedAt: { lt: cutoff } },
  });
  return NextResponse.json({ deleted: result.count });
}
