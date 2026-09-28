/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// data.gov.in budget record → one BudgetEntry row (pure;
// tests/budget-records.test.ts). Used by src/scraper/jobs/budget.ts.
//
// Sept 2026 fix: the old write path filtered data.gov.in by STATE only and
// stored every returned record on each district of that state, with a
// fiscal year taken from today's date. A dataset now has to say which of
// its fields holds the district and which the year; a record is kept only
// when its district is ours and its year is readable, and the year always
// comes from the record.
// ═══════════════════════════════════════════════════════════
import { firstAmount } from "./sanity";
import { normName } from "./source-districts";

export interface BudgetResource {
  resourceId: string;
  description: string;
  /** What the dataset publishes; stored amounts are whole rupees (CLAUDE.md). */
  unit: "rupee" | "crore";
  /** Record field holding the district name (the API request filters on it). */
  districtField: string;
  /** Record field holding the financial year, e.g. "2024-25". */
  yearField: string;
}

export interface BudgetRow {
  fiscalYear: string;
  sector: string;
  allocated: number;
  released: number;
  spent: number;
}

/** "2024-25", "2024-2025", "2024–25", "2024/25" → "2024-25"; anything else → null. */
export function fiscalYearOf(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const m = String(v).trim().match(/^(\d{4})\s*[-–/]\s*(\d{2}|\d{4})$/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2]);
  const follows = m[2].length === 4 ? end === start + 1 : end === (start + 1) % 100;
  if (!follows) return null;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** The row to store for this district, or null when the record must be skipped. */
export function budgetRowFromRecord(
  rec: Record<string, unknown>,
  resource: BudgetResource,
  districtName: string,
): BudgetRow | null {
  const district = rec[resource.districtField];
  if (typeof district !== "string" || normName(district) !== normName(districtName)) return null;
  const fiscalYear = fiscalYearOf(rec[resource.yearField]);
  if (!fiscalYear) return null;
  const sectorRaw = rec.department ?? rec.sector ?? rec.scheme;
  const sector = typeof sectorRaw === "string" ? sectorRaw.trim() : "";
  if (!sector) return null;
  // All three published figures, or the row is skipped (a missing
  // "released"/"spent" is never stored as 0).
  const a = firstAmount(rec, ["allocated", "allocation"]);
  const r = firstAmount(rec, ["released", "release"]);
  const sp = firstAmount(rec, ["spent", "expenditure", "utilised"]);
  if (a === null || r === null || sp === null || a === 0) return null;
  const scale = resource.unit === "crore" ? 10_000_000 : 1;
  return { fiscalYear, sector, allocated: a * scale, released: r * scale, spent: sp * scale };
}
