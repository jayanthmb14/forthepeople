/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  services-2 kit — small pieces shared by the Housing schemes, How to get
//  certificates, Govt offices near you, Weather & rain and Alerts pages
//  (docs/LAYOUT.md recipe).
// ═══════════════════════════════════════════════════════════════════════
//
//    TapCard     a card that is a button: tapping it opens a DetailSheet
//    LinkCard    a big link to another module ("Other Govt schemes →")
//    ActionLink  a 44 px button-link for a sheet footer (Call, Directions)
//    SheetNote   the plain sentence at the top of a sheet
//    SheetBlock  a titled block inside a sheet
//    TagList     chips inside a sheet
//    StageBar    one bar split into stages, with the numbers in a legend
//    Checklist   "tick what you have ready" (documents for a certificate)
//    SearchBox   a labelled 44 px search input
//    PageEnd     about text, sources, "not an official website", and the
//                WhatsApp / Copy link / Compare / CSV row — translated
//    useNow      the time, refreshed once a minute (for "open now")
//
//  Colours come from the page hue. Callers pass translated text, except
//  PageEnd, which reads the `end.*` keys of the page's own namespace.
"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, ChevronRight, Download, GitCompare, Link2, MessageCircle, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton } from "@/components/district/ui";
import { getModuleSources } from "@/lib/constants/state-config";
import { scriptLang } from "@/lib/utils/script-lang";

// ─────────────────────────────────────────────────────────────────────
//  Cards
// ─────────────────────────────────────────────────────────────────────

/**
 * TapCard — one item in a list. The whole card is a button that opens the
 * item's DetailSheet, so it only holds phrasing content (spans).
 *
 * @prop hint   "See details", shown at the bottom with a chevron.
 * @prop style  Extra styles, e.g. a severity wash on the Alerts page.
 */
export function TapCard({
  emoji,
  icon: Icon,
  title,
  titleLang,
  subtitle,
  subtitleLang,
  aside,
  hint,
  onOpen,
  children,
  style,
}: {
  /** v4: an emoji in the chip. v5 pages pass `icon` (or nothing) instead. */
  emoji?: string;
  /** v5: a small line icon in the hue. */
  icon?: LucideIcon;
  title: React.ReactNode;
  titleLang?: string;
  subtitle?: React.ReactNode;
  subtitleLang?: string;
  aside?: React.ReactNode;
  hint: string;
  onOpen: () => void;
  children?: React.ReactNode;
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
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        ...style,
      }}
    >
      <span style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", minWidth: 0 }}>
        {Icon ? (
          <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10 }}>
            <Icon size={16} />
          </span>
        ) : emoji ? (
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
            {emoji}
          </span>
        ) : null}
        <span style={{ display: "block", flex: 1, minWidth: 0 }}>
          <span
            lang={titleLang}
            className="ftp-display"
            style={{ display: "block", fontSize: 16, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)", overflowWrap: "anywhere" }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              lang={subtitleLang}
              style={{ display: "block", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", marginTop: 2, overflowWrap: "anywhere" }}
            >
              {subtitle}
            </span>
          )}
        </span>
        {aside && <span style={{ display: "block", flexShrink: 0, textAlign: "end" }}>{aside}</span>}
      </span>
      {children && <span style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>{children}</span>}
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

/**
 * A small "🏢 Tahsildar office" line inside a card. `clamp` cuts long text
 * after that many lines on the card (the sheet shows it in full).
 */
export function MetaLine({
  emoji,
  icon: Icon,
  children,
  lang,
  clamp,
}: {
  /** v4 emoji; v5 pages pass `icon` (or nothing). */
  emoji?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  lang?: string;
  clamp?: number;
}) {
  const clampStyle: React.CSSProperties = clamp
    ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }
    : {};
  return (
    <span style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, lineHeight: "19px", color: "var(--ftp-text)", minWidth: 0 }}>
      {Icon ? (
        <Icon size={14} aria-hidden style={{ color: "var(--hue-deep)", flexShrink: 0, marginTop: 2 }} />
      ) : emoji ? (
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 14, lineHeight: "19px" }}>
          {emoji}
        </span>
      ) : null}
      <span lang={lang} style={{ minWidth: 0, overflowWrap: "anywhere", ...clampStyle }}>
        {children}
      </span>
    </span>
  );
}

