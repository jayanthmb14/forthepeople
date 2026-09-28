/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// GET /api/admin/payments — returns paid contributions with summary stats
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The list is the newest 100; the summary counts EVERY paid contribution
  // (it used to total only the paid ones among those 100).
  const [contributions, paid] = await Promise.all([
    prisma.contribution.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.contribution.aggregate({
      where: { status: "paid" },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);
  const totalPaise = paid._sum.amount ?? 0;

  return NextResponse.json({
    contributions,
    summary: {
      totalCount: paid._count._all,
      totalAmount: totalPaise, // in paise
      totalAmountRs: Math.round(totalPaise / 100),
    },
  });
}
