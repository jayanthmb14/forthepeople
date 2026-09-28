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
import { liveFeedSummary } from "@/lib/freshness";
import { buildDatasets, courtsReadAt, iso, type FreshnessRow } from "@/lib/freshness-facts";
import { COURTSTAT_SOURCE_PREFIX } from "@/lib/courts/snapshot";
import { readCourtsSnapshot } from "@/lib/courts/store";
import { JJM_SOURCE } from "@/scraper/lib/jjm";
import { readDistrictSnapshot } from "@/scraper/lib/district-snapshot";
import {
  COLLECTED_BUDGET_SOURCES,
  GOVERNMENT_URL_PATTERN,
  LOCAL_INFRA_SCOPES,
  NEWS_SOURCE_PREFIX,
  SEEDED_RAINFALL_LAST_YEAR,
  SEEDED_RAINFALL_SOURCES,
  TENDER_STUB_MARKER,
  VERIFIED_PANCHAYAT,
  shownCropPrices,
} from "@/lib/data-filters";
import { SACHET_SOURCE_PREFIX } from "@/scraper/lib/sachet";
import { lastAlertsFeedRead } from "@/lib/dataset-dates";

export const runtime = "nodejs";

/** LIKE pattern for CourtStat rows the NJDG collector wrote (NJDG_COURTSTAT). */
const NJDG_COURTSTAT_LIKE = `${COURTSTAT_SOURCE_PREFIX}%`;
/** LIKE pattern for LocalAlert rows the NDMA SACHET collector wrote (OFFICIAL_ALERTS). */
const SACHET_ALERT_LIKE = `${SACHET_SOURCE_PREFIX}%`;
/** SHOWN_BUDGET_ENTRY's `startsWith: "data.gov.in ("` as a LIKE pattern (collector rows only). */
const DATA_GOV_BUDGET_LIKE = "data.gov.in (%";
/** NOT_FROM_NEWS: a row whose source is an article URL. */
const NEWS_SOURCE_LIKE = `${NEWS_SOURCE_PREFIX}%`;


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


