/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Calm parts (v5) for the module pages: small pieces with no emoji
// ═══════════════════════════════════════════════════════════════════════
//    IconPictogram  10 simple line icons in the page hue, N lit ("8 of
//                   every 10 rupees were used"). Same meaning as the kit
//                   Pictogram, drawn with a lucide icon instead of emoji.
//    CalmNote       a soft note box with an optional small icon; "warn"
//                   is the calm amber used for old data.
//    StaleNote      "This is 160 days old. We could not find newer data."
//                   or "Date not published by the source." — only when
//                   the data is older than the page's own limit.
//    daysSince      whole days between a date and now (null when unknown).
//    ListCard       a whole card that is one button (inside a <ul>), with an
//                   optional small line icon — the calm twin of the
//                   accountability TapCard, which needs an emoji.
//    SearchBox      a search field with a line icon.
//    ThenNowBars    one number in two years as two bars and the change.
//  Words come from "page_modules-a"; colours from the page hue and the
//  --ftp-warn tokens.
"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight, Clock, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

/** Whole days since `value` (0 for today), or null when there is no valid date. */
export function daysSince(value: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((now.getTime() - ms) / 86_400_000));
}

/** `total` icons in a row, the first `filled` lit in the page hue (fractions light part of one). */
export function IconPictogram({
  filled,
  total = 10,
  icon: Icon,
  label,
  size = 22,
}: {
  filled: number;
  total?: number;
  icon: LucideIcon;
  /** Sentence shown under the row and read by screen readers. */
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
              style={{
                position: "relative",
                display: "inline-flex",
                width: size + 14,
                height: size + 14,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                background: lit > 0 ? "var(--hue-tint)" : "var(--ftp-surface-2)",
              }}
            >
              <Icon size={size} strokeWidth={1.75} style={{ color: "var(--ftp-border-strong)" }} />
              {lit > 0 && (
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", clipPath: `inset(0 ${Math.round((1 - lit) * 100)}% 0 0)` }}>
                  <Icon size={size} strokeWidth={1.75} style={{ color: "var(--hue-deep)" }} />
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

/** A soft note box. `tone="warn"` is the calm amber for old or unconfirmed data. */
export function CalmNote({
  children,
  icon: Icon,
  tone = "hue",
  style,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  tone?: "hue" | "warn" | "quiet";
  style?: React.CSSProperties;
}) {
  const palette =
    tone === "warn"
      ? { bg: "var(--ftp-warn-tint)", border: "color-mix(in srgb, var(--ftp-warn) 28%, transparent)", icon: "var(--ftp-warn)" }
      : tone === "quiet"
        ? { bg: "var(--ftp-surface-2)", border: "var(--ftp-border)", icon: "var(--ftp-text-2)" }
        : { bg: "var(--hue-tint)", border: "color-mix(in srgb, var(--hue) 20%, transparent)", icon: "var(--hue-deep)" };
  return (
    <div
      role="note"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 14px",
        borderRadius: 12,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        fontSize: 14,
        lineHeight: "21px",
        color: "var(--ftp-text)",
        ...style,
      }}
    >
      {Icon && <Icon size={16} aria-hidden style={{ color: palette.icon, flexShrink: 0, marginTop: 2 }} />}
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

/**
 * The honest age line for one dataset. Renders nothing while the data is
 * within `maxAgeDays`; past it, a calm amber note with the age in days.
 * `asOf` null → "Date not published by the source" (only when `showUnknown`).
 */
export function StaleNote({
  asOf,
  maxAgeDays,
  showUnknown = false,
  style,
}: {
  asOf: string | Date | null | undefined;
  maxAgeDays: number;
  showUnknown?: boolean;
  style?: React.CSSProperties;
}) {
  const t = useTranslations("page_modules-a");
  const days = daysSince(asOf);
  if (days === null) {
    return showUnknown ? (
      <CalmNote tone="quiet" icon={Clock} style={style}>
        {t("stale.noDate")}
      </CalmNote>
    ) : null;
  }
  if (days <= maxAgeDays) return null;
  return (
    <CalmNote tone="warn" icon={Clock} style={style}>
      <strong>{t("stale.old", { n: days })}</strong> {t("stale.noNewer")}
    </CalmNote>
  );
}

/** A whole card that is one big button, for a `<ul className="ftp-grid">` list. */
export function ListCard({
  icon: Icon,
  title,
  titleLang,
  sub,
  hint,
  onOpen,
  children,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  titleLang?: string;
  sub?: React.ReactNode;
  /** The "See details" line at the bottom (translated by the page). */
  hint: string;
  onOpen: () => void;
  children?: React.ReactNode;
}) {
  return (
    <li style={{ listStyle: "none", minWidth: 0, display: "flex" }}>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="ftp-card-link"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          minHeight: 44,
          padding: "14px 14px 12px",
          textAlign: "start",
          font: "inherit",
          color: "var(--ftp-text)",
          background: "var(--ftp-surface)",
          border: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-card)",
          boxShadow: "var(--ftp-shadow-1)",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
          {Icon && (
            <span className="ftp-icon-chip" aria-hidden style={{ width: 30, height: 30, borderRadius: 10 }}>
              <Icon size={16} />
            </span>
          )}
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span lang={titleLang} style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 650, overflowWrap: "anywhere" }}>
              {title}
            </span>
            {sub && <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", marginTop: 2, overflowWrap: "anywhere" }}>{sub}</span>}
          </span>
        </span>
        {children && <span style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>{children}</span>}
        <span style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, lineHeight: "20px", fontWeight: 600, color: "var(--hue-deep)" }}>
          {hint}
          <ChevronRight size={15} aria-hidden />
        </span>
      </button>
    </li>
  );
}

