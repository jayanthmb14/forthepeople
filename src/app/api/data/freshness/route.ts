/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
// GET /api/data/freshness?district=mandya
//
// How old every dataset on a district's pages is, in ONE database round
// trip (a single SELECT of scalar sub-queries), cached in Redis for five
// minutes. Read-only.
//
// Response:
//   datasets  one row per dataset (src/lib/freshness.ts DATASETS): rows,
//             data date or period, last checked, the rule, and a status —
//             current | late | unknown | not_collected | reference.
//             StaleDataNotice, VerifyPanel, the sidebar "coming soon" state
//             and the district bar's live-feed link all read this.
//   live      { current, total } for the five fast feeds.
//   modules   the older traffic-light shape (weather, crops, dam, news,
//             alerts, aiInsights) kept for the data-sources and news pages.
//             Thresholds are now realistic (v5): weather 6 h, crops 7 d,
//             dams 3 d, news 24 h, AI 7 d — so red means something.
//   summary   green / amber / red / unknown counts of `modules`.
// ═══════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import {
  DATASETS,
  fyStartDate,
  isPrimary,
  judgeDataset,
  liveFeedSummary,
  ruleFor,
  yearEndDate,
  type DatasetFreshness,
  type PeriodKind,
} from "@/lib/freshness";
import { COURTSTAT_SOURCE_PREFIX, courtStatReadDate } from "@/lib/courts/snapshot";
import { readCourtsSnapshot } from "@/lib/courts/store";
import { JJM_SOURCE } from "@/scraper/lib/jjm";
import { readDistrictSnapshot } from "@/scraper/lib/district-snapshot";
import { SEEDED_BUDGET_SOURCES, VERIFIED_PANCHAYAT } from "@/lib/data-filters";

export const runtime = "nodejs";

/** LIKE pattern for CourtStat rows the NJDG collector wrote (NJDG_COURTSTAT). */
const NJDG_COURTSTAT_LIKE = `${COURTSTAT_SOURCE_PREFIX}%`;

const CACHE_SECONDS = 300;

// Legacy traffic light (modules.*): green within the expected age, amber
// within 3×, red beyond. Minutes.
const EXPECTED_MAX_AGE: Record<string, number> = {
  weather: 6 * 60,
  crops: 7 * 24 * 60,
  dam: 3 * 24 * 60,
  news: 24 * 60,
  insights: 7 * 24 * 60,
};

type Light = "green" | "amber" | "red" | "unknown";

function trafficLight(ageMinutes: number | null, maxAgeMinutes: number): Light {
  if (ageMinutes === null) return "unknown";
  if (ageMinutes <= maxAgeMinutes) return "green";
  if (ageMinutes <= maxAgeMinutes * 3) return "amber";
  return "red";
}

function formatAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return "no data";
  if (ageMinutes < 60) return `${Math.round(ageMinutes)} min ago`;
  if (ageMinutes < 1440) return `${Math.round(ageMinutes / 60)}h ago`;
  return `${Math.round(ageMinutes / 1440)}d ago`;
}

/** One row of scalar sub-queries. Dates come back as Date, counts as int. */
interface Row {
  tenders_active: boolean;
  news_date: Date | null; news_checked: Date | null; news_rows: number;
  alerts_date: Date | null; alerts_rows: number; alerts_active: number; alerts_checked: Date | null;
  weather_date: Date | null; weather_rows: number;
  rain_year: number | null; rain_rows: number;
  rtitpl_rows: number;
  rti_year: number | null; rti_rows: number;
  leaders_date: Date | null; leaders_rows: number;
  elections_year: number | null; elections_rows: number;
  courts_source: string | null; courts_rows: number;
  crime_year: number | null; crime_rows: number;
  traffic_date: Date | null; traffic_checked: Date | null; traffic_rows: number;
  stations_rows: number;
  budget_fy: string | null; budget_checked: Date | null; budget_rows: number; budget_estimate: boolean;
  infra_date: Date | null; infra_checked: Date | null; infra_rows: number;
  tenders_date: Date | null; tenders_rows: number;
  industries_date: Date | null; industries_rows: number;
  schemes_date: Date | null; schemes_rows: number;
  housing_fy: string | null; housing_checked: Date | null; housing_rows: number; housing_estimate: boolean;
  services_date: Date | null; services_rows: number;
  offices_date: Date | null; offices_rows: number;
  exams_date: Date | null; exams_rows: number;
  jjm_date: Date | null; jjm_rows: number;
  dams_date: Date | null; dams_checked: Date | null; dams_rows: number; dams_estimate: boolean;
  canals_date: Date | null; canals_checked: Date | null; canals_rows: number;
  power_date: Date | null; power_rows: number;
  buses_rows: number; trains_rows: number;
  health_date: Date | null; health_rows: number;
  schools_date: Date | null; schools_rows: number;
  crops_date: Date | null; crops_checked: Date | null; crops_rows: number;
  agri_date: Date | null; agri_checked: Date | null; agri_rows: number;
  soil_date: Date | null; soil_rows: number;
  census_year: number | null; census_dataset: string | null; census_checked: Date | null; census_rows: number;
  census_hist_year: number | null;
  famous_rows: number;
  ai_date: Date | null;
}

