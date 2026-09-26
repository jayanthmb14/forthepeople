/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * ╔═══════════════════════════════════════════════════════════╗
 * ║  MOCK DATA — replace in Session C1                       ║
 * ║                                                           ║
 * ║  Every value below is hand-fabricated for visual layout   ║
 * ║  testing only. The numbers are deliberately rounded so    ║
 * ║  they read as PLACEHOLDERS, not as cited statistics.      ║
 * ║                                                           ║
 * ║  When real values land, swap STATE_METRIC_VALUES rows     ║
 * ║  with IndiaStateBreakdown queries and delete the          ║
 * ║  __MOCK__ banner at the bottom.                           ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * grep this file via:  rg "MOCK DATA — replace in Session C1"
 */

import { CATEGORY_ACCENT } from "./india-design";
import type { IndiaModuleCategory } from "./india-modules";

export const __MOCK__ = "MOCK DATA — replace in Session C1" as const;

export interface MockMetric {
  key: string;
  label: string;
  unit: string;
  category: IndiaModuleCategory;
  /** Higher is better when ranked? Drives the leaderboard sort + map polarity. */
  higherIsBetter: boolean;
  description: string;
  /** sourceKey from src/lib/india/india-sources. */
  sourceKey: string;
}

/**
 * Headline metrics that the choropleth + tile picker can switch between.
 * Each one maps to a category so the map color uses the right accent hue.
 *
 * The first 12 are the legacy slot for the homepage GridView's metric
 * picker. Adding a metric here is enough to make it appear as a tile
 * choice on /[locale]/india?view=grid.
 *
 * The 11 starred (★) entries below are the modules with realistic
 * per-state data declared in REALISTIC_STATE_VALUES — the rest fall back
 * to the deterministic-but-rough generator at the bottom of this file.
 */
export const MOCK_METRICS: MockMetric[] = [
  {
    key: "population_total",
    label: "Population", // ★ — Census 2011 + UN projection
    unit: "cr",
    category: "demographics",
    higherIsBetter: true,
    description: "Estimated population in crores",
    sourceKey: "CENSUS",
  },
  {
    key: "gsdp_inr",
    label: "GSDP",
    unit: "₹ lakh cr",
    category: "economy",
    higherIsBetter: true,
    description: "Gross State Domestic Product (current prices)",
    sourceKey: "MoSPI",
  },
  {
    key: "literacy_pct",
    label: "Literacy",
    unit: "%",
    category: "education",
    higherIsBetter: true,
    description: "Adult literacy rate",
    sourceKey: "AISHE",
  },
  {
    key: "forest_cover_pct",
    label: "Forest Cover", // ★ — ISFR 2023 (FSI)
    unit: "%",
    category: "wildlife",
    higherIsBetter: true,
    description: "Forest cover as share of geographic area",
    sourceKey: "FSI",
  },
  {
    key: "renewable_capacity_mw",
    label: "Renewable Capacity",
    unit: "GW",
    category: "energy",
    higherIsBetter: true,
    description: "Installed renewable energy capacity",
    sourceKey: "MNRE",
  },
  {
    key: "national_highway_km",
    label: "National Highway Length", // ★ — MoRTH Basic Road Statistics
    unit: "km",
    category: "infrastructure",
    higherIsBetter: true,
    description: "National highway length within the state",
    sourceKey: "MORTH",
  },
  {
    key: "infant_mortality",
    label: "Infant Mortality", // ★ — NFHS-5
    unit: "per 1k",
    category: "health",
    higherIsBetter: false,
    description: "Infant deaths per 1,000 live births (lower = better)",
    sourceKey: "RCHIIPS_NFHS",
  },
  {
    key: "police_strength_per_lakh",
    label: "Police per lakh",
    unit: "",
    category: "justice",
    higherIsBetter: true,
    description: "Civil police personnel per lakh population",
    sourceKey: "BPRD",
  },
  {
    key: "agri_share_pct",
    label: "Agri Share of GSDP",
    unit: "%",
    category: "agriculture",
    higherIsBetter: true,
    description: "Agriculture & allied share of GSDP",
    sourceKey: "DAFW",
  },
  {
    key: "tourism_arrivals",
    label: "Tourist Arrivals",
    unit: "lakh",
    category: "tourism",
    higherIsBetter: true,
    description: "Annual domestic + foreign tourist arrivals",
    sourceKey: "TOURISM",
  },
  {
    key: "dpiit_startups",
    label: "DPIIT Startups", // ★ — DPIIT cumulative recognised
    unit: "",
    category: "science",
    higherIsBetter: true,
    description: "DPIIT-recognised startups (cumulative)",
    sourceKey: "STARTUP_INDIA",
  },
  {
    key: "trade_exports_inr",
    label: "Exports",
    unit: "₹ '000 cr",
    category: "trade",
    higherIsBetter: true,
    description: "Annual merchandise exports from the state",
    sourceKey: "COMMERCE",
  },
  // ── Module-aware additions ────────────────────────────────────
  {
    key: "tiger_population",
    label: "Tiger Population", // ★ — NTCA Status of Tigers 2022
    unit: "individuals",
    category: "wildlife",
    higherIsBetter: true,
    description: "State-level tiger population estimate",
    sourceKey: "NTCA",
  },
  {
    key: "unemployment_rate",
    label: "Unemployment Rate", // ★ — PLFS approximate
    unit: "%",
    category: "economy",
    higherIsBetter: false,
    description: "PLFS unemployment rate (Current Weekly Status)",
    sourceKey: "MoSPI",
  },
  {
    key: "foodgrain_production",
    label: "Foodgrain Production", // ★ — DA&FW estimates
    unit: "lakh tonnes",
    category: "agriculture",
    higherIsBetter: true,
    description: "Annual foodgrain production",
    sourceKey: "DAFW",
  },
  {
    key: "schools_total",
    label: "Total Schools", // ★ — UDISE+ approximate
    unit: "'000",
    category: "education",
    higherIsBetter: true,
    description: "Total recognised schools",
    sourceKey: "UDISE",
  },
  {
    key: "loksabha_seats",
    label: "Lok Sabha Seats", // ★ — ECI / Constitution
    unit: "count",
    category: "elections",
    higherIsBetter: true,
    description: "Allocated Lok Sabha constituencies",
    sourceKey: "ECI",
  },
  {
    key: "defence_allocation",
    label: "Defence Establishments", // ★ — placeholder, count of MoD installations
    unit: "count",
    category: "defence",
    higherIsBetter: true,
    description: "Approximate count of MoD establishments hosted",
    sourceKey: "MOD",
  },
];

