/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Design v4 visuals — graphics a 5-year-old can read
// ═══════════════════════════════════════════════════════════════════════
//  Every piece takes its colour from the page hue (--hue, --hue-deep,
//  --hue-pop, --hue-tint) and animates in once; reduced-motion shows the
//  final state straight away (globals.css). Each one carries a text
//  equivalent (aria-label or visible sentence) so screen readers get the
//  same meaning as the picture.
//
//    Explainer   💡 "In simple words" card — one plain sentence
//    Pictogram   10 icons, N lit: "8 of every 10 rupees were spent"
//    Gauge       half-circle dial with a needle, 0–100
//    WaterTank   a tank that fills to the level, with a moving wave
//    WeatherGlyph big weather emoji picked from the condition text
//    ChartCard   the frame every chart sits in: title, units, source,
//                as-of date, and a "Show as table" switch
//    ChartGradients / chartTooltipStyle / CHART_AXIS — recharts theme
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AsOfText, SourcePill } from "@/components/district/ui";

// ─────────────────────────────────────────────────────────────────────
//  Explainer
// ─────────────────────────────────────────────────────────────────────

/**
 * Explainer — the plain-language line under a page header.
 * Example: <Explainer>Out of every ₹100 given to Mandya, ₹82 was spent.</Explainer>
 */
export function Explainer({
  children,
  emoji = "💡",
  title,
}: {
  children: React.ReactNode;
  emoji?: string;
  /** Defaults to the translated "In simple words". */
  title?: string;
}) {
  const tk = useTranslations("kit");
  const heading = !title || title === "In simple words" ? tk("inSimpleWords") : title;
  return (
    <div
      role="note"
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "14px 16px",
        margin: "0 0 20px",
        borderRadius: "var(--ftp-radius-card)",
        background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 85%)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 26, marginTop: 2 }}>
        {emoji}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>
          {heading}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 15, lineHeight: "23px", color: "var(--ftp-text)" }}>{children}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Pictogram
// ─────────────────────────────────────────────────────────────────────

/**
 * Pictogram — `total` symbols in a row, the first `filled` in full colour.
 * `filled` may be fractional (8.2 → the 9th symbol is 20 % lit).
 *
 * @prop emoji   Symbol to repeat (default 💰).
 * @prop label   Sentence read by screen readers and shown under the row.
 */
