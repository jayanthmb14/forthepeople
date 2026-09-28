/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Home page — Design v5.1 "Warm Calm".
 *
 * The disclaimer line, header and footer come from [locale]/layout.tsx.
 * This page renders, top to bottom:
 *
 *   0. HomeIntro          — a 1.2 s branded loading moment, once per
 *                           session, skippable, off under reduced motion
 *   1. PriceTicker        — running prices: gold 24K/22K (per 10 g),
 *                           silver, petrol and diesel (Delhi), Sensex,
 *                           Nifty, dollar — each with its own date
 *   2. HomeHero           — kicker, the ONE <h1> (a task), search,
 *                           "Find your district" + "Use my location", the
 *                           colourful stats row; the clickable India map
 *                           beside it (under it on phones)
 *   3. IndiaGlance        — "Explore all of India": four checked national
 *                           figures and the big button
 *   4. LiveDistrictsCard  — the live districts as tight chips
 *   6. DataChecks         — how we get and check the data (4 steps)
 *   7. SupportBand        — the support ask with a few supporters' names
 *
 * Numbers: live districts and states from the District rows loaded here,
 * dashboards per district from the sidebar registry (getPlatformFacts),
 * everything else from the database (home-data.ts), the price snapshot the
 * /prices page uses, or the checked PPAC fuel snapshot (home-markets.ts).
 * Nothing is typed by hand; a missing row leaves its figure out. The rules that choose what is shown are in
 * home-picks.ts (tests/home.test.ts).
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { languageAlternates } from "@/i18n/seo";
import { routing } from "@/i18n/routing";

import PriceTicker from "@/components/home/PriceTicker";
import HomeIntro, { INTRO_SCRIPT } from "@/components/home/HomeIntro";
import { loadDataPointCount, loadIndiaFigures, loadMapStats, platformStats } from "@/components/home/home-data";
import { loadFuelFigures, loadMarketFigures } from "@/components/home/home-markets";
import HomeHero from "@/components/home/HomeHero";
import LiveDistrictsCard from "@/components/home/LiveDistrictsCard";
import IndiaGlance from "@/components/home/IndiaGlance";
import SupportBand from "@/components/home/SupportBand";
import DataChecks from "@/components/home/DataChecks";
import { getDistrict } from "@/lib/constants/districts";
import { placeName } from "@/i18n/place-name";
import styles from "@/components/home/home.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

// Rebuilt at most every 15 minutes: the prices (15 min in Next's data cache,
// home-markets.ts) and the "updated" time; district rows change rarely.
export const revalidate = 900;

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

  const [activeRows, glance, markets, fuel] = await Promise.all([
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
    loadFuelFigures(),
  ]);
  const liveRows = activeRows.map((d) => ({ id: d.id, slug: d.slug, stateSlug: d.state.slug, population: d.population }));
  const [mapStats, dataPoints] = await Promise.all([loadMapStats(liveRows), loadDataPointCount()]);
  const stats = platformStats(mapStats, dataPoints, liveRows);

  const activeDistricts = activeRows.map((d) => ({
    slug: d.slug,
    name: d.name,
    nameLocal: d.nameLocal,
    tagline: d.tagline,
    stateSlug: d.state.slug,
    stateName: d.state.name,
    goLiveDate: d.goLiveDate ? d.goLiveDate.toISOString() : null,
  }));

  // "Check this data" example: the live district with the newest data.
  const newestFirst = [...activeDistricts].sort(
    (a, b) =>
      (mapStats[`${b.stateSlug}/${b.slug}`]?.newest ?? "").localeCompare(mapStats[`${a.stateSlug}/${a.slug}`]?.newest ?? "") ||
      a.name.localeCompare(b.name),
  );
  const ex = newestFirst[0];
  const exReg = ex ? getDistrict(ex.stateSlug, ex.slug) : undefined;
  const example = ex ? { stateSlug: ex.stateSlug, slug: ex.slug, name: exReg ? placeName(exReg, locale) : ex.name } : null;

  return (
    <main role="main" className={styles.home}>
      {/* Decides, before the first paint, whether the 1.2 s intro plays. */}
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <HomeIntro />
      <PriceTicker locale={locale} markets={markets} fuel={fuel} />
      <div className={styles.heroBand}>
        <div className="ftp-container">
          <HomeHero locale={locale} stats={stats} districts={activeDistricts} mapStats={mapStats} />
        </div>
      </div>

      <IndiaGlance locale={locale} figures={glance} />
      <LiveDistrictsCard locale={locale} districts={activeDistricts} stats={mapStats} />
      <DataChecks locale={locale} example={example} />
      <SupportBand locale={locale} />
    </main>
  );
}
