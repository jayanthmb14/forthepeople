/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  StatusStrip — the slim line of small details under the header
// ═══════════════════════════════════════════════════════════════════════
//
//  PC / tablet
//    [cal] Sunday, 27 September 2026 · [clock] 9:47 PM IST · ● Share market closed · [↻] Live data refreshed 12 minutes ago
//  Phone
//    [cal] Sun, 27 Sep · 9:47 PM · ● Market closed
//
//  - Day, date and time are IST and in the page language; the clock moves
//    once a minute (no ticking seconds). They are drawn only in the
//    browser — the page is pre-rendered, so a server time would be wrong.
//  - Share market: see status-strip.ts. Links to "Prices today". Shown only
//    when the strip is sure; the snapshot is fetched only during trading
//    hours on a weekday (and then at most every 10 minutes).
//  - "Live data refreshed …" only on a district page, and only when every
//    fast feed of that district is on time (status-strip.ts). Otherwise it
//    is left out; the district bar and the page say what is late.
//  - Scrolls away with the page (not sticky), so it never covers content.
//  - Hidden on admin pages.
//
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDistrict, getState } from "@/lib/constants/districts";
import { useFormat } from "@/i18n/client";
import { useFreshness } from "@/hooks/useFreshness";
import { isNseHours, liveDataRefreshedAt, marketStatus, type MarketQuote } from "./status-strip";
import styles from "./chrome.module.css";

// ── The clock: one tick per minute, shared by every subscriber ─────────

const clockListeners = new Set<() => void>();
let clockTimer: number | null = null;

function subscribeClock(cb: () => void) {
  clockListeners.add(cb);
  if (clockTimer === null) {
    const tick = () => {
      clockListeners.forEach((l) => l());
      // Re-align to the next minute boundary every time.
      clockTimer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    clockTimer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
  }
  return () => {
    clockListeners.delete(cb);
    if (clockListeners.size === 0 && clockTimer !== null) {
      window.clearTimeout(clockTimer);
      clockTimer = null;
    }
  };
}
/** The current minute (a number, so React sees no change within a minute). */
const readMinute = () => Math.floor(Date.now() / 60_000);

// ── The market quote: fetched only in trading hours, cached 10 minutes ─

let quote: MarketQuote | null = null;
let quoteAt = 0;
let quoteLoading = false;
const quoteListeners = new Set<() => void>();

function subscribeQuote(cb: () => void) {
  quoteListeners.add(cb);
  return () => {
    quoteListeners.delete(cb);
  };
}

function loadQuote() {
  if (quoteLoading || (quoteAt && Date.now() - quoteAt < 10 * 60_000)) return;
  quoteLoading = true;
  fetch("/api/data/prices")
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { fetchedAt?: string; series?: Record<string, { asOf?: string | null } | undefined> } | null) => {
      const s = j?.series;
      const asOf = s?.sensex?.asOf ?? s?.nifty?.asOf ?? null;
      quote = j ? { quoteAsOf: asOf, fetchedAt: j.fetchedAt ?? null } : null;
    })
    .catch(() => {
      quote = null;
    })
    .finally(() => {
      quoteAt = Date.now();
      quoteLoading = false;
      quoteListeners.forEach((l) => l());
    });
}

// ── Small two-tone glyphs (decorative; the words carry the meaning) ────

function CalendarGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false" className={styles.stripGlyph}>
      <rect x="1.5" y="2.5" width="13" height="12" rx="3" className={styles.glyphPaper} />
      <path d="M1.5 5.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v1h-13z" className={styles.glyphInk} />
      <rect x="4.2" y="1" width="1.6" height="3.2" rx="0.8" className={styles.glyphDeep} />
      <rect x="10.2" y="1" width="1.6" height="3.2" rx="0.8" className={styles.glyphDeep} />
      <rect x="4" y="8.5" width="2.4" height="2.2" rx="0.6" className={styles.glyphInk} />
      <rect x="7.6" y="8.5" width="2.4" height="2.2" rx="0.6" className={styles.glyphSoft} />
      <rect x="4" y="11.4" width="2.4" height="2" rx="0.6" className={styles.glyphSoft} />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false" className={styles.stripGlyph}>
      <circle cx="8" cy="8" r="6.6" className={styles.glyphPaper} />
      <circle cx="8" cy="8" r="6.6" className={styles.glyphRing} strokeWidth="1.4" />
      <path d="M8 4.6V8l2.4 1.6" className={styles.glyphHand} strokeWidth="1.6" />
    </svg>
  );
}

function RefreshGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden focusable="false" className={styles.stripGlyph}>
      <circle cx="8" cy="8" r="7" className={styles.glyphPaper} />
      <path d="M11.6 6.2A4 4 0 1 0 12 9" className={styles.glyphHand} strokeWidth="1.6" />
      <path d="M12.4 3.6v3h-3" className={styles.glyphHand} strokeWidth="1.6" />
    </svg>
  );
}

export default function StatusStrip() {
  const t = useTranslations("header.strip");
  const locale = useLocale();
  const fmt = useFormat();
  const pathname = usePathname() ?? "";

  const minute = useSyncExternalStore(subscribeClock, readMinute, () => null);
  const now = minute === null ? null : minute * 60_000;
  const q = useSyncExternalStore(subscribeQuote, () => quote, () => null);
  const quoteKnown = useSyncExternalStore(subscribeQuote, () => quoteAt > 0, () => false);

  // Ask for the quote only while the market could be open.
  const inHours = now !== null && isNseHours(now);
  useEffect(() => {
    if (inHours) loadQuote();
  }, [inHours, minute]);

  // District page? /[locale]/[state]/[district]/…
  const parts = pathname.split("/").filter(Boolean);
  const st = parts[1] ? getState(parts[1]) : undefined;
  const dist = st && parts[2] ? getDistrict(st.slug, parts[2]) : undefined;
  const onDistrict = !!(st && dist && dist.active);
  // One shared request per district (the district bar asks for the same).
  const fresh = useFreshness(onDistrict && st ? st.slug : "", onDistrict && dist ? dist.slug : "");

  if (parts[1] === "admin") return null;

  const market = now === null ? null : marketStatus(now, inHours ? (quoteKnown ? q : null) : null);
  const refreshedAt = onDistrict && now !== null ? liveDataRefreshedAt(fresh.datasets, now) : null;

  return (
    <div className={styles.strip} role="group" aria-label={t("region")}>
      <div className={styles.stripRow}>
        {now === null ? (
          // Same height before the browser knows the time: no layout jump.
          <span className={styles.stripItem} aria-hidden>
            &nbsp;
          </span>
        ) : (
          <>
            <span className={`ftp-hue-blue ${styles.stripItem}`}>
              <CalendarGlyph />
              <time dateTime={new Date(now).toISOString()}>
                <span className={styles.stripLong}>{fmt.date(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                <span className={styles.stripShort}>{fmt.date(now, { weekday: "short", day: "numeric", month: "short" })}</span>
              </time>
            </span>
            <span className={`ftp-hue-indigo ${styles.stripItem}`}>
              <ClockGlyph />
              <span className="ftp-num">
                <span className={styles.stripLong}>{t("time", { time: fmt.time(now, { hour: "numeric", minute: "2-digit" }) })}</span>
                <span className={styles.stripShort}>{fmt.time(now, { hour: "numeric", minute: "2-digit" })}</span>
              </span>
            </span>
            {market && (
              <Link href={`/${locale}/prices`} className={styles.stripLink} title={t("marketTitle")}>
                <span className={market === "open" ? styles.dotOpen : styles.dotClosed} aria-hidden />
                <span className={styles.stripLong}>{market === "open" ? t("marketOpen") : t("marketClosed")}</span>
                <span className={styles.stripShort}>{market === "open" ? t("marketOpenShort") : t("marketClosedShort")}</span>
              </Link>
            )}
            {refreshedAt && (
              <span className={`ftp-hue-teal ${styles.stripItem} ${styles.stripRefreshed}`} title={t("refreshedTitle")}>
                <RefreshGlyph />
                {t("refreshed", { ago: fmt.ago(refreshedAt) })}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
