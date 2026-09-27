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
import { LOCAL_INFRA, NOT_FROM_NEWS, NOT_FROM_NEWS_OPTIONAL } from "@/lib/data-filters";

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

function getDistrictType(population?: number | null, density?: number | null): "metro" | "urban" | "semi-urban" | "rural" {
  if (population && population > 5_000_000) return "metro";
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
}

interface CategoryResult {
  score: number;
  subMetrics: Record<string, SubMetric>;
}

function avg(scores: number[]): number {
  if (scores.length === 0) return 50;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ── 1. Governance ────────────────────────────────────────────
async function calcGovernance(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Budget utilization
  const budget = await prisma.budgetAllocation.findMany({ where: { districtId } });
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
    sub.budgetUtilization = { value: 0, max: 100, score: 40, label: "Budget Utilization (%)" };
    sub.lapsedFunds = { value: 0, max: 0, score: 60, label: "Lapsed Funds (%)" };
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
    sub.rtiResponseRate = { value: 0, max: 100, score: 50, label: "RTI Response Rate (%)" };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 2. Education ─────────────────────────────────────────────
async function calcEducation(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  const district = await prisma.district.findFirst({ where: { id: districtId } });
  const literacy = district?.literacy ?? 70;
  sub.literacy = { value: Math.round(literacy), max: 95, score: Math.round(Math.min(100, (literacy / 95) * 100)), label: "Literacy Rate (%)" };

  const results = await prisma.schoolResult.findMany({
    where: { school: { districtId } },
    orderBy: { year: "desc" },
    take: 20,
  });
  if (results.length > 0) {
    const avgPass = results.reduce((s, r) => s + r.passPercentage, 0) / results.length;
    sub.passRate = { value: Math.round(avgPass), max: 100, score: Math.round(avgPass), label: "Avg Board Exam Pass Rate (%)" };
  } else {
    sub.passRate = { value: 0, max: 100, score: 50, label: "Avg Board Exam Pass Rate (%)" };
  }

  const schools = await prisma.school.findMany({ where: { districtId } });
  const totalStudents = schools.reduce((s, sc) => s + (sc.students ?? 0), 0);
  const totalTeachers = schools.reduce((s, sc) => s + (sc.teachers ?? 0), 0);
  const ratio = totalTeachers > 0 ? totalStudents / totalTeachers : 35;
  const ratioScore = ratio <= 25 ? 100 : ratio <= 35 ? 70 : ratio <= 45 ? 40 : 20;
  sub.studentTeacherRatio = { value: Math.round(ratio), max: 25, score: ratioScore, label: "Student-Teacher Ratio (lower is better)" };

  const withToilets = schools.filter((s) => s.hasToilets).length;
  const withLib = schools.filter((s) => s.hasLibrary).length;
  const infraPct = schools.length > 0 ? ((withToilets + withLib) / (schools.length * 2)) * 100 : 50;
  sub.schoolInfra = { value: Math.round(infraPct), max: 100, score: Math.round(infraPct), label: "School Infrastructure (%)" };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 3. Health ────────────────────────────────────────────────
async function calcHealth(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Use government offices (PHC count) as proxy for health infrastructure
  const phcs = await prisma.govOffice.count({
    where: { districtId, department: { contains: "health", mode: "insensitive" } },
  });
  const district = await prisma.district.findFirst({ where: { id: districtId } });
  const pop = district?.population ?? 1000000;
  const phcPer100k = pop > 0 ? (phcs / pop) * 100000 : 0;
  // Target: 1 PHC per 30,000 = 3.3 per 100k
  const phcScore = Math.min(100, (phcPer100k / 3.3) * 100);
  sub.healthFacilities = { value: phcs, max: Math.round((pop / 30000)), score: Math.round(phcScore), label: "PHC/Health Offices" };

  // Check for health alerts (more alerts = worse health situation)
  const healthAlerts = await prisma.localAlert.count({
    where: { districtId, type: "health_advisory", active: true },
  });
  const alertScore = Math.max(0, 100 - healthAlerts * 10);
  sub.activeHealthAlerts = { value: healthAlerts, max: 0, score: alertScore, label: "Active Health Alerts (lower is better)" };

  // Literacy as a proxy for health literacy
  const literacy = district?.literacy ?? 70;
  const literacyScore = Math.min(100, (literacy / 90) * 100);
  sub.healthLiteracyProxy = { value: Math.round(literacy), max: 90, score: Math.round(literacyScore), label: "Literacy (Health Literacy Proxy, %)" };

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 4. Infrastructure ─────────────────────────────────────────
async function calcInfrastructure(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  const projects = await prisma.infraProject.findMany({ where: { districtId, ...LOCAL_INFRA } });
  if (projects.length > 0) {
    const completed = projects.filter((p) => p.status === "Completed").length;
    const compRate = (completed / projects.length) * 100;
    sub.projectCompletionRate = { value: Math.round(compRate), max: 100, score: Math.round(compRate), label: "Infrastructure Project Completion Rate (%)" };

    const avgProgress = projects.reduce((s, p) => s + (p.progressPct ?? 0), 0) / projects.length;
    sub.avgProgress = { value: Math.round(avgProgress), max: 100, score: Math.round(avgProgress), label: "Average Project Progress (%)" };
  } else {
    sub.projectCompletionRate = { value: 0, max: 100, score: 40, label: "Project Completion Rate (%)" };
    sub.avgProgress = { value: 0, max: 100, score: 40, label: "Average Project Progress (%)" };
  }

  // Road connectivity via gram panchayats
  const gps = await prisma.gramPanchayat.findMany({ where: { districtId } });
  if (gps.length > 0) {
    const connected = gps.filter((g) => g.roadConnected).length;
    const roadPct = (connected / gps.length) * 100;
    sub.roadConnectivity = { value: Math.round(roadPct), max: 100, score: Math.round(roadPct), label: "Village Road Connectivity (%)" };
  } else {
    sub.roadConnectivity = { value: 0, max: 100, score: 50, label: "Village Road Connectivity (%)" };
  }

  // Power outage frequency (lower is better)
  const outages = await prisma.powerOutage.count({
    where: { districtId, ...NOT_FROM_NEWS, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  const outageScore = Math.max(0, 100 - outages * 5);
  sub.powerReliability = { value: outages, max: 0, score: outageScore, label: "Power Outages (last 30 days, lower is better)" };

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
    sub.damStorage = { value: 0, max: 100, score: 50, label: "Dam Storage (%)" };
  }

  // JJM coverage
  const jjm = await prisma.jJMStatus.findMany({ where: { districtId } });
  if (jjm.length > 0) {
    const avgCoverage = jjm.reduce((s, j) => s + j.coveragePct, 0) / jjm.length;
    sub.jjmCoverage = { value: Math.round(avgCoverage), max: 100, score: Math.round(avgCoverage), label: "JJM Tap Water Coverage (%)" };
  } else {
    sub.jjmCoverage = { value: 0, max: 100, score: 40, label: "JJM Tap Water Coverage (%)" };
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
    sub.cropPriceStability = { value: 0, max: 0, score: 60, label: "Crop Price Stability" };
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
    sub.revenueCollection = { value: 0, max: 100, score: 55, label: "Revenue Collection Rate (%)" };
  }

  // Sugar factory health (low arrears = good)
  const factories = await prisma.sugarFactory.findMany({ where: { districtId, active: true } });
  if (factories.length > 0) {
    sub.industryHealth = { value: factories.length, max: 0, score: 70, label: "Active Industries" };
  } else {
    sub.industryHealth = { value: 0, max: 0, score: 40, label: "Active Industries" };
  }

  return { score: Math.round(avg(Object.values(sub).map((m) => m.score)) * 10) / 10, subMetrics: sub };
}

// ── 7. Safety ────────────────────────────────────────────────
async function calcSafety(districtId: string): Promise<CategoryResult> {
  const sub: Record<string, SubMetric> = {};

  // Crime rate per 100k population
  const district = await prisma.district.findFirst({ where: { id: districtId } });
  const pop = district?.population ?? 1000000;
  const crimes = await prisma.crimeStat.findMany({
    where: { districtId, ...NOT_FROM_NEWS, year: new Date().getFullYear() - 1 },
  });
  if (crimes.length > 0) {
    const totalCrimes = crimes.reduce((s, c) => s + c.count, 0);
    const crimePer100k = (totalCrimes / pop) * 100000;
    // National avg ~400/100k; low = good
    const crimeScore = Math.max(0, 100 - (crimePer100k / 400) * 50);
    sub.crimeRate = { value: Math.round(crimePer100k), max: 0, score: Math.round(crimeScore), label: "Crime Rate (per 100k — lower is better)" };
  } else {
    sub.crimeRate = { value: 0, max: 0, score: 60, label: "Crime Rate (per 100k)" };
  }

  // Police station coverage
  const stations = await prisma.policeStation.count({ where: { districtId } });
  const stationsPer100k = (stations / pop) * 100000;
  const stationScore = Math.min(100, (stationsPer100k / 5) * 100); // target: 5/100k
  sub.policeCoverage = { value: stations, max: Math.round((pop / 20000)), score: Math.round(stationScore), label: "Police Stations" };

  // Court disposal rate
  const courts = await prisma.courtStat.findMany({ where: { districtId }, orderBy: { year: "desc" }, take: 5 });
  if (courts.length > 0) {
    const filed = courts.reduce((s, c) => s + c.filed, 0);
    const disposed = courts.reduce((s, c) => s + c.disposed, 0);
    const disposalRate = filed > 0 ? (disposed / filed) * 100 : 50;
    sub.courtDisposal = { value: Math.round(disposalRate), max: 100, score: Math.round(disposalRate), label: "Court Case Disposal Rate (%)" };
  } else {
    sub.courtDisposal = { value: 0, max: 100, score: 50, label: "Court Case Disposal Rate (%)" };
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
  sub.irrigationProxy = { value: Math.round(avgStorage), max: 80, score: Math.round(irrigationScore), label: "Reservoir Storage (Irrigation Proxy, %)" };

  // Soil health records
  const soilRecords = await prisma.soilHealth.count({ where: { districtId } });
  const soilScore = Math.min(100, (soilRecords / 20) * 100);
  sub.soilHealthData = { value: soilRecords, max: 20, score: Math.round(soilScore), label: "Soil Health Records" };

  // Agri advisories (active = good)
  const advisories = await prisma.agriAdvisory.count({
    where: { districtId, active: true, weekOf: { gte: new Date(Date.now() - 14 * 86400000) } },
  });
  const advisoryScore = Math.min(100, advisories * 20);
  sub.agriAdvisories = { value: advisories, max: 5, score: advisoryScore, label: "Active Agri Advisories" };

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
  sub.schemeCoverage = { value: schemes.length, max: 0, score: Math.round(schemeScore), label: "Active Schemes with Beneficiary Data" };

  // Housing completion
  const housing = await prisma.housingScheme.findMany({ where: { districtId } });
  if (housing.length > 0) {
    const target = housing.reduce((s, h) => s + h.targetHouses, 0);
    const completed = housing.reduce((s, h) => s + h.completed, 0);
    const compRate = target > 0 ? (completed / target) * 100 : 40;
    sub.housingCompletion = { value: Math.round(compRate), max: 100, score: Math.round(compRate), label: "Housing Scheme Completion (%)" };
  } else {
    sub.housingCompletion = { value: 0, max: 100, score: 40, label: "Housing Scheme Completion (%)" };
  }

  // MGNREGA utilization via gram panchayats
  const gps = await prisma.gramPanchayat.findMany({ where: { districtId } });
  const withMgnrega = gps.filter((g) => (g.fundsUtilized ?? 0) > 0).length;
  const mgnregaScore = gps.length > 0 ? (withMgnrega / gps.length) * 100 : 40;
  sub.mgnregaUtilization = { value: withMgnrega, max: gps.length, score: Math.round(mgnregaScore), label: "GPs with MGNREGA Funds Utilized" };

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
export async function calculateDistrictHealthScore(districtId: string): Promise<void> {
  // Fetch district for district-type-aware weight adjustment
  const districtInfo = await prisma.district.findFirst({
    where: { id: districtId },
    select: { name: true, population: true, density: true },
  });
  const districtType = getDistrictType(districtInfo?.population, districtInfo?.density);
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
  console.log(`[Health Score] ${district?.name ?? districtId}: ${overallScore}/100 (${grade})${trend ? ` — ${trend}` : ""}`);
}
