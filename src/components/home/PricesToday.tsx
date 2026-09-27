/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PricesToday — the everyday prices on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   Prices today                                          See all prices →
//   ┌ gold ───────────┐ ┌ silver ─────────┐ ┌ petrol ─────────┐ ┌ diesel ──┐
//   │ (coin) Gold 24K │ │ (bar) Silver    │ │ (pump) Petrol   │ │ …        │
//   │ ₹1,52,110 /10 g │ │ ₹2,32,350 /kg   │ │ Delhi           │ │          │
//   │ ▲ ₹1,330 · 0.9% │ │ ▲ ₹4,102 · 1.8% │ │ ₹102.12 /litre  │ │          │
//   │ ╱╲╱‾‾╲╱         │ │ ╲╱╲__╱          │ │ Mumbai ₹111.21  │ │          │
//   │ 22K ₹1,39,340   │ │                 │ │ Chennai …       │ │          │
//   │ IBJA · 25 Sept  │ │ IBJA · 25 Sept  │ │ ✓ Delhi checked │ │          │
//   └─────────────────┘ └─────────────────┘ │   with BPCL     │ │          │
//                                           │ PPAC · 25 Sept  │ │          │
//                                           └─────────────────┘ └──────────┘
//   ┌ (chart) Sensex 73,896 ▲0.43% ┐┌ (chart) Nifty 50 … ┐┌ (note) US dollar … ┐
//   └ Yahoo Finance · 25 Sept ──────┘└────────────────────┘└────────────────────┘
//
//  Gold (per 10 g) and silver (per kg) as IBJA publishes them; petrol and
//  diesel at IOCL outlets from PPAC's daily table — Delhi (double-checked
//  with BPCL's Delhi price) in large type, Mumbai, Chennai and Kolkata
//  beside it (PPAC's table only); Sensex, Nifty 50 and the US dollar in a
//  slim row under the cards. Honesty:
//    - every price names its source (linked) and its day;
//    - the change is since the trading day before, and says which day;
//    - a price older than a normal weekend or holiday gap gets the amber
//      "N days old" line;
//    - a price whose source failed (or was never checked) is not shown; if
//      nothing loaded, the section says so and still links to /prices.
//
//  Server component.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, BadgeCheck, Clock3 } from "lucide-react";
import { BPCL_PRICES_PAGE_URL, PPAC_METRO_PAGE_URL } from "@/scraper/lib/fuel-prices";
import { Glyph, glyphFor } from "./HomeGlyphs";
import { FUEL_HUE, UNIT_KEY, dayWords, money, pct, shortDay } from "./home-format";
import type { FuelFigure, MarketFigure } from "./home-types";
import styles from "./home.module.css";

/** The small row under the cards (gold 22K rides on the gold card). */
const MARKET_ROW = ["sensex", "nifty", "usdInr"] as const;

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

function OldLine({ days }: { days: number }) {
  const t = useTranslations("page_home");
  return (
    <p className={styles.priceOld}>
      <Clock3 size={13} aria-hidden />
      {t("prices.old", { days })}
    </p>
  );
}

function MetalCard({ m, gold22, locale }: { m: MarketFigure; gold22: MarketFigure | undefined; locale: string }) {
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
          {gold22.unit && <span className={styles.priceUnitWord}>{t(UNIT_KEY[gold22.unit])}</span>}
        </p>
      )}
      {m.old && <OldLine days={m.ageDays} />}
      <p className={styles.priceSource}>
        <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t("prices.srcIbja")}
        </a>
        {" · "}
        {dayWords(m.day, m.ageDays, locale)}
      </p>
    </li>
  );
}

