/**
 * Metric KEY registry + editorial constants for the know-india
 * "Know about India" band (Section 02).
 *
 * Identifiers + immutable historical facts. Numbers (article counts,
 * Lok Sabha seats, etc.) come from Prisma — the (moduleSlug, metricKey)
 * pairs declared below tell the fetcher which IndiaIndicator rows to load.
 * Words live in the messages (page_india "know.*"); `key` fields point
 * at them. Dates are ISO strings, formatted in the page language.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── Editorial constants (constitutional history, immutable facts) ──

/** Constituent Assembly milestones: first sitting, Drafting Committee, adoption, coming into force. */
export const CONSTITUTION_TIMELINE: ReadonlyArray<{ date: string; key: "assembly" | "drafting" | "adopted" | "inForce" }> = [
  { date: "1946-12-09", key: "assembly" },
  { date: "1947-08-29", key: "drafting" },
  { date: "1949-11-26", key: "adopted" },
  { date: "1950-01-26", key: "inForce" },
];

export const NOTABLE_ARTICLES: ReadonlyArray<{ num: number; key: "a14" | "a19" | "a21" | "a32" | "a370" }> = [
  { num: 14, key: "a14" },
  { num: 19, key: "a19" },
  { num: 21, key: "a21" },
  { num: 32, key: "a32" },
  { num: 370, key: "a370" },
];

/** The Constitution came into force on this day (used for the "In force" cell). */
export const IN_FORCE_DATE = "1950-01-26";

// ── Module DIRECTORY (left identity zone) ──

export type DirectoryFormat =
  | "count_with_suffix"
  | "year_span"
  | "million_km2"
  | "lok_rajya"
  | "millions_voters"
  | "stages_count";

export type DirectoryRow = {
  moduleSlug: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  companion?: MetricRef;
  isFeatured?: boolean;
};

export const KNOW_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "know-india-constitution",
    headlineRef: { moduleSlug: "know-india-constitution", metricKey: "articles_count" },
    format: "count_with_suffix",
    isFeatured: true,
  },
  {
    moduleSlug: "know-india-history-timeline",
    headlineRef: { moduleSlug: "know-india-history-timeline", metricKey: "civilization_span_years" },
    format: "year_span",
  },
  {
    moduleSlug: "know-india-geography-physical",
    headlineRef: { moduleSlug: "know-india-geography-physical", metricKey: "area_total_million_km2" },
    format: "million_km2",
  },
  {
    moduleSlug: "know-india-parliament",
    headlineRef: { moduleSlug: "know-india-parliament", metricKey: "lok_sabha_seats" },
    companion: { moduleSlug: "know-india-parliament", metricKey: "rajya_sabha_seats" },
    format: "lok_rajya",
  },
  {
    moduleSlug: "know-india-elections",
    headlineRef: { moduleSlug: "know-india-elections", metricKey: "registered_voters_millions" },
    format: "millions_voters",
  },
  {
    moduleSlug: "know-india-budget",
    headlineRef: { moduleSlug: "know-india-budget", metricKey: "budget_process_stages" },
    format: "stages_count",
  },
];

// ── FEATURED zone (How the Constitution works) ──

export type FeaturedCellPrimaryFormat = "with_plus" | "count" | "in_force_date";

export type FeaturedCell = {
  /** Message key under know.cells. */
  key: "articles" | "schedules" | "parts" | "inForce";
  primary: MetricRef;
  primaryFormat: FeaturedCellPrimaryFormat;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  { key: "articles", primary: { moduleSlug: "know-india-constitution", metricKey: "articles_count" }, primaryFormat: "with_plus" },
  { key: "schedules", primary: { moduleSlug: "know-india-constitution", metricKey: "schedules_count" }, primaryFormat: "count" },
  { key: "parts", primary: { moduleSlug: "know-india-constitution", metricKey: "parts_count" }, primaryFormat: "count" },
  { key: "inForce", primary: { moduleSlug: "know-india-constitution", metricKey: "adopted_year" }, primaryFormat: "in_force_date" },
];

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allKnowRefs(): MetricRef[] {
  const refs: MetricRef[] = [];
  for (const row of KNOW_DIRECTORY) {
    refs.push(row.headlineRef);
    if (row.companion) refs.push(row.companion);
  }
  for (const cell of FEATURED_CELLS) {
    refs.push(cell.primary);
  }
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
