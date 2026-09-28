/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// District Health Score Algorithm
// Computes a 0-100 composite score from 10 governance categories
// ═══════════════════════════════════════════════════════════
import { prisma } from "./db";
import { Prisma } from "@/generated/prisma";
import { JJM_DISTRICT_TOTAL, LOCAL_INFRA, NJDG_COURTSTAT, NOT_FROM_NEWS, NOT_FROM_NEWS_OPTIONAL, SHOWN_CRIME, VERIFIED_PANCHAYAT } from "@/lib/data-filters";
import { SHOWN_BUDGET_ALLOCATION } from "@/lib/data-filters";
import { withPublishedSpend } from "@/lib/money/budget-shown";
import { readDistrictSnapshot } from "@/scraper/lib/district-snapshot";
import type { UdiseSnapshotData } from "@/scraper/lib/udise";
import { pickCensus2011 } from "@/lib/census-2011";
import { projectStage } from "@/lib/civic/project-facts";

const WEIGHTS = {
  governance: 15,
  education: 12,
  health: 12,
  infrastructure: 12,
  waterSanitation: 10,
  economy: 10,
  safety: 10,
  agriculture: 8,
  digitalAccess: 5,
  citizenWelfare: 6,
} as const;

type WeightMap = Record<keyof typeof WEIGHTS, number>;

/** Census urban share (%) below which a district is weighted as rural. */
const RURAL_BELOW_URBAN_PCT = 40;
/** Census urban share (%) from which a district is weighted as a metro (all-city districts). */
const METRO_FROM_URBAN_PCT = 90;
/** Population (Census 2011) from which a district is weighted as a metro. */
const METRO_FROM_POPULATION = 5_000_000;

/**
 * Which weights a district gets (getAdjustedWeights), from its Census 2011
 * row. The urban share decides first — Mandya has 1.8 million people but
 * is 83 % rural, so population alone called it "urban" (Sept 2026 audit):
 *   urban share < 40 %                        → rural
 *   urban share ≥ 90 % or population > 5 M    → metro
 *   otherwise                                 → urban
 * Without an urban share, the old rule: > 5 M metro, > 1 M urban,
 * density > 500 per km² semi-urban, else rural.
 */
export function getDistrictType(
  population?: number | null,
  density?: number | null,
  urbanPct?: number | null,
): "metro" | "urban" | "semi-urban" | "rural" {
  if (typeof urbanPct === "number" && Number.isFinite(urbanPct)) {
    if (urbanPct < RURAL_BELOW_URBAN_PCT) return "rural";
    if (urbanPct >= METRO_FROM_URBAN_PCT || (population ?? 0) > METRO_FROM_POPULATION) return "metro";
    return "urban";
  }
  if (population && population > METRO_FROM_POPULATION) return "metro";
  if (population && population > 1_000_000) return "urban";
  if (density && density > 500) return "semi-urban";
  return "rural";
}

// Adjust category weights slightly based on district type (always sums to 100)
function getAdjustedWeights(districtType: string): WeightMap {
  if (districtType === "metro") {
    return { governance: 15, education: 12, health: 12, infrastructure: 13,
      waterSanitation: 10, economy: 10, safety: 10, agriculture: 5,
      digitalAccess: 7, citizenWelfare: 6 };
  }
  if (districtType === "rural") {
    return { governance: 15, education: 12, health: 12, infrastructure: 9,
      waterSanitation: 12, economy: 10, safety: 10, agriculture: 11,
      digitalAccess: 3, citizenWelfare: 6 };
  }
  // urban / semi-urban: use base weights
  return { ...WEIGHTS };
}

interface SubMetric {
  value: number;
  max: number;
  score: number;
  label: string;
  /**
   * True when no data backed this measure and the score is the neutral
   * placeholder. Stored in the breakdown so the page can say "based on
   * N of M measures" instead of presenting a placeholder as a finding.
   */
  noData?: true;
}

