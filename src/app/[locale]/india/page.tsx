/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 *
 * /[locale]/india — National Dashboard (Phase 4 redesign).
 *
 * Server-rendered. The hero + 10 super-category preview bands replace
 * the prior IndiaPage rendering. Layout chrome (HeaderBar, Footer,
 * site-wide DisclaimerBanner) is provided by [locale]/layout.tsx.
 *
 * Page-level ISR window: 15 min — re-evaluated whenever the snapshot
 * cache (Redis, file 31 §17) misses.
 */

import * as React from "react";
import type { Metadata } from "next";
import "@/app/india-mobile.css";
import { IndiaHero } from "@/components/india/sections/IndiaHero";
import { IndiaKpiStrip } from "@/components/india/sections/IndiaKpiStrip";
import { IndiaInTheWorldCard } from "@/components/india/sections/IndiaInTheWorldCard";
import { SuperCategoryPreviewBand } from "@/components/india/sections/SuperCategoryPreviewBand";
import { IndiaAtGlanceSection } from "@/components/india/sections/IndiaAtGlance";
import { KnowAboutIndiaSection } from "@/components/india/sections/KnowAboutIndia";
import { LivingStandardsSection } from "@/components/india/sections/LivingStandards";
import { WildlifeForestsSection } from "@/components/india/sections/WildlifeForests";
import { AgricultureLivestockSection } from "@/components/india/sections/AgricultureLivestock";
import { NaturalResourcesEnergySection } from "@/components/india/sections/NaturalResourcesEnergy";
import { InfrastructureSection } from "@/components/india/sections/Infrastructure";
import { GovernanceSection } from "@/components/india/sections/Governance";
import { InnovationSection } from "@/components/india/sections/Innovation";
import { CultureSection } from "@/components/india/sections/Culture";
import { SectionProgressBar } from "@/components/india/primitives/SectionProgressBar";
import { IndiaBreadcrumb } from "@/components/india/primitives/IndiaBreadcrumb";
import { PageEntryCurtain } from "@/components/india/primitives/PageEntryCurtain";
import { ScrollColorShift } from "@/components/india/primitives/ScrollColorShift";
import { LotusVineGarlandDivider } from "@/components/india/primitives/LotusVineGarlandDivider";
import { SectionDivider } from "@/components/india/primitives/SectionDivider";
import { LiveStrip } from "@/components/india/sections/LiveStrip";
import {
  getOrderedSuperCategories,
  getModulesForSuperCategory,
} from "@/lib/india/india-super-categories";
import { INDIA_MODULES } from "@/lib/india/india-modules";
import enDict from "@/dictionaries/en.json";
import knDict from "@/dictionaries/kn.json";
import bnDict from "@/dictionaries/bn.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const revalidate = 900; // 15 min

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}/india`;
  return {
    title: "India in One Page · ForThePeople.in",
    description:
      "Free national dashboard of India indicators — sourced from official " +
      "government portals under NDSAP. Independent citizen platform.",
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/india`,
        kn: `${BASE_URL}/kn/india`,
        bn: `${BASE_URL}/bn/india`,
      },
    },
    openGraph: { url, title: "India in One Page · ForThePeople.in" },
  };
}

