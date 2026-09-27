/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Home page — Design v3 "Civic Ledger" (CONCEPT-v3 §5 "Home").
 *
 * The disclaimer line, header and footer come from [locale]/layout.tsx.
 * This page renders, top to bottom (desktop):
 *
 *   1. MarketTicker        — 32 px markets line, "As of HH:MM IST"
 *   2. YourDistrictStrip   — "Find my district" row (via YourDistrictBand)
 *   3. HomeHero            — the page's ONE <h1>, one sentence, two buttons
 *   4. Stats               — 4 StatTiles (registry + /api/data/homepage-stats)
 *   5. Map (cols 1–7) + LiveDistrictsCard (cols 8–12)
 *   6. The rest            — latest data, how it works, community, support
 *
 * On phones the order becomes: hero · strip · district list · map · stats ·
 * rest (CSS `order` in home.module.css — the HTML order stays logical for
 * screen readers and search engines).
 *
 * Numbers: district counts come from the DB / registry (never typed by
 * hand); the data-point total carries an "As of" date from the newest
 * record. If homepage-stats is unreachable the total shows "—", never 0.
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCoveragePhrase, getPlatformFacts } from "@/lib/platform-facts";
import { StatStrip, StatTile } from "@/components/district/ui";

import MarketTicker from "@/components/home/MarketTicker";
import YourDistrictBand from "@/components/home/YourDistrictBand";
import HomeHero from "@/components/home/HomeHero";
import IndiaMapCard from "@/components/home/IndiaMapCard";
import LiveDistrictsCard from "@/components/home/LiveDistrictsCard";
import LiveDataShowcase from "@/components/home/redesign-v2/LiveDataShowcase";
import HowItWorks from "@/components/home/redesign-v2/HowItWorks";
import CommunitySection from "@/components/home/redesign-v2/CommunitySection";
import SupportBanner from "@/components/home/redesign-v2/SupportBanner";
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
    <main role="main">
      <MarketTicker />

      <div className={styles.flow}>
        {/* 2. Your district — locate, remember, open or vote */}
        <div className={`${styles.band} ${styles.bandStrip}`}>
          <YourDistrictBand locale={locale} />
        </div>

        {/* 3. Hero — the one <h1> on the page */}
        <div className={`${styles.band} ${styles.bandHero}`}>
          <div className="ftp-container">
            <HomeHero locale={locale} coveragePhrase={getCoveragePhrase()} />
          </div>
        </div>

        {/* 4. Four honest numbers (no captions, no count-up) */}
        <div className={`${styles.band} ${styles.bandStats}`}>
          <div className="ftp-container">
            <h2 className="sr-only">Platform in numbers</h2>
            <StatStrip cols={4}>
              <StatTile label="Districts live" value={activeCount.toLocaleString("en-IN")} />
              <StatTile label="Dashboards per district" value={facts.modulesPerDistrict.toLocaleString("en-IN")} />
              <StatTile
                label="Data points tracked"
                value={totalDataPoints !== null ? totalDataPoints.toLocaleString("en-IN") : "—"}
                asOf={totalDataPoints !== null ? mostRecentAt : null}
              />
              <StatTile label="Districts coming" value={comingDistricts.toLocaleString("en-IN")} />
            </StatStrip>
          </div>
        </div>

        {/* 5. Map (cols 1–7) + live districts (cols 8–12) */}
        <div className={`${styles.band} ${styles.bandMap}`}>
          <div className={`ftp-container ftp-grid-12 ${styles.mapGrid}`}>
            <div className={styles.mapCol}>
              <IndiaMapCard locale={locale} />
            </div>
            <div className={styles.listCol}>
              <LiveDistrictsCard locale={locale} districts={activeDistricts} />
            </div>
          </div>
        </div>

        {/* 6. The rest of the page */}
        <div className={`${styles.band} ${styles.bandRest}`}>
          <LiveDataShowcase locale={locale} districts={activeDistricts} />
          <HowItWorks />
          <CommunitySection locale={locale} />
          <SupportBanner locale={locale} />
        </div>
      </div>
    </main>
  );
}
