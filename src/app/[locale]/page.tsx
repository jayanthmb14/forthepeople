/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Home page — Design v4 "Rang".
 *
 * The disclaimer line, header and footer come from [locale]/layout.tsx.
 * This page renders, top to bottom:
 *
 *   0. IntroSplash         — 2 s opening, once per session (skippable)
 *   1. MarketTicker        — markets line, "As of HH:MM IST"
 *   2. HomeHero            — the ONE <h1>, "Go to my location", four
 *                            numbers, and the India map on the right
 *   3. LiveDistrictsCard   — colourful grid of live districts + vote card
 *   4. The rest            — Latest data, How it works, Built with
 *                            citizens, support band
 *
 * Numbers: district counts come from the DB / registry (never typed by
 * hand); the data-point total carries an "As of" date from the newest
 * record. If homepage-stats is unreachable the total shows "—", never 0.
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCoveragePhrase, getPlatformFacts } from "@/lib/platform-facts";

import MarketTicker from "@/components/home/MarketTicker";
import IntroSplash from "@/components/home/IntroSplash";
import HomeHero from "@/components/home/HomeHero";
import IndiaMapCard from "@/components/home/IndiaMapCard";
import LiveDistrictsCard from "@/components/home/LiveDistrictsCard";
import LatestData from "@/components/home/LatestData";
import HowItWorks from "@/components/home/HowItWorks";
import BuiltWithCitizens from "@/components/home/BuiltWithCitizens";
import SupportLine from "@/components/home/SupportLine";
import styles from "@/components/home/home.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

interface HomepageStats {
  activeDistricts: number;
  totalDataPoints: number;
  mostRecentAt: string | null;
}

/** Cached (5 min) platform totals. Null when the endpoint is unreachable. */
async function fetchHomepageStats(): Promise<HomepageStats | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/data/homepage-stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Partial<HomepageStats>;
    return {
      activeDistricts: json.activeDistricts ?? 0,
      totalDataPoints: json.totalDataPoints ?? 0,
      mostRecentAt: json.mostRecentAt ?? null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = `${BASE_URL}/${locale}`;
  return {
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en`,
        kn: `${BASE_URL}/kn`,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: { url },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Server-side fetch (single round trip) — feeds the body components.
  const [activeRows, statsFromApi] = await Promise.all([
    prisma.district.findMany({
      where: { active: true },
      select: {
        slug: true,
        name: true,
        nameLocal: true,
        tagline: true,
        goLiveDate: true,
        state: { select: { slug: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    fetchHomepageStats(),
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

  // Totals: DB / registry first, homepage-stats for what only it knows.
  const facts = getPlatformFacts();
  const activeCount = statsFromApi?.activeDistricts || activeRows.length;
  const comingDistricts = Math.max(0, facts.totalIndiaDistricts - activeCount);
  const totalDataPoints = statsFromApi && statsFromApi.totalDataPoints > 0 ? statsFromApi.totalDataPoints : null;
  const mostRecentAt = statsFromApi?.mostRecentAt ?? null;

  return (
    <main role="main" className="ftp-home">
      {/* Once-per-session opening (Design v4). Off for reduced motion / no JS. */}
      <IntroSplash />

      <MarketTicker />

      <div className={styles.flow}>
        {/* 1. Hero: the one <h1>, "Go to my location", numbers, India map */}
        <div className={`${styles.band} ${styles.bandHero}`}>
          <div className="ftp-container">
            <HomeHero
              locale={locale}
              coveragePhrase={getCoveragePhrase()}
              modulesPerDistrict={facts.modulesPerDistrict}
              activeCount={activeCount}
              totalDataPoints={totalDataPoints}
              mostRecentAt={mostRecentAt}
              comingDistricts={comingDistricts}
            >
              <IndiaMapCard locale={locale} />
            </HomeHero>
          </div>
        </div>

        {/* 2. Live districts: a colourful grid, newest first */}
        <div className={`${styles.band} ${styles.bandDistricts}`}>
          <LiveDistrictsCard locale={locale} districts={activeDistricts} />
        </div>

        {/* 3. The rest of the page */}
        <div className={`${styles.band} ${styles.bandRest}`}>
          <LatestData locale={locale} districts={activeDistricts} />
          <HowItWorks />
          <BuiltWithCitizens locale={locale} />
          <SupportLine locale={locale} />
        </div>
      </div>
    </main>
  );
}
