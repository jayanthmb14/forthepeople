/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// How to show an MGNREGA count that the NREGA "At a glance" page prints
// in lakh with two decimals (so it is rounded to the nearest 1,000).
// A small district can read "0.00" there: that means "fewer than 1,000",
// never "0 people". A missing figure stays missing (null → "none").
// Pure; the words come from the page's dictionary.

export type LakhDisplay =
  /** The source printed nothing: leave the figure out. */
  | { kind: "none" }
  /** The source printed 0.00 lakh: fewer than 1,000 (never "0"). */
  | { kind: "fewer" }
  /** A real figure, in lakh as printed (e.g. 1.92). */
  | { kind: "lakh"; lakh: number };

export function lakhDisplay(v: number | null | undefined): LakhDisplay {
  if (v === null || v === undefined || !Number.isFinite(v) || v < 0) return { kind: "none" };
  // 0.00 lakh as printed; anything below 0.005 lakh rounds to it.
  if (v < 0.005) return { kind: "fewer" };
  return { kind: "lakh", lakh: v };
}

/** Whole numbers the source prints as plain counts (blocks, panchayats, households with 100 days). */
export function countDisplay(v: number | null | undefined): number | null {
  return v === null || v === undefined || !Number.isFinite(v) || v < 0 ? null : Math.round(v);
}
