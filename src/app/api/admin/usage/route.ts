/**
 * ForThePeople.in — AI Usage Stats API
 * GET /api/admin/usage?from=2026-04-01&to=2026-04-12
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(Date.now() - 30 * 86_400_000);
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date();

  const where = { createdAt: { gte: from, lte: to } };

  const [logs, totalCalls] = await Promise.all([
    prisma.aIUsageLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.aIUsageLog.count({ where }),
  ]);

  const totalTokens = logs.reduce((s, l) => s + l.totalTokens, 0);
  const totalCostINR = logs.reduce((s, l) => s + l.costINR, 0);

  // Group by purpose
  const byPurpose: Record<string, { calls: number; tokens: number; costINR: number }> = {};
  for (const l of logs) {
    const p = l.purpose;
    if (!byPurpose[p]) byPurpose[p] = { calls: 0, tokens: 0, costINR: 0 };
    byPurpose[p].calls++;
    byPurpose[p].tokens += l.totalTokens;
    byPurpose[p].costINR += l.costINR;
  }

  // Group by day
  const byDay: Record<string, { calls: number; tokens: number; costINR: number }> = {};
  for (const l of logs) {
    const day = l.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { calls: 0, tokens: 0, costINR: 0 };
    byDay[day].calls++;
    byDay[day].tokens += l.totalTokens;
    byDay[day].costINR += l.costINR;
  }

  // Group by model. costUSD/costINR are the real per-call costs written by
  // src/lib/ai-provider.ts (rows logged before Sept 2026 carry 0).
  const byModel: Record<
    string,
    { calls: number; tokens: number; inputTokens: number; outputTokens: number; costUSD: number; costINR: number }
  > = {};
  for (const l of logs) {
    if (!byModel[l.model]) {
      byModel[l.model] = { calls: 0, tokens: 0, inputTokens: 0, outputTokens: 0, costUSD: 0, costINR: 0 };
    }
    byModel[l.model].calls++;
    byModel[l.model].tokens += l.totalTokens;
    byModel[l.model].inputTokens += l.inputTokens;
    byModel[l.model].outputTokens += l.outputTokens;
    byModel[l.model].costUSD += l.costUSD;
    byModel[l.model].costINR += l.costINR;
  }

  return NextResponse.json({
    totalCalls,
    totalTokens,
    totalCostINR,
    avgCostPerCall: totalCalls > 0 ? totalCostINR / totalCalls : 0,
    byPurpose: Object.entries(byPurpose).map(([purpose, v]) => ({ purpose, ...v })),
    byDay: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v })),
    byModel: Object.entries(byModel).map(([model, v]) => ({ model, ...v })),
  });
}
