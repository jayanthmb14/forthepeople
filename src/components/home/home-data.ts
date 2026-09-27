/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Home page — server-side loaders (database + the cached price snapshot)
// ═══════════════════════════════════════════════════════════════════════
//
//  SERVER ONLY: imports Prisma. Only src/app/[locale]/page.tsx calls these.
//  (Market prices need no database: see home-markets.ts.)
//  Every loader is read-only and never throws: a failed query leaves its
//  part of the page out (or shows an empty state), it never invents a number.
//
//  The per-district figures follow the SAME rules as the district pages,
//  so a number on the home map matches the number one tap away:
//    population   DemographicProfile → Census row in PopulationHistory →
//                 the District row (labelled an estimate)   (= /api/data/glance)
//    building     InfraProject in the district (LOCAL_INFRA), renamings left
//                 out, stage "building"                     (= Projects page)
//    grade        DistrictHealthScore, with its date; `expired` when past
//                 its own expiry                             (= overview card)
//    newest       newest weather reading / news story / dam or mandi row we
//                 collected for the district
//
import { prisma } from "@/lib/db";
import { LOCAL_INFRA, VERIFIED_PANCHAYAT_SOURCES } from "@/lib/data-filters";
import { COURTSTAT_SOURCE_PREFIX } from "@/lib/courts/snapshot";
import { JJM_SOURCE } from "@/scraper/lib/jjm";
import { getPlatformFacts } from "@/lib/platform-facts";
import { buildMapStat, pickCropTicks } from "./home-picks";
import type { CropTick, IndiaFigure, MapDistrictStat, PlatformStats } from "./home-types";

/** A live district row as the page loads it. */
export interface LiveDistrictRow {
  id: string;
  slug: string;
  stateSlug: string;
  population: number | null;
}

const statKey = (stateSlug: string, slug: string) => `${stateSlug}/${slug}`;

// ─────────────────────────────────────────────────────────────────────
//  Mandi prices for the ticker
// ─────────────────────────────────────────────────────────────────────

/**
 * Up to five staple prices from the live districts' newest mandi days (the
 * choice itself: home-picks.ts → pickCropTicks). Old ones are marked old.
 */
