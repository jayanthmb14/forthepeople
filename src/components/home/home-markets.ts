/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Home page — prices for the ticker and the "Prices today" section.
// Server side, no database, and the home page stays statically generated:
//   - gold, silver, Sensex, Nifty 50, US dollar: the same snapshot as the
//     /prices page (IBJA + Yahoo Finance) through Next's data cache (15 min);
//   - petrol and diesel: the checked PPAC snapshot the fuel collector keeps
//     in Redis (src/lib/markets/fuel.ts), read through unstable_cache (15 min)
//     so the Redis client's no-store fetch does not make the page dynamic.
// Never throws; a price whose source failed (or that was never checked) is
// left out.
import { unstable_cache } from "next/cache";
import { getPricesSnapshot, type PriceKey } from "@/lib/markets/prices";
import { ageInDays as marketAgeDays, isStale, latestWithChange } from "@/lib/markets/compute";
import { readFuelSnapshot } from "@/lib/markets/fuel";
import { fuelFigures } from "./home-picks";
import type { FuelFigure, MarketFigure, MarketKey } from "./home-types";

/**
 * Gold is shown per 10 grams and silver per kilogram, as IBJA publishes
 * them (the shared snapshot keeps gold per gram for the /prices page, so
 * it is multiplied back here). Crude oil is not shown on the home page.
 */
const MARKET_ORDER: Array<{ key: MarketKey; from: PriceKey; decimals: number; currency: MarketFigure["currency"]; unit: MarketFigure["unit"]; scale?: number }> = [
  { key: "gold24", from: "gold24", decimals: 0, currency: "INR", unit: "10g", scale: 10 },
  { key: "gold22", from: "gold22", decimals: 0, currency: "INR", unit: "10g", scale: 10 },
  { key: "silver", from: "silver", decimals: 0, currency: "INR", unit: "kg" },
  { key: "sensex", from: "sensex", decimals: 0, currency: null, unit: null },
  { key: "nifty", from: "nifty", decimals: 0, currency: null, unit: null },
  { key: "usdInr", from: "usdInr", decimals: 2, currency: "INR", unit: null },
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
    const scale = m.scale ?? 1;
    const points = s ? (scale === 1 ? s.points : s.points.map((p) => ({ d: p.d, v: Math.round(p.v * scale * 100) / 100 }))) : [];
    const lw = latestWithChange(points);
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
      spark: points.slice(-30).map((p) => p.v),
      ageDays: marketAgeDays(lw.latest.d, nowMs),
      old: isStale(lw.latest.d, nowMs),
    });
  }
  return out;
}

const readFuelCached = unstable_cache(async () => readFuelSnapshot(), ["home-fuel-v1"], { revalidate: 900 });

/** Petrol and diesel (Delhi first, then the other metros), or [] when none is stored or checked. */
export async function loadFuelFigures(nowMs: number = Date.now()): Promise<FuelFigure[]> {
  try {
    return fuelFigures(await readFuelCached(), nowMs);
  } catch {
    return [];
  }
}
