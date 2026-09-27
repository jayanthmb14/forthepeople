/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Home page — market prices for the ticker and the "Prices today" cards.
// Server side, no database: the same snapshot as the /prices page (IBJA +
// Yahoo Finance) through Next's data cache, so the home page stays
// statically generated. Never throws; a price whose source failed is left out.
import { getPricesSnapshot, type PriceKey } from "@/lib/markets/prices";
import { ageInDays as marketAgeDays, isStale, latestWithChange } from "@/lib/markets/compute";
import type { MarketFigure, MarketKey } from "./home-types";

const MARKET_ORDER: Array<{ key: MarketKey; from: PriceKey; decimals: number; currency: MarketFigure["currency"]; unit: MarketFigure["unit"] }> = [
  { key: "gold24", from: "gold24", decimals: 0, currency: "INR", unit: "gram" },
  { key: "gold22", from: "gold22", decimals: 0, currency: "INR", unit: "gram" },
  { key: "silver", from: "silver", decimals: 0, currency: "INR", unit: "kg" },
  { key: "sensex", from: "sensex", decimals: 0, currency: null, unit: null },
  { key: "nifty", from: "nifty", decimals: 0, currency: null, unit: null },
  { key: "usdInr", from: "usdInr", decimals: 2, currency: "INR", unit: null },
  { key: "crude", from: "crude", decimals: 2, currency: "USD", unit: "barrel" },
];

/**
 * The newest value, the change since the trading day before, and a 30-day
 * trend for each price. Uses the same snapshot as the /prices page through
 * Next's data cache (15 min), so the home page stays statically generated.
 * A price whose source failed is left out.
 */
export async function loadMarketFigures(nowMs: number = Date.now()): Promise<MarketFigure[]> {
  let series: Awaited<ReturnType<typeof getPricesSnapshot>>["series"] = {};
  try {
    series = (await getPricesSnapshot({ revalidate: 900 })).series;
  } catch {
    return [];
  }
  const out: MarketFigure[] = [];
  for (const m of MARKET_ORDER) {
    const s = series[m.from];
    const lw = s ? latestWithChange(s.points) : null;
    if (!s || !lw) continue;
    out.push({
      key: m.key,
      value: lw.latest.v,
      decimals: m.decimals,
      currency: m.currency,
      unit: m.unit,
      change:
        lw.change && lw.previous
          ? { pct: lw.change.pct, abs: lw.change.abs, direction: lw.change.direction, prevDay: lw.previous.d }
          : null,
      day: lw.latest.d,
      asOf: s.asOf,
      source: m.from.startsWith("gold") || m.from === "silver" ? "ibja" : "yahoo",
      sourceUrl: s.sourceUrl,
      spark: s.points.slice(-30).map((p) => p.v),
      ageDays: marketAgeDays(lw.latest.d, nowMs),
      old: isStale(lw.latest.d, nowMs),
    });
  }
  return out;
}
