/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The /[locale]/india page is driven by this registry.
 * Adding a new module = adding one entry here. The page loops through
 * INDIA_MODULES and renders one band per `live` module + a Coming Soon
 * Rail for the rest. See docs/india/31 §7-§8 + docs/india/32 §4.
 *
 * IMPORTANT: do NOT add hardcoded numeric values here. The registry
 * declares structure (slug, sources, refresh tier, scraperKeys); actual
 * values come from IndiaIndicator (DB) populated by scrapers under
 * src/scraper/india/.
 *
 * Initial-status policy (Phase 0):
 *   - "live"          → at least one scraper exists or is about to exist,
 *                       and the upstream source is reachable via plain
 *                       HTTP + pdf-parse (no JS rendering required).
 *   - "coming_soon"   → either (a) the source requires JS rendering / OCR
 *                       and needs an Apify rag-web-browser fallback before
 *                       it can go live (Phase 8), or (b) the scraper hasn't
 *                       been written yet.
 *
 * Per the audit's Correction 3, these slugs were demoted from `live`
 * (file 31 §8 default) to `coming_soon` because the upstream is JS-heavy
 * or scanned-PDF and would 404 on first scraper run:
 *   - elections-loksabha, elections-rajyasabha, elections-turnout (eci.gov.in JS + bot blocking)
 *   - justice-pendency (njdg.ecourts.gov.in Tableau dashboard)
 *   - justice-crime (NCRB Crime in India released as scanned PDFs → OCR pipeline)
 *   - health-pmjay (Tableau-style dashboard)
 *   - education-schools (UDISE+ Tableau, partial login walls)
 *   - science-isro (JS-heavy mission listing; PIB feed is the proven backup)
 */

export type IndiaModuleCategory =
  | "snapshot"
  | "demographics"
  | "economy"
  | "budget"
  | "agriculture"
  | "livestock"
  | "wildlife"
  | "infrastructure"
  | "energy"
  | "health"
  | "education"
  | "defence"
  | "justice"
  | "elections"
  | "science"
  | "trade"
  | "tourism"
  | "sports"
  | "custom";

export type IndiaModuleStatus = "live" | "beta" | "coming_soon" | "planned";

export interface IndiaModuleSource {
  /** Lookup key into INDIA_SOURCES (src/lib/india/india-sources.ts). */
  sourceKey: string;
  /** How the scraper interacts with this source. */
  type: "API" | "Static" | "Collected" | "RSS" | "Institutional";
  /** Display-only label for the refresh cadence (matches the scraper tier). */
  refresh:
    | "Daily"
    | "Weekly"
    | "Monthly"
    | "Quarterly"
    | "Annual"
    | "Event-driven"
    | "Manual";
}

export interface IndiaModuleDef {
  /** URL-safe slug; also the moduleSlug stored in IndiaIndicator. */
  slug: string;
  category: IndiaModuleCategory;
  title: string;
  /** Emoji or lucide icon name; rendered in the section header. */
  icon: string;
  /** One-line description shown under the section title. */
  tagline: string;
  /** Longer description for the Coming Soon card and module deep-link page. */
  description: string;
  status: IndiaModuleStatus;
  /** Top-to-bottom order on /[locale]/india. Lower = higher on the page. */
  displayOrder: number;
  /** Sources cited under every metric in this module. */
  sources: IndiaModuleSource[];
  /** Component file under src/components/india/modules/<componentName>.tsx. */
  componentName: string;
  /** Inline italic disclaimer for sensitive sections (Defence, Health, etc.). */
  legalNote?: string;
  /** Renders the IndiaStateLeaderboard widget inside the band. */
  hasStateBreakdown?: boolean;
  /** Renders the IndiaTimeSeriesChart widget inside the band. */
  hasTimeSeries?: boolean;
  /**
   * Scraper keys (from src/scraper/india/_registry.ts, Phase 5) that
   * populate this module. One module can be fed by multiple scrapers.
   */
  scraperKeys: string[];

  /** Optional. NewsItem search keywords. Falls back to [title, category]. */
  newsKeywords?: string[];
  /** Optional. metricKey driving the choropleth on the deep-dive page. */
  primaryMetric?: string;
  /** Optional. Explicit related-module slugs. Falls back to other modules in same category. */
  relatedModules?: string[];
  /** Optional. Sub-features queued for this module's deep-dive page. */
  comingSoonFeatures?: string[];
  /** Optional. IndiaAnalysis.moduleSlug FK for the AI summary card. Defaults to slug. */
  aiAnalysisSlug?: string;
  /**
   * The headline KPI shown in the module hero. Without this, ModuleHero
   * falls back to the first metric in the module's category — which is
   * how the tigers page ended up showing "Forest Cover" instead of tiger
   * population. mockValue is a placeholder until real data lands.
   */
  headlineMetric?: {
    key: string;
    label: string;
    unit: string;
    mockValue: number;
    mockUnit: string;
  };
  /**
   * True if hand-crafted realistic per-state values exist for this
   * module's leaderboard + choropleth. When false, the deep-dive page
   * shows a "State-by-state view: Coming Soon" card instead.
   */
  hasStateBreakdownData?: boolean;
  /**
   * Future per-module photograph for the hero (Wikimedia CC, PIB-released,
   * etc.). When set, ModuleHero renders the photo instead of the Lucide
   * icon. Add by editing the registry — no code change needed.
   */
  heroImage?: { url: string; alt: string; credit: string; license: string };

  // ── Phase 3A additions (file 44) ───────────────────────────
  /** Slug of the IndiaSuperCategoryDef this module belongs to. */
  superCategory: string;
  /** 'data' = scraped/numeric module; 'editorial' = NCERT-aligned explainer. */
  contentType: "data" | "editorial";
  /** Optional sub-group label within a super-category (ALL CAPS), e.g. 'JUSTICE'. */
  subGroup?: string;

  /**
   * Optional 2x2 mini data grid shown on the featured-module card in the
   * super-category band (file 48 §4.7.6). Replaces the legacy sparkline.
   * Up to 4 entries; modules without this field render the description only.
   */
  featuredCardDataGrid?: ReadonlyArray<{ label: string; value: string }>;
}

