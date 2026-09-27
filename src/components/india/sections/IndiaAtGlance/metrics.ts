/**
 * Metric KEY registry for the macro-snapshot "India at a Glance" v7 band.
 *
 * Identifiers only — every (moduleSlug, metricKey) pair declared below
 * tells the data fetcher which IndiaIndicator rows to load. Numeric
 * values, sources, dates come from Prisma. The only strings here are
 * structural editorial copy (labels, captions) — never numeric data.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (left identity-zone vertical list of all 7 modules) ──

export type DirectoryFormat =
  | "trillion_usd"
  | "percent"
  | "lakh_crore_inr"
  | "lakh_crore_per_month"
  | "billion_people"
  | "millions_people"
  | "states_uts_combined";

export type DirectoryRow = {
  /** Module whose `title` is shown as the row label. */
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  /** Optional second metric (e.g. UT count for states_uts_combined). */
  companion?: MetricRef;
  /** Highlight pill on the row (the module the featured zone showcases). */
  isFeatured?: boolean;
};

export const MACRO_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "economy-gdp",
    emoji: "📈",
    headlineRef: { moduleSlug: "economy-gdp", metricKey: "gdp_nominal_usd_trillion" },
    format: "trillion_usd",
  },
  {
    moduleSlug: "economy-inflation",
    emoji: "🛒",
    headlineRef: { moduleSlug: "economy-inflation", metricKey: "cpi_inflation" },
    format: "percent",
  },
  {
    moduleSlug: "economy-employment",
    emoji: "💼",
    headlineRef: { moduleSlug: "economy-employment", metricKey: "workforce_size" },
    format: "millions_people",
  },
  {
    moduleSlug: "demographics-population",
    emoji: "👥",
    headlineRef: { moduleSlug: "demographics-population", metricKey: "population_total" },
    format: "billion_people",
    isFeatured: true,
  },
  {
    moduleSlug: "budget-union",
    emoji: "🏛",
    headlineRef: { moduleSlug: "budget-union", metricKey: "total_outlay_inr_lakh_crore" },
    format: "lakh_crore_inr",
  },
  {
    moduleSlug: "budget-gst",
    emoji: "🛍",
    headlineRef: { moduleSlug: "budget-gst", metricKey: "monthly_collection_inr_lakh_crore" },
    format: "lakh_crore_per_month",
  },
  {
    moduleSlug: "national-snapshot",
    emoji: "🌐",
    headlineRef: { moduleSlug: "national-snapshot", metricKey: "states_count" },
    companion: { moduleSlug: "national-snapshot", metricKey: "uts_count" },
    format: "states_uts_combined",
  },
];

// ── FEATURED zone (Population & Demographics) ──

export const FEATURED_HEADLINE: MetricRef = {
  moduleSlug: "demographics-population",
  metricKey: "population_total",
};
export const FEATURED_GROWTH: MetricRef = {
  moduleSlug: "demographics-population",
  metricKey: "population_growth_yoy",
};
export const FEATURED_RANK: MetricRef = {
  moduleSlug: "demographics-population",
  metricKey: "global_rank",
};

export type FeaturedCellPrimaryFormat =
  | "count_kg"
  | "millions_people"
  | "states_uts_combined"
  | "count"
  | "with_suffix";

export type FeaturedCellSub =
  | { kind: "static_label"; text: string }
  | { kind: "computed_pct_of"; numerator: MetricRef; denominator: MetricRef; suffix: string }
  | { kind: "computed_sum"; first: MetricRef; second: MetricRef; suffix: string }
  | { kind: "static_attribution"; text: string };

