/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Freshness facts — the pure half of GET /api/data/freshness.
//  The route reads one row of scalar sub-queries (FreshnessRow) plus a few
//  facts from Redis and filtered aggregates (FreshnessExtra); this module
//  turns them into one DatasetFreshness per dataset (DATASETS in
//  src/lib/freshness.ts). No database, no Redis: unit-tested in
//  tests/freshness-facts.test.ts.
// ═══════════════════════════════════════════════════════════════════════
import {
  DATASETS,
  electionResultsBehind,
  fyStartDate,
  isPrimary,
  newerFy,
  judgeDataset,
  ruleFor,
  yearEndDate,
  type DatasetFreshness,
  type PeriodKind,
} from "@/lib/freshness";
import { courtStatReadDate } from "@/lib/courts/snapshot";
import { ELECTION_RESULTS_WITHHELD } from "@/lib/data-filters";

/** One row of scalar sub-queries. Dates come back as Date, counts as int. */
export interface FreshnessRow {
  tenders_active: boolean;
  news_date: Date | null; news_checked: Date | null; news_rows: number;
  alerts_date: Date | null; alerts_rows: number; alerts_active: number;
  weather_date: Date | null; weather_rows: number;
  rain_year: number | null; rain_rows: number;
  rtitpl_rows: number;
  rti_year: number | null; rti_rows: number;
  leaders_date: Date | null; leaders_rows: number;
  elections_year: number | null; elections_rows: number; elections_held: Date | null;
  courts_source: string | null; courts_rows: number;
  crime_year: number | null; crime_rows: number;
  traffic_date: Date | null; traffic_checked: Date | null; traffic_rows: number;
  stations_rows: number;
  budget_fy: string | null; budget_checked: Date | null; budget_rows: number; budget_estimate: boolean;
  /** BudgetAllocation rows a page shows (SHOWN_BUDGET_ALLOCATION: they link to their source). */
  budget_alloc_fy: string | null; budget_alloc_checked: Date | null; budget_alloc_rows: number;
  infra_date: Date | null; infra_checked: Date | null; infra_rows: number;
  tenders_date: Date | null; tenders_rows: number;
  industries_rows: number;
  schemes_rows: number;
  housing_fy: string | null; housing_checked: Date | null; housing_rows: number; housing_estimate: boolean;
  services_rows: number;
  offices_rows: number;
  exams_date: Date | null; exams_rows: number;
  jjm_date: Date | null; jjm_rows: number;
  dams_date: Date | null; dams_checked: Date | null; dams_rows: number; dams_estimate: boolean;
  canals_date: Date | null; canals_checked: Date | null; canals_rows: number;
  power_date: Date | null; power_rows: number;
  buses_rows: number; trains_rows: number;
  health_date: Date | null; health_rows: number;
  schools_rows: number;
  agri_date: Date | null; agri_checked: Date | null; agri_rows: number;
  soil_date: Date | null; soil_rows: number;
  census_year: number | null; census_dataset: string | null; census_checked: Date | null; census_rows: number;
  census_hist_year: number | null;
  famous_rows: number;
  ai_date: Date | null;
}