export const INDIA_MODULES: IndiaModuleDef[] = [
  // ── Snapshot & Demographics ────────────────────────────────
  {
    slug: "national-snapshot",
    category: "snapshot",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "National Snapshot",
    icon: "🇮🇳",
    tagline: "States, UTs, languages, geographic area at a glance.",
    description:
      "Constitutional and near-static reference values about the Republic of India.",
    status: "live",
    displayOrder: 7,
    sources: [
      { sourceKey: "MHA", type: "Static", refresh: "Annual" },
      { sourceKey: "CONSTITUTION", type: "Static", refresh: "Annual" },
      { sourceKey: "SOI", type: "Static", refresh: "Annual" },
      { sourceKey: "LGD", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "NationalSnapshotModule",
    scraperKeys: ["mha-states-uts", "lgd-districts-count"],
    // MOCK — Constitutionally-fixed: 28 states + 8 UTs.
    headlineMetric: { key: "states_uts_total", label: "States & UTs", unit: "count", mockValue: 36, mockUnit: "" },
  },
  {
    slug: "demographics-population",
    category: "demographics",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "Population & Demographics",
    icon: "👥",
    tagline: "Population, fertility, life expectancy from SRS and Census.",
    description:
      "Annual SRS bulletin and decennial Census aggregates. SRS releases CBR, " +
      "CDR, IMR, life expectancy each year; Census provides full age-sex pyramid.",
    status: "live",
    displayOrder: 4,
    sources: [
      { sourceKey: "CENSUS", type: "Collected", refresh: "Annual" },
      { sourceKey: "MoSPI", type: "Collected", refresh: "Annual" },
    ],
    componentName: "DemographicsModule",
    hasTimeSeries: true,
    scraperKeys: ["srs-population"],
    // MOCK — round number near current UN/SRS estimate (~1.44 bn).
    headlineMetric: { key: "population_total", label: "Population", unit: "cr", mockValue: 144, mockUnit: "cr" },
    hasStateBreakdownData: true,
  },

  // ── Economy ────────────────────────────────────────────────
  {
    slug: "economy-gdp",
    category: "economy",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "Economy & GDP",
    icon: "📈",
    tagline: "Quarterly GDP, GVA, sectoral growth from MoSPI.",
    description:
      "Real and nominal GDP, GVA by sector, Q-on-Q and Y-on-Y growth — released " +
      "end-Feb / end-May / end-Aug / end-Nov per MoSPI press notes.",
    status: "live",
    displayOrder: 1,
    sources: [
      { sourceKey: "MoSPI", type: "Collected", refresh: "Quarterly" },
      { sourceKey: "RBI", type: "Collected", refresh: "Quarterly" },
    ],
    componentName: "EconomyGdpModule",
    hasTimeSeries: true,
    scraperKeys: ["mospi-gdp"],
    // MOCK — order-of-magnitude India nominal GDP (~₹295 lakh crore range).
    headlineMetric: { key: "gdp_nominal_inr", label: "Nominal GDP", unit: "₹ lakh cr", mockValue: 295, mockUnit: "₹ lakh cr" },
    featuredCardDataGrid: [
      { label: 'Top sector', value: 'Services · 53%' },
      { label: 'Growth', value: '7.4% YoY' },
      { label: 'Per capita', value: '₹2.4 lakh' },
      { label: 'Source', value: 'MoSPI · Q3 FY26' },
    ],

  },
  {
    slug: "economy-inflation",
    category: "economy",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "Inflation & Prices",
    icon: "🛒",
    tagline: "CPI and WPI — monthly inflation from MoSPI and DPIIT.",
    description:
      "CPI (combined / rural / urban) on the 12th and WPI on the 14th. " +
      "Year-on-year change is the headline metric; series goes back decades.",
    status: "live",
    displayOrder: 2,
    sources: [
      { sourceKey: "MoSPI", type: "Collected", refresh: "Monthly" },
      { sourceKey: "EAINDUSTRY_WPI", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "EconomyInflationModule",
    hasTimeSeries: true,
    scraperKeys: ["mospi-cpi", "dpiit-wpi"],
    // MOCK — recent CPI YoY range placeholder.
    headlineMetric: { key: "cpi_inflation", label: "CPI Inflation (YoY)", unit: "%", mockValue: 5.0, mockUnit: "%" },
  },
  {
    slug: "economy-employment",
    category: "economy",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "Employment (PLFS)",
    icon: "💼",
    tagline: "Labour force participation, unemployment from MoSPI PLFS.",
    description:
      "Periodic Labour Force Survey monthly bulletin — LFPR, WPR, " +
      "unemployment rate by Current Weekly Status (CWS).",
    status: "live",
    displayOrder: 3,
    sources: [{ sourceKey: "MoSPI", type: "Collected", refresh: "Monthly" }],
    componentName: "EconomyEmploymentModule",
    hasTimeSeries: true,
    scraperKeys: ["mospi-plfs"],
    // MOCK — PLFS unemployment rate placeholder.
    headlineMetric: { key: "unemployment_rate", label: "Unemployment Rate", unit: "%", mockValue: 4.0, mockUnit: "%" },
    hasStateBreakdownData: true,
  },

  // ── Budget ────────────────────────────────────────────────
  {
    slug: "budget-union",
    category: "budget",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "Union Budget",
    icon: "🏛️",
    tagline: "Annual Union Budget allocations, monthly CGA actuals.",
    description:
      "Total expenditure, revenue/capital split, top 10 ministries by " +
      "allocation. CGA Monthly Account tracks actual receipts vs estimates.",
    status: "live",
    displayOrder: 5,
    sources: [
      { sourceKey: "MoF_BUDGET", type: "Collected", refresh: "Annual" },
      { sourceKey: "CGA", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "BudgetUnionModule",
    scraperKeys: ["indiabudget-allocations", "cga-monthly-accounts"],
    // MOCK — Union Budget total outlay placeholder (~₹48 lakh cr range).
    headlineMetric: { key: "union_budget_outlay", label: "Total Outlay", unit: "₹ lakh cr", mockValue: 48, mockUnit: "₹ lakh cr" },
  },
  {
    slug: "budget-gst",
    category: "budget",
    superCategory: "macro-snapshot",
    contentType: "data",
    title: "GST Collections",
    icon: "🧾",
    tagline: "Monthly Gross GST collection, CGST/SGST/IGST split.",
    description:
      "Gross GST mop-up (CGST + SGST + IGST + Cess) released by GST Council " +
      "/ Ministry of Finance on the 1st of each month.",
    status: "live",
    displayOrder: 6,
    sources: [{ sourceKey: "GST_COUNCIL", type: "Collected", refresh: "Monthly" }],
    componentName: "BudgetGstModule",
    hasTimeSeries: true,
    hasStateBreakdown: true,
    scraperKeys: ["gst-collections"],
    // MOCK — typical monthly gross GST collection (~₹1.7 lakh cr range).
    headlineMetric: { key: "gst_monthly_collection", label: "Monthly GST Collection", unit: "₹ lakh cr", mockValue: 1.7, mockUnit: "₹ lakh cr" },
  },

  // ── Agriculture ───────────────────────────────────────────
  {
    slug: "agriculture-production",
    category: "agriculture",
    superCategory: "agriculture-livestock",
    contentType: "data",
    subGroup: "AGRICULTURE",
    title: "Crop Production",
    icon: "🌾",
    tagline: "Crop estimates, mandi count, AGMARKNET coverage.",
    description:
      "DA&FW Advance Estimates of crop production (1st/2nd/3rd/4th) " +
      "released quarterly. Mandi count tracked monthly via AGMARKNET.",
    status: "live",
    displayOrder: 1,
    sources: [
      { sourceKey: "DAFW", type: "Collected", refresh: "Quarterly" },
      { sourceKey: "AGMARKNET", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "AgricultureProductionModule",
    scraperKeys: ["dafw-crop-estimates", "agmarknet-mandi-count"],
    // MOCK — annual foodgrain production placeholder (~330 million tonnes range).
    headlineMetric: { key: "foodgrain_production", label: "Foodgrain Production", unit: "MT", mockValue: 330, mockUnit: "million tonnes" },
    hasStateBreakdownData: true,
    featuredCardDataGrid: [
      { label: 'Rice', value: '130 MT' },
      { label: 'Wheat', value: '110 MT' },
      { label: 'Top state', value: 'UP' },
      { label: 'Source', value: 'DA&FW · 2024' },
    ],

  },
  {
    slug: "agriculture-plantation",
    category: "agriculture",
    superCategory: "agriculture-livestock",
    contentType: "data",
    subGroup: "AGRICULTURE",
    title: "Plantation Crops",
    icon: "🍃",
    tagline: "Tea, coffee, rubber, spices — production and exports.",
    description:
      "Commodity board data for India's plantation sector. Each board (Tea/" +
      "Coffee/Rubber/Spices) publishes its own annual statistics report.",
    status: "coming_soon",
    displayOrder: 3,
    sources: [{ sourceKey: "DAFW", type: "Collected", refresh: "Annual" }],
    componentName: "AgriculturePlantationModule",
    scraperKeys: [],
    // MOCK — annual tea production placeholder.
    headlineMetric: { key: "tea_production", label: "Tea Production", unit: "mn kg", mockValue: 1400, mockUnit: "million kg" },
  },
  {
    slug: "agriculture-pmkisan",
    category: "agriculture",
    superCategory: "agriculture-livestock",
    contentType: "data",
    subGroup: "AGRICULTURE",
    title: "PM-KISAN",
    icon: "💰",
    tagline: "Cumulative beneficiaries and disbursements.",
    description:
      "Direct income support to small and marginal farmers. PM-KISAN portal " +
      "publishes cumulative beneficiary and instalment counts.",
    status: "live",
    displayOrder: 2,
    sources: [{ sourceKey: "PMKISAN", type: "Collected", refresh: "Monthly" }],
    componentName: "AgriculturePmKisanModule",
    hasTimeSeries: true,
    scraperKeys: ["pmkisan-beneficiaries"],
    // MOCK — cumulative PM-KISAN beneficiary count placeholder (~11 cr).
    headlineMetric: { key: "pmkisan_beneficiaries", label: "PM-KISAN Beneficiaries", unit: "cr", mockValue: 11, mockUnit: "cr" },
  },

  // ── Livestock ─────────────────────────────────────────────
  {
    slug: "livestock-census",
    category: "livestock",
    superCategory: "agriculture-livestock",
    contentType: "data",
    subGroup: "LIVESTOCK",
    title: "Livestock & Dairy",
    icon: "🐄",
    tagline: "Livestock Census + NDDB milk production.",
    description:
      "Quinquennial Livestock Census and annual NDDB dairy data — milk " +
      "production by state, breed registry, cooperative reach.",
    status: "coming_soon",
    displayOrder: 4,
    sources: [{ sourceKey: "DAFW", type: "Collected", refresh: "Annual" }],
    componentName: "LivestockCensusModule",
    scraperKeys: [],
    // MOCK — total livestock from 20th Livestock Census order-of-magnitude.
    headlineMetric: { key: "livestock_total", label: "Total Livestock", unit: "mn", mockValue: 535, mockUnit: "million" },
  },
  {
    slug: "livestock-fisheries",
    category: "livestock",
    superCategory: "agriculture-livestock",
    contentType: "data",
    subGroup: "LIVESTOCK",
    title: "Fisheries",
    icon: "🐟",
    tagline: "Inland and marine fish production, exports.",
    description:
      "Department of Fisheries annual data — production by state, exports, " +
      "PMMSY beneficiaries.",
    status: "coming_soon",
    displayOrder: 5,
    sources: [{ sourceKey: "DAFW", type: "Collected", refresh: "Annual" }],
    componentName: "LivestockFisheriesModule",
    scraperKeys: [],
    // MOCK — annual fish production placeholder (~175 lakh tonnes range).
    headlineMetric: { key: "fish_production", label: "Total Fish Production", unit: "lakh tonnes", mockValue: 175, mockUnit: "lakh tonnes" },
  },

  // ── Wildlife ──────────────────────────────────────────────
  {
    slug: "wildlife-forests",
    category: "wildlife",
    superCategory: "wildlife-forests",
    contentType: "data",
    title: "Forests & Wildlife",
    icon: "🌳",
    tagline: "Forest cover from FSI's biennial India State of Forest Report.",
    description:
      "Total forest cover, tree cover, very dense / moderately dense / open " +
      "forest split — sourced from FSI's ISFR.",
    status: "live",
    displayOrder: 1,
    sources: [{ sourceKey: "FSI", type: "Collected", refresh: "Annual" }],
    componentName: "WildlifeForestsModule",
    hasStateBreakdown: true,
    scraperKeys: ["fsi-forest-cover"],
    // MOCK — total forest cover share of geographic area (ISFR ~21.7%).
    headlineMetric: { key: "forest_cover_pct", label: "Forest Cover", unit: "%", mockValue: 21.7, mockUnit: "%" },
    hasStateBreakdownData: true,
    featuredCardDataGrid: [
      { label: 'Forest cover', value: '21.7%' },
      { label: 'Top state', value: 'MP · 26.6%' },
      { label: 'Tree cover', value: '2.91%' },
      { label: 'Source', value: 'FSI ISFR 2023' },
    ],

  },
  {
    slug: "wildlife-tigers",
    category: "wildlife",
    superCategory: "wildlife-forests",
    contentType: "data",
    title: "Tiger Conservation",
    icon: "🐅",
    tagline: "Tiger reserves, population estimates from NTCA.",
    description:
      "Tiger population estimates (Status of Tigers, every 4 years), " +
      "tiger reserves, conservation funding via NTCA.",
    status: "live",
    displayOrder: 2,
    sources: [
      { sourceKey: "NTCA", type: "Institutional", refresh: "Annual" },
      { sourceKey: "PROJECT_TIGER", type: "Institutional", refresh: "Annual" },
      { sourceKey: "WII", type: "Institutional", refresh: "Annual" },
      { sourceKey: "FSI", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "WildlifeTigersModule",
    scraperKeys: ["ntca-tigers"],
    headlineMetric: { key: "tiger_population", label: "Tiger Population", unit: "individuals", mockValue: 3682, mockUnit: "individuals" },
    hasStateBreakdownData: true,
  },
  {
    slug: "wildlife-protected-areas",
    category: "wildlife",
    superCategory: "wildlife-forests",
    contentType: "data",
    title: "National Parks & Sanctuaries",
    icon: "🦁",
    tagline: "Protected area network — NPs, sanctuaries, Ramsar sites.",
    description:
      "Wildlife Institute of India database of all protected areas, plus " +
      "Ramsar wetland designations and biosphere reserves.",
    status: "live",
    displayOrder: 3,
    sources: [{ sourceKey: "WII", type: "Collected", refresh: "Quarterly" }],
    componentName: "WildlifeProtectedAreasModule",
    scraperKeys: ["wii-protected-areas"],
    // MOCK — WII PA network total order-of-magnitude (~1,000+).
    headlineMetric: { key: "protected_areas_count", label: "Protected Areas", unit: "count", mockValue: 1000, mockUnit: "" },
  },

  // ── Infrastructure ────────────────────────────────────────
  {
    slug: "infra-roads",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "TRANSPORT",
    title: "Roads & Highways",
    icon: "🛣️",
    tagline: "National highway length, NHAI projects.",
    description:
      "MoRTH quarterly status — total NH km, ongoing project count and " +
      "value, expressways under construction.",
    status: "live",
    displayOrder: 1,
    sources: [{ sourceKey: "MORTH", type: "Collected", refresh: "Quarterly" }],
    componentName: "InfraRoadsModule",
    scraperKeys: ["morth-highways"],
    // MOCK — National Highway length placeholder (~146,000 km).
    headlineMetric: { key: "national_highway_km", label: "National Highway Length", unit: "km", mockValue: 146000, mockUnit: "km" },
    hasStateBreakdownData: true,
    featuredCardDataGrid: [
      { label: 'NH length', value: '146,145 km' },
      { label: 'Top state', value: 'Maharashtra' },
      { label: 'FY25 added', value: '12,349 km' },
      { label: 'Source', value: 'MoRTH' },
    ],

  },
  {
    slug: "infra-railways",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "TRANSPORT",
    title: "Railways",
    icon: "🚆",
    tagline: "Network length, passenger and freight from Indian Railways.",
    description:
      "Annual yearbook from Indian Railways — track km, electrification, " +
      "passenger originating, freight originating tonnes.",
    status: "live",
    displayOrder: 2,
    sources: [{ sourceKey: "RAILWAYS", type: "Collected", refresh: "Annual" }],
    componentName: "InfraRailwaysModule",
    scraperKeys: ["railways-yearbook"],
    // MOCK — Indian Railways route + track km order-of-magnitude.
    headlineMetric: { key: "rail_route_km", label: "Route Length", unit: "km", mockValue: 68000, mockUnit: "km" },
  },
  {
    slug: "infra-aviation",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "TRANSPORT",
    title: "Aviation",
    icon: "✈️",
    tagline: "DGCA monthly traffic, fleet, airports.",
    description:
      "DGCA Monthly Performance Report — passenger traffic by airport, " +
      "domestic vs international, fleet size by carrier.",
    status: "live",
    displayOrder: 3,
    sources: [{ sourceKey: "DGCA", type: "Collected", refresh: "Monthly" }],
    componentName: "InfraAviationModule",
    hasStateBreakdown: true,
    scraperKeys: ["dgca-aviation"],
    // MOCK — annual domestic + international air passengers placeholder.
    headlineMetric: { key: "aviation_passengers", label: "Annual Air Passengers", unit: "mn", mockValue: 376, mockUnit: "million" },
  },
  {
    slug: "infra-ports",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "TRANSPORT",
    title: "Ports & Shipping",
    icon: "🚢",
    tagline: "Major and non-major port traffic.",
    description:
      "Indian Ports Association data on cargo throughput, container traffic, " +
      "vessel calls at the 12 major ports plus state-handled non-major ports.",
    status: "coming_soon",
    displayOrder: 7,
    sources: [{ sourceKey: "MORTH", type: "Collected", refresh: "Monthly" }],
    componentName: "InfraPortsModule",
    scraperKeys: [],
    // MOCK — total port cargo throughput order-of-magnitude.
    headlineMetric: { key: "ports_cargo_mt", label: "Annual Cargo Throughput", unit: "mn tonnes", mockValue: 800, mockUnit: "million tonnes" },
  },
  {
    slug: "infra-telecom",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "DIGITAL",
    title: "Telecom & Internet",
    icon: "📡",
    tagline: "TRAI subscribers, broadband penetration.",
    description:
      "TRAI Performance Indicators Report — total wireless and wireline " +
      "subscribers, urban/rural split, broadband and FTTH penetration.",
    status: "live",
    displayOrder: 4,
    sources: [{ sourceKey: "TRAI", type: "Collected", refresh: "Monthly" }],
    componentName: "InfraTelecomModule",
    hasStateBreakdown: true,
    scraperKeys: ["trai-telecom"],
    // MOCK — total wireless subscribers placeholder (~115 cr range).
    headlineMetric: { key: "telecom_wireless_subscribers", label: "Wireless Subscribers", unit: "cr", mockValue: 115, mockUnit: "cr" },
  },
  {
    slug: "infra-smart-cities",
    category: "infrastructure",
    superCategory: "infrastructure",
    contentType: "data",
    subGroup: "URBAN",
    title: "Smart Cities Mission",
    icon: "🏙️",
    tagline: "Project completion, fund utilisation across 100 cities.",
    description:
      "Smart Cities Mission dashboard — projects sanctioned, completed, " +
      "under implementation, funds released vs utilised.",
    status: "coming_soon",
    displayOrder: 8,
    sources: [{ sourceKey: "MORTH", type: "Collected", refresh: "Monthly" }],
    componentName: "InfraSmartCitiesModule",
    scraperKeys: [],
    // MOCK — SCM cohort size is fixed at 100 cities.
    headlineMetric: { key: "smart_cities_count", label: "Smart Cities", unit: "count", mockValue: 100, mockUnit: "" },
  },

  // ── Energy ────────────────────────────────────────────────
  {
    slug: "energy-power",
    category: "energy",
    superCategory: "natural-resources-energy",
    contentType: "data",
    subGroup: "POWER",
    title: "Power Generation",
    icon: "⚡",
    tagline: "CEA installed capacity, generation by source.",
    description:
      "CEA Monthly Executive Summary — total installed capacity, monthly " +
      "generation by thermal/hydro/nuclear/RE, peak demand.",
    status: "live",
    displayOrder: 5,
    sources: [{ sourceKey: "CEA", type: "Collected", refresh: "Monthly" }],
    componentName: "EnergyPowerModule",
    hasStateBreakdown: true,
    hasTimeSeries: true,
    scraperKeys: ["cea-power-monthly"],
    // MOCK — total installed capacity order-of-magnitude (CEA ~440 GW).
    headlineMetric: { key: "power_installed_gw", label: "Installed Capacity", unit: "GW", mockValue: 440, mockUnit: "GW" },
  },
  {
    slug: "energy-renewables",
    category: "energy",
    superCategory: "natural-resources-energy",
    contentType: "data",
    subGroup: "POWER",
    title: "Renewable Energy",
    icon: "☀️",
    tagline: "Installed RE capacity by segment from MNRE.",
    description:
      "MNRE monthly bulletin — solar (utility + rooftop), wind, biomass, " +
      "small hydro, total non-hydro RE installed capacity.",
    status: "live",
    displayOrder: 6,
    sources: [{ sourceKey: "MNRE", type: "Collected", refresh: "Monthly" }],
    componentName: "EnergyRenewablesModule",
    hasStateBreakdown: true,
    hasTimeSeries: true,
    scraperKeys: ["mnre-renewable"],
    // MOCK — non-fossil installed capacity order-of-magnitude (~190 GW).
    headlineMetric: { key: "renewable_installed_gw", label: "Renewable Capacity", unit: "GW", mockValue: 190, mockUnit: "GW" },
  },
  {
    slug: "energy-fuels",
    category: "energy",
    superCategory: "natural-resources-energy",
    contentType: "data",
    title: "Petroleum & Fuels",
    icon: "🛢️",
    tagline: "Crude import, product consumption, retail prices.",
    description:
      "PPAC monthly snapshot — crude imports, refinery throughput, " +
      "petrol/diesel/LPG consumption, retail price ranges.",
    status: "coming_soon",
    displayOrder: 1,
    sources: [{ sourceKey: "MNRE", type: "Collected", refresh: "Monthly" }],
    componentName: "EnergyFuelsModule",
    scraperKeys: [],
    // MOCK — annual crude imports order-of-magnitude.
    headlineMetric: { key: "crude_imports_mt", label: "Annual Crude Imports", unit: "mn tonnes", mockValue: 232, mockUnit: "million tonnes" },
    featuredCardDataGrid: [
      { label: 'Crude imports', value: '232 MT' },
      { label: 'Refining cap.', value: '256 MT' },
      { label: 'Top supplier', value: 'Russia' },
      { label: 'Source', value: 'PPAC · FY25' },
    ],

  },
  {
    slug: "energy-coal",
    category: "energy",
    superCategory: "natural-resources-energy",
    contentType: "data",
    title: "Coal",
    icon: "⚫",
    tagline: "Coal production, despatch, stock at thermal plants.",
    description:
      "Ministry of Coal monthly data — domestic production, imports, " +
      "despatch to power sector, stock at coal-based power plants.",
    status: "coming_soon",
    displayOrder: 2,
    sources: [{ sourceKey: "CEA", type: "Collected", refresh: "Monthly" }],
    componentName: "EnergyCoalModule",
    scraperKeys: [],
    // MOCK — annual coal production order-of-magnitude.
    headlineMetric: { key: "coal_production_mt", label: "Annual Coal Production", unit: "mn tonnes", mockValue: 990, mockUnit: "million tonnes" },
  },

  // ── Health ────────────────────────────────────────────────
  {
    slug: "health-overview",
    category: "health",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "HEALTH",
    title: "Health Indicators",
    icon: "🏥",
    tagline: "Headline NFHS-5 indicators and NHM coverage.",
    description:
      "NFHS-5 anthropometrics, child mortality, immunisation coverage. " +
      "Aggregate national values — state breakdowns inside.",
    status: "live",
    displayOrder: 1,
    sources: [
      { sourceKey: "MOHFW", type: "Collected", refresh: "Annual" },
      { sourceKey: "RCHIIPS_NFHS", type: "Collected", refresh: "Annual" },
    ],
    componentName: "HealthOverviewModule",
    legalNote: "health",
    hasStateBreakdown: true,
    scraperKeys: ["nfhs5-indicators"],
    // MOCK — NFHS-5 IMR national headline placeholder (~35 per 1k).
    headlineMetric: { key: "infant_mortality", label: "Infant Mortality Rate", unit: "per 1k", mockValue: 35, mockUnit: "per 1,000 live births" },
    hasStateBreakdownData: true,
    featuredCardDataGrid: [
      { label: 'Life expectancy', value: '70.8 yrs' },
      { label: 'IMR', value: '28 per 1k' },
      { label: 'Doctors / 1k', value: '0.74' },
      { label: 'Source', value: 'NFHS-5 / SRS' },
    ],

  },
  {
    slug: "health-pmjay",
    category: "health",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "HEALTH",
    title: "Ayushman Bharat (PM-JAY)",
    icon: "🩺",
    tagline: "Cards issued, hospitals empanelled, treatments authorised.",
    description:
      "NHA monthly dashboard — total Ayushman cards issued, empanelled " +
      "hospitals, hospitalisation events authorised.",
    status: "coming_soon",
    displayOrder: 2,
    sources: [{ sourceKey: "NHA_PMJAY", type: "Collected", refresh: "Monthly" }],
    componentName: "HealthPmJayModule",
    legalNote: "health",
    scraperKeys: [],
    // MOCK — cumulative Ayushman card issuance order-of-magnitude.
    headlineMetric: { key: "pmjay_cards", label: "Ayushman Cards Issued", unit: "cr", mockValue: 36, mockUnit: "cr" },
  },
  {
    slug: "health-immunisation",
    category: "health",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "HEALTH",
    title: "Vaccination & U-WIN",
    icon: "💉",
    tagline: "Cumulative U-WIN beneficiary registrations.",
    description:
      "Universal immunisation registry numbers — cumulative beneficiaries, " +
      "doses administered, antigen-wise coverage.",
    status: "live",
    displayOrder: 3,
    sources: [{ sourceKey: "UWIN", type: "Collected", refresh: "Monthly" }],
    componentName: "HealthImmunisationModule",
    legalNote: "health",
    scraperKeys: ["uwin-immunisation"],
    // MOCK — cumulative U-WIN beneficiary registrations order-of-magnitude.
    headlineMetric: { key: "uwin_beneficiaries", label: "U-WIN Beneficiaries", unit: "cr", mockValue: 26, mockUnit: "cr" },
  },

  // ── Education ─────────────────────────────────────────────
  {
    slug: "education-schools",
    category: "education",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "EDUCATION",
    title: "Schools (UDISE+)",
    icon: "🏫",
    tagline: "School count, enrolment, infrastructure from UDISE+.",
    description:
      "Annual UDISE+ census — total schools, enrolment by stage, " +
      "infrastructure (toilets, electricity, computers), teacher count.",
    status: "coming_soon",
    displayOrder: 4,
    sources: [{ sourceKey: "UDISE", type: "Collected", refresh: "Annual" }],
    componentName: "EducationSchoolsModule",
    hasStateBreakdown: true,
    scraperKeys: [],
    // MOCK — UDISE+ total schools order-of-magnitude (~14.9 lakh).
    headlineMetric: { key: "schools_total", label: "Total Schools", unit: "lakh", mockValue: 14.9, mockUnit: "lakh" },
    hasStateBreakdownData: true,
  },
  {
    slug: "education-higher",
    category: "education",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "EDUCATION",
    title: "Higher Education",
    icon: "🎓",
    tagline: "AISHE annual aggregates — students, institutions, GER.",
    description:
      "All India Survey on Higher Education — enrolment, GER by gender " +
      "and category, recognised universities and colleges.",
    status: "live",
    displayOrder: 5,
    sources: [
      { sourceKey: "AISHE", type: "Collected", refresh: "Annual" },
      { sourceKey: "UGC", type: "Collected", refresh: "Annual" },
      { sourceKey: "AICTE", type: "Collected", refresh: "Annual" },
    ],
    componentName: "EducationHigherModule",
    scraperKeys: ["aishe-higher"],
    // MOCK — AISHE total higher-ed enrolment order-of-magnitude (~4.3 cr).
    headlineMetric: { key: "higher_ed_enrolment", label: "Higher-Ed Enrolment", unit: "cr", mockValue: 4.3, mockUnit: "cr" },
  },
  {
    slug: "education-skills",
    category: "education",
    superCategory: "living-standards",
    contentType: "data",
    subGroup: "EDUCATION",
    title: "Skill India",
    icon: "🛠️",
    tagline: "PMKVY beneficiaries, ITI seats, NCVET certifications.",
    description:
      "Ministry of Skill Development data — PMKVY trained and placed, " +
      "ITI seats and admissions, NSDC scheme coverage.",
    status: "coming_soon",
    displayOrder: 6,
    sources: [{ sourceKey: "AICTE", type: "Collected", refresh: "Annual" }],
    componentName: "EducationSkillsModule",
    scraperKeys: [],
    // MOCK — cumulative PMKVY trained candidates placeholder.
    headlineMetric: { key: "pmkvy_trained", label: "PMKVY Trained", unit: "cr", mockValue: 1.4, mockUnit: "cr" },
  },

  // ── Defence ───────────────────────────────────────────────
  {
    slug: "defence-budget",
    category: "defence",
    superCategory: "governance",
    contentType: "data",
    subGroup: "DEFENCE",
    title: "Defence Budget (Public)",
    icon: "🛡️",
    tagline: "Demand 17/19/20 — capital and revenue allocations.",
    description:
      "Defence allocations from the Union Budget (Demands 17/19/20) — total, " +
      "capital outlay, modernisation. Public figures only.",
    status: "live",
    displayOrder: 8,
    sources: [
      { sourceKey: "MOD", type: "Collected", refresh: "Annual" },
      { sourceKey: "MoF_BUDGET", type: "Collected", refresh: "Annual" },
    ],
    componentName: "DefenceBudgetModule",
    legalNote: "defence",
    scraperKeys: ["mod-budget"],
    // MOCK — Demand for Grants (Defence) total allocation placeholder.
    headlineMetric: { key: "defence_allocation", label: "Defence Allocation", unit: "₹ lakh cr", mockValue: 6.2, mockUnit: "₹ lakh cr" },
    hasStateBreakdownData: true,
  },
  {
    slug: "defence-exports",
    category: "defence",
    superCategory: "governance",
    contentType: "data",
    subGroup: "DEFENCE",
    title: "Defence Exports",
    icon: "📦",
    tagline: "Quarterly defence export figures via PIB.",
    description:
      "MoD-released defence export totals via PIB releases tagged Defence " +
      "Production. Quarterly cadence; aggregate value only.",
    status: "live",
    displayOrder: 9,
    sources: [
      { sourceKey: "MOD", type: "Collected", refresh: "Quarterly" },
      { sourceKey: "PIB", type: "Collected", refresh: "Quarterly" },
    ],
    componentName: "DefenceExportsModule",
    legalNote: "defence",
    scraperKeys: ["pib-defence-exports"],
    // MOCK — annual defence exports order-of-magnitude (~₹21,000 cr).
    headlineMetric: { key: "defence_exports", label: "Annual Defence Exports", unit: "₹ '000 cr", mockValue: 21, mockUnit: "₹ '000 cr" },
  },
  {
    slug: "defence-dpsu",
    category: "defence",
    superCategory: "governance",
    contentType: "data",
    subGroup: "DEFENCE",
    title: "DPSU Performance",
    icon: "🏭",
    tagline: "HAL, BEL, Mazagon — listed defence PSUs.",
    description:
      "Annual report data from listed Defence PSUs (HAL, BEL, Mazagon, " +
      "Cochin Shipyard, etc.) — revenue, profit, order book.",
    status: "coming_soon",
    displayOrder: 10,
    sources: [{ sourceKey: "MOD", type: "Collected", refresh: "Annual" }],
    componentName: "DefenceDpsuModule",
    legalNote: "defence",
    scraperKeys: [],
    // MOCK — combined DPSU revenue order-of-magnitude.
    headlineMetric: { key: "dpsu_revenue", label: "Combined DPSU Revenue", unit: "₹ '000 cr", mockValue: 70, mockUnit: "₹ '000 cr" },
  },

  // ── Justice ───────────────────────────────────────────────
  {
    slug: "justice-pendency",
    category: "justice",
    superCategory: "governance",
    contentType: "data",
    subGroup: "JUSTICE",
    title: "Court Pendency",
    icon: "⚖️",
    tagline: "Aggregate case pendency from NJDG.",
    description:
      "National Judicial Data Grid weekly snapshot — total pending cases " +
      "across district, high, and supreme courts. Aggregate only.",
    status: "coming_soon",
    displayOrder: 1,
    sources: [{ sourceKey: "NJDG", type: "Collected", refresh: "Weekly" }],
    componentName: "JusticePendencyModule",
    legalNote: "justice",
    scraperKeys: [],
    // MOCK — NJDG total pending cases order-of-magnitude.
    headlineMetric: { key: "pending_cases", label: "Pending Cases", unit: "cr", mockValue: 5, mockUnit: "cr" },
    featuredCardDataGrid: [
      { label: 'Total pending', value: '5.2 cr' },
      { label: 'District courts', value: '4.5 cr' },
      { label: 'High Courts', value: '0.6 cr' },
      { label: 'Source', value: 'NJDG · weekly' },
    ],

  },
  {
    slug: "justice-crime",
    category: "justice",
    superCategory: "governance",
    contentType: "data",
    subGroup: "JUSTICE",
    title: "NCRB Crime Statistics",
    icon: "🚔",
    tagline: "Annual Crime in India headline figures.",
    description:
      "National Crime Records Bureau Crime in India report — total IPC " +
      "cases, rate per lakh population. Released annually as a scanned PDF.",
    status: "coming_soon",
    displayOrder: 2,
    sources: [{ sourceKey: "NCRB", type: "Collected", refresh: "Annual" }],
    componentName: "JusticeCrimeModule",
    legalNote: "justice",
    scraperKeys: [],
    // MOCK — NCRB Crime in India total IPC cases order-of-magnitude.
    headlineMetric: { key: "ipc_cases", label: "Total IPC Cases", unit: "lakh", mockValue: 58, mockUnit: "lakh" },
  },
  {
    slug: "justice-police",
    category: "justice",
    superCategory: "governance",
    contentType: "data",
    subGroup: "JUSTICE",
    title: "Police Strength (BPRD)",
    icon: "👮",
    tagline: "Sanctioned vs actual police strength from BPRD.",
    description:
      "Bureau of Police Research and Development annual data on " +
      "police organisations — strength, vacancies, ratio per lakh population.",
    status: "live",
    displayOrder: 3,
    sources: [{ sourceKey: "BPRD", type: "Collected", refresh: "Annual" }],
    componentName: "JusticePoliceModule",
    legalNote: "justice",
    hasStateBreakdown: true,
    scraperKeys: ["bprd-police"],
    // MOCK — civil police actual strength order-of-magnitude (~21 lakh).
    headlineMetric: { key: "police_strength", label: "Civil Police Strength", unit: "lakh", mockValue: 21, mockUnit: "lakh" },
  },
  {
    slug: "justice-prisons",
    category: "justice",
    superCategory: "governance",
    contentType: "data",
    subGroup: "JUSTICE",
    title: "Prison Statistics",
    icon: "🔒",
    tagline: "NCRB Prison Statistics India headline figures.",
    description:
      "Annual NCRB Prison Statistics — total prison population, undertrials, " +
      "convicts, capacity utilisation.",
    status: "coming_soon",
    displayOrder: 4,
    sources: [{ sourceKey: "NCRB", type: "Collected", refresh: "Annual" }],
    componentName: "JusticePrisonsModule",
    legalNote: "justice",
    scraperKeys: [],
    // MOCK — total prison population order-of-magnitude (~5.7 lakh).
    headlineMetric: { key: "prison_population", label: "Prison Population", unit: "lakh", mockValue: 5.7, mockUnit: "lakh" },
  },

  // ── Elections ─────────────────────────────────────────────
  {
    slug: "elections-loksabha",
    category: "elections",
    superCategory: "governance",
    contentType: "data",
    subGroup: "ELECTIONS",
    title: "Lok Sabha",
    icon: "🗳️",
    tagline: "Composition, party-wise seats, vacancies.",
    description:
      "Election Commission of India data on the current Lok Sabha — " +
      "party-wise seat tally, vacancies, by-election results.",
    status: "coming_soon",
    displayOrder: 5,
    sources: [{ sourceKey: "ECI", type: "Collected", refresh: "Event-driven" }],
    componentName: "ElectionsLokSabhaModule",
    legalNote: "elections",
    scraperKeys: [],
    // MOCK — Lok Sabha is constitutionally fixed at 543 elected seats.
    headlineMetric: { key: "loksabha_seats", label: "Lok Sabha Seats", unit: "count", mockValue: 543, mockUnit: "" },
    hasStateBreakdownData: true,
  },
  {
    slug: "elections-rajyasabha",
    category: "elections",
    superCategory: "governance",
    contentType: "data",
    subGroup: "ELECTIONS",
    title: "Rajya Sabha",
    icon: "🏛️",
    tagline: "Party composition of the Council of States.",
    description:
      "Rajya Sabha membership and composition — party-wise strength, " +
      "elected vs nominated, vacancies.",
    status: "coming_soon",
    displayOrder: 6,
    sources: [
      { sourceKey: "RAJYA_SABHA", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "ElectionsRajyaSabhaModule",
    legalNote: "elections",
    scraperKeys: [],
    // MOCK — Rajya Sabha sanctioned strength (245 = 233 elected + 12 nominated).
    headlineMetric: { key: "rajyasabha_seats", label: "Rajya Sabha Members", unit: "count", mockValue: 245, mockUnit: "" },
  },
  {
    slug: "elections-turnout",
    category: "elections",
    superCategory: "governance",
    contentType: "data",
    subGroup: "ELECTIONS",
    title: "Voter Turnout Trends",
    icon: "📊",
    tagline: "Historical Lok Sabha and state turnout from ECI.",
    description:
      "Long-run voter turnout series for Lok Sabha and state assembly " +
      "elections, from ECI's statistical reports.",
    status: "coming_soon",
    displayOrder: 7,
    sources: [{ sourceKey: "ECI", type: "Collected", refresh: "Annual" }],
    componentName: "ElectionsTurnoutModule",
    legalNote: "elections",
    hasTimeSeries: true,
    scraperKeys: [],
    // MOCK — Lok Sabha turnout 66% range placeholder.
    headlineMetric: { key: "loksabha_turnout_pct", label: "Lok Sabha Turnout", unit: "%", mockValue: 66, mockUnit: "%" },
  },

  // ── Science ───────────────────────────────────────────────
  {
    slug: "science-isro",
    category: "science",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "SCIENCE",
    title: "ISRO Missions",
    icon: "🚀",
    tagline: "Recent launches, satellite catalogue.",
    description:
      "ISRO mission count by year, recent launches, active satellite " +
      "catalogue. Event-driven — updates after each launch.",
    status: "coming_soon",
    displayOrder: 2,
    sources: [{ sourceKey: "ISRO", type: "Collected", refresh: "Event-driven" }],
    componentName: "ScienceIsroModule",
    scraperKeys: [],
    // MOCK — total ISRO mission count order-of-magnitude.
    headlineMetric: { key: "isro_launches_total", label: "Total ISRO Launches", unit: "count", mockValue: 120, mockUnit: "" },
  },
  {
    slug: "science-rd",
    category: "science",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "SCIENCE",
    title: "R&D & Patents",
    icon: "🔬",
    tagline: "Gross R&D expenditure, patents granted.",
    description:
      "Department of Science & Technology R&D Statistics — GERD as % of " +
      "GDP, patents filed and granted via IP India.",
    status: "live",
    displayOrder: 4,
    sources: [
      { sourceKey: "DST", type: "Collected", refresh: "Annual" },
      { sourceKey: "IPINDIA", type: "Collected", refresh: "Annual" },
    ],
    componentName: "ScienceRdModule",
    scraperKeys: ["dst-rd"],
    // MOCK — GERD as % GDP placeholder (~0.65%).
    headlineMetric: { key: "rd_pct_gdp", label: "R&D Spend (% GDP)", unit: "%", mockValue: 0.65, mockUnit: "%" },
  },
  {
    slug: "science-startups",
    category: "science",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "INDUSTRY",
    title: "Startups & Unicorns",
    icon: "🦄",
    tagline: "DPIIT-recognised startups, unicorn count.",
    description:
      "Startup India / DPIIT recognised entities — total recognised, " +
      "by sector, by state, year-on-year growth.",
    status: "live",
    displayOrder: 1,
    sources: [
      { sourceKey: "STARTUP_INDIA", type: "Collected", refresh: "Monthly" },
      { sourceKey: "DPIIT", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "ScienceStartupsModule",
    hasStateBreakdown: true,
    scraperKeys: ["dpiit-startups"],
    // MOCK — DPIIT-recognised startups cumulative order-of-magnitude.
    headlineMetric: { key: "dpiit_startups", label: "DPIIT-recognised Startups", unit: "lakh", mockValue: 1.4, mockUnit: "lakh" },
    hasStateBreakdownData: true,
    featuredCardDataGrid: [
      { label: 'DPIIT recognised', value: '1.4 lakh' },
      { label: 'Unicorns', value: '110+' },
      { label: 'Top sector', value: 'IT' },
      { label: 'Source', value: 'DPIIT · 2024' },
    ],

  },
  {
    slug: "science-digital",
    category: "science",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "DIGITAL",
    title: "Digital India (UPI, Aadhaar)",
    icon: "📱",
    tagline: "Monthly UPI volume + Aadhaar enrolment.",
    description:
      "UPI transaction volume and value (NPCI, monthly). Aadhaar enrolment " +
      "and authentication transactions (UIDAI).",
    status: "live",
    displayOrder: 3,
    sources: [
      { sourceKey: "NPCI", type: "Collected", refresh: "Monthly" },
      { sourceKey: "UIDAI", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "ScienceDigitalModule",
    hasTimeSeries: true,
    scraperKeys: ["npci-upi"],
    // MOCK — monthly UPI transaction count order-of-magnitude.
    headlineMetric: { key: "upi_monthly_txns", label: "Monthly UPI Transactions", unit: "cr", mockValue: 1700, mockUnit: "cr" },
  },

  // ── Trade ─────────────────────────────────────────────────
  {
    slug: "trade-overview",
    category: "trade",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "TRADE",
    title: "Foreign Trade",
    icon: "🌐",
    tagline: "Monthly exports, imports, trade balance.",
    description:
      "Department of Commerce QuickEstimates — monthly merchandise exports, " +
      "imports, services trade, trade balance.",
    status: "live",
    displayOrder: 5,
    sources: [
      { sourceKey: "COMMERCE", type: "Collected", refresh: "Monthly" },
      { sourceKey: "DGFT", type: "Collected", refresh: "Monthly" },
    ],
    componentName: "TradeOverviewModule",
    hasTimeSeries: true,
    scraperKeys: ["commerce-trade"],
    // MOCK — annual merchandise exports order-of-magnitude.
    headlineMetric: { key: "exports_annual", label: "Annual Merchandise Exports", unit: "₹ lakh cr", mockValue: 37, mockUnit: "₹ lakh cr" },
  },
  {
    slug: "trade-fdi",
    category: "trade",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "TRADE",
    title: "FDI & Investment",
    icon: "💼",
    tagline: "FDI inflows by sector, source country.",
    description:
      "DPIIT FDI inflow data — quarterly equity inflows by sector and " +
      "source country, RBI capital account data.",
    status: "coming_soon",
    displayOrder: 6,
    sources: [{ sourceKey: "DPIIT", type: "Collected", refresh: "Quarterly" }],
    componentName: "TradeFdiModule",
    scraperKeys: [],
    // MOCK — annual FDI equity inflow order-of-magnitude (~$70 bn).
    headlineMetric: { key: "fdi_equity_inflow", label: "Annual FDI Equity Inflow", unit: "$ bn", mockValue: 70, mockUnit: "$ bn" },
  },
  {
    slug: "trade-diaspora",
    category: "trade",
    superCategory: "innovation",
    contentType: "data",
    subGroup: "TRADE",
    title: "Diaspora & Remittances",
    icon: "✈️",
    tagline: "Remittance inflows, diaspora estimates.",
    description:
      "RBI annual remittance data, MEA diaspora estimates by country.",
    status: "coming_soon",
    displayOrder: 7,
    sources: [{ sourceKey: "RBI", type: "Collected", refresh: "Annual" }],
    componentName: "TradeDiasporaModule",
    scraperKeys: [],
    // MOCK — annual remittance inflows order-of-magnitude (~$125 bn).
    headlineMetric: { key: "remittances_annual_usd", label: "Annual Remittances", unit: "$ bn", mockValue: 125, mockUnit: "$ bn" },
  },

  // ── Tourism ───────────────────────────────────────────────
  {
    slug: "tourism-overview",
    category: "tourism",
    superCategory: "culture",
    contentType: "data",
    subGroup: "HERITAGE",
    title: "Tourism Statistics",
    icon: "🧳",
    tagline: "Monthly FTA and FEE from Ministry of Tourism.",
    description:
      "Foreign Tourist Arrivals and Foreign Exchange Earnings — monthly " +
      "bulletin from the Ministry of Tourism.",
    status: "live",
    displayOrder: 2,
    sources: [{ sourceKey: "TOURISM", type: "Collected", refresh: "Monthly" }],
    componentName: "TourismOverviewModule",
    hasTimeSeries: true,
    scraperKeys: ["tourism-arrivals"],
    // MOCK — annual foreign tourist arrivals order-of-magnitude.
    headlineMetric: { key: "fta_annual", label: "Foreign Tourist Arrivals", unit: "lakh", mockValue: 94, mockUnit: "lakh" },
  },
  {
    slug: "tourism-heritage",
    category: "tourism",
    superCategory: "culture",
    contentType: "data",
    subGroup: "HERITAGE",
    title: "UNESCO & ASI Heritage",
    icon: "🏛️",
    tagline: "Centrally protected monuments and World Heritage Sites.",
    description:
      "Archaeological Survey of India data on centrally protected monuments, " +
      "plus India's UNESCO World Heritage inscriptions.",
    status: "live",
    displayOrder: 1,
    sources: [{ sourceKey: "ASI", type: "Collected", refresh: "Quarterly" }],
    componentName: "TourismHeritageModule",
    scraperKeys: ["asi-heritage"],
    // MOCK — ASI centrally protected monuments order-of-magnitude (~3,700).
    headlineMetric: { key: "asi_monuments", label: "ASI Protected Monuments", unit: "count", mockValue: 3700, mockUnit: "" },
    featuredCardDataGrid: [
      { label: 'UNESCO sites', value: '43' },
      { label: 'ASI monuments', value: '3,696' },
      { label: 'Top state', value: 'Maharashtra' },
      { label: 'Source', value: 'ASI · 2024' },
    ],

  },
  {
    slug: "tourism-gi-tags",
    category: "tourism",
    superCategory: "culture",
    contentType: "data",
    subGroup: "HERITAGE",
    title: "GI Tags Registry",
    icon: "🏷️",
    tagline: "Geographical Indication registry.",
    description:
      "Office of the Controller General of Patents GI registry — total " +
      "tags, by category, by state.",
    status: "coming_soon",
    displayOrder: 5,
    sources: [{ sourceKey: "IPINDIA", type: "Collected", refresh: "Annual" }],
    componentName: "TourismGiTagsModule",
    scraperKeys: [],
    // MOCK — total GI tags registered order-of-magnitude (~570).
    headlineMetric: { key: "gi_tags_total", label: "GI Tags Registered", unit: "count", mockValue: 570, mockUnit: "" },
  },

  // ── Sports ────────────────────────────────────────────────
  {
    slug: "sports-olympics",
    category: "sports",
    superCategory: "culture",
    contentType: "data",
    subGroup: "SPORTS",
    title: "Olympic Performance",
    icon: "🏅",
    tagline: "Medals, athletes, contingent size.",
    description:
      "India's Olympic and Paralympic performance — medal record by Games, " +
      "contingent size, sport-wise breakdown.",
    status: "live",
    displayOrder: 3,
    sources: [
      { sourceKey: "IOA", type: "Institutional", refresh: "Event-driven" },
      { sourceKey: "SAI", type: "Collected", refresh: "Annual" },
    ],
    componentName: "SportsOlympicsModule",
    scraperKeys: ["ioa-medals"],
    // MOCK — India's all-time Olympic medal count.
    headlineMetric: { key: "olympic_medals_total", label: "Olympic Medals (all-time)", unit: "count", mockValue: 41, mockUnit: "" },
  },
  {
    slug: "sports-khelo-india",
    category: "sports",
    superCategory: "culture",
    contentType: "data",
    subGroup: "SPORTS",
    title: "Khelo India",
    icon: "🏃",
    tagline: "Khelo India Games, KISCE centres.",
    description:
      "Khelo India programme data — Games editions, KISCE centres, " +
      "athletes supported by sport.",
    status: "coming_soon",
    displayOrder: 4,
    sources: [{ sourceKey: "SAI", type: "Collected", refresh: "Annual" }],
    componentName: "SportsKheloIndiaModule",
    scraperKeys: [],
    // MOCK — Khelo India scholar athletes supported, order-of-magnitude.
    headlineMetric: { key: "khelo_india_athletes", label: "Khelo India Athletes", unit: "count", mockValue: 3000, mockUnit: "" },
  },

  // ── Editorial seeds (Know About India, Phase 3A) ───────────
  {
    slug: "know-india-constitution",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "How the Indian Constitution Works",
    icon: "📜",
    tagline: "Preamble, Fundamental Rights, DPSP, Schedule structure — explained from NCERT.",
    description:
      "Visual-first NCERT-aligned explainer covering the Preamble, Fundamental Rights, Directive Principles, and the structure of the Constitution.",
    status: "planned",
    displayOrder: 1,
    sources: [
      { sourceKey: "NCERT_POLITY_11", type: "Institutional", refresh: "Annual" },
      { sourceKey: "CONSTITUTION_OF_INDIA", type: "Institutional", refresh: "Annual" },
      { sourceKey: "MIN_LAW_JUSTICE", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "KnowIndiaConstitutionModule",
    hasStateBreakdown: false,
    hasTimeSeries: false,
    scraperKeys: [],
    featuredCardDataGrid: [
      { label: 'Articles', value: '470+' },
      { label: 'Schedules', value: '12' },
      { label: 'Parts', value: '22' },
      { label: 'Adopted', value: '26 Jan 1950' },
    ],

  },
  {
    slug: "know-india-history-timeline",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "History of India — A Timeline",
    icon: "🏛️",
    tagline: "From Indus Valley to today — the master timeline of Indian civilization.",
    description:
      "Visual-first NCERT-aligned overview from Indus Valley (3300 BCE) to post-Independence. Master timeline that links to deeper era-specific modules.",
    status: "planned",
    displayOrder: 2,
    sources: [
      { sourceKey: "NCERT_HISTORY_6_12", type: "Institutional", refresh: "Annual" },
      { sourceKey: "ASI", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "KnowIndiaHistoryTimelineModule",
    hasStateBreakdown: false,
    hasTimeSeries: true,
    scraperKeys: [],
  },
  {
    slug: "know-india-geography-physical",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "Geography of India — Physical Foundation",
    icon: "🗺️",
    tagline: "Rivers, mountains, climate zones, biomes — the physical India explained.",
    description:
      "Visual-first NCERT-aligned explainer of Indian physical geography. Covers river systems, mountain ranges, climate zones, biomes.",
    status: "planned",
    displayOrder: 3,
    sources: [
      { sourceKey: "NCERT_GEOGRAPHY_11", type: "Institutional", refresh: "Annual" },
      { sourceKey: "SOI", type: "Institutional", refresh: "Annual" },
      { sourceKey: "IMD", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "KnowIndiaGeographyPhysicalModule",
    hasStateBreakdown: false,
    hasTimeSeries: false,
    scraperKeys: [],
  },
  {
    slug: "know-india-parliament",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "How Parliament Functions",
    icon: "🏛️",
    tagline: "Sessions, types of bills, committees, question hour — Parliament explained.",
    description:
      "Visual-first NCERT-aligned explainer of how Parliament functions. Lok Sabha, Rajya Sabha, bills, committees, question hour.",
    status: "planned",
    displayOrder: 4,
    sources: [
      { sourceKey: "NCERT_POLITY_11", type: "Institutional", refresh: "Annual" },
      { sourceKey: "PARLIAMENT_OF_INDIA", type: "Institutional", refresh: "Annual" },
      { sourceKey: "PRS_LEGISLATIVE", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "KnowIndiaParliamentModule",
    hasStateBreakdown: false,
    hasTimeSeries: false,
    scraperKeys: [],
  },
  {
    slug: "know-india-elections",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "How Elections Work in India",
    icon: "🗳️",
    tagline: "Lok Sabha, State, Local — the election machinery from ECI to EVM.",
    description:
      "Visual-first NCERT-aligned explainer of the Indian election system. ECI, MCC, EVMs, VVPATs, voter registration.",
    status: "planned",
    displayOrder: 5,
    sources: [
      { sourceKey: "NCERT_POLITY_11", type: "Institutional", refresh: "Annual" },
      { sourceKey: "ECI", type: "Institutional", refresh: "Annual" },
    ],
    componentName: "KnowIndiaElectionsModule",
    hasStateBreakdown: false,
    hasTimeSeries: false,
    scraperKeys: [],
  },
  {
    slug: "know-india-budget",
    category: "custom",
    superCategory: "know-india",
    contentType: "editorial",
    title: "How the Union Budget Is Made",
    icon: "💰",
    tagline: "Article 112, the Budget cycle, Demands for Grants — the budget process explained.",
    description:
      "Visual-first NCERT-aligned explainer of how the Union Budget is made. Article 112, budget cycle, key players, Finance Bill.",
    status: "planned",
    displayOrder: 6,
    sources: [
      { sourceKey: "NCERT_MACROECON_12", type: "Institutional", refresh: "Annual" },
      { sourceKey: "UNION_BUDGET", type: "Institutional", refresh: "Annual" },
      { sourceKey: "CGA", type: "Institutional", refresh: "Monthly" },
    ],
    componentName: "KnowIndiaBudgetModule",
    hasStateBreakdown: false,
    hasTimeSeries: false,
    scraperKeys: [],
  },
];

// ── Selectors ───────────────────────────────────────────────

export function getLiveIndiaModules(): IndiaModuleDef[] {
  return INDIA_MODULES
    .filter((m) => m.status !== "coming_soon")
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getComingSoonIndiaModules(): IndiaModuleDef[] {
  return INDIA_MODULES
    .filter((m) => m.status === "coming_soon")
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getIndiaCategories(): IndiaModuleCategory[] {
  return Array.from(new Set(INDIA_MODULES.map((m) => m.category)));
}

export function getIndiaModuleBySlug(slug: string): IndiaModuleDef | undefined {
  return INDIA_MODULES.find((m) => m.slug === slug);
}

export function getIndiaModulesByCategory(
  category: IndiaModuleCategory,
): IndiaModuleDef[] {
  return INDIA_MODULES.filter((m) => m.category === category).sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
}

/**
 * News-search keywords for filtering NewsItem rows on the module
 * deep-dive page. Falls back to [title, category] when not set.
 */
export function getModuleNewsKeywords(mod: IndiaModuleDef): string[] {
  return mod.newsKeywords ?? [mod.title, mod.category];
}

/**
 * The metricKey the deep-dive choropleth uses. Falls back to the
 * first scraperKey, then to a sensible default.
 */
export function getModulePrimaryMetric(mod: IndiaModuleDef): string {
  return mod.primaryMetric ?? mod.scraperKeys[0] ?? "population_total";
}

/**
 * 3-5 related-module slugs for the bottom-of-page cross-link rail.
 * Falls back to other modules in the same category, then fills with
 * adjacent-category modules (alphabetical) until the target count is
 * reached.
 */
export function getModuleRelatedSlugs(mod: IndiaModuleDef, target = 4): string[] {
  if (mod.relatedModules && mod.relatedModules.length > 0) {
    return mod.relatedModules.slice(0, target);
  }
  const sameCategory = INDIA_MODULES.filter(
    (m) => m.category === mod.category && m.slug !== mod.slug,
  ).map((m) => m.slug);
  if (sameCategory.length >= target) return sameCategory.slice(0, target);
  // Fill from other modules sorted by displayOrder distance from this one
  const filler = INDIA_MODULES.filter(
    (m) => m.category !== mod.category && m.slug !== mod.slug,
  )
    .sort(
      (a, b) =>
        Math.abs(a.displayOrder - mod.displayOrder) -
        Math.abs(b.displayOrder - mod.displayOrder),
    )
    .map((m) => m.slug);
  return [...sameCategory, ...filler].slice(0, target);
}

/**
 * IndiaAnalysis FK key. Defaults to module slug — 1:1 mapping —
 * unless an override has been set in the registry.
 */
export function getModuleAnalysisSlug(mod: IndiaModuleDef): string {
  return mod.aiAnalysisSlug ?? mod.slug;
}

export function getModuleComingSoonFeatures(mod: IndiaModuleDef): string[] {
  return mod.comingSoonFeatures ?? [
    "Deeper time-series back to FY16",
    "Per-state vs. peer-group benchmarking",
    "Downloadable CSV / API endpoint",
  ];
}

/**
 * Headline metric keys for modules that have realistic per-state values
 * declared in mock-state-data.REALISTIC_STATE_VALUES. The Grid view's
 * metric picker filters its tiles against this list — only metrics with
 * real state breakdowns become clickable tiles.
 */
export function getStateBreakdownMetricKeys(): string[] {
  const keys: string[] = [];
  for (const mod of INDIA_MODULES) {
    if (mod.hasStateBreakdownData && mod.headlineMetric?.key) {
      keys.push(mod.headlineMetric.key);
    }
  }
  return keys;
}

// ── Phase 3A helpers (file 44) ──────────────────────────────

export function getDataModules(): IndiaModuleDef[] {
  return INDIA_MODULES.filter((m) => m.contentType === "data");
}

export function getEditorialModules(): IndiaModuleDef[] {
  return INDIA_MODULES.filter((m) => m.contentType === "editorial");
}

export function getPlannedModules(): IndiaModuleDef[] {
  return INDIA_MODULES.filter((m) => m.status === "planned");
}

export function getLiveModuleCountInSuperCategory(superCategorySlug: string): number {
  return INDIA_MODULES.filter(
    (m) => m.superCategory === superCategorySlug && m.status === "live",
  ).length;
}

export function getPlannedModuleCountInSuperCategory(superCategorySlug: string): number {
  return INDIA_MODULES.filter(
    (m) => m.superCategory === superCategorySlug && m.status === "planned",
  ).length;
}
