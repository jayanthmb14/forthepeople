/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PriceTicker — the running prices strip at the top of the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌──────────────┬──────────────────────────────────────────────────┬───┐
//   │ Sat, 27 Sep  │ (coin) Gold 24K ₹15,211/gram ▲0.9% 26 Sep ·      │ ❚❚│
//   │ 7:12 pm IST  │ (bar) Silver … · (chart) Sensex … · (sprout)     │   │
//   │              │ Tomato, Pune APMC ₹17.5/kg · 22 Jun · 97 days old│   │
//   └──────────────┴──────────────────────────────────────────────────┴───┘
//
//  - Gold 24K / 22K (per gram) and silver (per kg) from IBJA; Sensex,
//    Nifty 50, the US dollar and crude oil from public market feeds —
//    the same snapshot as the /prices page (home-data.ts).
//  - A few mandi prices from the live districts, each with its market and
//    date; a price older than a week says how old it is, in amber.
//  - Every item is a link: markets → /prices, a crop → that district's
//    crop prices page.
//  - The strip moves slowly (CSS only). It stops while the pointer or the
//    keyboard focus is on it, and the ❚❚ button stops it for good. With
//    "reduce motion" it does not move at all: it becomes a row you can
//    scroll sideways.
//  - The left chip shows today's day and date and the time in India
//    (client-only, updated each minute), a small "status" detail the old
//    site had.
//
"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { intlLocale } from "@/i18n/languages";
import { Glyph, glyphFor } from "./HomeGlyphs";
import { dayWords, money, pct, perKg, shortDay } from "./home-format";
import type { CropTick, MarketFigure } from "./home-types";
import styles from "./home.module.css";

// ── The clock (client only; the server renders an empty chip) ──────────

function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 20_000);
  return () => window.clearInterval(id);
}
/** Changes once a minute, so the chip re-renders only when the text changes. */
const minuteNow = () => Math.floor(Date.now() / 60_000);

function TodayChip({ locale }: { locale: string }) {
  const t = useTranslations("page_home");
  const minute = useSyncExternalStore(subscribeMinute, minuteNow, () => null);
  const intl = intlLocale(locale);
  const when = minute === null ? null : new Date(minute * 60_000);
  return (
    <p className={styles.tickerToday}>
      <span className={styles.tickerTodayDate}>
        {when ? when.toLocaleDateString(intl, { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : " "}
      </span>
      <span className={styles.tickerTodayTime}>
        {when ? t("ticker.timeIst", { time: when.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) }) : " "}
      </span>
    </p>
  );
}

// ── One item ───────────────────────────────────────────────────────────

const UNIT_KEY = { gram: "ticker.perGram", kg: "ticker.perKg", barrel: "ticker.perBarrel" } as const;

function Arrow({ up }: { up: boolean }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d={up ? "M5 1.5 9 8.5H1z" : "M5 8.5 1 1.5h8z"} fill="currentColor" />
    </svg>
  );
}

function MarketItem({ m, locale, tab }: { m: MarketFigure; locale: string; tab: 0 | -1 }) {
  const t = useTranslations("page_home");
  const moved = m.change && m.change.direction !== "flat" ? m.change : null;
  return (
    <li className={styles.tickItemWrap}>
      <Link href={`/${locale}/prices#price-${m.key}`} className={styles.tickItem} tabIndex={tab}>
        <Glyph kind={glyphFor(m.key)} size={20} />
        <span className={styles.tickLabel}>{t(`ticker.${m.key}`)}</span>
        <span className={`${styles.tickValue} ftp-num`}>
          {money(m.value, m.currency, m.decimals)}
          {m.unit && <span className={styles.tickUnit}>{t(UNIT_KEY[m.unit])}</span>}
        </span>
        {moved && (
          <span className={styles.tickChange} data-dir={moved.direction}>
            <Arrow up={moved.direction === "up"} />
            <span className="sr-only">{t(moved.direction === "up" ? "ticker.up" : "ticker.down", { pct: pct(moved.pct) })}</span>
            <span aria-hidden className="ftp-num">
              {pct(moved.pct)}
            </span>
          </span>
        )}
        <span className={styles.tickDate} data-old={m.old ? "true" : undefined}>
          {m.old ? t("ticker.oldDate", { date: shortDay(m.day, locale), days: m.ageDays }) : dayWords(m.day, m.ageDays, locale)}
        </span>
      </Link>
    </li>
  );
}

function CropItem({ c, locale, tab }: { c: CropTick; locale: string; tab: 0 | -1 }) {
  const t = useTranslations("page_home");
  const name = c.cropKey ? t(`crops.${c.cropKey}`) : c.commodity;
  return (
    <li className={styles.tickItemWrap}>
      <Link href={`/${locale}/${c.stateSlug}/${c.districtSlug}/crops`} className={styles.tickItem} tabIndex={tab}>
        <Glyph kind="sprout" size={20} />
        <span className={styles.tickLabel}>
          {name}
          <span className={styles.tickMarket} lang="en">
            {c.market}
          </span>
        </span>
        <span className={`${styles.tickValue} ftp-num`}>
          ₹{perKg(c.perQuintal)}
          <span className={styles.tickUnit}>{t("ticker.perKg")}</span>
        </span>
        <span className={styles.tickDate} data-old={c.old ? "true" : undefined}>
          {c.old ? t("ticker.oldDate", { date: shortDay(c.day, locale), days: c.ageDays }) : dayWords(c.day, c.ageDays, locale)}
        </span>
      </Link>
    </li>
  );
}

// ── The strip ──────────────────────────────────────────────────────────

export default function PriceTicker({ locale, markets, crops }: { locale: string; markets: MarketFigure[]; crops: CropTick[] }) {
  const t = useTranslations("page_home");
  const [paused, setPaused] = useState(false);
  const count = markets.length + crops.length;
  if (count === 0) return null;

  // About 5 s per item keeps the text readable (roughly 45–60 px a second).
  const duration = `${Math.max(30, count * 5)}s`;
  const list = (copy: boolean) => (
    <ul className={styles.tickList} aria-hidden={copy || undefined} inert={copy || undefined} data-copy={copy ? "true" : undefined}>
      {markets.map((m) => (
        <MarketItem key={m.key} m={m} locale={locale} tab={copy ? -1 : 0} />
      ))}
      {crops.map((c) => (
        <CropItem key={`${c.districtSlug}-${c.commodity}`} c={c} locale={locale} tab={copy ? -1 : 0} />
      ))}
    </ul>
  );

  return (
    <section className={styles.ticker} aria-label={t("ticker.region")}>
      <TodayChip locale={locale} />
      <div className={styles.tickerViewport} data-paused={paused ? "true" : undefined}>
        <div className={styles.tickerTrack} style={{ "--ticker-duration": duration } as React.CSSProperties}>
          {list(false)}
          {list(true)}
        </div>
      </div>
      <button
        type="button"
        className={styles.tickerPause}
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? t("ticker.play") : t("ticker.pause")}
        title={paused ? t("ticker.play") : t("ticker.pause")}
      >
        {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
      </button>
    </section>
  );
}
