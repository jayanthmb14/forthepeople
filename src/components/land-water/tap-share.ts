/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// "About N of every 10 homes have a tap" — pure helper for the tap-water
// (JJM) page. Sept 2026 audit: Lucknow's 98.3 % (2,46,351 of 2,50,572
// rural homes) read "About 10 of every 10" right next to "4,221 homes still
// waiting", which says every home is covered. When rounding to tenths would
// say 10 (or 0) but that is not exactly true, the page says "of every 100".

export interface TapShare {
  /** 10 → "N of every 10"; 100 → "N of every 100". */
  per: 10 | 100;
  n: number;
}

export function tapShare(taps: number, homes: number): TapShare {
  if (!(homes > 0)) return { per: 10, n: 0 };
  const pct = Math.min(100, Math.max(0, (taps / homes) * 100));
  const tenths = Math.round(pct / 10);
  if (tenths === 10 && taps < homes) return { per: 100, n: Math.min(99, Math.round(pct)) };
  if (tenths === 0 && taps > 0) return { per: 100, n: Math.max(1, Math.round(pct)) };
  return { per: 10, n: tenths };
}
