/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — All 29 module-specific data hooks
// Usage: const { data, isLoading, error } = useCropPrices("mandya", "karnataka")
// ═══════════════════════════════════════════════════════════
"use client";

import { useQuery } from "@tanstack/react-query";
import { useDistrictData } from "./useDistrictData";

// ── Types ────────────────────────────────────────────────

export interface Leader {
  id: string;
  name: string;
  nameLocal?: string | null;
  role: string;
  roleLocal?: string | null;
  party?: string | null;
  since?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  tier: number;
  constituency?: string | null;
  active?: boolean;
  source?: string | null;
  lastVerifiedAt?: string | null;
  roleDescription?: string | null;
}

export interface BudgetEntry {
  id: string;
  fiscalYear: string;
  sector: string;
  sectorLocal?: string | null;
  allocated: number;
  released: number;
  spent: number;
  source?: string | null;
}

export interface BudgetAllocation {
  id: string;
  fiscalYear: string;
  department: string;
  departmentLocal?: string | null;
  scheme?: string | null;
  category: string;
  allocated: number;
  released: number;
  spent: number;
  lapsed: number;
  source?: string | null;
  sourceUrl?: string | null;
  remarks?: string | null;
}

export interface RevenueEntry {
  id: string;
  fiscalYear: string;
  month: number;
  taxRevenue?: number | null;
  centralGrant?: number | null;
  stateGrant?: number | null;
  ownRevenue?: number | null;
  source?: string | null;
}

export interface RevenueCollection {
  id: string;
  fiscalYear: string;
  month: number;
  category: string;
  amount: number;
  target?: number | null;
  source: string;
}

export interface CropPrice {
  id: string;
  commodity: string;
  variety?: string | null;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalQty?: number | null;
  date: string;
  source: string;
}

export interface WeatherReading {
  id: string;
  temperature?: number | null;
  feelsLike?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  windDir?: string | null;
  conditions?: string | null;
  rainfall?: number | null;
  pressure?: number | null;
  visibility?: number | null;
  source: string;
  recordedAt: string;
}

export interface RainfallHistory {
  id: string;
  year: number;
  month: number;
  rainfall: number;
  normal: number;
  departure: number;
  source: string;
}

export interface SoilHealth {
  id: string;
  villageName?: string | null;
  pH?: number | null;
  organicCarbon?: string | null;
  nitrogen?: string | null;
  phosphorus?: string | null;
  potassium?: string | null;
  recommendation?: string | null;
  testedAt?: string | null;
  source: string;
}

export interface AgriAdvisory {
  id: string;
  weekOf: string;
  crop: string;
  cropLocal?: string | null;
  advisory: string;
  advisoryLocal?: string | null;
  category: string;
  source: string;
  active: boolean;
}

export interface DamReading {
  id: string;
  damName: string;
  damNameLocal?: string | null;
  waterLevel: number;
  maxLevel: number;
  storage: number;
  maxStorage: number;
  inflow: number;
  outflow: number;
  storagePct: number;
  recordedAt: string;
  source: string;
}

export interface CanalRelease {
  id: string;
  canalName: string;
  canalNameLocal?: string | null;
  releaseCusecs: number;
  scheduledDate: string;
  duration?: string | null;
  targetArea?: string | null;
  source: string;
}

export interface InfraUpdate {
  id: string;
  date: string;
  headline: string;
  summary: string | null;
  updateType: string;
  personName: string | null;
  personRole: string | null;
  personParty: string | null;
  budgetChange: number | null;
  progressPct: number | null;
  statusChange: string | null;
  newsUrl: string;
  newsTitle: string | null;
  newsSource: string | null;
  newsDate: string | null;
  verified: boolean;
}

