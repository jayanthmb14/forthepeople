/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Community-page pictures (Design v4 "Rang")
// ═══════════════════════════════════════════════════════════════════════
//  Small SVG pictures used by the "Community & people" pages (news, exams,
//  contributors, famous people, population, map). Every one takes its
//  colours from the page hue, draws in once (the kit's `ftp-draw-path` /
//  `ftp-pop`, both switched off by prefers-reduced-motion), and carries a
//  text equivalent for screen readers. Numbers go through useFormat() so
//  they follow the chosen language.
//
//    ShareDonut     a ring split into categories (hue shades) + a legend
//    RingMeter      one small progress ring with the % in the middle
//    IconCountRow   a row of emoji chips, each with a count and a label
//
//  They draw only what they are given; callers hide them when data is
//  missing (a ring from one category, or from zero, tells nobody anything).
"use client";

import React from "react";
import { useFormat } from "@/i18n/client";

/** Category colours: shades of the page hue, darkest first. */
export const HUE_SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "color-mix(in srgb, var(--hue) 55%, var(--hue-pop))",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-pop) 60%, #fff)",
  "color-mix(in srgb, var(--hue-pop) 35%, #fff)",
];
/** Colour for the "everything else" slice. */
export const OTHER_SHADE = "var(--ftp-border-strong)";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  emoji?: string;
  /** Override the shade (e.g. OTHER_SHADE for "the rest"). */
  color?: string;
}

/**
 * ShareDonut — a ring split into slices (one shade of the page hue each),
 * the total in the middle, and a legend with count and share.
 *
 * @prop slices       Biggest first reads best. Zero-value slices are dropped.
 * @prop centerValue  Big text in the middle (usually the formatted total).
 * @prop centerLabel  Small word under it ("stories", "people").
 * @prop ariaLabel    One sentence describing the picture.
 * @prop formatValue  How a slice's value is written in the legend
 *                    (default: the number in the page language).
 */
export function ShareDonut({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  size = 168,
  formatValue,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel?: string;
  ariaLabel: string;
  size?: number;
  formatValue?: (n: number) => string;
}) {
  const f = useFormat();
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return null;
  const stroke = Math.round(size / 6.5);
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const gap = shown.length > 1 ? 2 : 0;
  // Where each slice starts, as a share of the ring (0 → 1), worked out
  // before drawing so render stays pure.
  const starts = shown.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + shown[i - 1].value / total);
    return acc;
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {shown.map((s, i) => {
            const frac = s.value / total;
            const len = Math.max(0.5, frac * circ - gap);
            const rot = -90 + starts[i] * 360;
            return (
              <circle
                key={s.key}
                className="ftp-draw-path"
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={s.color ?? HUE_SHADES[i % HUE_SHADES.length]}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ}`}
                strokeDashoffset={0}
                transform={`rotate(${rot} ${c} ${c})`}
                style={{ ["--len" as string]: len, ["--i" as string]: i }}
              />
            );
          })}
        </svg>
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: stroke }}
        >
          <span className="ftp-bignum" style={{ fontSize: Math.round(size / 5.2), lineHeight: 1, color: "var(--hue-deep)" }}>{centerValue}</span>
          {centerLabel && <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>{centerLabel}</span>}
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 180px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((s, i) => (
          <li key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: "20px", minWidth: 0 }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, flexShrink: 0, background: s.color ?? HUE_SHADES[i % HUE_SHADES.length] }} />
            {s.emoji && <span className="ftp-emoji" aria-hidden style={{ fontSize: 15 }}>{s.emoji}</span>}
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)", overflowWrap: "anywhere" }}>{s.label}</span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", whiteSpace: "nowrap" }}>{formatValue ? formatValue(s.value) : f.number(s.value)}</span>
            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontWeight: 400, minWidth: 40, textAlign: "right" }}>
              {f.number(s.value / total, { style: "percent", maximumFractionDigits: 0 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * RingMeter — one small ring filled to `pct` (0–100) with the % in the
 * middle. `color` defaults to the page hue; pass a semantic token
 * (var(--ftp-danger)…) when the ring carries a warning.
 */
export function RingMeter({
  pct,
  ariaLabel,
  size = 60,
  color = "var(--hue)",
}: {
  pct: number;
  ariaLabel: string;
  size?: number;
  color?: string;
}) {
  const f = useFormat();
  const p = Math.max(0, Math.min(100, pct));
  const stroke = Math.max(5, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
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
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ ["--len" as string]: circ }}
        />
      </svg>
      <span
        aria-hidden
        className="ftp-num"
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size / 4.4), color: "var(--hue-deep)" }}
      >
        {f.number(p / 100, { style: "percent", maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

export interface IconCount {
  key: string;
  emoji: string;
  label: string;
  value: number;
  /** Optional hue name (e.g. "green") for this chip; defaults to the page hue. */
  hue?: string;
}

/**
 * IconCountRow — emoji chips in a row, each with a big count and a label
 * ("✅ 3 open · 📅 5 coming up"). Wraps on phones.
 */
export function IconCountRow({ items, ariaLabel }: { items: IconCount[]; ariaLabel: string }) {
  const f = useFormat();
  return (
    <ul aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))", gap: 10 }}>
      {items.map((it, i) => (
        <li
          key={it.key}
          className={["ftp-pop", it.hue ? `ftp-hue-${it.hue}` : ""].filter(Boolean).join(" ")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)",
            border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
            minWidth: 0,
            ["--i" as string]: i,
          }}
        >
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 19, borderRadius: 11, background: "#fff" }}>
            {it.emoji}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="ftp-bignum" style={{ fontSize: 22, lineHeight: "26px", color: "var(--hue-deep)" }}>{f.number(it.value)}</span>
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", overflowWrap: "anywhere" }}>{it.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