function FuelCard({ f, locale }: { f: FuelFigure; locale: string }) {
  const t = useTranslations("page_home");
  return (
    <li className={`${styles.priceCard} ftp-hue-${FUEL_HUE[f.fuel]}`} data-kind="fuel">
      <div className={styles.priceHead}>
        <span className={styles.priceArt}>
          <Glyph kind="fuel" size={30} />
        </span>
        <span className={styles.priceName}>
          {t(`ticker.${f.fuel}`)}
          <span className={styles.priceCity}>{t("fuel.city.Delhi")}</span>
        </span>
      </div>
      <p className={styles.priceNow}>
        <span className="ftp-num">{money(f.value, "INR", 2)}</span>
        <span className={styles.priceUnitWord}>{t("ticker.perLitre")}</span>
      </p>
      {f.others.length > 0 && (
        <ul className={styles.fuelCities} aria-label={t("prices.fuelOthers")}>
          {f.others.map((o) => (
            <li key={o.city}>
              <span>{t(`fuel.city.${o.city}`)}</span>
              <span className="ftp-num">{money(o.value, "INR", 2)}</span>
            </li>
          ))}
        </ul>
      )}
      {f.check === "double" && (
        <p className={styles.fuelCheck}>
          <BadgeCheck size={14} aria-hidden />
          <span>
            {t.rich("prices.fuelChecked", {
              a: (c) => (
                <a href={BPCL_PRICES_PAGE_URL} target="_blank" rel="noopener noreferrer">
                  {c}
                </a>
              ),
            })}
          </span>
        </p>
      )}
      {f.old && <OldLine days={f.ageDays} />}
      <p className={styles.priceSource}>
        <a href={PPAC_METRO_PAGE_URL} target="_blank" rel="noopener noreferrer">
          {t("prices.srcPpac")}
        </a>
        {" · "}
        {dayWords(f.day, f.ageDays, locale)}
      </p>
    </li>
  );
}

function MarketChip({ m, locale }: { m: MarketFigure; locale: string }) {
  const t = useTranslations("page_home");
  const moved = m.change && m.change.direction !== "flat" ? m.change : null;
  return (
    <li className={styles.marketItem}>
      <span className={styles.marketArt}>
        <Glyph kind={glyphFor(m.key)} size={24} />
      </span>
      <span className={styles.marketText}>
        <span className={styles.marketName}>{t(`ticker.${m.key}`)}</span>
        <span className={styles.marketSource}>
          <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
            {t("prices.srcYahoo")}
          </a>
          {" · "}
          {dayWords(m.day, m.ageDays, locale)}
        </span>
        {m.old && (
          <span className={styles.marketOld}>
            <Clock3 size={12} aria-hidden />
            {t("prices.old", { days: m.ageDays })}
          </span>
        )}
      </span>
      <span className={styles.marketValue}>
        <span className="ftp-num">{money(m.value, m.currency, m.decimals)}</span>
        {moved ? (
          <span className={styles.marketMove} data-dir={moved.direction}>
            <span aria-hidden>{moved.direction === "up" ? "▲" : "▼"}</span>
            <span className="sr-only">{t(moved.direction === "up" ? "ticker.up" : "ticker.down", { pct: pct(moved.pct) })}</span>
            <span aria-hidden className="ftp-num">
              {pct(moved.pct)}
            </span>
          </span>
        ) : null}
      </span>
    </li>
  );
}

export default function PricesToday({ locale, markets, fuel }: { locale: string; markets: MarketFigure[]; fuel: FuelFigure[] }) {
  const t = useTranslations("page_home");
  const gold24 = markets.find((m) => m.key === "gold24");
  const gold22 = markets.find((m) => m.key === "gold22");
  const silver = markets.find((m) => m.key === "silver");
  const row = MARKET_ROW.map((k) => markets.find((m) => m.key === k)).filter((m): m is MarketFigure => Boolean(m));
  const cards = (gold24 ? 1 : 0) + (silver ? 1 : 0) + fuel.length;

  return (
    <section aria-labelledby="home-prices-title" id="home-prices" className={`ftp-container ${styles.section} ${styles.anchorTarget}`}>
      <div className={styles.sectionHeadRow}>
        <h2 id="home-prices-title" className={styles.h2}>
          {t("prices.title")}
        </h2>
        <Link href={`/${locale}/prices`} className={styles.textLink}>
          {t("prices.more")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {cards === 0 && row.length === 0 ? (
        <p className={styles.sectionNote}>{t("prices.none")}</p>
      ) : (
        <>
          {cards > 0 && (
            <ul className={styles.priceGrid}>
              {gold24 && <MetalCard m={gold24} gold22={gold22} locale={locale} />}
              {silver && <MetalCard m={silver} gold22={undefined} locale={locale} />}
              {fuel.map((f) => (
                <FuelCard key={f.fuel} f={f} locale={locale} />
              ))}
            </ul>
          )}
          {row.length > 0 && (
            <ul className={styles.marketRow} aria-label={t("prices.marketsLabel")}>
              {row.map((m) => (
                <MarketChip key={m.key} m={m} locale={locale} />
              ))}
            </ul>
          )}
        </>
      )}
      <p className={styles.sectionFoot}>{t("prices.note")}</p>
    </section>
  );
}
