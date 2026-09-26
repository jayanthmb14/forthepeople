/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Canonical source registry for the India National Dashboard.
 *
 * Every numeric value rendered on /[locale]/india must cite a source
 * from this list. Adding a new source = adding one entry here so the
 * Data Sources Index (page section 14) can list it without duplication.
 *
 * Sources are limited to: .gov.in / .nic.in / NDSAP-published / accredited
 * institutional (e.g. NCAER, NPCI). See docs/india/32 §15 for the legal
 * escalation table — sensitive modules (Defence/Elections/Health/Justice/
 * Crime) must use ONLY the sources marked `domain: "ministry"`.
 */

export type SourceDomain =
  | "ministry" // .gov.in / .nic.in / pib.gov.in
  | "regulator" // RBI, ECI, TRAI, etc. (statutory bodies)
  | "research" // FSI, NCAER, IIPS, NCRB (govt research)
  | "ndsap" // data.gov.in OGD platform
  | "institutional"; // NPCI, IOA — quasi-public, accredited

export interface IndiaSource {
  /** Stable lookup key — referenced from IndiaModuleSource and scrapers. */
  key: string;
  /** Display name shown under every metric tile. */
  name: string;
  /** Canonical URL (the source's home page or a stable landing page). */
  url: string;
  /** Source classification — drives legal-escalation gating. */
  domain: SourceDomain;
  /** One-line description for the Data Sources Index. */
  blurb?: string;
}

