/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Pictures for the India module deep-dive, drawn only from real rows:
 *
 *   TopStatesBars   a top-5 bar list (IndiaStateBreakdown or top_state_* rows)
 *   MixDonut        a share-of-100 ring in hue shades (mix_pct_* rows)
 *   PercentRings    one small ring per percentage indicator
 *
 * Server-safe (no hooks): every string arrives translated from the page.
 * Each picture sits in a kit ChartCard, which adds the "simple" sentence,
 * source, as-of date and the table view. Bars grow in and rings draw in
 * once (globals.css turns that off for reduced motion).
 */

import * as React from "react";
import { ChartCard } from "@/components/district/visuals";

export interface BarItem {
  label: string;
  value: number;
  /** Formatted value with unit, e.g. "45 GW". */
  display: string;
}

interface CardBase {
  title: string;
  emoji: string;
  /** Small line under the title (what is measured). */
  units?: string;
  simple: React.ReactNode;
  source?: { label: string; href?: string };
  asOf?: string;
}

/** Top-N horizontal bars, longest first. */
export function TopStatesBars({ items, ...card }: CardBase & { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  return (
    <ChartCard {...card} table={items.map((i) => ({ label: i.label, value: i.display }))}>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 14,
                lineHeight: "20px",
                marginBottom: 5,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  className="ftp-icon-chip ftp-num"
                  aria-hidden
                  style={{ width: 24, height: 24, borderRadius: 8, fontSize: 12, fontWeight: 700, color: "var(--hue-deep)" }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{it.label}</span>
              </span>
              <span className="ftp-num" style={{ fontWeight: 650, color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
                {it.display}
              </span>
            </div>
            <div aria-hidden style={{ height: 10, borderRadius: 999, background: "var(--hue-tint)", overflow: "hidden" }}>
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
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

/** Hue shades for ring segments, strongest first. */
const SHADES = [
  "var(--hue)",
  "var(--hue-pop)",
  "var(--hue-deep)",
  "color-mix(in srgb, var(--hue) 45%, #fff)",
  "color-mix(in srgb, var(--hue-deep) 55%, #fff)",
];

export interface MixPart {
  label: string;
  emoji?: string;
  pct: number;
  /** Formatted share, e.g. "47%". */
  display: string;
  /** Own colour for this part (defaults to a shade of the page hue). */
  color?: string;
}

/**
 * A donut of shares that add up to (at most) 100. When the parts add to
 * less than 100, the page passes the remainder as its own "other" part —
 * this component never invents one.
 */
export function MixDonut({
  parts,
  centerLabel,
  centerValue,
  ...card
}: CardBase & { parts: MixPart[]; centerLabel: string; centerValue: string }) {
  const size = 180;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Each segment starts where the previous ones end.
  const lengths = parts.map((p) => (Math.max(0, p.pct) / 100) * c);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <ChartCard
      {...card}
      legend={parts.map((p, i) => ({ label: `${p.emoji ? `${p.emoji} ` : ""}${p.label} ${p.display}`, swatch: p.color ?? SHADES[i % SHADES.length] }))}
      table={parts.map((p) => ({ label: p.label, value: p.display }))}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div className="ftp-pop" style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
            {parts.map((p, i) => (
              <circle
                key={p.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={p.color ?? SHADES[i % SHADES.length]}
                strokeWidth={stroke}
                strokeDasharray={`${lengths[i]} ${c - lengths[i]}`}
                strokeDashoffset={-starts[i]}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ))}
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 36,
            }}
          >
            <span className="ftp-bignum" style={{ fontSize: 28, lineHeight: "30px", color: "var(--hue-deep)" }}>
              {centerValue}
            </span>
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{centerLabel}</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

export interface RingItem {
  label: string;
  pct: number;
  display: string;
}

/** One ring per percentage — "how much of 100" at a glance. */
export function PercentRings({ items, ...card }: CardBase & { items: RingItem[] }) {
  const size = 92;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <ChartCard {...card} table={items.map((i) => ({ label: i.label, value: i.display }))}>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
          gap: 14,
        }}
      >
        {items.map((it, i) => {
          const pct = Math.max(0, Math.min(100, it.pct));
          return (
            <li key={`${it.label}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
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
                    strokeDashoffset={c * (1 - pct / 100)}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ ["--len" as string]: c, ["--i" as string]: i }}
                  />
                </svg>
                <span
                  className="ftp-bignum"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                    color: "var(--hue-deep)",
                  }}
                >
                  {it.display}
                </span>
              </div>
              <span style={{ fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>{it.label}</span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

export interface GoalItem {
  label: string;
  /** now ÷ goal × 100. */
  pct: number;
  /** "Now 21.7%, goal 33%" */
  line: string;
  /** "66%" */
  pctText: string;
}

/** Progress towards a published goal: a filled bar, with the goal at the far end. */
export function GoalBars({ items, ...card }: CardBase & { items: GoalItem[] }) {
  return (
    <ChartCard {...card} table={items.map((i) => ({ label: i.label, value: i.line }))}>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16 }}>
        {items.map((it, i) => (
          <li key={it.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ftp-text)" }}>{it.label}</span>
              <span className="ftp-bignum" style={{ fontSize: 22, color: "var(--hue-deep)" }}>
                {it.pctText}
              </span>
            </div>
            <div aria-hidden style={{ position: "relative", height: 16, borderRadius: 999, background: "var(--hue-tint)", overflow: "hidden" }}>
              <div
                className="ftp-grow-x"
                style={{
                  width: `${Math.max(2, Math.min(100, it.pct))}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                  ["--i" as string]: i,
                }}
              />
              <span className="ftp-emoji" style={{ position: "absolute", right: 4, top: 0, fontSize: 12, lineHeight: "16px" }}>
                🎯
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>{it.line}</p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
