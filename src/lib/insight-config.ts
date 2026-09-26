/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Insight Configuration — 29 modules × frequency / prompt
// ═══════════════════════════════════════════════════════════

export type InsightFrequency = "2h" | "6h" | "12h" | "24h" | "48h" | "7d";

export interface ModuleInsightConfig {
  module: string;           // slug matching API module name
  label: string;            // human-readable label
  ttlHours: number;         // how often to regenerate
  dataKeys: string[];       // top-level keys from API data to include in context
  promptHint: string;       // what the AI should focus on
}

// TTL helpers
const H2  =  2;
const H6  =  6;

const H24 = 24;
const H48 = 48;
const D7  = 168;

export const MODULE_INSIGHT_CONFIGS: ModuleInsightConfig[] = [
  {
    module: "overview",
    label: "District Overview",
    ttlHours: H6,
    dataKeys: ["population", "taluks", "alerts"],
    promptHint: "Overall district health, open alerts, and population welfare.",
  },
  {
    module: "budget",
    label: "Budget & Finance",
    ttlHours: H24,
    dataKeys: ["allocations", "utilization", "deficits"],
    promptHint: "Budget utilisation rate, under-spent departments, and fiscal health.",
  },
  {
    module: "crops",
    label: "Crop Prices",
    ttlHours: H2,
    dataKeys: ["prices", "trends"],
    promptHint: "Current mandi prices vs MSP, price anomalies, and farmer impact.",
  },
  {
    module: "weather",
    label: "Weather",
    ttlHours: H6,
    dataKeys: ["current", "forecast", "rainfall"],
    promptHint: "Current conditions, rainfall deficit/surplus, and farming advisories.",
  },
  {
    module: "water",
    label: "Water & Dams",
    ttlHours: H6,
    dataKeys: ["dams", "levels", "canals"],
    promptHint: "Reservoir levels vs capacity, drinking water supply, and irrigation status.",
  },
  {
    module: "news",
    label: "News & Events",
    ttlHours: H6,
    dataKeys: ["items", "categories"],
    promptHint: "Key developments, important civic events, and issues affecting citizens.",
  },
  {
    module: "alerts",
    label: "Alerts & Emergencies",
    ttlHours: H2,
    dataKeys: ["active", "severity", "type"],
    promptHint: "Active emergencies, public safety, and citizen action required.",
  },
  {
    module: "infrastructure",
    label: "Infrastructure Tracker",
    ttlHours: H24,
    dataKeys: ["projects", "completion", "delayed", "costOverrunPct", "scope", "executingAgency"],
    promptHint:
      "Neutral district-level infrastructure summary derived from news-sourced project " +
      "records. Mention counts of active/completed/delayed/cancelled projects, notable " +
      "cost overruns or deadline extensions (figures only, no judgment), and the executing " +
      "agencies most active. Never use 'scam/loot/corrupt/waste'. Never attribute blame. " +
      "Link every claim back to the underlying project record.",
  },
  {
    module: "leaders",
    label: "Leadership",
    ttlHours: D7,
    dataKeys: ["officers", "hierarchy"],
    promptHint: "Key contacts for citizens, leadership structure, and accountability.",
  },
  {
    module: "schemes",
    label: "Government Schemes",
    ttlHours: H48,
    dataKeys: ["active", "beneficiaries", "utilization"],
    promptHint: "Scheme coverage, under-utilised benefits, and citizen eligibility.",
  },
  {
    module: "health",
    label: "Health",
    ttlHours: H24,
    dataKeys: ["hospitals", "beds", "doctors"],
    promptHint: "Healthcare access, hospital capacity, and public health advisories.",
  },
  {
    module: "police",
    label: "Law & Order",
    ttlHours: H24,
    dataKeys: ["stations", "crimes", "response"],
    promptHint: "Crime trends, safety advisories, and policing effectiveness.",
  },
  {
    module: "elections",
    label: "Elections",
    ttlHours: D7,
    dataKeys: ["results", "turnout", "parties"],
    promptHint: "Political landscape, voter turnout, and constituency representation.",
  },
  {
    module: "transport",
    label: "Transport",
    ttlHours: H48,
    dataKeys: ["buses", "trains", "routes"],
    promptHint: "Connectivity, transport gaps, and citizen commute impact.",
  },
  {
    module: "power",
    label: "Power & Electricity",
    ttlHours: H6,
    dataKeys: ["outages", "supply", "active"],
    promptHint: "Planned outages, power supply quality, and affected areas.",
  },
  {
    module: "education",
    label: "Education",
    ttlHours: H48,
    dataKeys: ["schools", "enrollment", "dropout"],
    promptHint: "School access, dropout rates, and educational quality.",
  },
  {
    module: "gram-panchayat",
    label: "Gram Panchayat",
    ttlHours: H48,
    dataKeys: ["panchayats", "funds", "mgnrega"],
    promptHint: "Panchayat fund utilisation, MGNREGA works, and rural welfare.",
  },
  {
    module: "rti",
    label: "RTI & Transparency",
    ttlHours: H48,
    dataKeys: ["applications", "pending", "disposal"],
    promptHint: "RTI disposal rates, pending requests, and transparency index.",
  },
  {
    module: "courts",
    label: "Courts & Justice",
    ttlHours: H48,
    dataKeys: ["pending", "disposed", "categories"],
    promptHint: "Case pendency, disposal rates, and access to justice.",
  },
  {
    module: "industries",
    label: "Industries",
    ttlHours: D7,
    dataKeys: ["count", "employment", "types"],
    promptHint: "Industrial activity, employment generation, and economic health.",
  },
  {
    module: "sugar-factory",
    label: "Sugar Factories",
    ttlHours: H24,
    dataKeys: ["factories", "crushing", "season"],
    promptHint: "Crushing season progress, sugarcane payment status, and farmer welfare.",
  },
  {
    module: "soil",
    label: "Soil Health",
    ttlHours: D7,
    dataKeys: ["health", "ph", "nutrients"],
    promptHint: "Soil quality, deficiencies, and farming advisories.",
  },
  {
    module: "housing",
    label: "Housing & PMAY",
    ttlHours: H48,
    dataKeys: ["completed", "pending", "beneficiaries"],
    promptHint: "PMAY completion rates, housing access, and shelter welfare.",
  },
  {
    module: "jjm",
    label: "Jal Jeevan Mission",
    ttlHours: H48,
    dataKeys: ["coverage", "connections", "functional"],
    promptHint: "Tap water coverage, functional connections, and drinking water access.",
  },
  {
    module: "offices",
    label: "Government Offices",
    ttlHours: D7,
    dataKeys: ["offices", "services", "contacts"],
    promptHint: "Citizen service availability, office accessibility, and contact info.",
  },
  {
    module: "population",
    label: "Demographics",
    ttlHours: D7,
    dataKeys: ["total", "literacy", "sexRatio"],
    promptHint: "Demographic trends, literacy rates, and social indicators.",
  },
  {
    module: "famous-personalities",
    label: "Famous Personalities",
    ttlHours: D7,
    dataKeys: ["personalities", "fields"],
    promptHint: "Notable contributors to the district and their legacy.",
  },
  {
    module: "citizen-corner",
    label: "Citizen Corner",
    ttlHours: H24,
    dataKeys: ["tips", "guides"],
    promptHint: "Citizen rights, duties, and practical civic engagement tips.",
  },
  {
    module: "data-sources",
    label: "Data Sources",
    ttlHours: D7,
    dataKeys: ["sources", "freshness"],
    promptHint: "Data freshness, source reliability, and coverage gaps.",
  },
];

export function getInsightConfig(module: string): ModuleInsightConfig | undefined {
  return MODULE_INSIGHT_CONFIGS.find((c) => c.module === module);
}

export function getTtlMs(config: ModuleInsightConfig): number {
  return config.ttlHours * 60 * 60 * 1000;
}