async function queryRow(districtId: string): Promise<Row | null> {
  // Filters match what the pages show (src/lib/data-filters.ts):
  // NOT_FROM_NEWS (source not a URL), NOT_SEEDED_BUDGET, LOCAL_INFRA (DISTRICT/CITY scope),
  // NJDG_COURTSTAT, JJM_DISTRICT_TOTAL, SHOWN_CRIME / SHOWN_TRAFFIC (no
  // estimates), news without duplicates, active leaders / industries / people.
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      d."tendersActive" AS tenders_active,
      (SELECT max(x."publishedAt") FROM "NewsItem" x WHERE x."districtId" = d.id AND x."duplicateOf" IS NULL) AS news_date,
      (SELECT max(x."fetchedAt") FROM "NewsItem" x WHERE x."districtId" = d.id) AS news_checked,
      (SELECT count(*) FROM "NewsItem" x WHERE x."districtId" = d.id AND x."duplicateOf" IS NULL)::int AS news_rows,
      (SELECT max(x."updatedAt") FROM "LocalAlert" x WHERE x."districtId" = d.id AND NOT x."autoGenerated" AND x."sourceUrl" IS NOT NULL) AS alerts_date,
      (SELECT count(*) FROM "LocalAlert" x WHERE x."districtId" = d.id AND NOT x."autoGenerated" AND x."sourceUrl" IS NOT NULL)::int AS alerts_rows,
      (SELECT count(*) FROM "LocalAlert" x WHERE x."districtId" = d.id AND x.active AND NOT x."autoGenerated" AND x."sourceUrl" IS NOT NULL)::int AS alerts_active,
      (SELECT max(x."completedAt") FROM "ScraperLog" x WHERE x."jobName" = 'alerts' AND x.status IN ('success', 'partial')) AS alerts_checked,
      (SELECT max(x."recordedAt") FROM "WeatherReading" x WHERE x."districtId" = d.id) AS weather_date,
      (SELECT count(*) FROM "WeatherReading" x WHERE x."districtId" = d.id)::int AS weather_rows,
      (SELECT max(x.year) FROM "RainfallHistory" x WHERE x."districtId" = d.id) AS rain_year,
      (SELECT count(*) FROM "RainfallHistory" x WHERE x."districtId" = d.id)::int AS rain_rows,
      (SELECT count(*) FROM "RtiTemplate" x WHERE x."districtId" = d.id OR x."districtId" IS NULL)::int AS rtitpl_rows,
      (SELECT max(x.year) FROM "RtiStat" x WHERE x."districtId" = d.id) AS rti_year,
      (SELECT count(*) FROM "RtiStat" x WHERE x."districtId" = d.id)::int AS rti_rows,
      (SELECT max(x."lastVerifiedAt") FROM "Leader" x WHERE x."districtId" = d.id AND x.active AND (x.source IS NULL OR x.source NOT LIKE 'http%')) AS leaders_date,
      (SELECT count(*) FROM "Leader" x WHERE x."districtId" = d.id AND x.active AND (x.source IS NULL OR x.source NOT LIKE 'http%'))::int AS leaders_rows,
      (SELECT max(x.year) FROM "ElectionResult" x WHERE x."districtId" = d.id) AS elections_year,
      (SELECT count(*) FROM "ElectionResult" x WHERE x."districtId" = d.id)::int AS elections_rows,
      (SELECT max(x.source) FROM "CourtStat" x WHERE x."districtId" = d.id AND x.source LIKE ${NJDG_COURTSTAT_LIKE}) AS courts_source,
      (SELECT count(*) FROM "CourtStat" x WHERE x."districtId" = d.id AND x.source LIKE ${NJDG_COURTSTAT_LIKE})::int AS courts_rows,
      (SELECT max(x.year) FROM "CrimeStat" x WHERE x."districtId" = d.id AND x.source NOT LIKE 'http%' AND x.source NOT ILIKE '%estimat%') AS crime_year,
      (SELECT count(*) FROM "CrimeStat" x WHERE x."districtId" = d.id AND x.source NOT LIKE 'http%' AND x.source NOT ILIKE '%estimat%')::int AS crime_rows,
      (SELECT max(x."date") FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%') AS traffic_date,
      (SELECT max(x."fetchedAt") FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%') AS traffic_checked,
      (SELECT count(*) FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%')::int AS traffic_rows,
      (SELECT count(*) FROM "PoliceStation" x WHERE x."districtId" = d.id)::int AS stations_rows,
      (SELECT max(x."fiscalYear") FROM "BudgetEntry" x WHERE x."districtId" = d.id AND COALESCE(x.source, '') <> ALL(${SEEDED_BUDGET_SOURCES})) AS budget_fy,
      (SELECT max(x."fetchedAt") FROM "BudgetEntry" x WHERE x."districtId" = d.id AND COALESCE(x.source, '') <> ALL(${SEEDED_BUDGET_SOURCES})) AS budget_checked,
      (SELECT count(*) FROM "BudgetEntry" x WHERE x."districtId" = d.id AND COALESCE(x.source, '') <> ALL(${SEEDED_BUDGET_SOURCES}))::int AS budget_rows,
      EXISTS (
        SELECT 1 FROM "BudgetEntry" x
        WHERE x."districtId" = d.id AND x.source ILIKE '%estimat%' AND COALESCE(x.source, '') <> ALL(${SEEDED_BUDGET_SOURCES})
          AND x."fiscalYear" = (SELECT max(y."fiscalYear") FROM "BudgetEntry" y WHERE y."districtId" = d.id AND COALESCE(y.source, '') <> ALL(${SEEDED_BUDGET_SOURCES}))
      ) AS budget_estimate,
      (SELECT max(x."lastVerifiedAt") FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope IN ('DISTRICT', 'CITY'))) AS infra_date,
      (SELECT max(x."updatedAt") FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope IN ('DISTRICT', 'CITY'))) AS infra_checked,
      (SELECT count(*) FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope IN ('DISTRICT', 'CITY')))::int AS infra_rows,
      (SELECT max(x."lastCheckedAt") FROM "Tender" x WHERE x."locationDistrict" = d.name) AS tenders_date,
      (SELECT count(*) FROM "Tender" x WHERE x."locationDistrict" = d.name)::int AS tenders_rows,
      GREATEST(
        (SELECT max(x."updatedAt") FROM "LocalIndustry" x WHERE x."districtId" = d.id AND x.active),
        (SELECT max(x."updatedAt") FROM "SugarFactory" x WHERE x."districtId" = d.id)
      ) AS industries_date,
      ((SELECT count(*) FROM "LocalIndustry" x WHERE x."districtId" = d.id AND x.active)
        + (SELECT count(*) FROM "SugarFactory" x WHERE x."districtId" = d.id))::int AS industries_rows,
      (SELECT max(x."updatedAt") FROM "Scheme" x WHERE x."districtId" = d.id) AS schemes_date,
      (SELECT count(*) FROM "Scheme" x WHERE x."districtId" = d.id)::int AS schemes_rows,
      (SELECT max(x."fiscalYear") FROM "HousingScheme" x WHERE x."districtId" = d.id) AS housing_fy,
      (SELECT max(x."updatedAt") FROM "HousingScheme" x WHERE x."districtId" = d.id) AS housing_checked,
      (SELECT count(*) FROM "HousingScheme" x WHERE x."districtId" = d.id)::int AS housing_rows,
      EXISTS (SELECT 1 FROM "HousingScheme" x WHERE x."districtId" = d.id AND x.source ILIKE '%estimat%') AS housing_estimate,
      (SELECT max(x."updatedAt") FROM "ServiceGuide" x WHERE x."districtId" = d.id) AS services_date,
      (SELECT count(*) FROM "ServiceGuide" x WHERE x."districtId" = d.id)::int AS services_rows,
      (SELECT max(x."updatedAt") FROM "GovOffice" x WHERE x."districtId" = d.id) AS offices_date,
      (SELECT count(*) FROM "GovOffice" x WHERE x."districtId" = d.id)::int AS offices_rows,
      (SELECT max(x."updatedAt") FROM "GovernmentExam" x
        WHERE x.level = 'national' OR (x.level = 'state' AND x."stateId" = d."stateId") OR x."districtId" = d.id) AS exams_date,
      (SELECT count(*) FROM "GovernmentExam" x
        WHERE x.level = 'national' OR (x.level = 'state' AND x."stateId" = d."stateId") OR x."districtId" = d.id)::int AS exams_rows,
      (SELECT max(x."updatedAt") FROM "JJMStatus" x WHERE x."districtId" = d.id AND x.source = ${JJM_SOURCE}) AS jjm_date,
      (SELECT count(*) FROM "JJMStatus" x WHERE x."districtId" = d.id AND x.source = ${JJM_SOURCE})::int AS jjm_rows,
      (SELECT max(x."recordedAt") FROM "DamReading" x WHERE x."districtId" = d.id) AS dams_date,
      (SELECT max(x."fetchedAt") FROM "DamReading" x WHERE x."districtId" = d.id) AS dams_checked,
      (SELECT count(*) FROM "DamReading" x WHERE x."districtId" = d.id)::int AS dams_rows,
      EXISTS (SELECT 1 FROM "DamReading" x WHERE x."districtId" = d.id AND x.source ILIKE '%approximate%') AS dams_estimate,
      (SELECT max(x."scheduledDate") FROM "CanalRelease" x WHERE x."districtId" = d.id) AS canals_date,
      (SELECT max(x."createdAt") FROM "CanalRelease" x WHERE x."districtId" = d.id) AS canals_checked,
      (SELECT count(*) FROM "CanalRelease" x WHERE x."districtId" = d.id)::int AS canals_rows,
      (SELECT max(x."createdAt") FROM "PowerOutage" x WHERE x."districtId" = d.id AND x.source NOT LIKE 'http%') AS power_date,
      (SELECT count(*) FROM "PowerOutage" x WHERE x."districtId" = d.id AND x.source NOT LIKE 'http%')::int AS power_rows,
      (SELECT count(*) FROM "BusRoute" x WHERE x."districtId" = d.id)::int AS buses_rows,
      (SELECT count(*) FROM "TrainSchedule" x WHERE x."districtId" = d.id)::int AS trains_rows,
      GREATEST(
        (SELECT max(x."asOfDate") FROM "DepartmentStaffing" x WHERE x."districtId" = d.id AND x.department ILIKE '%health%'),
        (SELECT max(x."updatedAt") FROM "GovOffice" x WHERE x."districtId" = d.id
          AND (x.department ILIKE '%health%' OR x.type ILIKE '%hospital%' OR x.type ILIKE '%health%'))
      ) AS health_date,
      ((SELECT count(*) FROM "GovOffice" x WHERE x."districtId" = d.id
          AND (x.department ILIKE '%health%' OR x.type ILIKE '%hospital%' OR x.type ILIKE '%health%'))
        + (SELECT count(*) FROM "DepartmentStaffing" x WHERE x."districtId" = d.id AND x.department ILIKE '%health%'))::int AS health_rows,
      (SELECT max(x."updatedAt") FROM "School" x WHERE x."districtId" = d.id) AS schools_date,
      (SELECT count(*) FROM "School" x WHERE x."districtId" = d.id)::int AS schools_rows,
      (SELECT max(x."date") FROM "CropPrice" x WHERE x."districtId" = d.id) AS crops_date,
      (SELECT max(x."fetchedAt") FROM "CropPrice" x WHERE x."districtId" = d.id) AS crops_checked,
      (SELECT count(*) FROM "CropPrice" x WHERE x."districtId" = d.id)::int AS crops_rows,
      (SELECT max(x."weekOf") FROM "AgriAdvisory" x WHERE x."districtId" = d.id) AS agri_date,
      (SELECT max(x."createdAt") FROM "AgriAdvisory" x WHERE x."districtId" = d.id) AS agri_checked,
      (SELECT count(*) FROM "AgriAdvisory" x WHERE x."districtId" = d.id)::int AS agri_rows,
      (SELECT max(x."testedAt") FROM "SoilHealth" x WHERE x."districtId" = d.id) AS soil_date,
      (SELECT count(*) FROM "SoilHealth" x WHERE x."districtId" = d.id)::int AS soil_rows,
      (SELECT x.year FROM "DemographicProfile" x WHERE x."districtId" = d.id AND x."totalPopulation" IS NOT NULL
        ORDER BY x.year DESC LIMIT 1) AS census_year,
      (SELECT x.dataset FROM "DemographicProfile" x WHERE x."districtId" = d.id AND x."totalPopulation" IS NOT NULL
        ORDER BY x.year DESC LIMIT 1) AS census_dataset,
      (SELECT max(x."retrievedAt") FROM "DemographicProfile" x WHERE x."districtId" = d.id) AS census_checked,
      (SELECT max(x.year) FROM "PopulationHistory" x WHERE x."districtId" = d.id
        AND x.source ILIKE 'census of india%' AND x.source NOT ILIKE '%estimat%' AND x.source NOT ILIKE '%postpon%'
        AND x.year <= EXTRACT(YEAR FROM now())) AS census_hist_year,
      ((SELECT count(*) FROM "DemographicProfile" x WHERE x."districtId" = d.id)
        + (SELECT count(*) FROM "PopulationHistory" x WHERE x."districtId" = d.id))::int AS census_rows,
      (SELECT count(*) FROM "FamousPersonality" x WHERE x."districtId" = d.id AND x.active)::int AS famous_rows,
      (SELECT max(x."generatedAt") FROM "AIModuleInsight" x WHERE x."districtId" = d.id) AS ai_date
    FROM "District" d
    WHERE d.id = ${districtId}
  `;
  return rows[0] ?? null;
}

interface Raw {
  rows: number;
  date?: Date | null;
  checked?: Date | null;
  period?: string | null;
  periodKind?: PeriodKind;
  estimate?: boolean;
  notCollected?: boolean;
}

/**
 * When the NJDG collector last read a district's courts: the Redis
 * snapshot's time, else the newest CourtStat row's read day (IST, end of day).
 */
function courtsReadAt(snapshotFetchedAt: string | null, newestSource: string | null): Date | null {
  if (snapshotFetchedAt) return new Date(snapshotFetchedAt);
  const day = courtStatReadDate(newestSource);
  return day ? new Date(`${day}T23:59:59+05:30`) : null;
}

/** Facts that do not come from the SQL row: collectors' snapshots (Redis) and filtered counts. */
interface Extra {
  courtsDate: Date | null;
  /** GramPanchayat rows a page may show (VERIFIED_PANCHAYAT) and their newest update. */
  gp: { rows: number; date: Date | null };
  /** MGNREGA snapshot: the source's "as on" day, and when we read it. */
  nrega: { date: Date; checked: Date } | null;
  /** UDISE+ snapshot: when we read it. */
  udiseAt: Date | null;
}

/** SQL row → the raw facts per dataset key (DATASETS in src/lib/freshness.ts). */
function rawFacts(r: Row, x: Extra): Record<string, Raw> {
  const year = (y: number | null): Raw["date"] => yearEndDate(y);
  return {
    news: { rows: r.news_rows, date: r.news_date, checked: r.news_checked },
    // Official warnings (OFFICIAL_ALERT in src/lib/data-filters.ts) — never
    // news stories. Fresh = the warnings feed was read recently: a quiet
    // spell with no warning is not "late" (Sept 2026 audit). The collector
    // (scrape-alerts → ScraperLog "alerts") reads every district each run.
    alerts: {
      rows: r.alerts_rows + (r.alerts_checked ? 1 : 0),
      date: r.alerts_checked ?? r.alerts_date,
      checked: r.alerts_checked ?? r.alerts_date,
    },
    weather: { rows: r.weather_rows, date: r.weather_date, checked: r.weather_date },
    rainfall: { rows: r.rain_rows, date: year(r.rain_year), period: r.rain_year ? String(r.rain_year) : null, periodKind: "year" },
    rtiTemplates: { rows: r.rtitpl_rows },
    rti: { rows: r.rti_rows, date: year(r.rti_year), period: r.rti_year ? String(r.rti_year) : null, periodKind: "year" },
    leaders: { rows: r.leaders_rows, date: r.leaders_date, checked: r.leaders_date },
    elections: { rows: r.elections_rows, date: year(r.elections_year), period: r.elections_year ? String(r.elections_year) : null, periodKind: "year" },
    panchayats: x.nrega
      ? { rows: x.gp.rows + 1, date: x.nrega.date, checked: x.nrega.checked }
      : { rows: x.gp.rows, date: x.gp.date, checked: x.gp.date },
    courts: { rows: r.courts_rows, date: x.courtsDate, checked: x.courtsDate },
    crime: { rows: r.crime_rows, date: year(r.crime_year), period: r.crime_year ? String(r.crime_year) : null, periodKind: "year" },
    traffic: { rows: r.traffic_rows, date: r.traffic_date, checked: r.traffic_checked },
    stations: { rows: r.stations_rows },
    budget: {
      rows: r.budget_rows,
      date: fyStartDate(r.budget_fy),
      checked: r.budget_checked,
      period: r.budget_fy,
      periodKind: "fy",
      estimate: r.budget_estimate,
    },
    projects: { rows: r.infra_rows, date: r.infra_date ?? r.infra_checked, checked: r.infra_checked },
    tenders: { rows: r.tenders_rows, date: r.tenders_date, checked: r.tenders_date, notCollected: !r.tenders_active },
    industries: { rows: r.industries_rows, date: r.industries_date, checked: r.industries_date },
    schemes: { rows: r.schemes_rows, date: r.schemes_date, checked: r.schemes_date },
    housing: {
      rows: r.housing_rows,
      date: fyStartDate(r.housing_fy),
      checked: r.housing_checked,
      period: r.housing_fy,
      periodKind: "fy",
      estimate: r.housing_estimate,
    },
    services: { rows: r.services_rows, date: r.services_date, checked: r.services_date },
    offices: { rows: r.offices_rows, date: r.offices_date, checked: r.offices_date },
    exams: { rows: r.exams_rows, date: r.exams_date, checked: r.exams_date },
    jjm: { rows: r.jjm_rows, date: r.jjm_date, checked: r.jjm_date },
    dams: { rows: r.dams_rows, date: r.dams_date, checked: r.dams_checked, estimate: r.dams_estimate },
    canals: { rows: r.canals_rows, date: r.canals_date, checked: r.canals_checked },
    power: { rows: r.power_rows, date: r.power_date, checked: r.power_date },
    buses: { rows: r.buses_rows },
    trains: { rows: r.trains_rows },
    health: { rows: r.health_rows, date: r.health_date, checked: r.health_date },
    schools: x.udiseAt
      ? { rows: r.schools_rows + 1, date: x.udiseAt, checked: x.udiseAt }
      : { rows: r.schools_rows, date: r.schools_date, checked: r.schools_date },
    mandi: { rows: r.crops_rows, date: r.crops_date, checked: r.crops_checked },
    advice: { rows: r.agri_rows, date: r.agri_date, checked: r.agri_checked },
    soil: { rows: r.soil_rows, date: r.soil_date, checked: r.soil_date },
    // The census row with a head count; else the newest census year in the
    // population history (Pune has history rows but no census profile).
    census: {
      rows: r.census_rows,
      date: year(r.census_year ?? r.census_hist_year),
      checked: r.census_checked,
      period: r.census_dataset ?? (r.census_hist_year ? `Census ${r.census_hist_year}` : null),
      periodKind: "dataset",
    },
    famous: { rows: r.famous_rows },
  };
}

const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

function buildDatasets(r: Row, now: Date, extra: Extra): DatasetFreshness[] {
  const facts = rawFacts(r, extra);
  return DATASETS.map(({ key, module }) => {
    const f = facts[key] ?? { rows: 0 };
    const rule = ruleFor(key);
    const date = f.date ?? null;
    const j = judgeDataset({ rows: f.rows, dataDate: date, rule, notCollected: f.notCollected, now });
    return {
      module,
      key,
      primary: isPrimary(key),
      rows: f.rows,
      dataDate: iso(date),
      period: f.period ?? null,
      periodKind: f.period ? (f.periodKind ?? null) : null,
      lastChecked: iso(f.checked),
      maxAgeHours: rule.maxAgeHours,
      every: rule.every,
      method: rule.method,
      estimate: Boolean(f.estimate),
      ...j,
    };
  });
}

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  if (!districtSlug) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }

  const key = cacheKey(districtSlug, "freshness:v6");
  const cached = await cacheGet<Record<string, unknown>>(key);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
    });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  const row = await queryRow(district.id);
  if (!row) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  const now = new Date();
  const [courtsSnapshot, udise, nrega, gp] = await Promise.all([
    readCourtsSnapshot(districtSlug),
    readDistrictSnapshot("udise", districtSlug),
    readDistrictSnapshot("mgnrega", districtSlug),
    prisma.gramPanchayat.aggregate({ where: { districtId: district.id, ...VERIFIED_PANCHAYAT }, _count: { _all: true }, _max: { updatedAt: true } }),
  ]);
  const courtsDate = courtsReadAt(courtsSnapshot?.fetchedAt ?? null, row.courts_source);
  // A snapshot without CourtStat rows (the row write failed) still counts.
  if (courtsSnapshot && row.courts_rows === 0) row.courts_rows = courtsSnapshot.units.length;
  const datasets = buildDatasets(row, now, {
    courtsDate,
    gp: { rows: gp._count._all, date: gp._max.updatedAt },
    nrega: nrega
      ? { date: new Date(nrega.asOf ? `${nrega.asOf}T12:00:00+05:30` : nrega.fetchedAt), checked: new Date(nrega.fetchedAt) }
      : null,
    udiseAt: udise ? new Date(udise.fetchedAt) : null,
  });

  const ageMin = (date: Date | null | undefined): number | null =>
    date ? (now.getTime() - new Date(date).getTime()) / 60000 : null;
  const weatherAge = ageMin(row.weather_date);
  const cropsAge = ageMin(row.crops_date);
  const damAge = ageMin(row.dams_date);
  const newsAge = ageMin(row.news_date);
  const insightAge = ageMin(row.ai_date);

  const modules = {
    weather: {
      status: trafficLight(weatherAge, EXPECTED_MAX_AGE.weather),
      age: formatAge(weatherAge),
      lastUpdated: iso(row.weather_date),
    },
    crops: {
      status: trafficLight(cropsAge, EXPECTED_MAX_AGE.crops),
      age: formatAge(cropsAge),
      lastUpdated: iso(row.crops_checked),
      dataDate: iso(row.crops_date),
    },
    dam: {
      status: trafficLight(damAge, EXPECTED_MAX_AGE.dam),
      age: formatAge(damAge),
      lastUpdated: iso(row.dams_date),
    },
    news: {
      status: trafficLight(newsAge, EXPECTED_MAX_AGE.news),
      age: formatAge(newsAge),
      lastUpdated: iso(row.news_date),
    },
    alerts: {
      activeCount: row.alerts_active,
      status: "ok" as const,
    },
    aiInsights: {
      status: trafficLight(insightAge, EXPECTED_MAX_AGE.insights),
      age: formatAge(insightAge),
      lastUpdated: iso(row.ai_date),
    },
  };

  const summary = { green: 0, amber: 0, red: 0, unknown: 0 };
  for (const mod of Object.values(modules)) {
    if ("status" in mod && mod.status !== "ok") summary[mod.status as Light]++;
  }

  const data = {
    district: district.name,
    districtSlug,
    checkedAt: now.toISOString(),
    datasets,
    live: liveFeedSummary(datasets),
    modules,
    summary,
  };

  await cacheSet(key, data, CACHE_SECONDS);
  return NextResponse.json(data, {
    headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}` },
  });
}
