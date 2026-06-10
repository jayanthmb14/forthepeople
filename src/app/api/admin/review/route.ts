/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// GET — list all review queue items (pending first, then recent reviewed, max 100)
export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queueItems = await prisma.reviewQueue.findMany({
    orderBy: [
      { status: "asc" }, // "pending" sorts before "approved"/"rejected"
      { createdAt: "desc" },
    ],
    take: 100,
  });

  if (queueItems.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Fetch insights for all queue items
  const insightIds = queueItems.map((q) => q.insightId);
  const insights = await prisma.aIInsight.findMany({
    where: { id: { in: insightIds } },
  });
  const insightMap = Object.fromEntries(insights.map((i) => [i.id, i]));

  const items = queueItems.map((q) => ({
    ...q,
    insight: insightMap[q.insightId] ?? null,
  }));

  return NextResponse.json({ items });
}

// POST — approve or reject a review queue item
export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, note } = body as {
    id: string;
    action: "approve" | "reject";
    note?: string;
  };

  if (!id || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date();

  // Update the review queue entry
  const queueItem = await prisma.reviewQueue.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      reviewerNote: note ?? null,
      reviewedAt: now,
    },
  });

  // Sync the insight's approved flag
  await prisma.aIInsight.update({
    where: { id: queueItem.insightId },
    data: {
      approved: action === "approve",
      approvedAt: action === "approve" ? now : null,
    },
  });

  return NextResponse.json({ ok: true });
}
