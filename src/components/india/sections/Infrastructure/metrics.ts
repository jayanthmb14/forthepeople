/**
 * Metric KEY registry + editorial constants for the infrastructure
 * "Infrastructure" v1 band (Section 07).
 *
 * State names + flagship-project labels live as editorial config;
 * numeric values come from IndiaIndicator.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY ──

export type DirectoryFormat =
  | "km_simple"
  | "count_with_label"
  | "crore_simple";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const INF_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "infra-roads",
    emoji: "🛣",
    headlineRef: { moduleSlug: "infra-roads", metricKey: "nh_length_km" },
    format: "km_simple",
    isFeatured: true,
  },
  {
    moduleSlug: "infra-railways",
    emoji: "🚆",
    headlineRef: { moduleSlug: "infra-railways", metricKey: "route_km" },
    format: "km_simple",
  },
  {
    moduleSlug: "infra-aviation",
    emoji: "✈",
    headlineRef: { moduleSlug: "infra-aviation", metricKey: "airports_operational_count" },
    format: "count_with_label",
    labelSuffix: "airports",
  },
  {
    moduleSlug: "infra-telecom",
    emoji: "📡",
    headlineRef: { moduleSlug: "infra-telecom", metricKey: "subscribers_crore" },
    format: "crore_simple",
  },
  {
    moduleSlug: "infra-ports",
    emoji: "⚓",
    headlineRef: { moduleSlug: "infra-ports", metricKey: "major_ports_count" },
    format: "count_with_label",
    labelSuffix: "major ports",
  },
  {
    moduleSlug: "infra-smart-cities",
    emoji: "🏙",
    headlineRef: { moduleSlug: "infra-smart-cities", metricKey: "cities_count" },
    format: "count_with_label",
    labelSuffix: "cities",
  },
];

// ── FEATURED zone (Roads & Highways) ──

export const FEATURED_HEADLINE_LABEL = "km of NH";
export const FEATURED_DESCRIPTION =
  "National Highway network from MoRTH and NHAI dashboards.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Target";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "Bharatmala 2027";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "infra-roads",
  metricKey: "nh_target_km_2027",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "infra-roads",
  metricKey: "nh_length_km",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "infra-roads",
  metricKey: "nh_change_yoy_km",
};
export const FEATURED_GROWTH_PILL_FORMAT = "+{value} km YoY";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "km_thousands" | "year_integer" }
  | { kind: "static"; value: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: { kind: "static"; text: string };
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "NH",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "infra-roads", metricKey: "nh_length_km" },
      primaryFormat: "km_thousands",
    },
    sub: { kind: "static", text: "km · MoRTH" },
  },
  {
    label: "Expressway",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "infra-roads", metricKey: "expressway_km" },
      primaryFormat: "km_thousands",
    },
    sub: { kind: "static", text: "km · NHAI" },
  },
  {
    label: "Top state",
    primary: { kind: "static", value: "MH" },
    sub: { kind: "static", text: "wheat NH leader" },
  },
  {
    label: "Year",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "infra-roads", metricKey: "data_year" },
      primaryFormat: "year_integer",
    },
    sub: { kind: "static", text: "MoRTH dataset" },
  },
];

// ── TOP HIGHWAY STATES right card ──

export type TopHighwayStateEntry = {
  rank: number;
  state: string;
  valueRef: MetricRef;
};

export const TOP_HIGHWAY_STATES: TopHighwayStateEntry[] = [
  { rank: 1, state: "Maharashtra", valueRef: { moduleSlug: "infra-roads", metricKey: "top_state_mh_nh_km" } },
  { rank: 2, state: "UP",          valueRef: { moduleSlug: "infra-roads", metricKey: "top_state_up_nh_km" } },
  { rank: 3, state: "Rajasthan",   valueRef: { moduleSlug: "infra-roads", metricKey: "top_state_rj_nh_km" } },
  { rank: 4, state: "MP",          valueRef: { moduleSlug: "infra-roads", metricKey: "top_state_mp_nh_km" } },
  { rank: 5, state: "Karnataka",   valueRef: { moduleSlug: "infra-roads", metricKey: "top_state_ka_nh_km" } },
];

export const TOP_HIGHWAY_STATES_FOOTER_LABEL = "All 36 states/UTs";

// ── FLAGSHIP PROJECTS right card ──

export type FlagshipProjectEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
};

export const FLAGSHIP_PROJECTS: FlagshipProjectEntry[] = [
  {
    label: "Bharatmala",
    valueRef: { moduleSlug: "infra-roads", metricKey: "bharatmala_nh_km" },
    valueSuffix: " km NH",
  },
  {
    label: "Sagarmala",
    valueRef: { moduleSlug: "infra-roads", metricKey: "sagarmala_ports_count" },
    valueSuffix: " major ports",
  },
  {
    label: "UDAN",
    valueRef: { moduleSlug: "infra-roads", metricKey: "udan_airports_count" },
    valueSuffix: "+ airports",
  },
  {
    label: "GatiShakti",
    valueRef: { moduleSlug: "infra-roads", metricKey: "gatishakti_projects_count" },
    valueSuffix: "+ projects",
  },
];

export const FLAGSHIP_PROJECTS_FOOTER_LABEL = "All flagship projects";

// ── Step-12 timing constants ──
export const HERO_ANIMATION_DURATION_MS = 1500;
export const INTERSECTION_THRESHOLD = 0.15;
export const INTERSECTION_ROOT_MARGIN = "0px 0px -10% 0px";

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allInfrastructureRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of INF_DIRECTORY) refs.push(row.headlineRef);
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
  }
  for (const entry of TOP_HIGHWAY_STATES) refs.push(entry.valueRef);
  for (const entry of FLAGSHIP_PROJECTS) refs.push(entry.valueRef);
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
