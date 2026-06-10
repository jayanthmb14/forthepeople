/**
 * ForThePeople.in — Admin Alerts API
 * GET    /api/admin/alerts?level=critical&read=false&source=scraper&sinceDays=7&district=mandya&limit=50&offset=0
 * PATCH  /api/admin/alerts — { ids: [...] } or { markAllRead: true }
 * DELETE /api/admin/alerts — { olderThanDays: number }
 *
 * Response also includes { emailConfigured } so the UI can show a warning if
 * RESEND_API_KEY / ADMIN_EMAIL are missing.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

type Source = "scraper" | "feedback" | "payment" | "system";

function sourceFilter(source: Source): Prisma.AdminAlertWhereInput {
  switch (source) {
    case "scraper":
      return {
        OR: [
          { title: { startsWith: "Scraper Failed" } },
          { title: { startsWith: "Cron Job Failed" } },
          { title: { startsWith: "Stale Data" } },
        ],
      };
    case "feedback":
      return { title: { contains: "Feedback" } };
    case "payment":
      return {
        OR: [
          { title: { contains: "Payment" } },
          { title: { contains: "Contribution" } },
        ],
      };
    case "system":
      return {
        AND: [
          { NOT: { title: { startsWith: "Scraper Failed" } } },
          { NOT: { title: { startsWith: "Cron Job Failed" } } },
          { NOT: { title: { startsWith: "Stale Data" } } },
          { NOT: { title: { contains: "Feedback" } } },
          { NOT: { title: { contains: "Payment" } } },
        ],
      };
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const level = sp.get("level");
  const read = sp.get("read");
  const source = sp.get("source") as Source | null;
  const sinceDays = Number(sp.get("sinceDays") || 0);
  const district = sp.get("district");
  const limit = Math.min(Number(sp.get("limit") || 50), 200);
  const offset = Number(sp.get("offset") || 0);

  const where: Prisma.AdminAlertWhereInput = {};
  if (level) where.level = level;
  if (read === "true") where.read = true;
  if (read === "false") where.read = false;
  if (district) where.district = district;
  if (sinceDays > 0) {
    where.createdAt = { gte: new Date(Date.now() - sinceDays * 86_400_000) };
  }
  if (source && ["scraper", "feedback", "payment", "system"].includes(source)) {
    Object.assign(where, sourceFilter(source));
  }

  const [alerts, total] = await Promise.all([
    prisma.adminAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.adminAlert.count({ where }),
  ]);

  return NextResponse.json({
    alerts,
    total,
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL),
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.markAllRead) {
    const result = await prisma.adminAlert.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return NextResponse.json({ updated: result.count });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    const result = await prisma.adminAlert.updateMany({
      where: { id: { in: body.ids } },
      data: { read: true },
    });
    return NextResponse.json({ updated: result.count });
  }

  return NextResponse.json({ error: "Provide ids array or markAllRead" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const days = Number(body.olderThanDays);
  if (!days || days < 1) {
    return NextResponse.json({ error: "olderThanDays must be >= 1" }, { status: 400 });
  }

  const cutoff = new Date(Date.now() - days * 86_400_000);
  const result = await prisma.adminAlert.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: result.count });
}
