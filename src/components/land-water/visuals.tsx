/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Land & water pictures — shared by the crops, farm, water and gram
//  panchayat pages
// ═══════════════════════════════════════════════════════════════════════
//
//    HueDonut     a ring split into slices in shades of the page hue, with
//                 a legend (emoji, label, count, share) beside it
//    HueBarList   a ranked list of horizontal bars, each with an emoji chip;
//                 rows can be buttons that pick an item on the page
//    MiniRing     a small progress ring with the % in the middle (cards)
//    useDistrictName  the district name for sentences, in the reader's
//                 script when the registry has it
//
//  These hold no words of their own: every label arrives translated from
//  the page. Numbers go through useFormat(). Colours come from the page
//  hue (--hue, --hue-deep, --hue-pop, --hue-tint), so each module keeps
//  its colour. Rings draw in and bars grow in once (globals.css classes
//  ftp-draw-path / ftp-grow-x); reduced motion shows the final state.
"use client";

import React from "react";
import { useFormat } from "@/i18n/client";
import { getDistrict } from "@/lib/constants/districts";
import { scriptLang } from "@/lib/utils/script-lang";

/** Slice colours in order: neighbours always differ in lightness. */
export const HUE_SHADES = [
  "var(--hue)",
  "var(--hue-pop)",
  "var(--hue-deep)",
  "color-mix(in srgb, var(--hue) 45%, #fff)",
  "color-mix(in srgb, var(--hue-deep) 55%, var(--hue-pop))",
  "color-mix(in srgb, var(--hue-pop) 35%, #fff)",
];

/**
 * The district's name for use inside sentences: the local-script name
 * when it is in the reader's language (ಮಂಡ್ಯ on /kn), else the English
 * registry name, else the slug in title case.
 */
export function useDistrictName(state: string, district: string): string {
  const { locale } = useFormat();
  const d = getDistrict(state, district);
  if (!d) return district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return d.nameLocal && scriptLang(d.nameLocal) === locale ? d.nameLocal : d.name;
}

/**
 * Pick which of a (name, local-script name) pair leads, for a data name
 * such as a dam or a panchayat: the local one leads when it is in the
 * reader's language. Returns the lang tag of each so screen readers
 * switch voice.
 */
export function namePair(
  name: string,
  nameLocal: string | null | undefined,
  locale: string,
): { primary: string; primaryLang?: string; secondary?: string; secondaryLang?: string } {
  const local = nameLocal && nameLocal !== name ? nameLocal : undefined;
  if (local && scriptLang(local) === locale) {
    return { primary: local, primaryLang: scriptLang(local), secondary: name, secondaryLang: "en" };
  }
  return { primary: name, secondary: local, secondaryLang: scriptLang(local) };
}

// ─────────────────────────────────────────────────────────────────────
//  HueDonut
// ─────────────────────────────────────────────────────────────────────

export interface DonutSlice {
  key: string;
  /** Translated label shown in the legend. */
  label: string;
  value: number;
  emoji?: string;
  /** Optional colour; defaults to the next hue shade. */
  color?: string;
}

/**
 * HueDonut — how a whole splits into parts. Slices with value 0 still
 * appear in the legend (so "0 villages" is visible) but draw no arc.
 *
 * @prop centerValue  Big text in the hole (usually the total).
 * @prop centerLabel  Small text under it ("villages").
 * @prop ariaLabel    One sentence with every slice, for screen readers.
 */
