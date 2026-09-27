/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — SEO Metadata Helpers
// ═══════════════════════════════════════════════════════════
//
// Page titles and descriptions for district, module and taluk pages, in the
// page's language. The root layout's title template adds
// " | ForThePeople.in", so titles here never repeat it.
//
//   English:  hand-tuned search titles (MODULE_META) — "Mandya Dam &
//             Reservoir Levels".
//   Others:   "<module name> — <district name>" and a description built
//             from `moduleDescriptions`, via the `seo` messages, e.g.
//             "ಅಣೆಕಟ್ಟುಗಳು ಮತ್ತು ನದಿಗಳು — ಮಂಡ್ಯ".
//
// Every page gets a canonical URL in its own language plus hreflang
// alternates for every routed language (src/i18n/seo.ts).
//
// Honesty rules apply here too: no "Live" (nothing on a static page is
// guaranteed to be under 30 minutes old), no place-specific claims in
// templates that every district shares.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDistrict, getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { getModule } from "@/lib/constants/sidebar-modules";
import { DEFAULT_LOCALE, getLanguage } from "@/i18n/languages";
import { languageAlternates } from "@/i18n/seo";
import { scriptLang } from "@/lib/utils/script-lang";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

interface ModuleMeta {
  title: string;
  description: string;
  keywords?: string[];
}

/** d = district, s = state, units = the state's word for sub-districts ("Taluks", "Mandals"). */
type MetaContext = { d: string; s: string; units: string };

