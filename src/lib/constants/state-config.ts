/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH — Per-State Configuration
// When adding a new state, ONLY add a new entry here.
// ═══════════════════════════════════════════════════════════

export interface DataSourceEntry {
  module: string;
  source: string;
  type: "API" | "Collected" | "Aggregated" | "Static" | "RSS";
  frequency: string;
  url: string | null;
  status: "live" | "static";
}

export interface TenderPortalEntry {
  code: string;       // 'KPPP' | 'CPPP' | ...
  name: string;
  url: string;
  engine: "kppp-seam" | "nicgep" | "ireps" | "tenderwizard";
  priority: number;
  filterByDistrict?: string[]; // optional: only ingest tenders whose locationDistrict is in this list
}

export interface TenderTerminology {
  tenderWord: string;
  emdWord: string;
  nitWord: string;
  localLanguageLabels?: Record<string, string>;
}

export interface StateConfig {
  slug: string;
  name: string;
  nameLocal: string;

  // Electricity
  discomName: string;
  discomFullName: string;
  discomPortalUrl: string | null;

  // Water
  waterPortalName: string;
  waterPortalUrl: string | null;

  // Transport
  stateTransportName: string;
  stateTransportFullName: string;
  stateTransportUrl: string | null;

  // Education
  boardExamName: string;
  boardName: string;

  // RTI
  stateInformationCommission: string;
  rtiPortalUrl: string | null;

  // Weather / Geography
  agroClimaticZone: string;

  // Governance terminology
  districtHeadTitle: string;
  subDistrictUnit: string;
  subDistrictUnitPlural: string;

  // State police
  policeSystemType: "commissionerate" | "sp";

  // Urban district handling
  healthSubLabel: string;
  villageLabel: string;
  showVillages: boolean;
  gramPanchayatApplicable: boolean;
  jjmApplicable: boolean;
  municipalBody?: string;
  waterBoard?: string;
  stateHealthScheme?: string;
  lastElectionYear?: number;
  lastElectionType?: string;

  // State-specific data sources
  dataSources: DataSourceEntry[];

  // Government tender portals relevant to this state (Module 30 — Tenders)
  tenderPortals?: TenderPortalEntry[];
  tenderTerminology?: TenderTerminology;
}