/** A tinted chip ("🇮🇳 All India", "FY 2024-25"). `color` overrides the hue colours. */
export function Chip({ emoji, children, bg, color }: { emoji?: string; children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 999,
        background: bg ?? "var(--hue-tint)",
        color: color ?? "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        maxWidth: "100%",
        overflowWrap: "anywhere",
      }}
    >
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      {children}
    </span>
  );
}

/** LinkCard — a whole-card link to another module page (internal). */
export function LinkCard({
  href,
  emoji,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  /** v4 emoji; v5 pages pass `icon` (or nothing). */
  emoji?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  body?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="ftp-card-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 44,
        padding: "14px 16px",
        borderRadius: "var(--ftp-radius-card)",
        border: "1px solid var(--ftp-border)",
        background: "var(--ftp-surface)",
        boxShadow: "inset 3px 0 0 var(--hue), var(--ftp-shadow-1)",
        textDecoration: "none",
        color: "var(--ftp-text)",
      }}
    >
      {Icon ? (
        <span className="ftp-icon-chip" aria-hidden style={{ width: 36, height: 36, borderRadius: 11 }}>
          <Icon size={18} />
        </span>
      ) : emoji ? (
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 28, lineHeight: 1 }}>
          {emoji}
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ftp-display" style={{ display: "block", fontSize: 16, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)" }}>
          {title}
        </span>
        {body && <span style={{ display: "block", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", marginTop: 2 }}>{body}</span>}
      </span>
      <ChevronRight size={18} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Sheet pieces
// ─────────────────────────────────────────────────────────────────────

/**
 * ActionLink — a 44 px button-link for a sheet footer. `primary` fills it
 * with the hue (one per sheet). `internal` uses client navigation; tel:
 * and maps links open in place; `newTab` opens other sites in a new tab.
 */
export function ActionLink({
  href,
  emoji,
  children,
  primary,
  newTab,
  internal,
  ariaLabel,
}: {
  href: string;
  emoji?: string;
  children: React.ReactNode;
  primary?: boolean;
  newTab?: boolean;
  internal?: boolean;
  ariaLabel?: string;
}) {
  const style: React.CSSProperties = {
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
    textAlign: "center",
  };
  const className = primary ? "ftp-btn ftp-btn-primary" : "ftp-btn ftp-btn-secondary";
  const inner = (
    <>
      {emoji && (
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 16 }}>
          {emoji}
        </span>
      )}
      {children}
    </>
  );
  if (internal) {
    return (
      <Link href={href} className={className} style={style} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      {inner}
    </a>
  );
}

/** The plain sentence at the top of a sheet, on a soft hue wash. */
export function SheetNote({ emoji, children, lang }: { emoji?: string; children: React.ReactNode; lang?: string }) {
  return (
    <p
      lang={lang}
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
      {emoji && (
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 20, lineHeight: 1.2 }}>
          {emoji}
        </span>
      )}
      <span style={{ minWidth: 0 }}>{children}</span>
    </p>
  );
}

/** A titled block inside a sheet ("📄 Documents to carry"). */
export function SheetBlock({ emoji, title, children }: { emoji?: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15, lineHeight: 1.4, fontWeight: 650, color: "var(--hue-deep)" }}>
        {emoji && (
          <span className="ftp-emoji" aria-hidden>
            {emoji}
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Chips in a sheet (services an office handles). */
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
            overflowWrap: "anywhere",
          }}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

