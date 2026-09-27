/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Accountability kit — the small pieces the police, courts, file-rti,
//  rti, data-sources and update-log pages share (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//    TapCard            a whole card that is one button; tapping it opens
//                       the page's DetailSheet ("tap anything, see everything")
//    SheetAction        a 44 px action in a DetailSheet footer (Call,
//                       Directions, Open the source …), filled or quiet
//    SheetNote          one small grey sentence inside a sheet
//    SheetHeading       a small heading inside a sheet ("Year by year")
//    ChartRow           charts side by side on laptops, stacked on phones
//    ThenNowPicture     the same number in two years as two big bars
//    AccountabilityFooter  sources, the "not an official website" line,
//                       Share and Compare — all translated
//    telHref / mapsHref  safe tel: and map links from stored text
//
//  Words come from the "page_accountability" messages
//  (src/dictionaries/<locale>/page_accountability.json); everything else is
//  passed in already translated. Colours come from the page hue.
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, GitCompare, Check, ChevronRight } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton, type SourceEntry } from "@/components/district/ui";
import { getModuleSources } from "@/lib/constants/state-config";

// ─────────────────────────────────────────────────────────────────────
//  Links from stored text
// ─────────────────────────────────────────────────────────────────────

/**
 * A tel: link from a stored phone number, or null when there is no usable
 * number. Only the first number is used when several are written
 * together ("0821-2443344 / 2443355").
 */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const first = phone.split(/[,/;]|\bor\b/i)[0] ?? "";
  const digits = first.replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 3 ? `tel:${digits}` : null;
}