export interface InfraProject {
  id: string;
  name: string;
  nameLocal?: string | null;
  category: string;
  status: string;
  budget?: number | null;
  fundsReleased?: number | null;
  progressPct?: number | null;
  contractor?: string | null;
  startDate?: string | null;
  expectedEnd?: string | null;
  source?: string | null;
  // News-driven fields
  shortName?: string | null;
  description?: string | null;
  scope?: string | null;
  announcedBy?: string | null;
  announcedByRole?: string | null;
  party?: string | null;
  executingAgency?: string | null;
  keyPeople?: Array<{ name: string; role: string | null; party: string | null; context: string | null }> | null;
  originalBudget?: number | null;
  revisedBudget?: number | null;
  costOverrun?: number | null;
  costOverrunPct?: number | null;
  announcedDate?: string | null;
  approvedDate?: string | null;
  tenderDate?: string | null;
  actualStartDate?: string | null;
  originalEndDate?: string | null;
  revisedEndDate?: string | null;
  completionDate?: string | null;
  cancelledDate?: string | null;
  cancellationReason?: string | null;
  delayMonths?: number | null;
  sourceUrls?: string[] | null;
  lastNewsAt?: string | null;
  lastVerifiedAt?: string | null;
  verificationCount?: number | null;
  updates?: InfraUpdate[];
}

export interface Scheme {
  id: string;
  name: string;
  nameLocal?: string | null;
  category: string;
  amount?: number | null;
  beneficiaryCount?: number | null;
  eligibility?: string | null;
  applyUrl?: string | null;
  level?: string | null;
  active: boolean;
  source?: string | null;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary?: string | null;
  publisher?: string | null;
  source: string;
  url?: string | null;
  category: string;
  publishedAt: string;
  targetModule?: string | null;
  moduleAction?: string | null;
}

export interface PoliceStation {
  id: string;
  name: string;
  nameLocal?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  sho?: string | null;
}

export interface CrimeStat {
  id: string;
  year: number;
  category: string;
  count: number;
  source: string;
}

export interface TrafficCollection {
  id: string;
  date: string;
  challans?: number | null;
  amount: number;
  monthlyTarget?: number | null;
  source?: string | null;
}

export interface RtiStat {
  id: string;
  year: number;
  department: string;
  filed: number;
  disposed: number;
  pending: number;
  avgDays: number;
}

export interface RtiTemplate {
  id: string;
  topic: string;
  topicLocal?: string | null;
  department: string;
  pioName?: string | null;
  pioAddress: string;
  feeAmount: string;
  templateText: string;
  templateTextLocal?: string | null;
  tips?: string | null;
  active: boolean;
}

export interface CourtStat {
  id: string;
  year: number;
  courtName: string;
  filed: number;
  disposed: number;
  pending: number;
  avgDays: number | null;
}

export interface ElectionResult {
  id: string;
  year: number;
  electionType: string;
  constituency: string;
  winnerName: string;
  winnerParty: string;
  winnerVotes: number;
  runnerUpName?: string | null;
  runnerUpParty?: string | null;
  runnerUpVotes?: number | null;
  turnoutPct?: number | null;
  margin?: number | null;
  source: string;
}

export interface PollingBooth {
  id: string;
  boothNumber: number;
  name: string;
  location: string;
  constituency: string;
  totalVoters?: number | null;
}

export interface GramPanchayat {
  id: string;
  name: string;
  nameLocal?: string | null;
  population?: number | null;
  households?: number | null;
  waterCoverage?: number | null;
  roadConnected?: boolean | null;
  mgnregaWorks?: number | null;
  totalFunds?: number | null;
  fundsUtilized?: number | null;
}

export interface School {
  id: string;
  name: string;
  nameLocal?: string | null;
  type: string;
  level: string;
  address?: string | null;
  students?: number | null;
  teachers?: number | null;
  studentTeacherRatio?: number | null;
  results: Array<{ id: string; year: number; exam: string; appeared: number; passed: number; passPercentage: number }>;
}