async function queryRow(districtId: string): Promise<FreshnessRow | null> {
  // Filters match what the pages show (src/lib/data-filters.ts):
  // NOT_FROM_NEWS (source not a URL), SHOWN_BUDGET_ENTRY (collector rows only —
  // never the seeded budgets), SHOWN_BUDGET_ALLOCATION (linked to its source), LOCAL_INFRA (DISTRICT/CITY scope),
  // NJDG_COURTSTAT, JJM_DISTRICT_TOTAL, SHOWN_CRIME / SHOWN_TRAFFIC (no
  // estimates), news without duplicates, active leaders / industries / people,
  // OFFICIAL_ALERTS (SACHET rows only), NOT_SEEDED_RAINFALL.
  const rows = await prisma.$queryRaw<FreshnessRow[]>`
    SELECT
      d."tendersActive" AS tenders_active,
      (SELECT max(x."publishedAt") FROM "NewsItem" x WHERE x."districtId" = d.id AND x."duplicateOf" IS NULL) AS news_date,
      (SELECT max(x."fetchedAt") FROM "NewsItem" x WHERE x."districtId" = d.id) AS news_checked,
      (SELECT count(*) FROM "NewsItem" x WHERE x."districtId" = d.id AND x."duplicateOf" IS NULL)::int AS news_rows,
      (SELECT max(x."updatedAt") FROM "LocalAlert" x WHERE x."districtId" = d.id AND x."sourceUrl" LIKE ${SACHET_ALERT_LIKE}) AS alerts_date,
      (SELECT count(*) FROM "LocalAlert" x WHERE x."districtId" = d.id AND x."sourceUrl" LIKE ${SACHET_ALERT_LIKE})::int AS alerts_rows,
      (SELECT count(*) FROM "LocalAlert" x WHERE x."districtId" = d.id AND x.active AND x."sourceUrl" LIKE ${SACHET_ALERT_LIKE})::int AS alerts_active,
      (SELECT max(x."recordedAt") FROM "WeatherReading" x WHERE x."districtId" = d.id) AS weather_date,
      (SELECT count(*) FROM "WeatherReading" x WHERE x."districtId" = d.id)::int AS weather_rows,
      (SELECT max(x.year) FROM "RainfallHistory" x WHERE x."districtId" = d.id
        AND NOT (x.source = ANY(${SEEDED_RAINFALL_SOURCES}) AND x.year <= ${SEEDED_RAINFALL_LAST_YEAR})) AS rain_year,
      (SELECT count(*) FROM "RainfallHistory" x WHERE x."districtId" = d.id
        AND NOT (x.source = ANY(${SEEDED_RAINFALL_SOURCES}) AND x.year <= ${SEEDED_RAINFALL_LAST_YEAR}))::int AS rain_rows,
      (SELECT count(*) FROM "RtiTemplate" x WHERE x."districtId" = d.id OR x."districtId" IS NULL)::int AS rtitpl_rows,
      (SELECT max(x.year) FROM "RtiStat" x WHERE x."districtId" = d.id) AS rti_year,
      (SELECT count(*) FROM "RtiStat" x WHERE x."districtId" = d.id)::int AS rti_rows,
      (SELECT max(x."lastVerifiedAt") FROM "Leader" x WHERE x."districtId" = d.id AND x.active AND (x.source IS NULL OR x.source NOT LIKE ${NEWS_SOURCE_LIKE})) AS leaders_date,
      (SELECT count(*) FROM "Leader" x WHERE x."districtId" = d.id AND x.active AND (x.source IS NULL OR x.source NOT LIKE ${NEWS_SOURCE_LIKE}))::int AS leaders_rows,
      (SELECT max(x.year) FROM "ElectionResult" x WHERE x."districtId" = d.id) AS elections_year,
      (SELECT count(*) FROM "ElectionResult" x WHERE x."districtId" = d.id)::int AS elections_rows,
      (SELECT max(COALESCE(e."resultDate", e."pollingDate", e."lastHeld")) FROM "ElectionEvent" e
        WHERE e."isActive" AND e.type IN ('LOK_SABHA', 'STATE_ASSEMBLY')
          AND (e.state IS NULL OR e.state = (SELECT s.slug FROM "State" s WHERE s.id = d."stateId"))
          AND (e.district IS NULL OR e.district = d.slug)
          AND COALESCE(e."resultDate", e."pollingDate", e."lastHeld") <= now()) AS elections_held,
      (SELECT max(x.source) FROM "CourtStat" x WHERE x."districtId" = d.id AND x.source LIKE ${NJDG_COURTSTAT_LIKE}) AS courts_source,
      (SELECT count(*) FROM "CourtStat" x WHERE x."districtId" = d.id AND x.source LIKE ${NJDG_COURTSTAT_LIKE})::int AS courts_rows,
      (SELECT max(x.year) FROM "CrimeStat" x WHERE x."districtId" = d.id AND x.source NOT LIKE ${NEWS_SOURCE_LIKE} AND x.source NOT ILIKE '%estimat%') AS crime_year,
      (SELECT count(*) FROM "CrimeStat" x WHERE x."districtId" = d.id AND x.source NOT LIKE ${NEWS_SOURCE_LIKE} AND x.source NOT ILIKE '%estimat%')::int AS crime_rows,
      -- SHOWN_TRAFFIC, and whole rupees only: the police page drops the
      -- seeded Math.random() amounts (fractional paise), so they are not counted.
      (SELECT max(x."date") FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%' AND x.amount = trunc(x.amount)) AS traffic_date,
      (SELECT max(x."fetchedAt") FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%' AND x.amount = trunc(x.amount)) AS traffic_checked,
      (SELECT count(*) FROM "TrafficCollection" x WHERE x."districtId" = d.id AND x.source IS NOT NULL AND x.source NOT ILIKE 'estimat%' AND x.amount = trunc(x.amount))::int AS traffic_rows,
      (SELECT count(*) FROM "PoliceStation" x WHERE x."districtId" = d.id)::int AS stations_rows,
      (SELECT max(x."fiscalYear") FROM "BudgetEntry" x WHERE x."districtId" = d.id AND (x.source = ANY(${COLLECTED_BUDGET_SOURCES}) OR x.source LIKE ${DATA_GOV_BUDGET_LIKE})) AS budget_fy,
      (SELECT max(x."fetchedAt") FROM "BudgetEntry" x WHERE x."districtId" = d.id AND (x.source = ANY(${COLLECTED_BUDGET_SOURCES}) OR x.source LIKE ${DATA_GOV_BUDGET_LIKE})) AS budget_checked,
      (SELECT count(*) FROM "BudgetEntry" x WHERE x."districtId" = d.id AND (x.source = ANY(${COLLECTED_BUDGET_SOURCES}) OR x.source LIKE ${DATA_GOV_BUDGET_LIKE}))::int AS budget_rows,
      (SELECT max(x."fiscalYear") FROM "BudgetAllocation" x WHERE x."districtId" = d.id AND x."sourceUrl" IS NOT NULL) AS budget_alloc_fy,
      (SELECT max(x."fetchedAt") FROM "BudgetAllocation" x WHERE x."districtId" = d.id AND x."sourceUrl" IS NOT NULL) AS budget_alloc_checked,
      (SELECT count(*) FROM "BudgetAllocation" x WHERE x."districtId" = d.id AND x."sourceUrl" IS NOT NULL)::int AS budget_alloc_rows,
      EXISTS (
        SELECT 1 FROM "BudgetEntry" x
        WHERE x."districtId" = d.id AND x.source ILIKE '%estimat%' AND (x.source = ANY(${COLLECTED_BUDGET_SOURCES}) OR x.source LIKE ${DATA_GOV_BUDGET_LIKE})
          AND x."fiscalYear" = (SELECT max(y."fiscalYear") FROM "BudgetEntry" y WHERE y."districtId" = d.id AND (y.source = ANY(${COLLECTED_BUDGET_SOURCES}) OR y.source LIKE ${DATA_GOV_BUDGET_LIKE}))
      ) AS budget_estimate,
      (SELECT max(x."lastVerifiedAt") FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope = ANY(${LOCAL_INFRA_SCOPES}))) AS infra_date,
      (SELECT max(x."updatedAt") FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope = ANY(${LOCAL_INFRA_SCOPES}))) AS infra_checked,
      (SELECT count(*) FROM "InfraProject" x WHERE x."districtId" = d.id AND (x.scope IS NULL OR x.scope = ANY(${LOCAL_INFRA_SCOPES})))::int AS infra_rows,
      -- NOT_STUB_TENDER: the seeded placeholder tenders are never listed.
      (SELECT max(x."lastCheckedAt") FROM "Tender" x WHERE x."locationDistrict" = d.name
        AND (x."rawHtmlSnapshot" IS NULL OR x."rawHtmlSnapshot" <> ${TENDER_STUB_MARKER})) AS tenders_date,
      (SELECT count(*) FROM "Tender" x WHERE x."locationDistrict" = d.name
        AND (x."rawHtmlSnapshot" IS NULL OR x."rawHtmlSnapshot" <> ${TENDER_STUB_MARKER}))::int AS tenders_rows,
      ((SELECT count(*) FROM "LocalIndustry" x WHERE x."districtId" = d.id AND x.active)
        + (SELECT count(*) FROM "SugarFactory" x WHERE x."districtId" = d.id AND x.active))::int AS industries_rows,
      (SELECT count(*) FROM "Scheme" x WHERE x."districtId" = d.id AND x.active)::int AS schemes_rows,
      (SELECT max(x."fiscalYear") FROM "HousingScheme" x WHERE x."districtId" = d.id) AS housing_fy,
      (SELECT max(x."updatedAt") FROM "HousingScheme" x WHERE x."districtId" = d.id) AS housing_checked,
      (SELECT count(*) FROM "HousingScheme" x WHERE x."districtId" = d.id)::int AS housing_rows,
      EXISTS (SELECT 1 FROM "HousingScheme" x WHERE x."districtId" = d.id AND x.source ILIKE '%estimat%') AS housing_estimate,
      (SELECT count(*) FROM "ServiceGuide" x WHERE x."districtId" = d.id AND x.active)::int AS services_rows,
      (SELECT count(*) FROM "GovOffice" x WHERE x."districtId" = d.id AND x.active)::int AS offices_rows,
      -- When an exam row was last checked against its organiser (the same
      -- date the data-sources page and the daily double-check use), never
      -- @updatedAt, which any maintenance edit moves.
      (SELECT max(x."lastVerifiedAt") FROM "GovernmentExam" x
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
      (SELECT max(x."createdAt") FROM "PowerOutage" x WHERE x."districtId" = d.id AND x.source NOT LIKE ${NEWS_SOURCE_LIKE}) AS power_date,
      (SELECT count(*) FROM "PowerOutage" x WHERE x."districtId" = d.id AND x.source NOT LIKE ${NEWS_SOURCE_LIKE})::int AS power_rows,
      (SELECT count(*) FROM "BusRoute" x WHERE x."districtId" = d.id AND x.active)::int AS buses_rows,
      (SELECT count(*) FROM "TrainSchedule" x WHERE x."districtId" = d.id AND x.active)::int AS trains_rows,
      -- Health: the data date is the staffing figures' own "as of" date
      -- (government-sourced rows only, as the pages show them). The
      -- hand-entered hospital list has no source date, so its updatedAt —
      -- which any maintenance edit moves — is never used as one (Sept 2026
      -- audit: a clean-up made March seed rows read "Data date 28 Sept").
      (SELECT max(x."asOfDate") FROM "DepartmentStaffing" x WHERE x."districtId" = d.id AND x.department ILIKE '%health%'
        AND x."sourceUrl" ~* ${GOVERNMENT_URL_PATTERN}) AS health_date,
      ((SELECT count(*) FROM "GovOffice" x WHERE x."districtId" = d.id AND x.active
          AND (x.department ILIKE '%health%' OR x.type ILIKE '%hospital%' OR x.type ILIKE '%health%'))
        + (SELECT count(*) FROM "DepartmentStaffing" x WHERE x."districtId" = d.id AND x.department ILIKE '%health%'
          AND x."sourceUrl" ~* ${GOVERNMENT_URL_PATTERN}))::int AS health_rows,
      (SELECT count(*) FROM "School" x WHERE x."districtId" = d.id)::int AS schools_rows,
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
      (SELECT count(*) FROM "FamousPersonality" x WHERE x."districtId" = d.id AND x.active AND x."bornInDistrict")::int AS famous_rows,
      (SELECT max(x."generatedAt") FROM "AIModuleInsight" x WHERE x."districtId" = d.id) AS ai_date
    FROM "District" d
    WHERE d.id = ${districtId}
  `;
  return rows[0] ?? null;
}

