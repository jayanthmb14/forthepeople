/**
 * ForThePeople.in — Finance summary (combined revenue + expenses + subscriptions)
 * GET /api/admin/finance-summary
 * Redis cache: 5 minutes.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:admin:finance-summary";
const CACHE_TTL = 300;

export interface FinanceSummary {
  timestamp: string;
  revenue: {
    total: number;
    thisMonth: number;
    thisWeek: number;
    supporterCount: number;
    supportersThisWeek: number;
    trendPct: { month: number; week: number };
  };
  expense: {
    total: number;
    thisMonth: number;
    recurringMonthly: number;
  };
  pnl: {
    thisMonth: number;
    allTime: number;
  };
  subscriptions: {
    totalMonthlyINR: number;
    totalMonthlyUSD: number;
    paidCount: number;
    expiringSoon: number;
  };
  monthlyBreakdown: Array<{
    month: string; // "2026-04"
    revenue: number;
    expense: number;
    net: number;
  }>;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cached = await cacheGet<FinanceSummary>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const now = new Date();
  const startThisMonth = startOfMonthUTC(now);
  const startLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);
  const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  // ── Revenue
  const [allSupporters, weekSupporters, prevWeekCount] = await Promise.all([
    prisma.supporter.findMany({
      where: { status: "success" },
      select: { amount: true, createdAt: true },
    }),
    prisma.supporter.findMany({
      where: { status: "success", createdAt: { gte: sevenDaysAgo } },
      select: { amount: true },
    }),
    prisma.supporter.count({
      where: {
        status: "success",
        createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ]);

  const revenueTotal = allSupporters.reduce((s, x) => s + x.amount, 0);
  const revenueThisMonth = allSupporters
    .filter((x) => x.createdAt >= startThisMonth)
    .reduce((s, x) => s + x.amount, 0);
  const revenueLastMonth = allSupporters
    .filter((x) => x.createdAt >= startLastMonth && x.createdAt < startThisMonth)
    .reduce((s, x) => s + x.amount, 0);
  const revenueThisWeek = weekSupporters.reduce((s, x) => s + x.amount, 0);
  const weekTrendPct =
    prevWeekCount > 0
      ? ((weekSupporters.length - prevWeekCount) / prevWeekCount) * 100
      : weekSupporters.length > 0
      ? 100
      : 0;
  const monthTrendPct =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0
      ? 100
      : 0;

  // ── Expenses
  const allExpenses = await prisma.expense.findMany({
    select: { amountINR: true, date: true, isRecurring: true, recurringInterval: true },
  });
  const expenseTotal = allExpenses.reduce((s, x) => s + x.amountINR, 0);
  const expenseThisMonth = allExpenses
    .filter((x) => x.date >= startThisMonth)
    .reduce((s, x) => s + x.amountINR, 0);
  const recurringMonthly = allExpenses
    .filter((x) => x.isRecurring && x.recurringInterval === "monthly")
    .reduce((s, x) => s + x.amountINR, 0);

  // ── Subscriptions
  const subs = await prisma.subscription.findMany({
    where: { status: { not: "cancelled" } },
    select: {
      costINR: true,
      costUSD: true,
      billingCycle: true,
      expiryDate: true,
      renewalDate: true,
    },
  });
  let monthlyINR = 0;
  let monthlyUSD = 0;
  let paidCount = 0;
  let expiringSoon = 0;
  const thirtyDaysMs = 30 * 86_400_000;
  for (const s of subs) {
    const cost = s.costINR ?? 0;
    const usd = s.costUSD ?? 0;
    if (cost > 0 || usd > 0) paidCount++;
    if (s.billingCycle === "monthly") {
      monthlyINR += cost;
      monthlyUSD += usd;
    } else if (s.billingCycle === "yearly") {
      monthlyINR += cost / 12;
      monthlyUSD += usd / 12;
    }
    const exp = s.expiryDate ?? s.renewalDate;
    if (exp) {
      const diff = exp.getTime() - Date.now();
      if (diff >= 0 && diff <= thirtyDaysMs) expiringSoon++;
    }
  }

  // ── Monthly breakdown (last 12 months)
  const breakdownMap = new Map<string, { revenue: number; expense: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    breakdownMap.set(monthKey(d), { revenue: 0, expense: 0 });
  }
  for (const s of allSupporters) {
    if (s.createdAt < twelveMonthsAgo) continue;
    const k = monthKey(s.createdAt);
    const bucket = breakdownMap.get(k);
    if (bucket) bucket.revenue += s.amount;
  }
  for (const e of allExpenses) {
    if (e.date < twelveMonthsAgo) continue;
    const k = monthKey(e.date);
    const bucket = breakdownMap.get(k);
    if (bucket) bucket.expense += e.amountINR;
  }
  const monthlyBreakdown = Array.from(breakdownMap.entries()).map(([month, v]) => ({
    month,
    revenue: v.revenue,
    expense: v.expense,
    net: v.revenue - v.expense,
  }));

  const summary: FinanceSummary = {
    timestamp: new Date().toISOString(),
    revenue: {
      total: revenueTotal,
      thisMonth: revenueThisMonth,
      thisWeek: revenueThisWeek,
      supporterCount: allSupporters.length,
      supportersThisWeek: weekSupporters.length,
      trendPct: { month: monthTrendPct, week: weekTrendPct },
    },
    expense: {
      total: expenseTotal,
      thisMonth: expenseThisMonth,
      recurringMonthly,
    },
    pnl: {
      thisMonth: revenueThisMonth - expenseThisMonth,
      allTime: revenueTotal - expenseTotal,
    },
    subscriptions: {
      totalMonthlyINR: monthlyINR,
      totalMonthlyUSD: monthlyUSD,
      paidCount,
      expiringSoon,
    },
    monthlyBreakdown,
  };

  await cacheSet(CACHE_KEY, summary, CACHE_TTL);
  return NextResponse.json(summary);
}