export function HueDonut({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  size = 148,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel?: string;
  ariaLabel: string;
  size?: number;
}) {
  const f = useFormat();
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const stroke = Math.round(size * 0.15);
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const drawn = slices.filter((s) => s.value > 0).length;
  const gap = drawn > 1 ? 3 : 0;
  const arcs = slices.map((s, i) => {
    const before = slices.slice(0, i).reduce((sum, x) => sum + Math.max(0, x.value), 0);
    const len = (Math.max(0, s.value) / total) * circ;
    return {
      ...s,
      color: s.color ?? HUE_SHADES[i % HUE_SHADES.length],
      start: (before / total) * circ,
      len: Math.max(0, len - gap),
    };
  });
  return (
    <figure style={{ margin: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {arcs.map((a, i) =>
            a.len > 0 ? (
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
                transform={`rotate(${-90 + (a.start / circ) * 360} ${c} ${c})`}
                style={{ ["--len" as string]: a.len, ["--i" as string]: i }}
              />
            ) : null,
          )}
        </svg>
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
          <span className="ftp-bignum" style={{ fontSize: Math.round(size / 5), lineHeight: 1, color: "var(--hue-deep)" }}>
            {centerValue}
          </span>
          {centerLabel && (
            <span style={{ marginTop: 4, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", maxWidth: size - 2 * stroke - 8 }}>
              {centerLabel}
            </span>
          )}
        </div>
      </div>
      <ul
        aria-hidden
        style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 180px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}
      >
        {arcs.map((a) => (
          <li key={a.key} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: a.color, flexShrink: 0 }} />
            {a.emoji && (
              <span className="ftp-emoji" style={{ fontSize: 16 }}>
                {a.emoji}
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: "19px", color: "var(--ftp-text)" }}>{a.label}</span>
            <span className="ftp-num" style={{ fontSize: 14, lineHeight: "20px", color: "var(--hue-deep)" }}>
              {f.number(a.value)}
            </span>
            <span className="ftp-num" style={{ minWidth: 40, textAlign: "end", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
              {f.number(a.value / total, { style: "percent", maximumFractionDigits: 0 })}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  HueBarList
// ─────────────────────────────────────────────────────────────────────

export interface BarRow {
  key: string;
  /** Row name (data names such as a crop or panchayat stay as published). */
  label: string;
  /** lang of the label when it is in a local script. */
  labelLang?: string;
  /** Small line under the bar (market, date…), already translated. */
  sub?: string;
  emoji?: string;
  value: number;
  /** The value as shown at the end of the row ("₹42/kg", "38%"). */
  display: string;
}

/**
 * HueBarList — ranked horizontal bars. With `onSelect`, every row is a
 * button (aria-pressed) that picks the item elsewhere on the page.
 *
 * @prop max        Value of a full bar (defaults to the largest row).
 * @prop selectAria Accessible name for a row button.
 */
export function HueBarList({
  rows,
  max,
  selectedKey,
  onSelect,
  selectAria,
}: {
  rows: BarRow[];
  max?: number;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  selectAria?: (row: BarRow) => string;
}) {
  const top = max ?? Math.max(0, ...rows.map((r) => r.value));
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((row, i) => {
        const pct = top > 0 ? Math.max(2, Math.min(100, (row.value / top) * 100)) : 0;
        const active = selectedKey === row.key;
        const inner = (
          <>
            {row.emoji && (
              <span
                className="ftp-icon-chip ftp-emoji"
                aria-hidden
                style={{
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  borderRadius: 11,
                  background: "#fff",
                  border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
                }}
              >
                {row.emoji}
              </span>
            )}
            <span style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span
                  lang={row.labelLang}
                  style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)", minWidth: 0, overflowWrap: "anywhere" }}
                >
                  {row.label}
                </span>
                <span className="ftp-num" style={{ fontSize: 14, lineHeight: "20px", color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
                  {row.display}
                </span>
              </span>
              <span aria-hidden style={{ display: "block", height: 10, borderRadius: "var(--ftp-radius-pill)", background: "var(--hue-tint)", overflow: "hidden" }}>
                <span
                  className="ftp-grow-x"
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: "var(--ftp-radius-pill)",
                    background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                    ["--i" as string]: i,
                  }}
                />
              </span>
              {row.sub && <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{row.sub}</span>}
            </span>
          </>
        );
        const rowStyle: React.CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 14,
          border: `1px solid ${active ? "color-mix(in srgb, var(--hue) 45%, var(--ftp-border))" : "transparent"}`,
          background: active ? "var(--hue-tint)" : "transparent",
          textAlign: "start",
          font: "inherit",
          color: "inherit",
        };
        return (
          <li key={row.key}>
            {onSelect ? (
              <button
                type="button"
                className="ftp-chip"
                aria-pressed={active}
                aria-label={selectAria ? selectAria(row) : undefined}
                onClick={() => onSelect(row.key)}
                style={{ ...rowStyle, cursor: "pointer", minHeight: 44 }}
              >
                {inner}
              </button>
            ) : (
              <div style={rowStyle}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  MiniRing
// ─────────────────────────────────────────────────────────────────────

/** MiniRing — a small ring filled to `pct` (0–100) with the % inside. */
export function MiniRing({ pct, label, size = 46 }: { pct: number; label: string; size?: number }) {
  const f = useFormat();
  const p = Math.max(0, Math.min(100, pct));
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const len = (p / 100) * circ;
  return (
    <span role="img" aria-label={label} style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
        {p > 0 && (
          <circle
            className="ftp-draw-path"
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="var(--hue)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${len} ${circ}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${c} ${c})`}
            style={{ ["--len" as string]: len }}
          />
        )}
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
          fontSize: 11,
          fontWeight: 700,
          color: "var(--hue-deep)",
        }}
      >
        {f.number(p / 100, { style: "percent", maximumFractionDigits: 0 })}
      </span>
    </span>
  );
}
