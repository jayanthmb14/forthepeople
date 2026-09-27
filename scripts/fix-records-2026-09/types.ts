/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Shape of one checked data fix for scripts/fix-records-2026-09.ts.
 * Every fix names the exact row (by id), what changes, why, and the page
 * that says so. Nothing here is computed; it is a reviewed list.
 */

/** Tables this script may touch. Leader is handled elsewhere — never here. */
export type FixTable =
  | "InfraProject"
  | "PopulationHistory"
  | "IndiaIndicator"
  | "PoliceStation"
  | "GovOffice"
  | "Scheme"
  | "DamReading";

export type FieldValue = string | number | boolean | null;

export interface Fix {
  table: FixTable;
  /** Primary key of the row (looked up with read-only SQL on the check date). */
  id: string;
  op: "update" | "delete";
  /** For updates: field → new value. Dates as "YYYY-MM-DD" (stored as IST midnight). Money in whole rupees. */
  set?: Record<string, FieldValue>;
  /** For updates: the values seen on the check date. A field that now holds neither this nor the new value is left alone. */
  was?: Record<string, FieldValue>;
  /** Short human label printed in the plan, e.g. "Mandya · 2021 'Census' row". */
  label: string;
  /** What was wrong, in one plain sentence. */
  why: string;
  /** The page that backs the change. */
  source: string;
  /** Day the source was read (YYYY-MM-DD). */
  checked: string;
}

/** DateTime columns: "YYYY-MM-DD" values for these become Date objects. */
export const DATE_FIELDS = new Set([
  "startDate", "expectedEnd", "completionDate", "revisedEndDate", "originalEndDate",
  "actualStartDate", "announcedDate", "approvedDate", "tenderDate", "cancelledDate",
  "lastVerifiedAt", "asOfDate", "previousAsOfDate", "date",
]);
