/**
 * Metric KEY registry + editorial constants for the innovation
 * "Innovation & Industry" v1 band (Section 09).
 *
 * Featured = Startups & Unicorns. Right-column cards split into
 * TOP STARTUP HUBS (5 ranked states) + DIGITAL STACK (UPI / Aadhaar /
 * DigiLocker / FASTag / ISRO satellites).
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

// ── DIRECTORY (7 modules) ──

export type DirectoryFormat =
  | "lakh_with_label"
  | "count_with_label"
  | "crore_simple"
  | "pct_decimal_2"
  | "lakhcr_simple"
  | "billion_usd_simple";

export type DirectoryRow = {
  moduleSlug: string;
  emoji: string;
  headlineRef: MetricRef;
  format: DirectoryFormat;
  labelSuffix?: string;
  isFeatured?: boolean;
};

export const INN_DIRECTORY: DirectoryRow[] = [
  {
    moduleSlug: "science-startups",
    emoji: "🚀",
    headlineRef: { moduleSlug: "science-startups", metricKey: "dpiit_recognised_lakh" },
    format: "lakh_with_label",
    labelSuffix: "lakh",
    isFeatured: true,
  },
  {
    moduleSlug: "science-isro",
    emoji: "🛰",
    headlineRef: { moduleSlug: "science-isro", metricKey: "satellites_launched_count" },
    format: "count_with_label",
    labelSuffix: "satellites",
  },
  {
    moduleSlug: "science-digital",
    emoji: "📱",
    headlineRef: { moduleSlug: "science-digital", metricKey: "upi_txn_per_month_billion" },
    format: "count_with_label",
    labelSuffix: "B UPI/mo",
  },
  {
    moduleSlug: "science-rd",
    emoji: "🔬",
    headlineRef: { moduleSlug: "science-rd", metricKey: "rd_pct_gdp" },
    format: "pct_decimal_2",
  },
  {
    moduleSlug: "trade-overview",
    emoji: "📦",
    headlineRef: { moduleSlug: "trade-overview", metricKey: "exports_annual_lakh_cr" },
    format: "lakhcr_simple",
  },
  {
    moduleSlug: "trade-fdi",
    emoji: "💰",
    headlineRef: { moduleSlug: "trade-fdi", metricKey: "fdi_equity_inflow_billion_usd" },
    format: "billion_usd_simple",
  },
  {
    moduleSlug: "trade-diaspora",
    emoji: "🌐",
    headlineRef: { moduleSlug: "trade-diaspora", metricKey: "remittances_annual_billion_usd" },
    format: "billion_usd_simple",
  },
];

// ── FEATURED zone (Startups & Unicorns) ──

export const FEATURED_HEADLINE_LABEL = "DPIIT-recognised";
export const FEATURED_DESCRIPTION =
  "India's startup ecosystem from the Startup India dashboard.";
export const FEATURED_RIGHT_CALLOUT_LABEL = "Unicorns";
export const FEATURED_RIGHT_CALLOUT_SUBLABEL = "as of 2024";
export const FEATURED_RIGHT_CALLOUT_REF: MetricRef = {
  moduleSlug: "science-startups",
  metricKey: "unicorns_count",
};
export const FEATURED_HEADLINE_REF: MetricRef = {
  moduleSlug: "science-startups",
  metricKey: "dpiit_recognised_lakh",
};
export const FEATURED_GROWTH_PILL_REF: MetricRef = {
  moduleSlug: "science-startups",
  metricKey: "change_yoy_lakh",
};
export const FEATURED_GROWTH_PILL_FORMAT = "+{value} lakh YoY";

// ── FEATURED CELLS ──

export type FeaturedCellPrimary =
  | { kind: "ref"; ref: MetricRef; primaryFormat: "decimal_1" | "integer" }
  | { kind: "static"; value: string };

export type FeaturedCell = {
  label: string;
  primary: FeaturedCellPrimary;
  sub: { kind: "static"; text: string };
};

export const FEATURED_CELLS: FeaturedCell[] = [
  {
    label: "DPIIT",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "science-startups", metricKey: "dpiit_recognised_lakh" },
      primaryFormat: "decimal_1",
    },
    sub: { kind: "static", text: "lakh · 2024" },
  },
  {
    label: "Unicorns",
    primary: {
      kind: "ref",
      ref: { moduleSlug: "science-startups", metricKey: "unicorns_count" },
      primaryFormat: "integer",
    },
    sub: { kind: "static", text: "DPIIT list" },
  },
  {
    label: "Top sector",
    primary: { kind: "static", value: "IT" },
    sub: { kind: "static", text: "Software · Services" },
  },
  {
    label: "Source",
    primary: { kind: "static", value: "DPIIT" },
    sub: { kind: "static", text: "Startup India" },
  },
];

// ── TOP STARTUP HUBS right card ──

export type TopStartupHubEntry = {
  rank: number;
  state: string;
  city: string;
  valueRef: MetricRef;
};

export const TOP_STARTUP_HUBS: TopStartupHubEntry[] = [
  { rank: 1, state: "Karnataka",  city: "Bangalore",  valueRef: { moduleSlug: "science-startups", metricKey: "top_state_ka_startups_thousand" } },
  { rank: 2, state: "Maharashtra", city: "Mumbai",    valueRef: { moduleSlug: "science-startups", metricKey: "top_state_mh_startups_thousand" } },
  { rank: 3, state: "Delhi NCR",  city: "",            valueRef: { moduleSlug: "science-startups", metricKey: "top_state_dl_startups_thousand" } },
  { rank: 4, state: "Tamil Nadu", city: "Chennai",     valueRef: { moduleSlug: "science-startups", metricKey: "top_state_tn_startups_thousand" } },
  { rank: 5, state: "Telangana",  city: "Hyderabad",   valueRef: { moduleSlug: "science-startups", metricKey: "top_state_tg_startups_thousand" } },
];

export const TOP_STARTUP_HUBS_FOOTER_LABEL = "All startup hubs";

// ── DIGITAL STACK right card ──

export type DigitalStackEntry = {
  label: string;
  valueRef: MetricRef;
  valueSuffix: string;
};

export const DIGITAL_STACK: DigitalStackEntry[] = [
  {
    label: "UPI/mo",
    valueRef: { moduleSlug: "science-digital", metricKey: "upi_txn_per_month_billion" },
    valueSuffix: " B txn",
  },
  {
    label: "Aadhaar",
    valueRef: { moduleSlug: "science-digital", metricKey: "aadhaar_enrolled_crore" },
    valueSuffix: " cr",
  },
  {
    label: "DigiLocker",
    valueRef: { moduleSlug: "science-digital", metricKey: "digilocker_users_crore" },
    valueSuffix: " cr users",
  },
  {
    label: "FASTag",
    valueRef: { moduleSlug: "science-digital", metricKey: "fastag_active_crore" },
    valueSuffix: " cr active",
  },
  {
    label: "ISRO sats",
    valueRef: { moduleSlug: "science-isro", metricKey: "satellites_launched_count" },
    valueSuffix: " launched",
  },
];

export const DIGITAL_STACK_FOOTER_LABEL = "Digital stack";

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

export function allInnovationRefs(): MetricRef[] {
  const refs: MetricRef[] = [
    FEATURED_HEADLINE_REF,
    FEATURED_GROWTH_PILL_REF,
    FEATURED_RIGHT_CALLOUT_REF,
  ];
  for (const row of INN_DIRECTORY) refs.push(row.headlineRef);
  for (const cell of FEATURED_CELLS) {
    if (cell.primary.kind === "ref") refs.push(cell.primary.ref);
  }
  for (const entry of TOP_STARTUP_HUBS) refs.push(entry.valueRef);
  for (const entry of DIGITAL_STACK) refs.push(entry.valueRef);
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
