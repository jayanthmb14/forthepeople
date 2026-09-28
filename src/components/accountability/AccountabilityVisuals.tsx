/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Accountability visuals — small pictures for the police, courts, RTI,
//  data-sources and update-log pages
// ═══════════════════════════════════════════════════════════════════════
//
//    ShareRing   a donut in shades of the page hue, with a legend
//    RankBars    a ranked list of horizontal bars (optional limit marker)
//    MiniRing    a small ring that fills to a %, with the value inside
//    CountChips  a row of emoji chips, each a count and a short label
//    ThenNowRow  two bars for the same thing in two years, with the change
//
//  Every piece takes its colour from the page hue (--hue, --hue-deep,
//  --hue-pop, --hue-tint), draws in once, and holds still under
//  prefers-reduced-motion (the ftp-draw-path / ftp-grow-x classes in
//  globals.css). None of them hold words of their own: every label and
//  screen-reader sentence is passed in, already translated.
"use client";

import type React from "react";

/**
 * An emoji for a government office or an RTI topic, picked from words in
 * its English name (offices and topics are stored in English). First match
 * wins; anything unknown gets a plain document.
 */
const OFFICE_EMOJI: Array<[RegExp, string]> = [
  [/metro|rail/i, "🚇"],
  [/police|fir\b|crime|home dep/i, "👮"],
  [/dam\b|cauvery|reservoir|irrigation/i, "🌊"],
  [/drain|waterlogging|storm/i, "🌧️"],
  [/water|jal\b|wssb/i, "🚰"],
  [/electric|power|bescom|uppcl|tgspdcl|discom|energy/i, "💡"],
  [/road|pothole|pwd|public works|highway/i, "🛣️"],
  [/tender|contractor/i, "📑"],
  [/tax|treasury|finance/i, "🧾"],
  [/building|construction|plan approval|permission|urban dev/i, "🏗️"],
  [/housing|allotment|awas|pmay/i, "🏠"],
  [/revenue|land|7\/12|record|survey|tahsil|taluk office/i, "🗺️"],
  [/school|education|university|college/i, "🏫"],
  [/hospital|health|medical/i, "🏥"],
  [/forest|eco-?tourism|environment/i, "🌳"],
  [/heritage|palace|tourism/i, "🏛️"],
  [/sugar|farmer|crop|agri|horticult/i, "🌾"],
  [/ration|pds|food/i, "🍚"],
  [/pension|welfare|social/i, "🤝"],
  [/transport|rto|bus/i, "🚌"],
  [/panchayat|rural/i, "🏘️"],
  [/municipal|corporation|\bcity\b/i, "🏙️"],
  [/budget|expenditure|fund|payment|smart city/i, "💰"],
];

export function officeEmoji(text: string): string {
  return OFFICE_EMOJI.find(([re]) => re.test(text))?.[1] ?? "📄";
}

/** Slice colours: shades of the page hue, darkest first; "other" is grey. */
const SHADES = [
  "var(--hue-deep)",
  "var(--hue)",
  "color-mix(in srgb, var(--hue) 55%, var(--hue-pop))",
  "var(--hue-pop)",
  "color-mix(in srgb, var(--hue-pop) 50%, #fff)",
  "color-mix(in srgb, var(--hue-deep) 55%, var(--hue-pop))",
];
const OTHER_SHADE = "#D8D5CB";

// ─────────────────────────────────────────────────────────────────────
//  ShareRing
// ─────────────────────────────────────────────────────────────────────

export interface RingSlice {
  key: string;
  label: string;
  value: number;
  /** Shown in the legend instead of the raw number (already formatted). */
  display?: string;
  /** Grey slice for "everything else". */
  other?: boolean;
  /** A fixed colour (e.g. another module's hue) instead of a page-hue shade. */
  color?: string;
}

/**
 * ShareRing — a donut of mutually exclusive parts. Only use it when the
 * parts really add up to the whole (never for overlapping categories).
 *
 * @prop centerValue  Big text in the hole (already formatted).
 * @prop centerLabel  Small text under it.
 * @prop ariaLabel    One sentence describing the picture.
 * @prop formatShare  Turns a 0–1 share into text (locale-aware %).
 */
