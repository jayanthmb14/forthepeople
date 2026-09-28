/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Daily-needs kit — small pieces shared by the Tap water, Power cuts,
//  Buses & trains, Hospitals & health and Schools pages (docs/LAYOUT.md).
// ═══════════════════════════════════════════════════════════════════════
//
//    TapCard     a card that is a button: tapping it opens a DetailSheet
//    SearchBox   "Find your village" input, 44 px tall
//    MoreButton  "Show all 84" under a long list
//    ActionLink  a 44 px button-link for the sheet footer (Call, Directions)
//    SheetNote   the plain sentence at the top of a sheet
//    useNow      the current time, refreshed every minute (for "on now")
//    mapsUrl     a Google Maps search link for a place or a point
//
//  Everything takes its colour from the page hue. Callers pass translated
//  text; nothing here holds an English word a citizen reads.
"use client";

import React from "react";
import { useLocale } from "next-intl";
import { ChevronRight, Search, type LucideIcon } from "lucide-react";
import { scriptLang } from "@/lib/utils/script-lang";

// ─────────────────────────────────────────────────────────────────────
//  TapCard
// ─────────────────────────────────────────────────────────────────────

/**
 * TapCard — one item in a list. The whole card is a button; tapping it
 * opens the item's DetailSheet. Content is phrasing-only (spans), so it is
 * valid inside a <button>.
 *
 * @prop icon      Optional Lucide marker in a soft hue chip (only when it carries meaning).
 * @prop title     The item's name.
 * @prop subtitle  One short line under the name.
 * @prop aside     Right-hand badge or number (a Pill, "82%").
 * @prop hint      "See details", shown at the bottom with a chevron.
 * @prop tone      "alert" draws a warm border (an ongoing power cut).
 */
export function TapCard({
  icon: Icon,
  title,
  titleLang,
  subtitle,
  subtitleLang,
  aside,
  hint,
  onOpen,
  children,
  tone,
  style,
}: {
  /** Optional Lucide marker in a soft hue chip, only when it carries meaning. */
  icon?: LucideIcon;
  title: React.ReactNode;
  titleLang?: string;
  subtitle?: React.ReactNode;
  subtitleLang?: string;
  aside?: React.ReactNode;
  hint: string;
  onOpen: () => void;
  children?: React.ReactNode;
  tone?: "alert";
  /** Extra styles, e.g. a severity wash on the Alerts page. */
  style?: React.CSSProperties;
}) {
  return (
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
        minWidth: 0,
        minHeight: 44,
        padding: 16,
        textAlign: "start",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        background: "var(--ftp-surface)",
        border:
          tone === "alert"
            ? "1px solid color-mix(in srgb, var(--ftp-warn) 45%, var(--ftp-border))"
            : "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        // v5.2 "White Calm": an alert card is white with an amber rule.
        boxShadow: tone === "alert" ? "inset 3px 0 0 var(--ftp-warn), var(--ftp-shadow-1)" : "var(--ftp-shadow-1)",
        ...style,
      }}
    >
      <span style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", minWidth: 0 }}>
        {Icon && (
          <span className="ftp-icon-chip" aria-hidden style={{ width: 36, height: 36, borderRadius: 11 }}>
            <Icon size={18} strokeWidth={1.75} />
          </span>
        )}
        <span style={{ display: "block", flex: 1, minWidth: 0 }}>
          <span
            lang={titleLang}
            className="ftp-display"
            style={{ display: "block", fontSize: 16, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)", overflowWrap: "anywhere" }}
          >
            {title}
          </span>
          {subtitle && (
            <span lang={subtitleLang} style={{ display: "block", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", marginTop: 2, overflowWrap: "anywhere" }}>
              {subtitle}
            </span>
          )}
        </span>
        {aside && <span style={{ display: "block", flexShrink: 0, textAlign: "end" }}>{aside}</span>}
      </span>
      {children && <span style={{ display: "block", width: "100%" }}>{children}</span>}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          marginTop: "auto",
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 600,
          color: "var(--hue-deep)",
        }}
      >
        {hint}
        <ChevronRight size={15} aria-hidden />
      </span>
    </button>
  );
}

/** A small bar inside a TapCard (coverage, pass rate, posts filled). */
export function CardBar({ pct, color, label }: { pct: number; color?: string; label?: React.ReactNode }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <span style={{ display: "block" }}>
      {label && (
        <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
          {label}
        </span>
      )}
      <span aria-hidden style={{ display: "block", height: 8, borderRadius: 999, background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
        <span
          className="ftp-grow-x"
          style={{
            display: "block",
            width: `${Math.max(p > 0 ? 3 : 0, p)}%`,
            height: "100%",
            borderRadius: 999,
            background: color ?? "linear-gradient(90deg, var(--hue-pop), var(--hue))",
          }}
        />
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SearchBox · MoreButton
// ─────────────────────────────────────────────────────────────────────

/** A labelled search input (44 px). The label is visible: plain words beat a placeholder. */
export function SearchBox({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 260px", maxWidth: 520 }}>
      <label htmlFor={id} style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--ftp-text)" }}>
        {label}
      </label>
      <span style={{ position: "relative", display: "block" }}>
        <Search
          size={16}
          aria-hidden
          style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--hue)" }}
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            width: "100%",
            minHeight: 44,
            boxSizing: "border-box",
            paddingInlineStart: 36,
            paddingInlineEnd: 12,
            borderRadius: 12,
            border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
            background: "var(--ftp-surface)",
            color: "var(--ftp-text)",
            fontFamily: "var(--ftp-font-sans)",
            fontSize: 15,
          }}
        />
      </span>
    </div>
  );
}

