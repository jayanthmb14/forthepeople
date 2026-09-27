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
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { AsOfText, CountUp } from "@/components/district/ui";
const DISTRICT_SEARCH_ID = "ftp-district-search"; // replaced by the hero search box in the next step
import YourDistrictBand from "./YourDistrictBand";
import styles from "./home.module.css";

export interface HomeHeroProps {
  locale: string;
  /** Number of states with a live district (registry). */
  activeStates: number;
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
  activeStates,
  modulesPerDistrict,
  activeCount,
  totalDataPoints,
  mostRecentAt,
  comingDistricts,
  children,
}: HomeHeroProps) {
  const t = useTranslations("home");
  const ti = useTranslations("intro");
  const f = useFormat();
  return (
    <div className={styles.heroV4}>
      <div className={styles.heroLeft}>
        <p className={`${styles.heroPill} ftp-pop`} style={{ ["--i" as string]: 0 }}>
          <span className="ftp-emoji" aria-hidden>🇮🇳</span>
          {t("pill")}
        </p>

        {/* Three lines, each with its own picture: a place, a chart, a
            balance. The emoji pop in one after another; the words read the
            same with or without them (the emoji are aria-hidden). */}
        <h1 className={styles.heroTitle}>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 1 }}>
            <span className={`${styles.heroMark} ftp-hue-orange ftp-pop`} aria-hidden style={{ ["--i" as string]: 2 }}>📍</span>
            {ti("line1")}
          </span>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 2 }}>
            <span className={`${styles.heroMark} ftp-hue-blue ftp-pop`} aria-hidden style={{ ["--i" as string]: 3 }}>📊</span>
            {ti("line2")}
          </span>
          <span className={`${styles.heroLine} ftp-rise`} style={{ ["--i" as string]: 3 }}>
            <span className={`${styles.heroMark} ftp-hue-green ftp-pop`} aria-hidden style={{ ["--i" as string]: 4 }}>⚖️</span>
            {ti("line3")}
          </span>
        </h1>

        <p className={`${styles.heroLeadV4} ftp-rise`} style={{ ["--i" as string]: 4 }}>
          {t("lead", { coverage: t("coverage", { districts: activeCount, states: activeStates }), modules: modulesPerDistrict })}
        </p>

        <div className="ftp-rise" style={{ ["--i" as string]: 5 }}>
          <YourDistrictBand locale={locale} variant="hero" />
        </div>

        <div className={`${styles.heroActionsV4} ftp-rise`} style={{ ["--i" as string]: 6 }}>
          <Link href={`/${locale}/india`} className={styles.heroBtnDark}>
            <span className="ftp-emoji" aria-hidden>🗺️</span>
            {t("exploreIndia")}
          </Link>
          <button type="button" onClick={focusDistrictSearch} className={styles.heroBtnGhost}>
            <Search size={16} aria-hidden />
            {t("searchDistrict")}
          </button>
        </div>

        <h2 className="sr-only">{t("statsHeading")}</h2>
        <ul className={styles.heroStats}>
          <HeroStat i={7} hue="blue" emoji="🏙️" value={f.number(activeCount)} label={t("statDistricts")} />
          <HeroStat i={8} hue="violet" emoji="📊" value={f.number(modulesPerDistrict)} label={t("statDashboards")} />
          <HeroStat
            i={9}
            hue="green"
            emoji="🔢"
            value={totalDataPoints !== null ? f.number(totalDataPoints) : "—"}
            label={t("statDataPoints")}
            asOf={totalDataPoints !== null ? mostRecentAt : null}
          />
          <HeroStat i={10} hue="orange" emoji="🚀" value={f.number(comingDistricts)} label={t("statComing")} />
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