export function ShareRing({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
  formatShare,
  size = 168,
}: {
  slices: RingSlice[];
  centerValue: string;
  centerLabel: string;
  ariaLabel: string;
  formatShare: (share: number) => string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  const stroke = Math.round(size / 7);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2 : 0; // a hairline between slices
  const arcs: Array<{ key: string; len: number; start: number; color: string; i: number }> = [];
  for (let i = 0, start = 0, shade = 0; i < slices.length; i++) {
    const s = slices[i];
    const len = (Math.max(0, s.value) / total) * c;
    const color = s.color ?? (s.other ? OTHER_SHADE : SHADES[shade++ % SHADES.length]);
    arcs.push({ key: s.key, len: Math.max(0, len - gap), start, color, i });
    start += len;
  }
  const colorOf = new Map(arcs.map((a) => [a.key, a.color]));
  return (
    <figure style={{ margin: 0, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hue-tint)" strokeWidth={stroke} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              className="ftp-draw-path"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={`${a.len} ${c}`}
              strokeDashoffset={0}
              transform={`rotate(${(a.start / c) * 360 - 90} ${size / 2} ${size / 2})`}
              style={{ stroke: a.color, ["--len" as string]: a.len, ["--i" as string]: a.i }}
            />
          ))}
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
          <span className="ftp-bignum" style={{ fontSize: Math.round(size / 6.5), lineHeight: 1.05, color: "var(--hue-deep)" }}>
            {centerValue}
          </span>
          <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{centerLabel}</span>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: "1 1 200px", minWidth: 0 }}>
        {slices.map((s) => (
          <li key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, lineHeight: "20px" }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, flexShrink: 0, background: colorOf.get(s.key) }} />
            <span style={{ flex: 1, minWidth: 0, color: "var(--ftp-text)" }}>{s.label}</span>
            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
              {s.display ?? s.value}
            </span>
            <span className="ftp-num" style={{ color: "var(--hue-deep)", minWidth: 44, textAlign: "right", whiteSpace: "nowrap" }}>
              {formatShare(Math.max(0, s.value) / total)}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  RankBars
// ─────────────────────────────────────────────────────────────────────

export interface RankItem {
  key: string;
  label: string;
  value: number;
  /** The value as text (already formatted, with its unit). */
  display: string;
  emoji?: string;
  /** Draw this bar in the danger colour (e.g. past a legal limit). */
  alert?: boolean;
  /** A .ftp-hue-<name> class so this bar (and its chip) wears another
      module's hue, e.g. each module's own colour in a list of modules. */
  hueClassName?: string;
}

/**
 * RankBars — the biggest items as horizontal bars, longest first.
 *
 * @prop marker  Optional vertical line at a value, e.g. a 30-day legal
 *               limit: { value: 30, label: "30-day limit" }.
 */
