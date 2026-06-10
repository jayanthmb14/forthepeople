/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed(): Promise<boolean> {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const district = searchParams.get("district");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (district) where.district = { name: { contains: district, mode: "insensitive" } };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { district: { select: { name: true } } },
      }),
      prisma.feedback.count({ where }),
    ]);

    // Summary stats
    const [totalCount, newCount, bugCount, ratingAgg] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "new" } }),
      prisma.feedback.count({ where: { type: { in: ["bug", "wrong_data"] } } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, where: { rating: { not: null } } }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalCount,
        newCount,
        bugCount,
        avgRating: ratingAgg._avg.rating,
      },
    });
  } catch (err) {
    console.error("[admin/feedback GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json() as {
      id: string;
      status?: string;
      adminNote?: string;
      replyText?: string;
    };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updated = await prisma.feedback.update({
      where: { id: body.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.adminNote !== undefined && { adminNote: body.adminNote }),
        ...(body.replyText !== undefined && {
          replyText: body.replyText,
          repliedAt: new Date(),
          status: "resolved",
        }),
      },
    });
    return NextResponse.json({ feedback: updated });
  } catch (err) {
    console.error("[admin/feedback PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