interface Raw {
  rows: number;
  /** Days the data is behind a newer event (elections), whatever its age. */
  behindDays?: number | null;
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
export function courtsReadAt(snapshotFetchedAt: string | null, newestSource: string | null): Date | null {
  if (snapshotFetchedAt) return new Date(snapshotFetchedAt);
  const day = courtStatReadDate(newestSource);
  return day ? new Date(`${day}T23:59:59+05:30`) : null;
}

/** Facts that do not come from the SQL row: collectors' snapshots (Redis) and filtered counts. */
export interface FreshnessExtra {
  courtsDate: Date | null;
  /** GramPanchayat rows a page may show (VERIFIED_PANCHAYAT) and their newest update. */
  gp: { rows: number; date: Date | null };
  /** MGNREGA snapshot: the source's "as on" day, and when we read it. */
  nrega: { date: Date; checked: Date } | null;
  /** UDISE+ snapshot: when we read it. */
  udiseAt: Date | null;
  /**
   * When the NDMA SACHET feed was last read without an error: the cron's
   * run record (Redis) or the collector's ScraperLog row, the newer one
   * (lastAlertsFeedRead in src/lib/dataset-dates.ts).
   */
  alertsCheckedAt: Date | null;
  /** Mandi prices the crops page shows (shownCropPrices): count, newest market day, newest fetch. */
  crops: { rows: number; date: Date | null; checked: Date | null };
}

/** The later of two dates (either may be missing). */
export function newer(a: Date | null | undefined, b: Date | null | undefined): Date | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

/** SQL row → the raw facts per dataset key (DATASETS in src/lib/freshness.ts). */
export function rawFacts(r: FreshnessRow, x: FreshnessExtra): Record<string, Raw> {
  const year = (y: number | null): Raw["date"] => yearEndDate(y);
  // The finance page lists budget entries AND allocations, so both count
  // (Pune's budget is allocations only). The newer year of the two is the
  // period; an entry's "estimate" note matters only for that year.
  const budgetFy = newerFy(r.budget_fy, r.budget_alloc_fy);
  return {
    news: { rows: r.news_rows, date: r.news_date, checked: r.news_checked },
    // Official warnings only (OFFICIAL_ALERTS in src/lib/data-filters.ts:
    // NDMA SACHET rows) — never news stories. "No warning" is an answer too,
    // so the dataset is as fresh as the last good read of the SACHET feed,
    // not the newest alert row (Sept 2026 audit: "No active warnings right
    // now" under a feed last read 35 days earlier; a quiet spell is not
    // "late"). A good read is either the cron's run record (Redis) or the
    // collector's ScraperLog "alerts" row — the newer one counts.
    alerts: {
      rows: r.alerts_rows > 0 ? r.alerts_rows : x.alertsCheckedAt ? 1 : 0,
      date: newer(x.alertsCheckedAt, r.alerts_date),
      checked: newer(x.alertsCheckedAt, r.alerts_date),
    },
    weather: { rows: r.weather_rows, date: r.weather_date, checked: r.weather_date },
    rainfall: { rows: r.rain_rows, date: year(r.rain_year), period: r.rain_year ? String(r.rain_year) : null, periodKind: "year" },
    rtiTemplates: { rows: r.rtitpl_rows },
    rti: { rows: r.rti_rows, date: year(r.rti_year), period: r.rti_year ? String(r.rti_year) : null, periodKind: "year" },
    leaders: { rows: r.leaders_rows, date: r.leaders_date, checked: r.leaders_date },
    // Results withheld (ELECTION_RESULTS_WITHHELD): nothing is shown, so nothing is "on time".
    elections: ELECTION_RESULTS_WITHHELD
      ? { rows: 0 }
      : {
          rows: r.elections_rows,
          date: year(r.elections_year),
          period: r.elections_year ? String(r.elections_year) : null,
          periodKind: "year",
          // Results of a newer Lok Sabha / Assembly election are not in yet.
          behindDays: electionResultsBehind(r.elections_year, r.elections_held),
        },
    panchayats: x.nrega
      ? { rows: x.gp.rows + 1, date: x.nrega.date, checked: x.nrega.checked }
      : { rows: x.gp.rows, date: x.gp.date, checked: x.gp.date },
    courts: { rows: r.courts_rows, date: x.courtsDate, checked: x.courtsDate },
    crime: { rows: r.crime_rows, date: year(r.crime_year), period: r.crime_year ? String(r.crime_year) : null, periodKind: "year" },
    traffic: { rows: r.traffic_rows, date: r.traffic_date, checked: r.traffic_checked },
    stations: { rows: r.stations_rows },
    budget: {
      rows: r.budget_rows + r.budget_alloc_rows,
      date: fyStartDate(budgetFy),
      checked: newer(r.budget_checked, r.budget_alloc_checked),
      period: budgetFy,
      periodKind: "fy",
      estimate: r.budget_estimate && r.budget_fy === budgetFy,
    },
    projects: { rows: r.infra_rows, date: r.infra_date ?? r.infra_checked, checked: r.infra_checked },
    tenders: { rows: r.tenders_rows, date: r.tenders_date, checked: r.tenders_date, notCollected: !r.tenders_active },
    // No date for schemes, industries, services and offices: hand-typed
    // lists whose @updatedAt moves on any bulk edit, so it is not a check
    // date (Sept 2026 audit); src/lib/freshness.ts marks them "reference".
    industries: { rows: r.industries_rows },
    schemes: { rows: r.schemes_rows },
    housing: {
      rows: r.housing_rows,
      date: fyStartDate(r.housing_fy),
      checked: r.housing_checked,
      period: r.housing_fy,
      periodKind: "fy",
      estimate: r.housing_estimate,
    },
    services: { rows: r.services_rows },
    offices: { rows: r.offices_rows },
    exams: { rows: r.exams_rows, date: r.exams_date, checked: r.exams_date },
    jjm: { rows: r.jjm_rows, date: r.jjm_date, checked: r.jjm_date },
    dams: { rows: r.dams_rows, date: r.dams_date, checked: r.dams_checked, estimate: r.dams_estimate },
    canals: { rows: r.canals_rows, date: r.canals_date, checked: r.canals_checked },
    power: { rows: r.power_rows, date: r.power_date, checked: r.power_date },
    buses: { rows: r.buses_rows },
    trains: { rows: r.trains_rows },
    health: { rows: r.health_rows, date: r.health_date, checked: r.health_date },
    // The UDISE+ totals date the schools page; the schools listed by name
    // were typed in and their @updatedAt is not a data date.
    schools: x.udiseAt ? { rows: r.schools_rows + 1, date: x.udiseAt, checked: x.udiseAt } : { rows: r.schools_rows },
    mandi: { rows: x.crops.rows, date: x.crops.date, checked: x.crops.checked },
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

export const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

export function buildDatasets(r: FreshnessRow, now: Date, extra: FreshnessExtra): DatasetFreshness[] {
  const facts = rawFacts(r, extra);
  return DATASETS.map(({ key, module }) => {
    const f = facts[key] ?? { rows: 0 };
    const rule = ruleFor(key);
    const date = f.date ?? null;
    let j = judgeDataset({ rows: f.rows, dataDate: date, rule, notCollected: f.notCollected, now });
    if (f.behindDays && j.status !== "not_collected") j = { ...j, status: "late", lateByDays: f.behindDays };
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
