/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  IndiaMapCard — the clickable India map on the home page (cols 1–7)
// ═══════════════════════════════════════════════════════════════════════
//
//  Wraps the existing DrillDownMap (src/components/map/DrillDownMap.tsx,
//  unchanged) in a quiet v3 frame: surface-2 background, 1 px border,
//  12 px radius, no glow, no zoom-on-hover.
//
//  DrillDownMap still paints its own colours inline. Until it reads the
//  tokens itself (see handoff notes), home.module.css re-colours its
//  states through the classes it already sets on each <path>:
//    .ftp-geo-active → --ftp-map-live,  .ftp-geo-locked → --ftp-map-locked
//  and hides its built-in legend so the token legend below is the only one.
//
"use client";

import dynamic from "next/dynamic";
import styles from "./home.module.css";

// The map library touches `window`, so it only renders in the browser.
const DrillDownMap = dynamic(() => import("@/components/map/DrillDownMap"), {
  ssr: false,
  loading: () => <div aria-hidden className={styles.mapLoading} />,
});

export default function IndiaMapCard({ locale }: { locale: string }) {
  return (
    <figure className={styles.mapFrame} aria-label="Map of India. Blue states have live districts; select one to open it.">
      <div className={styles.mapCanvas}>
        <DrillDownMap locale={locale} />
      </div>
      <figcaption className={styles.mapLegend}>
        <span className={styles.legendRow}>
          <span className={`${styles.legendSwatch} ${styles.legendLive}`} aria-hidden />
          Live
        </span>
        <span className={styles.legendRow}>
          <span className={`${styles.legendSwatch} ${styles.legendLocked}`} aria-hidden />
          Coming soon
        </span>
      </figcaption>
    </figure>
  );
}
