/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HueCharts — small SVG pictures in the page hue for the daily-services
//  module pages (housing, services, offices, weather, alerts).
// ═══════════════════════════════════════════════════════════════════════
//
//    HueDonut     a ring split into shares ("which kinds of guide"), with a
//                 legend beside it that repeats every number in text
//    ProgressRing one ring filled to a %, with anything in the middle
//    BarList      a top-N list of labelled bars ("offices per department")
//
//  Rules shared with the kit (docs/DESIGN-SYSTEM.md §5):
//    - colours come from --hue / --hue-deep / --hue-pop / --hue-tint, so a
//      picture on the orange housing page is orange and on teal services
//      is teal;
//    - rings draw in once and bars grow in once (.ftp-draw-path,
//      .ftp-grow-x); nothing loops, and reduced motion shows the final
//      state straight away;
//    - every picture carries its numbers as text (legend, aria-label), so
//      a screen reader and a skeptic get the same facts as the picture.
//  None of these hold words of their own: every label arrives already
//  translated from the page.
"use client";

import React from "react";

/** Segment colours, darkest first, then the muted "other" grey. */
export const HUE_SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "color-mix(in srgb, var(--hue) 55%, var(--hue-pop))",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-pop) 50%, #fff)",
] as const;

/** Grey for "other" / "not yet" shares (same as the kit's muted chart fill). */
export const MUTED_SHADE = "#D8D5CB";

// ─────────────────────────────────────────────────────────────────────
//  HueDonut
// ─────────────────────────────────────────────────────────────────────

export interface DonutSegment {
  key: string;
  /** Translated label shown in the legend. */
  label: string;
  /** Raw value; the share of the ring is value ÷ sum of values. */
  value: number;
  /** Formatted value for the legend ("12", "₹4.2 Cr"). */
  display: string;
  emoji?: string;
  /** CSS colour; defaults to HUE_SHADES by position. */
  color?: string;
}

/**
 * HueDonut — a ring split into segments, with the legend beside it.
 * Renders nothing when the values add up to zero (never an empty ring).
 *
 * @prop center     Big text in the middle of the ring (already formatted).
 * @prop centerSub  Small line under it.
 * @prop ariaLabel  One sentence that says what the ring shows.
 * @prop percentOf  Formats a share for the legend ("42%"); the page passes
 *                  a locale-aware formatter.
 */
export function HueDonut({
  segments,
  size = 168,
  center,
  centerSub,
  ariaLabel,
  percentOf,
}: {
  segments: DonutSegment[];
  size?: number;
  center?: string;
  centerSub?: string;
  ariaLabel: string;
  percentOf: (share: number) => string;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const stroke = Math.round(size / 7.5);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  // Each drawn segment with its colour and where it starts (0–1 of the ring).
  const shown = segments
    .map((s, idx) => ({ s, color: s.color ?? HUE_SHADES[idx % HUE_SHADES.length], frac: Math.max(0, s.value) / total }))
    .filter((x) => x.frac > 0)
    .map((x, i, arr) => ({ ...x, start: arr.slice(0, i).reduce((sum, y) => sum + y.frac, 0) }));
  // A hair of space between segments, only when there is more than one.
  const gap = shown.length > 1 ? Math.min(3, c * 0.01) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {shown.map(({ s, color, frac, start }, i) => {
            const dash = Math.max(0, frac * c - gap);
            return (
              <circle
                key={s.key}
                className="ftp-draw-path"
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${c}`}
                strokeDashoffset={0}
                transform={`rotate(${-90 + start * 360} ${cx} ${cx})`}
                style={{ ["--len" as string]: dash, ["--i" as string]: i }}
              />
            );
          })}
        </svg>
        {(center || centerSub) && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: stroke,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {center && (
              <span className="ftp-bignum" style={{ fontSize: Math.round(size / 5.6), lineHeight: 1.05, color: "var(--hue-deep)" }}>
                {center}
              </span>
            )}
            {centerSub && (
              <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2, maxWidth: size - stroke * 2 - 8 }}>
                {centerSub}
              </span>
            )}
          </div>
        )}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 240px", minWidth: 0, maxWidth: 440 }}>
        {segments.map((s, i) => (
          <li key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, lineHeight: "20px" }}>
            <span
              aria-hidden
              style={{ width: 12, height: 12, borderRadius: 4, flexShrink: 0, background: s.color ?? HUE_SHADES[i % HUE_SHADES.length] }}
            />
            {s.emoji && (
              <span className="ftp-emoji" aria-hidden style={{ fontSize: 16 }}>
                {s.emoji}
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)" }}>{s.label}</span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
              {s.display}
            </span>
            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontSize: 12, minWidth: 38, textAlign: "right" }}>
              {percentOf(s.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ProgressRing
// ─────────────────────────────────────────────────────────────────────

/**
 * ProgressRing — a ring filled to `pct` (0–100, clamped for drawing) with
 * any content in the middle (a number, an emoji).
 *
 * @prop label  Sentence read by screen readers, e.g. "62% of houses finished".
 */
export function ProgressRing({
  pct,
  size = 64,
  label,
  children,
  i = 0,
}: {
  pct: number;
  size?: number;
  label: string;
  children?: React.ReactNode;
  /** Stagger index for the draw-in (rings in a row draw one after another). */
  i?: number;
}) {
  const p = Math.max(0, Math.min(100, pct));
  const stroke = Math.max(5, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // A <span>, not a <div>: rings sit inside tappable card <button>s.
  return (
    <span role="img" aria-label={label} style={{ position: "relative", display: "inline-block", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
        {p > 0 && (
          <circle
            className="ftp-draw-path"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--hue)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ ["--len" as string]: c, ["--i" as string]: i }}
          />
        )}
      </svg>
      {children !== undefined && (
        <span
          aria-hidden
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}
        >
          {children}
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  BarList
// ─────────────────────────────────────────────────────────────────────

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  /** Formatted value shown at the end of the row. */
  display: string;
  emoji?: string;
  /** Language of the label when it is local-script data (screen readers). */
  lang?: string;
}

/**
 * BarList — labelled horizontal bars, longest first as given. The bar
 * length is value ÷ the largest value; the number is always printed.
 */
export function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(0, ...items.map((x) => x.value));
  if (max <= 0) return null;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it, i) => (
        <li key={it.key} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {it.emoji && (
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 16, borderRadius: 10 }}>
              {it.emoji}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, lineHeight: "20px", marginBottom: 4 }}>
              <span lang={it.lang} style={{ color: "var(--ftp-text)", minWidth: 0, overflowWrap: "anywhere" }}>
                {it.label}
              </span>
              <span className="ftp-num" style={{ color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
                {it.display}
              </span>
            </div>
            <div aria-hidden style={{ height: 8, borderRadius: 999, background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
              <div
                className="ftp-grow-x"
                style={{
                  width: `${Math.max(2, (it.value / max) * 100)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                  ["--i" as string]: i,
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
