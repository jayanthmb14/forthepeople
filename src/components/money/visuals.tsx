/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Money-group pictures (finance, schemes, infrastructure, tenders,
//  industries) — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//  Three small pictures that sit next to the kit visuals
//  (src/components/district/visuals.tsx) and follow the same rules:
//  colours come from the page hue, they draw in once, reduced motion shows
//  the final state (globals.css), and every one has a text equivalent.
//
//    ShareDonut    a ring cut into shares ("how each ₹100 is shared"),
//                  darkest shade for the biggest share, grey for "Other"
//    TopBarList    a ranked list of up to 5 rows with a bar each
//    IconCountRow  a row of emoji tiles, each with a big count
//
//  None of them contains words of its own: every label, value and
//  aria-label comes from the page, already translated.
"use client";

import React from "react";

/** Shades of the page hue, darkest first (biggest share gets the darkest). */
export const HUE_SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "color-mix(in srgb, var(--hue) 50%, var(--hue-pop))",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-pop) 45%, #fff)",
] as const;

/** The "Other" slice / comparison colour (same grey as the kit's muted chart fill). */
export const OTHER_SHADE = "#D8D5CB";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** Formatted value shown in the legend ("₹120 Cr", "14"). */
  display: string;
  /** Draw in grey (the "Other" bucket). */
  other?: boolean;
}

/** Where each slice starts on the ring (0–1), how long it is, and its colour. */
function layoutArcs(slices: DonutSlice[], total: number, circ: number) {
  const shown = slices.filter((s) => s.value > 0);
  const gap = shown.length > 1 ? 3 : 0;
  const out: Array<DonutSlice & { i: number; frac: number; start: number; color: string; len: number }> = [];
  let start = 0;
  let shade = 0;
  for (let i = 0; i < shown.length; i++) {
    const s = shown[i];
    const frac = s.value / total;
    const color = s.other ? OTHER_SHADE : HUE_SHADES[Math.min(shade, HUE_SHADES.length - 1)];
    if (!s.other) shade += 1;
    out.push({ ...s, i, frac, start, color, len: Math.max(0.5, frac * circ - gap) });
    start += frac;
  }
  return out;
}

/**
 * ShareDonut — a ring split into shares, with a legend beside it.
 * Slices are drawn in the order given (pass them largest first, "Other"
 * last). Renders nothing when the total is zero.
 *
 * @prop centerValue  Big text in the hole ("₹480 Cr", "36").
 * @prop centerLabel  Small text under it ("total budget").
 * @prop ariaLabel    One sentence for screen readers (the legend is visible text too).
 * @prop formatPct    Formats a 0–1 share as a percentage in the page language.
 */
export function ShareDonut({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  formatPct,
  size = 176,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel?: string;
  ariaLabel: string;
  formatPct: (share: number) => string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const stroke = Math.round(size / 7);
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const arcs = layoutArcs(slices, total, circ);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: "block" }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              className="ftp-draw-path"
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.len} ${circ}`}
              strokeDashoffset={0}
              transform={`rotate(${a.start * 360 - 90} ${c} ${c})`}
              style={{ ["--len" as string]: a.len, ["--i" as string]: a.i }}
            />
          ))}
        </svg>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: stroke + 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span className="ftp-bignum" style={{ fontSize: Math.round(size / 7.5), lineHeight: 1.1, color: "var(--hue-deep)" }}>
            {centerValue}
          </span>
          {centerLabel && (
            <span style={{ marginTop: 2, fontSize: 11, lineHeight: "15px", color: "var(--ftp-text-2)" }}>{centerLabel}</span>
          )}
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 220px", maxWidth: 480, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {arcs.map((a) => (
          <li key={a.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, lineHeight: "19px" }}>
            <span aria-hidden style={{ width: 14, height: 14, borderRadius: 5, background: a.color, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)" }}>{a.label}</span>
            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>{a.display}</span>
            <span
              className="ftp-num"
              style={{ minWidth: 44, textAlign: "right", fontWeight: 650, color: a.other ? "var(--ftp-text-2)" : "var(--hue-deep)" }}
            >
              {formatPct(a.frac)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface TopBarRow {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Formatted value shown at the end of the row. */
  display: string;
  /** One emoji in a hue chip before the label. */
  emoji?: string;
  /** Small second line under the label. */
  sub?: React.ReactNode;
}

/**
 * TopBarList — a ranked list (up to `max` rows, default 5) with a bar per
 * row, longest bar = biggest value. Reads well on a phone because the label
 * sits above the bar instead of on a cramped axis.
 */
export function TopBarList({ rows, max = 5 }: { rows: TopBarRow[]; max?: number }) {
  const list = rows.slice(0, max);
  const top = Math.max(0, ...list.map((r) => r.value));
  if (list.length === 0 || top <= 0) return null;
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
      {list.map((r, i) => (
        <li key={r.key}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {r.emoji && (
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 16, borderRadius: 10 }}>
                {r.emoji}
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{r.label}</span>
              {r.sub && <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.sub}</span>}
            </span>
            <span className="ftp-num" style={{ fontSize: 14, fontWeight: 650, color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
              {r.display}
            </span>
          </div>
          <div aria-hidden style={{ height: 10, borderRadius: 999, background: "var(--hue-tint)", overflow: "hidden" }}>
            <div
              className="ftp-grow-x"
              style={{
                width: `${Math.max(2, (r.value / top) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: i === 0 ? "linear-gradient(90deg, var(--hue) 0%, var(--hue-deep) 100%)" : "linear-gradient(90deg, var(--hue-pop) 0%, var(--hue) 100%)",
                ["--i" as string]: i,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export interface IconCount {
  key: string;
  emoji: string;
  /** Already formatted count ("12", "₹4.2 Cr"). */
  count: string;
  label: string;
  /** Use a different hue for this tile (a .ftp-hue-<name> class name without the prefix). */
  hue?: string;
}

/**
 * IconCountRow — a row of emoji tiles, each with a big count and a short
 * label ("🚧 12 being built", "✅ 5 finished"). Tiles wrap on phones.
 */
export function IconCountRow({ items, label }: { items: IconCount[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label={label}
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 100%), 1fr))",
        gap: 10,
      }}
    >
      {items.map((it, i) => (
        <li
          key={it.key}
          className={`ftp-pop${it.hue ? ` ftp-hue-${it.hue}` : ""}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)",
            border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))",
            ["--i" as string]: i,
          }}
        >
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 22, borderRadius: 12, background: "#fff" }}>
            {it.emoji}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="ftp-bignum" style={{ display: "block", fontSize: 24, lineHeight: 1.1, color: "var(--hue-deep)" }}>
              {it.count}
            </span>
            <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{it.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