// English search titles. Keep them true for every district: no dam, crop
// or exam names that only fit one place.
const MODULE_META: Record<string, (c: MetaContext) => ModuleMeta> = {
  // 🏠 Start here
  news: ({ d, s }) => ({
    title: `${d} Latest News & Updates`,
    description: `Latest news from ${d} district, ${s}: politics, development, farming and civic updates.`,
    keywords: [`${d} news`, `${d} latest updates`, `${s} district news`],
  }),
  alerts: ({ d, s }) => ({
    title: `${d} Alerts & Warnings`,
    description: `Official weather, disaster and public-safety warnings for ${d} district, ${s}.`,
    keywords: [`${d} alerts`, `${d} weather warning`, `${d} advisory`],
  }),
  weather: ({ d, s }) => ({
    title: `${d} Weather & Rainfall Data`,
    description: `Weather readings and rainfall data for ${d} district, ${s}: temperature, humidity and monsoon rain, with the date of each reading.`,
    keywords: [`${d} weather`, `${d} rainfall`, `${d} monsoon`, `${s} rainfall data`],
  }),
  // 🙋 You can help
  responsibility: ({ d, s }) => ({
    title: `What You Can Do for ${d}`,
    description: `Simple things citizens of ${d} district, ${s} can do to make their district better.`,
  }),
  "citizen-corner": ({ d, s }) => ({
    title: `${d} Helplines & Citizen Rights`,
    description: `Emergency and government helpline numbers for ${d} district, ${s}, and the rights every citizen has.`,
    keywords: [`${d} helpline numbers`, `${d} emergency numbers`, `citizen rights ${s}`],
  }),
  "file-rti": ({ d, s }) => ({
    title: `File an RTI in ${d} — Step-by-Step Guide`,
    description: `Write and file a Right to Information (RTI) request for ${d} district, ${s}, step by step, with templates.`,
    keywords: [`RTI ${d}`, `file RTI ${s}`, `right to information ${d}`],
  }),
  rti: ({ d, s }) => ({
    title: `${d} RTI Tracker — Replies & Response Times`,
    description: `How many Right to Information requests in ${d} district, ${s} get answered, and how fast.`,
    keywords: [`RTI ${d}`, `RTI response time ${s}`, `right to information ${d}`],
  }),
  // 👥 Who runs it
  leadership: ({ d, s }) => ({
    title: `${d} District Officials & Leaders`,
    description: `District Collector, Superintendent of Police, MLAs, MPs and other key officials of ${d} district, ${s}.`,
    keywords: [`${d} collector`, `${d} district officials`, `${d} MLA MP`, `${s} government officers`],
  }),
  elections: ({ d, s }) => ({
    title: `${d} Election Results & Voter Data`,
    description: `Assembly and Lok Sabha election results, voter turnout and candidates for ${d} district, ${s}.`,
    keywords: [`${d} election results`, `${d} MLA`, `${d} MP`, `${s} election data`],
  }),
  "gram-panchayat": ({ d, s }) => ({
    title: `${d} Gram Panchayats — Funds & MGNREGA`,
    description: `Gram panchayats of ${d} district, ${s}: their funds, MGNREGA work and village data.`,
    keywords: [`${d} gram panchayat`, `${d} MGNREGA`, `${s} panchayat funds`],
  }),
  courts: ({ d, s }) => ({
    title: `${d} Courts — Pending Cases`,
    description: `How many cases are pending in the courts of ${d} district, ${s}, and how fast they are disposed of.`,
    keywords: [`${d} court cases`, `${d} pending cases`, `${s} courts`],
  }),
  police: ({ d, s }) => ({
    title: `${d} Police Stations & Crime Data`,
    description: `Police stations, crime figures and traffic fines for ${d} district, ${s}.`,
    keywords: [`${d} police stations`, `${d} crime rate`, `${d} traffic fines`],
  }),
  // 💰 Money & projects
  finance: ({ d, s }) => ({
    title: `${d} District Budget & Finance`,
    description: `District budget allocations, spending and lapsed funds for ${d}, ${s}. Fiscal transparency data.`,
    keywords: [`${d} budget`, `${d} government spending`, `${d} lapsed funds`, `${s} district finance`],
  }),
  infrastructure: ({ d, s }) => ({
    title: `${d} Development Projects Tracker`,
    description: `Roads, bridges, buildings and other public projects in ${d} district, ${s}, and how far along they are.`,
    keywords: [`${d} projects`, `${d} infrastructure`, `${d} road works`],
  }),
  tenders: ({ d, s }) => ({
    title: `${d} Government Tenders`,
    description: `Government tenders for ${d} district, ${s}: what is being bought or built, the amount, and who can bid.`,
    keywords: [`${d} tenders`, `${s} e-procurement`, `${d} government contracts`],
  }),
  industries: ({ d, s }) => ({
    title: `${d} Industries & Factories`,
    description: `Factories and major industries in ${d} district, ${s}.`,
    keywords: [`${d} industries`, `${d} factories`],
  }),
  // 🤲 Help for you
  schemes: ({ d, s }) => ({
    title: `${d} Government Schemes & Benefits`,
    description: `Central and state government schemes available to citizens of ${d} district, ${s}, and how to apply.`,
    keywords: [`${d} government schemes`, `${d} PM-KISAN`, `${d} PMAY`, `government benefits ${s}`],
  }),
  housing: ({ d, s }) => ({
    title: `${d} Housing Schemes (PMAY)`,
    description: `Pradhan Mantri Awas Yojana and other housing schemes in ${d} district, ${s}: houses sanctioned and completed.`,
    keywords: [`${d} PMAY`, `${d} housing scheme`, `${s} awas yojana`],
  }),
  services: ({ d, s }) => ({
    title: `How to Get Certificates in ${d}`,
    description: `Steps and documents for caste, income and other certificates and land records in ${d} district, ${s}.`,
    keywords: [`${d} caste certificate`, `${d} income certificate`, `${d} land records`],
  }),
  offices: ({ d, s }) => ({
    title: `${d} Government Offices — Address & Timings`,
    description: `Where the government offices of ${d} district, ${s} are, and when they are open.`,
    keywords: [`${d} government offices`, `${d} taluk office`, `${d} office timings`],
  }),
  exams: ({ d, s }) => ({
    title: `Government Exams & Jobs for ${d}`,
    description: `Government exam notifications and job openings for people in ${d} district, ${s}, with eligibility and last dates.`,
    keywords: [`${d} government jobs`, `${s} government exams`, `${d} recruitment`],
  }),
  // 🚰 Daily needs
  jjm: ({ d, s }) => ({
    title: `${d} Tap Water Connections (Jal Jeevan Mission)`,
    description: `How many rural homes in ${d} district, ${s} have a tap water connection under the Jal Jeevan Mission.`,
    keywords: [`${d} Jal Jeevan Mission`, `${d} tap connections`, `${s} JJM`],
  }),
  water: ({ d, s }) => ({
    title: `${d} Dam & Reservoir Levels`,
    description: `Water levels, inflow and outflow of the dams and reservoirs that serve ${d} district, ${s}, with the date of each reading.`,
    keywords: [`${d} dam level`, `${d} reservoir level`, `${d} water storage`, `${s} reservoirs`],
  }),
  power: ({ d, s }) => ({
    title: `${d} Power Cuts & Electricity Schedule`,
    description: `Planned power cuts and electricity supply information for ${d} district, ${s}.`,
    keywords: [`${d} power cut`, `${d} electricity`, `${d} load shedding`],
  }),
  transport: ({ d, s }) => ({
    title: `${d} Bus Routes, Trains & Auto Fares`,
    description: `Bus routes, trains and auto fares in ${d} district, ${s}.`,
    keywords: [`${d} bus routes`, `${d} trains`, `${d} auto fare`],
  }),
  health: ({ d, s }) => ({
    title: `${d} Hospitals & Health Data`,
    description: `Hospitals, beds and doctors in ${d} district, ${s}, from official health records.`,
    keywords: [`${d} hospitals`, `${d} government hospital`, `${s} health data`],
  }),
  schools: ({ d, s }) => ({
    title: `${d} Schools & Education Data`,
    description: `School data, board exam results and student–teacher ratios for ${d} district, ${s}.`,
    keywords: [`${d} schools`, `${d} exam results`, `${d} education`, `government schools ${s}`],
  }),
  // 🌾 Farming
  crops: ({ d, s }) => ({
    title: `${d} Crop Prices — Mandi Rates (AGMARKNET)`,
    description: `Mandi (APMC) prices for crops sold in ${d} district, ${s}, from AGMARKNET, with the date of each price.`,
    keywords: [`${d} crop prices`, `${d} mandi prices`, `${d} APMC rates`, `${s} mandi prices`],
  }),
  farm: ({ d, s }) => ({
    title: `${d} Farm & Soil Health Advice`,
    description: `Soil health and crop advice for farmers in ${d} district, ${s}.`,
    keywords: [`${d} soil health`, `${d} crop advisory`, `${d} KVK`],
  }),
  // 📚 Know your district
  population: ({ d, s }) => ({
    title: `${d} Population — Census Data`,
    description: `Population, literacy and sex ratio of ${d} district, ${s}, from the Census of India.`,
    keywords: [`${d} population`, `${d} literacy rate`, `${d} census`],
  }),
  map: ({ d, s, units }) => ({
    title: `${d} District Map — ${units} & Villages`,
    description: `Map of ${d} district, ${s}, with its ${units.toLowerCase()} and villages.`,
    keywords: [`${d} map`, `${d} ${units.toLowerCase()}`, `${d} villages`],
  }),
  "famous-personalities": ({ d, s }) => ({
    title: `Famous People from ${d}`,
    description: `Well-known people born in or linked to ${d} district, ${s}.`,
  }),
  // 🔍 Check our work
  "data-sources": ({ d, s }) => ({
    title: `${d} Data Sources`,
    description: `Every official source used for ${d} district, ${s}, and when each was last updated.`,
  }),
  "update-log": ({ d, s }) => ({
    title: `${d} Data Update Log`,
    description: `Every change to the data for ${d} district, ${s}, with its date.`,
  }),
};

