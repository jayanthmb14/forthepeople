/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Total money raised from successful supporter payments, for the admin
// screens (dashboard, system health, analytics, bot, weekly report). One SQL
// aggregate instead of loading every Supporter row and adding in JS, as
// five admin places did (Sept 2026 review). Amounts are rupees
// (Supporter.amount), not paise.
import { prisma } from "@/lib/db";

export interface SupporterTotal {
  /** Sum of Supporter.amount (₹) for successful payments. */
  amount: number;
  /** How many successful payments. */
  count: number;
}

/** Successful payments, all-time or since `since` (createdAt ≥ since). */
export async function supporterTotals(since?: Date): Promise<SupporterTotal> {
  const r = await prisma.supporter.aggregate({
    where: { status: "success", ...(since ? { createdAt: { gte: since } } : {}) },
    _sum: { amount: true },
    _count: true,
  });
  return { amount: r._sum.amount ?? 0, count: r._count };
}
