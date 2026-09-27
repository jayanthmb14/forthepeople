/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  MarketTicker — the 32 px markets line under the header (home only)
// ═══════════════════════════════════════════════════════════════════════
//
//    [• Market closed]  SENSEX 81,234 ▲ 120 (0.15%)  NIFTY …   As of 14:05 IST
//
//  Data: GET /api/data/market-ticker → { items, asOf }. Fetched once on
//  mount (no polling). Values are mono. Up / down changes are coloured as
//  TEXT only (live-text / danger), never as a filled chip.
//
//  Motion: on desktop the row scrolls slowly (paused on hover and for
//  anyone who prefers reduced motion). On phones it is a static row you
//  can swipe sideways — nothing moves on its own.
//
//  "Market open" follows NSE hours: Mon–Fri 09:15–15:30 IST (no holiday
//  calendar, so a trading holiday still shows "open" during those hours).
//
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Pill, formatIST } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";
import styles from "./home.module.css";

type TickerItem = {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  unit: string;
};
type TickerResponse = { items?: TickerItem[]; tickers?: TickerItem[]; asOf?: string };

/**
 * How often each figure is refreshed upstream — shown in the hover tooltip.
 * Returns a message key in page_home ("every minute" → "हर मिनट" on /hi).
 */
function refreshKeyFor(symbol: string): string {
  switch (symbol) {
    case "SENSEX":
    case "NIFTY50":
    case "NIFTYBANK":
      return "cadenceMarketHours";
    case "USD_INR":
    case "EUR_INR":
    case "BTC_INR":
    case "ETH_INR":
      return "cadenceMinute";
    case "GOLD":
    case "SILVER":
      return "cadenceBullion";
    case "PETROL":
    case "DIESEL":
      return "cadenceDaily";
    default:
      return "cadenceFiveMin";
  }
}

/** A small picture per figure (Design v4) so the strip reads at a glance. */
function emojiFor(symbol: string): string {
  switch (symbol) {
    case "SENSEX":
    case "NIFTY50":
    case "NIFTYBANK":
      return "📈";
    case "USD_INR":
    case "EUR_INR":
      return "💱";
    case "BTC_INR":
    case "ETH_INR":
      return "🪙";
    case "GOLD":
      return "🥇";
    case "SILVER":
      return "🥈";
    case "PETROL":
    case "DIESEL":
      return "⛽";
    default:
      return "•";
  }
}

/** Indian markets: Mon–Fri, 09:15–15:30 IST. IST = UTC+5:30, no DST. */
function isMarketOpen(nowMs: number): boolean {
  const ist = new Date(nowMs + (5 * 60 + 30) * 60 * 1000);
  const day = ist.getUTCDay(); // 0 Sun .. 6 Sat
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return day >= 1 && day <= 5 && minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30;
}

/** "14:05" in IST from an ISO timestamp, or null. */
function istClock(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
}

export default function MarketTicker() {
  const t = useTranslations("ticker");
  const tp = useTranslations("page_home");
  const tk = useTranslations("kit");
  const { intl } = useFormat();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [asOf, setAsOf] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  // Read the clock once when the component first renders.
  const [nowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/data/market-ticker");
        if (!res.ok) return;
        const data = (await res.json()) as TickerResponse;
        if (cancelled) return;
        const list = data.items ?? data.tickers ?? (Array.isArray(data) ? (data as unknown as TickerItem[]) : []);
        setItems(list.filter(Boolean));
        setAsOf(data.asOf);
      } catch {
        /* network error — the row hides itself below */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show once loading finished → render nothing (no fake zeros).
  if (loaded && items.length === 0) return null;

  const open = isMarketOpen(nowMs);
  const clock = istClock(asOf);

  // The row is duplicated so the desktop scroll loops seamlessly; the copy
  // is hidden from screen readers and from phones (see home.module.css).
  const renderItems = (copy: boolean) =>
    items.map((it) => (
      <span
        key={`${copy ? "b" : "a"}-${it.symbol}`}
        className={styles.tickerItem}
        title={t("refreshed", { name: t.has(`sym.${it.symbol}`) ? t(`sym.${it.symbol}`) : it.label, cadence: tp(refreshKeyFor(it.symbol)) })}
      >
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 13 }}>{emojiFor(it.symbol)}</span>
        <span className={styles.tickerLabel}>{t.has(`sym.${it.symbol}`) ? t(`sym.${it.symbol}`) : it.label}</span>
        <span className="ftp-num">{it.value}</span>
        <span
          className={`ftp-num ${
            it.direction === "up" ? styles.up : it.direction === "down" ? styles.down : styles.flat
          }`}
        >
          {it.direction === "up" ? "▲" : it.direction === "down" ? "▼" : "·"} {it.change}
          {it.changePct !== 0 ? ` (${it.changePct.toFixed(2)}%)` : ""}
        </span>
      </span>
    ));

  return (
    <div className={styles.ticker} role="region" aria-label={t("region")}>
      <div className={`ftp-container ${styles.tickerRow}`}>
        <Pill tone={open ? "live" : "neutral"} dot>
          {open ? t("open") : t("closed")}
        </Pill>
        <div className={styles.tickerViewport}>
          {items.length === 0 ? (
            <span className={styles.tickerMuted}>{tk("loading")}</span>
          ) : (
            <div className={styles.tickerTrack}>
              <span className={styles.tickerSet}>{renderItems(false)}</span>
              <span className={`${styles.tickerSet} ${styles.tickerCopy}`} aria-hidden>
                {renderItems(true)}
              </span>
            </div>
          )}
        </div>
        {clock && (
          <span className={styles.tickerAsOf} title={formatIST(asOf, intl) ?? undefined} suppressHydrationWarning>
            {t("asOf", { time: clock })}
          </span>
        )}
      </div>
    </div>
  );
}
