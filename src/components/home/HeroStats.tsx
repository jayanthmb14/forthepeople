/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeroStats — "Your district data — tracked and checked", under the search
// ═══════════════════════════════════════════════════════════════════════
//
//   Your district data — tracked and checked
//   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
//   │    10    │ │    7     │ │    36    │ │  4,917   │ │ ● 1 hour ago │
//   │ districts│ │  states  │ │dashboards│ │data points│ │  last update │
//   │   live   │ │          │ │   each   │ │  tracked │ │              │
//   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘
//   (two tiles a row on phones; the last one takes the whole row)
//
//  The first dashboard's row of plain white number tiles: the number in
//  brand blue, a small grey label under it. The numbers count up once
//  (CountUp: the real value is in the HTML and for screen readers; no
//  motion under "reduce motion"). Where they come from
//  (home-data.ts → platformStats):
//    districts, states  the live District rows in the database (the same
//                       rows as the "Live districts" list)
//    dashboards         the district sidebar (DASHBOARDS_PER_DISTRICT)
//    data points        rows of district data held for the live districts,
//                       with the pages' own filters (no seeded demo rows)
//    last update        the newest weather reading / news story / dam or
//                       mandi row we collected — green dot for a day,
//                       amber when older
//  A figure that failed to load is left out, never shown as 0.
"use client";

import { useTranslations } from "next-intl";
import { Clock3, Database, LayoutGrid, Map as MapIcon, MapPin } from "lucide-react";
import { useFormat } from "@/i18n/client";
import CountUp from "./CountUp";
import { useMinute } from "./home-clock";
import type { PlatformStats } from "./home-types";
import styles from "./home.module.css";

/** "Last update" is fresh (green dot) for a day, like the live-district dots; older is amber. */
const FRESH_MS = 24 * 60 * 60 * 1000;

export default function HeroStats({ stats }: { stats: PlatformStats }) {
  const t = useTranslations("page_home");
  const f = useFormat();
  const minute = useMinute();

  const tiles: Array<{ key: string; icon: React.ReactNode; n: number; label: string }> = [];
  if (stats.activeDistricts > 0) {
    tiles.push({ key: "districts", icon: <MapPin size={14} aria-hidden />, n: stats.activeDistricts, label: t("stats.districts", { n: stats.activeDistricts }) });
  }
  if (stats.activeStates > 0) {
    tiles.push({ key: "states", icon: <MapIcon size={14} aria-hidden />, n: stats.activeStates, label: t("stats.states", { n: stats.activeStates }) });
  }
  if (stats.modulesPerDistrict > 0) {
    tiles.push({ key: "dashboards", icon: <LayoutGrid size={14} aria-hidden />, n: stats.modulesPerDistrict, label: t("stats.dashboards") });
  }
  if (stats.dataPoints !== null) {
    tiles.push({ key: "points", icon: <Database size={14} aria-hidden />, n: stats.dataPoints, label: t("stats.dataPoints") });
  }

  const last = stats.lastUpdate ? new Date(stats.lastUpdate) : null;
  const fresh = last && minute !== null ? minute - last.getTime() < FRESH_MS : true;

  if (tiles.length === 0 && !last) return null;
  return (
    <div className={styles.statsBox} data-tour="home-stats">
      <p className={styles.statsLine}>{t.rich("stats.line", { b: (c) => <strong>{c}</strong> })}</p>
      <ul className={styles.stats} aria-label={t("stats.aria")}>
        {tiles.map((c) => (
          <li key={c.key} className={styles.stat}>
            <CountUp value={c.n} className={styles.statNum} />
            <span className={styles.statLabel}>
              <span className={styles.statIcon}>{c.icon}</span>
              {c.label}
            </span>
          </li>
        ))}
        {last && (
          <li className={`${styles.stat} ${styles.statWhen}`} data-fresh={fresh ? "true" : "false"}>
            <span className={styles.statAgo}>
              <span className={styles.statDot} aria-hidden />
              {minute === null
                ? t("stats.when", { time: f.time(last, { hour: "numeric", minute: "2-digit" }), date: f.date(last, { day: "numeric", month: "short" }) })
                : f.ago(last)}
            </span>
            <span className={styles.statLabel}>
              <span className={styles.statIcon}>
                <Clock3 size={14} aria-hidden />
              </span>
              {t("stats.lastUpdate")}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
