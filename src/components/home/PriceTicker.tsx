/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PriceTicker — the running prices strip at the top of the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌──────────────────────────────────────────────────────────────────┬───┐
//   │ (coin) Gold 24K ₹1,52,110/10 g ▲0.9% 25 Sept · (bar) Silver …    │ ❚❚│
//   │ (pump) Petrol · Delhi ₹102.12/litre 25 Sept · (chart) Sensex …   │   │
//   └──────────────────────────────────────────────────────────────────┴───┘
//
//  The everyday prices, in this order: gold 24K and 22K (per 10 g) and
//  silver (per kg) from IBJA; petrol and diesel in Delhi (per litre, PPAC,
//  double-checked with BPCL); then Sensex, Nifty 50 and the US dollar.
//  Each item keeps its own date; one older than a normal weekend or
//  holiday gap says how old it is, in amber. (Mandi crop prices and crude
//  oil are no longer shown here; the date and IST time are in the status
//  strip right above, so the ticker does not repeat them.)
//
//  - Metals and markets link to /prices; petrol and diesel to the home
//    page's price cards (#home-prices), which name the sources.
//  - The strip moves slowly (CSS only). It stops while the pointer or the
//    keyboard focus is on it, and the ❚❚ button stops it for good. With
//    "reduce motion" it does not move at all: it becomes a row you can
//    scroll sideways.
//
"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { Glyph, glyphFor } from "./HomeGlyphs";
import { FUEL_HUE, UNIT_KEY, dayWords, money, pct, shortDay } from "./home-format";
import type { FuelFigure, MarketFigure } from "./home-types";
import styles from "./home.module.css";

const METALS = new Set(["gold24", "gold22", "silver"]);

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

function FuelItem({ f, locale, tab }: { f: FuelFigure; locale: string; tab: 0 | -1 }) {
  const t = useTranslations("page_home");
  return (
    <li className={styles.tickItemWrap}>
      <a href="#home-prices" className={`${styles.tickItem} ftp-hue-${FUEL_HUE[f.fuel]}`} tabIndex={tab}>
        <Glyph kind="fuel" size={20} />
        <span className={styles.tickLabel}>
          {t(`ticker.${f.fuel}`)}
          <span className={styles.tickMarket}>{t("fuel.city.Delhi")}</span>
        </span>
        <span className={`${styles.tickValue} ftp-num`}>
          {money(f.value, "INR", 2)}
          <span className={styles.tickUnit}>{t("ticker.perLitre")}</span>
        </span>
        <span className={styles.tickDate} data-old={f.old ? "true" : undefined}>
          {f.old ? t("ticker.oldDate", { date: shortDay(f.day, locale), days: f.ageDays }) : dayWords(f.day, f.ageDays, locale)}
        </span>
      </a>
    </li>
  );
}

export default function PriceTicker({ locale, markets, fuel }: { locale: string; markets: MarketFigure[]; fuel: FuelFigure[] }) {
  const t = useTranslations("page_home");
  const [paused, setPaused] = useState(false);
  const metals = markets.filter((m) => METALS.has(m.key));
  const rest = markets.filter((m) => !METALS.has(m.key));
  const count = markets.length + fuel.length;
  if (count === 0) return null;

  // About 5 s per item keeps the text readable (roughly 45–60 px a second).
  const duration = `${Math.max(30, count * 5)}s`;
  const list = (copy: boolean) => (
    <ul className={styles.tickList} aria-hidden={copy || undefined} inert={copy || undefined} data-copy={copy ? "true" : undefined}>
      {metals.map((m) => (
        <MarketItem key={m.key} m={m} locale={locale} tab={copy ? -1 : 0} />
      ))}
      {fuel.map((f) => (
        <FuelItem key={f.fuel} f={f} locale={locale} tab={copy ? -1 : 0} />
      ))}
      {rest.map((m) => (
        <MarketItem key={m.key} m={m} locale={locale} tab={copy ? -1 : 0} />
      ))}
    </ul>
  );

  return (
    <section className={styles.ticker} aria-label={t("ticker.region")}>
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
