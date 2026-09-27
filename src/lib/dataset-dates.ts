/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Server-only: for every dataset in src/lib/constants/dataset-collection.ts,
// how many rows we hold for a district and the date (or period) of the
// newest one. Counted the way the pages show them: news-derived Leader /
// CrimeStat / PowerOutage rows and non-local infrastructure are left out,
// as in /api/data/[module]. One read-only aggregate per table.
import { prisma } from "@/lib/db";
import { LOCAL_INFRA, NOT_FROM_NEWS, NOT_FROM_NEWS_OPTIONAL } from "@/lib/data-filters";
import type { DatasetDate } from "@/lib/constants/dataset-collection";
import { NOT_SEEDED_RAINFALL } from "@/lib/data-filters";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const latest = (...ds: Array<Date | null | undefined>) =>
  ds.reduce<Date | null>((a, b) => (b && (!a || b > a) ? b : a), null);

/** The last Census of India that was held (the next one is Census 2027). */
const LAST_CENSUS_YEAR = 2011;

/** Last moment of a calendar month (for "rain up to Dec 2024" ages). */
const endOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0, 23, 59, 59));

export async function collectDatasetDates(districtId: string, stateId: string): Promise<Record<string, DatasetDate>> {
  const d = { districtId };
  const [
    news, alerts, alertsActive, weather, rain, rainCount, rtiCount, rtiTop,
    leaders, elections, panchayats, courts, crime, stations,
    budgetE, budgetA, budgetTop, infra, industries,
    schemes, housing, housingTop, services, offices, exams,
    jjm, dams, power, buses, trains, schools, crops, soil, advisories,
    profiles, popHistory, famous, insights,
  ] = await Promise.all([
    prisma.newsItem.aggregate({ where: d, _count: { _all: true }, _max: { publishedAt: true } }),
    prisma.localAlert.aggregate({ where: d, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.localAlert.count({ where: { ...d, active: true } }),
    prisma.weatherReading.aggregate({ where: d, _count: { _all: true }, _max: { recordedAt: true } }),
    prisma.rainfallHistory.findFirst({ where: { ...d, ...NOT_SEEDED_RAINFALL }, orderBy: [{ year: "desc" }, { month: "desc" }], select: { year: true, month: true } }),
    prisma.rainfallHistory.count({ where: d }),
    prisma.rtiStat.count({ where: d }),
    prisma.rtiStat.aggregate({ where: d, _max: { year: true } }),
    prisma.leader.aggregate({ where: { ...d, active: true, ...NOT_FROM_NEWS_OPTIONAL }, _count: { _all: true }, _max: { lastVerifiedAt: true } }),
    prisma.electionResult.aggregate({ where: d, _count: { _all: true }, _max: { year: true } }),
    prisma.gramPanchayat.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.courtStat.aggregate({ where: d, _count: { _all: true }, _max: { year: true } }),
    prisma.crimeStat.aggregate({ where: { ...d, ...NOT_FROM_NEWS }, _count: { _all: true }, _max: { year: true } }),
    prisma.policeStation.count({ where: d }),
    prisma.budgetEntry.aggregate({ where: d, _count: { _all: true }, _max: { fetchedAt: true, fiscalYear: true } }),
    prisma.budgetAllocation.aggregate({ where: d, _count: { _all: true }, _max: { fetchedAt: true } }),
    prisma.budgetAllocation.aggregate({ where: d, _max: { fiscalYear: true } }),
    prisma.infraProject.aggregate({ where: { ...d, ...LOCAL_INFRA }, _count: { _all: true }, _max: { lastVerifiedAt: true, updatedAt: true } }),
    prisma.localIndustry.aggregate({ where: { ...d, active: true }, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.scheme.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.housingScheme.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.housingScheme.aggregate({ where: d, _max: { fiscalYear: true } }),
    prisma.serviceGuide.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.govOffice.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.governmentExam.aggregate({
      where: { OR: [{ level: "national" }, { stateId, level: "state" }, { districtId }] },
      _count: { _all: true },
      _max: { lastVerifiedAt: true },
    }),
    prisma.jJMStatus.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.damReading.aggregate({ where: d, _count: { _all: true }, _max: { recordedAt: true } }),
    prisma.powerOutage.aggregate({ where: { ...d, ...NOT_FROM_NEWS }, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.busRoute.count({ where: d }),
    prisma.trainSchedule.count({ where: d }),
    prisma.school.aggregate({ where: d, _count: { _all: true }, _max: { updatedAt: true } }),
    prisma.cropPrice.aggregate({ where: d, _count: { _all: true }, _max: { date: true } }),
    prisma.soilHealth.aggregate({ where: d, _count: { _all: true }, _max: { testedAt: true } }),
    prisma.agriAdvisory.aggregate({ where: d, _count: { _all: true }, _max: { weekOf: true } }),
    prisma.demographicProfile.findMany({ where: d, select: { dataset: true, year: true }, orderBy: { year: "asc" } }),
    prisma.populationHistory.findMany({ where: d, select: { year: true, source: true } }),
    prisma.famousPersonality.aggregate({ where: { ...d, active: true }, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.aIModuleInsight.aggregate({ where: d, _count: { _all: true }, _max: { generatedAt: true } }),
  ]);

  // The editions the population page draws on, oldest first ("Census 2011 · NFHS-5 · NITI MPI 2023").
  // The last Census that was actually held is 2011 (the next is Census 2027),
  // so a history row labelled "Census" with a later year is not counted as one.
  const editions = [...new Set(profiles.map((p) => p.dataset))];
  const lastCensus = popHistory
    .filter((h) => /^census/i.test(h.source ?? "") && h.year <= LAST_CENSUS_YEAR)
    .reduce((a, h) => Math.max(a, h.year), 0);
  if (lastCensus && !editions.some((e) => /^census/i.test(e))) editions.unshift(`Census ${lastCensus}`);

  return {
    news: { rows: news._count._all, newest: iso(news._max.publishedAt), period: null },
    alerts: { rows: alerts._count._all, newest: iso(alerts._max.createdAt), period: null, active: alertsActive },
    weather: { rows: weather._count._all, newest: iso(weather._max.recordedAt), period: null },
    rainfall: { rows: rainCount, newest: rain ? iso(endOfMonth(rain.year, rain.month)) : null, period: rain ? `${rain.year}-${String(rain.month).padStart(2, "0")}` : null },
    rti: { rows: rtiCount, newest: null, period: rtiTop._max.year ? String(rtiTop._max.year) : null },
    leaders: { rows: leaders._count._all, newest: iso(leaders._max.lastVerifiedAt), period: null },
    elections: { rows: elections._count._all, newest: null, period: elections._max.year ? String(elections._max.year) : null },
    panchayats: { rows: panchayats._count._all, newest: iso(panchayats._max.updatedAt), period: null },
    courts: { rows: courts._count._all, newest: null, period: courts._max.year ? String(courts._max.year) : null },
    police: { rows: crime._count._all + stations, newest: null, period: crime._max.year ? String(crime._max.year) : null },
    budget: {
      rows: budgetE._count._all + budgetA._count._all,
      newest: iso(latest(budgetE._max.fetchedAt, budgetA._max.fetchedAt)),
      period: [budgetE._max.fiscalYear, budgetTop._max.fiscalYear].filter(Boolean).sort().pop() ?? null,
    },
    infrastructure: { rows: infra._count._all, newest: iso(infra._max.lastVerifiedAt ?? infra._max.updatedAt), period: null },
    industries: { rows: industries._count._all, newest: iso(industries._max.updatedAt), period: null },
    schemes: { rows: schemes._count._all, newest: iso(schemes._max.updatedAt), period: null },
    housing: { rows: housing._count._all, newest: iso(housing._max.updatedAt), period: housingTop._max.fiscalYear ?? null },
    services: { rows: services._count._all, newest: iso(services._max.updatedAt), period: null },
    offices: { rows: offices._count._all, newest: iso(offices._max.updatedAt), period: null },
    exams: { rows: exams._count._all, newest: iso(exams._max.lastVerifiedAt), period: null },
    jjm: { rows: jjm._count._all, newest: iso(jjm._max.updatedAt), period: null },
    dams: { rows: dams._count._all, newest: iso(dams._max.recordedAt), period: null },
    power: { rows: power._count._all, newest: iso(power._max.createdAt), period: null },
    transport: { rows: buses + trains, newest: null, period: null },
    schools: { rows: schools._count._all, newest: iso(schools._max.updatedAt), period: null },
    crops: { rows: crops._count._all, newest: iso(crops._max.date), period: null },
    soil: { rows: soil._count._all + advisories._count._all, newest: iso(latest(soil._max.testedAt, advisories._max.weekOf)), period: null },
    population: { rows: profiles.length + popHistory.length, newest: null, period: editions.length ? editions.join(" · ") : null },
    famous: { rows: famous._count._all, newest: iso(famous._max.createdAt), period: null },
    aiSummaries: { rows: insights._count._all, newest: iso(insights._max.generatedAt), period: null },
  };
}

