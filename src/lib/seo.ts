/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — SEO Metadata Helpers
// ═══════════════════════════════════════════════════════════
import type { Metadata } from "next";
import { getDistrict, getState } from "@/lib/constants/districts";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

interface ModuleMeta {
  title: string;
  description: string;
  keywords: string[];
}

const MODULE_META: Record<string, (districtName: string, stateName: string) => ModuleMeta> = {
  weather: (d, s) => ({
    title: `${d} Weather & Rainfall Data`,
    description: `Live weather readings and historical rainfall data for ${d} district, ${s}. Temperature, humidity, and monsoon statistics.`,
    keywords: [`${d} weather`, `${d} rainfall`, `${d} monsoon`, `${s} rainfall data`],
  }),
  crops: (d, s) => ({
    title: `${d} Crop Prices — AGMARKNET Live`,
    description: `Live mandi prices for paddy, sugarcane and other crops in ${d} district, ${s}. Updated daily from AGMARKNET.`,
    keywords: [`${d} crop prices`, `${d} mandi prices`, `${d} APMC`, `paddy price ${d}`, `sugarcane price ${s}`],
  }),
  water: (d, s) => ({
    title: `${d} Dam & Reservoir Levels`,
    description: `Live dam water levels, inflow, outflow for KRS and other reservoirs serving ${d} district, ${s}.`,
    keywords: [`${d} dam level`, `KRS dam`, `${d} water storage`, `${s} reservoirs`],
  }),
  finance: (d, s) => ({
    title: `${d} District Budget & Finance`,
    description: `District budget allocations, utilisation, and lapsed funds for ${d}, ${s}. Fiscal transparency data.`,
    keywords: [`${d} budget`, `${d} government spending`, `${d} lapsed funds`, `${s} district finance`],
  }),
  schools: (d, s) => ({
    title: `${d} Schools & Education Data`,
    description: `Government school data, SSLC pass rates, student-teacher ratios for ${d} district, ${s}.`,
    keywords: [`${d} schools`, `${d} SSLC results`, `${d} education`, `government schools ${s}`],
  }),
  elections: (d, s) => ({
    title: `${d} Election Results & Voter Data`,
    description: `Assembly and Lok Sabha election results, voter turnout, and candidate data for ${d} district, ${s}.`,
    keywords: [`${d} election results`, `${d} MLA`, `${d} MP`, `${s} election data`],
  }),
  news: (d, s) => ({
    title: `${d} Latest News & Updates`,
    description: `Latest news from ${d} district, ${s} — politics, development, agriculture, and civic updates.`,
    keywords: [`${d} news`, `${d} latest updates`, `${s} district news`],
  }),
  schemes: (d, s) => ({
    title: `${d} Government Schemes & Benefits`,
    description: `Central and state government schemes available for citizens of ${d} district, ${s}. PM-KISAN, PMAY, and more.`,
    keywords: [`${d} government schemes`, `${d} PM-KISAN`, `${d} PMAY`, `government benefits ${s}`],
  }),
  leadership: (d, s) => ({
    title: `${d} District Officials & Leaders`,
    description: `District Collector, SP Police, MLAs, MPs, and other key officials in ${d} district, ${s}.`,
    keywords: [`${d} collector`, `${d} district officials`, `${d} MLA MP`, `${s} government officers`],
  }),
  rti: (d, s) => ({
    title: `File RTI — ${d} District`,
    description: `RTI filing guide and templates for ${d} district, ${s}. Response rates and first appeal process.`,
    keywords: [`RTI ${d}`, `file RTI ${s}`, `right to information ${d}`],
  }),
};

export function generateModuleMetadata(
  module: string,
  stateSlug: string,
  districtSlug: string
): Metadata {
  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);

  if (!districtData || !stateData) return {};

  const generator = MODULE_META[module];
  if (!generator) return {};

  const meta = generator(districtData.name, stateData.name);

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: `${BASE_URL}/en/${stateSlug}/${districtSlug}/${module}`,
    },
    twitter: {
      card: "summary",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `${BASE_URL}/en/${stateSlug}/${districtSlug}/${module}`,
    },
  };
}

// ─── JSON-LD Schema generators for module pages ──────────────────────────────

export interface ModuleSchemaProps {
  module: string;
  districtName: string;
  stateName: string;
  stateSlug: string;
  districtSlug: string;
}

const MODULE_SCHEMA_TYPE: Record<string, { type: string; description: (d: string, s: string) => string }> = {
  crops:          { type: "Dataset", description: (d, s) => `Live and historical agricultural mandi prices for ${d} district, ${s}. Data sourced from AGMARKNET (Agricultural Marketing Information Network).` },
  weather:        { type: "Dataset", description: (d, s) => `Weather readings and historical rainfall data for ${d} district, ${s}. Sourced from India Meteorological Department (IMD).` },
  water:          { type: "Dataset", description: (d, s) => `Dam water levels, inflow, outflow and storage data for reservoirs serving ${d} district, ${s}. Sourced from India-WRIS.` },
  finance:        { type: "GovernmentService", description: (d, s) => `District budget allocations, utilisation percentages, and fiscal data for ${d} district, ${s}.` },
  schools:        { type: "Dataset", description: (d, s) => `Government school enrollment, SSLC pass rates, student-teacher ratios for ${d} district, ${s}. Sourced from UDISE+.` },
  elections:      { type: "Dataset", description: (d, s) => `Assembly and Lok Sabha election results, voter turnout, and candidate data for ${d} district, ${s}. Source: Election Commission of India.` },
  leadership:     { type: "GovernmentService", description: (d, s) => `District Collector, Superintendent of Police, MLAs, MPs, and key officials for ${d} district, ${s}.` },
  schemes:        { type: "GovernmentService", description: (d, s) => `Central and state government welfare schemes and their coverage in ${d} district, ${s}.` },
  rti:            { type: "GovernmentService", description: (d, s) => `Right to Information (RTI) filing guide and templates for ${d} district, ${s}.` },
  news:           { type: "Dataset", description: (d, s) => `Latest news and civic updates from ${d} district, ${s}.` },
};

export function generateModuleJsonLd(props: ModuleSchemaProps): object | null {
  const { module, districtName, stateName, stateSlug, districtSlug } = props;
  const info = MODULE_SCHEMA_TYPE[module];
  if (!info) return null;

  const url = `${BASE_URL}/en/${stateSlug}/${districtSlug}/${module}`;

  if (info.type === "Dataset") {
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": `${districtName} ${module.charAt(0).toUpperCase() + module.slice(1)} Data`,
      "description": info.description(districtName, stateName),
      "url": url,
      "license": "https://data.gov.in/government-open-data-license-india",
      "isAccessibleForFree": true,
      "creator": { "@type": "Organization", "name": "ForThePeople.in", "url": BASE_URL },
      "spatialCoverage": {
        "@type": "Place",
        "name": `${districtName}, ${stateName}`,
        "containedInPlace": { "@type": "State", "name": stateName },
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    "name": `${districtName} ${module.charAt(0).toUpperCase() + module.slice(1)}`,
    "description": info.description(districtName, stateName),
    "url": url,
    "provider": { "@type": "Organization", "name": "ForThePeople.in", "url": BASE_URL },
    "areaServed": { "@type": "AdministrativeArea", "name": districtName },
  };
}
