/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PricesToday — colourful price cards on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   Prices today                                    See all prices →
//   ┌ gold wash ─────────────┐ ┌ silver wash ───────────┐ ┌ blue wash ─┐
//   │ (coin) Gold 24K        │ │ (bar) Silver           │ │ (chart)    │
//   │ ₹15,211 /gram          │ │ ₹1,89,540 /kg          │ │ Sensex     │
//   │ ▲ ₹133 · 0.88%         │ │ ▼ ₹1,020 · 0.54%       │ │ 81,234 …   │
//   │ ╱╲╱‾‾╲╱ (30 days)      │ │ ╲╱╲__╱ (30 days)       │ │            │
//   │ 22K ₹13,944 /gram      │ │ IBJA · 26 Sep          │ │            │
//   │ IBJA · 26 Sep          │ └────────────────────────┘ └────────────┘
//   └────────────────────────┘   … Nifty 50, US dollar, crude oil
//
//  Data: the same snapshot as the /prices page (home-data.ts →
//  loadMarketFigures), rendered on the server. Honesty:
//    - each card names its source (linked) and the day of the price;
//    - the change is since the trading day before, and says which day;
//    - a price older than a normal weekend or holiday gap gets the amber
//      "N days old" line;
//    - a price whose source failed is not shown; if none loaded, the
//      section says so and still links to /prices.
//
//  Server component.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock3 } from "lucide-react";
import { Glyph, glyphFor } from "./HomeGlyphs";
import { dayWords, money, pct, shortDay } from "./home-format";
import type { MarketFigure } from "./home-types";
import styles from "./home.module.css";

/** Cards on the home page, in this order (gold 22K rides on the gold card). */
const CARDS = ["gold24", "silver", "sensex", "nifty", "usdInr", "crude"] as const;
const UNIT_KEY = { gram: "ticker.perGram", kg: "ticker.perKg", barrel: "ticker.perBarrel" } as const;

/** A 30-day trend line (and a soft area under it), scaled to its own range. */
function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className={styles.spark} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={area} className={styles.sparkArea} />
      <path d={line} className={styles.sparkLine} vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r={2.6} className={styles.sparkDot} />
    </svg>
  );
}

function PriceCard({ m, gold22, locale }: { m: MarketFigure; gold22: MarketFigure | undefined; locale: string }) {
  const t = useTranslations("page_home");
  const kind = glyphFor(m.key);
  const moved = m.change && m.change.direction !== "flat" ? m.change : null;
  const abs = moved ? money(Math.abs(moved.abs), m.currency, m.decimals) : "";
  return (
    <li className={styles.priceCard} data-kind={kind}>
      <div className={styles.priceHead}>
        <span className={styles.priceArt}>
          <Glyph kind={kind} size={30} />
        </span>
        <span className={styles.priceName}>{t(`ticker.${m.key}`)}</span>
      </div>
      <p className={styles.priceNow}>
        <span className="ftp-num">{money(m.value, m.currency, m.decimals)}</span>
        {m.unit && <span className={styles.priceUnitWord}>{t(UNIT_KEY[m.unit])}</span>}
      </p>
      {moved ? (
        <p className={styles.priceMove} data-dir={moved.direction}>
          <span aria-hidden>{moved.direction === "up" ? "▲" : "▼"}</span>
          <span className="sr-only">
            {t(moved.direction === "up" ? "prices.upSr" : "prices.downSr", { abs, pct: pct(moved.pct), date: shortDay(moved.prevDay, locale) })}
          </span>
          <span aria-hidden className="ftp-num">
            {t("prices.move", { abs, pct: pct(moved.pct) })}
          </span>
          <span aria-hidden className={styles.priceSince}>
            {t("prices.since", { date: shortDay(moved.prevDay, locale) })}
          </span>
        </p>
      ) : (
        <p className={styles.priceMove} data-dir="flat">
          {m.change ? t("prices.same") : t("prices.noChange")}
        </p>
      )}
      <Spark values={m.spark} />
      {gold22 && (
        <p className={styles.priceExtra}>
          {t("prices.gold22", { price: money(gold22.value, gold22.currency, gold22.decimals) })}
          <span className={styles.priceUnitWord}>{t("ticker.perGram")}</span>
        </p>
      )}
      {m.old && (
        <p className={styles.priceOld}>
          <Clock3 size={13} aria-hidden />
          {t("prices.old", { days: m.ageDays })}
        </p>
      )}
      <p className={styles.priceSource}>
        <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
          {m.source === "ibja" ? t("prices.srcIbja") : t("prices.srcYahoo")}
        </a>
        {" · "}
        {dayWords(m.day, m.ageDays, locale)}
      </p>
    </li>
  );
}

export default function PricesToday({ locale, markets }: { locale: string; markets: MarketFigure[] }) {
  const t = useTranslations("page_home");
  const cards = CARDS.map((k) => markets.find((m) => m.key === k)).filter((m): m is MarketFigure => Boolean(m));
  const gold22 = markets.find((m) => m.key === "gold22");

  return (
    <section aria-labelledby="home-prices" className={`ftp-container ${styles.section}`}>
      <div className={styles.sectionHeadRow}>
        <h2 id="home-prices" className={styles.h2}>
          {t("prices.title")}
        </h2>
        <Link href={`/${locale}/prices`} className={styles.textLink}>
          {t("prices.more")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {cards.length === 0 ? (
        <p className={styles.sectionNote}>{t("prices.none")}</p>
      ) : (
        <ul className={styles.priceGrid}>
          {cards.map((m) => (
            <PriceCard key={m.key} m={m} gold22={m.key === "gold24" ? gold22 : undefined} locale={locale} />
          ))}
        </ul>
      )}
      <p className={styles.sectionFoot}>{t("prices.note")}</p>
    </section>
  );
}
