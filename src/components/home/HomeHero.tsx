/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeHero — the top of the home page (Design v5.6, "mostly white")
// ═══════════════════════════════════════════════════════════════════════
//
//        Your district. Your **data**. Your right. 🇮🇳
//     India's first free, real-time district transparency platform.
//        [ 🔍 Type your district, e.g. Mysore            ]
//          [Find your district]  [⌖ Use my location]
//
//   Your district data — tracked and checked
//   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌──────────────┐
//   │  10   │ │   7   │ │  36   │ │ 4,750 │ │ ● 2 hours ago│   (HeroStats)
//   └───────┘ └───────┘ └───────┘ └───────┘ └──────────────┘
//
//   ┌ India, live ─────────────────────┐ ┌ Live districts (10) ─────┐
//   │                                  │ │ (art) Pune पुणे       C+ │
//   │   the clickable India map        │ │ (art) Lucknow लखनऊ    C  │
//   │   (states open their page,       │ │ …                        │
//   │    pins = live districts)        │ │ Is your district next? → │
//   └──────────────────────────────────┘ └──────────────────────────┘
//
//  The page's first dashboard look (centred title, a row of plain white
//  number tiles, the big map with the districts beside it) with the new
//  map, search and "Use my location". On tablets and phones the districts
//  list sits under the map. `side` is the districts panel (a server-built
//  element passed in by the page).
//
//  The page's ONE <h1> is the June 2026 headline, word for word, with
//  "data" in brand blue (colour only — no highlighter stroke) and the
//  Indian flag after it: the flag is the only emoji on the page, an
//  owner-approved exception to the emoji rule (docs/DESIGN-SYSTEM.md §4),
//  read out as "India". The June subtitle sits under it. "Find your district" submits the
//  search box (empty box → the live districts as quick picks). "Use my
//  location" shows its result once, in the floating LocateResult card.
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
  /** The live districts panel shown beside (or under) the map. */
  side?: React.ReactNode;
}

export default function HomeHero({ locale, stats, districts, mapStats, side }: HomeHeroProps) {
  const tp = useTranslations("page_home");
  const tl = useTranslations("locate");
  const loc = useLocate();

  return (
    <div className={styles.hero}>
      <div className={styles.heroText}>
        <h1 className={styles.title}>
          {tp.rich("hero.headline", { hl: (c) => <span className={styles.titleHl}>{c}</span> })}{" "}
          <span role="img" aria-label={tp("hero.flag")} className={styles.titleFlag}>
            🇮🇳
          </span>
        </h1>
        <p className={styles.lead}>{tp("hero.sub")}</p>

        <div className={styles.heroSearch} data-tour="home-search">
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
        </div>
      </div>

      <HeroStats stats={stats} />

      <div className={styles.mapRow} data-tour="home-map">
        <div className={styles.heroMap}>
          <HomeMap locale={locale} districts={districts} stats={mapStats} />
        </div>
        {side && <div className={styles.mapSide}>{side}</div>}
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