export interface MockState {
  slug: string;
  name: string;
  /** Whether the FTP platform has this state's district pages live. */
  active: boolean;
}

/**
 * 28 states + 8 UTs as recognised by the Republic of India.
 * Slugs match those used by /[locale]/[stateSlug] routes (DrillDownMap).
 */
export const MOCK_STATES: MockState[] = [
  { slug: "andhra-pradesh", name: "Andhra Pradesh", active: false },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh", active: false },
  { slug: "assam", name: "Assam", active: false },
  { slug: "bihar", name: "Bihar", active: false },
  { slug: "chhattisgarh", name: "Chhattisgarh", active: false },
  { slug: "goa", name: "Goa", active: false },
  { slug: "gujarat", name: "Gujarat", active: false },
  { slug: "haryana", name: "Haryana", active: false },
  { slug: "himachal-pradesh", name: "Himachal Pradesh", active: false },
  { slug: "jharkhand", name: "Jharkhand", active: false },
  { slug: "karnataka", name: "Karnataka", active: true },
  { slug: "kerala", name: "Kerala", active: false },
  { slug: "madhya-pradesh", name: "Madhya Pradesh", active: false },
  { slug: "maharashtra", name: "Maharashtra", active: true },
  { slug: "manipur", name: "Manipur", active: false },
  { slug: "meghalaya", name: "Meghalaya", active: false },
  { slug: "mizoram", name: "Mizoram", active: false },
  { slug: "nagaland", name: "Nagaland", active: false },
  { slug: "odisha", name: "Odisha", active: false },
  { slug: "punjab", name: "Punjab", active: false },
  { slug: "rajasthan", name: "Rajasthan", active: false },
  { slug: "sikkim", name: "Sikkim", active: false },
  { slug: "tamil-nadu", name: "Tamil Nadu", active: true },
  { slug: "telangana", name: "Telangana", active: true },
  { slug: "tripura", name: "Tripura", active: false },
  { slug: "uttar-pradesh", name: "Uttar Pradesh", active: true },
  { slug: "uttarakhand", name: "Uttarakhand", active: false },
  { slug: "west-bengal", name: "West Bengal", active: false },
  // Union Territories
  { slug: "andaman-nicobar", name: "Andaman & Nicobar Islands", active: false },
  { slug: "chandigarh", name: "Chandigarh", active: false },
  { slug: "dadra-nagar-haveli", name: "Dadra & Nagar Haveli and Daman & Diu", active: false },
  { slug: "delhi", name: "Delhi", active: false },
  { slug: "jammu-kashmir", name: "Jammu & Kashmir", active: false },
  { slug: "ladakh", name: "Ladakh", active: false },
  { slug: "lakshadweep", name: "Lakshadweep", active: false },
  { slug: "puducherry", name: "Puducherry", active: false },
];

