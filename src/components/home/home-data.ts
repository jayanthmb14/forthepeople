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
import { LOCAL_INFRA } from "@/lib/data-filters";
import { isNonProject, projectStage } from "@/lib/civic/project-facts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { getPricesSnapshot, type PriceKey } from "@/lib/markets/prices";
import { ageInDays as marketAgeDays, dayOf, daysBetween, isStale, latestWithChange, todayIST } from "@/lib/markets/compute";
import type { CropTick, IndiaFigure, MapDistrictStat, MarketFigure, MarketKey, PlatformStats } from "./home-types";

/** A live district row as the page loads it. */
export interface LiveDistrictRow {
  id: string;
  slug: string;
  stateSlug: string;
  population: number | null;
}

const statKey = (stateSlug: string, slug: string) => `${stateSlug}/${slug}`;

// ─────────────────────────────────────────────────────────────────────
//  Market prices (gold, silver, Sensex, Nifty, dollar, crude)
// ─────────────────────────────────────────────────────────────────────

const MARKET_ORDER: Array<{ key: MarketKey; from: PriceKey; decimals: number; currency: MarketFigure["currency"]; unit: MarketFigure["unit"] }> = [
  { key: "gold24", from: "gold24", decimals: 0, currency: "INR", unit: "gram" },
  { key: "gold22", from: "gold22", decimals: 0, currency: "INR", unit: "gram" },
  { key: "silver", from: "silver", decimals: 0, currency: "INR", unit: "kg" },
  { key: "sensex", from: "sensex", decimals: 0, currency: null, unit: null },
  { key: "nifty", from: "nifty", decimals: 0, currency: null, unit: null },
  { key: "usdInr", from: "usdInr", decimals: 2, currency: "INR", unit: null },
  { key: "crude", from: "crude", decimals: 2, currency: "USD", unit: "barrel" },
];

/**
 * The newest value, the change since the trading day before, and a 30-day
 * trend for each price. Uses the same snapshot as the /prices page through
 * Next's data cache (15 min), so the home page stays statically generated.
 * A price whose source failed is left out.
 */