/** Small print at the bottom of a sheet ("Source: … · Updated 12 Sep"). */
export function SheetSmall({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", overflowWrap: "anywhere" }}>{children}</p>;
}

// ─────────────────────────────────────────────────────────────────────
//  StageBar
// ─────────────────────────────────────────────────────────────────────

export interface Stage {
  key: string;
  /** Translated name of the stage ("Finished"). */
  label: string;
  value: number;
  /** Formatted value for the legend. */
  display: string;
  /** CSS colour. */
  color: string;
  emoji?: string;
}

/**
 * StageBar — one bar split into stages ("finished · being built · not
 * started"), with every number repeated in the legend. Zero-value stages
 * are drawn as nothing but still listed. Renders nothing when all are 0.
 */
export function StageBar({ stages, ariaLabel, height = 14, legend = true }: { stages: Stage[]; ariaLabel: string; height?: number; legend?: boolean }) {
  const total = stages.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return null;
  return (
    <span style={{ display: "block", minWidth: 0 }}>
      <span
        role="img"
        aria-label={ariaLabel}
        style={{ display: "flex", width: "100%", height, borderRadius: 999, overflow: "hidden", background: "var(--ftp-surface-2)" }}
      >
        {stages.map((s, i) =>
          s.value > 0 ? (
            <span
              key={s.key}
              className="ftp-grow-x"
              style={{
                display: "block",
                width: `${(s.value / total) * 100}%`,
                minWidth: 3,
                height: "100%",
                background: s.color,
                ["--i" as string]: i,
              }}
            />
          ) : null,
        )}
      </span>
      {legend && (
        <span style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 6 }}>
          {stages.map((s) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              {s.label}
              <span className="ftp-num" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
                {s.display}
              </span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Checklist
// ─────────────────────────────────────────────────────────────────────

/**
 * Checklist — each item is a real checkbox (44 px row) so a visitor can
 * tick the papers they already have. Nothing is saved; it resets when the
 * sheet closes. `status` says "3 of 5 ready" in the page language.
 */
export function Checklist({ items, lang, status }: { items: string[]; lang?: string; status: (done: number, total: number) => string }) {
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => {
          const on = done.has(i);
          return (
            <li key={`${item}-${i}`}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 44,
                  padding: "6px 12px",
                  borderRadius: 12,
                  border: `1px solid ${on ? "var(--hue)" : "var(--ftp-border)"}`,
                  background: on ? "var(--hue-tint)" : "var(--ftp-surface)",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: "20px",
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(i)}
                  style={{ width: 20, height: 20, accentColor: "var(--hue)", flexShrink: 0, margin: 0 }}
                />
                <span lang={lang} style={{ minWidth: 0, overflowWrap: "anywhere", textDecoration: on ? "line-through" : "none", color: on ? "var(--ftp-text-2)" : "var(--ftp-text)" }}>
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--hue-deep)" }}>
        {status(done.size, items.length)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  SearchBox
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 260px", maxWidth: 560 }}>
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

// ─────────────────────────────────────────────────────────────────────
//  PageEnd — about · sources · not official · share / compare / CSV
// ─────────────────────────────────────────────────────────────────────

/** getModuleSources() frequency text → `end.freq.<key>` message key. */
const FREQ_KEY: Record<string, string> = {
  "Every 30 minutes": "every30",
  "Every 6 hours": "every6h",
  Daily: "daily",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Annual: "annual",
  "When the source publishes": "whenPublished",
};

/**
 * PageEnd — the bottom of a page in this group. Reads `end.*` from the
 * page's namespace (`ns`), so every word is translated.
 *
 * @prop about      The page's plain description (for readers and search engines).
 * @prop shareText  One line for the WhatsApp message.
 * @prop onCsv      Show a "Download CSV" button that calls this.
 */
export function PageEnd({
  ns,
  sourceModule,
  moduleSlug,
  state,
  district,
  locale,
  districtName,
  about,
  shareText,
  onCsv,
}: {
  ns: string;
  /** Key for getModuleSources ("housing", "weather"…). */
  sourceModule: string;
  moduleSlug: string;
  state: string;
  district: string;
  locale: string;
  districtName: string;
  about?: React.ReactNode;
  shareText: string;
  onCsv?: () => void;
}) {
  const t = useTranslations(ns);
  const [copied, setCopied] = useState(false);
  const info = getModuleSources(sourceModule, state);
  const fk = FREQ_KEY[info.frequency];
  const freq = fk && t.has(`end.freq.${fk}`) ? t(`end.freq.${fk}`) : info.frequency;
  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;

  const pageUrl = () => (typeof window !== "undefined" ? window.location.href : "");
  const onWhatsApp = () => {
    const text = [t("end.shareHead", { district: districtName }), "", shareText, "", t("end.shareSource", { url: pageUrl() }), "#ForThePeople"].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / insecure context): nothing to do.
    }
  };

  return (
    <footer style={{ marginTop: 32 }}>
      {about && (
        <div className="ftp-prose" style={{ marginBottom: 8 }}>
          <h2 className="ftp-label" style={{ margin: "0 0 4px" }}>
            {t("end.about")}
          </h2>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: 0 }}>
            {about}
          </p>
        </div>
      )}
      <SourcesFooter defaultOpen sources={info.sources.map((name) => ({ name, frequency: freq }))} />
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "10px 0 0" }}>{t("end.notOfficial")}</p>
      <Toolbar label={t("end.actions")}>
        {onCsv && (
          <ToolbarButton icon={Download} onClick={onCsv}>
            {t("end.csv")}
          </ToolbarButton>
        )}
        <ToolbarButton icon={MessageCircle} onClick={onWhatsApp} ariaLabel={t("end.whatsappAria")}>
          {t("end.whatsapp")}
        </ToolbarButton>
        <ToolbarButton icon={copied ? Check : Link2} onClick={onCopy}>
          <span aria-live="polite">{copied ? t("end.copied") : t("end.copy")}</span>
        </ToolbarButton>
        <ToolbarButton icon={GitCompare} href={compareHref}>
          {t("end.compare")}
        </ToolbarButton>
      </Toolbar>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  useNow — the time, refreshed once a minute, shared by every caller
// ─────────────────────────────────────────────────────────────────────
// Kept outside React so render stays pure: the snapshot only changes when
// the minute timer ticks. On the server (and while hydrating) it is 0,
// meaning "time not known yet" — callers show nothing time-based then.

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

function nowServerSnapshot(): number {
  return 0;
}

/** Milliseconds since epoch, updated every minute; 0 on the server. */
export function useNow(): number {
  return useSyncExternalStore(subscribeNow, nowSnapshot, nowServerSnapshot);
}

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────

/** Google Maps search link: a point when we have one, else the place's name and address. */
export function mapsUrl(query: string, lat?: number | null, lng?: number | null): string {
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** "080-2222 1234 / 2222 5678" → ["080-2222 1234", "2222 5678"] (numbers with at least 5 digits). */
export function phoneList(phone: string | null | undefined): string[] {
  if (!phone) return [];
  return phone
    .split(/[/,;|]|\bor\b/i)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, "").length >= 5);
}

/** A phone number as a tel: link target (spaces and dashes removed). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** A stored link ("pmayg.nic.in", "https://…") as a full https URL, or null when it is not a link. */
export function extUrl(u: string | null | undefined): string | null {
  const s = (u ?? "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(s)) return `https://${s}`;
  return null;
}

/** The first http(s) link inside free text (a `source` field), or null. */
export function firstUrl(text: string | null | undefined): string | null {
  const m = /https?:\/\/[^\s|,)]+/i.exec(text ?? "");
  return m ? m[0] : null;
}

/** "https://www.pmayg.nic.in/x" → "pmayg.nic.in". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * lang for a piece of stored text: its script's language (ಕನ್ನಡ → kn),
 * else English when the page is in another language (data stays as
 * published), else nothing.
 */
export function dataLang(text: string | null | undefined, locale: string): string | undefined {
  return scriptLang(text) ?? (locale === "en" ? undefined : "en");
}

/** Words that say nothing about WHICH office or document it is. */
const STOP = new Set([
  "the", "and", "for", "office", "offices", "department", "dept", "district", "taluk", "govt", "government",
  "of", "at", "in", "or", "any", "nearest", "local", "centre", "center", "from", "with", "via", "online",
]);

/** Lower-case search words (3+ letters, no filler words), for matching free text. */
export function searchWords(text: string | null | undefined): string[] {
  return (text ?? "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

/**
 * Filter by a search query: rows that contain every word first; when none
 * does, rows that contain any word, best first. An empty query keeps all.
 */
export function searchRows<T>(rows: T[], query: string, fields: (row: T) => Array<string | null | undefined>): T[] {
  const words = searchWords(query);
  const raw = query.trim().toLowerCase();
  if (!raw) return rows;
  if (words.length === 0) return rows.filter((r) => fields(r).some((f) => (f ?? "").toLowerCase().includes(raw)));
  const scored = rows.map((r) => {
    const hay = fields(r).map((f) => (f ?? "").toLowerCase()).join(" ");
    return { r, score: words.filter((w) => hay.includes(w)).length };
  });
  const all = scored.filter((s) => s.score === words.length);
  if (all.length > 0) return all.map((s) => s.r);
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.r);
}
