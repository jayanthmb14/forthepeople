// Shared types, palettes, and guards for demographic chart components.

export type ReligionMap = Record<string, number>;

export type CasteMap = {
  SC?: number;
  ST?: number;
  Other?: number;
};

export type EmploymentData = {
  mainWorkersPct?: number;
  marginalWorkersPct?: number;
  nonWorkersPct?: number;
  workerParticipationRate?: number;
  cultivators?: number;
  agriLabourers?: number;
  householdInd?: number;
  otherWorkers?: number;
};

export type EducationData = {
  illiterate?: number;
  belowPrimary?: number;
  primary?: number;
  middle?: number;
  secondary?: number;
  higherSec?: number;
  graduate?: number;
  postgrad?: number;
};

export type MigrationData = {
  totalInMigrantsPct?: number;
  fromSameState?: number;
  fromOtherState?: number;
  fromAbroad?: number;
  reasons?: {
    work?: number;
    marriage?: number;
    education?: number;
    family?: number;
    other?: number;
  };
};

export type HouseholdAmenitiesData = {
  electricityPct?: number;
  tapWaterPct?: number;
  toiletPct?: number;
  lpgCleanFuelPct?: number;
  bankedHouseholdsPct?: number;
  internetPct?: number;
  source?: string;
};

export type LanguageData = {
  top10: { name: string; pct: number }[];
};

export type EconomicClassData = {
  mpiHeadcount?: number;
  mpiIntensity?: number;
  mpi?: number;
  bplPct?: number;
  districtRankInState?: number;
  source?: string;
};

export type AgeBand = { band: string; male: number; female: number };

export type ProfileLike = {
  religion?: unknown;
  caste?: unknown;
  employment?: unknown;
  economicClass?: unknown;
  education?: unknown;
  migration?: unknown;
  disability?: unknown;
  language?: unknown;
  householdAmenities?: unknown;
  maritalStatus?: unknown;
  sexRatio?: number | null;
  childSexRatio?: number | null;
  literacyTotal?: number | null;
  literacyMale?: number | null;
  literacyFemale?: number | null;
  pop_0_6?: number | null;
  pop_7_14?: number | null;
  pop_15_59?: number | null;
  pop_60_plus?: number | null;
  urbanPct?: number | null;
  urbanPopulation?: number | null;
  ruralPopulation?: number | null;
};

export function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.keys(v as object).length > 0
  );
}

// ── DATA PALETTE (series colours) ─────────────────────────────────────
// Design v3 says "no hex in components" — this block is the deliberate,
// documented exception. The Okabe-Ito palette (Okabe & Ito, 2008) and the
// Viridis ramp below are colour-blind-safe: people with red/green colour
// vision deficiency can still tell every series apart. A brand palette
// cannot promise that, so chart SERIES keep these colours on purpose
// (an accessibility choice). Chart CHROME — axes, tooltips, legends,
// cards — uses the var(--ftp-*) tokens via ../chartKit.tsx.
//
// Okabe-Ito colorblind-safe 8-color palette.
export const OKABE_ITO = {
  black: "#000000",
  orange: "#E69F00",
  skyBlue: "#56B4E9",
  bluishGreen: "#009E73",
  yellow: "#F0E442",
  blue: "#0072B2",
  vermillion: "#D55E00",
  reddishPurple: "#CC79A7",
};

// Alphabetical religion list — used for ordering in every religion chart.
export const ALPHABETICAL_RELIGIONS = [
  "Buddhist",
  "Christian",
  "Hindu",
  "Jain",
  "Muslim",
  "NotStated",
  "Other",
  "Sikh",
];

// Stable color assignment by religion key (alphabetical).
export const RELIGION_COLORS: Record<string, string> = {
  Buddhist: OKABE_ITO.orange,
  Christian: OKABE_ITO.skyBlue,
  Hindu: OKABE_ITO.bluishGreen,
  Jain: OKABE_ITO.yellow,
  Muslim: OKABE_ITO.blue,
  NotStated: "var(--ftp-border-strong)", // neutral token, not a series hue
  Other: OKABE_ITO.reddishPurple,
  Sikh: OKABE_ITO.vermillion,
};

// Neutral greys for caste (avoid saturated colour on any category).
// Built from design tokens so they follow light / dark mode.
export const CASTE_COLORS = {
  SC: "var(--ftp-text-2)",
  ST: "color-mix(in srgb, var(--ftp-text-2) 55%, var(--ftp-surface))",
  Other: "var(--ftp-border-strong)",
};

// Viridis-like sequential palette (for ordinal data: education, MPI heatmaps, etc).
export const VIRIDIS = [
  "#440154",
  "#482777",
  "#3f4a8a",
  "#31678e",
  "#26838f",
  "#1f9d8a",
  "#6cce5a",
  "#b6de2b",
  "#fee825",
];

// Sex (biological) — male/female dichotomous display colors per Okabe-Ito spec.
export const SEX_COLORS = {
  male: OKABE_ITO.blue,
  female: OKABE_ITO.vermillion,
};