export function Pictogram({
  filled,
  total = 10,
  emoji = "💰",
  label,
  size = 28,
}: {
  filled: number;
  total?: number;
  emoji?: string;
  label: string;
  size?: number;
}) {
  const f = Math.max(0, Math.min(total, filled));
  return (
    <figure style={{ margin: 0 }}>
      <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => {
          const lit = Math.max(0, Math.min(1, f - i));
          return (
            <span
              key={i}
              aria-hidden
              className="ftp-pop"
              style={{
                position: "relative",
                display: "inline-flex",
                width: size + 10,
                height: size + 10,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: lit > 0 ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                ["--i" as string]: i,
              }}
            >
              <span className="ftp-emoji" style={{ fontSize: size, filter: "grayscale(1)", opacity: 0.28 }}>
                {emoji}
              </span>
              {lit > 0 && (
                <span
                  className="ftp-emoji"
                  style={{
                    position: "absolute",
                    fontSize: size,
                    clipPath: `inset(0 ${Math.round((1 - lit) * 100)}% 0 0)`,
                  }}
                >
                  {emoji}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{label}</figcaption>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Gauge
// ─────────────────────────────────────────────────────────────────────

/**
 * Gauge — half-circle dial, 0–100. The arc fills in the page hue and a
 * needle points at the value. Use for utilisation, coverage, scores.
 */
export function Gauge({
  value,
  label,
  caption,
  size = 180,
}: {
  value: number;
  label: string;
  caption?: string;
  size?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = Math.round(size / 11);
  const r = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const half = Math.PI * r;
  const angle = Math.PI * (1 - v / 100);
  const nx = cx + (r - stroke) * Math.cos(angle);
  const ny = cy - (r - stroke) * Math.sin(angle);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <figure style={{ margin: 0, textAlign: "center" }}>
      <svg
        width={size}
        height={size / 2 + stroke}
        viewBox={`0 0 ${size} ${size / 2 + stroke}`}
        aria-hidden
        style={{ maxWidth: "100%", overflow: "visible" }}
      >
        <path d={arc} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          className="ftp-draw-path"
          d={arc}
          fill="none"
          stroke="var(--hue)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={half}
          strokeDashoffset={half * (1 - v / 100)}
          style={{ ["--len" as string]: half }}
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--hue-deep)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="var(--hue-deep)" />
      </svg>
      <div className="ftp-bignum" style={{ fontSize: Math.round(size / 5.5), lineHeight: 1, color: "var(--hue-deep)", marginTop: 4 }}>
        {Math.round(v)}%
      </div>
      <figcaption style={{ marginTop: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        {caption ?? label}
        <span className="sr-only">: {Math.round(v)} out of 100</span>
      </figcaption>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  WaterTank
// ─────────────────────────────────────────────────────────────────────

/**
 * WaterTank — a rounded tank filled to `pct` with a gently moving wave.
 * For dam storage, JJM coverage, anything "how full is it".
 */
export function WaterTank({
  pct,
  label,
  width = 120,
  height = 150,
}: {
  pct: number;
  label: string;
  width?: number;
  height?: number;
}) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <figure style={{ margin: 0, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <div
        role="img"
        aria-label={`${label}: ${Math.round(p)}% full`}
        style={{
          position: "relative",
          width,
          height,
          borderRadius: "18px 18px 22px 22px",
          border: "3px solid color-mix(in srgb, var(--hue) 45%, #fff)",
          background: "linear-gradient(180deg, #fff 0%, var(--hue-tint) 100%)",
          overflow: "hidden",
          boxShadow: "inset 0 -8px 16px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="ftp-grow-y"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${p}%`,
            background: "linear-gradient(180deg, var(--hue-pop) 0%, var(--hue) 100%)",
          }}
        >
          {/* Wave: a 200 %-wide SVG strip that slides left forever. */}
          <svg
            aria-hidden
            viewBox="0 0 200 20"
            preserveAspectRatio="none"
            className="ftp-wave"
            style={{ position: "absolute", top: -9, left: 0, width: "200%", height: 12 }}
          >
            <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill="var(--hue-pop)" />
          </svg>
        </div>
        {/* Tick marks at 25 / 50 / 75 %. */}
        {[25, 50, 75].map((t) => (
          <span
            key={t}
            aria-hidden
            style={{ position: "absolute", right: 0, bottom: `${t}%`, width: 10, height: 2, background: "rgba(0,0,0,0.18)" }}
          />
        ))}
        <span
          className="ftp-bignum"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          <span style={{ padding: "2px 10px", borderRadius: 999, background: "rgba(255,255,255,0.9)", color: "var(--hue-deep)" }}>
            {Math.round(p)}%
          </span>
        </span>
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", textAlign: "center", maxWidth: width + 40 }}>
        {label}
      </figcaption>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  WeatherGlyph
// ─────────────────────────────────────────────────────────────────────

/** Weather emoji from an OpenWeather-style condition string. */
export function weatherEmoji(conditions?: string | null, hourIST?: number): string {
  const c = (conditions ?? "").toLowerCase();
  const night = hourIST !== undefined && (hourIST < 6 || hourIST >= 19);
  if (/thunder|storm/.test(c)) return "⛈️";
  if (/drizzle|rain|shower/.test(c)) return "🌧️";
  if (/snow/.test(c)) return "❄️";
  if (/mist|fog|haze|smoke|dust/.test(c)) return "🌫️";
  if (/overcast|broken/.test(c)) return "☁️";
  if (/scattered|few|partly|cloud/.test(c)) return night ? "☁️" : "⛅";
  if (/clear|sun/.test(c)) return night ? "🌙" : "☀️";
  return "🌤️";
}

export function WeatherGlyph({ conditions, size = 56 }: { conditions?: string | null; size?: number }) {
  return (
    <span className="ftp-emoji ftp-float" role="img" aria-label={conditions ?? "weather"} style={{ fontSize: size }}>
      {weatherEmoji(conditions)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ChartCard + recharts theme
// ─────────────────────────────────────────────────────────────────────

/** Axis tick style for every recharts chart. */
export const CHART_AXIS = { fontSize: 11, fill: "var(--ftp-text-2)", fontFamily: "var(--ftp-font-sans)" } as const;

/** Tooltip box style for every recharts chart. */
export const chartTooltipStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
  borderRadius: 12,
  boxShadow: "var(--ftp-shadow-2)",
  fontSize: 12,
  fontFamily: "var(--ftp-font-sans)",
  padding: "8px 10px",
};

/**
 * ChartGradients — put inside a recharts chart (<BarChart>…<ChartGradients/>)
 * and use fill="url(#ftpHueFill)" (vertical) or "url(#ftpHueFillH)"
 * (horizontal bars), "url(#ftpHueArea)" for areas, "url(#ftpMutedFill)"
 * for the comparison series.
 */
export function ChartGradients() {
  return (
    <defs>
      <linearGradient id="ftpHueFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--hue)" />
        <stop offset="100%" stopColor="var(--hue-pop)" />
      </linearGradient>
      <linearGradient id="ftpHueFillH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--hue-pop)" />
        <stop offset="100%" stopColor="var(--hue)" />
      </linearGradient>
      <linearGradient id="ftpHueArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--hue)" stopOpacity={0.35} />
        <stop offset="100%" stopColor="var(--hue)" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="ftpMutedFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D8D5CB" />
        <stop offset="100%" stopColor="#ECEAE3" />
      </linearGradient>
    </defs>
  );
}

/**
 * ChartCard — the frame for every chart (vault note 34: title, units,
 * source, as-of, and a data-table view for screen readers and skeptics).
 *
 * @prop table  Optional rows for "Show as table": [{label, value}] or a node.
 */
export function ChartCard({
  title,
  emoji,
  units,
  simple,
  source,
  asOf,
  asOfPeriod,
  table,
  legend,
  children,
}: {
  title: string;
  emoji?: string;
  units?: string;
  /** One plain sentence above the chart ("Rain was below normal in 7 of 12 months"). */
  simple?: React.ReactNode;
  source?: { label: string; href?: string };
  asOf?: string | Date | null;
  asOfPeriod?: string;
  table?: Array<{ label: string; value: React.ReactNode }> | React.ReactNode;
  /** Legend items: [{label, swatch}] where swatch is a CSS colour or gradient. */
  legend?: Array<{ label: string; swatch: string }>;
  children: React.ReactNode;
}) {
  const tk = useTranslations("kit");
  const [asTable, setAsTable] = React.useState(false);
  const hasTable = Boolean(table);
  return (
    <figure
      style={{
        margin: 0,
        padding: 18,
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        minWidth: 0,
      }}
    >
      <figcaption style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {emoji && (
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
              {emoji}
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <span className="ftp-display" style={{ display: "block", fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
              {title}
            </span>
            {units && <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{units}</p>}
          </div>
        </div>
        {hasTable && (
          <button
            type="button"
            onClick={() => setAsTable((x) => !x)}
            aria-pressed={asTable}
            className="ftp-btn ftp-btn-secondary"
            style={{
              height: 30,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid var(--ftp-border)",
              background: "var(--ftp-surface)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ftp-text-2)",
              cursor: "pointer",
              fontFamily: "var(--ftp-font-sans)",
            }}
          >
            <span aria-hidden>🔢 </span>{tk("tableView")}
          </button>
        )}
      </figcaption>
      {simple && (
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>
          <span aria-hidden>👉 </span>
          {simple}
        </p>
      )}
      {legend && legend.length > 0 && !asTable && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "var(--ftp-text-2)" }}>
          {legend.map((l) => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: l.swatch }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        {asTable && hasTable ? (
          Array.isArray(table) ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {(table as Array<{ label: string; value: React.ReactNode }>).map((r) => (
                  <tr key={r.label} style={{ borderBottom: "1px solid var(--ftp-border)" }}>
                    <th scope="row" style={{ textAlign: "left", fontWeight: 400, padding: "6px 4px", color: "var(--ftp-text-2)" }}>
                      {r.label}
                    </th>
                    <td className="ftp-num" style={{ textAlign: "right", padding: "6px 4px" }}>
                      {r.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            (table as React.ReactNode)
          )
        ) : (
          children
        )}
      </div>
      {(source || asOf || asOfPeriod) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
          {(asOf || asOfPeriod) && <AsOfText asOf={asOf} period={asOfPeriod} />}
          {source && <SourcePill label={source.label} href={source.href} />}
        </div>
      )}
    </figure>
  );
}
