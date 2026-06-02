/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 *
 * Per-module deep-dive route — /[locale]/india/[moduleSlug].
 *
 * Renders the full ModulePage shell for any registered module
 * (live or coming_soon). Returns 404 for unknown slugs. Static-generates
 * params for ALL 53 modules at build time so first-paint is fast.
 *
 * generateMetadata produces per-module SEO metadata (title, description,
 * OG, hreflang) — Phase 2.5f will extend with JSON-LD Dataset schema.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import enDict from "@/dictionaries/en.json";
import knDict from "@/dictionaries/kn.json";
import bnDict from "@/dictionaries/bn.json";
import {
  INDIA_MODULES,
  getIndiaModuleBySlug,
} from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import ModulePage from "@/components/india/module-page/ModulePage";
import { DataModulePage } from "@/components/india/sections/DataModulePage";

// Phase 4.4: Wildlife/Tigers is the canonical validation case for the
// new data-module deep-dive pattern. All 8 authenticity moves render here.
// Phase 5 will mechanically migrate the other 52 data modules to the same
// pattern; until then, those modules render via the legacy ModulePage shell.
const PHASE_4_NEW_PATTERN_SLUGS = new Set<string>(["wildlife-tigers"]);

const WILDLIFE_TIGERS_METHODOLOGY = [
  {
    title: "Camera-trap census methodology",
    body:
      "NTCA's All India Tiger Estimation uses camera traps deployed across tiger habitats nationwide. Individual tigers are identified by stripe patterns; population estimates combine direct camera-trap detections with sign-survey-based density extrapolation in unsampled areas. The 2022 cycle deployed cameras at 32,588 locations across 20 tiger-bearing states.",
    pdfUrl: "https://ntca.gov.in/Status-of-Tigers-2022.pdf",
  },
  {
    title: "What 'tiger population' means in this estimate",
    body:
      "The headline figure (3,682) is the upper bound of the All India Tiger Estimation 2022. NTCA also publishes a lower bound (3,167) and a midpoint. We surface the upper bound for clarity but link to the methodology PDF where the full confidence interval is documented.",
  },
  {
    title: "Confidence intervals and known gaps",
    body:
      "Habitats with sparse camera coverage carry wider uncertainty. Northeast India and parts of central India have lower sampling density. The 4-year cadence means inter-census change reflects both real population change and methodological refinements.",
  },
  {
    title: "Full methodology document",
    body: "NTCA Status of Tigers in India 2022 — official report PDF.",
    pdfUrl: "https://ntca.gov.in/Status-of-Tigers-2022.pdf",
  },
];

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const revalidate = 900; // 15 min ISR

export function generateStaticParams() {
  // Pre-render all 53 module routes for the en locale at build time.
  // (kn pages render on demand to keep the build matrix small.)
  return INDIA_MODULES.map((m) => ({ locale: "en", moduleSlug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; moduleSlug: string }>;
}): Promise<Metadata> {
  const { locale, moduleSlug } = await params;
  const mod = getIndiaModuleBySlug(moduleSlug);
  if (!mod) return {};

  const sourceNames = mod.sources
    .map((s) => INDIA_SOURCES[s.sourceKey]?.name ?? s.sourceKey)
    .slice(0, 3)
    .join(", ");
  const url = `${BASE_URL}/${locale}/india/${mod.slug}`;
  const title = `${mod.title} · India Statistics 2026 — ForThePeople.in`;
  const desc = `${mod.description.slice(0, 130)}${
    mod.description.length > 130 ? "…" : ""
  } Sourced from ${sourceNames}. Independent citizen platform.`;

  const keywords = [
    mod.title,
    `India ${mod.category}`,
    `${mod.title} India statistics`,
    `${mod.title} 2026`,
    `${mod.category} India data`,
    "ForThePeople.in",
    "India open data",
    "NDSAP",
    "government statistics India",
  ];

  return {
    title,
    description: desc,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/india/${mod.slug}`,
        kn: `${BASE_URL}/kn/india/${mod.slug}`,
        bn: `${BASE_URL}/bn/india/${mod.slug}`,
        "x-default": `${BASE_URL}/en/india/${mod.slug}`,
      },
    },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "ForThePeople.in",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: desc },
    robots: { index: true, follow: true },
  };
}

export default async function ModuleRoute({
  params,
}: {
  params: Promise<{ locale: string; moduleSlug: string }>;
}) {
  const { locale, moduleSlug } = await params;
  const mod = getIndiaModuleBySlug(moduleSlug);
  if (!mod) notFound();
  const dict = (locale === "kn" ? knDict : locale === "bn" ? bnDict : enDict).india;

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
    creator: {
      "@type": "Organization",
      name: "ForThePeople.in",
      url: BASE_URL,
    },
    distribution: mod.sources.map((s) => {
      const src = INDIA_SOURCES[s.sourceKey];
      return src
        ? {
            "@type": "DataDownload",
            contentUrl: src.url,
            name: src.name,
          }
        : null;
    }).filter(Boolean),
  };

  // Phase 4.4 branch: Wildlife/Tigers renders the new design. Other modules
  // keep their existing ModulePage rendering until Phase 5 migrates them.
  if (PHASE_4_NEW_PATTERN_SLUGS.has(mod.slug) && mod.slug === "wildlife-tigers") {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }}
        />
        <DataModulePage
          module={mod}
          locale={locale}
          headlineMetricKey="tiger_population_total"
          expectedCadence="quadrennial"
          scraperKey="ntca-tigers"
          methodologyRows={WILDLIFE_TIGERS_METHODOLOGY}
          supportingMetricKeys={["tiger_reserves_count", "reserve_area_protected_sqkm"]}
        />
      </>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }}
      />
      <ModulePage locale={locale} module={mod} disclaimers={dict.disclaimers} />
    </>
  );
}
