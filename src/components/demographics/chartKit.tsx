/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Chart chrome for the demographics charts — Design v3 "Civic Ledger"
// ═══════════════════════════════════════════════════════════════════════
//
//  Every Recharts chart on the Population page shares the same "chrome":
//  axis ticks, axis lines, tooltip box and legend text. Keeping those
//  styles here means each chart file only decides WHAT to draw.
//
//  Chrome = design tokens (var(--ftp-…)), so light and dark mode both work.
//  SERIES colours (the bars, slices and dots themselves) deliberately stay
//  on the Okabe-Ito / Viridis palettes in ./types.ts — those palettes are
//  readable for people with colour-vision deficiency, which a brand palette
//  is not. That is an accessibility choice, not an oversight.
//
"use client";

import type React from "react";

/** Axis tick labels: 11 px mono numbers in the secondary text colour. */
export const AXIS_TICK = {
  fill: "var(--ftp-text-2)",
  fontSize: 11,
  fontFamily: "var(--ftp-font-mono)",
};

/** Category-axis labels (words, not numbers) use the sans font. */
export const CATEGORY_TICK = {
  fill: "var(--ftp-text-2)",
  fontSize: 11,
  fontFamily: "var(--ftp-font-sans)",
};

/** Axis + tick lines: a quiet 1 px border colour. */
export const AXIS_LINE = { stroke: "var(--ftp-border)" };

/** Tooltip box: flat surface, 1 px border, 8 px radius, no shadow. */
export const TOOLTIP_PROPS = {
  contentStyle: {
    background: "var(--ftp-surface)",
    border: "1px solid var(--ftp-border)",
    borderRadius: "var(--ftp-radius-tile)",
    boxShadow: "none",
    fontSize: 12,
    color: "var(--ftp-text)",
  } as React.CSSProperties,
  labelStyle: { color: "var(--ftp-text-2)", fontSize: 11 } as React.CSSProperties,
  itemStyle: { color: "var(--ftp-text)", fontFamily: "var(--ftp-font-mono)" } as React.CSSProperties,
  cursor: { fill: "var(--ftp-surface-2)" },
};

/** Legend text under a chart. */
export const LEGEND_STYLE: React.CSSProperties = {
  fontSize: 11,
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
 * a Card and a box inside a box is noise.
 */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0, padding: "12px 0" }}>
      {message}
    </p>
  );
}

/** Small caption line under a chart (11 px, text-2). */
export function ChartNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "8px 0 0" }}>{children}</p>
  );
}
