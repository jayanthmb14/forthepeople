/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Shared map chrome — Design v5 "Calm"
// ═══════════════════════════════════════════════════════════════════════
//
//  Every map on the site (India drill-down, state maps, taluk map) draws
//  the same three things around its shapes: a fill/stroke per shape, a
//  hover tooltip and a small legend. They all live here so the colours
//  come from ONE place and follow the design tokens (and dark mode):
//
//    live shape    → pastel blue fill --ftp-map-live-fill (#BFD3FB) with a
//                    brand-blue outline --ftp-map-live (#2563EB);
//                    hover/pressed → --ftp-map-live-hover
//    locked shape  → --ftp-map-locked (#E6ECF5) with a white outline;
//                    hover → --ftp-map-locked-hover
//    tooltip/legend→ white card, 1 px border, soft shadow
//
//    India map     → indiaStateStyle(): soft pastel land in four tones
//                    (neighbours never share one), clearer brand blue on
//                    hover / tap (states open their page; live DISTRICTS
//                    are pins)
//
//  Map BEHAVIOUR (clicks, projections, zoom) stays in each map file.
//
"use client";

import type React from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

/** Mix a CSS colour with transparency — e.g. tint("var(--ftp-map-live)", 18). */
export function tint(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

type GeoStyle = React.CSSProperties & { fillOpacity?: number };

/**
 * Style object for a react-simple-maps <Geography>: { default, hover, pressed }.
 * @param active  Is this state / district live on the site?
 * @param solid   true = small shapes (India map): the pastel fill plus a
 *                thicker brand outline so a live shape still reads at a glance;
 *                false = state and district maps (thin outline).
 * @param lockedClickable  true when a locked shape still opens a preview
 *                (state maps); false shows a "not-allowed" cursor instead.
 */
export function geoStyle(
  active: boolean,
  solid = false,
  lockedClickable = false,
): { default: GeoStyle; hover: GeoStyle; pressed: GeoStyle } {
  if (active) {
    return {
      default: {
        fill: "var(--ftp-map-live-fill)",
        stroke: "var(--ftp-map-live)",
        strokeWidth: solid ? 1.4 : 1.2,
        outline: "none",
        cursor: "pointer",
        transition: "fill 150ms",
      },
      hover: {
        fill: "var(--ftp-map-live-hover)",
        stroke: "var(--ftp-brand-deep)",
        strokeWidth: solid ? 1.8 : 1.6,
        outline: "none",
        cursor: "pointer",
      },
      pressed: {
        fill: "var(--ftp-map-live-hover)",
        stroke: "var(--ftp-brand-deep)",
        outline: "none",
      },
    };
  }
  return {
    default: {
      fill: "var(--ftp-map-locked)",
      stroke: "var(--ftp-surface)",
      strokeWidth: 0.8,
      outline: "none",
      cursor: lockedClickable ? "pointer" : "default",
      transition: "fill 150ms",
    },
    hover: {
      fill: "var(--ftp-map-locked-hover)",
      stroke: "var(--ftp-surface)",
      strokeWidth: 0.8,
      outline: "none",
      cursor: lockedClickable ? "pointer" : "not-allowed",
    },
    pressed: { fill: "var(--ftp-map-locked-hover)", outline: "none" },
  };
}

/**
 * The India map's land: four soft pastel blues (the live fill mixed with
 * white), so neighbouring states read apart without drawing lines. (The
 * state shapes in /geo/india-states.json are made of district pieces, so
 * any outline would also draw every district seam.)
 */
export const INDIA_LAND_TONES = [22, 44, 33, 55].map((pct) => `color-mix(in srgb, var(--ftp-map-live-fill) ${pct}%, var(--ftp-surface))`);
/** The legend's land swatch. */
export const INDIA_LAND_FILL = INDIA_LAND_TONES[2];

/**
 * Tone per state (geo name in india-states.json), chosen so that no two
 * neighbouring states share one (a 4-colouring of the states' borders,
 * worked out once from the shapes; Tripura set by hand). A state that is
 * not listed takes tone 0.
 */
export const INDIA_STATE_TONE: Record<string, 0 | 1 | 2 | 3> = {
  "Andaman and Nicobar": 0, "Andhra Pradesh": 0, "Arunachal Pradesh": 1, Assam: 0, Bihar: 3, Chandigarh: 0,
  Chhattisgarh: 1, Delhi: 2, "Dadra and Nagar Haveli and Daman and Diu": 2, Goa: 2, Gujarat: 1, Haryana: 1,
  "Himachal Pradesh": 0, "Jammu and Kashmir": 1, Jharkhand: 2, Karnataka: 1, Kerala: 0, Ladakh: 2, Lakshadweep: 0,
  "Madhya Pradesh": 2, Maharashtra: 0, Manipur: 1, Meghalaya: 1, Mizoram: 2, Nagaland: 2, Odisha: 3, Puducherry: 1,
  Punjab: 2, Rajasthan: 3, Sikkim: 0, "Tamil Nadu": 2, Telangana: 2, Tripura: 3, "Uttar Pradesh": 0, Uttarakhand: 1,
  "West Bengal": 1,
};

/**
 * The India map on the home page (DrillDownMap): every state in one of
 * the soft land tones (a state is never painted "live" — only districts
 * are live, and they are pins). The stroke is the fill's own colour, a
 * little wide, so the district pieces inside a state join without seams.
 * Hover or tap turns a state a clearer brand blue to show that it opens
 * the state's page.
 */
export function indiaStateStyle(selected = false, tone = 0): { default: GeoStyle; hover: GeoStyle; pressed: GeoStyle } {
  const fill = INDIA_LAND_TONES[tone] ?? INDIA_LAND_TONES[0];
  const hot: GeoStyle = {
    fill: "var(--ftp-map-live-hover)",
    stroke: "var(--ftp-map-live-hover)",
    strokeWidth: 1.6,
    outline: "none",
    cursor: "pointer",
  };
  return {
    default: selected
      ? hot
      : {
          fill,
          stroke: fill,
          strokeWidth: 1.6,
          strokeLinejoin: "round",
          outline: "none",
          cursor: "pointer",
          transition: "fill 150ms, stroke 150ms",
        },
    hover: hot,
    pressed: hot,
  };
}

/** The floating card and tooltip frame used on maps (white, thin border, soft shadow). */
export const MAP_CARD_STYLE: React.CSSProperties = {
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  border: "1px solid var(--ftp-border-strong)",
  boxShadow: "var(--ftp-shadow-2)",
  borderRadius: "var(--ftp-radius-card)",
};

/**
 * Hover tooltip that follows the pointer. White card, thin border, soft shadow.
 * @param lockedHint  Text after the name for a locked shape ("Coming soon", "Preview").
 */
export function MapTooltip({
  name,
  active,
  x,
  y,
  maxLeft = 240,
  lockedHint,
}: {
  name: string;
  active: boolean;
  x: number;
  y: number;
  maxLeft?: number;
  lockedHint?: string;
}) {
  const t = useTranslations("map");
  return (
    <div
      style={{
        position: "absolute",
        left: Math.min(x + 10, maxLeft),
        top: Math.max(y - 36, 4),
        background: "var(--ftp-surface)",
        color: "var(--ftp-text)",
        border: "1px solid var(--ftp-border-strong)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "4px 10px",
        borderRadius: "var(--ftp-radius-tile)",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 500,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {!active && <Lock size={12} aria-hidden style={{ color: "var(--ftp-text-2)" }} />}
      {name}
      {active ? (
        <span style={{ color: "var(--ftp-brand)" }}>{t("explore")}</span>
      ) : (
        <span style={{ color: "var(--ftp-text-2)", fontWeight: 400 }}>{lockedHint ?? t("legendSoon")}</span>
      )}
    </div>
  );
}

/** One swatch + label row of a map legend. */
function LegendRow({ swatch, border, label }: { swatch: string; border: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span aria-hidden style={{ width: 14, height: 10, background: swatch, border: `1px solid ${border}`, borderRadius: 3, display: "inline-block" }} />
      {label}
    </div>
  );
}

/**
 * Small "Active / Coming soon" legend pinned to the bottom-right of a map.
 * (Says "Active", not "Live": "Live" only ever means data < 30 min old.)
 * `solid` is accepted for old call sites; v5 draws one swatch style.
 */
export function MapLegend({
  liveLabel,
  lockedLabel,
}: {
  /** Kept for old call sites; ignored in v5 (one swatch style for every map). */
  solid?: boolean;
  liveLabel?: string;
  lockedLabel?: string;
}) {
  const t = useTranslations("map");
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        boxShadow: "var(--ftp-shadow-1)",
        borderRadius: "var(--ftp-radius-tile)",
        padding: "6px 10px",
        fontSize: 11,
        lineHeight: "16px",
        color: "var(--ftp-text-2)",
        pointerEvents: "none",
      }}
    >
      <LegendRow swatch="var(--ftp-map-live-fill)" border="var(--ftp-map-live)" label={liveLabel ?? t("legendActive")} />
      <LegendRow swatch="var(--ftp-map-locked)" border="var(--ftp-border-strong)" label={lockedLabel ?? t("legendSoon")} />
    </div>
  );
}