// ── Karnataka ──────────────────────────────────────────────
const KARNATAKA: StateConfig = {
  slug: "karnataka",
  name: "Karnataka",
  nameLocal: "ಕರ್ನಾಟಕ",
  discomName: "BESCOM",
  discomFullName: "Bangalore Electricity Supply Company Limited (BESCOM)",
  discomPortalUrl: "https://bescom.karnataka.gov.in",
  waterPortalName: "Karnataka Water Resources Department",
  waterPortalUrl: "https://waterresources.karnataka.gov.in",
  stateTransportName: "KSRTC",
  stateTransportFullName: "Karnataka State Road Transport Corporation (KSRTC)",
  stateTransportUrl: "https://ksrtc.in",
  boardExamName: "SSLC",
  boardName: "Karnataka SSLC Board",
  stateInformationCommission: "Karnataka Information Commission",
  rtiPortalUrl: "https://kic.karnataka.gov.in",
  agroClimaticZone: "Southern Plateau and Hills / South Interior Karnataka",
  districtHeadTitle: "Deputy Commissioner",
  subDistrictUnit: "Taluk",
  subDistrictUnitPlural: "Taluks",
  policeSystemType: "sp",
  healthSubLabel: "Taluk Hospitals",
  villageLabel: "Villages",
  showVillages: true,
  gramPanchayatApplicable: true,
  jjmApplicable: true,
  stateHealthScheme: "Arogya Karnataka",
  lastElectionYear: 2023,
  lastElectionType: "Karnataka assembly",
  dataSources: [
    { module: "Power Outages", source: "BESCOM", type: "Collected", frequency: "When the source publishes", url: "https://bescom.karnataka.gov.in", status: "live" },
    { module: "Dam Levels", source: "Karnataka Water Resources Department", type: "Collected", frequency: "Every 6 hours", url: null, status: "live" },
    { module: "Budget & Revenue", source: "Karnataka Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
    { module: "RTI", source: "Karnataka Information Commission", type: "Collected", frequency: "Annual", url: "https://kic.karnataka.gov.in", status: "static" },
    { module: "Transport", source: "KSRTC / IRCTC", type: "API", frequency: "Monthly", url: "https://ksrtc.in", status: "static" },
    { module: "Sugar Factories", source: "Karnataka Sugar Directorate", type: "Collected", frequency: "Seasonal", url: null, status: "static" },
    { module: "Rainfall", source: "Karnataka State Natural Disaster Monitoring Centre (KSNDMC)", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
  tenderPortals: [
    { code: "KPPP",    name: "Karnataka eProcurement",              url: "https://eproc.karnataka.gov.in",    engine: "kppp-seam",     priority: 1 },
    { code: "CPPP",    name: "Central Public Procurement Portal",   url: "https://eprocure.gov.in/eprocure/app", engine: "nicgep",     priority: 2 },
    { code: "IREPS",   name: "Indian Railways ePS",                 url: "https://www.ireps.gov.in",          engine: "ireps",         priority: 3, filterByDistrict: ["Bengaluru Urban", "Mysuru"] },
    { code: "DEFPROC", name: "Defence Procurement",                 url: "https://defproc.gov.in",            engine: "nicgep",        priority: 4 },
    { code: "BEL_NIC", name: "Bharat Electronics Ltd eProc",        url: "https://eprocurebel.co.in/nicgep/app", engine: "nicgep",     priority: 5 },
    { code: "HAL_TW",  name: "Hindustan Aeronautics Ltd",           url: "https://eproc.hal-india.co.in",     engine: "tenderwizard",  priority: 6 },
  ],
  tenderTerminology: {
    tenderWord: "Tender",
    emdWord: "EMD (Earnest Money Deposit)",
    nitWord: "NIT (Notice Inviting Tender)",
    localLanguageLabels: { kn: "ಟೆಂಡರ್" },
  },
};

// ── Telangana ──────────────────────────────────────────────
const TELANGANA: StateConfig = {
  slug: "telangana",
  name: "Telangana",
  nameLocal: "తెలంగాణ",
  discomName: "TGSPDCL",
  discomFullName: "Telangana State Southern Power Distribution Company Limited (TGSPDCL)",
  discomPortalUrl: "https://tgsouthernpower.org",
  waterPortalName: "Telangana Irrigation Department",
  waterPortalUrl: "https://irrigation.telangana.gov.in",
  stateTransportName: "TSRTC",
  stateTransportFullName: "Telangana State Road Transport Corporation (TSRTC)",
  stateTransportUrl: "https://tsrtconline.in",
  boardExamName: "SSC",
  boardName: "Telangana Board of Secondary Education (BSE Telangana)",
  stateInformationCommission: "Telangana State Information Commission",
  rtiPortalUrl: "https://tsic.cgg.gov.in",
  agroClimaticZone: "Southern Plateau and Hills",
  districtHeadTitle: "Collector & District Magistrate",
  subDistrictUnit: "Mandal",
  subDistrictUnitPlural: "Mandals",
  policeSystemType: "commissionerate",
  healthSubLabel: "Area Hospitals",
  villageLabel: "Localities",
  showVillages: false,
  gramPanchayatApplicable: false,
  jjmApplicable: false,
  municipalBody: "GHMC",
  waterBoard: "HMWSSB",
  stateHealthScheme: "Aarogyasri",
  lastElectionYear: 2023,
  lastElectionType: "Telangana assembly",
  dataSources: [
    { module: "Power Outages", source: "TGSPDCL", type: "Collected", frequency: "When the source publishes", url: "https://tgsouthernpower.org", status: "static" },
    { module: "Dam Levels", source: "Telangana Irrigation Department", type: "Collected", frequency: "Daily", url: "https://irrigation.telangana.gov.in", status: "static" },
    { module: "Budget & Revenue", source: "Telangana Finance Department", type: "Collected", frequency: "Quarterly", url: "https://finance.telangana.gov.in", status: "static" },
    { module: "RTI", source: "Telangana State Information Commission", type: "Collected", frequency: "Annual", url: "https://tsic.cgg.gov.in", status: "static" },
    { module: "Transport", source: "TSRTC / IRCTC", type: "API", frequency: "Monthly", url: "https://tsrtconline.in", status: "static" },
    { module: "Rainfall", source: "Telangana State Development Planning Society (TSDPS)", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── Delhi ──────────────────────────────────────────────────
const DELHI: StateConfig = {
  slug: "delhi",
  name: "Delhi",
  nameLocal: "दिल्ली",
  discomName: "BSES / TPDDL",
  discomFullName: "BSES Rajdhani / BSES Yamuna / Tata Power Delhi Distribution Limited",
  discomPortalUrl: "https://www.bsesdelhi.com",
  waterPortalName: "Delhi Jal Board",
  waterPortalUrl: "https://delhijalboard.delhi.gov.in",
  stateTransportName: "DTC / DMRC",
  stateTransportFullName: "Delhi Transport Corporation (DTC) / Delhi Metro Rail Corporation (DMRC)",
  stateTransportUrl: "https://dtc.delhi.gov.in",
  boardExamName: "CBSE",
  boardName: "Central Board of Secondary Education (CBSE)",
  stateInformationCommission: "Delhi Information Commission",
  rtiPortalUrl: "https://dic.delhi.gov.in",
  agroClimaticZone: "Trans-Gangetic Plains",
  districtHeadTitle: "District Magistrate",
  subDistrictUnit: "Tehsil",
  subDistrictUnitPlural: "Tehsils",
  policeSystemType: "commissionerate",
  healthSubLabel: "Zonal Hospitals",
  villageLabel: "Wards",
  showVillages: false,
  gramPanchayatApplicable: false,
  jjmApplicable: false,
  municipalBody: "MCD",
  waterBoard: "DJB",
  stateHealthScheme: "Delhi Arogya Kosh",
  lastElectionYear: 2025,
  lastElectionType: "Delhi assembly",
  dataSources: [
    { module: "Power Outages", source: "BSES / TPDDL", type: "Collected", frequency: "When the source publishes", url: "https://www.bsesdelhi.com", status: "static" },
    { module: "Dam Levels", source: "Delhi Jal Board", type: "Collected", frequency: "Daily", url: "https://delhijalboard.delhi.gov.in", status: "static" },
    { module: "Budget & Revenue", source: "Delhi Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
    { module: "RTI", source: "Delhi Information Commission", type: "Collected", frequency: "Annual", url: "https://dic.delhi.gov.in", status: "static" },
    { module: "Transport", source: "DTC / DMRC / IRCTC", type: "API", frequency: "Monthly", url: "https://dtc.delhi.gov.in", status: "static" },
    { module: "Rainfall", source: "India Meteorological Department (IMD), Delhi", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── Maharashtra ────────────────────────────────────────────
// State-wide values. Mumbai (BEST/Adani power, BMC, no village councils)
// is an exception and lives in DISTRICT_OVERRIDES below, so Pune and every
// other Maharashtra district no longer inherit Mumbai's settings.
const MAHARASHTRA: StateConfig = {
  slug: "maharashtra",
  name: "Maharashtra",
  nameLocal: "महाराष्ट्र",
  discomName: "MSEDCL (Mahavitaran)",
  discomFullName: "Maharashtra State Electricity Distribution Company Limited (MSEDCL / Mahavitaran)",
  discomPortalUrl: "https://www.mahadiscom.in",
  waterPortalName: "Maharashtra Water Resources Department",
  waterPortalUrl: "https://wrd.maharashtra.gov.in",
  stateTransportName: "MSRTC",
  stateTransportFullName: "Maharashtra State Road Transport Corporation (MSRTC)",
  stateTransportUrl: "https://msrtc.maharashtra.gov.in",
  boardExamName: "SSC",
  boardName: "Maharashtra State Board of Secondary Education",
  stateInformationCommission: "Maharashtra State Information Commission",
  rtiPortalUrl: "https://maic.gov.in",
  agroClimaticZone: "Western Plateau and Hills",
  districtHeadTitle: "Collector & District Magistrate",
  subDistrictUnit: "Taluka",
  subDistrictUnitPlural: "Talukas",
  policeSystemType: "commissionerate",
  healthSubLabel: "Sub-District Hospitals",
  villageLabel: "Villages",
  showVillages: true,
  gramPanchayatApplicable: true,
  jjmApplicable: true,
  stateHealthScheme: "MJPJAY",
  lastElectionYear: 2024,
  lastElectionType: "Maharashtra assembly",
  dataSources: [
    { module: "Power Outages", source: "MSEDCL (Mahavitaran)", type: "Collected", frequency: "When the source publishes", url: "https://www.mahadiscom.in", status: "static" },
    { module: "Dam Levels", source: "Maharashtra Water Resources Department", type: "Collected", frequency: "Daily", url: "https://wrd.maharashtra.gov.in", status: "static" },
    { module: "Budget & Revenue", source: "Maharashtra Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
    { module: "RTI", source: "Maharashtra State Information Commission", type: "Collected", frequency: "Annual", url: "https://maic.gov.in", status: "static" },
    { module: "Transport", source: "MSRTC / IRCTC", type: "API", frequency: "Monthly", url: "https://msrtc.maharashtra.gov.in", status: "static" },
    { module: "Rainfall", source: "India Meteorological Department (IMD)", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── West Bengal ────────────────────────────────────────────
const WEST_BENGAL: StateConfig = {
  slug: "west-bengal",
  name: "West Bengal",
  nameLocal: "পশ্চিমবঙ্গ",
  discomName: "CESC / WBSEDCL",
  discomFullName: "CESC Limited (Kolkata) / West Bengal State Electricity Distribution Company Limited",
  discomPortalUrl: "https://www.cesc.co.in",
  waterPortalName: "West Bengal Irrigation & Waterways Department",
  waterPortalUrl: "https://wbiwd.gov.in",
  stateTransportName: "SBSTC / Kolkata Metro",
  stateTransportFullName: "South Bengal State Transport Corporation (SBSTC) / Kolkata Metro",
  stateTransportUrl: null,
  boardExamName: "Madhyamik",
  boardName: "West Bengal Board of Secondary Education (WBBSE)",
  stateInformationCommission: "West Bengal Information Commission",
  rtiPortalUrl: "https://wbic.gov.in",
  agroClimaticZone: "Lower Gangetic Plain",
  districtHeadTitle: "District Magistrate",
  subDistrictUnit: "Block",
  subDistrictUnitPlural: "Blocks",
  policeSystemType: "commissionerate",
  healthSubLabel: "Block Hospitals",
  villageLabel: "Wards",
  showVillages: false,
  gramPanchayatApplicable: false,
  jjmApplicable: false,
  municipalBody: "KMC",
  waterBoard: "KMC Water Supply",
  stateHealthScheme: "Swasthya Sathi",
  lastElectionYear: 2021,
  lastElectionType: "West Bengal assembly",
  dataSources: [
    { module: "Power Outages", source: "CESC / WBSEDCL", type: "Collected", frequency: "When the source publishes", url: "https://www.cesc.co.in", status: "static" },
    { module: "Dam Levels", source: "WB Irrigation & Waterways Department", type: "Collected", frequency: "Daily", url: "https://wbiwd.gov.in", status: "static" },
    { module: "Budget & Revenue", source: "West Bengal Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
    { module: "RTI", source: "West Bengal Information Commission", type: "Collected", frequency: "Annual", url: "https://wbic.gov.in", status: "static" },
    { module: "Transport", source: "SBSTC / Kolkata Metro / IRCTC", type: "API", frequency: "Monthly", url: null, status: "static" },
    { module: "Rainfall", source: "India Meteorological Department (IMD), Kolkata", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── Tamil Nadu ─────────────────────────────────────────────
const TAMIL_NADU: StateConfig = {
  slug: "tamil-nadu",
  name: "Tamil Nadu",
  nameLocal: "தமிழ்நாடு",
  // TANGEDCO was split up and its distribution arm renamed Tamil Nadu Power
  // Distribution Corporation Limited (TNPDCL); the Registrar of Companies
  // approved the new name on 27 June 2024 (DT Next, "Union govt approves
  // TANGEDCO renaming to TNPDCL"). Site checked 2026-09-28: www.tnpdcl.org
  // ("Welcome to TNPDCL"); www.tangedco.gov.in no longer resolves.
  discomName: "TNPDCL",
  discomFullName: "Tamil Nadu Power Distribution Corporation Limited (TNPDCL)",
  discomPortalUrl: "https://www.tnpdcl.org",
  waterPortalName: "Tamil Nadu Public Works Department (Water Resources)",
  waterPortalUrl: "https://www.tn.gov.in/department/38",
  stateTransportName: "TNSTC / Chennai Metro",
  stateTransportFullName: "Tamil Nadu State Transport Corporation (TNSTC) / Chennai Metro Rail",
  stateTransportUrl: "https://www.tnstc.in",
  boardExamName: "SSLC",
  boardName: "Tamil Nadu Directorate of Government Examinations",
  stateInformationCommission: "Tamil Nadu Information Commission",
  rtiPortalUrl: "https://www.tnic.gov.in",
  agroClimaticZone: "East Coast Plains and Hills",
  districtHeadTitle: "Collector",
  subDistrictUnit: "Taluk",
  subDistrictUnitPlural: "Taluks",
  policeSystemType: "commissionerate",
  healthSubLabel: "Taluk Hospitals",
  villageLabel: "Villages",
  showVillages: false,
  gramPanchayatApplicable: false,
  jjmApplicable: false,
  municipalBody: "GCC",
  waterBoard: "CMWSSB",
  stateHealthScheme: "CMCHIS",
  lastElectionYear: 2021,
  lastElectionType: "Tamil Nadu assembly",
  dataSources: [
    { module: "Power Outages", source: "TNPDCL", type: "Collected", frequency: "When the source publishes", url: "https://www.tnpdcl.org", status: "static" },
    { module: "Dam Levels", source: "TN Public Works Department (WRD)", type: "Collected", frequency: "Daily", url: null, status: "static" },
    { module: "Budget & Revenue", source: "Tamil Nadu Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
    { module: "RTI", source: "Tamil Nadu Information Commission", type: "Collected", frequency: "Annual", url: "https://www.tnic.gov.in", status: "static" },
    { module: "Transport", source: "TNSTC / Chennai Metro / IRCTC", type: "API", frequency: "Monthly", url: "https://www.tnstc.in", status: "static" },
    { module: "Rainfall", source: "India Meteorological Department (IMD), Chennai", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── Uttar Pradesh ─────────────────────────────────────────
const UTTAR_PRADESH: StateConfig = {
  slug: "uttar-pradesh",
  name: "Uttar Pradesh",
  nameLocal: "उत्तर प्रदेश",
  discomName: "UPPCL / LESA",
  discomFullName: "Uttar Pradesh Power Corporation Limited / Lucknow Electricity Supply Administration",
  discomPortalUrl: "https://www.uppcl.org",
  waterPortalName: "UP Jal Nigam / Jal Kal Vibhag",
  waterPortalUrl: "https://upjn.up.gov.in",
  stateTransportName: "UPSRTC / LMRC",
  stateTransportFullName: "Uttar Pradesh State Road Transport Corporation (UPSRTC) / Lucknow Metro Rail Corporation",
  stateTransportUrl: "https://www.upsrtc.com",
  boardExamName: "UP Board",
  boardName: "Uttar Pradesh Madhyamik Shiksha Parishad",
  stateInformationCommission: "UP State Information Commission",
  rtiPortalUrl: "https://upsic.up.nic.in",
  agroClimaticZone: "Upper Gangetic Plains",
  districtHeadTitle: "District Magistrate",
  subDistrictUnit: "Tehsil",
  subDistrictUnitPlural: "Tehsils",
  policeSystemType: "commissionerate",
  healthSubLabel: "Community Health Centres",
  villageLabel: "Villages",
  showVillages: true,
  gramPanchayatApplicable: true,
  jjmApplicable: true,
  municipalBody: "LMC",
  waterBoard: "Jal Kal Vibhag",
  stateHealthScheme: "Ayushman Bharat UP",
  lastElectionYear: 2022,
  lastElectionType: "Uttar Pradesh assembly",
  dataSources: [
    { module: "Power Outages", source: "UPPCL / LESA", type: "Collected", frequency: "When the source publishes", url: "https://www.uppcl.org", status: "static" },
    { module: "Dam Levels", source: "UP Jal Nigam / India-WRIS", type: "Collected", frequency: "Daily", url: "https://upjn.up.gov.in", status: "static" },
    { module: "Budget & Revenue", source: "UP Finance Department", type: "Collected", frequency: "Quarterly", url: "https://budget.up.nic.in", status: "static" },
    { module: "RTI", source: "UP State Information Commission", type: "Collected", frequency: "Annual", url: "https://upsic.up.nic.in", status: "static" },
    { module: "Transport", source: "UPSRTC / LMRC / IRCTC", type: "API", frequency: "Monthly", url: "https://www.upsrtc.com", status: "static" },
    { module: "Rainfall", source: "India Meteorological Department (IMD), Lucknow", type: "API", frequency: "Daily", url: null, status: "live" },
  ],
};

// ── Config registry ────────────────────────────────────────
// NOTE: Telangana, Delhi, West Bengal and Tamil Nadu have one live district
// each (Hyderabad, New Delhi, Kolkata, Chennai), all fully urban, so their
// state entries above still carry metro values (no village councils, city
// water board). When a rural district of one of these states goes live,
// move the metro values into DISTRICT_OVERRIDES and make the state entry
// state-wide, as was done for Maharashtra.
const STATE_CONFIGS: Record<string, StateConfig> = {
  karnataka: KARNATAKA,
  telangana: TELANGANA,
  delhi: DELHI,
  maharashtra: MAHARASHTRA,
  "west-bengal": WEST_BENGAL,
  "tamil-nadu": TAMIL_NADU,
  "uttar-pradesh": UTTAR_PRADESH,
};

// ── Per-district overrides ─────────────────────────────────
// Only what differs from the state entry. Keyed "<state>/<district>".
// Read through getStateConfig(state, district): pages under
// /[state]/[district]/ should always pass the district.
type DistrictOverride = Partial<Omit<StateConfig, "slug" | "name" | "nameLocal">>;

const DISTRICT_OVERRIDES: Record<string, DistrictOverride> = {
  // Mumbai city + suburbs: BEST (island city) and Adani Electricity
  // (suburbs); BMC runs water; no village councils or JJM (fully urban).
  "maharashtra/mumbai": {
    discomName: "BEST / Adani",
    discomFullName: "BEST Undertaking / Adani Electricity Mumbai Limited",
    discomPortalUrl: "https://www.bestundertaking.com",
    stateTransportName: "MSRTC / BEST",
    stateTransportFullName: "Maharashtra State Road Transport Corporation (MSRTC) / BEST",
    agroClimaticZone: "West Coast Plains and Ghats",
    showVillages: false,
    gramPanchayatApplicable: false,
    jjmApplicable: false,
    municipalBody: "BMC",
    waterBoard: "BMC Water Dept",
    dataSources: [
      { module: "Power Outages", source: "BEST / Adani Electricity", type: "Collected", frequency: "When the source publishes", url: "https://www.bestundertaking.com", status: "static" },
      { module: "Dam Levels", source: "Maharashtra Water Resources Department", type: "Collected", frequency: "Daily", url: "https://wrd.maharashtra.gov.in", status: "static" },
      { module: "Budget & Revenue", source: "Maharashtra Finance Department", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
      { module: "RTI", source: "Maharashtra State Information Commission", type: "Collected", frequency: "Annual", url: "https://maic.gov.in", status: "static" },
      { module: "Transport", source: "MSRTC / BEST / IRCTC", type: "API", frequency: "Monthly", url: "https://msrtc.maharashtra.gov.in", status: "static" },
      { module: "Rainfall", source: "India Meteorological Department (IMD), Mumbai", type: "API", frequency: "Daily", url: null, status: "live" },
    ],
  },
  // Pune: two city corporations (PMC, PCMC) plus about 1,400 gram
  // panchayats in the rural talukas; MSEDCL supplies power; PMPML runs
  // city buses. Village councils and JJM apply (state defaults).
  "maharashtra/pune": {
    stateTransportName: "MSRTC / PMPML",
    stateTransportFullName: "Maharashtra State Road Transport Corporation (MSRTC) / Pune Mahanagar Parivahan Mahamandal (PMPML)",
    municipalBody: "PMC / PCMC",
    waterBoard: "PMC / PCMC Water Supply Departments",
  },
  // Mandya and Mysuru get power from CESC (Chamundeshwari Electricity
  // Supply Corporation), not BESCOM.
  "karnataka/mandya": {
    discomName: "CESC",
    discomFullName: "Chamundeshwari Electricity Supply Corporation Limited (CESC Mysore)",
    discomPortalUrl: "https://cescmysore.karnataka.gov.in",
    municipalBody: "Mandya City Municipal Council",
  },
  "karnataka/mysuru": {
    discomName: "CESC",
    discomFullName: "Chamundeshwari Electricity Supply Corporation Limited (CESC Mysore)",
    discomPortalUrl: "https://cescmysore.karnataka.gov.in",
    municipalBody: "Mysuru City Corporation",
  },
  "karnataka/bengaluru-urban": {
    municipalBody: "BBMP",
  },
  // New Delhi district: the New Delhi Municipal Council (NDMC) is the
  // electricity licensee and water supplier in the NDMC area (Lutyens'
  // Delhi, Connaught Place, Chanakyapuri — https://ndmc.gov.in/departments/power.aspx,
  // read 2026-09-28); BSES Rajdhani serves the rest of the district (south
  // and west Delhi). BSES Yamuna (east) and Tata Power-DDL (north) do not.
  // The Vasant Vihar area is under MCD with Delhi Jal Board water.
  "delhi/new-delhi": {
    discomName: "NDMC / BSES Rajdhani",
    discomFullName: "New Delhi Municipal Council (NDMC) / BSES Rajdhani Power Limited",
    discomPortalUrl: "https://ndmc.gov.in",
    municipalBody: "NDMC / MCD",
    waterBoard: "NDMC / DJB",
  },
};

// ── Universal data sources (apply to ALL districts) ────────
export const UNIVERSAL_DATA_SOURCES: DataSourceEntry[] = [
  { module: "Crop Prices", source: "AGMARKNET (Agricultural Marketing Information Network)", type: "API", frequency: "Daily (market days)", url: "https://agmarknet.gov.in", status: "live" },
  { module: "Weather", source: "OpenWeatherMap / Open-Meteo", type: "API", frequency: "Every 30 minutes", url: "https://openweathermap.org", status: "live" },
  { module: "Schools", source: "UDISE+ (Unified District Information System for Education)", type: "API", frequency: "Weekly", url: "https://dashboard.udiseplus.gov.in/", status: "live" },
  { module: "Elections", source: "Election Commission of India (ECI)", type: "Static", frequency: "Post-election", url: "https://eci.gov.in", status: "static" },
  { module: "Schemes", source: "MyScheme.gov.in / State scheme portals", type: "API", frequency: "Weekly", url: "https://myscheme.gov.in", status: "static" },
  { module: "Courts", source: "NJDG (National Judicial Data Grid)", type: "API", frequency: "Daily", url: "https://njdg.ecourts.gov.in/njdg_v3/", status: "live" },
  { module: "Police / Crime", source: "NCRB (National Crime Records Bureau) / data.gov.in", type: "Collected", frequency: "Annual", url: "https://ncrb.gov.in", status: "static" },
  { module: "Infrastructure", source: "PMGSY / State PWD Portal", type: "Collected", frequency: "Monthly", url: null, status: "static" },
  { module: "Jal Jeevan Mission", source: "JJM National Dashboard (eJalShakti)", type: "API", frequency: "Daily", url: "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx", status: "live" },
  { module: "Housing", source: "AwaasSoft (PMAY Dashboard)", type: "API", frequency: "Monthly", url: "https://pmayg.nic.in", status: "live" },
  { module: "Population", source: "Census of India 2011 + NFHS-5 (2019-21) + NITI MPI 2023 + SRS 2023 + PLFS (latest)", type: "Collected", frequency: "Census: decadal (2027 upcoming) · NFHS: 5-yearly · PLFS: quarterly · SRS: annual · BBMP municipal: ad-hoc", url: "https://censusindia.gov.in", status: "static" },
  { module: "Panchayats", source: "MGNREGA “At a glance” (NREGASoft)", type: "API", frequency: "Daily", url: "https://nrega.dord.gov.in/MGNREGA_new/Nrega_home.aspx", status: "live" },
  { module: "News", source: "Google News RSS / Regional news aggregation", type: "RSS", frequency: "Daily", url: null, status: "live" },
  { module: "Leaders", source: "Lok Sabha / State Legislature / District Administration", type: "Collected", frequency: "On-change", url: null, status: "static" },
  { module: "Famous Personalities", source: "Wikipedia (CC-BY-SA licensed)", type: "Static", frequency: "Static", url: null, status: "static" },
  { module: "Offices", source: "District NIC Portal / State Government Directory", type: "Collected", frequency: "Quarterly", url: null, status: "static" },
  { module: "Government Exams", source: "UPSC / SSC / State PSC / Recruitment Boards", type: "Collected", frequency: "As announced", url: null, status: "static" },
];

// ── Module → source mapping for DataSourceBanner ───────────
export interface ModuleSourceInfo {
  sources: string[];
  frequency: string;
  isLive?: boolean;
  /** Official website for a source name in `sources`, when there is one (for the verification panel). */
  links?: Record<string, string>;
}

/** Official websites for source names used in getModuleSources(). */
const SOURCE_LINKS: Record<string, string> = {
  "PFMS (Public Financial Management System)": "https://pfms.nic.in",
  "State Treasury / eGramSwaraj": "https://egramswaraj.gov.in",
  "NCRB (National Crime Records Bureau)": "https://ncrb.gov.in",
  "data.gov.in": "https://data.gov.in",
  "Election Commission of India (ECI)": "https://eci.gov.in",
  "NJDG (National Judicial Data Grid)": "https://njdg.ecourts.gov.in",
  "MyScheme.gov.in": "https://www.myscheme.gov.in",
  "AwaasSoft (PMAY Dashboard)": "https://pmayg.nic.in",
  eGramSwaraj: "https://egramswaraj.gov.in",
  "NREGA.nic.in": "https://nrega.dord.gov.in/MGNREGA_new/Nrega_home.aspx",
  UPSC: "https://upsc.gov.in",
  SSC: "https://ssc.gov.in",
  "KPPP (Karnataka eProc)": "https://kppp.karnataka.gov.in",
  "CPPP (GePNIC)": "https://eprocure.gov.in/cppp/",
  IREPS: "https://www.ireps.gov.in",
  "defproc.gov.in": "https://defproc.gov.in",
  "Jal Jeevan Mission National Dashboard (eJalShakti)": "https://ejalshakti.gov.in/jjmreport",
  "UDISE+ (Unified District Information System for Education)": "https://dashboard.udiseplus.gov.in/",
  "AGMARKNET (Agricultural Marketing Information Network)": "https://agmarknet.gov.in",
  "India Meteorological Department (IMD)": "https://mausam.imd.gov.in",
  OpenWeatherMap: "https://openweathermap.org",
  "Open-Meteo": "https://open-meteo.com",
};

// Honesty rule (Sept 2026 audit): `isLive` is true ONLY for modules that a
// Vercel cron in vercel.json actually refreshes — weather (every 30 min) and
// dams/water (every 6 h). Every other `frequency` describes when the upstream
// source publishes, not a poller we run. Update this when vercel.json changes.
export function getModuleSources(moduleName: string, stateSlug: string, districtSlug?: string): ModuleSourceInfo {
  const config = getStateConfig(stateSlug, districtSlug);
  const map: Record<string, ModuleSourceInfo> = {
    // Sept 2026 audit: readings come from OpenWeatherMap and the forecast
    // (and its cross-check) from Open-Meteo (src/scraper/jobs/weather.ts,
    // src/lib/weather/forecast.ts); nothing is read from IMD, so IMD is
    // not named as a source.
    weather:           { sources: ["OpenWeatherMap", "Open-Meteo"], frequency: "Every 30 minutes", isLive: true },
    crops:             { sources: ["AGMARKNET (Agricultural Marketing Information Network)"], frequency: "Daily" },
    // Dam levels come only from the state water resources portal
    // (src/scraper/jobs/dams.ts: India-WRIS has no usable public API), so
    // India-WRIS is not named as a source (Sept 2026 audit).
    water:             { sources: [config?.waterPortalName ?? "State Water Resources Department"], frequency: "Every 6 hours", isLive: true },
    power:             { sources: [config?.discomFullName ?? "State Power Distribution Company"], frequency: "When the source publishes" },
    budget:            { sources: ["PFMS (Public Financial Management System)", "State Treasury / eGramSwaraj"], frequency: "When the source publishes" },
    police:            { sources: ["NCRB (National Crime Records Bureau)", "data.gov.in"], frequency: "Annual" },
    schools:           { sources: ["UDISE+ (Unified District Information System for Education)"], frequency: "Weekly", isLive: true },
    elections:         { sources: ["Election Commission of India (ECI)"], frequency: "Post-election" },
    // Leadership page (MP, MLAs, DC, SP …). Positions change on elections,
    // transfers and reshuffles, so there is no fixed schedule.
    leadership:        {
      sources: [
        "Election Commission of India (ECI)",
        config ? `${config.name} Legislative Assembly` : "State Legislative Assembly",
        "District Administration",
      ],
      frequency: "When the source publishes",
      isLive: false,
    },
    transport:         { sources: [config?.stateTransportFullName ?? "State Transport Corporation", "IRCTC"], frequency: "Monthly" },
    rti:               { sources: [config?.stateInformationCommission ?? "State Information Commission", "RTI Online Portal"], frequency: "When the source publishes" },
    courts:            { sources: ["NJDG (National Judicial Data Grid)"], frequency: "Daily", isLive: true },
    population:        {
      sources: [
        "Census of India 2011 (Office of the Registrar General & Census Commissioner)",
        "NFHS-5 2019-21 (IIPS, Mumbai)",
        "NITI Aayog Multidimensional Poverty Index 2023",
        "Sample Registration System (SRS) — latest",
        "PLFS (MoSPI) — latest quarter (state-level)",
        `${config?.name ?? "State"} Directorate of Economics & Statistics (where applicable)`,
        config?.municipalBody
          ? `${config.municipalBody} / Municipal sources (where applicable)`
          : "Municipal sources (where applicable)",
      ],
      frequency: "Foundational data is decadal (Census); supplements refresh monthly (NFHS, SRS) to quarterly (PLFS).",
      isLive: false,
    },
    health:            { sources: ["National Health Mission", "State Health Department"], frequency: "Monthly" },
    schemes:           { sources: ["MyScheme.gov.in", "State scheme portals"], frequency: "When the source publishes" },
    jjm:               { sources: ["Jal Jeevan Mission National Dashboard (eJalShakti)"], frequency: "Daily", isLive: true },
    housing:           { sources: ["AwaasSoft (PMAY Dashboard)"], frequency: "Monthly" },
    industries:        { sources: ["District Industries Centre", "State Industrial Dev. Corp."], frequency: "Quarterly" },
    infrastructure:    { sources: ["News articles (Google News RSS + regional media)", "Government press releases"], frequency: "Daily" },
    farm:              { sources: ["Soil Health Card Portal", "KVK / ICAR"], frequency: "Seasonal" },
    "gram-panchayat":  { sources: ["NREGA.nic.in"], frequency: "Daily", isLive: true },
    news:              { sources: ["Google News RSS", "Regional news aggregation"], frequency: "Daily" },
    "famous-personalities": { sources: ["Wikipedia (CC-BY-SA licensed)"], frequency: "Static" },
    offices:           { sources: ["District NIC Portal", "State Government Directory"], frequency: "Quarterly" },
    exams:             { sources: ["UPSC", "SSC", "State PSC / Recruitment Boards", "News articles (Google News RSS + regional media)"], frequency: "When the source publishes" },
    "data-sources":    { sources: ["ForThePeople.in transparency page"], frequency: "Updated with each release" },
    "citizen-corner":  { sources: ["District Administration", "Citizen feedback"], frequency: "Weekly" },
    alerts:            { sources: ["IMD", "District Administration", "NDMA"], frequency: "When the source publishes" },
    "responsibility":  { sources: ["District Administration"], frequency: "Quarterly" },
    "update-log":      { sources: ["ForThePeople.in Admin & Data Refresh"], frequency: "When the source publishes" },
    services:          { sources: ["District NIC Portal", "State Government Directory", "MyScheme.gov.in"], frequency: "When the source publishes" },
    tenders:           { sources: ["KPPP (Karnataka eProc)", "CPPP (GePNIC)", "IREPS", "defproc.gov.in", "BEL eProc", "HAL TenderWizard"], frequency: "When the source publishes" },
  };
  const info = map[moduleName] ?? { sources: ["Government public data portals"], frequency: "Periodic" };
  const links: Record<string, string> = {};
  for (const name of info.sources) if (SOURCE_LINKS[name]) links[name] = SOURCE_LINKS[name];
  // The state's own portals (power company, water department) where the registry names them.
  if (config?.discomPortalUrl && info.sources.includes(config.discomFullName)) links[config.discomFullName] = config.discomPortalUrl;
  if (config?.stateTransportUrl && info.sources.includes(config.stateTransportFullName)) links[config.stateTransportFullName] = config.stateTransportUrl;
  return Object.keys(links).length ? { ...info, links } : info;
}

// ── AI insight update frequency by module ───────────────────
export function getInsightFrequencyLabel(moduleName: string): string {
  const liveModules = ["weather", "crops", "water", "power", "news", "alerts", "tenders"];
  if (liveModules.includes(moduleName)) return "Updated every 2 hours";
  const weeklyModules = ["finance", "infrastructure", "schemes", "health"];
  if (weeklyModules.includes(moduleName)) return "Updated weekly";
  const annualModules = ["police", "schools", "population"];
  if (annualModules.includes(moduleName)) return "Updated annually";
  if (moduleName === "elections") return "Updated after elections";
  return "Updated periodically";
}

// ── Public API ─────────────────────────────────────────────
/**
 * The configuration for a state, with the district's own values on top
 * when `districtSlug` is given (Pune is not Mumbai; Mandya is not
 * Bengaluru). Pages under /[state]/[district]/ should pass the district.
 */
export function getStateConfig(stateSlug: string, districtSlug?: string): StateConfig | null {
  const base = STATE_CONFIGS[stateSlug] ?? null;
  if (!base || !districtSlug) return base;
  const override = DISTRICT_OVERRIDES[`${stateSlug}/${districtSlug}`];
  return override ? { ...base, ...override } : base;
}

export function getStateConfigForDistrict(districtSlug: string, stateSlug: string): StateConfig | null {
  return getStateConfig(stateSlug, districtSlug);
}

export function getAllDataSources(stateSlug: string, districtSlug?: string): DataSourceEntry[] {
  const stateConfig = getStateConfig(stateSlug, districtSlug);
  const stateSources = stateConfig?.dataSources ?? [];
  return [...UNIVERSAL_DATA_SOURCES, ...stateSources];
}
