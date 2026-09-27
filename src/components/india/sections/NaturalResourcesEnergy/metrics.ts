/**
 * Metric KEY registry + editorial constants for the
 * natural-resources-energy "Natural Resources & Energy" v1 band
 * (Section 06).
 *
 * State names + energy-mix labels live as editorial config; numeric
 * values come from IndiaIndicator. After Step 9 commit 0 the NRE
 * super-category contains 4 modules (2 live + 2 coming_soon).
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (4 modules — marquee since N>3 keeps the v12 cadence) ──

export type DirectoryFormat =
  | "gw_simple"
  | "mt_with_label"
  | "gw_with_label";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const NRE_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "energy-power",
    emoji: "⚡",
    headlineRef: { moduleSlug: "energy-power", metricKey: "installed_capacity_gw" },
    format: "gw_simple",
    isFeatured: true,
  },
  {
    moduleSlug: "energy-renewables",
    emoji: "☀️",
    headlineRef: { moduleSlug: "energy-renewables", metricKey: "renewable_installed_gw" },
    format: "gw_with_label",
    labelSuffix: "GW RE",
  },
  {
    moduleSlug: "energy-coal",
    emoji: "🪨",
    headlineRef: { moduleSlug: "energy-coal", metricKey: "coal_production_million_tonnes" },
    format: "mt_with_label",
    labelSuffix: "MT coal",
  },
  {
    moduleSlug: "energy-fuels",
    emoji: "🛢",
    headlineRef: { moduleSlug: "energy-fuels", metricKey: "crude_imports_million_tonnes" },
    format: "mt_with_label",
    labelSuffix: "MT crude",
  },
];

// ── FEATURED zone (Power Generation) ──

export const FEATURED_HEADLINE_LABEL = "GW installed";
/** CountUpNumber duration for the featured hero. */
export const HERO_ANIMATION_DURATION_MS = 1500;
/** IntersectionObserver options reused across the band. */
export const INTERSECTION_THRESHOLD = 0.15;
export const INTERSECTION_ROOT_MARGIN = "0px 0px -10% 0px";
export const FEATURED_DESCRIPTION =
  "Total installed power generation capacity, by source.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Target";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "RE 2030";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "energy-power",
  metricKey: "re_target_gw_2030",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "energy-power",
  metricKey: "installed_capacity_gw",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "energy-power",
  metricKey: "capacity_change_yoy_gw",
};
export const FEATURED_GROWTH_PILL_FORMAT = "+{value} GW YoY";

// ── FEATURED CELLS (Coal / RE / Hydro / Nuclear with mix-% sub-stat) ──

export type FeaturedCell = {
  label: string;
  primary: MetricRef;
  primaryFormat: "gw_decimal_1" | "gw_integer";
  /** Reference for the "X%" sub-stat. */
  sub: { ref: MetricRef; template: string; decimals?: number };
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Coal",
    primary: { moduleSlug: "energy-power", metricKey: "coal_capacity_gw" },
    primaryFormat: "gw_integer",
    sub: {
      ref: { moduleSlug: "energy-power", metricKey: "mix_pct_coal" },
      template: "{value}% mix",
    },
  },
  {
    label: "RE",
    primary: { moduleSlug: "energy-power", metricKey: "renewables_capacity_gw" },
    primaryFormat: "gw_integer",
    sub: {
      ref: { moduleSlug: "energy-power", metricKey: "mix_pct_renewables" },
      template: "{value}% mix",
    },
  },
  {
    label: "Hydro",
    primary: { moduleSlug: "energy-power", metricKey: "hydro_capacity_gw" },
    primaryFormat: "gw_integer",
    sub: {
      ref: { moduleSlug: "energy-power", metricKey: "mix_pct_hydro" },
      template: "{value}% mix",
    },
  },
  {
    label: "Nuclear",
    primary: { moduleSlug: "energy-power", metricKey: "nuclear_capacity_gw" },
    primaryFormat: "gw_decimal_1",
    sub: {
      ref: { moduleSlug: "energy-power", metricKey: "mix_pct_nuclear" },
      template: "{value}% mix",
      decimals: 1,
    },
  },
];

// ── TOP POWER STATES right card ──

export type TopPowerStateEntry = {
  rank: number;
  state: string;
  valueRef: MetricRef;
};

export const TOP_POWER_STATES: TopPowerStateEntry[] = [
  { rank: 1, state: "Maharashtra", valueRef: { moduleSlug: "energy-power", metricKey: "top_state_mh_capacity_gw" } },
  { rank: 2, state: "Gujarat",     valueRef: { moduleSlug: "energy-power", metricKey: "top_state_gj_capacity_gw" } },
  { rank: 3, state: "Tamil Nadu",  valueRef: { moduleSlug: "energy-power", metricKey: "top_state_tn_capacity_gw" } },
  { rank: 4, state: "Rajasthan",   valueRef: { moduleSlug: "energy-power", metricKey: "top_state_rj_capacity_gw" } },
  { rank: 5, state: "Karnataka",   valueRef: { moduleSlug: "energy-power", metricKey: "top_state_kn_capacity_gw" } },
];

export const TOP_POWER_STATES_FOOTER_LABEL = "All state capacities";

// ── ENERGY MIX right card ──

export type EnergyMixEntry = {
  emoji: string;
  label: string;
  valueRef: MetricRef;
  decimals?: number;
};

export const ENERGY_MIX: EnergyMixEntry[] = [
  {
    emoji: "🪨",
    label: "Coal",
    valueRef: { moduleSlug: "energy-power", metricKey: "mix_pct_coal" },
  },
  {
    emoji: "☀️",
    label: "Renewables",
    valueRef: { moduleSlug: "energy-power", metricKey: "mix_pct_renewables" },
  },
  {
    emoji: "💧",
    label: "Hydro",
    valueRef: { moduleSlug: "energy-power", metricKey: "mix_pct_hydro" },
  },
  {
    emoji: "⚛️",
    label: "Nuclear",
    valueRef: { moduleSlug: "energy-power", metricKey: "mix_pct_nuclear" },
    decimals: 1,
  },
];

export const ENERGY_MIX_FOOTER_LABEL = "Full source breakdown";

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allNaturalResourcesEnergyRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of NRE_DIRECTORY) {
    refs.push(row.headlineRef);
  }
  for (const cell of FEATURED_CELLS) {
    refs.push(cell.primary);
    refs.push(cell.sub.ref);
  }
  for (const entry of TOP_POWER_STATES) {
    refs.push(entry.valueRef);
  }
  for (const entry of ENERGY_MIX) {
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