export type FeaturedCell = {
  label: string;
  primary: MetricRef;
  primaryFormat: FeaturedCellPrimaryFormat;
  primarySuffix?: string;
  sub?: FeaturedCellSub;
  companion?: MetricRef;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Density",
    primary: { moduleSlug: "demographics-population", metricKey: "population_density_per_sq_km" },
    primaryFormat: "with_suffix",
    sub: { kind: "static_label", text: "/ km²" },
  },
  {
    label: "Workforce",
    primary: { moduleSlug: "economy-employment", metricKey: "workforce_size" },
    primaryFormat: "millions_people",
    sub: {
      kind: "computed_pct_of",
      numerator: { moduleSlug: "economy-employment", metricKey: "workforce_size" },
      denominator: { moduleSlug: "demographics-population", metricKey: "population_total" },
      suffix: "% of pop.",
    },
  },
  {
    label: "States and UTs",
    primary: { moduleSlug: "national-snapshot", metricKey: "states_count" },
    primaryFormat: "states_uts_combined",
    companion: { moduleSlug: "national-snapshot", metricKey: "uts_count" },
    sub: {
      kind: "computed_sum",
      first: { moduleSlug: "national-snapshot", metricKey: "states_count" },
      second: { moduleSlug: "national-snapshot", metricKey: "uts_count" },
      suffix: " total",
    },
  },
  {
    label: "Languages",
    primary: { moduleSlug: "national-snapshot", metricKey: "scheduled_languages" },
    primaryFormat: "count",
    sub: { kind: "static_label", text: "scheduled · Sch. 8" },
  },
];

// ── WORLD RANKINGS (right column · top card) ──
// Each entry pairs a "rank" indicator (#N) with a "value" indicator
// that justifies why India holds that rank.

export type RankFormat = "billion_people" | "trillion_usd" | "billion_usd" | "millions_people";

export type RankEntry = {
  label: string;
  rankRef: MetricRef;
  valueRef: MetricRef;
  format: RankFormat;
};

export const WORLD_RANKINGS: RankEntry[] = [
  {
    label: "Population",
    rankRef: { moduleSlug: "demographics-population", metricKey: "global_rank" },
    valueRef: { moduleSlug: "demographics-population", metricKey: "population_total" },
    format: "billion_people",
  },
  {
    label: "GDP nominal",
    rankRef: { moduleSlug: "economy-gdp", metricKey: "world_rank_gdp_nominal" },
    valueRef: { moduleSlug: "economy-gdp", metricKey: "gdp_nominal_usd_trillion" },
    format: "trillion_usd",
  },
  {
    label: "GDP PPP",
    rankRef: { moduleSlug: "economy-gdp", metricKey: "world_rank_gdp_ppp" },
    valueRef: { moduleSlug: "economy-gdp", metricKey: "gdp_ppp_usd_trillion" },
    format: "trillion_usd",
  },
  {
    label: "Remittances",
    rankRef: { moduleSlug: "economy-gdp", metricKey: "world_rank_remittances" },
    valueRef: { moduleSlug: "economy-gdp", metricKey: "remittances_usd_billion" },
    format: "billion_usd",
  },
  {
    label: "Smartphone users",
    rankRef: { moduleSlug: "national-snapshot", metricKey: "world_rank_smartphone_users" },
    valueRef: { moduleSlug: "national-snapshot", metricKey: "smartphone_users_millions" },
    format: "millions_people",
  },
];

/** Total ranks tracked across the platform — drives the "View all N ranks" CTA. */
export const WORLD_RANK_TOTAL_COUNT = 12;

// ── Editorial copy (structural strings, never numeric data) ──
export const SECTION_LABEL = "section";
export const FEATURED_RANK_LABEL = "Global rank";
export const FEATURED_RANK_SUBTITLE = "most populous";
export const FEATURED_DESCRIPTION =
  "Population, density, fertility, life expectancy — the demographic shape of India today.";

// ── Helpers ──
export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

/**
 * Walk every slot in the registry and emit the flat list of refs the
 * fetcher needs to load. The fetcher imports just this — it never has
 * to know about which slots exist.
 */
export function allMacroRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE,
    FEATURED_GROWTH,
    FEATURED_RANK,
  ];
  for (const row of MACRO_DIRECTORY) {
    refs.push(row.headlineRef);
    if (row.companion) refs.push(row.companion);
  }
  for (const cell of FEATURED_CELLS) {
    refs.push(cell.primary);
    if (cell.companion) refs.push(cell.companion);
    if (cell.sub) {
      switch (cell.sub.kind) {
        case "computed_pct_of":
          refs.push(cell.sub.numerator, cell.sub.denominator);
          break;
        case "computed_sum":
          refs.push(cell.sub.first, cell.sub.second);
          break;
      }
    }
  }
  for (const entry of WORLD_RANKINGS) {
    refs.push(entry.rankRef, entry.valueRef);
  }
  // De-dupe by composite key.
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