export function RankBars({
  items,
  marker,
  ariaLabel,
}: {
  items: RankItem[];
  marker?: { value: number; label: string };
  ariaLabel: string;
}) {
  if (items.length === 0) return null;
  // With a marker, leave room past it so the limit line never sits on the
  // right edge and bars that cross it visibly overshoot.
  const biggest = Math.max(...items.map((i) => i.value), 1);
  const max = marker ? Math.max(biggest, marker.value) * 1.12 : biggest;
  const markerPct = marker ? (marker.value / max) * 100 : null;
  return (
    <div>
      <ol aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => {
          const pct = Math.max(2, (it.value / max) * 100);
          return (
            <li key={it.key} className={it.hueClassName}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                {it.emoji && (
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 26, height: 26, fontSize: 14, borderRadius: 8 }}>
                    {it.emoji}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>{it.label}</span>
                <span
                  className="ftp-num"
                  style={{ fontSize: 13, lineHeight: "20px", whiteSpace: "nowrap", color: it.alert ? "var(--ftp-danger)" : "var(--hue-deep)" }}
                >
                  {it.display}
                </span>
              </div>
              <div
                aria-hidden
                style={{
                  position: "relative",
                  height: 10,
                  borderRadius: 999,
                  background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))",
                }}
              >
                <div
                  className="ftp-grow-x"
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: 999,
                    background: it.alert
                      ? "linear-gradient(90deg, color-mix(in srgb, var(--ftp-danger) 55%, #fff), var(--ftp-danger))"
                      : "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                    ["--i" as string]: i,
                  }}
                />
                {markerPct !== null && (
                  <span
                    style={{
                      position: "absolute",
                      top: -3,
                      bottom: -3,
                      left: `calc(${markerPct}% - 1px)`,
                      width: 2,
                      borderRadius: 2,
                      background: "var(--ftp-text)",
                      opacity: 0.55,
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {marker && (
        <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <span aria-hidden style={{ width: 2, height: 12, borderRadius: 2, background: "var(--ftp-text)", opacity: 0.55 }} />
          {marker.label}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  MiniRing
// ─────────────────────────────────────────────────────────────────────

/**
 * MiniRing — a ring filled to `pct` (0–100; values above 100 fill the
 * ring and still show the real number) with `valueText` in the middle.
 * The caption and screen-reader text are passed in.
 */
export function MiniRing({
  pct,
  valueText,
  caption,
  sub,
  ariaLabel,
  size = 88,
  index = 0,
}: {
  pct: number;
  valueText: string;
  caption: React.ReactNode;
  sub?: React.ReactNode;
  ariaLabel: string;
  size?: number;
  index?: number;
}) {
  const stroke = Math.max(7, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(100, pct));
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", minWidth: 0 }}>
      <div role="img" aria-label={ariaLabel} style={{ position: "relative", width: size, height: size }}>
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
            strokeDashoffset={c * (1 - fill / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ ["--len" as string]: c, ["--i" as string]: index }}
          />
        </svg>
        <span
          aria-hidden
          className="ftp-bignum"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(size / 4.6),
            color: "var(--hue-deep)",
          }}
        >
          {valueText}
        </span>
      </div>
      <figcaption style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text)", maxWidth: 180, overflowWrap: "anywhere" }}>
        {caption}
        {sub && <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{sub}</span>}
      </figcaption>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  CountChips
// ─────────────────────────────────────────────────────────────────────

export interface CountChip {
  key: string;
  emoji: string;
  value: string;
  label: string;
}

/** CountChips — a wrapping row of emoji chips: a big count and a short label. */
export function CountChips({ items, ariaLabel }: { items: CountChip[]; ariaLabel?: string }) {
  if (items.length === 0) return null;
  return (
    <ul
      aria-label={ariaLabel}
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))",
        gap: 10,
      }}
    >
      {items.map((it, i) => (
        <li
          key={it.key}
          className="ftp-pop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border)",
            minWidth: 0,
            ["--i" as string]: i,
          }}
        >
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11, background: "var(--ftp-surface)" }}>
            {it.emoji}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="ftp-bignum" style={{ fontSize: 20, lineHeight: "24px", color: "var(--hue-deep)" }}>
              {it.value}
            </span>
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{it.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ThenNowRow
// ─────────────────────────────────────────────────────────────────────

/**
 * ThenNowRow — one thing measured in two years: a grey bar for the earlier
 * year, a hue bar for the later one, and the change as text. `max` is
 * shared by every row in a list so bar lengths compare.
 */
export function ThenNowRow({
  label,
  thenValue,
  nowValue,
  thenText,
  nowText,
  changeText,
  direction,
  max,
  index = 0,
}: {
  label: string;
  thenValue: number;
  nowValue: number;
  /** "2022: 4,200" — already formatted. */
  thenText: string;
  nowText: string;
  /** "Up 7%" — already formatted. */
  changeText: string;
  direction: "up" | "down" | "same";
  max: number;
  index?: number;
}) {
  const w = (v: number) => `${Math.max(2, (v / Math.max(1, max)) * 100)}%`;
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "●";
  return (
    <li style={{ padding: "12px 0", borderTop: index === 0 ? "none" : "1px solid var(--ftp-border)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)", minWidth: 0 }}>{label}</span>
        <span
          className="ftp-num"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "1px 8px",
            borderRadius: 999,
            fontSize: 12,
            lineHeight: "18px",
            background: "var(--hue-tint)",
            color: "var(--hue-deep)",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ fontSize: 9 }}>{arrow}</span>
          {changeText}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", columnGap: 10, rowGap: 4 }}>
        <div aria-hidden style={{ height: 8, borderRadius: 999, background: "var(--ftp-surface-2)" }}>
          <div className="ftp-grow-x" style={{ height: "100%", width: w(thenValue), borderRadius: 999, background: "#D8D5CB", ["--i" as string]: index }} />
        </div>
        <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>{thenText}</span>
        <div aria-hidden style={{ height: 8, borderRadius: 999, background: "var(--ftp-surface-2)" }}>
          <div
            className="ftp-grow-x"
            style={{ height: "100%", width: w(nowValue), borderRadius: 999, background: "linear-gradient(90deg, var(--hue-pop), var(--hue))", ["--i" as string]: index }}
          />
        </div>
        <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)", whiteSpace: "nowrap" }}>{nowText}</span>
      </div>
    </li>
  );
}
