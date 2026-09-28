/**
 * ForThePeople.in — AI platform analysis
 * Gathers the last 7 days of platform activity and asks Gemini 2.5 Pro to produce
 * a concise health report with action items + cost tips. Stored in PlatformReport.
 *
 * Each run costs roughly $0.01 (one Gemini 2.5 Pro call). Triggered by:
 *   - Weekly cron: /api/cron/platform-report
 *   - Admin manual trigger: POST /api/admin/platform-report?confirm=true
 */

import { prisma } from "@/lib/db";
import { callAIJSON } from "@/lib/ai-provider";
import { cacheGet } from "@/lib/cache";
import { INR_PER_USD } from "@/lib/ai-models";
import { supporterTotals } from "@/lib/supporter-totals";

export interface PlatformReportActionItem {
  priority: number;
  title: string;
  description: string;
}

export interface PlatformReportCostTip {
  tip: string;
  estimatedSaving: string;
  priority: "high" | "medium" | "low";
}

export interface AIReportResponse {
  summary: string;
  actionItems: PlatformReportActionItem[];
  costTips: PlatformReportCostTip[];
  growthInsights?: string;
}

/** Approx Gemini 2.5 Pro cost per 1M input tokens (USD). Used to snapshot run cost. */
const GEMINI_25_PRO_INPUT_RATE_USD = 1.25;

interface DataSnapshot {
  timeframeDays: number;
  activeDistricts: number;
  scraperSuccessRate: number;
  scraperTotal: number;
  scraperFailures: number;
  commonErrors: Array<{ jobName: string; error: string; count: number }>;
  revenueThisWeekINR: number;
  supportersThisWeek: number;
  revenueAllTimeINR: number;
  expenseThisMonthINR: number;
  monthlyServiceCostINR: number;
  feedbackThisWeek: { total: number; byType: Record<string, number> };
  topFeatureRequests: Array<{ title: string; votes: number; status: string }>;
  topDistrictRequests: Array<{ stateName: string; districtName: string; requestCount: number }>;
  pendingReviews: number;
  openRouterSpendUSD: number | null;
  openRouterLimitUSD: number | null;
}

async function gatherData(): Promise<DataSnapshot> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    scraperAll,
    scraperSuccess,
    scraperFail,
    failedLogs,
    weekSupporters,
    allSupporters,
    thirtyDayExpense,
    weekFeedback,
    topFeatures,
    topDistricts,
    pendingReviews,
    subs,
    activeDistricts,
    openRouterCached,
  ] = await Promise.all([
    prisma.scraperLog.count({ where: { startedAt: { gte: sevenDaysAgo } } }),
    prisma.scraperLog.count({ where: { startedAt: { gte: sevenDaysAgo }, status: "success" } }),
    prisma.scraperLog.count({ where: { startedAt: { gte: sevenDaysAgo }, status: "error" } }),
    prisma.scraperLog.findMany({
      where: { startedAt: { gte: sevenDaysAgo }, status: "error" },
      select: { jobName: true, error: true },
      take: 100,
    }),
    supporterTotals(sevenDaysAgo),
    supporterTotals(),
    prisma.expense.aggregate({
      _sum: { amountINR: true },
      where: { date: { gte: thirtyDaysAgo } },
    }),
    prisma.feedback.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { type: true },
    }),
    prisma.featureRequest.findMany({
      orderBy: { votes: "desc" },
      take: 5,
      select: { title: true, votes: true, status: true },
    }),
    prisma.districtRequest.findMany({
      orderBy: { requestCount: "desc" },
      take: 5,
      select: { stateName: true, districtName: true, requestCount: true },
    }),
    prisma.reviewQueue.count({ where: { status: "pending" } }),
    prisma.subscription.findMany({
      where: { status: { not: "cancelled" } },
      select: { costINR: true, billingCycle: true },
    }),
    prisma.district.count({ where: { active: true } }),
    cacheGet<{ spent: number; limit: number | null }>("ftp:admin:openrouter-usage"),
  ]);

  // Group failed jobs by (jobName, normalized error) → top 5 most common.
  const errGroups = new Map<string, { jobName: string; error: string; count: number }>();
  for (const l of failedLogs) {
    const key = `${l.jobName}::${(l.error ?? "").slice(0, 80)}`;
    const existing = errGroups.get(key);
    if (existing) existing.count++;
    else errGroups.set(key, { jobName: l.jobName, error: (l.error ?? "").slice(0, 140), count: 1 });
  }
  const commonErrors = Array.from(errGroups.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const feedbackByType: Record<string, number> = {};
  for (const f of weekFeedback) {
    feedbackByType[f.type] = (feedbackByType[f.type] ?? 0) + 1;
  }

  const monthlyServiceCostINR = subs.reduce((s, x) => {
    if (x.billingCycle === "monthly") return s + (x.costINR ?? 0);
    if (x.billingCycle === "yearly") return s + (x.costINR ?? 0) / 12;
    return s;
  }, 0);

  return {
    timeframeDays: 7,
    activeDistricts,
    scraperSuccessRate: scraperAll > 0 ? (scraperSuccess / scraperAll) * 100 : 100,
    scraperTotal: scraperAll,
    scraperFailures: scraperFail,
    commonErrors,
    revenueThisWeekINR: weekSupporters.amount,
    supportersThisWeek: weekSupporters.count,
    revenueAllTimeINR: allSupporters.amount,
    expenseThisMonthINR: thirtyDayExpense._sum.amountINR ?? 0,
    monthlyServiceCostINR,
    feedbackThisWeek: { total: weekFeedback.length, byType: feedbackByType },
    topFeatureRequests: topFeatures,
    topDistrictRequests: topDistricts,
    pendingReviews,
    openRouterSpendUSD: openRouterCached?.spent ?? null,
    openRouterLimitUSD: openRouterCached?.limit ?? null,
  };
}