export interface JJMStatus {
  id: string;
  talukId?: string | null;
  villageName?: string | null;
  totalHouseholds: number;
  tapConnections: number;
  coveragePct: number;
  waterQualityTested: boolean;
  waterQualityResult?: string | null;
  source: string;
  updatedAt: string;
}

export interface HousingScheme {
  id: string;
  schemeName: string;
  fiscalYear: string;
  targetHouses: number;
  sanctioned: number;
  completed: number;
  inProgress: number;
  fundsAllocated?: number | null;
  fundsReleased?: number | null;
  fundsSpent?: number | null;
  source: string;
}

export interface PowerOutage {
  id: string;
  area: string;
  reason?: string | null;
  startTime: string;
  endTime?: string | null;
  durationHours?: number | null;
  affectedHouseholds?: number | null;
}

export interface BusRoute {
  id: string;
  routeNumber?: string | null;
  origin: string;
  destination: string;
  via?: string | null;
  operator: string;
  busType: string;
  departureTime?: string | null;
  frequency?: string | null;
  fare?: number | null;
  duration?: string | null;
  active: boolean;
}

export interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  stationName: string;
  arrivalTime?: string | null;
  departureTime?: string | null;
  daysOfWeek: string[];
  active: boolean;
}

export interface SugarFactory {
  id: string;
  name: string;
  nameLocal?: string | null;
  type: string;
  location: string;
  taluk?: string | null;
  capacity?: number | null;
  phone?: string | null;
  active: boolean;
  seasonData: Array<{
    id: string;
    season: string;
    totalCaneCrushed?: number | null;
    sugarProduced?: number | null;
    recoveryPct?: number | null;
    frpRate?: number | null;
    sapRate?: number | null;
    totalArrears?: number | null;
    farmersCount?: number | null;
    status: string;
  }>;
}

export interface ServiceGuide {
  id: string;
  serviceName: string;
  serviceNameLocal?: string | null;
  category: string;
  office: string;
  documentsNeeded: string[];
  fees?: string | null;
  timeline?: string | null;
  onlineUrl?: string | null;
  steps: string[];
  tips?: string | null;
  active: boolean;
}

export interface CitizenTip {
  id: string;
  category: string;
  categoryLocal?: string | null;
  title: string;
  titleLocal?: string | null;
  description: string;
  priority: number;
  active: boolean;
}

export interface LocalAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  titleLocal?: string | null;
  description: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  createdAt: string;
}

export interface GovOffice {
  id: string;
  name: string;
  nameLocal?: string | null;
  department: string;
  type: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  headName?: string | null;
  headDesignation?: string | null;
  services: string[];
  active: boolean;
}

export interface PopulationHistory {
  id: string;
  year: number;
  population: number;
  sexRatio?: number | null;
  literacy?: number | null;
  urbanPct?: number | null;
  density?: number | null;
  source: string;
}

export interface Taluk {
  id: string;
  name: string;
  nameLocal?: string | null;
  slug: string;
  population?: number | null;
  area?: number | null;
  villages: Array<{ id: string; name: string; nameLocal?: string | null; population?: number | null }>;
  _count: { villages: number };
}

export interface OverviewData {
  id: string;
  name: string;
  nameLocal: string;
  tagline?: string | null;
  population?: number | null;
  area?: number | null;
  talukCount?: number | null;
  villageCount?: number | null;
  literacy?: number | null;
  sexRatio?: number | null;
  density?: number | null;
  avgRainfall?: number | null;
  taluks: Array<{ id: string; name: string; nameLocal: string; slug: string }>;
  leaders: Leader[];
  _count: {
    infraProjects: number;
    schemes: number;
    policeStations: number;
    schools: number;
  };
}

// ── Hooks ────────────────────────────────────────────────

export function useOverview(district: string, state: string) {
  return useDistrictData<OverviewData>("overview", district, state);
}

export function useLeaders(district: string, state: string) {
  return useDistrictData<Leader[]>("leaders", district, state);
}