export async function GET(req: NextRequest) {
  const districtSlug = req.nextUrl.searchParams.get("district");
  if (!districtSlug) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }

  const key = cacheKey(districtSlug, "freshness:v8");
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
  const [courtsSnapshot, udise, nrega, gp, alertsCheckedAt, crops] = await Promise.all([
    readCourtsSnapshot(districtSlug),
    readDistrictSnapshot("udise", districtSlug),
    readDistrictSnapshot("mgnrega", districtSlug),
    prisma.gramPanchayat.aggregate({ where: { districtId: district.id, ...VERIFIED_PANCHAYAT }, _count: { _all: true }, _max: { updatedAt: true } }),
    lastAlertsFeedRead(),
    // Mandi prices the crops page may show (shownCropPrices: no seed rows,
    // no livestock / per-nut / per-stem, only mandis in the district).
    prisma.cropPrice.aggregate({
      where: { districtId: district.id, ...shownCropPrices(districtSlug) },
      _count: { _all: true },
      _max: { date: true, fetchedAt: true },
    }),
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
    alertsCheckedAt,
    // The crops dataset counts only the prices the page shows (Sept 2026 audit).
    crops: { rows: crops._count._all, date: crops._max.date, checked: crops._max.fetchedAt },
  });

  const ageMin = (date: Date | null | undefined): number | null =>
    date ? (now.getTime() - new Date(date).getTime()) / 60000 : null;
  const weatherAge = ageMin(row.weather_date);
  const cropsAge = ageMin(crops._max.date);
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
      lastUpdated: iso(crops._max.fetchedAt),
      dataDate: iso(crops._max.date),
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
