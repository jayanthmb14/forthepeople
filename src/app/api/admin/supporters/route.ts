/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    // Up to 500, like the Supporters page's own first load (take: 500), so a
    // reload after adding a supporter does not drop the oldest rows.
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "20") || 20));
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};
    const success = { status: "success" };
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Summary stats are computed in the database (they used to load every
    // successful row with all its columns just to add them up).
    const [supporters, total, all, month, recurringCount, tiers] = await Promise.all([
      prisma.supporter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.supporter.count({ where }),
      prisma.supporter.aggregate({ where: success, _count: { _all: true }, _sum: { amount: true } }),
      prisma.supporter.aggregate({ where: { ...success, createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
      prisma.supporter.count({ where: { ...success, isRecurring: true } }),
      prisma.supporter.groupBy({ by: ["tier"], where: success, _count: { _all: true } }),
    ]);
    const totalRevenue = all._sum.amount ?? 0;
    const thisMonthRevenue = month._sum.amount ?? 0;
    const tierCounts: Record<string, number> = Object.fromEntries(tiers.map((t) => [t.tier, t._count._all]));

    return NextResponse.json({
      supporters,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue,
        totalSupporters: all._count._all,
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