interface CategoryResult {
  score: number;
  subMetrics: Record<string, SubMetric>;
}

/** Spread into a SubMetric when its score is a placeholder. */
function noDataIf(missing: boolean): { noData?: true } {
  return missing ? { noData: true } : {};
}

/**
 * The district's checked Census 2011 row (population, literacy, density).
 * Sept 2026 audit: District.population / literacy were typed constants
 * (Mandya's literacy was Mysuru's), so the report card reads the Census.
 */
async function census2011(districtId: string) {
  const rows = await prisma.populationHistory.findMany({
    where: { districtId, year: 2011 },
    select: { year: true, population: true, sexRatio: true, literacy: true, urbanPct: true, density: true, source: true },
  });
  return pickCensus2011(rows);
}

/**
 * Share of the district's schools with a working toilet and a library or
 * reading corner, from UDISE+ (each part weighted by its schools). Null
 * when UDISE+ has no figures. The hand-seeded School rows' hasToilets /
 * hasLibrary were mostly empty, which scored four districts 0 %.
 */
export function udiseSchoolInfraPct(udise: UdiseSnapshotData | null): number | null {
  if (!udise) return null;
  let weighted = 0;
  let schools = 0;
  for (const p of udise.parts ?? []) {
    const toilet = p.facilitiesPct?.toiletFunctional;
    const library = p.facilitiesPct?.libraryOrReadingCorner;
    if (typeof toilet !== "number" || typeof library !== "number" || !(p.schools > 0)) continue;
    weighted += ((toilet + library) / 2) * p.schools;
    schools += p.schools;
  }
  return schools > 0 ? weighted / schools : null;
}

/** Neutral score for a measure with no data behind it (flagged noData). */
const NO_DATA_SCORE = 50;

/**
 * Active health alerts. No official source publishes district health
 * advisories: the only LocalAlert writer (NDMA SACHET) never writes one,
 * and the old "health_advisory" rows came from news stories. Counting
 * them scored "0 alerts = 100" for every district, so this is always a
 * neutral placeholder until a collector exists (Sept 2026 audit).
 */
export function healthAlertsMetric(): SubMetric {
  return { value: 0, max: 0, score: NO_DATA_SCORE, label: "Active Health Alerts (lower is better)", noData: true };
}

/**
 * Power outages in the last 30 days (lower is better). A placeholder while
 * the district has no outage row from a checked source at all — an empty
 * table is "not collected", not "no outages".
 */
export function powerReliabilityMetric(everRecorded: number, last30Days: number): SubMetric {
  const label = "Power Outages (last 30 days, lower is better)";
  if (everRecorded === 0) return { value: 0, max: 0, score: NO_DATA_SCORE, label, noData: true };
  return { value: last30Days, max: 0, score: Math.max(0, 100 - last30Days * 5), label };
}

/** Soil health records on file (20 or more scores 100); none = a placeholder. */
export function soilHealthMetric(records: number): SubMetric {
  const label = "Soil Health Records";
  if (records === 0) return { value: 0, max: 20, score: NO_DATA_SCORE, label, noData: true };
  return { value: records, max: 20, score: Math.round(Math.min(100, (records / 20) * 100)), label };
}

/** Agri advisories issued in the last 14 days (5 or more scores 100); none = a placeholder. */
export function agriAdvisoriesMetric(active: number): SubMetric {
  const label = "Active Agri Advisories";
  if (active === 0) return { value: 0, max: 5, score: NO_DATA_SCORE, label, noData: true };
  return { value: active, max: 5, score: Math.min(100, active * 20), label };
}

/** How many measures rest on real data (the rest are placeholders). */
export function dataCoverage(subs: readonly SubMetric[]): { measured: number; total: number } {
  return { measured: subs.filter((m) => !m.noData).length, total: subs.length };
}

