/**
 * ForThePeople.in — Election events API.
 *
 * GET /api/data/election-events?state=<slug>
 *
 * Renamed from /api/data/elections (Sept 2026): that static route shadowed
 * the [module] route's "elections" case, so the Elections page received
 * this calendar instead of ElectionResult rows and rendered empty.
 *   Returns ALL elections relevant to a state: national (state IS NULL)
 *   plus state-level rows for that state, ordered by urgency (live →
 *   upcoming → past). When called without ?state, returns national rows
 *   only — used by the homepage banner.
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { isSlug } from "@/lib/read-api";

interface ElectionPayload {
  id: string;
  type: string;
  label: string;
  state: string | null;
  district: string | null;
  lastHeld: string | null;
  pollingDate: string | null;
  pollingPhases: Array<{ phase: number; date: string }> | null;
  resultDate: string | null;
  nextExpected: string | null;
  termYears: number;
  totalSeats: number | null;
  body: string;
  note: string | null;
  source: string | null;
  isActive: boolean;
}

function parsePhases(s: string | null): Array<{ phase: number; date: string }> | null {
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

function urgencyMs(e: { pollingDate: Date | null; nextExpected: Date | null; resultDate: Date | null }): number {
  const target = e.pollingDate ?? e.nextExpected ?? e.resultDate;
  if (!target) return Number.POSITIVE_INFINITY;
  return Math.abs(target.getTime() - Date.now());
}

export async function GET(req: NextRequest) {
  const stateSlug = req.nextUrl.searchParams.get("state") || null;
  // Only a real state slug reaches the cache key and the query.
  if (stateSlug !== null && !isSlug(stateSlug)) {
    return NextResponse.json({ data: [], meta: { fromCache: false, count: 0, error: "invalid state" } }, { status: 400 });
  }
  const key = cacheKey(stateSlug ?? "national", "election-events");
  const cached = await cacheGet<{ data: ElectionPayload[] }>(key);
  if (cached) return NextResponse.json({ ...cached, meta: { fromCache: true } });

  // Defensive: if the dev server is holding a stale Prisma singleton from
  // before the ElectionEvent model was added, prisma.electionEvent is
  // undefined. Return an empty list with a clear log line instead of a
  // 500 — the page just shows no banner until the dev server restarts.
  if (typeof (prisma as unknown as { electionEvent?: unknown }).electionEvent !== "object") {
    console.warn("[api/data/election-events] prisma.electionEvent missing — restart dev server after `prisma generate`");
    return NextResponse.json({ data: [], meta: { fromCache: false, count: 0, warning: "prisma_client_stale" } });
  }

  try {
    const where = stateSlug
      ? { OR: [{ state: null }, { state: stateSlug }] }
      : { state: null };
    const rows = await prisma.electionEvent.findMany({ where });
    // Sort: live elections first (polling within 30 days), then by absolute
    // distance from today so users see the most relevant first.
    const today = Date.now();
    rows.sort((a, b) => {
      const aLive = a.pollingDate && Math.abs(a.pollingDate.getTime() - today) <= 30 * 86_400_000 ? 0 : 1;
      const bLive = b.pollingDate && Math.abs(b.pollingDate.getTime() - today) <= 30 * 86_400_000 ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return urgencyMs(a) - urgencyMs(b);
    });

    const data: ElectionPayload[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      state: r.state,
      district: r.district,
      lastHeld: r.lastHeld?.toISOString() ?? null,
      pollingDate: r.pollingDate?.toISOString() ?? null,
      pollingPhases: parsePhases(r.pollingPhases),
      resultDate: r.resultDate?.toISOString() ?? null,
      nextExpected: r.nextExpected?.toISOString() ?? null,
      termYears: r.termYears,
      totalSeats: r.totalSeats,
      body: r.body,
      note: r.note,
      source: r.source,
      isActive: r.isActive,
    }));

    // Cache 5 minutes — election dates are stable but live status flips at midnight.
    await cacheSet(key, { data }, 300);
    return NextResponse.json({ data, meta: { fromCache: false, count: data.length } });
  } catch (err) {
    // The detail goes to the log only; the public answer never carries it.
    console.error("[api/data/election-events] query failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { data: [], meta: { fromCache: false, count: 0, error: "unavailable" } },
      { status: 200 }, // 200 with empty array — never blank the page on a backend hiccup
    );
  }
}
