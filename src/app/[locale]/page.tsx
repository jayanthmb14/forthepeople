/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Home page — Design v5 "calm".
 *
 * The disclaimer line, header and footer come from [locale]/layout.tsx.
 * This page renders, top to bottom:
 *
 *   1. HomeHero           — kicker, the ONE <h1> (a task), sources line,
 *                           district search, "Explore all of India"
 *                           (primary) and "Use my location", one stats
 *                           line; the India map on the right (tablet, PC)
 *   2. LiveDistrictsCard  — the live districts as equal cards + a small
 *                           "Is your district next?" card
 *   3. IndiaGlance        — "India at a glance": headline national
 *                           figures, each with source and date
 *   4. PricesToday        — gold, silver, Sensex, Nifty, US dollar
 *   5. SupportLine        — one quiet line
 *
 * Numbers: district and state counts come from the registry
 * (getPlatformFacts), national figures from IndiaIndicator rows. Nothing
 * is typed by hand; a missing row simply leaves its figure out.
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import { routing } from "@/i18n/routing";

import PriceTicker from "@/components/home/PriceTicker";
import HomeIntro, { INTRO_SCRIPT } from "@/components/home/HomeIntro";
import { loadCropTicks, loadIndiaFigures, loadMapStats, loadMarketFigures, loadPlatformStats } from "@/components/home/home-data";
import HomeHero from "@/components/home/HomeHero";
import LiveDistrictsCard from "@/components/home/LiveDistrictsCard";
import IndiaGlance from "@/components/home/IndiaGlance";
import PricesToday from "@/components/home/PricesToday";
import SupportLine from "@/components/home/SupportLine";
import styles from "@/components/home/home.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

// District rows and national figures change rarely; refresh hourly.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}`;
  // English keeps the root layout's title and description (unchanged SEO).
  // Other languages get them from their messages (docs/I18N.md §5), e.g.
  // "ForThePeople.in — आपका जिला। आपका डेटा। आपका अधिकार।" on /hi.
  if (locale !== routing.defaultLocale) {
    const ts = await getTranslations({ locale, namespace: "site" });
    const ti = await getTranslations({ locale, namespace: "intro" });
    const title = `${ts("name")} — ${ts("tagline")}`;
    const description = ti("sub");
    return {
      title: { absolute: title },
      description,
      alternates: languageAlternates("", locale),
      openGraph: { url, title, description },
    };
  }
  return {
    alternates: languageAlternates("", locale),
    openGraph: { url },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Static rendering with translations: the page names its locale.
  setRequestLocale(locale);

  const [activeRows, glance, markets] = await Promise.all([
    prisma.district.findMany({
      where: { active: true },
      select: {
        id: true,
        population: true,
        slug: true,
        name: true,
        nameLocal: true,
        tagline: true,
        goLiveDate: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    loadIndiaFigures(),
    loadMarketFigures(),
  ]);
  const liveRows = activeRows.map((d) => ({ id: d.id, slug: d.slug, stateSlug: d.state.slug, population: d.population }));
  const [crops, mapStats, stats] = await Promise.all([
    loadCropTicks(liveRows),
    loadMapStats(liveRows),
    loadPlatformStats(liveRows.map((d) => d.id)),
  ]);

  const activeDistricts = activeRows.map((d) => ({
    slug: d.slug,
    name: d.name,
    nameLocal: d.nameLocal,
    tagline: d.tagline,
    stateSlug: d.state.slug,
    stateName: d.state.name,
    goLiveDate: d.goLiveDate ? d.goLiveDate.toISOString() : null,
  }));

  return (
    <main role="main" className={styles.home}>
      {/* Decides, before the first paint, whether the 1.2 s intro plays. */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <HomeIntro />
      <PriceTicker locale={locale} markets={markets} crops={crops} />
      <div className={styles.heroBand}>
        <div className="ftp-container">
          <HomeHero locale={locale} stats={stats} districts={activeDistricts} mapStats={mapStats} />
        </div>
      </div>

      <IndiaGlance locale={locale} figures={glance} />
      <LiveDistrictsCard locale={locale} districts={activeDistricts} />
      <PricesToday />
      <SupportLine locale={locale} />
    </main>
  );
}
