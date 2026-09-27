/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Real data for the India module deep-dive and category pages.
 *
 * Everything here reads the published tables — IndiaIndicator,
 * IndiaTimeSeries and IndiaStateBreakdown — and nothing else. The old
 * placeholder numbers (registry `headlineMetric.mockValue`, the
 * hash-generated 10-year line, mock-state-data) are no longer shown: a
 * picture only appears when these tables hold the rows to draw it.
 *
 * A failed query returns an empty result, so a database hiccup hides the
 * pictures instead of breaking the page.
 */

import { prisma } from "@/lib/db";

export interface IndicatorRow {
  moduleSlug: string;
  metricKey: string;
  /** English label as stored (database text; shown as-is). */
  metricLabel: string;
  value: number | null;
  textValue: string | null;
  unit: string | null;
  asOf: string;
  fetchedAt: string;
  source: string;
  sourceUrl: string;
  quality: "published" | "derived" | "estimated";
  previousValue: number | null;
  previousAsOf: string | null;
  methodologyUrl: string | null;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface ModuleSeries {
  metricKey: string;
  unit: string | null;
  source: string;
  sourceUrl: string;
  points: SeriesPoint[];
}

export interface StateValue {
  stateSlug: string;
  stateName: string;
  value: number;
  unit: string | null;
  asOf: string;
  source: string;
  sourceUrl: string;
}

type RawIndicator = {
  moduleSlug: string;
  metricKey: string;
  metricLabel: string;
  numericValue: unknown;
  textValue: string | null;
  unit: string | null;
  asOfDate: Date;
  fetchedAt: Date;
  source: string;
  sourceUrl: string;
  dataQuality: string;
  previousValue: unknown;
  previousAsOfDate: Date | null;
  methodologyUrl: string | null;
};

function toRow(r: RawIndicator): IndicatorRow {
  const q = r.dataQuality === "derived" || r.dataQuality === "estimated" ? r.dataQuality : "published";
  return {
    moduleSlug: r.moduleSlug,
    metricKey: r.metricKey,
    metricLabel: r.metricLabel,
    value: r.numericValue == null ? null : Number(r.numericValue),
    textValue: r.textValue,
    unit: r.unit,
    asOf: r.asOfDate.toISOString(),
    fetchedAt: r.fetchedAt.toISOString(),
    source: r.source,
    sourceUrl: r.sourceUrl,
    quality: q,
    previousValue: r.previousValue == null ? null : Number(r.previousValue),
    previousAsOf: r.previousAsOfDate ? r.previousAsOfDate.toISOString() : null,
    methodologyUrl: r.methodologyUrl,
  };
}

/** Every published indicator row of one module, in display order. */
export async function getModuleIndicators(moduleSlug: string): Promise<IndicatorRow[]> {
  try {
    const rows = await prisma.indiaIndicator.findMany({
      where: { moduleSlug },
      orderBy: [{ displayOrder: "asc" }, { metricKey: "asc" }],
    });
    return rows.map((r) => toRow(r as unknown as RawIndicator));
  } catch {
    return [];
  }
}

/** Indicator rows for many modules at once, grouped by module slug. */
export async function getIndicatorsForModules(slugs: string[]): Promise<Record<string, IndicatorRow[]>> {
  if (slugs.length === 0) return {};
  try {
    const rows = await prisma.indiaIndicator.findMany({
      where: { moduleSlug: { in: slugs } },
      orderBy: [{ displayOrder: "asc" }, { metricKey: "asc" }],
    });
    const out: Record<string, IndicatorRow[]> = {};
    for (const r of rows) (out[r.moduleSlug] ??= []).push(toRow(r as unknown as RawIndicator));
    return out;
  } catch {
    return {};
  }
}

/** Time series of one module (only series with at least two points). */
export async function getModuleSeries(moduleSlug: string): Promise<ModuleSeries[]> {
  try {
    const rows = await prisma.indiaTimeSeries.findMany({
      where: { moduleSlug },
      orderBy: { date: "asc" },
    });
    const by = new Map<string, ModuleSeries>();
    for (const r of rows) {
      let s = by.get(r.metricKey);
      if (!s) {
        s = { metricKey: r.metricKey, unit: r.unit, source: r.source, sourceUrl: r.sourceUrl, points: [] };
        by.set(r.metricKey, s);
      }
      s.points.push({ date: r.date.toISOString(), value: Number(r.value) });
      s.source = r.source;
      s.sourceUrl = r.sourceUrl;
    }
    return [...by.values()].filter((s) => s.points.length >= 2);
  } catch {
    return [];
  }
}

/** State-wise rows of one module, grouped by metric, largest first. */
export async function getModuleStates(moduleSlug: string): Promise<Record<string, StateValue[]>> {
  try {
    const rows = await prisma.indiaStateBreakdown.findMany({
      where: { moduleSlug },
      orderBy: { value: "desc" },
    });
    const out: Record<string, StateValue[]> = {};
    for (const r of rows) {
      (out[r.metricKey] ??= []).push({
        stateSlug: r.stateSlug,
        stateName: r.stateName,
        value: Number(r.value),
        unit: r.unit,
        asOf: r.asOfDate.toISOString(),
        source: r.source,
        sourceUrl: r.sourceUrl,
      });
    }
    return out;
  } catch {
    return {};
  }
}

// ── Sorting indicator rows into pictures ──────────────────────────────

/**
 * State codes used inside `top_state_<code>_…` metric keys → state slugs
 * (the slugs of the shared "states" messages).
 */
const STATE_CODE: Record<string, string> = {
  mh: "maharashtra",
  gj: "gujarat",
  tn: "tamil-nadu",
  rj: "rajasthan",
  kn: "karnataka",
  ka: "karnataka",
  up: "uttar-pradesh",
  pb: "punjab",
  wb: "west-bengal",
  mp: "madhya-pradesh",
  ap: "andhra-pradesh",
  dl: "delhi",
  tg: "telangana",
  mizoram: "mizoram",
  arunachal: "arunachal-pradesh",
  meghalaya: "meghalaya",
  manipur: "manipur",
  nagaland: "nagaland",
};

export interface TopStateItem {
  stateSlug: string;
  /** Optional crop word ("wheat" / "rice") when the list mixes crops. */
  crop?: "wheat" | "rice";
  row: IndicatorRow;
}

export interface MixItem {
  /** coal | renewables | hydro | nuclear */
  part: string;
  row: IndicatorRow;
}

export interface IndicatorGroups {
  /** Rows shown as KPI tiles. */
  tiles: IndicatorRow[];
  /** `top_state_<code>_…` rows sharing one unit (a top-states bar list). */
  topStates: TopStateItem[];
  /** `mix_pct_<part>` rows (an energy-mix donut). */
  mix: MixItem[];
  /** Percentage rows (per-item rings). */
  percents: IndicatorRow[];
}

/** Metadata rows that describe the dataset rather than measure anything. */
const META_KEY = /^(data_year|estimate_year|isfr_year|isfr_edition)$|^unesco_.+_year$/;

/**
 * The one figure that best stands for a module on a card: the registry's
 * headline metric when the table has it, otherwise the first measuring row
 * (not a rank or a year). Undefined when the module has no rows.
 */
export function pickHeadline(headlineKey: string | undefined, rows: IndicatorRow[]): IndicatorRow | undefined {
  const tiles = groupIndicators(rows).tiles;
  return (
    tiles.find((r) => r.metricKey === headlineKey) ??
    tiles.find((r) => r.unit !== "rank" && r.unit !== "year") ??
    tiles[0]
  );
}

/**
 * Published "now" rows paired with a published goal row of the same unit
 * (both come from IndiaIndicator). Drawn as "how close to the goal".
 */
export const GOAL_PAIRS: Record<string, Array<[now: string, goal: string]>> = {
  "wildlife-forests": [["forest_cover_pct", "forest_cover_target_pct"]],
  "health-overview": [["life_expectancy_years", "life_expectancy_target_2030"]],
  "energy-power": [["renewables_capacity_gw", "re_target_gw_2030"]],
  "infra-roads": [["nh_length_km", "nh_target_km_2027"]],
  "justice-police": [["police_per_lakh_population", "un_target_per_lakh"]],
};

export function groupIndicators(rows: IndicatorRow[]): IndicatorGroups {
  const withValue = rows.filter((r) => r.value !== null && Number.isFinite(r.value));
  const topStates: TopStateItem[] = [];
  const mix: MixItem[] = [];
  const tiles: IndicatorRow[] = [];

  for (const r of withValue) {
    const ts = /^top_state_([a-z]+)_/.exec(r.metricKey);
    if (ts && STATE_CODE[ts[1]]) {
      const crop = r.metricKey.includes("_wheat_") ? "wheat" : r.metricKey.includes("_rice_") ? "rice" : undefined;
      topStates.push({ stateSlug: STATE_CODE[ts[1]], crop, row: r });
      continue;
    }
    const mx = /^mix_pct_([a-z]+)$/.exec(r.metricKey);
    if (mx) {
      mix.push({ part: mx[1], row: r });
      continue;
    }
    if (r.metricKey.startsWith("state_leader_") || META_KEY.test(r.metricKey)) continue;
    tiles.push(r);
  }

  // A bar list only compares like with like: keep the largest group sharing one unit.
  const byUnit = new Map<string, TopStateItem[]>();
  for (const s of topStates) {
    const k = s.row.unit ?? "";
    byUnit.set(k, [...(byUnit.get(k) ?? []), s]);
  }
  const biggest = [...byUnit.values()].sort((a, b) => b.length - a.length)[0] ?? [];
  const sameUnit = biggest.length >= 3 ? biggest.sort((a, b) => (b.row.value ?? 0) - (a.row.value ?? 0)) : [];
  const mixedCrops = new Set(sameUnit.map((s) => s.crop).filter(Boolean)).size > 1;
  const topList = sameUnit.map((s) => (mixedCrops ? s : { ...s, crop: undefined }));

  // Rings read as "a share out of 100": only for shares (cover, turnout,
  // conviction), not for rates of change or targets (inflation, growth).
  const percents = tiles.filter(
    (r) =>
      r.unit === "percent" &&
      (r.value ?? 0) >= 0 &&
      (r.value ?? 0) <= 100 &&
      !/inflation|growth|yoy|target|change/.test(r.metricKey),
  );

  return { tiles, topStates: topList, mix: mix.length >= 2 ? mix : [], percents: percents.length >= 2 ? percents : [] };
}