function avg(scores: number[]): number {
  if (scores.length === 0) return 50;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ── 1. Governance ────────────────────────────────────────────
async function calcGovernance(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Budget utilization: only traceable rows with a published spend figure
  // (an allocation with spending "not published yet" says nothing about
  // how well money was used, so it is not scored as 0%).
  const budget = (await prisma.budgetAllocation.findMany({ where: { districtId, ...SHOWN_BUDGET_ALLOCATION } }))
    .map(withPublishedSpend)
    .filter((b) => b.spent > 0);
  if (budget.length > 0) {
    const totalAllocated = budget.reduce((s, b) => s + b.allocated, 0);
    const totalSpent = budget.reduce((s, b) => s + b.spent, 0);
    const util = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 50;
    const score = util >= 80 && util <= 95 ? 100
      : util >= 60 ? ((util - 60) / 20) * 80
      : (util / 60) * 50;
    sub.budgetUtilization = { value: Math.round(util), max: 100, score: Math.round(score), label: "Budget Utilization (%)" };

    const lapsed = budget.reduce((s, b) => s + (b.lapsed || 0), 0);
    const lapsedPct = totalAllocated > 0 ? (lapsed / totalAllocated) * 100 : 0;
    sub.lapsedFunds = { value: Math.round(lapsedPct), max: 0, score: Math.round(Math.max(0, 100 - lapsedPct * 5)), label: "Lapsed Funds (% — lower is better)" };
  } else {
    sub.budgetUtilization = { value: 0, max: 100, score: 40, label: "Budget Utilization (%)", noData: true };
    sub.lapsedFunds = { value: 0, max: 0, score: 60, label: "Lapsed Funds (%)", noData: true };
  }

  // Leadership completeness
  const leaders = await prisma.leader.findMany({ where: { districtId, active: true, ...NOT_FROM_NEWS_OPTIONAL } });
  const expectedMin = 30;
  sub.leadershipCompleteness = {
    value: leaders.length, max: expectedMin,
    score: Math.round(Math.min(100, (leaders.length / expectedMin) * 100)),
    label: "Leadership Positions Filled",
  };

  // RTI response rate
  const rti = await prisma.rtiStat.findMany({ where: { districtId }, orderBy: { year: "desc" }, take: 12 });
  if (rti.length > 0) {
    const filed = rti.reduce((s, r) => s + r.filed, 0);
    const disposed = rti.reduce((s, r) => s + r.disposed, 0);
    const rate = filed > 0 ? (disposed / filed) * 100 : 50;
    sub.rtiResponseRate = { value: Math.round(rate), max: 100, score: Math.round(rate), label: "RTI Response Rate (%)" };
  } else {
    sub.rtiResponseRate = { value: 0, max: 100, score: 50, label: "RTI Response Rate (%)", noData: true };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 2. Education ─────────────────────────────────────────────
async function calcEducation(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  const district = await prisma.district.findFirst({ where: { id: districtId } });
  const census = await census2011(districtId);
  const literacy = census?.literacy ?? null;
  sub.literacy = literacy !== null
    ? { value: Math.round(literacy), max: 95, score: Math.round(Math.min(100, (literacy / 95) * 100)), label: "Literacy Rate (%, Census 2011)" }
    : { value: 0, max: 95, score: 50, label: "Literacy Rate (%, Census 2011)", noData: true };

  const results = await prisma.schoolResult.findMany({
    where: { school: { districtId } },
    orderBy: { year: "desc" },
    take: 20,
  });
  if (results.length > 0) {
    const avgPass = results.reduce((s, r) => s + r.passPercentage, 0) / results.length;
    sub.passRate = { value: Math.round(avgPass), max: 100, score: Math.round(avgPass), label: "Avg Board Exam Pass Rate (%)" };
  } else {
    sub.passRate = { value: 0, max: 100, score: 50, label: "Avg Board Exam Pass Rate (%)", noData: true };
  }

  // Students per teacher and school facilities: the UDISE+ district totals
  // (collector) only. The schools listed by name were hand-seeded with
  // estimated enrolment and mostly empty facilities (Sept 2026 audit), so
  // they are never used as a stand-in.
  const udise = district?.slug ? await readDistrictSnapshot<UdiseSnapshotData>("udise", district.slug) : null;
  const totalStudents = udise ? udise.data.totals.students : 0;
  const totalTeachers = udise ? udise.data.totals.teachers : 0;
  if (totalTeachers > 0) {
    const ratio = totalStudents / totalTeachers;
    const ratioScore = ratio <= 25 ? 100 : ratio <= 35 ? 70 : ratio <= 45 ? 40 : 20;
    sub.studentTeacherRatio = { value: Math.round(ratio), max: 25, score: ratioScore, label: "Student-Teacher Ratio (UDISE+, lower is better)" };
  } else {
    sub.studentTeacherRatio = { value: 0, max: 25, score: 50, label: "Student-Teacher Ratio (lower is better)", noData: true };
  }

  const infraPct = udiseSchoolInfraPct(udise?.data ?? null);
  sub.schoolInfra = infraPct !== null
    ? { value: Math.round(infraPct), max: 100, score: Math.round(infraPct), label: "Schools with working toilets and a library (%, UDISE+)" }
    : { value: 0, max: 100, score: 50, label: "School Infrastructure (%)", noData: true };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 3. Health ────────────────────────────────────────────────
async function calcHealth(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Health centres per person: not measured. The old measure counted the
  // GovOffice rows we typed in whose department mentions "health" (Mandya:
  // one district hospital) and scored them as PHC coverage (Sept 2026
  // audit). Until a collector reads the PHC / CHC count (NHM / HMIS), this
  // is a neutral placeholder flagged noData.
  sub.healthFacilities = { value: 0, max: 0, score: 50, label: "Health centres (not collected yet)", noData: true };

  // Health alerts: not collected (healthAlertsMetric).
  sub.activeHealthAlerts = healthAlertsMetric();

  // Literacy as a proxy for health literacy (Census 2011)
  const literacy = (await census2011(districtId))?.literacy ?? null;
  sub.healthLiteracyProxy = literacy !== null
    ? { value: Math.round(literacy), max: 90, score: Math.round(Math.min(100, (literacy / 90) * 100)), label: "Literacy (Health Literacy Proxy, %, Census 2011)" }
    : { value: 0, max: 90, score: 50, label: "Literacy (Health Literacy Proxy, %)", noData: true };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 4. Infrastructure ─────────────────────────────────────────
async function calcInfrastructure(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  const projects = await prisma.infraProject.findMany({ where: { districtId, ...LOCAL_INFRA } });
  if (projects.length > 0) {
    // Any spelling of "completed" (the rows say COMPLETED / Completed / Inaugurated).
    const completed = projects.filter((p) => projectStage(p.status) === "completed").length;
    const compRate = (completed / projects.length) * 100;
    sub.projectCompletionRate = { value: Math.round(compRate), max: 100, score: Math.round(compRate), label: "Infrastructure Project Completion Rate (%)" };

    const avgProgress = projects.reduce((s, p) => s + (p.progressPct ?? 0), 0) / projects.length;
    sub.avgProgress = { value: Math.round(avgProgress), max: 100, score: Math.round(avgProgress), label: "Average Project Progress (%)" };
  } else {
    sub.projectCompletionRate = { value: 0, max: 100, score: 40, label: "Project Completion Rate (%)", noData: true };
    sub.avgProgress = { value: 0, max: 100, score: 40, label: "Average Project Progress (%)", noData: true };
  }

  // Road connectivity via gram panchayats (checked rows only; none yet)
  const gps = await prisma.gramPanchayat.findMany({ where: { districtId, ...VERIFIED_PANCHAYAT } });
  if (gps.length > 0) {
    const connected = gps.filter((g) => g.roadConnected).length;
    const roadPct = (connected / gps.length) * 100;
    sub.roadConnectivity = { value: Math.round(roadPct), max: 100, score: Math.round(roadPct), label: "Village Road Connectivity (%)" };
  } else {
    sub.roadConnectivity = { value: 0, max: 100, score: 50, label: "Village Road Connectivity (%)", noData: true };
  }

  // Power outage frequency (lower is better), from checked rows only.
  const [outagesEver, outages] = await Promise.all([
    prisma.powerOutage.count({ where: { districtId, ...NOT_FROM_NEWS } }),
    prisma.powerOutage.count({
      where: { districtId, ...NOT_FROM_NEWS, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
  ]);
  sub.powerReliability = powerReliabilityMetric(outagesEver, outages);

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 5. Water & Sanitation ────────────────────────────────────
async function calcWaterSanitation(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Dam storage
  const latestDams = await prisma.damReading.findMany({
    where: { districtId },
    orderBy: { recordedAt: "desc" },
    take: 5,
  });
  if (latestDams.length > 0) {
    const avgStorage = latestDams.reduce((s, d) => s + d.storagePct, 0) / latestDams.length;
    // 70-100% = excellent, 40-70% = moderate, <40% = poor
    const storageScore = avgStorage >= 70 ? 100 : avgStorage >= 40 ? ((avgStorage - 40) / 30) * 70 + 30 : (avgStorage / 40) * 30;
    sub.damStorage = { value: Math.round(avgStorage), max: 100, score: Math.round(storageScore), label: "Dam Storage (%)" };
  } else {
    sub.damStorage = { value: 0, max: 100, score: 50, label: "Dam Storage (%)", noData: true };
  }

  // JJM coverage
  const jjm = await prisma.jJMStatus.findMany({ where: { districtId, ...JJM_DISTRICT_TOTAL } });
  if (jjm.length > 0) {
    const avgCoverage = jjm.reduce((s, j) => s + j.coveragePct, 0) / jjm.length;
    sub.jjmCoverage = { value: Math.round(avgCoverage), max: 100, score: Math.round(avgCoverage), label: "JJM Tap Water Coverage (%)" };
  } else {
    sub.jjmCoverage = { value: 0, max: 100, score: 40, label: "JJM Tap Water Coverage (%)", noData: true };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 6. Economy ───────────────────────────────────────────────
async function calcEconomy(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Crop price stability (std dev of recent prices — lower = better)
  const prices = await prisma.cropPrice.findMany({
    where: { districtId, date: { gte: new Date(Date.now() - 30 * 86400000) } },
    orderBy: { date: "desc" },
    take: 30,
  });
  if (prices.length > 5) {
    const modals = prices.map((p) => p.modalPrice);
    const mean = modals.reduce((a, b) => a + b, 0) / modals.length;
    const stdDev = Math.sqrt(modals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / modals.length);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 20; // coefficient of variation
    const stabilityScore = Math.max(0, 100 - cv * 3);
    sub.cropPriceStability = { value: Math.round(cv), max: 0, score: Math.round(stabilityScore), label: "Crop Price Stability (CV % — lower is better)" };
  } else {
    sub.cropPriceStability = { value: 0, max: 0, score: 60, label: "Crop Price Stability", noData: true };
  }

  // Revenue collection
  const revenue = await prisma.revenueCollection.findMany({
    where: { districtId, fiscalYear: new Date().getFullYear().toString() },
  });
  if (revenue.length > 0) {
    const totalAmount = revenue.reduce((s, r) => s + r.amount, 0);
    const totalTarget = revenue.reduce((s, r) => s + (r.target ?? 0), 0);
    const collectionRate = totalTarget > 0 ? (totalAmount / totalTarget) * 100 : 70;
    sub.revenueCollection = { value: Math.round(collectionRate), max: 100, score: Math.round(Math.min(100, collectionRate)), label: "Revenue Collection Rate (%)" };
  } else {
    sub.revenueCollection = { value: 0, max: 100, score: 55, label: "Revenue Collection Rate (%)", noData: true };
  }

  // Sugar factory health (low arrears = good)
  const factories = await prisma.sugarFactory.findMany({ where: { districtId, active: true } });
  if (factories.length > 0) {
    sub.industryHealth = { value: factories.length, max: 0, score: 70, label: "Active Industries" };
  } else {
    sub.industryHealth = { value: 0, max: 0, score: 40, label: "Active Industries", noData: true };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 7. Safety ────────────────────────────────────────────────
async function calcSafety(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Crime rate per 100k population (Census 2011 population)
  const census = await census2011(districtId);
  const pop = census?.population ?? 1000000;
  const crimes = await prisma.crimeStat.findMany({
    where: { districtId, ...SHOWN_CRIME, year: new Date().getFullYear() - 1 },
  });
  if (crimes.length > 0) {
    const totalCrimes = crimes.reduce((s, c) => s + c.count, 0);
    const crimePer100k = (totalCrimes / pop) * 100000;
    // National avg ~400/100k; low = good
    const crimeScore = Math.max(0, 100 - (crimePer100k / 400) * 50);
    sub.crimeRate = { value: Math.round(crimePer100k), max: 0, score: Math.round(crimeScore), label: "Crime Rate (per 100k — lower is better)" };
  } else {
    sub.crimeRate = { value: 0, max: 0, score: 60, label: "Crime Rate (per 100k)", noData: true };
  }

  // Police station coverage
  const stations = await prisma.policeStation.count({ where: { districtId } });
  if (stations > 0 && census) {
    const stationsPer100k = (stations / pop) * 100000;
    const stationScore = Math.min(100, (stationsPer100k / 5) * 100); // target: 5/100k
    sub.policeCoverage = { value: stations, max: Math.round((pop / 20000)), score: Math.round(stationScore), label: "Police Stations" };
  } else {
    // No stations on file means "not collected" (Pune), not zero stations.
    sub.policeCoverage = { value: 0, max: 0, score: 50, label: "Police Stations", noData: true };
  }

  // Court disposal rate
  const courts = await prisma.courtStat.findMany({ where: { districtId, ...NJDG_COURTSTAT }, orderBy: { year: "desc" }, take: 5 });
  if (courts.length > 0) {
    const filed = courts.reduce((s, c) => s + c.filed, 0);
    const disposed = courts.reduce((s, c) => s + c.disposed, 0);
    const disposalRate = filed > 0 ? (disposed / filed) * 100 : 50;
    // A rate above 100 % is real (the backlog shrank); the score still tops out at 100.
    sub.courtDisposal = { value: Math.round(disposalRate), max: 100, score: Math.round(Math.min(100, disposalRate)), label: "Court Case Disposal Rate (%)" };
  } else {
    sub.courtDisposal = { value: 0, max: 100, score: 50, label: "Court Case Disposal Rate (%)", noData: true };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 8. Agriculture ───────────────────────────────────────────
async function calcAgriculture(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Irrigation coverage (from JJM + dams)
  const dams = await prisma.damReading.findMany({ where: { districtId }, orderBy: { recordedAt: "desc" }, take: 5 });
  const avgStorage = dams.length > 0 ? dams.reduce((s, d) => s + d.storagePct, 0) / dams.length : 50;
  const irrigationScore = Math.min(100, (avgStorage / 80) * 80);
  sub.irrigationProxy = { value: Math.round(avgStorage), max: 80, score: Math.round(irrigationScore), label: "Reservoir Storage (Irrigation Proxy, %)", ...noDataIf(dams.length === 0) };

  // Soil health records and recent agri advisories (none on file = placeholder).
  const [soilRecords, advisories] = await Promise.all([
    prisma.soilHealth.count({ where: { districtId } }),
    prisma.agriAdvisory.count({
      where: { districtId, active: true, weekOf: { gte: new Date(Date.now() - 14 * 86400000) } },
    }),
  ]);
  sub.soilHealthData = soilHealthMetric(soilRecords);
  sub.agriAdvisories = agriAdvisoriesMetric(advisories);

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 9. Digital Access ────────────────────────────────────────
async function calcDigitalAccess(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Online services available
  const onlineServices = await prisma.serviceGuide.count({
    where: { districtId, onlineUrl: { not: null }, active: true },
  });
  const onlineScore = Math.min(100, (onlineServices / 15) * 100);
  sub.onlineServices = { value: onlineServices, max: 15, score: Math.round(onlineScore), label: "Online Services Available" };

  // Gov offices with website
  const officesWithWeb = await prisma.govOffice.count({
    where: { districtId, website: { not: null }, active: true },
  });
  const webScore = Math.min(100, (officesWithWeb / 10) * 100);
  sub.govWebsites = { value: officesWithWeb, max: 10, score: Math.round(webScore), label: "Govt Offices with Website" };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 10. Citizen Welfare ──────────────────────────────────────
async function calcCitizenWelfare(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Scheme coverage
  const schemes = await prisma.scheme.findMany({ where: { districtId, active: true } });
  const withBeneficiaries = schemes.filter((s) => (s.beneficiaryCount ?? 0) > 0).length;
  const schemeScore = schemes.length > 0 ? Math.min(100, (withBeneficiaries / schemes.length) * 100) : 40;
  sub.schemeCoverage = { value: schemes.length, max: 0, score: Math.round(schemeScore), label: "Active Schemes with Beneficiary Data", ...noDataIf(schemes.length === 0) };

  // Housing completion
  const housing = await prisma.housingScheme.findMany({ where: { districtId } });
  if (housing.length > 0) {
    const target = housing.reduce((s, h) => s + h.targetHouses, 0);
    const completed = housing.reduce((s, h) => s + h.completed, 0);
    const compRate = target > 0 ? (completed / target) * 100 : 40;
    sub.housingCompletion = { value: Math.round(compRate), max: 100, score: Math.round(compRate), label: "Housing Scheme Completion (%)" };
  } else {
    sub.housingCompletion = { value: 0, max: 100, score: 40, label: "Housing Scheme Completion (%)", noData: true };
  }

  // MGNREGA utilization via gram panchayats (checked rows only; none yet)
  const gps = await prisma.gramPanchayat.findMany({ where: { districtId, ...VERIFIED_PANCHAYAT } });
  const withMgnrega = gps.filter((g) => (g.fundsUtilized ?? 0) > 0).length;
  const mgnregaScore = gps.length > 0 ? (withMgnrega / gps.length) * 100 : 40;
  sub.mgnregaUtilization = { value: withMgnrega, max: gps.length, score: Math.round(mgnregaScore), label: "GPs with MGNREGA Funds Utilized", ...noDataIf(gps.length === 0) };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── Grade calculation ────────────────────────────────────────
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C+";
  if (score >= 40) return "C";
  if (score >= 30) return "D";
  return "F";
}

const CATEGORY_LABELS: Record<string, string> = {
  governance: "Governance", education: "Education", health: "Health",
  infrastructure: "Infrastructure", waterSanitation: "Water & Sanitation",
  economy: "Economy", safety: "Safety", agriculture: "Agriculture",
  digitalAccess: "Digital Access", citizenWelfare: "Citizen Welfare",
};

// ── Main: Calculate and store health score ───────────────────
export interface HealthScoreSummary {
  overallScore: number;
  grade: string;
  /** Sub-measures backed by data / all sub-measures. */
  measured: number;
  total: number;
}

export async function calculateDistrictHealthScore(districtId: string): Promise<HealthScoreSummary> {
  // Fetch district for district-type-aware weight adjustment
  const districtCensus = await census2011(districtId);
  const districtType = getDistrictType(districtCensus?.population, districtCensus?.density, districtCensus?.urbanPct);
  const weights = getAdjustedWeights(districtType);

  const [gov, edu, hlt, inf, wat, eco, saf, agr, dig, wel] = await Promise.all([
    calcGovernance(districtId),
    calcEducation(districtId),
    calcHealth(districtId),
    calcInfrastructure(districtId),
    calcWaterSanitation(districtId),
    calcEconomy(districtId),
    calcSafety(districtId),
    calcAgriculture(districtId),
    calcDigitalAccess(districtId),
    calcCitizenWelfare(districtId),
  ]);

  const categories = {
    governance: gov, education: edu, health: hlt, infrastructure: inf,
    waterSanitation: wat, economy: eco, safety: saf, agriculture: agr,
    digitalAccess: dig, citizenWelfare: wel,
  };

  let overallScore = 0;
  const breakdown: Record<string, unknown> = {};
  for (const [key, result] of Object.entries(categories)) {
    const weight = weights[key as keyof WeightMap];
    overallScore += (result.score * weight) / 100;
    breakdown[key] = {
      score: result.score,
      weight,
      weightedScore: Math.round((result.score * weight) / 100 * 10) / 10,
      subMetrics: result.subMetrics,
    };
  }
  overallScore = Math.round(overallScore * 100) / 100;  // 2 decimal precision
  const grade = getGrade(overallScore);

  // How much of the score rests on real data (the rest are placeholders).
  const coverage = dataCoverage(Object.values(categories).flatMap((c) => Object.values(c.subMetrics)));

  const existing = await prisma.districtHealthScore.findUnique({ where: { districtId } });
  const previousScore = existing?.overallScore ?? null;
  const change = previousScore !== null ? overallScore - (previousScore as number) : null;
  const trend = change !== null
    ? change > 2 ? "improving"
      : change < -2 ? "declining"
      : "stable"
    : null;

  // Trend details: which categories moved significantly
  const previousBreakdown = existing?.breakdown as Record<string, { score: number }> | null;
  const trendDetails: string[] = [];
  if (previousBreakdown) {
    for (const [key, result] of Object.entries(categories)) {
      const prevCatScore = previousBreakdown[key]?.score ?? 0;
      const catChange = result.score - prevCatScore;
      if (Math.abs(catChange) > 0.5) {
        trendDetails.push(
          `${CATEGORY_LABELS[key]} ${catChange > 0 ? "+" : ""}${catChange.toFixed(1)}`
        );
      }
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const scoreData = {
    overallScore,
    grade,
    governance: gov.score,
    education: edu.score,
    health: hlt.score,
    infrastructure: inf.score,
    waterSanitation: wat.score,
    economy: eco.score,
    safety: saf.score,
    agriculture: agr.score,
    digitalAccess: dig.score,
    citizenWelfare: wel.score,
    weights: weights as unknown as Prisma.InputJsonValue,
    breakdown: {
      ...breakdown,
      districtType,
      trendChange: change,
      trendDetails,
      dataCoverage: coverage,
    } as unknown as Prisma.InputJsonValue,
    previousScore,
    trend,
    generatedAt: new Date(),
    expiresAt,
  };

  await prisma.districtHealthScore.upsert({
    where: { districtId },
    create: { districtId, ...scoreData },
    update: scoreData,
  });

  const district = await prisma.district.findFirst({ where: { id: districtId }, select: { name: true } });
  console.log(
    `[Health Score] ${district?.name ?? districtId}: ${overallScore}/100 (${grade})${trend ? ` — ${trend}` : ""}` +
      ` — ${coverage.measured} of ${coverage.total} measures backed by data`,
  );
  return { overallScore, grade, ...coverage };
}
