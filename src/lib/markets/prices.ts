/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Market prices — the list of prices, and one cached snapshot of them
// ═══════════════════════════════════════════════════════════════════════
//
//  Used by the /[locale]/prices page (server component), /api/data/prices
//  and /api/data/market-ticker. One snapshot = every series with ~6 months
//  of daily values, fetched in parallel and cached in Redis:
//    • 15 min while Indian markets are open (Mon–Fri 09:15–15:30 IST),
//    • 60 min otherwise,
//    • 5 min when some series failed (so they are retried soon),
//    • not at all when every source failed.
//
//  No history is stored in the database: both upstreams return their own
//  history on every call, so nothing needs a cron or a backfill.
//
//  Petrol and diesel are NOT here on purpose. Their price differs by city
//  and there is no free, dated, official daily feed wired up yet; the old
//  ticker showed two hard-coded April numbers as if they were live.

import { cacheGet, cacheSet } from "@/lib/cache";
import { scaleSeries, type PricePoint } from "./compute";
import { fetchIbjaSeries, fetchYahooSeries, IBJA_URL, yahooQuoteUrl } from "./sources";

export type PriceKey = "gold24" | "gold22" | "silver" | "usdInr" | "crude" | "sensex" | "nifty" | "bankNifty";
export type PriceGroup = "metals" | "money" | "shares";

export interface PriceItem {
  key: PriceKey;
  group: PriceGroup;
  source: "ibja" | "yahoo";
  /** Yahoo symbol (Yahoo items only). */
  symbol?: string;
  /** "INR" → "₹1,234"; "USD" → "$97.44"; null → a plain number (index points). */
  currency: "INR" | "USD" | null;
  /** Decimals for the value and the change. */
  decimals: number;
  /** IBJA publishes gold per 10 g; divide to show per gram. */
  divisor?: number;
}

/** Display order on the page. */
export const PRICE_ITEMS: PriceItem[] = [
  { key: "gold24", group: "metals", source: "ibja", currency: "INR", decimals: 0, divisor: 10 },
  { key: "gold22", group: "metals", source: "ibja", currency: "INR", decimals: 0, divisor: 10 },
  { key: "silver", group: "metals", source: "ibja", currency: "INR", decimals: 0 },
  { key: "usdInr", group: "money", source: "yahoo", symbol: "USDINR=X", currency: "INR", decimals: 2 },
  { key: "crude", group: "money", source: "yahoo", symbol: "BZ=F", currency: "USD", decimals: 2 },
  { key: "sensex", group: "shares", source: "yahoo", symbol: "^BSESN", currency: null, decimals: 0 },
  { key: "nifty", group: "shares", source: "yahoo", symbol: "^NSEI", currency: null, decimals: 0 },
  { key: "bankNifty", group: "shares", source: "yahoo", symbol: "^NSEBANK", currency: null, decimals: 0 },
];

export interface PriceSeries {
  key: PriceKey;
  /** Oldest → newest daily values (already in the unit the page shows). */
  points: PricePoint[];
  /** When the newest value was recorded, when the source says (Yahoo). IBJA gives a date only. */
  asOf: string | null;
  /** Where a visitor can check the number. */
  sourceUrl: string;
}

export interface PricesSnapshot {
  series: Partial<Record<PriceKey, PriceSeries>>;
  /** When this snapshot was fetched from the sources (ISO). */
  fetchedAt: string;
}

const CACHE_KEY = "ftp:prices:v1";

/** NSE hours: Mon–Fri 09:15–15:30 IST (no holiday calendar). */
export function isIndianMarketOpen(nowMs: number = Date.now()): boolean {
  const ist = new Date(nowMs + 5.5 * 3600 * 1000);
  const day = ist.getUTCDay();
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return day >= 1 && day <= 5 && minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30;
}

/** Keep ~4 months: the 3-month window plus its starting point, and a little slack. */
function trim(points: PricePoint[], keep = 110): PricePoint[] {
  return points.length > keep ? points.slice(points.length - keep) : points;
}

async function fetchSnapshot(): Promise<PricesSnapshot> {
  const yahooItems = PRICE_ITEMS.filter((i) => i.source === "yahoo" && i.symbol);
  const [ibjaR, ...yahooR] = await Promise.allSettled([
    fetchIbjaSeries(),
    ...yahooItems.map((i) => fetchYahooSeries(i.symbol as string, "6mo")),
  ]);

  const series: Partial<Record<PriceKey, PriceSeries>> = {};

  const ibja = ibjaR.status === "fulfilled" ? ibjaR.value : null;
  if (ibja) {
    const add = (key: PriceKey, pts: PricePoint[], divisor = 1) => {
      if (pts.length === 0) return;
      series[key] = { key, points: trim(divisor === 1 ? pts : scaleSeries(pts, divisor)), asOf: null, sourceUrl: IBJA_URL };
    };
    add("gold24", ibja.gold999Per10g, 10);
    add("gold22", ibja.gold916Per10g, 10);
    add("silver", ibja.silverPerKg);
  }

  yahooItems.forEach((item, i) => {
    const r = yahooR[i];
    const y = r.status === "fulfilled" ? r.value : null;
    if (!y || y.points.length === 0) return;
    series[item.key] = { key: item.key, points: trim(y.points), asOf: y.asOf, sourceUrl: yahooQuoteUrl(item.symbol as string) };
  });

  return { series, fetchedAt: new Date().toISOString() };
}

/**
 * The cached snapshot, or a fresh one. Never throws; a series whose source
 * failed is simply missing from `series`.
 */
export async function getPricesSnapshot(): Promise<PricesSnapshot> {
  const cached = await cacheGet<PricesSnapshot>(CACHE_KEY);
  if (cached && cached.series) return cached;

  const snap = await fetchSnapshot();
  const got = Object.keys(snap.series).length;
  if (got > 0) {
    const ttl = got < PRICE_ITEMS.length ? 300 : isIndianMarketOpen() ? 900 : 3600;
    await cacheSet(CACHE_KEY, snap, ttl);
  }
  return snap;
}
