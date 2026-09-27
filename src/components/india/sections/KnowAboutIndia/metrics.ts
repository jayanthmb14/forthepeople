/**
 * Metric KEY registry + editorial constants for the know-india
 * "Know About India" v6 band (Section 02).
 *
 * Identifiers + immutable historical/curated facts. Numeric values
 * (article counts, Lok Sabha seats, etc.) come from Prisma — the
 * (moduleSlug, metricKey) pairs declared below tell the fetcher
 * which IndiaIndicator rows to load. Editorial constants
 * (Constitution drafting milestones, notable Article numbers and
 * their well-known short labels) are immutable historical citations
 * and live in code.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── Editorial constants (constitutional history, immutable facts) ──

export const CONSTITUTION_TIMELINE: ReadonlyArray<{ date: string; event: string }> = [
  { date: "9 Dec 1946", event: "Assembly formed" },
  { date: "29 Aug 1947", event: "Drafting Cmte." },
  { date: "26 Nov 1949", event: "Adopted" },
  { date: "26 Jan 1950", event: "In force" },
];

export const NOTABLE_ARTICLES: ReadonlyArray<{ num: number; label: string }> = [
  { num: 14, label: "Equality before law" },
  { num: 19, label: "Free speech" },
  { num: 21, label: "Right to life" },
  { num: 32, label: "Const. remedies" },
  { num: 370, label: "Ex-J&K status" },
];

export const TOTAL_ARTICLE_COUNT_LABEL = "470+";
export const FEATURED_HEADLINE_LABEL = "articles";
export const FEATURED_CAPTION = "Adopted 26 January 1950 · NCERT Class 11";
export const FEATURED_DESCRIPTION =
  "Preamble, Fundamental Rights, DPSP and Schedule structure.";

// ── Module DIRECTORY (left identity-zone marquee) ──

export type DirectoryFormat =
  | "count_with_suffix"
  | "year_span"
  | "million_km2"
  | "lok_rajya"
  | "millions_voters"
  | "stages_count";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  companion?: MetricRef;
  isFeatured?: boolean;
};

export const KNOW_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "know-india-constitution",
    emoji: "📜",
    headlineRef: { moduleSlug: "know-india-constitution", metricKey: "articles_count" },
    format: "count_with_suffix",
    isFeatured: true,
  },
  {
    moduleSlug: "know-india-history-timeline",
    emoji: "🏛",
    headlineRef: { moduleSlug: "know-india-history-timeline", metricKey: "civilization_span_years" },
    format: "year_span",
  },
  {
    moduleSlug: "know-india-geography-physical",
    emoji: "🗺",
    headlineRef: { moduleSlug: "know-india-geography-physical", metricKey: "area_total_million_km2" },
    format: "million_km2",
  },
  {
    moduleSlug: "know-india-parliament",
    emoji: "🏛",
    headlineRef: { moduleSlug: "know-india-parliament", metricKey: "lok_sabha_seats" },
    companion: { moduleSlug: "know-india-parliament", metricKey: "rajya_sabha_seats" },
    format: "lok_rajya",
  },
  {
    moduleSlug: "know-india-elections",
    emoji: "🗳",
    headlineRef: { moduleSlug: "know-india-elections", metricKey: "registered_voters_millions" },
    format: "millions_voters",
  },
  {
    moduleSlug: "know-india-budget",
    emoji: "💰",
    headlineRef: { moduleSlug: "know-india-budget", metricKey: "budget_process_stages" },
    format: "stages_count",
  },
];

// ── FEATURED zone (Constitution Works) ──

export type FeaturedCellPrimaryFormat =
  | "with_suffix"
  | "count"
  | "year_to_date_string";

export type FeaturedCell = {
  label: string;
  primary: MetricRef;
  primaryFormat: FeaturedCellPrimaryFormat;
  primarySuffix?: string;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Articles",
    primary: { moduleSlug: "know-india-constitution", metricKey: "articles_count" },
    primaryFormat: "with_suffix",
    primarySuffix: "+",
  },
  {
    label: "Schedules",
    primary: { moduleSlug: "know-india-constitution", metricKey: "schedules_count" },
    primaryFormat: "count",
  },
  {
    label: "Parts",
    primary: { moduleSlug: "know-india-constitution", metricKey: "parts_count" },
    primaryFormat: "count",
  },
  {
    label: "Adopted",
    primary: { moduleSlug: "know-india-constitution", metricKey: "adopted_year" },
    primaryFormat: "year_to_date_string",
  },
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
