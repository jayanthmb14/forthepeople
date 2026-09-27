/**
 * Metric KEY registry + editorial constants for the governance
 * "Governance & Justice" v1 band (Section 08).
 *
 * Re-anchored per Step 10 patch: featured = Police Strength (the
 * only live module among the 3 sub-pillars with a citizen-facing
 * ratio metric). Right-column cards split into JUSTICE SYSTEM
 * (5 entries) + DEFENCE & ELECTIONS (4 entries) so all 3 pillars
 * have representation.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (10 modules) ──

export type DirectoryFormat =
  | "lakh_with_label"
  | "crore_simple"
  | "count_with_label"
  | "pct_decimal_1"
  | "lakhcr_simple";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const GOV_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "justice-police",
    emoji: "👮",
    headlineRef: { moduleSlug: "justice-police", metricKey: "civil_police_total_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh",
    isFeatured: true,
  },
  {
    moduleSlug: "justice-pendency",
    emoji: "⚖",
    headlineRef: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" },
    format: "crore_simple",
  },
  {
    moduleSlug: "justice-crime",
    emoji: "📋",
    headlineRef: { moduleSlug: "justice-crime", metricKey: "ipc_cases_per_year_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh/yr",
  },
  {
    moduleSlug: "justice-prisons",
    emoji: "🔒",
    headlineRef: { moduleSlug: "justice-prisons", metricKey: "prison_population_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh",
  },
  {
    moduleSlug: "elections-loksabha",
    emoji: "🏛",
    headlineRef: { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" },
    format: "count_with_label",
    labelSuffix: "seats",
  },
  {
    moduleSlug: "elections-rajyasabha",
    emoji: "🏛",
    headlineRef: { moduleSlug: "elections-rajyasabha", metricKey: "rajyasabha_seats_total" },
    format: "count_with_label",
    labelSuffix: "seats",
  },
  {
    moduleSlug: "elections-turnout",
    emoji: "🗳",
    headlineRef: { moduleSlug: "elections-turnout", metricKey: "ge_2024_turnout_pct" },
    format: "pct_decimal_1",
  },
  {
    moduleSlug: "defence-budget",
    emoji: "🛡",
    headlineRef: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" },
    format: "lakhcr_simple",
  },
  {
    moduleSlug: "defence-exports",
    emoji: "✈",
    headlineRef: { moduleSlug: "defence-exports", metricKey: "defence_exports_thousand_cr" },
    format: "count_with_label",
    labelSuffix: "k cr",
  },
  {
    moduleSlug: "defence-dpsu",
    emoji: "🏭",
    headlineRef: { moduleSlug: "defence-dpsu", metricKey: "dpsu_count" },
    format: "count_with_label",
    labelSuffix: "DPSUs",
  },
];

// ── FEATURED zone (Police Strength) ──

export const FEATURED_HEADLINE_LABEL = "civil police";
export const FEATURED_DESCRIPTION =
  "BPRD's annual snapshot of India's police organizations.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Target";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "UN recommendation";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "justice-police",
  metricKey: "un_target_per_lakh",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "justice-police",
  metricKey: "civil_police_total_lakh",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "justice-police",
  metricKey: "police_per_lakh_population",
};
/** No leading sign — this is a ratio, not a delta. */
export const FEATURED_GROWTH_PILL_FORMAT = "{value} per lakh population";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "decimal_1" | "decimal_2" | "integer" }
  | { kind: "static"; value: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: { kind: "static"; text: string };
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Civil police",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "justice-police", metricKey: "civil_police_total_lakh" },
      primaryFormat: "decimal_1",
    },
    sub: { kind: "static", text: "lakh · BPRD" },
  },
  {
    label: "Pending cases",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" },
      primaryFormat: "decimal_1",
    },
    sub: { kind: "static", text: "cr · NJDG" },
  },
  {
    label: "Defence",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" },
      primaryFormat: "decimal_1",
    },
    sub: { kind: "static", text: "lakh cr · MoD" },
  },
  {
    /* Lok Sabha 543 seats is set by Constitution Article 81 — editorial
       constant, not a scraped metric. Rendered as a static label. */
    label: "Lok Sabha",
    primary: { kind: "static", value: "543" },
    sub: { kind: "static", text: "seats · Art 81" },
  },
];

// ── JUSTICE SYSTEM right card ──

export type JusticeSystemEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
  decimals?: number;
};

export const JUSTICE_SYSTEM: JusticeSystemEntry[] = [
  {
    label: "Police strength",
    valueRef: { moduleSlug: "justice-police", metricKey: "civil_police_total_lakh" },
    valueSuffix: " lakh",
  },
  {
    label: "Pending cases",
    valueRef: { moduleSlug: "justice-pendency", metricKey: "total_pending_crore_cases" },
    valueSuffix: " cr",
  },
  {
    label: "Prison population",
    valueRef: { moduleSlug: "justice-prisons", metricKey: "prison_population_lakh" },
    valueSuffix: " lakh",
    decimals: 1,
  },
  {
    label: "IPC cases",
    valueRef: { moduleSlug: "justice-crime", metricKey: "ipc_cases_per_year_lakh" },
    valueSuffix: " lakh/yr",
  },
  {
    label: "Conviction rate",
    valueRef: { moduleSlug: "justice-crime", metricKey: "conviction_rate_pct" },
    valueSuffix: "%",
  },
];

export const JUSTICE_SYSTEM_FOOTER_LABEL = "Justice dashboard";

// ── DEFENCE & ELECTIONS right card ──

export type DefenceElectionsEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
  decimals?: number;
};

export const DEFENCE_AND_ELECTIONS: DefenceElectionsEntry[] = [
  {
    label: "Defence budget",
    valueRef: { moduleSlug: "defence-budget", metricKey: "defence_allocation_lakh_cr" },
    valueSuffix: " L cr",
    decimals: 1,
  },
  {
    label: "Defence exports",
    valueRef: { moduleSlug: "defence-exports", metricKey: "defence_exports_thousand_cr" },
    valueSuffix: " k cr",
  },
  {
    label: "Lok Sabha seats",
    valueRef: { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" },
    valueSuffix: "",
  },
  {
    label: "Voter turnout 2024",
    valueRef: { moduleSlug: "elections-turnout", metricKey: "ge_2024_turnout_pct" },
    valueSuffix: "%",
    decimals: 1,
  },
];

export const DEFENCE_AND_ELECTIONS_FOOTER_LABEL = "Defence + elections";

// ── Step-12 timing constants ──
export const HERO_ANIMATION_DURATION_MS = 1500;
export const INTERSECTION_THRESHOLD = 0.15;
export const INTERSECTION_ROOT_MARGIN = "0px 0px -10% 0px";

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allGovernanceRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of GOV_DIRECTORY) refs.push(row.headlineRef);
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
  }
  for (const entry of JUSTICE_SYSTEM) refs.push(entry.valueRef);
  for (const entry of DEFENCE_AND_ELECTIONS) refs.push(entry.valueRef);
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
