/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Land & water — tappable cards and small pictures (layout v4.1)
// ═══════════════════════════════════════════════════════════════════════
//
//    TapCard    a card with one transparent button stretched over it:
//               tapping anywhere opens the item's DetailSheet. Lifts on
//               hover, focus ring from globals.css. Put it inside <li> of
//               a <ul className="ftp-grid">.
//    TapHint    the small "See details ›" line at the bottom of a TapCard,
//               so a first-time visitor knows the card opens.
//    Sparkline  a tiny line of recent values (prices, dam storage) for a
//               card; needs two or more points, otherwise draws nothing.
//    SplitBar   one whole split into parts (up / same / down, or low /
//               medium / high) as a thick bar with big numbers under it.
//    Chip       a small pill in the page hue (or a quiet grey one).
//
//  No words live here: every label arrives translated from the page.
//  Colours come from the page hue variables, so each module keeps its own.
"use client";

import React from "react";
import { useFormat } from "@/i18n/client";

// ─────────────────────────────────────────────────────────────────────
//  TapCard
// ─────────────────────────────────────────────────────────────────────

/**
 * The card is a normal box (so it may hold headings, pictures and charts)
 * with one transparent button stretched over it: a tap anywhere opens the
 * sheet, keyboard users get one tab stop with a clear name (`label`, e.g.
 * "See details: Tomato"), and the focus ring draws around the whole card.
 */
export function TapCard({
  onClick,
  label,
  children,
  tinted,
  style,
}: {
  onClick: () => void;
  /** Accessible name of the stretched button. */
  label: string;
  children: React.ReactNode;
  tinted?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="ftp-card-link"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
        minHeight: 44,
        padding: 16,
        color: "var(--ftp-text)",
        background: tinted
          ? "linear-gradient(135deg, color-mix(in srgb, var(--hue) 7%, var(--ftp-surface)) 0%, var(--ftp-surface) 70%)"
          : "var(--ftp-surface)",
        border: tinted ? "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))" : "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        boxSizing: "border-box",
        minWidth: 0,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-label={label}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          padding: 0,
          margin: 0,
          border: 0,
          borderRadius: "var(--ftp-radius-card)",
          background: "transparent",
          cursor: "pointer",
          zIndex: 1,
        }}
      />
    </div>
  );
}

/** "See details ›" at the foot of a TapCard (pushed to the bottom so rows line up). */
export function TapHint({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        marginTop: "auto",
        paddingTop: 4,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 13,
        lineHeight: "18px",
        fontWeight: 600,
        color: "var(--hue-deep)",
      }}
    >
      {children}
      <span style={{ fontSize: 16, lineHeight: "18px" }}>›</span>
    </span>
  );
}

/** Emoji in a tinted square, the lead picture of a card or sheet row. */
export function EmojiTile({ emoji, size = 44 }: { emoji: string; size?: number }) {
  return (
    <span
      className="ftp-icon-chip ftp-emoji"
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.52), borderRadius: Math.round(size * 0.3) }}
    >
      {emoji}
    </span>
  );
}

