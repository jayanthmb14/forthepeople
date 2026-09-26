/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Public UpdateLog feed: GET /api/data/update-log?district=mumbai
// Transparency endpoint — shows every data change per district.
// No auth. Returns most recent entries first.
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const filter = sp.get("filter") ?? "all"; // all | scrapers | admin | seeds
  const moduleFilter = sp.get("module") ?? "";
  const limit = Math.min(Number(sp.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT);
  const cursor = sp.get("cursor") ?? undefined;

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  try {
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true },
    });
    if (!district) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    const sourceFilter =
      filter === "scrapers"
        ? { source: { in: ["scraper", "cron"] } }
        : filter === "admin"
        ? { source: "admin_edit" }
        : filter === "seeds"
        ? { source: "api" }
        : {};

    const rows = await prisma.updateLog.findMany({
      where: {
        districtId: district.id,
        ...sourceFilter,
        ...(moduleFilter ? { moduleName: moduleFilter } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        source: true,
        actorLabel: true,
        action: true,
        moduleName: true,
        description: true,
        recordCount: true,
        tableName: true,
        timestamp: true,
      },
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    const total = await prisma.updateLog.count({
      where: { districtId: district.id },
    });

    const resp = NextResponse.json({
      data,
      total,
      nextCursor,
      meta: { district: districtSlug, filter, limit },
    });
    resp.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return resp;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[api/data/update-log] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
