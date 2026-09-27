/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  page-kit — small calm pieces for module pages (design v5)
// ═══════════════════════════════════════════════════════════════════════
//
//    IconChip       a Lucide icon in a soft chip of the page hue. Use it as
//                   the marker on a card instead of an emoji (emoji are
//                   only for module identity: sidebar, page title, tiles).
//    IconPictogram  "8 of every 10": N Lucide icons, the first ones lit in
//                   the page hue. A picture that encodes data.
//    ReadingAge     the honest date line under a big reading. Fresh → a
//                   quiet "Recorded 27 Sep, 2:30 pm". Older than the
//                   module's max age → a calm amber line with the date,
//                   the age in days and "we could not find newer data".
//                   No date → "date not published by the source".
//    PageActions    the quiet row at the end of a page: CSV (when the page
//                   has rows), Share (the phone's share sheet, else copy
//                   the link) and Compare with another district.
//
//  Sources and the "not an official website" line are NOT here: the
//  district layout adds one verification panel at the
//  bottom of every page, so pages must not repeat them.
//
//  Words: src/dictionaries/<locale>/page_pagekit.json (en / hi / kn).
"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check, Clock, Download, GitCompare, Share2, type LucideIcon } from "lucide-react";
import { Toolbar, ToolbarButton } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

const DAY_MS = 86_400_000;

// ─────────────────────────────────────────────────────────────────────
//  Time helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Milliseconds since 1970 as seen by the reader's browser: 0 on the server
 * and while hydrating (so nothing time-based renders twice), then the
 * time the page first read the clock. Day-sized ages need no ticking.
 */
let clientNow = 0;
const noSubscribe = () => () => {};
const clientSnapshot = () => {
  if (!clientNow) clientNow = Date.now();
  return clientNow;
};
const serverSnapshot = () => 0;

export function useClientNow(): number {
  return useSyncExternalStore(noSubscribe, clientSnapshot, serverSnapshot);
}

/** Whole days between a timestamp and `now` (0 when either is unknown). */
export function ageInDays(at: string | Date | null | undefined, now: number): number {
  if (!at || !now) return 0;
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((now - t) / DAY_MS));
}

/** True when a reading is older than `maxAgeHours` (false while `now` is unknown). */
export function isOlderThan(at: string | Date | null | undefined, maxAgeHours: number, now: number): boolean {
  if (!at || !now) return false;
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t > maxAgeHours * 3_600_000;
}

// ─────────────────────────────────────────────────────────────────────
//  IconChip
// ─────────────────────────────────────────────────────────────────────

/** A Lucide icon in a soft chip of the page hue (card marker, 32–44 px). */
export function IconChip({ icon: Icon, size = 40 }: { icon: LucideIcon; size?: number }) {
  return (
    <span className="ftp-icon-chip" aria-hidden style={{ width: size, height: size, borderRadius: Math.round(size * 0.3) }}>
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.75} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  IconPictogram
// ─────────────────────────────────────────────────────────────────────

/**
 * `total` icons in a row; the first `filled` (may be fractional) are drawn
 * in the page hue, the rest in a pale grey. `label` is the sentence shown
 * under the row and read by screen readers.
 */
export function IconPictogram({
  icon: Icon,
  filled,
  total = 10,
  label,
  size = 26,
}: {
  icon: LucideIcon;
  filled: number;
  total?: number;
  label: string;
  size?: number;
}) {
  const lit = Math.max(0, Math.min(total, Math.round(filled)));
  return (
    <figure style={{ margin: 0 }}>
      <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: size + 12,
              height: size + 12,
              borderRadius: 10,
              background: i < lit ? "var(--hue-tint)" : "var(--ftp-surface-2)",
              color: i < lit ? "var(--hue)" : "var(--ftp-border-strong)",
            }}
          >
            <Icon size={size} strokeWidth={1.75} />
          </span>
        ))}
      </div>
      <figcaption style={{ marginTop: 10, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text)" }}>{label}</figcaption>
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ReadingAge
// ─────────────────────────────────────────────────────────────────────

/**
 * The date line under a big reading (temperature, dam level, mandi price).
 *
 * @prop at           When the reading was true (the source's own date).
 * @prop maxAgeHours  How old it may be and still count as current for this
 *                    module (weather 24 h, dams 72 h, mandi prices 168 h).
 * @prop what         Wording: "reading" (weather, dams) or "prices" (mandi).
 * @prop withTime     Show the time of day too (weather). Default: date only.
 */
export function ReadingAge({
  at,
  maxAgeHours,
  what = "reading",
  withTime = false,
  now: nowProp,
}: {
  at: string | Date | null | undefined;
  maxAgeHours: number;
  what?: "reading" | "prices" | "data";
  withTime?: boolean;
  /** Pass the page's clock so the line agrees with the rest of the page. */
  now?: number;
}) {
  const t = useTranslations("page_pagekit");
  const f = useFormat();
  const ownNow = useClientNow();
  const now = nowProp ?? ownNow;

  if (!at || !Number.isFinite(new Date(at).getTime())) {
    return <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("age.noDate")}</p>;
  }

  const day = f.date(at, { day: "numeric", month: "short", year: "numeric" });
  const when = withTime ? `${day}, ${f.time(at, { hour: "2-digit", minute: "2-digit" })}` : day;

  // Until the page knows the time (first client render), show only the date.
  if (!now || !isOlderThan(at, maxAgeHours, now)) {
    return (
      <p suppressHydrationWarning style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        {t("age.recorded", { date: when })}
      </p>
    );
  }

  const days = ageInDays(at, now);
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        background: "var(--ftp-warn-tint)",
        border: "1px solid color-mix(in srgb, var(--ftp-warn) 25%, transparent)",
        color: "var(--ftp-text)",
        maxWidth: 560,
      }}
    >
      <Clock size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
      <p suppressHydrationWarning style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>
        <strong style={{ fontWeight: 650 }}>{t(`age.${what}Stale`, { date: when })}</strong>
        {" · "}
        {days > 0 ? t("age.staleDays", { n: days }) : t("age.staleHours")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  PageActions
// ─────────────────────────────────────────────────────────────────────

/**
 * The quiet actions row at the end of a module page.
 *
 * @prop moduleSlug  For the Compare link (/compare?module=…&a=…).
 * @prop shareText   One translated sentence for the share sheet.
 * @prop onCsv       Download handler; the CSV button shows only when given.
 * @prop csvLabel    The page's own CSV wording ("Download rain data (CSV)").
 * @prop compare     Show "Compare with another district" (default true).
 */
export function PageActions({
  locale,
  district,
  moduleSlug,
  shareText,
  onCsv,
  csvLabel,
  compare = true,
}: {
  locale: string;
  district: string;
  moduleSlug: string;
  shareText?: string;
  onCsv?: () => void;
  csvLabel?: string;
  compare?: boolean;
}) {
  const t = useTranslations("page_pagekit");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: document.title, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // The share sheet was closed or the clipboard is blocked; the address bar still has the link.
    }
  }

  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;
  return (
    <Toolbar label={t("actions")}>
      {onCsv && (
        <ToolbarButton icon={Download} onClick={onCsv}>
          {csvLabel ?? t("csv")}
        </ToolbarButton>
      )}
      <ToolbarButton icon={copied ? Check : Share2} onClick={share} ariaLabel={t("shareAria")}>
        <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
      </ToolbarButton>
      {compare && (
        <ToolbarButton icon={GitCompare} href={compareHref}>
          {t("compare")}
        </ToolbarButton>
      )}
    </Toolbar>
  );
}
