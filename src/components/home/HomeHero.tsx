/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeHero — Design v5.1 "Warm Calm"
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌───────────────────────────────────────────┬────────────────────────┐
//   │ • Your district. Your data. Your right.   │                        │
//   │ See what is happening in ▓your district▓  │   India map: states    │
//   │ Weather, dams, crop prices… (one line)    │   open their page,     │
//   │ [ 🔍 Type your district, e.g. Mysore    ] │   live districts ping; │
//   │ [Find your district] [⌖ Use my location]  │   tap one for its      │
//   │ (10 districts live)(7 states)(5,874 data  │   live facts           │
//   │  points)(36 dashboards each)(● Updated …) │                        │
//   └───────────────────────────────────────────┴────────────────────────┘
//   On a phone the map sits right under the hero text.
//
//  The page's ONE <h1> is the task, not the slogan (the slogan is the
//  small kicker above it). "Find your district" submits the search box
//  (empty box → the live districts as quick picks). "Use my location"
//  shows its result once, in the floating LocateResult card.
"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LocateFixed, Search } from "lucide-react";
import HomeSearch, { HOME_SEARCH_FORM_ID, HOME_SEARCH_ID } from "./HomeSearch";
import HeroStats from "./HeroStats";
import LocateResult from "./LocateResult";
import { useLocate } from "./useLocate";
import type { HomeDistrict, MapDistrictStat, PlatformStats } from "./home-types";
import styles from "./home.module.css";

// The map library touches `window`: load it in the browser only.
const HomeMap = dynamic(() => import("./HomeMap"), {
  ssr: false,
  loading: () => <div aria-hidden className={styles.mapLoading} />,
});

export interface HomeHeroProps {
  locale: string;
  stats: PlatformStats;
  districts: HomeDistrict[];
  mapStats: Record<string, MapDistrictStat>;
}

export default function HomeHero({ locale, stats, districts, mapStats }: HomeHeroProps) {
  const t = useTranslations("home");
  const tp = useTranslations("page_home");
  const tl = useTranslations("locate");
  const loc = useLocate();

  return (
    <div className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.kicker}>
          <span className={styles.kickerDot} aria-hidden />
          {t("kicker")}
        </p>
        <h1 className={styles.title}>{tp.rich("hero.title", { hl: (c) => <span className={styles.titleHl}>{c}</span> })}</h1>
        <p className={styles.lead}>{t("sources")}</p>

        <HomeSearch />

        <div className={styles.actions}>
          <button type="submit" form={HOME_SEARCH_FORM_ID} className={styles.btnPrimary}>
            <Search size={18} aria-hidden />
            {tp("hero.find")}
          </button>
          <button type="button" className={styles.btnOutline} onClick={loc.locate} disabled={loc.busy}>
            <LocateFixed size={18} aria-hidden />
            {loc.busy ? tl("findingYou") : tl("useLocation")}
          </button>
        </div>

        <HeroStats stats={stats} />
      </div>

      <div className={styles.heroMap}>
        <HomeMap locale={locale} districts={districts} stats={mapStats} />
      </div>

      {loc.status.kind !== "idle" && loc.status.kind !== "locating" && (
        <LocateResult
          floating
          status={loc.status}
          onClose={loc.reset}
          onRetry={loc.locate}
          onChooseInstead={() => {
            loc.reset();
            document.getElementById(HOME_SEARCH_ID)?.focus();
          }}
        />
      )}
    </div>
  );
}
