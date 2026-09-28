/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Design v5 "Calm" visuals — graphics a 5-year-old can read
// ═══════════════════════════════════════════════════════════════════════
//  Every piece takes its colour from the page hue (--hue, --hue-deep,
//  --hue-pop, --hue-tint) in its pastel form and animates in once, gently;
//  reduced-motion shows the final state straight away (globals.css). Each
//  one carries a text equivalent (aria-label or visible sentence) so screen
//  readers get the same meaning as the picture.
//
//  v5 EMOJI RULE: no emoji here. Pictures that encode data (Pictogram,
//  WeatherGlyph, HowItWorks steps, CountdownBar) use simple monochrome
//  Lucide icons in the hue. Old call sites that pass `emoji="🏠"` get the
//  matching icon from src/lib/design/emoji-icons.ts.
//
//    Explainer    "In simple words" card — a lightbulb icon + one plain sentence
//    Pictogram    10 icons, N lit: "8 of every 10 rupees were spent"
//    Gauge        half-circle dial with a needle, 0–100
//    WaterTank    a tank that fills to the level, with a slow wave
//    WeatherGlyph weather icon picked from the condition text
//    ChartCard    the frame every chart sits in: title, units, source,
//                 as-of date, and a "Show as table" switch
//    ChartGradients / chartTooltipStyle / CHART_AXIS — recharts theme
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  AlarmClock,
  Circle,
  CircleCheck,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Hourglass,
  Lightbulb,
  Moon,
  Snowflake,
  Sun,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AsOfText, SourcePill } from "@/components/district/ui";
import { KitIcon, emojiIcon } from "@/lib/design/emoji-icons";

// ─────────────────────────────────────────────────────────────────────
//  Explainer
// ─────────────────────────────────────────────────────────────────────

/**
 * Explainer — the plain-language line under a page header.
 * Example: <Explainer>Out of every ₹100 given to Mandya, ₹82 was spent.</Explainer>
 *
 * v5.2 "White Calm": a white card with a 3 px module-hue rule on its left
 * edge and a small lightbulb icon chip (or `icon`, or the icon for a passed
 * `emoji`). Never an emoji, never a pastel wash.
 */
export function Explainer({
  children,
  emoji,
  icon,
  title,
}: {
  children: React.ReactNode;
  /** v4 prop: mapped to its Lucide icon (default lightbulb), never drawn as an emoji. */
  emoji?: string;
  icon?: LucideIcon;
  /** Defaults to the translated "In simple words". */
  title?: string;
}) {
  const tk = useTranslations("kit");
  const heading = !title || title === "In simple words" ? tk("inSimpleWords") : title;
  const chipIcon = icon ?? emojiIcon(emoji) ?? Lightbulb;
  return (
    <div
      role="note"
      // v5.7: white card + 3 px hue rule from `.ftp-card.ftp-card-tinted`.
      className="ftp-card ftp-card-tinted"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 16px",
        margin: "0 0 20px",
      }}
    >
      <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: "var(--ftp-radius-sm)", marginTop: 1 }}>
        <KitIcon icon={chipIcon} size={17} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 700, color: "var(--hue-deep)" }}>
          {heading}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 16, lineHeight: "24px", color: "var(--ftp-text)" }}>{children}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Pictogram
// ─────────────────────────────────────────────────────────────────────

/**
 * Pictogram — `total` symbols in a row, the first `filled` lit in the hue.
 * `filled` may be fractional (8.2 → the 9th symbol is 20 % lit).
 *
 * v5: the symbols are simple monochrome Lucide icons (lit = --hue on a
 * tint, unlit = pale grey-blue). Pass `icon={Coins}`; the old `emoji`
 * prop is mapped to its icon (💰 → Coins, 🏠 → House, 🧑 → User …), and
 * an emoji with no icon falls back to a plain dot.
 *
 * @prop icon    Lucide icon to repeat.
 * @prop emoji   v4 prop, mapped to a Lucide icon (default Coins).
 * @prop label   Sentence read by screen readers and shown under the row.
 */
