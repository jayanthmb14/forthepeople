/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * GET /api/india/snapshot
 *
 * Phase 1 stub. Returns empty arrays for the 6 hero tiles, 12 today
 * tiles, new districts strip, and top news. Real implementation reads
 * from IndiaIndicator (DB) in Phase 5+ and applies the registry-driven
 * selectors. See docs/india/31 §12.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hero: [],
    today: [],
    newDistricts: [],
    topNews: [],
    lastUpdated: null,
    stub: true,
  });
}
