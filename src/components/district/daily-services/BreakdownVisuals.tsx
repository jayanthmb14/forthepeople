/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  BreakdownVisuals — small pictures for the "Daily services" pages
// ═══════════════════════════════════════════════════════════════════════
//
//    HueDonut   a ring cut into categories (school types, bus types, water
//               test results) in shades of the page hue, with a legend
//               that carries the counts and shares in words.
//    RankBars   a short ranked list with a bar under each item ("the five
//               longest power cuts", "roles with the most empty posts").
//    MiniRing   a small ring for one share on a card (a school's pass %).
//
//  Every piece takes its colour from the page hue (HueScope), draws in
//  once and stands still (globals.css turns the drawing off for reduced
//  motion). Callers pass translated text; numbers are formatted here with
//  useFormat(), so they follow the chosen language. Nothing is drawn when
//  the numbers add up to zero.
"use client";

import React from "react";
import { useFormat } from "@/i18n/client";

/** One slice / bar. `color` overrides the hue shade (e.g. a warning colour). */
export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
  color?: string;
  /** Optional emoji shown before the label in the legend or list. */
  emoji?: string;
  /** Optional second line under the label (RankBars only). */
  sub?: string;
  /** Text shown for the value instead of the plain number (RankBars only). */
  display?: string;
}

/** Hue shades in the order slices get them (deep → light). */
const SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-deep) 55%, #fff)",
  "color-mix(in srgb, var(--hue-pop) 50%, #fff)",
];

/** Muted fill for the "everything else" slice. */
export const OTHER_SHADE = "#D8D5CB";

/**
 * Keep the `max` biggest categories and fold the rest into one item
 * labelled `otherLabel` (only when there is more than one left over).
 */
export function topWithOther(items: BreakdownItem[], max: number, otherLabel: string): BreakdownItem[] {
  const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= max + 1) return sorted;
  const kept = sorted.slice(0, max);
  const rest = sorted.slice(max).reduce((s, i) => s + i.value, 0);
  return [...kept, { key: "__other", label: otherLabel, value: rest, color: OTHER_SHADE }];
}

/**
 * HueDonut — a ring of categories with a legend beside it.
 *
 * @prop items        Slices, biggest first reads best. Zero slices are skipped.
 * @prop centerValue  Big text in the hole (usually the total).
 * @prop centerLabel  Small text under it ("schools", "routes").
 * @prop ariaLabel    One sentence describing the whole picture.
 */
export function HueDonut({
  items,
  centerValue,
  centerLabel,
  ariaLabel,
  size = 150,
}: {
  items: BreakdownItem[];
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
  size?: number;
}) {
  const f = useFormat();
  const slices = items.filter((i) => i.value > 0);
  const total = slices.reduce((s, i) => s + i.value, 0);
  if (total <= 0) return null;
  const stroke = Math.round(size / 7);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 3 : 0;
  const mid = size / 2;
  const segments = slices.reduce<Array<{ item: BreakdownItem; start: number; len: number }>>((acc, item) => {
    const prev = acc[acc.length - 1];
    const start = prev ? prev.start + prev.len : 0;
    acc.push({ item, start, len: (item.value / total) * c });
    return acc;
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {segments.map(({ item, start, len }, i) => {
            const visible = Math.max(0.5, len - gap);
            return (
              <circle
                key={item.key}
                className="ftp-draw-path"
                cx={mid}
                cy={mid}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${visible} ${c}`}
                strokeDashoffset={0}
                transform={`rotate(${-90 + (start / c) * 360} ${mid} ${mid})`}
                style={{ stroke: item.color ?? SHADES[i % SHADES.length], ["--len" as string]: visible, ["--i" as string]: i }}
              />
            );
          })}
        </svg>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: stroke + 4,
          }}
        >
          <span className="ftp-bignum" style={{ fontSize: Math.round(size / 5.4), lineHeight: 1.05, color: "var(--hue-deep)" }}>
            {centerValue}
          </span>
          <span style={{ fontSize: 11, lineHeight: 1.35, color: "var(--ftp-text-2)", marginTop: 2 }}>{centerLabel}</span>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 180px", maxWidth: 440, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {slices.map((item, i) => (
          <li key={item.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: 1.45 }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, flexShrink: 0, background: item.color ?? SHADES[i % SHADES.length] }} />
            {item.emoji && (
              <span className="ftp-emoji" aria-hidden style={{ fontSize: 15 }}>
                {item.emoji}
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)" }}>{item.label}</span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
              {f.number(item.value)}
            </span>
            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", minWidth: 40, textAlign: "end" }}>
              {f.number(item.value / total, { style: "percent", maximumFractionDigits: 0 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * RankBars — a ranked list; each item has its value on the right and a
 * bar (in the hue) sized against the biggest one.
 *
 * @prop items      Already sorted and trimmed by the caller.
 * @prop ariaLabel  Name of the list for screen readers.
 */
export function RankBars({ items, ariaLabel }: { items: BreakdownItem[]; ariaLabel: string }) {
  const f = useFormat();
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);
  if (max <= 0) return null;
  return (
    <ol aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, i) => (
        <li key={item.key}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span
                className="ftp-icon-chip ftp-num"
                aria-hidden
                style={{ width: 24, height: 24, borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--hue-deep)" }}
              >
                {item.emoji ?? f.number(i + 1)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{item.label}</span>
                {item.sub && <span style={{ display: "block", fontSize: 12, lineHeight: 1.4, color: "var(--ftp-text-2)" }}>{item.sub}</span>}
              </span>
            </span>
            <span className="ftp-num" style={{ fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", flexShrink: 0 }}>
              {item.display ?? f.number(item.value)}
            </span>
          </div>
          <div aria-hidden style={{ height: 10, borderRadius: 999, background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
            <div
              className="ftp-grow-x"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: item.color ?? "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                ["--i" as string]: i,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * MiniRing — one share (0–100) as a small ring with the % in the middle.
 *
 * @prop label  Sentence for screen readers ("Pass rate in 2024: 92%").
 * @prop color  Ring colour (defaults to the hue).
 */
export function MiniRing({ pct, label, size = 46, color }: { pct: number; label: string; size?: number; color?: string }) {
  const f = useFormat();
  const p = Math.max(0, Math.min(100, pct));
  const stroke = Math.max(4, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <span role="img" aria-label={label} style={{ position: "relative", display: "inline-block", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
        <circle
          className="ftp-draw-path"
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          transform={`rotate(-90 ${mid} ${mid})`}
          style={{ stroke: color ?? "var(--hue)", ["--len" as string]: c }}
        />
      </svg>
      <span
        aria-hidden
        className="ftp-num"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: Math.round(size / 4),
          fontWeight: 700,
          color: "var(--hue-deep)",
        }}
      >
        {f.number(p / 100, { style: "percent", maximumFractionDigits: 0 })}
      </span>
    </span>
  );
}