/** A map search link: exact point when we have it, else the name and address. */
export function mapsHref({ lat, lng, query }: { lat?: number | null; lng?: number | null; query: string }): string {
  const q = lat != null && lng != null ? `${lat},${lng}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// ─────────────────────────────────────────────────────────────────────
//  TapCard
// ─────────────────────────────────────────────────────────────────────

/**
 * TapCard — a card that is one big button. Put it in a `className="ftp-grid"`
 * list; `onOpen` opens the page's DetailSheet. The "See details" hint at the
 * bottom tells people the card can be tapped.
 *
 * @prop emoji     One emoji for the chip.
 * @prop title     The card's name (a station, a court, a source).
 * @prop titleLang lang of the title when it is not in the page language.
 * @prop sub       One grey line under the title.
 * @prop accent    A left stripe colour (e.g. a freshness colour). Optional.
 * @prop hueClassName  Wear another module's hue (e.g. on the data-sources list).
 */
export function TapCard({
  emoji,
  title,
  titleLang,
  sub,
  children,
  onOpen,
  accent,
  hueClassName,
}: {
  emoji: string;
  title: React.ReactNode;
  titleLang?: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  onOpen: () => void;
  accent?: string;
  hueClassName?: string;
}) {
  const t = useTranslations("page_accountability");
  return (
    <li className={hueClassName} style={{ listStyle: "none", minWidth: 0, display: "flex" }}>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="ftp-card-link"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          minHeight: 44,
          padding: accent ? "14px 14px 12px 18px" : "14px 14px 12px",
          textAlign: "start",
          font: "inherit",
          color: "var(--ftp-text)",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 5%, #fff) 0%, #fff 60%)",
          border: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
          borderRadius: "var(--ftp-radius-card)",
          boxShadow: "var(--ftp-shadow-1)",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {accent && (
          <span aria-hidden style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 5, background: accent }} />
        )}
        <span style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 21, borderRadius: 13 }}>
            {emoji}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span lang={titleLang} className="ftp-display" style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 650, overflowWrap: "anywhere" }}>
              {title}
            </span>
            {sub && <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", marginTop: 2, overflowWrap: "anywhere" }}>{sub}</span>}
          </span>
        </span>
        {children && <span style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>{children}</span>}
        <span
          style={{
            marginTop: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            fontSize: 13,
            lineHeight: "20px",
            fontWeight: 600,
            color: "var(--hue-deep)",
          }}
        >
          {t("seeDetails")}
          <ChevronRight size={15} aria-hidden />
        </span>
      </button>
    </li>
  );
}

/** A small tinted chip inside a TapCard ("📞 Phone listed", "⏳ 1,204 waiting"). */
export function CardChip({ emoji, children, tone }: { emoji?: string; children: React.ReactNode; tone?: "danger" | "live" | "warn" }) {
  const color = tone ? `var(--ftp-${tone === "live" ? "live-text" : tone})` : "var(--hue-deep)";
  const bg = tone ? `var(--ftp-${tone}-tint)` : "var(--hue-tint)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        alignSelf: "flex-start",
        maxWidth: "100%",
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
      }}
    >
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Inside a DetailSheet
// ─────────────────────────────────────────────────────────────────────

/** SheetAction — a 44 px action for a DetailSheet footer. Filled in the page hue, or quiet. */
export function SheetAction({
  href,
  onClick,
  emoji,
  children,
  quiet,
  external,
  ariaLabel,
}: {
  href?: string;
  onClick?: () => void;
  emoji?: string;
  children: React.ReactNode;
  quiet?: boolean;
  external?: boolean;
  ariaLabel?: string;
}) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    padding: "0 16px",
    flex: "1 1 140px",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: quiet ? "var(--ftp-border)" : "var(--hue)",
    background: quiet ? "var(--ftp-surface)" : "var(--hue)",
    color: quiet ? "var(--ftp-text)" : "#fff",
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  };
  const inner = (
    <>
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      {children}
    </>
  );
  const cls = quiet ? "ftp-btn-secondary" : "ftp-btn-primary";
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        style={style}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/** One small grey sentence inside a sheet (a caution, a date note). */
export function SheetNote({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <p style={{ margin: 0, display: "flex", gap: 8, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      <span style={{ minWidth: 0 }}>{children}</span>
    </p>
  );
}

/** A small heading inside a sheet. */
export function SheetHeading({ children, emoji }: { children: React.ReactNode; emoji?: string }) {
  return (
    <h3 className="ftp-display" style={{ margin: "4px 0 0", fontSize: 15, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)" }}>
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}{" "}
        </span>
      )}
      {children}
    </h3>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Layout helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Charts: one per row on phones and tablets, two per row from ~960 px. A
 * lone chart takes the whole row (auto-fit), so a laptop never shows half
 * an empty row beside it.
 */
export function ChartRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))",
        marginTop: 24,
        alignItems: "start",
      }}
    >
      {children}
    </div>
  );
}

/** A card list in the ftp-grid (auto-fill columns, 260 px minimum). */
export function CardList({ children, min = 260, label }: { children: React.ReactNode; min?: number; label?: string }) {
  return (
    <ul
      aria-label={label}
      className="ftp-grid"
      style={{ ["--ftp-grid-min" as string]: `${min}px`, margin: 0, padding: 0, gap: 12 } as React.CSSProperties}
    >
      {children}
    </ul>
  );
}

/** "Show all 42" / "Show fewer" under a long list. */
export function ShowAllButton({ expanded, total, onToggle }: { expanded: boolean; total: number; onToggle: () => void }) {
  const t = useTranslations("page_accountability");
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
      <ToolbarButton onClick={onToggle}>{expanded ? t("showLess") : t("showAll", { n: total })}</ToolbarButton>
    </div>
  );
}

/** A search box for long card lists. 44 px tall, label read by screen readers. */
export function ListSearch({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 420, marginBottom: 12 }}>
      <span className="sr-only">{label}</span>
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 18 }}>
        🔎
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          padding: "0 14px",
          borderRadius: 12,
          border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
          background: "var(--ftp-surface)",
          fontFamily: "var(--ftp-font-sans)",
          fontSize: 15,
          color: "var(--ftp-text)",
        }}
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ThenNowPicture
// ─────────────────────────────────────────────────────────────────────

/**
 * ThenNowPicture — one number in two years as two tall bars with the
 * change in a bubble between them. Words are passed in, translated.
 */
export function ThenNowPicture({
  thenLabel,
  nowLabel,
  thenValue,
  nowValue,
  thenText,
  nowText,
  changeText,
  emoji,
  ariaLabel,
}: {
  thenLabel: string;
  nowLabel: string;
  thenValue: number;
  nowValue: number;
  thenText: string;
  nowText: string;
  changeText: string;
  emoji: string;
  ariaLabel: string;
}) {
  const max = Math.max(thenValue, nowValue, 1);
  const up = nowValue > thenValue;
  const same = nowValue === thenValue;
  const bar = (value: number, text: string, label: string, isNow: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "1 1 0", minWidth: 0 }}>
      <span className="ftp-bignum" style={{ fontSize: 22, lineHeight: 1.1, color: isNow ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
        {text}
      </span>
      <div aria-hidden style={{ height: 150, width: "100%", maxWidth: 110, display: "flex", alignItems: "flex-end" }}>
        <div
          className="ftp-grow-y"
          style={{
            width: "100%",
            height: `${Math.max(8, (value / max) * 100)}%`,
            borderRadius: "16px 16px 6px 6px",
            background: isNow ? "linear-gradient(180deg, var(--hue) 0%, var(--hue-deep) 100%)" : "linear-gradient(180deg, #E4E1D8 0%, #D2CEC3 100%)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
            ["--i" as string]: isNow ? 1 : 0,
          }}
        >
          <span className="ftp-emoji" style={{ fontSize: 22, opacity: isNow ? 1 : 0.6 }}>
            {emoji}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{label}</span>
    </div>
  );
  return (
    <figure role="img" aria-label={ariaLabel} style={{ margin: 0, display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center" }}>
      {bar(thenValue, thenText, thenLabel, false)}
      <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto" }}>
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 30 }}>
          {same ? "➡️" : up ? "↗️" : "↘️"}
        </span>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            background: same ? "var(--ftp-surface-2)" : up ? "var(--ftp-danger-tint)" : "var(--ftp-live-tint)",
            color: same ? "var(--ftp-text-2)" : up ? "var(--ftp-danger)" : "var(--ftp-live-text)",
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

// ─────────────────────────────────────────────────────────────────────
//  Refresh cadence in the reader's language
// ─────────────────────────────────────────────────────────────────────

/** Registry cadence text (state-config.ts) → message key under "freq". */
const FREQ_KEY: Record<string, string> = {
  "Every 30 minutes": "every30min",
  "Every 6 hours": "every6h",
  Daily: "daily",
  "Daily (market days)": "dailyMarket",
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Seasonal: "seasonal",
  Annual: "annual",
  Periodic: "periodic",
  "Post-election": "postElection",
  "On-change": "onChange",
  "As announced": "asAnnounced",
  "When the source publishes": "whenPublished",
  "Updated with each release": "withRelease",
  Static: "static",
};

/**
 * Translates a registry cadence ("Monthly", "When the source publishes")
 * into the page language. Census-style mixed cadences get one plain
 * sentence; anything unknown is shown as written.
 */
export function useCadence() {
  const t = useTranslations("page_accountability");
  return (freq: string | null | undefined): string => {
    if (!freq) return "";
    const key = FREQ_KEY[freq];
    if (key) return t(`freq.${key}`);
    if (/census|decadal/i.test(freq)) return t("freq.censusMix");
    return freq;
  };
}

// ─────────────────────────────────────────────────────────────────────
//  AccountabilityFooter
// ─────────────────────────────────────────────────────────────────────

/**
 * The end of every page in this group: the Sources list (registry names,
 * with links where the page knows them), the "not an official website"
 * line, then Share and Compare. `children` sits between the two (news).
 */
export function AccountabilityFooter({
  moduleSlug,
  locale,
  state,
  district,
  extraSources = [],
  sourceUrls = {},
  showCompare = true,
  children,
}: {
  moduleSlug: string;
  locale: string;
  state: string;
  district: string;
  extraSources?: SourceEntry[];
  /** Links for registry source names, e.g. { "NJDG (National Judicial Data Grid)": "https://njdg.ecourts.gov.in" }. */
  sourceUrls?: Record<string, string>;
  showCompare?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("page_accountability");
  const cadence = useCadence();
  const info = getModuleSources(moduleSlug, state);
  const sources: SourceEntry[] = [
    ...info.sources.map((name) => ({ name, url: sourceUrls[name], frequency: cadence(info.frequency) })),
    ...extraSources,
  ];
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The share sheet was closed or the clipboard is blocked; the address bar still has the link.
    }
  }
  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;
  return (
    <>
      <SourcesFooter sources={sources} />
      <p className="ftp-prose" style={{ color: "var(--ftp-text-2)", fontSize: 12, lineHeight: 1.6, margin: "12px 0 0" }}>
        {t("notOfficial")}
      </p>
      {children}
      <Toolbar label={t("toolbarLabel")}>
        <ToolbarButton icon={copied ? Check : Share2} onClick={share} ariaLabel={t("shareAria")}>
          {copied ? t("copied") : t("share")}
        </ToolbarButton>
        {showCompare && (
          <ToolbarButton icon={GitCompare} href={compareHref}>
            {t("compare")}
          </ToolbarButton>
        )}
      </Toolbar>
    </>
  );
}