export default async function IndiaRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const superCategories = getOrderedSuperCategories();

  // Map super-category slug → ScrollColorShift tint id (file 48 §Section 2.2).
  const TINT_BY_SC: Record<string, string> = {
    "macro-snapshot": "macro",
    "know-india": "know",
    "living-standards": "living",
    "wildlife-forests": "wildlife",
    "agriculture-livestock": "agriculture",
    "natural-resources-energy": "natural",
    infrastructure: "infra",
    governance: "governance",
    innovation: "innovation",
    culture: "culture",
  };
  const dict = locale === "kn" ? knDict : locale === "bn" ? bnDict : enDict;
  const indiaDict = (
    dict as {
      india?: {
        breadcrumb?: { home: string; india: string; selectModule: string };
        hero?: { eyebrow: string; motto: string; readPreamble: string };
      };
    }
  ).india;
  const breadcrumbDict = indiaDict?.breadcrumb;
  const heroDict = indiaDict?.hero;

  return (
    <main
      style={{
        // Background lives on <body> via var(--ftp-page-tint) so the
        // ScrollColorShift can transition it as the user scrolls.
        minHeight: "100vh",
        paddingBottom: "3rem",
      }}
    >
      {/* First-visit-per-session entrance curtain (saffron + green panels). */}
      <PageEntryCurtain />

      {/* Invisible client component — listens to which [data-tint-id] section
          is closest to viewport center and swaps --ftp-page-tint accordingly. */}
      <ScrollColorShift />

      {/* Sticky breadcrumb (top:56) + sticky scroll-progress bar (top:100). Both
          live above the inner padded container so they span the full viewport. */}
      <IndiaBreadcrumb locale={locale} dict={breadcrumbDict} />
      <SectionProgressBar />

      <div style={{ width: "100%", padding: "1rem 1rem 0" }}>
        <LiveStrip />
        <div data-tint-id="hero">
          <IndiaHero locale={locale} dict={heroDict} />
        </div>

        {/* Order per file 48 §Section 2.3: hero → KPI strip → rankings card
            → super-category bands. The TricolorBadgesPanel was retired here
            after the 4 #1 ranks it surfaced were absorbed into the rankings
            card; the component file remains for reuse on a future /almanac.
            Step 17: replaced the centered MiniHeritageSkylineDivider with a
            full-width LotusVineGarlandDivider — vine + lotus pattern that
            stretches edge-to-edge for a more textile-like ornamental feel. */}
        <LotusVineGarlandDivider />

        <div style={{ marginTop: "1rem" }}>
          <IndiaKpiStrip />
        </div>

        <IndiaInTheWorldCard />

        {/* Step 12: replace the legacy MughalArchDivider that sat between
            the IndiaInTheWorld card and the first super-category band
            (macro-snapshot) with a SectionDivider matching the v12
            inter-band design. This is the 10th divider — the page now
            has 1 hero→macro divider + 9 super-category transitions. */}
        <SectionDivider nextSlug="macro-snapshot" />

        <div style={{ marginTop: "2.5rem" }}>
          {superCategories.map((sc, i) => {
            const next = superCategories[i + 1];
            const divider = next ? (
              <SectionDivider nextSlug={next.slug} />
            ) : null;
            let band: React.ReactNode;
            if (sc.slug === "macro-snapshot") {
              // Step 4: macro-snapshot uses the magazine-spread band.
              // Its outer <section> already declares data-tint-id="macro",
              // so no wrapper div is needed (would double-tint the section).
              band = <IndiaAtGlanceSection locale={locale} />;
            } else if (sc.slug === "know-india") {
              // Step 7: know-india uses its own indigo magazine-spread band.
              band = <KnowAboutIndiaSection locale={locale} />;
            } else if (sc.slug === "living-standards") {
              // Step 8: living-standards uses its own teal band.
              band = <LivingStandardsSection locale={locale} />;
            } else if (sc.slug === "wildlife-forests") {
              // Step 8: wildlife-forests uses its own forest-green band
              // with a STATIC directory (3 modules, no marquee).
              band = <WildlifeForestsSection locale={locale} />;
            } else if (sc.slug === "agriculture-livestock") {
              // Step 9: agriculture-livestock — amber palette, 5-row marquee.
              band = <AgricultureLivestockSection locale={locale} />;
            } else if (sc.slug === "natural-resources-energy") {
              // Step 9: natural-resources-energy — oil-teal palette, 4-row marquee.
              band = <NaturalResourcesEnergySection locale={locale} />;
            } else if (sc.slug === "infrastructure") {
              // Step 10: infrastructure — charcoal palette, 6-row marquee.
              band = <InfrastructureSection locale={locale} />;
            } else if (sc.slug === "governance") {
              // Step 10: governance — deep navy palette, 10-row marquee.
              band = <GovernanceSection locale={locale} />;
            } else if (sc.slug === "innovation") {
              // Step 13: innovation — copper palette, 7-row marquee.
              band = <InnovationSection locale={locale} />;
            } else if (sc.slug === "culture") {
              // Step 13: culture — rose palette, STATIC 5-row directory.
              band = <CultureSection locale={locale} />;
            } else {
              band = (
                <div data-tint-id={TINT_BY_SC[sc.slug] ?? sc.slug}>
                  <SuperCategoryPreviewBand
                    superCategory={sc}
                    modules={getModulesForSuperCategory(sc.slug, INDIA_MODULES)}
                    bandIndex={i}
                    locale={locale}
                  />
                </div>
              );
            }
            return (
              <React.Fragment key={sc.slug}>
                {band}
                {divider}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </main>
  );
}
