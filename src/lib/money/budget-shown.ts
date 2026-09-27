/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Budget rows: what a page may show (pure helpers, no database)
// ═══════════════════════════════════════════════════════════════════════
//  Used by /api/data/budget, the health score and the Budget page, and
//  unit tested in tests/budget-shown.test.ts. The row filters themselves
//  (which rows are shown at all) live in src/lib/data-filters.ts.
//
//  Sept 2026 audit: a manual import stored "spent" and "released" as a
//  flat share of the allocation and said so only in the notes ("FY 2025-26
//  utilization estimate: 78% released, 65% spent — defensible
//  approximation", Pune) or the source ("estimated from state avg
//  utilisation", Hyderabad). The page showed them as real spending. A
//  spend figure the row itself calls an estimate is not published, so it
//  is shown as "not published yet" (0, which the page already reads that
//  way). The allocation, which the source did publish, stays.

/** Words that mark spending or release figures as estimated, in either order. */
const SPEND_WORDS = String.raw`(?:utili[sz]\w*|spen[dt]\w*|releas\w*|expenditure)`;
const ESTIMATE_WORDS = String.raw`(?:estimat\w*|approximat\w*)`;
export const ESTIMATED_SPEND_RE = new RegExp(`${SPEND_WORDS}[^.\\n]*\\b${ESTIMATE_WORDS}|\\b${ESTIMATE_WORDS}[^.\\n]*${SPEND_WORDS}`, "i");

/** True when the row's own notes or source say its spend figures are estimates. */
export function hasEstimatedSpend(row: { remarks?: string | null; source?: string | null }): boolean {
  return ESTIMATED_SPEND_RE.test(row.remarks ?? "") || ESTIMATED_SPEND_RE.test(row.source ?? "");
}

/**
 * The row with estimated spend and release figures blanked (0 = "not
 * published yet" on the page). "Lapsed" is left alone: it is only ever
 * a published figure or 0.
 */
export function withPublishedSpend<T extends { spent: number; released: number; remarks?: string | null; source?: string | null }>(row: T): T {
  return hasEstimatedSpend(row) ? { ...row, spent: 0, released: 0 } : row;
}

/** One source for a group of rows: its name and first link, "mixed", or null when no row names one. */
export type RowsSource = { label: string; href?: string } | "mixed" | null;

/**
 * The source to name above a group of budget rows. The page used to say
 * "PFMS" for every district although no row came from PFMS; now it names
 * the rows' own source when they share one, or says there are several.
 */
export function rowsSource(rows: Array<{ source?: string | null; sourceUrl?: string | null }>): RowsSource {
  const names = new Set<string>();
  let href: string | undefined;
  for (const r of rows) {
    const name = r.source?.trim();
    if (!name) continue;
    names.add(name);
    if (!href && r.sourceUrl && /^https?:\/\//i.test(r.sourceUrl.trim())) href = r.sourceUrl.trim();
  }
  if (names.size === 0) return null;
  if (names.size > 1) return "mixed";
  const [label] = [...names];
  return href ? { label, href } : { label };
}
