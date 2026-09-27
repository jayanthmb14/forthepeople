/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaMapCard — the clickable India map on the home page (cols 1–7)
// ═══════════════════════════════════════════════════════════════════════
//
//  Wraps DrillDownMap (src/components/map/DrillDownMap.tsx) in a quiet v3
//  frame: surface-2 background, 1 px border, 12 px radius, no glow, no
//  zoom-on-hover. DrillDownMap colours states through mapTheme
//  (--ftp-map-live / --ftp-map-locked) and fits India to its own viewBox.
//  home.module.css only flattens its inline frame and hides its built-in
//  legend, so the token legend below is the only one.
//
"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import styles from "./home.module.css";

// The map library touches `window`, so it only renders in the browser.
const DrillDownMap = dynamic(() => import("@/components/map/DrillDownMap"), {
  ssr: false,
  loading: () => <div aria-hidden className={styles.mapLoading} />,
});

export default function IndiaMapCard({ locale }: { locale: string }) {
  const t = useTranslations("home");
  return (
    <figure className={styles.mapFrame} aria-label={t("mapLabel")}>
      <div className={styles.mapCanvas}>
        <DrillDownMap locale={locale} />
      </div>
      <figcaption className={styles.mapLegend}>
        <span className={styles.legendRow}>
          <span className={`${styles.legendSwatch} ${styles.legendLive}`} aria-hidden />
          {t("legendLive")}
        </span>
        <span className={styles.legendRow}>
          <span className={`${styles.legendSwatch} ${styles.legendLocked}`} aria-hidden />
          {t("legendComing")}
        </span>
      </figcaption>
    </figure>
  );
}
