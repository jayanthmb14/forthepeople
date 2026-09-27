/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// AGMARKNET (data.gov.in resource 9ef84268…) record checks — pure
//
// Prices are rupees per quintal. A record is stored only when:
//   - commodity, market and a valid arrival date are present,
//   - min, max and modal prices are all published and above zero,
//   - min ≤ modal ≤ max,
//   - no price is absurd (> ₹10,00,000 per quintal) and the spread is
//     not wild (max more than 20 × min is almost always a typo),
//   - the arrival date is not in the future.
// Rejected records are counted and logged, never "fixed".
// ═══════════════════════════════════════════════════════════
import { parseAmount } from "./sanity";

export interface AgmarkRecord {
  commodity?: string;
  variety?: string;
  district?: string;
  market?: string;
  min_price?: number | string;
  max_price?: number | string;
  modal_price?: number | string;
  arrival_date?: string;
  grade?: string;
  state?: string;
}

export interface CropRow {
  commodity: string;
  variety: string | null;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  /** The market day the prices are for (UTC midnight). */
  date: Date;
}

/** Highest believable price, rupees per quintal. */
export const MAX_PRICE_PER_QUINTAL = 1_000_000;
/** Highest believable max ÷ min ratio within one record. */
export const MAX_PRICE_SPREAD = 20;

/** "27/09/2026" → Date (UTC midnight), or null. */
export function parseArrivalDate(s: string | undefined | null): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((s ?? "").trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m.map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  // Reject roll-overs such as 31/02 → 3 March.
  return d.getUTCDate() === dd && d.getUTCMonth() === mm - 1 ? d : null;
}

/** Problems with one price triple (empty = fine). */
export function cropPriceProblems(min: number | null, max: number | null, modal: number | null): string[] {
  if (min === null || max === null || modal === null) return ["a price is missing"];
  const p: string[] = [];
  if (min <= 0 || max <= 0 || modal <= 0) p.push("a price is zero");
  if (min > modal || modal > max) p.push("min ≤ modal ≤ max does not hold");
  if (max > MAX_PRICE_PER_QUINTAL) p.push("price is absurdly high");
  if (min > 0 && max / min > MAX_PRICE_SPREAD) p.push("spread between min and max is absurd");
  return p;
}

/**
 * One AGMARKNET record → a row to store, or the reason it was rejected.
 * `nowMs` is passed in so the check is testable.
 */
export function toCropRow(r: AgmarkRecord, nowMs: number): { row: CropRow } | { reason: string } {
  const commodity = (r.commodity ?? "").trim();
  const market = (r.market ?? "").trim();
  if (!commodity || !market) return { reason: "no commodity or market" };
  const date = parseArrivalDate(r.arrival_date);
  if (!date) return { reason: "no valid arrival date" };
  if (date.getTime() > nowMs + 36 * 3600_000) return { reason: "arrival date is in the future" };
  const minPrice = parseAmount(r.min_price);
  const maxPrice = parseAmount(r.max_price);
  const modalPrice = parseAmount(r.modal_price);
  const problems = cropPriceProblems(minPrice, maxPrice, modalPrice);
  if (problems.length > 0) return { reason: problems[0] };
  return {
    row: {
      commodity,
      variety: (r.variety ?? "").trim() || null,
      market,
      minPrice: minPrice as number,
      maxPrice: maxPrice as number,
      modalPrice: modalPrice as number,
      date,
    },
  };
}

/** HTTP statuses worth one retry (gateway hiccups on data.gov.in). */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}
