/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeHero — Design v4
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌──────────────────────────────────────┬──────────────────────────┐
//   │ 🇮🇳 Free and open source             │                          │
//   │ 📍 Your district.                     │      India map card      │
//   │ 📊 Your data.                         │   (children, live pins)  │
//   │ ⚖️ Your right.                        │                          │
//   │ lead sentence                        │                          │
//   │ [📍 Go to my location] status        │                          │
//   │ [🗺️ Explore India] [🔍 Search]        │                          │
//   │ 🏙️ 10   📊 36   🔢 2,588   🚀 770    │                          │
//   └──────────────────────────────────────┴──────────────────────────┘
//
//  The page's ONE <h1>. Numbers come from the server (registry / DB),
//  never typed by hand. Each stat tile carries its own hue so the row is
//  colourful; they count up once (StatTile → CountUp).
"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { AsOfText, CountUp } from "@/components/district/ui";
import { DISTRICT_SEARCH_ID } from "./HeaderBar";
import YourDistrictBand from "./YourDistrictBand";
import styles from "./home.module.css";

export interface HomeHeroProps {
  locale: string;
  /** e.g. "10 districts across 7 states" — computed on the server. */
  coveragePhrase: string;
  modulesPerDistrict: number;
  activeCount: number;
  totalDataPoints: number | null;
  mostRecentAt: string | null;
  comingDistricts: number;
  /** The map card, rendered on the right (below on phones). */
  children?: React.ReactNode;
}

function focusDistrictSearch() {
  const input = document.getElementById(DISTRICT_SEARCH_ID) as HTMLInputElement | null;
  if (!input) return;
  window.scrollTo({ top: 0, behavior: "auto" });
  input.focus();
}

export default function HomeHero({
  locale,
  coveragePhrase,
  modulesPerDistrict,
  activeCount,
  totalDataPoints,
  mostRecentAt,
  comingDistricts,
  children,
}: HomeHeroProps) {
  return (
    <div className={styles.heroV4}>
      <div className={styles.heroLeft}>
        <p className={`${styles.heroPill} ftp-pop`} style={{ ["--i" as string]: 0 }}>
          <span className="ftp-emoji" aria-hidden>🇮🇳</span>
          Free and open source, for every citizen
        </p>

        {/* Three lines, each with its own picture: a place, a chart, a
            balance. The emoji pop in one after another; the words read the
            same with or without them (the emoji are aria-hidden). */}
        <h1 className={styles.heroTitle}>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 1 }}>
            <span className={`${styles.heroMark} ftp-hue-orange ftp-pop`} aria-hidden style={{ ["--i" as string]: 2 }}>📍</span>
            Your district.
          </span>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 2 }}>
            <span className={`${styles.heroMark} ftp-hue-blue ftp-pop`} aria-hidden style={{ ["--i" as string]: 3 }}>📊</span>
            Your data.
          </span>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 3 }}>
            <span className={`${styles.heroMark} ftp-hue-green ftp-pop`} aria-hidden style={{ ["--i" as string]: 4 }}>⚖️</span>
            Your right.
          </span>
        </h1>

        <p className={`${styles.heroLeadV4} ftp-rise`} style={{ ["--i" as string]: 4 }}>
          Free, source-linked government data for {coveragePhrase}. Weather, dams, crop prices, budgets, schools
          and more: {modulesPerDistrict} dashboards for every district, in plain words.
        </p>

        <div className="ftp-rise" style={{ ["--i" as string]: 5 }}>
          <YourDistrictBand locale={locale} variant="hero" />
        </div>

        <div className={`${styles.heroActionsV4} ftp-rise`} style={{ ["--i" as string]: 6 }}>
          <Link href={`/${locale}/india`} className={styles.heroBtnDark}>
            <span className="ftp-emoji" aria-hidden>🗺️</span>
            Explore all of India
          </Link>
          <button type="button" onClick={focusDistrictSearch} className={styles.heroBtnGhost}>
            <Search size={16} aria-hidden />
            Search a district
          </button>
        </div>

        <h2 className="sr-only">Platform in numbers</h2>
        <ul className={styles.heroStats}>
          <HeroStat i={7} hue="blue" emoji="🏙️" value={activeCount.toLocaleString("en-IN")} label="districts live" />
          <HeroStat i={8} hue="violet" emoji="📊" value={modulesPerDistrict.toLocaleString("en-IN")} label="dashboards each" />
          <HeroStat
            i={9}
            hue="green"
            emoji="🔢"
            value={totalDataPoints !== null ? totalDataPoints.toLocaleString("en-IN") : "—"}
            label="data points"
            asOf={totalDataPoints !== null ? mostRecentAt : null}
          />
          <HeroStat i={10} hue="orange" emoji="🚀" value={comingDistricts.toLocaleString("en-IN")} label="districts coming" />
        </ul>
      </div>

      <div className={`${styles.heroRight} ftp-rise`} style={{ ["--i" as string]: 3 }}>
        {children}
      </div>
    </div>
  );
}

/** Compact hero number: emoji chip, big number, short label under it. */
function HeroStat({
  i,
  hue,
  emoji,
  value,
  label,
  asOf,
}: {
  i: number;
  hue: string;
  emoji: string;
  value: string;
  label: string;
  asOf?: string | null;
}) {
  return (
    <li className={`${styles.heroStat} ftp-hue-${hue} ftp-rise`} style={{ ["--i" as string]: i }}>
      <span className={`${styles.heroStatEmoji} ftp-emoji`} aria-hidden>
        {emoji}
      </span>
      <span className={styles.heroStatValue}>
        <CountUp value={value} />
      </span>
      <span className={styles.heroStatLabel}>{label}</span>
      {asOf && (
        <span className={styles.heroStatAsOf}>
          <AsOfText asOf={asOf} />
        </span>
      )}
    </li>
  );
}
