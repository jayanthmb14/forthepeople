/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeMap — India with the live districts marked (home hero, right side)
// ═══════════════════════════════════════════════════════════════════════
//
//  Calm on purpose: every state is the same pale land colour (a state is
//  never painted "live" — only districts are live), and each live district
//  is one blue dot at its headquarters (src/lib/geo/district-centroids.ts).
//  Each dot is a real link: Tab reaches it, Enter opens the district, and
//  hover or focus shows its name.
//
//  Tablets and PCs only: HomeHero loads this file (next/dynamic) only at
//  768 px and wider, so phones never download the map; the live-district
//  cards right below the hero do the same job there.
//
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { INDIA_STATES } from "@/lib/constants/districts";
import { DISTRICT_CENTROIDS } from "@/lib/geo/district-centroids";
import { usePlaceText } from "@/i18n/client";
import { placeName } from "@/i18n/place-name";
import styles from "./home.module.css";

/** Live districts with a known headquarters position (registry order). */
const LIVE_PINS = INDIA_STATES.flatMap((st) =>
  st.districts
    .filter((d) => d.active)
    .map((d) => ({ district: d, state: st, at: DISTRICT_CENTROIDS[`${st.slug}/${d.slug}`] }))
    .filter((p) => p.at),
);

const LAND = {
  default: { fill: "var(--ftp-map-land, #E3EAF4)", stroke: "var(--ftp-surface)", strokeWidth: 0.9, outline: "none" },
  hover: { fill: "var(--ftp-map-land, #E3EAF4)", stroke: "var(--ftp-surface)", strokeWidth: 0.9, outline: "none" },
  pressed: { fill: "var(--ftp-map-land, #E3EAF4)", stroke: "var(--ftp-surface)", strokeWidth: 0.9, outline: "none" },
};

export default function HomeMap({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const place = usePlaceText();
  const router = useRouter();
  const frame = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);

  function showTip(el: Element, label: string) {
    const box = frame.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!box) return;
    setTip({ label, x: r.left + r.width / 2 - box.left, y: r.top - box.top });
  }

  return (
    <figure ref={frame} className={styles.map} aria-label={t("mapLabel")}>
      <ComposableMap
          projection="geoMercator"
          // Mainland India plus the Andaman & Nicobar Islands fill the
          // 800 × 900 box (same framing as the district map).
          projectionConfig={{ center: [82.75, 22.7], scale: 1350 }}
          width={800}
          height={900}
          className={styles.mapSvg}
        >
          <g aria-hidden="true">
            <Geographies geography="/geo/india-states.json?v=4">
              {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} tabIndex={-1} style={LAND} />)
              }
            </Geographies>
          </g>
          {LIVE_PINS.map(({ district, state, at }) => {
            const href = `/${locale}/${state.slug}/${district.slug}`;
            const label = t("openDistrict", { name: placeName(district, locale), state: place.state(state.slug, state.name) });
            return (
              <Marker key={`${state.slug}/${district.slug}`} coordinates={[at!.lng, at!.lat]}>
                <a
                  href={href}
                  aria-label={label}
                  className={styles.pin}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(href);
                  }}
                  onMouseEnter={(e) => showTip(e.currentTarget, label)}
                  onFocus={(e) => showTip(e.currentTarget, label)}
                  onMouseLeave={() => setTip(null)}
                  onBlur={() => setTip(null)}
                >
                  <circle r={15} className={styles.pinHalo} />
                  <circle r={7} className={styles.pinDot} />
                </a>
              </Marker>
            );
          })}
        </ComposableMap>
      {tip && (
        <span className={styles.mapTip} style={{ left: tip.x, top: tip.y }} aria-hidden>
          {tip.label}
        </span>
      )}
      <figcaption className={styles.mapLegend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendLive}`} aria-hidden />
          {t("legendLive")}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendLand}`} aria-hidden />
          {t("legendOther")}
        </span>
      </figcaption>
    </figure>
  );
}
