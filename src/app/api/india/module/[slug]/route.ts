/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * GET /api/india/module/[slug]
 *
 * Phase 1 stub. Resolves the module from the registry so the route is
 * reachable end-to-end (404 if slug unknown), but returns empty data
 * arrays — Phase 5+ wires the real DB reads. See docs/india/31 §12.
 */

import { NextResponse } from "next/server";
import { getIndiaModuleBySlug } from "@/lib/india/india-modules";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const mod = getIndiaModuleBySlug(slug);

  if (!mod) {
    return NextResponse.json(
      { error: `Unknown module slug: ${slug}` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    module: {
      slug: mod.slug,
      title: mod.title,
      category: mod.category,
      status: mod.status,
      sources: mod.sources,
    },
    indicators: [],
    timeSeries: [],
    stateBreakdown: [],
    lastUpdated: null,
    stub: true,
  });
}