/** "Show all N" under a list that was cut short. Renders nothing when everything is shown. */
export function MoreButton({ shown, total, label, onClick }: { shown: number; total: number; label: string; onClick: () => void }) {
  if (shown >= total) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
      <button
        type="button"
        onClick={onClick}
        className="ftp-btn ftp-btn-secondary"
        style={{
          minHeight: 44,
          padding: "0 18px",
          borderRadius: 999,
          border: "1px solid color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
          background: "var(--ftp-surface)",
          color: "var(--hue-deep)",
          fontFamily: "var(--ftp-font-sans)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    </div>
  );
}

/** Match a search query against several fields, ignoring case and extra spaces. */
export function matches(query: string, ...fields: Array<string | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

// ─────────────────────────────────────────────────────────────────────
//  Sheet pieces
// ─────────────────────────────────────────────────────────────────────

/**
 * ActionLink — a 44 px button-link for the sheet footer. `primary` fills it
 * with the hue (one per sheet). tel: and maps links open in place; other
 * external links open in a new tab.
 */
export function ActionLink({
  href,
  children,
  primary,
  newTab,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  newTab?: boolean;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      className={primary ? "ftp-btn ftp-btn-primary" : "ftp-btn ftp-btn-secondary"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: primary ? "1px solid var(--hue)" : "1px solid var(--ftp-border)",
        background: primary ? "var(--hue)" : "var(--ftp-surface)",
        color: primary ? "#fff" : "var(--ftp-text)",
        fontFamily: "var(--ftp-font-sans)",
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        flex: "1 1 auto",
      }}
    >
      {children}
    </a>
  );
}

/** The plain sentence at the top of a sheet, on a soft hue wash. */
export function SheetNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        margin: 0,
        padding: "12px 14px",
        borderRadius: 14,
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        boxShadow: "inset 3px 0 0 var(--hue)",
        fontSize: 15,
        lineHeight: 1.55,
        color: "var(--ftp-text)",
      }}
    >
      <span style={{ minWidth: 0 }}>{children}</span>
    </p>
  );
}

/** A small heading inside a sheet ("Water tests"). */
export function SheetHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15, lineHeight: 1.4, fontWeight: 650, color: "var(--hue-deep)" }}>
      {children}
    </h3>
  );
}

/** Tags in a sheet (hospital services, bus stops). */
export function TagList({ items, lang }: { items: string[]; lang?: string }) {
  if (items.length === 0) return null;
  return (
    <ul lang={lang} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((s, i) => (
        <li
          key={`${s}-${i}`}
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--hue-tint)",
            color: "var(--hue-deep)",
            fontSize: 13,
            lineHeight: "18px",
            fontWeight: 600,
          }}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * A grid for a few wide things (2–4 charts, the emergency numbers): like
 * .ftp-grid but auto-FIT, so two charts on a wide PC stretch to fill the
 * row instead of leaving an empty third column. Card lists keep .ftp-grid.
 */
export function fitGrid(min = 340, marginTop = 0): React.CSSProperties {
  return {
    display: "grid",
    gap: 16,
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
    marginTop,
  };
}

/** Google Maps search link: a point when we have one, else the place's name and address. */
export function mapsUrl(query: string, lat?: number | null, lng?: number | null): string {
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** A phone number as a tel: link target (spaces and dashes removed). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// useNow — the time, refreshed once a minute, shared by every caller.
// Kept outside React so render stays pure: the snapshot only changes when
// the minute timer ticks. On the server it is 0 ("time not known yet").
let nowValue = 0;
let nowTimer: ReturnType<typeof setInterval> | null = null;
const nowListeners = new Set<() => void>();

function subscribeNow(cb: () => void): () => void {
  nowListeners.add(cb);
  if (!nowTimer) {
    nowValue = Date.now();
    nowTimer = setInterval(() => {
      nowValue = Date.now();
      nowListeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    nowListeners.delete(cb);
    if (nowListeners.size === 0 && nowTimer) {
      clearInterval(nowTimer);
      nowTimer = null;
    }
  };
}

function nowSnapshot(): number {
  if (nowValue === 0) nowValue = Date.now();
  return nowValue;
}

/** Milliseconds since 1970, refreshed every minute; 0 during the server render. */
export function useNow(): number {
  return React.useSyncExternalStore(subscribeNow, nowSnapshot, () => 0);
}

/**
 * A place name in the reader's language: the local-script name when it is
 * written in the page language (ಮಂಡ್ಯ on /kn/), otherwise the English name.
 * Returns the text and its `lang` for screen readers.
 */
export function usePlaceName() {
  const locale = useLocale();
  return (name: string, nameLocal?: string | null): { text: string; lang?: string } => {
    if (nameLocal && nameLocal !== name && scriptLang(nameLocal) === locale) return { text: nameLocal, lang: locale };
    return { text: name, lang: scriptLang(name) };
  };
}