export function Pictogram({
  filled,
  total = 10,
  icon,
  emoji,
  label,
  size = 24,
}: {
  filled: number;
  total?: number;
  icon?: LucideIcon;
  /** v4 prop: mapped to its Lucide icon, never drawn as an emoji. */
  emoji?: string;
  label: string;
  size?: number;
}) {
  const f = Math.max(0, Math.min(total, filled));
  const glyph = icon ?? (emoji === undefined ? emojiIcon("💰") : emojiIcon(emoji)) ?? Circle;
  const box = size + 12;
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
                width: box,
                height: box,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ftp-radius-sm)",
                background: lit > 0 ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                border: `1px solid ${lit > 0 ? "color-mix(in srgb, var(--hue) 18%, transparent)" : "transparent"}`,
                ["--i" as string]: i,
              }}
            >
              <KitIcon icon={glyph} size={size} strokeWidth={1.75} style={{ color: "var(--ftp-border-strong)" }} />
              {lit > 0 && (
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--hue)",
                    clipPath: `inset(0 ${Math.round((1 - lit) * 100)}% 0 0)`,
                  }}
                >
                  <KitIcon icon={glyph} size={size} strokeWidth={2} />
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
  const tKit = useTranslations("kit");
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
        <path d={arc} fill="none" stroke="var(--ftp-surface-2)" strokeWidth={stroke} strokeLinecap="round" />
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
        <span className="sr-only">: {tKit("outOf100", { n: Math.round(v) })}</span>
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
  const tKit = useTranslations("kit");
  const p = Math.max(0, Math.min(100, pct));
  return (
    <figure style={{ margin: 0, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <div
        role="img"
        aria-label={tKit("percentFull", { label, n: Math.round(p) })}
        style={{
          position: "relative",
          width,
          height,
          borderRadius: "18px 18px 22px 22px",
          border: "2px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
          background: "var(--ftp-surface)",
          overflow: "hidden",
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
            background: "color-mix(in srgb, var(--hue-pop) 80%, var(--hue))",
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
            <path d="M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill="color-mix(in srgb, var(--hue-pop) 80%, var(--hue))" />
          </svg>
        </div>
        {/* Tick marks at 25 / 50 / 75 %. */}
        {[25, 50, 75].map((t) => (
          <span
            key={t}
            aria-hidden
            style={{ position: "absolute", right: 0, bottom: `${t}%`, width: 10, height: 2, background: "var(--ftp-border-strong)" }}
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
          <span style={{ padding: "2px 10px", borderRadius: "var(--ftp-radius-pill)", background: "var(--ftp-surface)", color: "var(--hue-deep)", boxShadow: "var(--ftp-shadow-1)" }}>
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

type WeatherKind = "storm" | "rain" | "snow" | "fog" | "overcast" | "partly" | "clear" | "fair";

function weatherKind(conditions?: string | null): WeatherKind {
  const c = (conditions ?? "").toLowerCase();
  if (/thunder|storm/.test(c)) return "storm";
  if (/drizzle|rain|shower/.test(c)) return "rain";
  if (/snow/.test(c)) return "snow";
  if (/mist|fog|haze|smoke|dust/.test(c)) return "fog";
  if (/overcast|broken/.test(c)) return "overcast";
  if (/scattered|few|partly|cloud/.test(c)) return "partly";
  if (/clear|sun/.test(c)) return "clear";
  return "fair";
}

/**
 * Weather emoji from an OpenWeather-style condition string.
 * v5: prefer `weatherIcon()` / `<WeatherGlyph>` (monochrome icons). This is
 * kept for old call sites; passed to a kit `emoji` prop it is mapped to the
 * same icon anyway.
 */
export function weatherEmoji(conditions?: string | null, hourIST?: number): string {
  const night = hourIST !== undefined && (hourIST < 6 || hourIST >= 19);
  switch (weatherKind(conditions)) {
    case "storm": return "⛈️";
    case "rain": return "🌧️";
    case "snow": return "❄️";
    case "fog": return "🌫️";
    case "overcast": return "☁️";
    case "partly": return night ? "☁️" : "⛅";
    case "clear": return night ? "🌙" : "☀️";
    default: return "🌤️";
  }
}

/** Lucide weather icon from an OpenWeather-style condition string (v5). */
export function weatherIcon(conditions?: string | null, hourIST?: number): LucideIcon {
  const night = hourIST !== undefined && (hourIST < 6 || hourIST >= 19);
  switch (weatherKind(conditions)) {
    case "storm": return CloudLightning;
    case "rain": return CloudRain;
    case "snow": return Snowflake;
    case "fog": return CloudFog;
    case "overcast": return Cloud;
    case "partly": return night ? Cloud : CloudSun;
    case "clear": return night ? Moon : Sun;
    default: return CloudSun;
  }
}

/** A calm weather picture: one monochrome icon in the page hue. */
export function WeatherGlyph({ conditions, size = 48, hourIST }: { conditions?: string | null; size?: number; hourIST?: number }) {
  return (
    <span role="img" aria-label={conditions ?? "weather"} style={{ display: "inline-flex", color: "var(--hue)" }}>
      <KitIcon icon={weatherIcon(conditions, hourIST)} size={size} strokeWidth={1.6} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ChartCard + recharts theme
// ─────────────────────────────────────────────────────────────────────

/** Axis tick style for every recharts chart (12 px, secondary text: readable, never loud). */
export const CHART_AXIS = { fontSize: 12, fill: "var(--ftp-text-2)", fontFamily: "var(--ftp-font-sans)" } as const;

/**
 * Every chart draws in one soft blue (plus grey for comparisons), whatever
 * module it sits in (owner, 28 Sep 2026: "80–90 % white, a few shades of
 * blue here and there"). ChartCard puts this class on its frame, so
 * `var(--hue)`, `url(#ftpHueFill)` and friends inside a chart are blue; the
 * module hue stays on the page header, icons and chips.
 */
export const CHART_HUE_CLASS = "ftp-hue-blue";

/** Tooltip box style for every recharts chart. */
export const chartTooltipStyle: React.CSSProperties = {
  background: "var(--ftp-surface)",
  border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))",
  borderRadius: "var(--ftp-radius-tile)",
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
      {/* v5.5: softer near-flat fills (owner: "no heavy colour") — the chart
          blue at 84 % fading to 66 %, still ≥ 3 : 1 against white at the top. */}
      <linearGradient id="ftpHueFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--hue)" stopOpacity={0.84} />
        <stop offset="100%" stopColor="var(--hue)" stopOpacity={0.66} />
      </linearGradient>
      <linearGradient id="ftpHueFillH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--hue)" stopOpacity={0.66} />
        <stop offset="100%" stopColor="var(--hue)" stopOpacity={0.84} />
      </linearGradient>
      <linearGradient id="ftpHueArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--hue)" stopOpacity={0.22} />
        <stop offset="100%" stopColor="var(--hue)" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="ftpMutedFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--ftp-border-strong)" />
        <stop offset="100%" stopColor="var(--ftp-border)" />
      </linearGradient>
    </defs>
  );
}

/**
 * ChartCard — the frame for every chart (vault note 34: title, units,
 * source, as-of, and a data-table view for screen readers and skeptics).
 *
 * v5: the title carries no emoji (the `emoji` prop is accepted and ignored),
 * the one-line takeaway (`simple`) has no pointing-hand, and the table
 * switch uses a small table icon.
 * v5.5: a plain white card, and the chart inside draws in one soft blue
 * (CHART_HUE_CLASS) on every module page.
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
  /** v4 prop, kept for old call sites. v5 chart titles carry no emoji (not drawn). */
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
  void emoji;
  const tk = useTranslations("kit");
  const [asTable, setAsTable] = React.useState(false);
  const hasTable = Boolean(table);
  return (
    <figure
      // v5.7: the white card look comes from `.ftp-card` (a chart inside a
      // card becomes a quiet surface-2 panel, never a second border).
      className={`ftp-card ${CHART_HUE_CLASS}`}
      style={{
        margin: 0,
        padding: 18,
        minWidth: 0,
      }}
    >
      <figcaption style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, lineHeight: "22px", fontWeight: 700, color: "var(--ftp-text)" }}>
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
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              borderRadius: "var(--ftp-radius-tile)",
              border: `1px solid ${asTable ? "var(--hue)" : "var(--ftp-border)"}`,
              background: asTable ? "var(--hue-tint)" : "var(--ftp-surface)",
              fontSize: 12,
              fontWeight: 600,
              color: asTable ? "var(--hue-deep)" : "var(--ftp-text-2)",
              cursor: "pointer",
              fontFamily: "var(--ftp-font-sans)",
            }}
          >
            <Table2 size={14} aria-hidden />
            {tk("tableView")}
          </button>
        )}
      </figcaption>
      {simple && (
        <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{simple}</p>
      )}
      {legend && legend.length > 0 && !asTable && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, fontSize: 12, color: "var(--ftp-text-2)" }}>
          {legend.map((l) => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span aria-hidden style={{ width: 12, height: 12, borderRadius: 3, background: l.swatch }} />
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

// ── HowItWorks — "how this scheme reaches you", in 3–5 numbered steps ──
// Horizontal with arrows on tablet and up, a vertical list on phones.
// v5: each step shows its number and a small monochrome icon (pass `icon`,
// or an old `emoji` that is mapped to its icon); never an emoji.
//   <HowItWorks title={t("howTitle")} steps={[
//     { icon: NotebookPen, title: t("step.apply"), body: t("step.applyBody") },
//     { icon: Search, title: t("step.check") }, { icon: CircleCheck, title: t("step.approve") },
//     { icon: Coins, title: t("step.money") } ]} />
export function HowItWorks({
  title,
  steps,
}: {
  title?: React.ReactNode;
  steps: { icon?: LucideIcon; emoji?: string; title: React.ReactNode; body?: React.ReactNode }[];
}) {
  if (steps.length === 0) return null;
  return (
    <figure className="ftp-how" style={{ margin: 0 }}>
      {title && <figcaption className="ftp-how-title">{title}</figcaption>}
      <ol className="ftp-how-steps">
        {steps.map((s, i) => {
          return (
            <li key={i} className="ftp-how-step ftp-rise" style={{ ["--i" as string]: i } as React.CSSProperties}>
              <span className="ftp-how-head" aria-hidden>
                <span className="ftp-how-num">{i + 1}</span>
                <KitIcon icon={s.icon} emoji={s.emoji} size={18} className="ftp-how-icon" />
              </span>
              <span className="ftp-how-step-title">{s.title}</span>
              {s.body && <span className="ftp-how-step-body">{s.body}</span>}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

// ── CountdownBar — "12 days to go", filling from a start date to a target ──
// For exams, elections, scheme deadlines. `start` is when the wait began
// (notification date); the bar shows how much of the wait has passed.
// Text comes from the caller so it is translated there:
//   <CountdownBar start={exam.notifiedAt} target={exam.examDate} label={t("examIn", { n: days })} />
export function CountdownBar({
  start,
  target,
  label,
  sub,
}: {
  start: Date | string;
  target: Date | string;
  label: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const s = new Date(start).getTime();
  const e = new Date(target).getTime();
  // eslint-disable-next-line react-hooks/purity -- a countdown is relative to now by definition
  const now = Date.now();
  const span = Math.max(e - s, 1);
  // Whole percent: the server and the browser render a moment apart, so a
  // raw float never matched on hydration. suppressHydrationWarning below
  // covers the rare minute where even the rounded value differs.
  const pct = Math.round(Math.min(100, Math.max(0, ((now - s) / span) * 100)));
  const soon = e - now < 7 * 86_400_000 && e >= now;
  return (
    <div className="ftp-countdown">
      <div className="ftp-countdown-label">
        {e < now ? <CircleCheck size={16} aria-hidden /> : soon ? <AlarmClock size={16} aria-hidden /> : <Hourglass size={16} aria-hidden />}
        <span>{label}</span>
      </div>
      <div
        className="ftp-countdown-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={typeof label === "string" ? label : undefined}
        suppressHydrationWarning
      >
        <div className={`ftp-countdown-fill${soon ? " is-soon" : ""}`} style={{ width: `${pct}%` }} suppressHydrationWarning />
      </div>
      {sub && <div className="ftp-countdown-sub">{sub}</div>}
    </div>
  );
}
