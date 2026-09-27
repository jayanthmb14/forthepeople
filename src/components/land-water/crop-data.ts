/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop prices — pure helpers shared by the crops page and its sheet
// ═══════════════════════════════════════════════════════════════════════
//  The API sends at most 100 AGMARKNET rows per district, newest date
//  first (the collector keeps only the newest 100). Everything here works
//  on those rows only: nothing is estimated or filled in.

import type { CropPrice } from "@/hooks/useRealtimeData";

/** Commodity names sometimes differ only by case/spaces between mandis. */
export function commodityKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Calendar day of a row ("2026-09-26"). */
export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Whole days from day `a` to day `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(dayOf(b)) - Date.parse(dayOf(a))) / 86_400_000);
}

/** Newest row per commodity, in the API order (newest day first, then name). */
export function latestPerCrop(prices: CropPrice[]): CropPrice[] {
  const seen = new Map<string, CropPrice>();
  for (const p of prices) {
    const k = commodityKey(p.commodity);
    if (!seen.has(k)) seen.set(k, p);
  }
  return Array.from(seen.values());
}

/** Rows for one commodity (newest first). */
export function rowsOf(prices: CropPrice[], key: string): CropPrice[] {
  return prices.filter((p) => commodityKey(p.commodity) === key);
}

/** The newest row for this commodity at each mandi, newest first. */
export function latestPerMarket(prices: CropPrice[], key: string): CropPrice[] {
  const seen = new Map<string, CropPrice>();
  for (const p of rowsOf(prices, key)) if (!seen.has(p.market)) seen.set(p.market, p);
  return Array.from(seen.values());
}

/** The same commodity at the same mandi on the market day before `row`. */
export function previousDay(prices: CropPrice[], row: CropPrice): CropPrice | undefined {
  const key = commodityKey(row.commodity);
  return prices.find((x) => commodityKey(x.commodity) === key && x.market === row.market && dayOf(x.date) < dayOf(row.date));
}

/**
 * The same commodity at the same mandi about a week before `row`: the row
 * closest to 7 days earlier, between 5 and 10 days earlier. Undefined when
 * the mandi has no price in that window.
 */
export function weekBefore(prices: CropPrice[], row: CropPrice): CropPrice | undefined {
  const key = commodityKey(row.commodity);
  let best: CropPrice | undefined;
  let bestGap = Infinity;
  for (const x of prices) {
    if (commodityKey(x.commodity) !== key || x.market !== row.market) continue;
    const back = daysBetween(x.date, row.date);
    if (back < 5 || back > 10) continue;
    const gap = Math.abs(back - 7);
    if (gap < bestGap) {
      best = x;
      bestGap = gap;
    }
  }
  return best;
}

/**
 * One row per day for a commodity, oldest → newest, for a trend line.
 * Prefers the mandi of `row` so the line compares like with like; when
 * that mandi has fewer than two days it falls back to all mandis.
 */
export function dailySeries(prices: CropPrice[], row: CropPrice): { rows: CropPrice[]; oneMarket: boolean } {
  const key = commodityKey(row.commodity);
  const onePerDay = (list: CropPrice[]) => {
    const byDay = new Map<string, CropPrice>();
    for (const p of list) if (!byDay.has(dayOf(p.date))) byDay.set(dayOf(p.date), p);
    return Array.from(byDay.values()).reverse();
  };
  const all = rowsOf(prices, key);
  const same = onePerDay(all.filter((p) => p.market === row.market));
  if (same.length > 1) return { rows: same, oneMarket: true };
  const mixed = onePerDay(all);
  return { rows: mixed, oneMarket: mixed.every((p) => p.market === row.market) };
}
