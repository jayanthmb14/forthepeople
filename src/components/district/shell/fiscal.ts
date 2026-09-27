/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Is a budget's financial year over? Used by the overview's budget tile
// and Budget card to say "Old year" even before (or without) the freshness
// check — a figure for FY 2024-25 must never read as this year's money.
// Pure: tested in tests/district-fiscal.test.ts.
import { fyStartDate } from "@/lib/freshness";

/** True when the financial year ("2024-25", 1 Apr–31 Mar) has ended by `nowMs`. */
export function isPastFiscalYear(fy: string | null | undefined, nowMs: number): boolean {
  const start = fyStartDate(fy);
  if (!start || !Number.isFinite(nowMs) || nowMs <= 0) return false;
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return nowMs >= end.getTime();
}
