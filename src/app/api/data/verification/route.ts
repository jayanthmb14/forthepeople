/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// GET /api/data/verification?district=mandya     (one district)
// GET /api/data/verification?state=karnataka     (all its live districts)
//
// What the daily data check (/api/cron/verify-data) found, per dataset,
// for the "Check this data" panel. Read-only, cached 10 minutes.
//
// Response:
//   { district, state, available, updatedAt, source,
//     data: [{ dataset, status, checks: [{ source, role, agreed, independent, checkedAt }],
//              lastCheckedAt, dataDate, stale, counts, reasons }] }
//   dataset   the key used by /api/data/freshness (weather, mandi, dams, leaders, news, …)
//   status    verified | single-source | disagreement | unchecked
//   reasons   machine codes the panel translates (docs/VERIFICATION.md)
// Before `npm run db:push` creates the table: available = false and every
// cross-checked dataset is "unchecked" (HTTP 200, so pages never break).
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { stateCacheKey, VERIFICATION_MODULE } from "@/lib/verification/cache-keys";
import { readVerificationRows } from "@/lib/verification/store";
import { summarise, uncheckedSummaries } from "@/lib/verification/summary";
import type { DatasetVerificationSummary } from "@/lib/verification/types";
import { SLUG_RE } from "@/lib/read-api";

export const runtime = "nodejs";

const TTL_SECONDS = 600;

interface Payload {
  district: string | null;
  state: string | null;
  available: boolean;
  updatedAt: string | null;
  source: string;
  data: DatasetVerificationSummary[];
}

const SOURCE = "ForThePeople.in automatic cross-checks (daily)";

export async function GET(req: NextRequest) {
  const district = req.nextUrl.searchParams.get("district")?.trim().toLowerCase() || null;
  const state = req.nextUrl.searchParams.get("state")?.trim().toLowerCase() || null;
  if ((!district && !state) || (district && !SLUG_RE.test(district)) || (state && !SLUG_RE.test(state))) {
    return NextResponse.json({ error: "district or state param required" }, { status: 400 });
  }

  const key = district ? cacheKey(district, VERIFICATION_MODULE) : stateCacheKey(state as string);
  const headers = { "Cache-Control": `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${TTL_SECONDS * 2}` };
  const cached = await cacheGet<Payload>(key);
  if (cached && (!state || !district || cached.state === state)) return NextResponse.json(cached, { headers });

  try {
    const { available, rows } = await readVerificationRows({ districtSlug: district, stateSlug: state });
    const data = available ? summarise(rows) : uncheckedSummaries();
    const newest = rows.reduce<number>((m, r) => Math.max(m, r.checkedAt.getTime()), 0);
    const payload: Payload = {
      district,
      state,
      available,
      updatedAt: newest ? new Date(newest).toISOString() : null,
      source: SOURCE,
      data,
    };
    // Cache "table not ready" only briefly, so the first run shows up quickly.
    await cacheSet(key, payload, available ? TTL_SECONDS : 60);
    return NextResponse.json(payload, { headers });
  } catch (err) {
    Sentry.captureException(err);
    console.error("[API] verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
