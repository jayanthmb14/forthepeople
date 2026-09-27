/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Chart tokens for the "Daily services" module pages (Design v3)
// ═══════════════════════════════════════════════════════════════════════
//
//  Recharts takes colours as plain strings, so we hand it CSS variables
//  instead of hex codes. That way every chart follows the same palette
//  (and dark mode) as the rest of the site, and nobody has to remember
//  which blue is "the" blue.
//
//  Rules from CONCEPT-v3 §5: brand-coloured main line, text-2 axis labels,
//  surface-2 grid lines, no gradients, no shadows.
//
//  Usage:
//    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" />
//    <XAxis tick={CHART.tick} stroke={CHART.axis} />
//    <Line stroke={CHART.primary} />
//    <Tooltip {...CHART_TOOLTIP} />

import type React from "react";

/** Colours for chart parts. All are CSS variables from globals.css. */
export const CHART = {
  /** The main series (e.g. modal price, temperature). */
  primary: "var(--ftp-brand)",
  /** A second, quieter series (e.g. min price). */
  secondary: "var(--ftp-text-2)",
  /** A third, faint series (e.g. max price, "normal" reference). */
  tertiary: "var(--ftp-border-strong)",
  /** Grid lines behind the data. */
  grid: "var(--ftp-surface-2)",
  /** Axis lines. */
  axis: "var(--ftp-border)",
  /** Axis tick labels: 11 px mono in text-2. */
  tick: {
    fontSize: 11,
    fill: "var(--ftp-text-2)",
    fontFamily: "var(--ftp-font-mono)",
  },
} as const;

/** Tooltip styling: a flat card with a 1 px border, no shadow. */
export const CHART_TOOLTIP = {
  contentStyle: {
    background: "var(--ftp-surface)",
    border: "1px solid var(--ftp-border)",
    borderRadius: 8,
    boxShadow: "none",
    fontSize: 12,
    color: "var(--ftp-text)",
  } as React.CSSProperties,
  labelStyle: { color: "var(--ftp-text-2)", fontSize: 11 } as React.CSSProperties,
  itemStyle: { color: "var(--ftp-text)", fontFamily: "var(--ftp-font-mono)" } as React.CSSProperties,
  cursor: { stroke: "var(--ftp-border-strong)", strokeWidth: 1 },
};

/**
 * A tiny legend row under a chart. Each entry is a short line swatch in the
 * series colour plus its name. `dashed` draws a dashed swatch to match a
 * dashed series.
 */
export interface LegendEntry {
  label: string;
  color: string;
  dashed?: boolean;
}
