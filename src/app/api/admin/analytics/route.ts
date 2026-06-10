/**
 * ForThePeople.in — Admin Analytics API
 * GET /api/admin/analytics
 * Returns district requests, feature votes, feedback/revenue trends, totals
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

/** Get ISO week start (Monday) for a date */
function weekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};
  const fourWeeksAgo = new Date(Date.now() - 28 * 86_400_000);

  // ── Top requested districts ────────────────────────
  try {
    const requests = await prisma.districtRequest.findMany({
      orderBy: { requestCount: "desc" },
      take: 10,
    });
    result.topRequestedDistricts = requests.map((r) => ({
      district: r.districtName,
      state: r.stateName,
      votes: r.requestCount,
    }));
  } catch {
    result.topRequestedDistricts = [];
  }

  // ── Top voted features ─────────────────────────────
  try {
    const features = await prisma.featureRequest.findMany({
      orderBy: { votes: "desc" },
      take: 10,
    });
    result.topVotedFeatures = features.map((f) => ({
      title: f.title,
      votes: f.votes,
      status: f.status,
    }));
  } catch {
    result.topVotedFeatures = [];
  }

  // ── Feedback trend (last 4 weeks) ──────────────────
  try {
    const feedback = await prisma.feedback.findMany({
      where: { createdAt: { gte: fourWeeksAgo } },
      select: { createdAt: true },
    });
    const grouped = new Map<string, number>();
    for (const f of feedback) {
      const week = weekStart(f.createdAt);
      grouped.set(week, (grouped.get(week) || 0) + 1);
    }
    result.feedbackTrend = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }));
  } catch {
    result.feedbackTrend = [];
  }

  // ── Revenue trend (last 4 weeks) ───────────────────
  try {
    const supporters = await prisma.supporter.findMany({
      where: { status: "success", createdAt: { gte: fourWeeksAgo } },
      select: { amount: true, createdAt: true },
    });
    const grouped = new Map<string, number>();
    for (const s of supporters) {
      const week = weekStart(s.createdAt);
      grouped.set(week, (grouped.get(week) || 0) + s.amount);
    }
    result.revenueTrend = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, amount]) => ({ week, amount }));
  } catch {
    result.revenueTrend = [];
  }

  // ── Totals (with 7d deltas) ────────────────────────
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const [
      totalFeedback,
      feedbackThisWeek,
      totalContributions,
      contributionsThisWeek,
      allRevenue,
      totalFeatureVotes,
      featureVotesThisWeek,
      totalDistrictRequests,
      districtRequestsThisWeek,
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.supporter.count({ where: { status: "success" } }),
      prisma.supporter.count({ where: { status: "success", createdAt: { gte: sevenDaysAgo } } }),
      prisma.supporter.findMany({ where: { status: "success" }, select: { amount: true } }),
      prisma.featureRequest.aggregate({ _sum: { votes: true } }),
      prisma.featureVote.count({ where: { votedAt: { gte: sevenDaysAgo } } }),
      prisma.districtRequest.aggregate({ _sum: { requestCount: true } }),
      prisma.districtRequest.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    ]);
    result.totals = {
      totalFeedback,
      feedbackThisWeek,
      totalContributions,
      contributionsThisWeek,
      totalRevenue: allRevenue.reduce((s, x) => s + x.amount, 0),
      totalFeatureVotes: totalFeatureVotes._sum.votes ?? 0,
      featureVotesThisWeek,
      totalDistrictRequests: totalDistrictRequests._sum.requestCount ?? 0,
      districtRequestsThisWeek,
    };
  } catch {
    result.totals = {
      totalFeedback: 0,
      feedbackThisWeek: 0,
      totalContributions: 0,
      contributionsThisWeek: 0,
      totalRevenue: 0,
      totalFeatureVotes: 0,
      featureVotesThisWeek: 0,
      totalDistrictRequests: 0,
      districtRequestsThisWeek: 0,
    };
  }

  // ── Feedback by type (for breakdown) ──────────────
  try {
    const grouped = await prisma.feedback.groupBy({
      by: ["type"],
      _count: { _all: true },
    });
    result.feedbackByType = grouped.map((g) => ({ type: g.type, count: g._count._all }));
  } catch {
    result.feedbackByType = [];
  }

  return NextResponse.json(result);
}