/**
 * A place name in the page language: the local-script name when it is
 * written in that language's script (ಮಂಡ್ಯ on /kn, लखनऊ on /hi), else the
 * English registry name. Same rule as useDistrictName() on the client.
 */
export function localName(locale: string, place: { name: string; nameLocal?: string | null }): string {
  if (place.nameLocal && place.nameLocal !== place.name && scriptLang(place.nameLocal) === locale) return place.nameLocal;
  return place.name;
}

/** Open Graph locale, e.g. "kn_IN". */
function ogLocale(locale: string): string {
  return getLanguage(locale).intl.replace("-", "_");
}

/** The shared tail of every page's metadata: canonical, hreflang, OG, Twitter. */
function pageMetadata(locale: string, path: string, m: ModuleMeta, twitterCard: "summary" | "summary_large_image"): Metadata {
  return {
    title: m.title,
    description: m.description,
    ...(m.keywords ? { keywords: m.keywords } : {}),
    alternates: languageAlternates(path, locale),
    openGraph: {
      title: m.title,
      description: m.description,
      type: "website",
      url: `${BASE_URL}/${locale}${path}`,
      locale: ogLocale(locale),
    },
    twitter: { card: twitterCard, title: m.title, description: m.description },
  };
}

/** District and state names in the page language, or null for unknown slugs. */
async function placeNames(locale: string, stateSlug: string, districtSlug: string) {
  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!stateData || !districtData) return null;
  const tStates = await getTranslations({ locale, namespace: "states" });
  return {
    stateData,
    districtData,
    district: localName(locale, districtData),
    state: tStates.has(stateSlug) ? tStates(stateSlug) : stateData.name,
  };
}

