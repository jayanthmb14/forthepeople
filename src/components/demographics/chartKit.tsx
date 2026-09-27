/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Chart chrome for the demographics charts — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//
//  Every Recharts chart on the Population page shares the same "chrome":
//  axis ticks, axis lines, tooltip box and legend text. Keeping those
//  styles here means each chart file only decides WHAT to draw. v4: the
//  chrome is the kit's recharts theme (CHART_AXIS, chartTooltipStyle from
//  district/visuals), so these charts match every other module page.
//
//  Single-series charts (age groups, migration, mother tongue) fill with
//  the page hue. Multi-series charts (religion, caste, education,
//  employment) deliberately keep the Okabe-Ito / Viridis palettes in
//  ./types.ts — those are readable for people with colour-vision
//  deficiency, which one hue in several shades is not. That is an
//  accessibility choice, not an oversight.
//
"use client";

import type React from "react";
import { CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";

/** Axis tick labels: 11 px sans with tabular figures, secondary text colour. */
export const AXIS_TICK = { ...CHART_AXIS, fontVariantNumeric: "tabular-nums" };

/** Category-axis labels (words, not numbers). */
export const CATEGORY_TICK = CHART_AXIS;

/** Axis + tick lines: a quiet 1 px border colour. */
export const AXIS_LINE = { stroke: "var(--ftp-border)" };

/** Tooltip box: the kit tooltip (hue-tinted border, soft shadow). */
export const TOOLTIP_PROPS = {
  contentStyle: chartTooltipStyle,
  labelStyle: { color: "var(--ftp-text-2)", fontSize: 11 } as React.CSSProperties,
  itemStyle: { color: "var(--ftp-text)", fontFamily: "var(--ftp-font-sans)", fontVariantNumeric: "tabular-nums" } as React.CSSProperties,
  cursor: { fill: "var(--hue-tint)" },
};

/** Legend text under a chart. */
export const LEGEND_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "var(--ftp-text-2)",
};

/** Neutral series colours (for "Other", "Not stated", "Non-workers"). */
export const NEUTRAL_SERIES = {
  strong: "var(--ftp-text-2)",
  mid: "var(--ftp-border-strong)",
  light: "var(--ftp-surface-2)",
};

/**
 * ChartEmpty — the honest one-liner shown INSIDE a chart card when there is
 * no data. Plain text (no extra border), because the chart already sits in
 * a card and a box inside a box is noise.
 */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0, padding: "12px 0" }}>
      {message}
    </p>
  );
}

/** Small caption line under a chart (12 px, text-2). */
export function ChartNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)", margin: "8px 0 0" }}>{children}</p>
  );
}