export function useBudget(district: string, state: string) {
  return useDistrictData<{ entries: BudgetEntry[]; allocations: BudgetAllocation[] }>(
    "budget", district, state
  );
}

export function useRevenue(district: string, state: string) {
  return useDistrictData<{ entries: RevenueEntry[]; collections: RevenueCollection[] }>(
    "revenue", district, state
  );
}

export function useCropPrices(district: string, state: string) {
  return useDistrictData<CropPrice[]>("crops", district, state);
}

export function useWeather(district: string, state: string) {
  return useDistrictData<WeatherReading[]>("weather", district, state);
}

export function useRainfall(district: string, state: string) {
  return useDistrictData<RainfallHistory[]>("rainfall", district, state);
}

export function useSoil(district: string, state: string) {
  return useDistrictData<{ soil: SoilHealth[]; advisories: AgriAdvisory[] }>(
    "soil", district, state
  );
}

export function useWater(district: string, state: string) {
  return useDistrictData<{ dams: DamReading[]; canals: CanalRelease[] }>(
    "water", district, state
  );
}

export function useInfrastructure(district: string, state: string) {
  return useDistrictData<InfraProject[]>("infrastructure", district, state);
}

export function useSchemes(district: string, state: string) {
  return useDistrictData<Scheme[]>("schemes", district, state);
}

export function useNews(district: string, state: string) {
  return useDistrictData<NewsItem[]>("news", district, state);
}

export function usePolice(district: string, state: string) {
  return useDistrictData<{ stations: PoliceStation[]; crime: CrimeStat[]; traffic: TrafficCollection[] }>(
    "police", district, state
  );
}

export function useRTI(district: string, state: string) {
  return useDistrictData<{ stats: RtiStat[]; templates: RtiTemplate[] }>(
    "rti", district, state
  );
}

export function useCourts(district: string, state: string) {
  return useDistrictData<CourtStat[]>("courts", district, state);
}

export function useElections(district: string, state: string) {
  return useDistrictData<{ results: ElectionResult[]; booths: PollingBooth[] }>(
    "elections", district, state
  );
}

export function usePanchayats(district: string, state: string) {
  return useDistrictData<GramPanchayat[]>("panchayats", district, state);
}

export function useSchools(district: string, state: string) {
  return useDistrictData<School[]>("schools", district, state);
}

export function useJJM(district: string, state: string) {
  return useDistrictData<JJMStatus[]>("jjm", district, state);
}

export function useHousing(district: string, state: string) {
  return useDistrictData<HousingScheme[]>("housing", district, state);
}

export function usePower(district: string, state: string) {
  return useDistrictData<PowerOutage[]>("power", district, state);
}

export function useTransport(district: string, state: string) {
  return useDistrictData<{ buses: BusRoute[]; trains: TrainSchedule[] }>(
    "transport", district, state
  );
}

export function useFactories(district: string, state: string) {
  return useDistrictData<SugarFactory[]>("factories", district, state);
}

export function useLocalIndustries(district: string, state: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useDistrictData<any[]>("local-industries", district, state);
}

export function useServices(district: string, state: string) {
  return useDistrictData<ServiceGuide[]>("services", district, state);
}

export function useTips(district: string, state: string) {
  return useDistrictData<CitizenTip[]>("tips", district, state);
}

export function useAlerts(district: string, state: string) {
  return useDistrictData<LocalAlert[]>("alerts", district, state);
}

export function useOffices(district: string, state: string) {
  return useDistrictData<GovOffice[]>("offices", district, state);
}

export function useAgriAdvisories(district: string, state: string) {
  return useDistrictData<AgriAdvisory[]>("agri", district, state);
}

export function usePopulation(district: string, state: string) {
  return useDistrictData<PopulationHistory[]>("population", district, state);
}

// ── Demographic Profile (rich multi-source) ──────────────

