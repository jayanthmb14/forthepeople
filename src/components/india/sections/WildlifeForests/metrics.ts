/**
 * Metric KEY registry + editorial constants for the wildlife-forests
 * "Wildlife & Forests" v1 band (Section 04).
 *
 * Only 3 modules — directory is STATIC (no marquee). State names live
 * in editorial config; everything numeric comes from IndiaIndicator.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (static, no marquee) ──

export type DirectoryFormat =
  | "pct_simple"
  | "count_with_label"
  | "count_with_plus";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  /** Trailing string concatenated after the formatted value, e.g. " ind." */
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const WF_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "wildlife-forests",
    emoji: "🌳",
    headlineRef: { moduleSlug: "wildlife-forests", metricKey: "forest_cover_pct" },
    format: "pct_simple",
    isFeatured: true,
  },
  {
    moduleSlug: "wildlife-tigers",
    emoji: "🐅",
    headlineRef: { moduleSlug: "wildlife-tigers", metricKey: "tiger_population_total" },
    format: "count_with_label",
    labelSuffix: " ind.",
  },
  {
    moduleSlug: "wildlife-protected-areas",
    emoji: "🦁",
    headlineRef: { moduleSlug: "wildlife-protected-areas", metricKey: "parks_count_total" },
    format: "count_with_plus",
  },
];

// ── FEATURED zone (Forests & Wildlife) ──

export const FEATURED_HEADLINE_LABEL = "forest cover";
export const FEATURED_DESCRIPTION =
  "Forest cover from FSI's biennial India State of Forest Report.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Target";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "NFP 1988";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "wildlife-forests",
  metricKey: "forest_cover_target_pct",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "wildlife-forests",
  metricKey: "forest_cover_pct",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "wildlife-forests",
  metricKey: "forest_cover_change_2021",
};
/** Template substitutes {value} with the formatted growth value. */
export const FEATURED_GROWTH_PILL_TEMPLATE = "+{value} km² since 2021";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "pct_decimal_1" | "pct_decimal_2" | "integer" }
  | { kind: "static"; value: string };

/** Sub-line below the value — either a templated reference or a static caption. */
export type FeaturedCellSub =
  | { kind: "ref_with_template"; ref: MetricRef; template: string; decimals?: number }
  | { kind: "static"; text: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: FeaturedCellSub;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Forest",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "wildlife-forests", metricKey: "forest_cover_pct" },
      primaryFormat: "pct_decimal_1",
    },
    sub: {
      kind: "ref_with_template",
      ref: { moduleSlug: "wildlife-forests", metricKey: "forest_cover_lakh_km2" },
      template: "{value} lakh km²",
      decimals: 2,
    },
  },
  {
    label: "Tree",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "wildlife-forests", metricKey: "tree_cover_pct" },
      primaryFormat: "pct_decimal_2",
    },
    sub: { kind: "static", text: "outside forest" },
  },
  {
    label: "Top state",
    primary: { kind: "static", value: "MP" },
    sub: {
      kind: "ref_with_template",
      ref: { moduleSlug: "wildlife-forests", metricKey: "top_state_pct" },
      template: "{value}% · area",
      decimals: 1,
    },
  },
  {
    label: "Edition",
    primary: { kind: "static", value: "ISFR-18" },
    sub: { kind: "static", text: "2023 · biennial" },
  },
];

// ── TOP FOREST STATES right card ──

export type TopForestStateEntry = {
  rank: number;
  state: string;
  valueRef: MetricRef;
};

export const TOP_FOREST_STATES: TopForestStateEntry[] = [
  { rank: 1, state: "Mizoram",   valueRef: { moduleSlug: "wildlife-forests", metricKey: "top_state_mizoram_pct" } },
  { rank: 2, state: "Arunachal", valueRef: { moduleSlug: "wildlife-forests", metricKey: "top_state_arunachal_pct" } },
  { rank: 3, state: "Meghalaya", valueRef: { moduleSlug: "wildlife-forests", metricKey: "top_state_meghalaya_pct" } },
  { rank: 4, state: "Manipur",   valueRef: { moduleSlug: "wildlife-forests", metricKey: "top_state_manipur_pct" } },
  { rank: 5, state: "Nagaland",  valueRef: { moduleSlug: "wildlife-forests", metricKey: "top_state_nagaland_pct" } },
];

/**
 * Footer link copy for the TopForestStatesCard. The "all 36" reference
 * folds 28 states + 8 UTs (Constitutional fact) — kept as editorial
 * config, not in component JSX.
 */
export const TOP_FOREST_STATES_FOOTER_LABEL = "All 36 states/UTs";

// ── BIODIVERSITY right card ──

export type BiodiversityFormat = "comma_thousands" | "integer";

export type BiodiversityEntry = {
  emoji: string;
  label: string;
  valueRef: MetricRef;
  format: BiodiversityFormat;
};

export const BIODIVERSITY: BiodiversityEntry[] = [
  {
    emoji: "🐅",
    label: "Tigers",
    valueRef: { moduleSlug: "wildlife-tigers", metricKey: "tiger_population_total" },
    format: "comma_thousands",
  },
  {
    emoji: "🐘",
    label: "Elephants",
    valueRef: { moduleSlug: "wildlife-forests", metricKey: "elephants_count" },
    format: "comma_thousands",
  },
  {
    emoji: "🦏",
    label: "Rhinos",
    valueRef: { moduleSlug: "wildlife-forests", metricKey: "rhinos_count" },
    format: "comma_thousands",
  },
  {
    emoji: "",
    label: "Tiger reserves",
    valueRef: { moduleSlug: "wildlife-tigers", metricKey: "tiger_reserves_count" },
    format: "integer",
  },
];

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allWildlifeForestsRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of WF_DIRECTORY) {
    refs.push(row.headlineRef);
  }
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
    if (cell.sub.kind === "ref_with_template") refs.push(cell.sub.ref);
  }
  for (const entry of TOP_FOREST_STATES) {
    refs.push(entry.valueRef);
  }
  for (const entry of BIODIVERSITY) {
    refs.push(entry.valueRef);
  }
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