export const INDIA_SOURCES: Record<string, IndiaSource> = {
  // ── Ministries / departments ────────────────────────────────
  MoSPI: {
    key: "MoSPI",
    name: "Ministry of Statistics and Programme Implementation",
    url: "https://www.mospi.gov.in/",
    domain: "ministry",
    blurb: "Central agency for official statistics — GDP, CPI, PLFS, ASUSE.",
  },
  MoF_BUDGET: {
    key: "MoF_BUDGET",
    name: "Union Budget · Ministry of Finance",
    url: "https://www.indiabudget.gov.in/",
    domain: "ministry",
    blurb: "Annual Union Budget documents and demands for grants.",
  },
  CGA: {
    key: "CGA",
    name: "Controller General of Accounts",
    url: "https://cga.nic.in/",
    domain: "ministry",
    blurb: "Monthly accounts of the Government of India.",
  },
  GST_COUNCIL: {
    key: "GST_COUNCIL",
    name: "GST Council",
    url: "https://gstcouncil.gov.in/",
    domain: "ministry",
    blurb: "Monthly GST collection bulletins and policy notifications.",
  },
  MHA: {
    key: "MHA",
    name: "Ministry of Home Affairs",
    url: "https://www.mha.gov.in/",
    domain: "ministry",
    blurb: "States, UTs, languages, internal security policy.",
  },
  CENSUS: {
    key: "CENSUS",
    name: "Census of India",
    url: "https://censusindia.gov.in/",
    domain: "ministry",
    blurb: "Decennial Census + Sample Registration System (SRS).",
  },
  LGD: {
    key: "LGD",
    name: "Local Government Directory",
    url: "https://lgdirectory.gov.in/",
    domain: "ministry",
    blurb: "Authoritative directory of states, districts, blocks, panchayats.",
  },
  DAFW: {
    key: "DAFW",
    name: "Department of Agriculture & Farmers Welfare",
    url: "https://agricoop.nic.in/",
    domain: "ministry",
    blurb: "Crop estimates, area/production/yield, MSP-related notifications.",
  },
  AGMARKNET: {
    key: "AGMARKNET",
    name: "AGMARKNET · Ministry of Agriculture",
    url: "https://agmarknet.gov.in/",
    domain: "ministry",
    blurb: "Daily mandi prices and APMC market metadata.",
  },
  PMKISAN: {
    key: "PMKISAN",
    name: "PM-KISAN · Department of Agriculture",
    url: "https://pmkisan.gov.in/",
    domain: "ministry",
    blurb: "Cumulative PM-KISAN beneficiary counts and disbursements.",
  },
  CACP: {
    key: "CACP",
    name: "Commission for Agricultural Costs & Prices",
    url: "https://cacp.dacnet.nic.in/",
    domain: "ministry",
    blurb: "Recommended MSP for 22 notified crops.",
  },
  FSI: {
    key: "FSI",
    name: "Forest Survey of India",
    url: "https://fsi.nic.in/",
    domain: "research",
    blurb: "India State of Forest Report — biennial forest cover assessment.",
  },
  NTCA: {
    key: "NTCA",
    name: "National Tiger Conservation Authority",
    url: "https://ntca.gov.in/",
    domain: "ministry",
    blurb: "Tiger reserves, conservation status, Status of Tigers report.",
  },
  PROJECT_TIGER: {
    key: "PROJECT_TIGER",
    name: "Project Tiger",
    url: "https://projecttiger.nic.in/",
    domain: "ministry",
    blurb: "Tiger-reserve management plans, protected-area extent in km².",
  },
  WII: {
    key: "WII",
    name: "Wildlife Institute of India",
    url: "https://wii.gov.in/",
    domain: "research",
    blurb: "National parks, sanctuaries, Ramsar sites database.",
  },
  MORTH: {
    key: "MORTH",
    name: "Ministry of Road Transport & Highways",
    url: "https://morth.nic.in/",
    domain: "ministry",
    blurb: "National highway length, ongoing project status, NHAI data.",
  },
  RAILWAYS: {
    key: "RAILWAYS",
    name: "Indian Railways",
    url: "https://indianrailways.gov.in/",
    domain: "ministry",
    blurb: "Annual statistics yearbook, network length, freight + passenger.",
  },
  DGCA: {
    key: "DGCA",
    name: "Directorate General of Civil Aviation",
    url: "https://dgca.gov.in/",
    domain: "regulator",
    blurb: "Monthly airport traffic, fleet, safety statistics.",
  },
  TRAI: {
    key: "TRAI",
    name: "Telecom Regulatory Authority of India",
    url: "https://trai.gov.in/",
    domain: "regulator",
    blurb: "Monthly Performance Indicators — subscribers, broadband.",
  },
  CEA: {
    key: "CEA",
    name: "Central Electricity Authority",
    url: "https://cea.nic.in/",
    domain: "ministry",
    blurb: "Installed capacity, generation, peak demand by state.",
  },
  MNRE: {
    key: "MNRE",
    name: "Ministry of New and Renewable Energy",
    url: "https://mnre.gov.in/",
    domain: "ministry",
    blurb: "Renewable energy capacity (solar, wind, bio, small hydro).",
  },
  MOHFW: {
    key: "MOHFW",
    name: "Ministry of Health & Family Welfare",
    url: "https://www.mohfw.gov.in/",
    domain: "ministry",
    blurb: "National Health Mission, NFHS, IDSP outbreaks.",
  },
  NHA_PMJAY: {
    key: "NHA_PMJAY",
    name: "PM-JAY · National Health Authority",
    url: "https://pmjay.gov.in/",
    domain: "ministry",
    blurb: "Ayushman Bharat cards, hospital empanelment, treatments.",
  },
  UWIN: {
    key: "UWIN",
    name: "U-WIN · Ministry of Health",
    url: "https://uwin.mohfw.gov.in/",
    domain: "ministry",
    blurb: "Universal immunisation registry — cumulative beneficiaries.",
  },
  RCHIIPS_NFHS: {
    key: "RCHIIPS_NFHS",
    name: "NFHS-5 · IIPS",
    url: "https://rchiips.org/nfhs/",
    domain: "research",
    blurb: "National Family Health Survey — anthropometrics, nutrition.",
  },
  UDISE: {
    key: "UDISE",
    name: "UDISE+ · Department of School Education",
    url: "https://udiseplus.gov.in/",
    domain: "ministry",
    blurb: "School enrolment, infrastructure, teachers — annual census.",
  },
  AISHE: {
    key: "AISHE",
    name: "AISHE · Department of Higher Education",
    url: "https://aishe.gov.in/",
    domain: "ministry",
    blurb: "All India Survey on Higher Education — students, institutions.",
  },
  UGC: {
    key: "UGC",
    name: "University Grants Commission",
    url: "https://www.ugc.gov.in/",
    domain: "regulator",
    blurb: "Recognised universities and institutions of national importance.",
  },
  AICTE: {
    key: "AICTE",
    name: "All India Council for Technical Education",
    url: "https://www.aicte-india.org/",
    domain: "regulator",
    blurb: "Approved technical institutions and intake.",
  },
  MOD: {
    key: "MOD",
    name: "Ministry of Defence",
    url: "https://www.mod.gov.in/",
    domain: "ministry",
    blurb: "Publicly disclosed defence figures only — NO operational data.",
  },
  PIB: {
    key: "PIB",
    name: "Press Information Bureau",
    url: "https://pib.gov.in/",
    domain: "ministry",
    blurb: "Official press releases tagged by ministry — defence exports etc.",
  },
  NJDG: {
    key: "NJDG",
    name: "National Judicial Data Grid",
    url: "https://njdg.ecourts.gov.in/",
    domain: "ministry",
    blurb: "Aggregate court pendency — district, high court, supreme court.",
  },
  NCRB: {
    key: "NCRB",
    name: "National Crime Records Bureau",
    url: "https://ncrb.gov.in/",
    domain: "research",
    blurb: "Crime in India annual statistics — published as scanned PDFs.",
  },
  BPRD: {
    key: "BPRD",
    name: "Bureau of Police Research & Development",
    url: "https://bprd.nic.in/",
    domain: "research",
    blurb: "Annual Data on Police Organisations (BPRD).",
  },
  ECI: {
    key: "ECI",
    name: "Election Commission of India",
    url: "https://eci.gov.in/",
    domain: "regulator",
    blurb: "Statutory body for all union and state elections.",
  },
  RAJYA_SABHA: {
    key: "RAJYA_SABHA",
    name: "Rajya Sabha",
    url: "https://rajyasabha.nic.in/",
    domain: "ministry",
    blurb: "Composition, members, vacancies of the Rajya Sabha.",
  },
  ISRO: {
    key: "ISRO",
    name: "Indian Space Research Organisation",
    url: "https://www.isro.gov.in/",
    domain: "ministry",
    blurb: "Space missions, launches, satellite catalogue.",
  },
  DST: {
    key: "DST",
    name: "Department of Science & Technology",
    url: "https://dst.gov.in/",
    domain: "ministry",
    blurb: "R&D statistics, GERD, scientific manpower.",
  },
  IPINDIA: {
    key: "IPINDIA",
    name: "Office of the Controller General of Patents",
    url: "https://ipindia.gov.in/",
    domain: "ministry",
    blurb: "Patents, trademarks, GI tags — registry and statistics.",
  },
  DPIIT: {
    key: "DPIIT",
    name: "Department for Promotion of Industry and Internal Trade",
    url: "https://dpiit.gov.in/",
    domain: "ministry",
    blurb: "Startup India recognised entities, FDI inflows, WPI.",
  },
  STARTUP_INDIA: {
    key: "STARTUP_INDIA",
    name: "Startup India · DPIIT",
    url: "https://www.startupindia.gov.in/",
    domain: "ministry",
    blurb: "Recognised startups by sector, state, year.",
  },
  COMMERCE: {
    key: "COMMERCE",
    name: "Ministry of Commerce & Industry",
    url: "https://commerce.gov.in/",
    domain: "ministry",
    blurb: "Foreign trade — monthly exports/imports quick estimates.",
  },
  DGFT: {
    key: "DGFT",
    name: "Directorate General of Foreign Trade",
    url: "https://www.dgft.gov.in/",
    domain: "ministry",
    blurb: "Trade policy, EXIM data, RoDTEP and incentive schemes.",
  },
  TOURISM: {
    key: "TOURISM",
    name: "Ministry of Tourism",
    url: "https://tourism.gov.in/",
    domain: "ministry",
    blurb: "Foreign tourist arrivals, foreign exchange earnings, monthly.",
  },
  ASI: {
    key: "ASI",
    name: "Archaeological Survey of India",
    url: "https://asi.nic.in/",
    domain: "ministry",
    blurb: "Centrally protected monuments and World Heritage Sites.",
  },
  // ── Regulators ─────────────────────────────────────────────
  RBI: {
    key: "RBI",
    name: "Reserve Bank of India",
    url: "https://www.rbi.org.in/",
    domain: "regulator",
    blurb: "Monetary policy, forex reserves, weekly statistical supplement.",
  },
  EAINDUSTRY_WPI: {
    key: "EAINDUSTRY_WPI",
    name: "Wholesale Price Index · DPIIT",
    url: "https://eaindustry.nic.in/",
    domain: "ministry",
    blurb: "Monthly WPI and per-commodity index.",
  },
  // ── Institutional / quasi-public ───────────────────────────
  NPCI: {
    key: "NPCI",
    name: "National Payments Corporation of India",
    url: "https://www.npci.org.in/",
    domain: "institutional",
    blurb: "UPI volume and value — monthly statistics.",
  },
  UIDAI: {
    key: "UIDAI",
    name: "Unique Identification Authority of India",
    url: "https://uidai.gov.in/",
    domain: "ministry",
    blurb: "Aadhaar enrolment, authentication transactions.",
  },
  IOA: {
    key: "IOA",
    name: "Indian Olympic Association",
    url: "https://olympic.ind.in/",
    domain: "institutional",
    blurb: "India's Olympic delegation, medal record.",
  },
  SAI: {
    key: "SAI",
    name: "Sports Authority of India",
    url: "https://sportsauthorityofindia.nic.in/",
    domain: "ministry",
    blurb: "National sports development programmes and athlete pipeline.",
  },
  SOI: {
    key: "SOI",
    name: "Surveyor General of India",
    url: "https://surveyofindia.gov.in/",
    domain: "ministry",
    blurb: "Geographic area and territorial measurement.",
  },
  CONSTITUTION: {
    key: "CONSTITUTION",
    name: "Constitution of India",
    url: "https://legislative.gov.in/constitution-of-india/",
    domain: "ministry",
    blurb: "8th Schedule, Article 1 — constitutional constants.",
  },
};

export type IndiaSourceKey = keyof typeof INDIA_SOURCES;

export function getSource(key: string): IndiaSource | undefined {
  return INDIA_SOURCES[key as IndiaSourceKey];
}

/** Sorted alphabetically by name — for the Data Sources Index section. */
export function getAllSources(): IndiaSource[] {
  return Object.values(INDIA_SOURCES).sort((a, b) => a.name.localeCompare(b.name));
}