/** Small pill: `tone="hue"` (tinted in the page hue) or `"quiet"` (grey). */
export function Chip({ children, tone = "hue", title }: { children: React.ReactNode; tone?: "hue" | "quiet" | "strong"; title?: string }) {
  const palette =
    tone === "strong"
      ? { bg: "var(--hue)", fg: "#fff" }
      : tone === "quiet"
        ? { bg: "var(--ftp-surface-2)", fg: "var(--ftp-text-2)" }
        : { bg: "var(--hue-tint)", fg: "var(--hue-deep)" };
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        minHeight: 24,
        padding: "2px 9px",
        borderRadius: "var(--ftp-radius-pill)",
        background: palette.bg,
        color: palette.fg,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        maxWidth: "100%",
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Sparkline
// ─────────────────────────────────────────────────────────────────────

/**
 * Sparkline — the shape of recent values, oldest on the left. The last
 * point gets a dot. Decorative inside a card whose text already says the
 * numbers, so it is aria-hidden unless a `label` is given.
 */
export function Sparkline({
  values,
  width = 104,
  height = 30,
  label,
}: {
  values: number[];
  width?: number;
  height?: number;
  label?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - 2 * pad);
  const y = (v: number) => (max === min ? height / 2 : pad + (1 - (v - min) / span) * (height - 2 * pad));
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${pad},${height} ${points} ${width - pad},${height}`;
  const last = values.length - 1;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: "block", flexShrink: 0, overflow: "visible", direction: "ltr" }}
    >
      <polygon points={area} fill="color-mix(in srgb, var(--hue) 14%, transparent)" />
      <polyline points={points} fill="none" stroke="var(--hue)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={3.2} fill="var(--hue-deep)" stroke="var(--ftp-surface)" strokeWidth={1.5} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SplitBar
// ─────────────────────────────────────────────────────────────────────

export interface SplitPart {
  key: string;
  /** Translated label under the number ("went up"). */
  label: string;
  value: number;
  emoji: string;
  /** CSS colour or gradient for the segment. */
  fill: string;
  /** Text colour on the segment (defaults to white). */
  ink?: string;
}

/**
 * SplitBar — a thick bar split into parts, then one big number per part
 * with its emoji and label. Parts with 0 still get a number (so "0 went
 * down" is visible) but no segment. `ariaLabel` is the whole picture in
 * one sentence for screen readers.
 */
export function SplitBar({ parts, ariaLabel }: { parts: SplitPart[]; ariaLabel: string }) {
  const f = useFormat();
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  if (total <= 0) return null;
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={ariaLabel}
        dir="ltr"
        style={{ display: "flex", gap: 3, height: 30, borderRadius: 12, overflow: "hidden", background: "var(--hue-tint)" }}
      >
        {parts.map((p, i) =>
          p.value > 0 ? (
            <span
              key={p.key}
              aria-hidden
              className="ftp-grow-x"
              style={{
                width: `${(p.value / total) * 100}%`,
                background: p.fill,
                color: p.ink ?? "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                ["--i" as string]: i,
              }}
            >
              {p.value / total >= 0.1 ? f.number(p.value) : ""}
            </span>
          ) : null,
        )}
      </div>
      <div
        aria-hidden
        style={{ display: "grid", gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))`, gap: 8, marginTop: 12 }}
      >
        {parts.map((p) => (
          <div key={p.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: 0 }}>
            <span className="ftp-emoji" style={{ fontSize: 26, lineHeight: 1 }}>
              {p.emoji}
            </span>
            <span className="ftp-bignum" style={{ fontSize: 26, lineHeight: "32px", color: "var(--hue-deep)", marginTop: 4 }}>
              {f.number(p.value)}
            </span>
            <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{p.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SheetBlock — a titled block inside a DetailSheet
// ─────────────────────────────────────────────────────────────────────

/** A small heading with an emoji, then content. Used inside DetailSheet bodies. */
export function SheetBlock({ emoji, title, children }: { emoji?: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)", display: "flex", alignItems: "center", gap: 8 }}>
        {emoji && (
          <span className="ftp-emoji" aria-hidden style={{ fontSize: 18 }}>
            {emoji}
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A plain sentence in a soft hue box inside a sheet ("A week ago it was …"). */
export function SheetNote({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: 14,
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 20%, transparent)",
        fontSize: 15,
        lineHeight: "23px",
        color: "var(--ftp-text)",
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 22, lineHeight: "23px" }}>
        {emoji}
      </span>
      <span style={{ minWidth: 0 }}>{children}</span>
    </p>
  );
}

/** A link styled as the sheet's main action button (opens in a new tab when external). */
export function SheetAction({
  href,
  children,
  emoji,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  emoji?: string;
  primary?: boolean;
}) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        flex: "1 1 180px",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 650,
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        border: primary ? "1px solid var(--hue)" : "1px solid var(--ftp-border-strong)",
      }}
    >
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      {children}
    </a>
  );
}