function buildPrompt(d: DataSnapshot): string {
  return `Analyse this week's ForThePeople.in platform data. Be specific, reference actual numbers, and avoid generic advice.

DATA (last 7 days unless noted):
- Active districts: ${d.activeDistricts}
- Scraper success rate: ${d.scraperSuccessRate.toFixed(1)}% (${d.scraperTotal} runs, ${d.scraperFailures} failures)
- Most common failures: ${JSON.stringify(d.commonErrors)}
- Revenue this week: ₹${d.revenueThisWeekINR.toLocaleString("en-IN")} from ${d.supportersThisWeek} supporter(s)
- Revenue all-time: ₹${d.revenueAllTimeINR.toLocaleString("en-IN")}
- Expenses last 30 days: ₹${d.expenseThisMonthINR.toLocaleString("en-IN")}
- Monthly recurring service cost: ₹${Math.round(d.monthlyServiceCostINR).toLocaleString("en-IN")}
- Feedback this week: ${d.feedbackThisWeek.total} items, breakdown: ${JSON.stringify(d.feedbackThisWeek.byType)}
- Top feature requests: ${JSON.stringify(d.topFeatureRequests)}
- Top district requests: ${JSON.stringify(d.topDistrictRequests)}
- Review queue backlog: ${d.pendingReviews} pending AI insights
- OpenRouter spend: ${
    d.openRouterSpendUSD != null
      ? `$${d.openRouterSpendUSD.toFixed(2)}${d.openRouterLimitUSD != null ? ` of $${d.openRouterLimitUSD.toFixed(2)}` : ""}`
      : "unknown"
  }

Return JSON with exactly this schema (no prose, no markdown fences):
{
  "summary": "3-4 sentence platform health summary with specific numbers",
  "actionItems": [
    { "priority": 1, "title": "short imperative", "description": "1-2 sentences, specific" }
    // 3-5 items, priority 1 = most urgent
  ],
  "costTips": [
    { "tip": "specific cost-saving suggestion", "estimatedSaving": "e.g. ₹200/mo or $0.50/week", "priority": "high" }
    // 0-3 items; omit if nothing meaningful
  ],
  "growthInsights": "2-3 sentences on what's working and what to focus on next"
}`;
}

export async function generatePlatformReport(
  type: "weekly" | "manual" = "weekly"
): Promise<{
  id: string;
  summary: string;
  actionItems: PlatformReportActionItem[];
  costTips: PlatformReportCostTip[];
  growthInsights: string | null;
  aiModel: string;
  aiProvider: string;
  aiCostUSD: number;
  generatedAt: string;
  metrics: DataSnapshot;
}> {
  const data = await gatherData();
  const systemPrompt =
    "You are a civic-tech platform analyst for ForThePeople.in. Write terse, specific, actionable reports.";
  const userPrompt = buildPrompt(data);

  const { data: ai, model, provider } = await callAIJSON<AIReportResponse>({
    systemPrompt,
    userPrompt,
    purpose: "insight", // routes to Gemini 2.5 Pro
    maxTokens: 2048,
    temperature: 0.3,
  });

  // Rough estimate: userPrompt + systemPrompt length, ~4 chars / token, Gemini input rate.
  const promptTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
  const aiCostUSD = (promptTokens / 1_000_000) * GEMINI_25_PRO_INPUT_RATE_USD;

  const report = await prisma.platformReport.create({
    data: {
      type,
      summary: ai.summary,
      actionItems: ai.actionItems as unknown as object,
      metrics: data as unknown as object,
      costTips: (ai.costTips ?? []) as unknown as object,
      growthNotes: ai.growthInsights ?? null,
      aiModel: model,
      aiProvider: provider,
      aiCostUSD,
    },
  });

  return {
    id: report.id,
    summary: report.summary,
    actionItems: ai.actionItems,
    costTips: ai.costTips ?? [],
    growthInsights: ai.growthInsights ?? null,
    aiModel: report.aiModel,
    aiProvider: report.aiProvider ?? "openrouter",
    aiCostUSD: report.aiCostUSD,
    generatedAt: report.generatedAt.toISOString(),
    metrics: data,
  };
}

export async function estimateReportCost(): Promise<{ usd: number; inr: number }> {
  // Rough upper bound: 1200 tokens in + 500 out. Mostly input-dominated.
  const usd = (1700 / 1_000_000) * GEMINI_25_PRO_INPUT_RATE_USD;
  return { usd, inr: Math.ceil(usd * INR_PER_USD) };
}
