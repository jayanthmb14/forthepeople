/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeroStats — "Your district data — tracked and checked", under the search
// ═══════════════════════════════════════════════════════════════════════
//
//   Your district data — tracked and checked        ● Updated 1 hour ago
//   ┌───────────┐ ┌───────────┐ ┌─────────────┐ ┌──────────────────┐
//   │ (pin) 10  │ │ (map) 7   │ │ (grid) 36   │ │ (db) 4,917       │
//   │ districts │ │ states    │ │ dashboards  │ │ data points      │
//   │ live      │ │           │ │ each        │ │ tracked          │
//   └───────────┘ └───────────┘ └─────────────┘ └──────────────────┘
//   (two tiles per row on phones)
//
//  Each figure is a pastel tile in its own hue; the numbers count up once
//  (CountUp: the real value is in the HTML and for screen readers; no
//  motion under "reduce motion"). Where they come from
//  (home-data.ts → platformStats):
//    districts, states  the live District rows in the database (the same
//                       rows as the "Live districts" list)
//    dashboards         the district sidebar (DASHBOARDS_PER_DISTRICT)
//    data points        rows of district data held for the live districts,
//                       with the pages' own filters (no seeded demo rows)
//    updated            the newest weather reading / news story / dam or
//                       mandi row we collected
//  A figure that failed to load is left out, never shown as 0.
"use client";

import { useTranslations } from "next-intl";
import { Database, LayoutGrid, Map as MapIcon, MapPin } from "lucide-react";
import { useFormat } from "@/i18n/client";
import CountUp from "./CountUp";
import { useMinute } from "./home-clock";
import type { PlatformStats } from "./home-types";
import styles from "./home.module.css";

/** "Updated" is fresh (green dot) for a day, like the live-district dots; older is amber. */
const FRESH_MS = 24 * 60 * 60 * 1000;

export default function HeroStats({ stats }: { stats: PlatformStats }) {
  const t = useTranslations("page_home");
  const f = useFormat();
  const minute = useMinute();

  const tiles: Array<{ key: string; hue: string; icon: React.ReactNode; n: number; label: string }> = [];
  if (stats.activeDistricts > 0) {
    tiles.push({ key: "districts", hue: "blue", icon: <MapPin size={16} aria-hidden />, n: stats.activeDistricts, label: t("stats.districts", { n: stats.activeDistricts }) });
  }
  if (stats.activeStates > 0) {
    tiles.push({ key: "states", hue: "teal", icon: <MapIcon size={16} aria-hidden />, n: stats.activeStates, label: t("stats.states", { n: stats.activeStates }) });
  }
  if (stats.modulesPerDistrict > 0) {
    tiles.push({ key: "dashboards", hue: "amber", icon: <LayoutGrid size={16} aria-hidden />, n: stats.modulesPerDistrict, label: t("stats.dashboards") });
  }
  if (stats.dataPoints !== null) {
    tiles.push({ key: "points", hue: "violet", icon: <Database size={16} aria-hidden />, n: stats.dataPoints, label: t("stats.dataPoints") });
  }

  const last = stats.lastUpdate ? new Date(stats.lastUpdate) : null;
  const fresh = last && minute !== null ? minute - last.getTime() < FRESH_MS : true;

  if (tiles.length === 0) return null;
  return (
    <div className={styles.statsBox}>
      <div className={styles.statsHead}>
        <p className={styles.statsLine}>{t.rich("stats.line", { b: (c) => <strong>{c}</strong> })}</p>
        {last && (
          <p className={styles.statsUpdated} data-fresh={fresh ? "true" : "false"}>
            <span className={styles.statDot} aria-hidden />
            {minute === null
              ? t("stats.updatedAt", { time: f.time(last, { hour: "numeric", minute: "2-digit" }), date: f.date(last, { day: "numeric", month: "short" }) })
              : t("stats.updatedAgo", { ago: f.ago(last) })}
          </p>
        )}
      </div>
      <ul className={styles.stats} aria-label={t("stats.aria")}>
        {tiles.map((c) => (
          <li key={c.key} className={`${styles.stat} ftp-hue-${c.hue}`}>
            <span className={styles.statTop}>
              <span className={styles.statIcon}>{c.icon}</span>
              <CountUp value={c.n} className={styles.statNum} />
            </span>
            <span className={styles.statLabel}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
