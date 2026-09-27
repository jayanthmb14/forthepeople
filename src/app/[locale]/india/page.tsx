/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * /[locale]/india — National Dashboard.
 *
 * Server-rendered: hero, KPI strip, "India in the world" ranks, then the
 * ten super-category bands. Layout chrome (HeaderBar, Footer, site-wide
 * DisclaimerBanner) comes from [locale]/layout.tsx.
 *
 * i18n (Sep 2026): every string comes through next-intl — the shared
 * "india" key and the "page_india" namespace. The page used to pick
 * enDict / knDict by hand, which skipped the English fallback and any
 * language other than en/kn.
 *
 * v4.1 (Sep 2026): the page follows docs/LAYOUT.md — hero, then one
 * "In simple words" sentence (reference facts + registry counts), the
 * five number tiles, the "India in the world" ranks (each opens a detail
 * sheet), then the ten bands. Content sits in the 1320 px ModulePage
 * frame; every band has phone / tablet / laptop / PC layouts in its CSS
 * module (the phone carousel of the two right-hand cards is gone: they
 * stack, so nothing hides off the edge).
 *
 * Page-level ISR window: 15 min.
 */

import * as React from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/app/india-mobile.css";
import { IndiaHero } from "@/components/india/sections/IndiaHero";
import { IndiaKpiStrip, INDIA_REFERENCE } from "@/components/india/sections/IndiaKpiStrip";
import { ModulePage as PageFrame } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import { INDIA_MODULES } from "@/lib/india/india-modules";
import { fmtDecimal } from "@/components/india/format";
import { IndiaInTheWorldCard } from "@/components/india/sections/IndiaInTheWorldCard";
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
import { LotusVineGarlandDivider } from "@/components/india/primitives/LotusVineGarlandDivider";
import { SectionDivider } from "@/components/india/primitives/SectionDivider";
import { LiveStrip } from "@/components/india/sections/LiveStrip";
import { getOrderedSuperCategories } from "@/lib/india/india-super-categories";
import { languageAlternates } from "@/i18n/seo";
import { INDIA_NS } from "@/components/india/i18n";

export const revalidate = 900; // 15 min

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INDIA_NS });
  const alternates = languageAlternates("/india", locale);
  const title = t("meta.title");
  const description = t("meta.description");
  return { title, description, alternates, openGraph: { url: alternates.canonical, title, description } };
}

/** One band per super-category, in display order. */
const BANDS: Record<string, (props: { locale: string }) => Promise<React.ReactNode>> = {
  "macro-snapshot": IndiaAtGlanceSection,
  "know-india": KnowAboutIndiaSection,
  "living-standards": LivingStandardsSection,
  "wildlife-forests": WildlifeForestsSection,
  "agriculture-livestock": AgricultureLivestockSection,
  "natural-resources-energy": NaturalResourcesEnergySection,
  infrastructure: InfrastructureSection,
  governance: GovernanceSection,
  innovation: InnovationSection,
  culture: CultureSection,
};

export default async function IndiaRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: INDIA_NS });
  const superCategories = getOrderedSuperCategories().filter((sc) => BANDS[sc.slug]);

  // "In simple words": the reference facts on the tiles below + registry counts.
  const simple = t("overview.explain", {
    pop: fmtDecimal(locale, INDIA_REFERENCE.populationBillion, 2),
    states: INDIA_REFERENCE.states,
    uts: INDIA_REFERENCE.uts,
    total: INDIA_MODULES.length,
    live: INDIA_MODULES.filter((m) => m.status === "live").length,
  });

  return (
    <main className="ftp-hue-blue" style={{ minHeight: "100vh" }}>
      {/* Sticky breadcrumb (with the module picker) and the section progress bar. */}
      <IndiaBreadcrumb locale={locale} />
      <SectionProgressBar />

      <PageFrame>
        <LiveStrip locale={locale} />
        <div data-tint-id="hero">
          <IndiaHero locale={locale} />
        </div>

        <LotusVineGarlandDivider />

        <div style={{ marginTop: "1rem" }}>
          <Explainer>{simple}</Explainer>
          <IndiaKpiStrip />
        </div>

        <IndiaInTheWorldCard />

        <SectionDivider nextSlug="macro-snapshot" />

        <div style={{ marginTop: "2.5rem" }}>
          {superCategories.map((sc, i) => {
            const Band = BANDS[sc.slug];
            const next = superCategories[i + 1];
            return (
              <React.Fragment key={sc.slug}>
                <Band locale={locale} />
                {next ? <SectionDivider nextSlug={next.slug} /> : null}
              </React.Fragment>
            );
          })}
        </div>
      </PageFrame>
    </main>
  );
}