export async function loadCropTicks(districts: LiveDistrictRow[], nowMs: number = Date.now()): Promise<CropTick[]> {
  if (districts.length === 0) return [];
  try {
    const ids = districts.map((d) => d.id);
    const latest = await prisma.cropPrice.groupBy({
      by: ["districtId"],
      where: { districtId: { in: ids } },
      _max: { date: true },
    });
    const newestDay = latest.filter((l) => l._max.date).map((l) => ({ districtId: l.districtId, date: l._max.date as Date }));
    if (newestDay.length === 0) return [];
    const rows = await prisma.cropPrice.findMany({
      where: { OR: newestDay.map((l) => ({ districtId: l.districtId, date: l.date })) },
      select: { districtId: true, commodity: true, market: true, modalPrice: true, date: true },
      orderBy: [{ market: "asc" }],
      take: 2000,
    });
    return pickCropTicks(districts, rows, nowMs);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Per-district facts for the map
// ─────────────────────────────────────────────────────────────────────

export async function loadMapStats(districts: LiveDistrictRow[]): Promise<Record<string, MapDistrictStat>> {
  const out: Record<string, MapDistrictStat> = {};
  if (districts.length === 0) return out;
  const ids = districts.map((d) => d.id);
  const year = new Date().getFullYear();
  const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

  const [profiles, censusRows, projects, scores, newest] = await Promise.all([
    safe(
      prisma.demographicProfile.findMany({
        where: { districtId: { in: ids }, totalPopulation: { not: null } },
        orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
        select: { districtId: true, totalPopulation: true, dataset: true },
      }),
      [],
    ),
    safe(
      prisma.populationHistory.findMany({
        where: {
          districtId: { in: ids },
          source: { startsWith: "Census of India", mode: "insensitive" },
          NOT: [{ source: { contains: "estimat", mode: "insensitive" } }, { source: { contains: "postpon", mode: "insensitive" } }],
          year: { lte: year },
        },
        orderBy: { year: "desc" },
        select: { districtId: true, year: true, population: true },
      }),
      [],
    ),
    safe(
      prisma.infraProject.findMany({
        where: { districtId: { in: ids }, ...LOCAL_INFRA },
        select: { districtId: true, status: true, name: true },
        take: 5000,
      }),
      null,
    ),
    safe(
      prisma.districtHealthScore.findMany({
        where: { districtId: { in: ids } },
        select: { districtId: true, grade: true, generatedAt: true, expiresAt: true },
      }),
      [],
    ),
    loadNewestPerDistrict(ids),
  ]);

  for (const d of districts) {
    const profile = profiles.find((p) => p.districtId === d.id) ?? null;
    const census = censusRows.find((p) => p.districtId === d.id) ?? null;
    const score = scores.find((s) => s.districtId === d.id) ?? null;
    out[statKey(d.stateSlug, d.slug)] = buildMapStat({
      profile,
      census,
      districtPopulation: d.population,
      projects: projects ? projects.filter((p) => p.districtId === d.id) : null,
      score,
      newest: newest.get(d.id) ?? null,
    });
  }
  return out;
}

/** Newest time we collected anything per district (weather, news, dams, mandi). */
async function loadNewestPerDistrict(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const [weather, news, dams, crops] = await Promise.all([
      prisma.weatherReading.groupBy({ by: ["districtId"], where: { districtId: { in: ids } }, _max: { recordedAt: true } }),
      prisma.newsItem.groupBy({ by: ["districtId"], where: { districtId: { in: ids } }, _max: { fetchedAt: true } }),
      prisma.damReading.groupBy({ by: ["districtId"], where: { districtId: { in: ids } }, _max: { fetchedAt: true } }),
      prisma.cropPrice.groupBy({ by: ["districtId"], where: { districtId: { in: ids } }, _max: { fetchedAt: true } }),
    ]);
    const bump = (id: string | null, d: Date | null | undefined) => {
      // A reading stamped in the future is a source error; never show it as "newest".
      if (!id || !d || d.getTime() > Date.now() + 5 * 60_000) return;
      const prev = out.get(id);
      if (!prev || d.toISOString() > prev) out.set(id, d.toISOString());
    };
    weather.forEach((r) => bump(r.districtId, r._max.recordedAt));
    news.forEach((r) => bump(r.districtId, r._max.fetchedAt));
    dams.forEach((r) => bump(r.districtId, r._max.fetchedAt));
    crops.forEach((r) => bump(r.districtId, r._max.fetchedAt));
  } catch {
    /* the map simply shows no "newest" line */
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
//  Platform stats line
// ─────────────────────────────────────────────────────────────────────

/**
 * The district datasets counted as "data points": one row = one reading,
 * price, project, office, leader, story… held for a LIVE district. The
 * same filters as the pages apply, so nothing is counted that a page would
 * hide (news-written leader / crime / power rows; estimated crime rows;
 * hand-seeded court, tap-water and village-council rows; state-wide projects).
 * Seeded demo tables (rainfall history, traffic fines, sugar factories) are
 * not counted at all.
 */
/** A constant as an SQL string literal (constants only, never user input). */
const sqlText = (v: string) => `'${v.replace(/'/g, "''")}'`;

const COUNTED_TABLES: Array<{ table: string; extra?: string }> = [
  { table: "CropPrice" },
  { table: "WeatherReading" },
  { table: "DamReading" },
  { table: "CanalRelease" },
  { table: "NewsItem" },
  { table: "LocalAlert" },
  { table: "Leader", extra: `(x."source" IS NULL OR x."source" NOT LIKE 'http%')` },
  { table: "ElectionResult" },
  // None shown until a checked source writes them (VERIFIED_PANCHAYAT); the seeded rows are hidden.
  { table: "GramPanchayat", extra: VERIFIED_PANCHAYAT_SOURCES.length ? `x."source" IN (${VERIFIED_PANCHAYAT_SOURCES.map(sqlText).join(", ")})` : "FALSE" },
  // Only rows the NJDG collector wrote (NJDG_COURTSTAT); hand seeds are hidden.
  { table: "CourtStat", extra: `x."source" LIKE ${sqlText(`${COURTSTAT_SOURCE_PREFIX}%`)}` },
  { table: "PoliceStation" },
  { table: "CrimeStat", extra: `x."source" NOT LIKE 'http%' AND x."source" NOT ILIKE '%estimat%'` },
  { table: "InfraProject", extra: `(x."scope" IS NULL OR x."scope" IN ('DISTRICT', 'CITY'))` },
  { table: "BudgetEntry" },
  { table: "Scheme" },
  { table: "HousingScheme" },
  { table: "ServiceGuide" },
  { table: "GovOffice" },
  // Only the JJM dashboard's district total (JJM_DISTRICT_TOTAL); seeded area rows are hidden.
  { table: "JJMStatus", extra: `x."source" = ${sqlText(JJM_SOURCE)}` },
  { table: "PowerOutage", extra: `x."source" NOT LIKE 'http%'` },
  { table: "BusRoute" },
  { table: "TrainSchedule" },
  { table: "School" },
  { table: "SoilHealth" },
  { table: "AgriAdvisory" },
  { table: "LocalIndustry" },
  { table: "PopulationHistory" },
  { table: "DemographicProfile" },
  { table: "FamousPersonality" },
  { table: "RtiStat" },
];

/** SQL built only from the constant list above (no user input). */
const DATA_POINTS_SQL = `SELECT (${COUNTED_TABLES.map(
  ({ table, extra }) =>
    `(SELECT count(*) FROM "${table}" x JOIN "District" d ON d.id = x."districtId" WHERE d.active${extra ? ` AND ${extra}` : ""})`,
).join(" + ")})::int AS total`;

/** Rows of district data held for the live districts, or null when the count failed. */
export async function loadDataPointCount(): Promise<number | null> {
  try {
    const r = await prisma.$queryRawUnsafe<Array<{ total: number }>>(DATA_POINTS_SQL);
    const n = Number(r[0]?.total);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * The stats row ("Your district data — tracked and checked"):
 *   districts live, states  the live District rows the page loaded from the
 *                           database (the same rows as the "Live districts"
 *                           list, so the two numbers always agree)
 *   dashboards each         the district sidebar (getPlatformFacts →
 *                           DASHBOARDS_PER_DISTRICT = SIDEBAR_MODULES.length)
 *   data points             loadDataPointCount() (null → left out)
 *   updated                 the newest collection time among the live
 *                           districts (from loadMapStats)
 */
export function platformStats(
  mapStats: Record<string, MapDistrictStat>,
  dataPoints: number | null,
  live: ReadonlyArray<{ stateSlug: string }>,
): PlatformStats {
  const facts = getPlatformFacts();
  const lastUpdate =
    Object.values(mapStats)
      .map((s) => s.newest)
      .filter((x): x is string => Boolean(x))
      .sort()
      .at(-1) ?? null;
  return {
    activeDistricts: live.length,
    activeStates: new Set(live.map((d) => d.stateSlug)).size,
    modulesPerDistrict: facts.modulesPerDistrict,
    dataPoints,
    lastUpdate,
  };
}

// ─────────────────────────────────────────────────────────────────────
//  "Explore all of India" — four national figures
// ─────────────────────────────────────────────────────────────────────

/**
 * Four figures that stay true until the Constitution or the map changes,
 * so the "checked" date beside them is honest. (The population, GDP and
 * Union Budget rows carry the date they were typed in, not the year they
 * describe, so they are not shown here until those rows are corrected.)
 */
const INDIA_ROWS = [
  { moduleSlug: "national-snapshot", metricKey: "states_count" },
  { moduleSlug: "national-snapshot", metricKey: "uts_count" },
  { moduleSlug: "elections-loksabha", metricKey: "loksabha_seats_total" },
  { moduleSlug: "national-snapshot", metricKey: "scheduled_languages" },
  { moduleSlug: "know-india-geography-physical", metricKey: "area_total_million_km2" },
] as const;

export async function loadIndiaFigures(): Promise<IndiaFigure[]> {
  let rows: Array<{ metricKey: string; numericValue: unknown; source: string; sourceUrl: string; asOfDate: Date }> = [];
  try {
    rows = await prisma.indiaIndicator.findMany({
      where: { OR: INDIA_ROWS.map((r) => ({ moduleSlug: r.moduleSlug, metricKey: r.metricKey })) },
      select: { metricKey: true, numericValue: true, source: true, sourceUrl: true, asOfDate: true },
    });
  } catch {
    return [];
  }
  const get = (metricKey: string) => {
    const r = rows.find((x) => x.metricKey === metricKey);
    const value = r && r.numericValue != null ? Number(r.numericValue) : NaN;
    return r && Number.isFinite(value) ? { ...r, value } : null;
  };
  const link = (url: string | null | undefined) => (url && url.startsWith("https://") ? url : null);

  const out: IndiaFigure[] = [];
  const states = get("states_count");
  const uts = get("uts_count");
  if (states && uts) {
    out.push({
      id: "states",
      values: { a: states.value, b: uts.value },
      source: states.source,
      sourceUrl: link(states.sourceUrl),
      asOf: (states.asOfDate > uts.asOfDate ? states.asOfDate : uts.asOfDate).toISOString(),
    });
  }
  const seats = get("loksabha_seats_total");
  if (seats) {
    out.push({ id: "seats", values: { n: seats.value }, source: seats.source, sourceUrl: link(seats.sourceUrl), asOf: seats.asOfDate.toISOString() });
  }
  const langs = get("scheduled_languages");
  if (langs) {
    out.push({ id: "languages", values: { n: langs.value }, source: langs.source, sourceUrl: link(langs.sourceUrl), asOf: langs.asOfDate.toISOString() });
  }
  const area = get("area_total_million_km2");
  if (area) {
    // 3.29 million sq km = 32.9 lakh sq km (1 million = 10 lakh).
    out.push({ id: "area", values: { n: Math.round(area.value * 100) / 10 }, source: area.source, sourceUrl: link(area.sourceUrl), asOf: area.asOfDate.toISOString() });
  }
  return out;
}