/**
 * Metadata for a district module page, e.g. generateModuleMetadata("water",
 * "karnataka", "mandya", "kn"). Unknown districts or modules → {}.
 */
export async function generateModuleMetadata(
  module: string,
  stateSlug: string,
  districtSlug: string,
  locale: string = DEFAULT_LOCALE,
): Promise<Metadata> {
  const names = await placeNames(locale, stateSlug, districtSlug);
  const mod = getModule(module);
  if (!names || !mod) return {};
  const path = `/${stateSlug}/${districtSlug}/${module}`;

  const tuned = locale === DEFAULT_LOCALE ? MODULE_META[module] : undefined;
  if (tuned) {
    const units = getStateConfig(stateSlug)?.subDistrictUnitPlural ?? "Sub-districts";
    return pageMetadata(locale, path, tuned({ d: names.district, s: names.state, units }), "summary");
  }

  const [tSeo, tName, tDesc] = await Promise.all([
    getTranslations({ locale, namespace: "seo" }),
    getTranslations({ locale, namespace: "moduleNames" }),
    getTranslations({ locale, namespace: "moduleDescriptions" }),
  ]);
  const label = tName.has(module) ? tName(module) : mod.label;
  const description = tDesc.has(module) ? tDesc(module) : mod.description;
  return pageMetadata(
    locale,
    path,
    {
      title: tSeo("moduleTitle", { module: label, district: names.district }),
      description: tSeo("moduleDescription", { district: names.district, state: names.state, description }),
    },
    "summary",
  );
}

/** Metadata for a district overview (/<locale>/<state>/<district>). */
export async function generateDistrictMetadata(stateSlug: string, districtSlug: string, locale: string = DEFAULT_LOCALE): Promise<Metadata> {
  const names = await placeNames(locale, stateSlug, districtSlug);
  if (!names) return {};
  const [tSeo, tLabel] = await Promise.all([
    getTranslations({ locale, namespace: "seo" }),
    getTranslations({ locale, namespace: "placeLabels" }),
  ]);
  const taglineEn = names.districtData.tagline;
  const tagline = taglineEn ? (tLabel.has(taglineEn) ? tLabel(taglineEn) : taglineEn) : null;
  const values = { district: names.district, state: names.state };
  return pageMetadata(
    locale,
    `/${stateSlug}/${districtSlug}`,
    {
      title: tSeo("districtTitle", values),
      description: tagline ? tSeo("districtDescriptionTagline", { ...values, tagline }) : tSeo("districtDescription", values),
    },
    "summary_large_image",
  );
}

