/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  status-strip — the pure rules behind the header's status strip
// ═══════════════════════════════════════════════════════════════════════
//
//  No React, no fetch: covered by tests/status-strip.test.ts.
//
//  Share market: the strip says "open" or "closed" only when it is sure.
//    - Outside NSE/BSE trading hours (Monday–Friday, 9:15 AM–3:30 PM IST)
//      the market is closed. (The one-hour Diwali "Muhurat" session is the
//      only exception; it is not shown.)
//    - Inside trading hours the clock alone is not enough: exchanges also
//      close on trading holidays. So the strip asks the prices snapshot
//      (/api/data/prices) and says "open" only when the newest Sensex or
//      Nifty quote is recent. It says "closed" when a snapshot taken well
//      into today's session still has only an earlier day's quote (a
//      holiday). Anything else → say nothing.
//
//  Data refreshed: on a district page, only when every fast feed of that
//  district (weather, crop prices, dams, news, alerts) is on time, and then
//  the time since the OLDEST of their last checks — so "refreshed 20 min
//  ago" is true of every live feed, not just the newest one.
//
import type { DatasetFreshness } from "@/lib/freshness";
import { LIVE_FEED_KEYS } from "@/lib/freshness";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const OPEN_MIN = 9 * 60 + 15; // 09:15 IST
const CLOSE_MIN = 15 * 60 + 30; // 15:30 IST

/** A quote this recent (or newer) means trading is happening now. */
export const LIVE_QUOTE_MAX_AGE_MS = 60 * 60 * 1000;

/** Day of week (0 = Sunday) and minutes since midnight, in IST. */
function ist(ms: number): { day: number; minutes: number; dayKey: string } {
  const d = new Date(ms + IST_OFFSET_MS);
  return {
    day: d.getUTCDay(),
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    dayKey: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`,
  };
}

/** NSE/BSE normal session: Monday–Friday, 09:15–15:30 IST (no holiday calendar). */
export function isNseHours(ms: number): boolean {
  const { day, minutes } = ist(ms);
  return day >= 1 && day <= 5 && minutes >= OPEN_MIN && minutes < CLOSE_MIN;
}

export type MarketStatus = "open" | "closed";

/** What the prices snapshot says about the share market (both fields ISO or null). */
export interface MarketQuote {
  /** Time of the newest Sensex (or Nifty) quote. */
  quoteAsOf: string | null;
  /** When the snapshot was fetched from the source. */
  fetchedAt: string | null;
}

/**
 * "open" / "closed", or null when the strip cannot be sure (then it shows
 * nothing). `quote` is null until the snapshot has loaded (or when it failed).
 */
export function marketStatus(nowMs: number, quote: MarketQuote | null): MarketStatus | null {
  if (!isNseHours(nowMs)) return "closed";
  if (!quote) return null;
  const asOf = quote.quoteAsOf ? Date.parse(quote.quoteAsOf) : NaN;
  if (Number.isFinite(asOf) && asOf <= nowMs + 5 * 60 * 1000 && nowMs - asOf <= LIVE_QUOTE_MAX_AGE_MS) return "open";
  const fetched = quote.fetchedAt ? Date.parse(quote.fetchedAt) : NaN;
  if (Number.isFinite(asOf) && Number.isFinite(fetched)) {
    const f = ist(fetched);
    const today = ist(nowMs).dayKey;
    // Fetched today, at least 30 minutes into the session, and the newest
    // quote is still from an earlier day → no trading today.
    if (isNseHours(fetched) && f.dayKey === today && f.minutes >= OPEN_MIN + 30 && ist(asOf).dayKey !== today) return "closed";
  }
  return null;
}

/**
 * When every live feed was last refreshed (ISO), or null when the strip
 * must not claim it: no feeds, a feed is late or undated, or not loaded.
 */
export function liveDataRefreshedAt(datasets: readonly DatasetFreshness[], nowMs: number): string | null {
  const feeds = datasets.filter((d) => LIVE_FEED_KEYS.includes(d.key) && d.status !== "not_collected");
  if (feeds.length === 0) return null;
  if (feeds.some((d) => d.status !== "current" || !d.lastChecked)) return null;
  const oldest = Math.min(...feeds.map((d) => Date.parse(d.lastChecked as string)));
  if (!Number.isFinite(oldest) || oldest > nowMs + 5 * 60 * 1000) return null;
  return new Date(oldest).toISOString();
}
