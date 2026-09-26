/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * GET /api/india/updates
 *
 * Recent IndiaIndicator activity feed for /[locale]/india/updates.
 * Ordered by `fetchedAt` desc (when our scrapers last touched the
 * row), capped at 100 rows. Optional ?category= filter.
 *
 * Returns 503 with a clear message when the schema isn't db-pushed
 * yet (matching the suggestion + vote API behaviour).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  INDIA_MODULES,
  type IndiaModuleCategory,
  type IndiaModuleDef,
} from "@/lib/india/india-modules";

export const runtime = "nodejs";

const MAX_ROWS = 100;

function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string; name?: string };
  if (e.code === "P2021" || e.code === "P2010") return true;
  if (e.name === "TypeError" && e.message?.includes("undefined")) return true;
  return Boolean(e.message?.toLowerCase().includes("does not exist"));
}

function dbUnavailable() {
  return NextResponse.json(
    {
      updates: [],
      stub: true,
      error: "Database not yet migrated for India dashboard.",
      hint: "Run `npx prisma db push` to apply the schema additions.",
    },
    { status: 503 },
  );
}

function moduleFor(slug: string): IndiaModuleDef | undefined {
  return INDIA_MODULES.find((m) => m.slug === slug);
}

export async function GET(req: NextRequest) {
  const categoryParam = req.nextUrl.searchParams.get("category");
  const category =
    categoryParam && categoryParam !== "all"
      ? (categoryParam as IndiaModuleCategory)
      : null;

  try {
    const rows = await prisma.indiaIndicator.findMany({
      orderBy: { fetchedAt: "desc" },
      take: MAX_ROWS,
      select: {
        id: true,
        moduleSlug: true,
        metricKey: true,
        metricLabel: true,
        numericValue: true,
        textValue: true,
        unit: true,
        asOfDate: true,
        source: true,
        sourceUrl: true,
        notes: true,
        fetchedAt: true,
      },
    });

    const updates = rows
      .map((r) => {
        const mod = moduleFor(r.moduleSlug);
        if (!mod) return null;
        if (category && mod.category !== category) return null;
        const numeric =
          r.numericValue == null ? null : Number(r.numericValue.toString());
        return {
          id: r.id,
          moduleSlug: r.moduleSlug,
          moduleTitle: mod.title,
          category: mod.category,
          metricKey: r.metricKey,
          metricLabel: r.metricLabel,
          numericValue: numeric,
          textValue: r.textValue,
          unit: r.unit,
          asOfDate: r.asOfDate.toISOString(),
          source: r.source,
          sourceUrl: r.sourceUrl,
          notes: r.notes,
          fetchedAt: r.fetchedAt.toISOString(),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ updates, total: updates.length });
  } catch (err) {
    if (isSchemaMissingError(err)) return dbUnavailable();
    console.error("[india/updates GET]", err);
    return NextResponse.json(
      { error: "Failed to load update log." },
      { status: 500 },
    );
  }
}