/** Metadata for a taluk / tehsil / mandal page. Unknown taluks → {}. */
export async function generateTalukMetadata(
  stateSlug: string,
  districtSlug: string,
  talukSlug: string,
  locale: string = DEFAULT_LOCALE,
): Promise<Metadata> {
  const names = await placeNames(locale, stateSlug, districtSlug);
  const taluk = names?.districtData.taluks.find((t) => t.slug === talukSlug);
  if (!names || !taluk) return {};
  const [tSeo, tUnit] = await Promise.all([
    getTranslations({ locale, namespace: "seo" }),
    getTranslations({ locale, namespace: "subUnitOne" }),
  ]);
  const unitEn = getStateConfig(stateSlug)?.subDistrictUnit ?? "Sub-district";
  const values = {
    taluk: localName(locale, taluk),
    unit: tUnit.has(unitEn) ? tUnit(unitEn) : unitEn,
    district: names.district,
    state: names.state,
  };
  return pageMetadata(
    locale,
    `/${stateSlug}/${districtSlug}/${talukSlug}`,
    { title: tSeo("talukTitle", values), description: tSeo("talukDescription", values) },
    "summary",
  );
}

// ─── JSON-LD Schema generators for module pages ──────────────────────────────
// Structured data stays in English (schema.org readers), with the canonical
// English URL. Names come from the registry, not the URL slugs.

export interface ModuleSchemaProps {
  module: string;
  /** District name; a slug ("mandya") is resolved to the registry name. */
  districtName: string;
  /** State name; a slug ("karnataka") is resolved to the registry name. */
  stateName: string;
  stateSlug: string;
  districtSlug: string;
}

const MODULE_SCHEMA_TYPE: Record<string, { type: string; description: (d: string, s: string) => string }> = {
  crops:          { type: "Dataset", description: (d, s) => `Agricultural mandi prices, current and past, for ${d} district, ${s}. Data sourced from AGMARKNET (Agricultural Marketing Information Network).` },
  weather:        { type: "Dataset", description: (d, s) => `Weather readings and historical rainfall data for ${d} district, ${s}. Sourced from India Meteorological Department (IMD).` },
  water:          { type: "Dataset", description: (d, s) => `Dam water levels, inflow, outflow and storage data for reservoirs serving ${d} district, ${s}. Sourced from India-WRIS.` },
  finance:        { type: "GovernmentService", description: (d, s) => `District budget allocations, utilisation percentages, and fiscal data for ${d} district, ${s}.` },
  schools:        { type: "Dataset", description: (d, s) => `Government school enrollment, board exam pass rates, student-teacher ratios for ${d} district, ${s}. Sourced from UDISE+.` },
  elections:      { type: "Dataset", description: (d, s) => `Assembly and Lok Sabha election results, voter turnout, and candidate data for ${d} district, ${s}. Source: Election Commission of India.` },
  leadership:     { type: "GovernmentService", description: (d, s) => `District Collector, Superintendent of Police, MLAs, MPs, and key officials for ${d} district, ${s}.` },
  schemes:        { type: "GovernmentService", description: (d, s) => `Central and state government welfare schemes and their coverage in ${d} district, ${s}.` },
  rti:            { type: "GovernmentService", description: (d, s) => `Right to Information (RTI) requests and reply times for ${d} district, ${s}.` },
  news:           { type: "Dataset", description: (d, s) => `Latest news and civic updates from ${d} district, ${s}.` },
};

export function generateModuleJsonLd(props: ModuleSchemaProps): object | null {
  const { module, stateSlug, districtSlug } = props;
  const info = MODULE_SCHEMA_TYPE[module];
  if (!info) return null;

  const districtName = getDistrict(stateSlug, districtSlug)?.name ?? props.districtName;
  const stateName = getState(stateSlug)?.name ?? props.stateName;
  const moduleLabel = getModule(module)?.label ?? module;
  const url = `${BASE_URL}/en/${stateSlug}/${districtSlug}/${module}`;

  if (info.type === "Dataset") {
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": `${districtName} — ${moduleLabel}`,
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
    "name": `${districtName} — ${moduleLabel}`,
    "description": info.description(districtName, stateName),
    "url": url,
    "provider": { "@type": "Organization", "name": "ForThePeople.in", "url": BASE_URL },
    "areaServed": { "@type": "AdministrativeArea", "name": districtName },
  };
}
