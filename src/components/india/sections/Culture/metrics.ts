/**
 * Metric KEY registry + editorial constants for the culture
 * "Culture & Heritage" v1 band (Section 10).
 *
 * Featured = UNESCO & ASI Heritage. Right-column cards split into
 * WORLD HERITAGE SITES (5 inscription-year entries) + CULTURAL
 * OUTPUT (Bollywood / GI tags / scheduled languages / museums).
 *
 * 5 modules total → directory is STATIC (no marquee), matching the
 * Section 04 wildlife pattern for ≤5 module super-categories.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (5 modules — static, no marquee) ──

export type DirectoryFormat =
  | "count_simple"
  | "lakh_with_label"
  | "count_with_plus"
  | "thousand_with_label";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const CUL_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "tourism-heritage",
    emoji: "🏛",
    headlineRef: { moduleSlug: "tourism-heritage", metricKey: "asi_monuments_count" },
    format: "count_simple",
    labelSuffix: "monuments",
    isFeatured: true,
  },
  {
    moduleSlug: "tourism-overview",
    emoji: "✈",
    headlineRef: { moduleSlug: "tourism-overview", metricKey: "international_arrivals_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh FTA",
  },
  {
    moduleSlug: "sports-olympics",
    emoji: "🏅",
    headlineRef: { moduleSlug: "sports-olympics", metricKey: "olympic_medals_total" },
    format: "count_simple",
    labelSuffix: "medals",
  },
  {
    moduleSlug: "sports-khelo-india",
    emoji: "🏆",
    headlineRef: { moduleSlug: "sports-khelo-india", metricKey: "khelo_athletes_thousand" },
    format: "thousand_with_label",
    labelSuffix: "K athletes",
  },
  {
    moduleSlug: "tourism-gi-tags",
    emoji: "🏷",
    headlineRef: { moduleSlug: "tourism-gi-tags", metricKey: "gi_tags_count" },
    format: "count_with_plus",
  },
];

// ── FEATURED zone (UNESCO & ASI Heritage) ──

export const FEATURED_HEADLINE_LABEL = "monuments";
export const FEATURED_DESCRIPTION =
  "Centrally protected monuments and World Heritage Sites.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Global rank";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "most UNESCO sites";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "tourism-heritage",
  metricKey: "global_rank_unesco",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "tourism-heritage",
  metricKey: "asi_monuments_count",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "tourism-heritage",
  metricKey: "unesco_sites_count",
};
export const FEATURED_GROWTH_PILL_FORMAT = "{value} UNESCO sites";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "integer" | "lakh_integer" }
  | { kind: "static"; value: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: { kind: "static"; text: string };
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "UNESCO",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "tourism-heritage", metricKey: "unesco_sites_count" },
      primaryFormat: "integer",
    },
    sub: { kind: "static", text: "sites · 2024" },
  },
  {
    label: "ASI",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "tourism-heritage", metricKey: "asi_monuments_count" },
      primaryFormat: "integer",
    },
    sub: { kind: "static", text: "monuments" },
  },
  {
    label: "Tourism",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "tourism-overview", metricKey: "international_arrivals_lakh" },
      primaryFormat: "lakh_integer",
    },
    sub: { kind: "static", text: "lakh FTA" },
  },
  {
    label: "Source",
    primary: { kind: "static", value: "ASI" },
    sub: { kind: "static", text: "+ UNESCO 2024" },
  },
];

// ── WORLD HERITAGE SITES right card ──

export type WorldHeritageEntry = {
  name: string;
  state: string;
  yearRef: MetricRef;
};

export const WORLD_HERITAGE_SITES: WorldHeritageEntry[] = [
  { name: "Taj Mahal",   state: "Agra",         yearRef: { moduleSlug: "tourism-heritage", metricKey: "unesco_taj_mahal_year" } },
  { name: "Ajanta",      state: "Maharashtra",  yearRef: { moduleSlug: "tourism-heritage", metricKey: "unesco_ajanta_year" } },
  { name: "Khajuraho",   state: "MP",           yearRef: { moduleSlug: "tourism-heritage", metricKey: "unesco_khajuraho_year" } },
  { name: "Hampi",       state: "Karnataka",    yearRef: { moduleSlug: "tourism-heritage", metricKey: "unesco_hampi_year" } },
  { name: "Sundarbans",  state: "West Bengal",  yearRef: { moduleSlug: "tourism-heritage", metricKey: "unesco_sundarbans_year" } },
];

export const WORLD_HERITAGE_SITES_FOOTER_LABEL = "All 43 sites";

// ── CULTURAL OUTPUT right card ──

export type CulturalOutputEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
};

export const CULTURAL_OUTPUT: CulturalOutputEntry[] = [
  {
    label: "Bollywood",
    valueRef: { moduleSlug: "tourism-heritage", metricKey: "bollywood_films_per_year" },
    valueSuffix: " films/yr",
  },
  {
    label: "GI tags",
    valueRef: { moduleSlug: "tourism-gi-tags", metricKey: "gi_tags_count" },
    valueSuffix: "+",
  },
  {
    label: "Languages",
    valueRef: { moduleSlug: "tourism-heritage", metricKey: "scheduled_languages_count" },
    valueSuffix: " scheduled",
  },
  {
    label: "Museums",
    valueRef: { moduleSlug: "tourism-heritage", metricKey: "museums_count" },
    valueSuffix: "+",
  },
];

export const CULTURAL_OUTPUT_FOOTER_LABEL = "All cultural data";

// ── Timing constants (kept here so the .tsx is value-free) ──
export const HERO_ANIMATION_DURATION_MS = 1500;
/** Default per-row CountUp duration. */
export const ROW_ANIMATION_DURATION_MS = 1200;
export const INTERSECTION_THRESHOLD = 0.15;
export const INTERSECTION_ROOT_MARGIN = "0px 0px -10% 0px";

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allCultureRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of CUL_DIRECTORY) refs.push(row.headlineRef);
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
  }
  for (const entry of WORLD_HERITAGE_SITES) refs.push(entry.yearRef);
  for (const entry of CULTURAL_OUTPUT) refs.push(entry.valueRef);
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