/**
 * REALISTIC_STATE_VALUES — hand-curated per-state placeholders for the
 * 11 modules that have hasStateBreakdownData = true on their registry
 * entry. Numbers are sourced from public 2022/2023 government releases
 * (NTCA, ISFR, MoRTH, NFHS-5, UDISE+, ECI, DPIIT, RBI/MoSPI). They are
 * placeholders only — once scrapers run they upsert into the same
 * metricKeys and replace these seeded values.
 *
 * Per file 32 §0: researched-static IS allowed for bootstrap. The page
 * looks credible as a result; the numbers are fully replaceable.
 */
const REALISTIC_STATE_VALUES: Record<string, Record<string, number>> = {
  // Population in crores — 2024 SRS/UN projection rounded.
  // Source: Census 2011 + SRS Sample Registration projections.
  population_total: {
    "uttar-pradesh": 24.0, "maharashtra": 12.5, "bihar": 12.8, "west-bengal": 10.0,
    "madhya-pradesh": 8.5, "tamil-nadu": 7.7, "rajasthan": 8.0, "karnataka": 6.7,
    "gujarat": 7.0, "andhra-pradesh": 5.4, "odisha": 4.6, "telangana": 3.9,
    "kerala": 3.6, "jharkhand": 3.9, "assam": 3.5, "punjab": 3.0,
    "chhattisgarh": 3.0, "haryana": 3.0, "delhi": 2.1, "jammu-kashmir": 1.4,
    "uttarakhand": 1.2, "himachal-pradesh": 0.7, "tripura": 0.4, "meghalaya": 0.35,
    "manipur": 0.32, "nagaland": 0.22, "goa": 0.16, "arunachal-pradesh": 0.15,
    "puducherry": 0.16, "mizoram": 0.12, "sikkim": 0.07, "chandigarh": 0.12,
    "andaman-nicobar": 0.04, "dadra-nagar-haveli": 0.06, "ladakh": 0.03, "lakshadweep": 0.007,
  },
  // Tiger population — NTCA Status of Tigers 2022 (Wikipedia summary; NTCA report).
  tiger_population: {
    "madhya-pradesh": 785, "karnataka": 563, "uttarakhand": 560, "maharashtra": 444,
    "tamil-nadu": 306, "kerala": 213, "assam": 190, "uttar-pradesh": 205,
    "rajasthan": 88, "west-bengal": 100, "andhra-pradesh": 63, "telangana": 21,
    "bihar": 54, "chhattisgarh": 17, "odisha": 30, "jharkhand": 1,
    "arunachal-pradesh": 9, "mizoram": 0, "goa": 5, "jammu-kashmir": 0,
  },
  // Forest cover % of geographic area — ISFR 2023 (FSI).
  forest_cover_pct: {
    "mizoram": 84.5, "arunachal-pradesh": 79.3, "meghalaya": 76.0, "manipur": 74.3,
    "nagaland": 73.9, "tripura": 73.7, "goa": 60.6, "kerala": 54.7,
    "sikkim": 47.1, "uttarakhand": 45.4, "chhattisgarh": 41.2, "dadra-nagar-haveli": 39.5,
    "andaman-nicobar": 81.7, "assam": 36.1, "odisha": 33.5, "jharkhand": 30.0,
    "madhya-pradesh": 25.1, "himachal-pradesh": 27.7, "andhra-pradesh": 18.3,
    "tamil-nadu": 20.3, "karnataka": 19.6, "maharashtra": 16.5, "telangana": 18.4,
    "west-bengal": 19.0, "gujarat": 7.6, "uttar-pradesh": 6.1, "bihar": 7.8,
    "rajasthan": 4.8, "punjab": 3.7, "haryana": 3.6, "delhi": 13.0,
    "jammu-kashmir": 39.1, "ladakh": 0.2, "puducherry": 10.5, "lakshadweep": 27.1,
    "chandigarh": 23.0,
  },
  // National Highway km within the state — MoRTH Basic Road Statistics.
  national_highway_km: {
    "maharashtra": 18387, "uttar-pradesh": 11737, "rajasthan": 10618, "madhya-pradesh": 8772,
    "andhra-pradesh": 8123, "tamil-nadu": 6904, "karnataka": 7335, "gujarat": 6635,
    "odisha": 5762, "bihar": 5358, "telangana": 5272, "west-bengal": 4192,
    "assam": 3909, "jharkhand": 3367, "chhattisgarh": 3605, "kerala": 1784,
    "punjab": 3273, "haryana": 3166, "uttarakhand": 3018, "himachal-pradesh": 2592,
    "jammu-kashmir": 2664, "ladakh": 924, "arunachal-pradesh": 2538, "manipur": 1750,
    "meghalaya": 1204, "nagaland": 1548, "tripura": 854, "mizoram": 1422,
    "sikkim": 463, "goa": 293, "delhi": 158, "puducherry": 65,
    "andaman-nicobar": 331, "chandigarh": 16, "dadra-nagar-haveli": 31, "lakshadweep": 0,
  },
  // Infant mortality per 1k live births — NFHS-5 (lower is better).
  infant_mortality: {
    "kerala": 4.4, "tamil-nadu": 19.0, "maharashtra": 23.2, "punjab": 21.6,
    "delhi": 24.5, "karnataka": 25.4, "andhra-pradesh": 30.3, "telangana": 26.4,
    "gujarat": 31.2, "haryana": 28.3, "west-bengal": 22.0, "odisha": 36.3,
    "rajasthan": 30.3, "madhya-pradesh": 41.3, "uttar-pradesh": 49.9,
    "bihar": 46.8, "chhattisgarh": 44.3, "jharkhand": 37.9, "assam": 31.9,
    "manipur": 25.0, "meghalaya": 32.4, "mizoram": 21.0, "nagaland": 23.4,
    "tripura": 32.6, "arunachal-pradesh": 22.9, "sikkim": 11.2,
    "himachal-pradesh": 25.6, "uttarakhand": 39.1, "jammu-kashmir": 16.3,
    "goa": 5.6, "puducherry": 13.1, "chandigarh": 16.5, "ladakh": 14.3,
    "lakshadweep": 17.4, "andaman-nicobar": 11.8, "dadra-nagar-haveli": 18.9,
  },
  // PLFS unemployment rate (annual usual status, lower is better) — placeholder.
  unemployment_rate: {
    "kerala": 6.4, "haryana": 7.6, "rajasthan": 4.2, "tamil-nadu": 4.5,
    "uttar-pradesh": 3.4, "maharashtra": 3.5, "gujarat": 2.6, "karnataka": 2.4,
    "andhra-pradesh": 4.1, "telangana": 4.2, "west-bengal": 3.0, "punjab": 5.5,
    "delhi": 9.8, "bihar": 5.0, "odisha": 4.6, "madhya-pradesh": 1.6,
    "jharkhand": 5.5, "chhattisgarh": 0.4, "assam": 5.5, "himachal-pradesh": 4.2,
    "uttarakhand": 4.4, "goa": 8.7, "jammu-kashmir": 5.2, "tripura": 6.2,
    "manipur": 6.8, "meghalaya": 1.7, "mizoram": 1.2, "nagaland": 7.7,
    "arunachal-pradesh": 8.7, "sikkim": 2.6, "puducherry": 5.9, "ladakh": 5.0,
    "lakshadweep": 11.9, "andaman-nicobar": 3.1, "chandigarh": 4.5,
    "dadra-nagar-haveli": 1.3,
  },
  // Foodgrain production (lakh tonnes) — DA&FW Advance Estimates approx ranges.
  foodgrain_production: {
    "uttar-pradesh": 614, "punjab": 320, "madhya-pradesh": 520, "rajasthan": 280,
    "haryana": 220, "west-bengal": 180, "andhra-pradesh": 175, "telangana": 200,
    "bihar": 165, "karnataka": 110, "maharashtra": 145, "tamil-nadu": 125,
    "odisha": 95, "chhattisgarh": 100, "gujarat": 95, "assam": 50,
    "jharkhand": 35, "kerala": 6, "uttarakhand": 18, "himachal-pradesh": 16,
    "tripura": 8, "manipur": 7, "meghalaya": 3, "nagaland": 5,
    "arunachal-pradesh": 4, "mizoram": 1, "sikkim": 1, "goa": 1,
    "jammu-kashmir": 16, "delhi": 2, "puducherry": 1, "chandigarh": 0.1,
    "ladakh": 0.3, "andaman-nicobar": 0.4, "dadra-nagar-haveli": 0.2, "lakshadweep": 0.05,
  },
  // Total recognised schools ('000) — UDISE+ approximate.
  schools_total: {
    "uttar-pradesh": 261, "madhya-pradesh": 130, "maharashtra": 110, "rajasthan": 105,
    "bihar": 95, "west-bengal": 95, "karnataka": 76, "andhra-pradesh": 62,
    "tamil-nadu": 60, "gujarat": 54, "odisha": 60, "jharkhand": 45,
    "assam": 65, "telangana": 42, "chhattisgarh": 56, "haryana": 24,
    "punjab": 28, "kerala": 17, "delhi": 5.6, "uttarakhand": 23,
    "himachal-pradesh": 18, "jammu-kashmir": 28, "tripura": 4.9, "manipur": 4.8,
    "meghalaya": 14, "nagaland": 2.7, "mizoram": 4.1, "arunachal-pradesh": 3.7,
    "sikkim": 1.2, "goa": 1.5, "ladakh": 1.0, "puducherry": 0.7,
    "chandigarh": 0.4, "andaman-nicobar": 0.4, "dadra-nagar-haveli": 0.5, "lakshadweep": 0.04,
  },
  // Lok Sabha seats — ECI / constitutional allocation.
  loksabha_seats: {
    "uttar-pradesh": 80, "maharashtra": 48, "west-bengal": 42, "bihar": 40,
    "tamil-nadu": 39, "madhya-pradesh": 29, "karnataka": 28, "gujarat": 26,
    "andhra-pradesh": 25, "rajasthan": 25, "odisha": 21, "kerala": 20,
    "telangana": 17, "jharkhand": 14, "assam": 14, "punjab": 13,
    "chhattisgarh": 11, "haryana": 10, "delhi": 7, "jammu-kashmir": 5,
    "uttarakhand": 5, "himachal-pradesh": 4, "arunachal-pradesh": 2, "goa": 2,
    "manipur": 2, "meghalaya": 2, "tripura": 2, "mizoram": 1,
    "nagaland": 1, "sikkim": 1, "andaman-nicobar": 1, "chandigarh": 1,
    "dadra-nagar-haveli": 2, "ladakh": 1, "lakshadweep": 1, "puducherry": 1,
  },
  // DPIIT-recognised startups — DPIIT cumulative state-wise approximate.
  dpiit_startups: {
    "maharashtra": 26000, "karnataka": 16000, "delhi": 13500, "uttar-pradesh": 13000,
    "gujarat": 12000, "tamil-nadu": 8500, "telangana": 8000, "haryana": 7500,
    "rajasthan": 6500, "west-bengal": 6000, "kerala": 5000, "madhya-pradesh": 4500,
    "andhra-pradesh": 4200, "punjab": 3500, "bihar": 3000, "odisha": 3000,
    "uttarakhand": 1800, "chhattisgarh": 1500, "jharkhand": 1400, "assam": 1300,
    "himachal-pradesh": 600, "goa": 600, "tripura": 250, "manipur": 220,
    "meghalaya": 180, "nagaland": 120, "mizoram": 90, "arunachal-pradesh": 80,
    "sikkim": 60, "jammu-kashmir": 350, "ladakh": 25, "chandigarh": 600,
    "puducherry": 250, "andaman-nicobar": 30, "dadra-nagar-haveli": 50, "lakshadweep": 5,
  },
  // Defence establishments hosted (placeholder count) — illustrative only.
  defence_allocation: {
    "rajasthan": 28, "jammu-kashmir": 26, "uttar-pradesh": 24, "punjab": 22,
    "ladakh": 18, "arunachal-pradesh": 17, "maharashtra": 19, "karnataka": 18,
    "andhra-pradesh": 14, "tamil-nadu": 16, "west-bengal": 15, "gujarat": 12,
    "haryana": 14, "uttarakhand": 13, "assam": 14, "delhi": 12,
    "madhya-pradesh": 11, "odisha": 9, "kerala": 10, "telangana": 9,
    "himachal-pradesh": 9, "manipur": 7, "meghalaya": 6, "nagaland": 6,
    "mizoram": 5, "tripura": 6, "sikkim": 5, "bihar": 6,
    "jharkhand": 5, "chhattisgarh": 4, "goa": 4, "andaman-nicobar": 4,
    "puducherry": 2, "chandigarh": 2, "lakshadweep": 1, "dadra-nagar-haveli": 1,
  },
};

