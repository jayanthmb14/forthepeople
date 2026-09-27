/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Per-module deep-dive route — /[locale]/india/[moduleSlug].
 *
 * Renders the ModulePage shell for any registered module (live or coming
 * soon); Wildlife/Tigers uses the Phase 4 DataModulePage pattern. Returns
 * 404 for unknown slugs. Static-generates the English pages at build time.
 *
 * Text comes from the "page_india-module" and "page_india" namespaces
 * (module titles, taglines and descriptions are translated there and fall
 * back to the registry's English). The JSON-LD Dataset keeps the English
 * registry text: it is machine-read metadata, not page copy.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { INDIA_MODULES, getIndiaModuleBySlug } from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { languageAlternates } from "@/i18n/seo";
import { routing } from "@/i18n/routing";
import ModulePage from "@/components/india/module-page/ModulePage";
import { DataModulePage } from "@/components/india/sections/DataModulePage";
import { INDIA_NS, indiaText } from "@/components/india/i18n";

// Phase 4.4: Wildlife/Tigers is the canonical validation case for the
// data-module deep-dive pattern (all 8 authenticity moves). The other
// modules render through ModulePage.
const PHASE_4_NEW_PATTERN_SLUGS = new Set<string>(["wildlife-tigers"]);

/** Methodology rows for the tigers page: translation keys + source PDFs. */
const WILDLIFE_TIGERS_METHODOLOGY = [
  { key: "camera", pdfUrl: "https://ntca.gov.in/Status-of-Tigers-2022.pdf" },
  { key: "meaning" },
  { key: "gaps" },
  { key: "report", pdfUrl: "https://ntca.gov.in/Status-of-Tigers-2022.pdf" },
];

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const revalidate = 900; // 15 min ISR

export function generateStaticParams() {
  // Every routed language × every module. The [locale] layout sets
  // `dynamicParams = false`, so a pair missing from this list is a 404:
  // listing only "en" here made every /kn/india/<module> page 404.
  return routing.locales.flatMap((locale) => INDIA_MODULES.map((m) => ({ locale, moduleSlug: m.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; moduleSlug: string }>;
}): Promise<Metadata> {
  const { locale, moduleSlug } = await params;
  const mod = getIndiaModuleBySlug(moduleSlug);
  if (!mod) return {};
  const [t, tp, ti] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-module" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
  ]);
  const x = indiaText(tp, ti);
  const sources = mod.sources
    .map((s) => INDIA_SOURCES[s.sourceKey]?.name ?? s.sourceKey)
    .slice(0, 3)
    .join(", ");
  const title = t("meta.title", { module: x.moduleTitle(mod) });
  const description = t("meta.description", { tagline: x.moduleTagline(mod), sources });
  const alternates = languageAlternates(`/india/${mod.slug}`, locale);

  return {
    title,
    description,
    keywords: [mod.title, `India ${mod.category}`, `${mod.title} India statistics`, "ForThePeople.in", "India open data", "NDSAP"],
    alternates,
    openGraph: { title, description, url: alternates.canonical, siteName: "ForThePeople.in", type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function ModuleRoute({
  params,
}: {
  params: Promise<{ locale: string; moduleSlug: string }>;
}) {
  const { locale, moduleSlug } = await params;
  setRequestLocale(locale);
  const mod = getIndiaModuleBySlug(moduleSlug);
  if (!mod) notFound();

  // schema.org/Dataset JSON-LD — makes the module page eligible for
  // Google Dataset Search (file 31 §18 + Phase 2.5f).
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: mod.title,
    description: mod.description,
    url: `${BASE_URL}/${locale}/india/${mod.slug}`,
    keywords: [mod.title, `India ${mod.category}`, "ForThePeople.in", "NDSAP"],
    license: "https://data.gov.in/national-data-sharing-and-accessibility-policy-ndsap-0",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "ForThePeople.in", url: BASE_URL },
    distribution: mod.sources
      .map((s) => {
        const src = INDIA_SOURCES[s.sourceKey];
        return src ? { "@type": "DataDownload", contentUrl: src.url, name: src.name } : null;
      })
      .filter(Boolean),
  };

  const jsonLd = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
  );

  if (PHASE_4_NEW_PATTERN_SLUGS.has(mod.slug) && mod.slug === "wildlife-tigers") {
    return (
      <>
        {jsonLd}
        <DataModulePage
          module={mod}
          locale={locale}
          headlineMetricKey="tiger_population_total"
          expectedCadence="quadrennial"
          scraperKey="ntca-tigers"
          methodologyRows={WILDLIFE_TIGERS_METHODOLOGY}
          methodologyNamespace="tigers"
          supportingMetricKeys={["tiger_reserves_count", "reserve_area_protected_sqkm"]}
        />
      </>
    );
  }

  return (
    <>
      {jsonLd}
      <ModulePage locale={locale} module={mod} />
    </>
  );
}
