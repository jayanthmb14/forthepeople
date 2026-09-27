/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeHero — Design v5 "calm"
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌────────────────────────────────────────────┬──────────────────────┐
//   │ Your district. Your data. Your right.      │                      │
//   │ See what is happening in your district     │   India map, live    │
//   │ Weather, dams, crop prices… (sources line) │   districts as dots  │
//   │ [ 🔍 Type your district, e.g. Mysore     ] │   (tablet and PC)    │
//   │ [Explore all of India]  [Use my location]  │                      │
//   │ 10 districts live in 7 states · 36 …       │                      │
//   └────────────────────────────────────────────┴──────────────────────┘
//
//  The page's ONE <h1> is the task, not the slogan (the slogan is the
//  small kicker above it). "Explore all of India" is the filled, most
//  prominent button; "Use my location" is the outline one. Its result
//  shows once, in the floating LocateResult card.
//
//  Counts come from the registry through the page (getPlatformFacts),
//  never typed by hand.
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, LocateFixed } from "lucide-react";
import { useFormat } from "@/i18n/client";
import HomeSearch, { HOME_SEARCH_ID } from "./HomeSearch";
import LocateResult from "./LocateResult";
import { useLocate } from "./useLocate";
import styles from "./home.module.css";

// The map library touches `window`; it is also only wanted on wider screens.
const HomeMap = dynamic(() => import("./HomeMap"), {
  ssr: false,
  loading: () => <div aria-hidden className={styles.mapLoading} />,
});

const WIDE = "(min-width: 768px)";
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export interface HomeHeroProps {
  locale: string;
  activeDistricts: number;
  activeStates: number;
  modulesPerDistrict: number;
}

export default function HomeHero({ locale, activeDistricts, activeStates, modulesPerDistrict }: HomeHeroProps) {
  const t = useTranslations("home");
  const tl = useTranslations("locate");
  const f = useFormat();
  const loc = useLocate();
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);

  return (
    <div className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.lead}>{t("sources")}</p>

        <HomeSearch />

        <div className={styles.actions}>
          <Link href={`/${locale}/india`} className={styles.btnPrimary}>
            {t("exploreIndia")}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <button type="button" className={styles.btnOutline} onClick={loc.locate} disabled={loc.busy}>
            <LocateFixed size={18} aria-hidden />
            {loc.busy ? tl("findingYou") : tl("useLocation")}
          </button>
        </div>

        <p className={styles.stats}>
          {t("statsLine", { districts: activeDistricts, states: activeStates, modules: f.number(modulesPerDistrict) })}
        </p>
      </div>

      <div className={styles.heroMap}>{wide && <HomeMap locale={locale} />}</div>

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
