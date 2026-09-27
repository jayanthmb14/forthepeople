/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  HueDonut — a category ring in shades of the page hue (civic pages)
// ═══════════════════════════════════════════════════════════════════════
//
//      ╭───────╮     ■ 🧹 Cleanliness & waste     6  (21 %)
//     │   28    │    ■ 💧 Water conservation      6  (21 %)
//     │ actions │    ■ 🌾 Agriculture             5  (18 %)
//      ╰───────╯     …
//
//  Every slice is a real count from the page's own data; the caller hides
//  the ring when there is nothing to count. Slices are sorted largest
//  first; past `maxSlices` the smallest are folded into one "other" slice
//  (label supplied by the caller, so it is translated). Each arc draws in
//  once (.ftp-draw-path, off under reduced motion). The legend is real
//  text, so the numbers are readable without the picture; the ring itself
//  carries an aria-label sentence from the caller.
"use client";

import React from "react";
import { useFormat } from "@/i18n/client";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** One emoji before the label in the legend. */
  emoji?: string;
  /** Any small marker before the label (e.g. a 6 px party-colour dot). */
  marker?: React.ReactNode;
}

/** Eight shades of the page hue, dark → light, so neighbours stay apart. */
const SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-deep) 55%, #fff)",
  "color-mix(in srgb, var(--hue) 45%, #fff)",
  "color-mix(in srgb, var(--hue-deep) 78%, #000)",
  "color-mix(in srgb, var(--hue-pop) 50%, #fff)",
  "color-mix(in srgb, var(--hue) 70%, var(--hue-deep))",
];

export function HueDonut({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  otherLabel,
  maxSlices = 6,
  size = 168,
}: {
  slices: DonutSlice[];
  /** Big number in the middle (already formatted). */
  centerValue: React.ReactNode;
  /** Small word under it ("actions", "seats"). */
  centerLabel?: string;
  /** One sentence describing the whole ring for screen readers. */
  ariaLabel: string;
  /** Label for the folded slice when there are more than `maxSlices`. */
  otherLabel?: string;
  maxSlices?: number;
  size?: number;
}) {
  const f = useFormat();
  const sorted = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  let shown: DonutSlice[] = sorted;
  if (otherLabel && sorted.length > maxSlices) {
    const rest = sorted.slice(maxSlices - 1);
    shown = [
      ...sorted.slice(0, maxSlices - 1),
      { key: "__other", label: otherLabel, value: rest.reduce((n, s) => n + s.value, 0) },
    ];
  }
  const total = shown.reduce((n, s) => n + s.value, 0);
  if (total <= 0) return null;

  const stroke = Math.round(size * 0.15);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  // A thin gap between slices (none when the ring is one slice).
  const gap = shown.length > 1 ? 3 : 0;
  // Each arc starts where the ones before it end (a running sum, no mutation).
  const arcs = shown.map((s, i) => {
    const before = shown.slice(0, i).reduce((n, p) => n + p.value, 0);
    const len = (s.value / total) * c;
    return { ...s, color: SHADES[i % SHADES.length], start: (before / total) * c, len: Math.max(0.5, len - gap) };
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {arcs.map((a, i) => (
            <circle
              key={a.key}
              className="ftp-draw-path"
              cx={mid}
              cy={mid}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.len} ${c}`}
              strokeDashoffset={0}
              transform={`rotate(${-90 + (a.start / c) * 360} ${mid} ${mid})`}
              style={{ ["--len" as string]: a.len, ["--i" as string]: i }}
            />
          ))}
        </svg>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: stroke + 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span className="ftp-bignum" style={{ fontSize: Math.round(size * 0.2), lineHeight: 1, color: "var(--hue-deep)" }}>
            {centerValue}
          </span>
          {centerLabel && (
            <span style={{ marginTop: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{centerLabel}</span>
          )}
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {arcs.map((a) => (
          <li key={a.key} style={{ display: "grid", gridTemplateColumns: "14px minmax(0, 1fr) auto", alignItems: "center", columnGap: 10 }}>
            <span aria-hidden style={{ width: 14, height: 14, borderRadius: 5, background: a.color }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 13, lineHeight: "18px", color: "var(--ftp-text)" }}>
              {a.emoji && (
                <span className="ftp-emoji" aria-hidden>
                  {a.emoji}
                </span>
              )}
              {a.marker}
              <span style={{ overflowWrap: "anywhere" }}>{a.label}</span>
            </span>
            <span className="ftp-num" style={{ fontSize: 13, lineHeight: "18px", textAlign: "right", whiteSpace: "nowrap", color: "var(--hue-deep)" }}>
              {f.number(a.value)}{" "}
              <span style={{ color: "var(--ftp-text-2)" }}>({f.number(a.value / total, { style: "percent" })})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