/** A search field with a small line icon (44 px tall). */
export function SearchBox({ value, onChange, label, placeholder }: { value: string; onChange: (v: string) => void; label: string; placeholder: string }) {
  return (
    <label style={{ position: "relative", display: "block", maxWidth: 420, marginBottom: 12 }}>
      <span className="sr-only">{label}</span>
      <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 12, top: 14, color: "var(--hue-deep)" }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: 44,
          paddingBlock: 0,
          paddingInline: "36px 14px",
          borderRadius: 12,
          border: "1px solid var(--ftp-border-strong)",
          fontSize: 15,
          fontFamily: "var(--ftp-font-sans)",
          background: "var(--ftp-surface)",
          color: "var(--ftp-text)",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

/** One number in two years: two bars, the numbers, and the change between them. */
export function ThenNowBars({
  thenLabel,
  nowLabel,
  thenValue,
  nowValue,
  thenText,
  nowText,
  changeText,
  ariaLabel,
}: {
  thenLabel: string;
  nowLabel: string;
  thenValue: number;
  nowValue: number;
  thenText: string;
  nowText: string;
  changeText: string;
  ariaLabel: string;
}) {
  const max = Math.max(thenValue, nowValue, 1);
  const up = nowValue > thenValue;
  const same = nowValue === thenValue;
  const Arrow = same ? ArrowRight : up ? TrendingUp : TrendingDown;
  const bar = (value: number, text: string, label: string, isNow: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "1 1 0", minWidth: 0 }}>
      <span className="ftp-num" style={{ fontSize: 22, lineHeight: 1.1, fontWeight: 650, color: isNow ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
        {text}
      </span>
      <div aria-hidden style={{ height: 130, width: "100%", maxWidth: 96, display: "flex", alignItems: "flex-end" }}>
        <div
          className="ftp-grow-y"
          style={{
            width: "100%",
            height: `${Math.max(8, (value / max) * 100)}%`,
            borderRadius: "12px 12px 4px 4px",
            background: isNow ? "var(--hue)" : "var(--ftp-border-strong)",
          }}
        />
      </div>
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{label}</span>
    </div>
  );
  return (
    <figure role="img" aria-label={ariaLabel} style={{ margin: 0, display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center" }}>
      {bar(thenValue, thenText, thenLabel, false)}
      <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
        <Arrow size={22} aria-hidden style={{ color: same ? "var(--ftp-text-2)" : up ? "var(--ftp-warn)" : "var(--hue-deep)" }} />
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            background: same ? "var(--ftp-surface-2)" : up ? "var(--ftp-warn-tint)" : "var(--hue-tint)",
            color: same ? "var(--ftp-text-2)" : up ? "var(--ftp-warn)" : "var(--hue-deep)",
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {changeText}
        </span>
      </div>
      {bar(nowValue, nowText, nowLabel, true)}
    </figure>
  );
}
