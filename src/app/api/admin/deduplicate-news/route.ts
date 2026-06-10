/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

// POST: { districtSlug?: string, newsIds?: string[] }
// Removes duplicate news items — keeps the newest, deletes the rest
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { districtSlug, newsIds } = await req.json() as {
    districtSlug?: string;
    newsIds?: string[];
  };

  let removed = 0;
  let kept = 0;

  if (newsIds && newsIds.length > 0) {
    // Delete specific IDs (caller already determined which to remove)
    const result = await prisma.newsItem.deleteMany({ where: { id: { in: newsIds } } });
    removed = result.count;
    return NextResponse.json({ ok: true, removed, kept });
  }

  // Auto-deduplicate by district
  if (!districtSlug) return NextResponse.json({ error: "districtSlug required" }, { status: 400 });
  const district = await prisma.district.findFirst({ where: { slug: districtSlug } });
  if (!district) return NextResponse.json({ error: "District not found" }, { status: 404 });

  const newsItems = await prisma.newsItem.findMany({
    where: { districtId: district.id },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publishedAt: true },
  });

  // Group by normalized title prefix
  const headlineSeen = new Map<string, typeof newsItems>();
  for (const item of newsItems) {
    const key = (item.title ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().substring(0, 50);
    if (!headlineSeen.has(key)) headlineSeen.set(key, []);
    headlineSeen.get(key)!.push(item);
  }

  const idsToDelete: string[] = [];
  for (const items of headlineSeen.values()) {
    if (items.length > 1) {
      // Keep the newest (first in desc order), delete the rest
      const toDelete = items.slice(1).map((i) => i.id);
      idsToDelete.push(...toDelete);
      kept++;
    }
  }

  if (idsToDelete.length > 0) {
    const result = await prisma.newsItem.deleteMany({ where: { id: { in: idsToDelete } } });
    removed = result.count;
  }

  return NextResponse.json({ ok: true, removed, kept });
}
