/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeroStats — the colourful stats row under the home search
// ═══════════════════════════════════════════════════════════════════════
//
//   (pin) 10 districts live  (map) 7 states  (db) 5,874 data points
//   (grid) 36 dashboards each  (●) Updated 12 minutes ago
//
//  Each figure is a pastel chip in its own hue; the numbers count up once.
//  Where they come from (home-data.ts → loadPlatformStats):
//    districts, states  the registry flags (getPlatformFacts)
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

  const chips: Array<{ hue: string; icon: React.ReactNode; n: number; label: string }> = [
    { hue: "blue", icon: <MapPin size={16} aria-hidden />, n: stats.activeDistricts, label: t("stats.districts", { n: stats.activeDistricts }) },
    { hue: "teal", icon: <MapIcon size={16} aria-hidden />, n: stats.activeStates, label: t("stats.states", { n: stats.activeStates }) },
  ];
  if (stats.dataPoints !== null) {
    chips.push({ hue: "violet", icon: <Database size={16} aria-hidden />, n: stats.dataPoints, label: t("stats.dataPoints") });
  }
  chips.push({ hue: "amber", icon: <LayoutGrid size={16} aria-hidden />, n: stats.modulesPerDistrict, label: t("stats.dashboards") });

  const last = stats.lastUpdate ? new Date(stats.lastUpdate) : null;
  const fresh = last && minute !== null ? minute - last.getTime() < FRESH_MS : true;

  return (
    <ul className={styles.stats} aria-label={t("stats.aria")}>
      {chips.map((c) => (
        <li key={c.hue} className={`${styles.stat} ftp-hue-${c.hue}`}>
          <span className={styles.statIcon}>{c.icon}</span>
          <CountUp value={c.n} className={styles.statNum} />
          <span className={styles.statLabel}>{c.label}</span>
        </li>
      ))}
      {last && (
        <li className={`${styles.stat} ${styles.statUpdated}`} data-fresh={fresh ? "true" : "false"}>
          <span className={styles.statDot} aria-hidden />
          <span className={styles.statLabel}>
            {minute === null
              ? t("stats.updatedAt", { time: f.time(last, { hour: "numeric", minute: "2-digit" }), date: f.date(last, { day: "numeric", month: "short" }) })
              : t("stats.updatedAgo", { ago: f.ago(last) })}
          </span>
        </li>
      )}
    </ul>
  );
}
