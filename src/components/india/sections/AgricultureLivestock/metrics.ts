/**
 * Metric KEY registry + editorial constants for the agriculture-livestock
 * "Agriculture & Livestock" v1 band (Section 05).
 *
 * State names + scheme labels live as editorial config; numeric values
 * come from IndiaIndicator.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY ──

export type DirectoryFormat =
  | "mt_simple"
  | "crore_with_label"
  | "million_kg"
  | "million_simple"
  | "lakh_tonnes";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const AL_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "agriculture-production",
    emoji: "🌾",
    headlineRef: { moduleSlug: "agriculture-production", metricKey: "foodgrain_output_million_tonnes" },
    format: "mt_simple",
    isFeatured: true,
  },
  {
    moduleSlug: "agriculture-pmkisan",
    emoji: "💰",
    headlineRef: { moduleSlug: "agriculture-pmkisan", metricKey: "farmers_count_crore" },
    format: "crore_with_label",
    labelSuffix: "cr farmers",
  },
  {
    moduleSlug: "agriculture-plantation",
    emoji: "🍃",
    headlineRef: { moduleSlug: "agriculture-plantation", metricKey: "tea_production_million_kg" },
    format: "million_kg",
    labelSuffix: "mn kg tea",
  },
  {
    moduleSlug: "livestock-census",
    emoji: "🐄",
    headlineRef: { moduleSlug: "livestock-census", metricKey: "livestock_total_million" },
    format: "million_simple",
    labelSuffix: "mn livestock",
  },
  {
    moduleSlug: "livestock-fisheries",
    emoji: "🐟",
    headlineRef: { moduleSlug: "livestock-fisheries", metricKey: "fish_production_lakh_tonnes" },
    format: "lakh_tonnes",
    labelSuffix: "lakh t fish",
  },
];

// ── FEATURED zone (Crop Production) ──

export const FEATURED_HEADLINE_LABEL = "million tonnes";
/** CountUpNumber duration for the featured hero (kept here so the .tsx doesn't carry numeric literals). */
export const HERO_ANIMATION_DURATION_MS = 1500;
/** IntersectionObserver options reused across the band. */
export const INTERSECTION_THRESHOLD = 0.15;
export const INTERSECTION_ROOT_MARGIN = "0px 0px -10% 0px";
export const FEATURED_DESCRIPTION =
  "Foodgrain output, rice and wheat estimates from DA&FW.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Top state";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "Uttar Pradesh";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "agriculture-production",
  metricKey: "top_producer_state_pct",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "agriculture-production",
  metricKey: "foodgrain_output_million_tonnes",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "agriculture-production",
  metricKey: "foodgrain_change_yoy_mt",
};
export const FEATURED_GROWTH_PILL_FORMAT = "+{value} MT YoY";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "integer_mt" }
  | { kind: "static"; value: string };

export type FeaturedCellSub =
  | { kind: "static"; text: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: FeaturedCellSub;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Rice",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "agriculture-production", metricKey: "rice_production_million_tonnes" },
      primaryFormat: "integer_mt",
    },
    sub: { kind: "static", text: "MT · DA&FW" },
  },
  {
    label: "Wheat",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "agriculture-production", metricKey: "wheat_production_million_tonnes" },
      primaryFormat: "integer_mt",
    },
    sub: { kind: "static", text: "MT · DA&FW" },
  },
  {
    label: "Top state",
    primary: { kind: "static", value: "UP" },
    sub: { kind: "static", text: "wheat leader" },
  },
  {
    label: "Source",
    primary: { kind: "static", value: "DA&FW" },
    sub: { kind: "static", text: "AY 2024 · 4th est." },
  },
];

// ── TOP CROP STATES right card ──

export type TopCropStateEntry = {
  rank: number;
  state: string;
  crop: string;
  valueRef: MetricRef;
};

export const TOP_CROP_STATES: TopCropStateEntry[] = [
  { rank: 1, state: "UP",          crop: "Wheat", valueRef: { moduleSlug: "agriculture-production", metricKey: "top_state_up_wheat_mt" } },
  { rank: 2, state: "MP",          crop: "Wheat", valueRef: { moduleSlug: "agriculture-production", metricKey: "top_state_mp_wheat_mt" } },
  { rank: 3, state: "Punjab",      crop: "Wheat", valueRef: { moduleSlug: "agriculture-production", metricKey: "top_state_pb_wheat_mt" } },
  { rank: 4, state: "West Bengal", crop: "Rice",  valueRef: { moduleSlug: "agriculture-production", metricKey: "top_state_wb_rice_mt" } },
  { rank: 5, state: "Andhra",      crop: "Rice",  valueRef: { moduleSlug: "agriculture-production", metricKey: "top_state_ap_rice_mt" } },
];

export const TOP_CROP_STATES_FOOTER_LABEL = "All major producers";

// ── FARMER SCHEMES right card ──

export type FarmerSchemeEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
  decimals?: number;
};

export const FARMER_SCHEMES: FarmerSchemeEntry[] = [
  {
    label: "PM-KISAN",
    valueRef: { moduleSlug: "agriculture-pmkisan", metricKey: "farmers_count_crore" },
    valueSuffix: " cr farmers",
  },
  {
    label: "PMFBY",
    valueRef: { moduleSlug: "agriculture-pmkisan", metricKey: "pmfby_insured_crore" },
    valueSuffix: " cr insured",
    decimals: 1,
  },
  {
    label: "KCC active",
    valueRef: { moduleSlug: "agriculture-pmkisan", metricKey: "kcc_active_cards_crore" },
    valueSuffix: " cr cards",
  },
  {
    label: "Soil Health",
    valueRef: { moduleSlug: "agriculture-pmkisan", metricKey: "soil_health_cards_crore" },
    valueSuffix: " cr cards",
  },
];

export const FARMER_SCHEMES_FOOTER_LABEL = "All farmer schemes";

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allAgricultureLivestockRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of AL_DIRECTORY) {
    refs.push(row.headlineRef);
  }
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
  }
  for (const entry of TOP_CROP_STATES) {
    refs.push(entry.valueRef);
  }
  for (const entry of FARMER_SCHEMES) {
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
