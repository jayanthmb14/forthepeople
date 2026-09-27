/**
 * Metric KEY registry + editorial constants for the living-standards
 * "Living Standards" v1 band (Section 03).
 *
 * (moduleSlug, metricKey) pairs declared below tell the fetcher which
 * IndiaIndicator rows to load. State names + label strings are
 * editorial config.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY ──

export type DirectoryFormat =
  | "years_with_unit"
  | "crore_with_label"
  | "crore_simple"
  | "lakh_with_label";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  /** Trailing string concatenated after the formatted value, e.g. "cr cards". */
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const LS_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "health-overview",
    emoji: "💗",
    headlineRef: { moduleSlug: "health-overview", metricKey: "life_expectancy_years" },
    format: "years_with_unit",
    isFeatured: true,
  },
  {
    moduleSlug: "health-pmjay",
    emoji: "🏥",
    headlineRef: { moduleSlug: "health-pmjay", metricKey: "cards_issued_crore" },
    format: "crore_with_label",
    labelSuffix: "cr cards",
  },
  {
    moduleSlug: "health-immunisation",
    emoji: "💉",
    headlineRef: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" },
    format: "crore_simple",
  },
  {
    moduleSlug: "education-schools",
    emoji: "🎓",
    headlineRef: { moduleSlug: "education-schools", metricKey: "schools_total_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh schools",
  },
  {
    moduleSlug: "education-higher",
    emoji: "🎓",
    headlineRef: { moduleSlug: "education-higher", metricKey: "higher_ed_enrolment_crore" },
    format: "crore_with_label",
    labelSuffix: "cr enrolled",
  },
  {
    moduleSlug: "education-skills",
    emoji: "🛠",
    headlineRef: { moduleSlug: "education-skills", metricKey: "pmkvy_trained_crore" },
    format: "crore_with_label",
    labelSuffix: "cr trained",
  },
];

// ── FEATURED zone (Health Indicators) ──

export const FEATURED_HEADLINE_LABEL = "yrs life exp";
export const FEATURED_DESCRIPTION =
  "Indicators tracked from NFHS-5 and Sample Registration System.";

export const FEATURED_RIGHT_CALLOUT_LABEL = "Target";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "NHP 2030";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "health-overview",
  metricKey: "life_expectancy_target_2030",
};

export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "health-overview",
  metricKey: "life_expectancy_years",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "health-overview",
  metricKey: "life_expectancy_change_1990",
};
/** Template substitutes {value} with the formatted growth value. */
export const FEATURED_GROWTH_PILL_TEMPLATE = "+{value} yrs since 1990";

export type FeaturedCellPrimaryFormat =
  | "decimal_1"
  | "decimal_2"
  | "integer";

export type FeaturedCell = {
  label: string;
  primary: MetricRef;
  primaryFormat: FeaturedCellPrimaryFormat;
  /** Static sub-line below the value. */
  subStat: string;
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "Life exp",
    primary: { moduleSlug: "health-overview", metricKey: "life_expectancy_years" },
    primaryFormat: "decimal_1",
    subStat: "yrs · SRS",
  },
  {
    label: "IMR",
    primary: { moduleSlug: "health-overview", metricKey: "infant_mortality_rate" },
    primaryFormat: "decimal_1",
    subStat: "per 1k births",
  },
  {
    label: "Doctors",
    primary: { moduleSlug: "health-overview", metricKey: "doctors_per_1000" },
    primaryFormat: "decimal_2",
    subStat: "per 1k · WHO 1.0",
  },
  {
    label: "U-WIN",
    primary: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" },
    primaryFormat: "decimal_1",
    subStat: "cr doses",
  },
];

// ── STATE LEADERS right card ──

export type StateLeaderEntry = {
  label: string;
  state: string;
  valueRef: MetricRef;
  /** "lower_better" → ⬇ prefix, "higher_better" → ⬆ prefix. */
  direction: "lower_better" | "higher_better";
  /** Trailing string after the formatted value, e.g. " yrs", "%", " (vs 35)". */
  valueSuffix: string;
  /** Decimal places for the rendered value (default 0 = integer). */
  decimals?: number;
};

export const STATE_LEADERS: StateLeaderEntry[] = [
  {
    label: "IMR",
    state: "Kerala",
    valueRef: { moduleSlug: "health-overview", metricKey: "state_leader_kerala_imr" },
    direction: "lower_better",
    valueSuffix: " (vs 35)",
  },
  {
    label: "Life exp",
    state: "Kerala",
    valueRef: { moduleSlug: "health-overview", metricKey: "state_leader_kerala_life_exp" },
    direction: "higher_better",
    valueSuffix: " yrs",
    decimals: 1,
  },
  {
    label: "Doctors",
    state: "Delhi",
    valueRef: { moduleSlug: "health-overview", metricKey: "state_leader_delhi_doctors" },
    direction: "higher_better",
    valueSuffix: "/k",
    decimals: 2,
  },
  {
    label: "Imm cov",
    state: "Manipur",
    valueRef: { moduleSlug: "health-overview", metricKey: "state_leader_manipur_imm_cov" },
    direction: "higher_better",
    valueSuffix: "%",
  },
  {
    label: "Hosp/k",
    state: "Tamil Nadu",
    valueRef: { moduleSlug: "health-overview", metricKey: "state_leader_tn_hosp_per_1000" },
    direction: "higher_better",
    valueSuffix: "",
    decimals: 2,
  },
];

// ── SCHEME COVERAGE right card ──

export type SchemeCoverageEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
  decimals?: number;
};

export const SCHEME_COVERAGE: SchemeCoverageEntry[] = [
  {
    label: "Ayushman Bharat",
    valueRef: { moduleSlug: "health-pmjay", metricKey: "cards_issued_crore" },
    valueSuffix: " cr cards",
  },
  {
    label: "PM-JAY hospitals",
    valueRef: { moduleSlug: "health-pmjay", metricKey: "empanelled_hospitals_thousands" },
    valueSuffix: "k+",
  },
  {
    label: "U-WIN doses",
    valueRef: { moduleSlug: "health-immunisation", metricKey: "doses_administered_crore" },
    valueSuffix: " cr",
    decimals: 1,
  },
  {
    label: "PMKVY trained",
    valueRef: { moduleSlug: "education-skills", metricKey: "pmkvy_trained_crore" },
    valueSuffix: " cr",
    decimals: 1,
  },
];

// ── Helpers ──

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

export function allLivingStandardsRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of LS_DIRECTORY) {
    refs.push(row.headlineRef);
  }
  for (const cell of FEATURED_CELLS) {
    refs.push(cell.primary);
  }
  for (const entry of STATE_LEADERS) {
    refs.push(entry.valueRef);
  }
  for (const entry of SCHEME_COVERAGE) {
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