export async function loadMarketFigures(nowMs: number = Date.now()): Promise<MarketFigure[]> {
  let series: Awaited<ReturnType<typeof getPricesSnapshot>>["series"] = {};
  try {
    series = (await getPricesSnapshot({ revalidate: 900 })).series;
  } catch {
    return [];
  }
  const out: MarketFigure[] = [];
  for (const m of MARKET_ORDER) {
    const s = series[m.from];
    const lw = s ? latestWithChange(s.points) : null;
    if (!s || !lw) continue;
    out.push({
      key: m.key,
      value: lw.latest.v,
      decimals: m.decimals,
      currency: m.currency,
      unit: m.unit,
      change:
        lw.change && lw.previous
          ? { pct: lw.change.pct, abs: lw.change.abs, direction: lw.change.direction, prevDay: lw.previous.d }
          : null,
      day: lw.latest.d,
      asOf: s.asOf,
      source: m.from.startsWith("gold") || m.from === "silver" ? "ibja" : "yahoo",
      sourceUrl: s.sourceUrl,
      spark: s.points.slice(-30).map((p) => p.v),
      ageDays: marketAgeDays(lw.latest.d, nowMs),
      old: isStale(lw.latest.d, nowMs),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
//  Mandi prices for the ticker
// ─────────────────────────────────────────────────────────────────────

/** Staples a citizen recognises, in the order the ticker prefers them. */
const STAPLES: Array<{ key: string; match: RegExp }> = [
  { key: "tomato", match: /^tomato$/i },
  { key: "onion", match: /^onion$/i },
  { key: "potato", match: /^potato$/i },
  { key: "rice", match: /^rice$/i },
  { key: "paddy", match: /^paddy/i },
  { key: "wheat", match: /^wheat$/i },
];

/** Crop prices older than this many days are marked old (DESIGN-SYSTEM §6: crop prices 7). */
const CROP_MAX_AGE_DAYS = 7;
const MAX_CROP_TICKS = 5;

/**
 * Up to five staple prices, each from a different live district and as far
 * as possible a different crop, from each district's newest mandi day.
 * Every tick carries its market and date; old ones are marked old.
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

    // Districts: newest mandi day first, then registry order.
    const order = new Map(districts.map((d, i) => [d.id, i]));
    const byDistrict = [...newestDay].sort(
      (a, b) => b.date.getTime() - a.date.getTime() || (order.get(a.districtId) ?? 0) - (order.get(b.districtId) ?? 0),
    );
    const today = todayIST(nowMs);
    const picked: CropTick[] = [];
    const usedDistricts = new Set<string>();
    // Round-robin over the staples (one district per crop per round), so
    // the ticker shows different crops before it repeats one.
    for (let round = 0; round < 3 && picked.length < MAX_CROP_TICKS; round++) {
      for (const staple of STAPLES) {
        if (picked.length >= MAX_CROP_TICKS) break;
        const hit = byDistrict
          .filter((l) => !usedDistricts.has(l.districtId))
          .map((l) => rows.find((r) => r.districtId === l.districtId && staple.match.test(r.commodity.trim()) && r.modalPrice > 0))
          .find(Boolean);
        if (!hit) continue;
        const d = districts.find((x) => x.id === hit.districtId);
        if (!d) continue;
        usedDistricts.add(hit.districtId);
        const day = dayOf(Math.floor(hit.date.getTime() / 1000));
        const age = Math.max(0, daysBetween(day, today));
        picked.push({
          commodity: hit.commodity.trim(),
          cropKey: staple.key,
          market: hit.market.trim(),
          perQuintal: hit.modalPrice,
          day,
          ageDays: age,
          old: age > CROP_MAX_AGE_DAYS,
          stateSlug: d.stateSlug,
          districtSlug: d.slug,
        });
      }
    }
    return picked;
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

  const now = Date.now();
  for (const d of districts) {
    const profile = profiles.find((p) => p.districtId === d.id);
    const census = censusRows.find((p) => p.districtId === d.id);
    const population: MapDistrictStat["population"] = profile?.totalPopulation
      ? { value: profile.totalPopulation, dataset: profile.dataset, estimate: false }
      : census?.population
        ? { value: census.population, dataset: `Census ${census.year}`, estimate: false }
        : d.population
          ? { value: d.population, dataset: null, estimate: true }
          : null;

    const mine = projects ? projects.filter((p) => p.districtId === d.id && !isNonProject(p)) : null;
    const building = mine && mine.length > 0 ? mine.filter((p) => projectStage(p.status) === "building").length : null;

    const score = scores.find((s) => s.districtId === d.id);
    out[statKey(d.stateSlug, d.slug)] = {
      population,
      building,
      grade: score
        ? { grade: score.grade, date: score.generatedAt.toISOString(), expired: score.expiresAt.getTime() < now }
        : null,
      newest: newest.get(d.id) ?? null,
    };
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
 * hide (news-written leader / crime / power rows; state-wide projects).
 * Seeded demo tables (rainfall history, traffic fines, sugar factories) are
 * not counted at all.
 */
const COUNTED_TABLES: Array<{ table: string; extra?: string }> = [
  { table: "CropPrice" },
  { table: "WeatherReading" },
  { table: "DamReading" },
  { table: "CanalRelease" },
  { table: "NewsItem" },
  { table: "LocalAlert" },
  { table: "Leader", extra: `(x."source" IS NULL OR x."source" NOT LIKE 'http%')` },
  { table: "ElectionResult" },
  { table: "GramPanchayat" },
  { table: "CourtStat" },
  { table: "PoliceStation" },
  { table: "CrimeStat", extra: `x."source" NOT LIKE 'http%'` },
  { table: "InfraProject", extra: `(x."scope" IS NULL OR x."scope" IN ('DISTRICT', 'CITY'))` },
  { table: "BudgetEntry" },
  { table: "Scheme" },
  { table: "HousingScheme" },
  { table: "ServiceGuide" },
  { table: "GovOffice" },
  { table: "JJMStatus" },
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

export async function loadPlatformStats(ids: string[]): Promise<PlatformStats> {
  const facts = getPlatformFacts();
  const [count, newest] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ total: number }>>(DATA_POINTS_SQL).then(
      (r) => (Number.isFinite(Number(r[0]?.total)) ? Number(r[0].total) : null),
      () => null,
    ),
    loadNewestPerDistrict(ids),
  ]);
  const lastUpdate = [...newest.values()].sort().at(-1) ?? null;
  return {
    activeDistricts: facts.activeDistricts,
    activeStates: facts.activeStates,
    modulesPerDistrict: facts.modulesPerDistrict,
    dataPoints: count && count > 0 ? count : null,
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
