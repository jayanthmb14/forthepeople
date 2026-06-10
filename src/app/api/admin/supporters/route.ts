/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};
    const [supporters, total] = await Promise.all([
      prisma.supporter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supporter.count({ where }),
    ]);

    // Summary stats
    const allSuccess = await prisma.supporter.findMany({ where: { status: "success" } });
    const totalRevenue = allSuccess.reduce((s, x) => s + x.amount, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thisMonthRevenue = allSuccess
      .filter((x) => x.createdAt >= thisMonth)
      .reduce((s, x) => s + x.amount, 0);
    const recurringCount = allSuccess.filter((x) => x.isRecurring).length;

    const tierCounts: Record<string, number> = {};
    allSuccess.forEach((x) => {
      tierCounts[x.tier] = (tierCounts[x.tier] ?? 0) + 1;
    });

    return NextResponse.json({
      supporters,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue,
        totalSupporters: allSuccess.length,
        thisMonthRevenue,
        recurringCount,
        tierCounts,
      },
    });
  } catch (err) {
    console.error("[admin/supporters GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