export interface DemographicProfileClient {
  id: string;
  year: number;
  dataset: string;
  totalPopulation: number | null;
  malePopulation: number | null;
  femalePopulation: number | null;
  sexRatio: number | null;
  childSexRatio: number | null;
  pop_0_6: number | null;
  pop_7_14: number | null;
  pop_15_59: number | null;
  pop_60_plus: number | null;
  medianAge: number | null;
  literacyTotal: number | null;
  literacyMale: number | null;
  literacyFemale: number | null;
  urbanPopulation: number | null;
  ruralPopulation: number | null;
  urbanPct: number | null;
  density: number | null;
  areaSqKm: number | null;
  households: number | null;
  avgHouseholdSize: number | null;
  religion: Record<string, number> | null;
  caste: Record<string, number> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  employment: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  economicClass: any;
  education: Record<string, number> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migration: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disability: any;
  language: { top10: Array<{ name: string; pct: number }> } | null;
  householdAmenities: Record<string, number> | null;
  maritalStatus: Record<string, number> | null;
  sourceName: string;
  sourceUrl: string | null;
  sourceLicense: string | null;
  retrievedAt: string;
  publishedAt: string | null;
  notes: string | null;
  boundaryVintage: string | null;
}

export interface PopulationProfileResponse {
  data: DemographicProfileClient | null;
  allDatasets: Array<{ year: number; dataset: string }>;
  meta: {
    lastUpdated: string | null;
    dataAgeDays: number | null;
    boundaryVintage: string | null;
  };
}

export function usePopulationProfile(district: string, state: string) {
  return useQuery<PopulationProfileResponse, Error>({
    queryKey: ["population-profile", district, state],
    queryFn: async () => {
      const res = await fetch(
        `/api/data/population/profile?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: Boolean(district && state),
    staleTime: 10 * 60_000,
  });
}

export function useTaluks(district: string, state: string) {
  return useDistrictData<Taluk[]>("taluks", district, state);
}


export interface FamousPersonality {
  id: string;
  name: string;
  nameLocal?: string | null;
  category: string;
  bio: string;
  photoUrl?: string | null;
  photoCredit?: string | null;
  wikiUrl?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  birthPlace?: string | null;
  notable?: string | null;
}

export function useFamousPersonalities(district: string, state: string) {
  return useDistrictData<FamousPersonality[]>("famous-personalities", district, state);
}

// ── Exams & Staffing ───────────────────────────────────────

export interface ExamsData {
  stateExams: Array<{
    id: string;
    level: string;
    title: string;
    department: string;
    vacancies: number | null;
    qualification: string | null;
    ageLimit: string | null;
    applicationFee: string | null;
    selectionProcess: string | null;
    payScale: string | null;
    applyUrl: string | null;
    notificationUrl: string | null;
    syllabusUrl: string | null;
    status: string;
    announcedDate: string | null;
    startDate: string | null;
    endDate: string | null;
    admitCardDate: string | null;
    examDate: string | null;
    resultDate: string | null;
  }>;
  districtExams: Array<ExamsData["stateExams"][number]>;
  staffing: Array<{
    id: string;
    module: string;
    department: string;
    roleName: string;
    sanctionedPosts: number;
    workingStrength: number;
    vacantPosts: number;
    asOfDate: string;
    sourceUrl: string | null;
  }>;
  summary: {
    totalStateExams: number;
    totalDistrictExams: number;
    openExams: number;
    upcomingExams: number;
    totalStaffingRecords: number;
  };
}

export function useExams(district: string, state: string) {
  return useDistrictData<ExamsData>("exams", district, state);
}

// ── AI Insight ────────────────────────────────────────────
export interface AIInsight {
  id: string;
  module: string;
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  sourceUrls: string[];
  createdAt: string;
}

export function useAIInsight(district: string, module: string) {
  return useQuery<AIInsight | null>({
    queryKey: ["ai-insight", district, module],
    queryFn: async () => {
      const res = await fetch(`/api/insights?district=${district}&module=${module}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.insight ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}