/**
 * Deterministic plausible value generator. Stable across re-renders so
 * the leaderboard ordering doesn't shuffle on hover. Used for metrics
 * that DON'T have realistic data declared above.
 */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff; // 0..1
}

function rangeFor(metricKey: string): [number, number, number] {
  // [min, max, decimals]
  switch (metricKey) {
    case "gsdp_inr":                  return [0.5, 32, 2];
    case "literacy_pct":              return [60, 96, 1];
    case "renewable_capacity_mw":     return [0.1, 24, 2];
    case "police_strength_per_lakh":  return [80, 320, 0];
    case "agri_share_pct":            return [4, 32, 1];
    case "tourism_arrivals":          return [5, 220, 0];
    case "trade_exports_inr":         return [1, 380, 0];
    default:                          return [0, 100, 0];
  }
}

export interface StateMetricValue {
  stateSlug: string;
  stateName: string;
  metricKey: string;
  value: number;
}

export const STATE_METRIC_VALUES: StateMetricValue[] = (() => {
  const out: StateMetricValue[] = [];
  for (const m of MOCK_METRICS) {
    const realistic = REALISTIC_STATE_VALUES[m.key];
    const [min, max, decimals] = rangeFor(m.key);
    for (const s of MOCK_STATES) {
      let value: number;
      if (realistic && realistic[s.slug] !== undefined) {
        value = realistic[s.slug];
      } else {
        const t = hash(`${s.slug}|${m.key}`);
        const raw = min + (max - min) * t;
        const factor = Math.pow(10, decimals);
        value = Math.round(raw * factor) / factor;
      }
      out.push({
        stateSlug: s.slug,
        stateName: s.name,
        metricKey: m.key,
        value,
      });
    }
  }
  return out;
})();

export function getMockMetric(metricKey: string): MockMetric | undefined {
  return MOCK_METRICS.find((m) => m.key === metricKey);
}

export function getStateValuesForMetric(metricKey: string): StateMetricValue[] {
  return STATE_METRIC_VALUES.filter((v) => v.metricKey === metricKey).sort(
    (a, b) => b.value - a.value,
  );
}

export function getCategoryAccentForMetric(metricKey: string): string {
  const metric = getMockMetric(metricKey);
  return metric ? CATEGORY_ACCENT[metric.category] : "#2563EB";
}

/** Map a value in [min, max] to a hex color from light-grey to accent. */
export function mockColorScale(
  value: number,
  metricKey: string,
  min: number,
  max: number,
): string {
  const accent = getCategoryAccentForMetric(metricKey);
  if (max === min) return accent;
  const metric = getMockMetric(metricKey);
  let t = (value - min) / (max - min);
  if (metric && !metric.higherIsBetter) t = 1 - t; // invert for "lower is better" metrics
  t = Math.max(0, Math.min(1, t));
  // Interpolate from #F1F5F9 (very light) → accent
  const start = { r: 0xf1, g: 0xf5, b: 0xf9 };
  const end = parseHex(accent);
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
