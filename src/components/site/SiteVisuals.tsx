/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Site visuals — small, server-safe pictures for the non-module pages
//  (state, taluk, village, about, compare, support …)
// ═══════════════════════════════════════════════════════════════════════
//  No "use client" and no hooks, so a server page can render them straight
//  into a ChartCard. Every value arrives already formatted (the caller
//  formats numbers with the page's locale), and every picture carries a
//  text equivalent (aria-label or the visible legend).
//
//    Donut      a ring split into slices that draw in once, with a legend
//    BarList    ranked horizontal bars, sized against the biggest row
//    RingStat   one progress ring with its percentage in the middle
//
//  Motion: slices, bars and rings draw in once (globals.css .ftp-draw-path
//  and .ftp-grow-x); prefers-reduced-motion shows the final state.

import React from "react";

// ─────────────────────────────────────────────────────────────────────
//  Donut
// ─────────────────────────────────────────────────────────────────────

export interface DonutSlice {
  key: string;
  /** Legend text (already translated). */
  label: string;
  value: number;
  /** Formatted value shown in the legend, e.g. "18,05,769" or "40%". */
  display: string;
  /** Any CSS colour: a hue variable, a color-mix shade or a hex. */
  color: string;
  /** Optional local-script line under the label. */
  sub?: React.ReactNode;
}

/** Shades of the page hue, darkest first — for slices of one colour family. */
export const HUE_SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "color-mix(in srgb, var(--hue) 70%, #fff)",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-pop) 60%, #fff)",
  "color-mix(in srgb, var(--hue) 28%, #fff)",
  "color-mix(in srgb, var(--hue-deep) 55%, #fff)",
  "color-mix(in srgb, var(--hue) 45%, #fff)",
];

/**
 * Donut — each slice is its share of the total. Slices smaller than a
 * sliver still get a visible arc; the legend always shows the real number.
 *
 * @prop center  Big text in the hole (e.g. the total), plus a small line.
 * @prop label   Sentence read by screen readers for the whole ring.
 */
export function Donut({
  slices,
  label,
  center,
  centerSub,
  size = 176,
  thickness = 30,
}: {
  slices: DonutSlice[];
  label: string;
  center?: React.ReactNode;
  centerSub?: React.ReactNode;
  size?: number;
  thickness?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const gap = slices.length > 1 ? 2.5 : 0;
  // Each slice's arc length and start angle, worked out before rendering.
  const arcs = slices.reduce<Array<{ len: number; angle: number; end: number }>>((acc, s) => {
    const startLen = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const len = (Math.max(0, s.value) / total) * c;
    return [...acc, { len, angle: (startLen / c) * 360 - 90, end: startLen + len }];
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <div role="img" aria-label={label} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={thickness} />
          {slices.map((s, i) => {
            const { len, angle } = arcs[i];
            const drawn = Math.max(1.5, len - gap);
            return (
              <circle
                key={s.key}
                className="ftp-draw-path"
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${drawn} ${c}`}
                strokeDashoffset={0}
                transform={`rotate(${angle} ${cx} ${cx})`}
                style={{ ["--len" as string]: drawn, ["--i" as string]: i }}
              />
            );
          })}
        </svg>
        {(center || centerSub) && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: thickness,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {center && (
              <span className="ftp-bignum" style={{ fontSize: 22, lineHeight: 1.1, color: "var(--hue-deep)" }}>
                {center}
              </span>
            )}
            {centerSub && <span style={{ fontSize: 11, lineHeight: 1.35, color: "var(--ftp-text-2)", marginTop: 2 }}>{centerSub}</span>}
          </div>
        )}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 200px", minWidth: 0 }}>
        {slices.map((s) => (
          <li key={s.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.45 }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: s.color, flexShrink: 0, marginTop: 4 }} />
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)" }}>
              {s.label}
              {s.sub && <span style={{ display: "block", fontSize: 12, color: "var(--ftp-text-2)" }}>{s.sub}</span>}
            </span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600, whiteSpace: "nowrap" }}>
              {s.display}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  BarList
// ─────────────────────────────────────────────────────────────────────

export interface BarRow {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Formatted value beside the bar, e.g. "4,512 people". */
  display: React.ReactNode;
  /** Optional emoji chip before the label. */
  emoji?: string;
  /** Optional fill (defaults to the page-hue gradient). */
  color?: string;
}

/**
 * BarList — ranked bars on one scale. The numbers sit beside each bar, so
 * the bars themselves are hidden from screen readers.
 */
export function BarList({ rows, height = 10 }: { rows: BarRow[]; height?: number }) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r, i) => (
        <li key={r.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 14, lineHeight: 1.45 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, color: "var(--ftp-text)", fontWeight: 500 }}>
              {r.emoji && (
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 26, height: 26, fontSize: 14, borderRadius: 8 }}>
                  {r.emoji}
                </span>
              )}
              <span style={{ minWidth: 0 }}>{r.label}</span>
            </span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", whiteSpace: "nowrap", fontWeight: 600 }}>
              {r.display}
            </span>
          </div>
          <div
            aria-hidden
            style={{
              marginTop: 5,
              height,
              borderRadius: "var(--ftp-radius-pill)",
              background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))",
              overflow: "hidden",
            }}
          >
            <div
              className="ftp-grow-x"
              style={{
                width: `${max > 0 ? Math.max(2, Math.round((r.value / max) * 100)) : 0}%`,
                height: "100%",
                borderRadius: "var(--ftp-radius-pill)",
                background: r.color ?? "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                ["--i" as string]: i,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  RingStat
// ─────────────────────────────────────────────────────────────────────

/**
 * RingStat — one ring filled to `pct` (0–100), the formatted value in the
 * middle and a caption under it.
 */
export function RingStat({
  pct,
  value,
  caption,
  label,
  color = "var(--hue)",
  size = 112,
  index = 0,
}: {
  pct: number;
  /** Text in the middle, e.g. "74%". */
  value: React.ReactNode;
  /** Visible line under the ring. */
  caption?: React.ReactNode;
  /** Screen-reader sentence for the ring. */
  label: string;
  color?: string;
  size?: number;
  /** Stagger position when several rings sit in a row. */
  index?: number;
}) {
  const stroke = Math.max(8, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
      <div role="img" aria-label={label} style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          <circle
            className="ftp-draw-path"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ ["--len" as string]: c, ["--i" as string]: index }}
          />
        </svg>
        <span
          aria-hidden
          className="ftp-bignum"
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.2), color: "var(--hue-deep)" }}
        >
          {value}
        </span>
      </div>
      {caption && (
        <figcaption style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ftp-text-2)", textAlign: "center", maxWidth: size + 60 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
