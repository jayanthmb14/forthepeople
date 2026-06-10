/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
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

  const contributions = await prisma.contribution.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const paid = contributions.filter((c) => c.status === "paid");
  const totalPaise = paid.reduce((sum, c) => sum + c.amount, 0);

  return NextResponse.json({
    contributions,
    summary: {
      totalCount: paid.length,
      totalAmount: totalPaise, // in paise
      totalAmountRs: Math.round(totalPaise / 100),
    },
  });
}
