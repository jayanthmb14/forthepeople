/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PricesToday — a calm "Prices today" row on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//   Prices today                               See all prices and trends →
//   Gold (24 carat)  Silver   Sensex    Nifty 50   US dollar
//   ₹15,211 per gram …        81,234 ▲  …          ₹95.88
//   Checked at 18:45 IST · Gold and silver from IBJA; …
//
//  Replaces the old ticker bar at the very top of the page. Data: GET
//  /api/data/market-ticker, fetched once (no polling). Only five figures
//  a citizen asks about are shown; fuel (a fixed number, not a live
//  feed) and crypto are left to the prices page.
//
//  Honesty rules:
//    - If the API answered with its built-in fallback numbers
//      (usingFallback), or with nothing we can show, the row is hidden.
//      Old numbers are never shown as today's.
//    - A change is shown only when the source gave one (the dollar rate
//      from open.er-api has none, so it shows none).
//    - The time is when we checked the sources, labelled as such.
//
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import styles from "./home.module.css";

interface TickerItem {
  symbol: string;
  label: string;
  value: string;
  change: string;
  changePct: number;
  direction: "up" | "down" | "flat";
  unit: string;
}
interface TickerResponse {
  items?: TickerItem[];
  asOf?: string;
  usingFallback?: boolean;
}

/** The figures shown here, in this order, with their label keys under "home". */
const SHOWN: Record<string, string> = {
  GOLD: "priceGold",
  SILVER: "priceSilver",
  SENSEX: "priceSensex",
  NIFTY50: "priceNifty",
  USD_INR: "priceUsd",
};

/** "/g" → "per gram" (message key), or null when no unit applies. */
function unitKey(unit: string): string | null {
  switch (unit.trim()) {
    case "/g":
      return "unitGram";
    case "/10g":
      return "unit10g";
    case "/kg":
      return "unitKg";
    default:
      return null;
  }
}

/** "14:05" in IST. */
function istClock(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
}

type State = { kind: "loading" } | { kind: "hidden" } | { kind: "ready"; items: TickerItem[]; asOf?: string };

export default function PricesToday() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data/market-ticker")
      .then((r) => (r.ok ? (r.json() as Promise<TickerResponse>) : null))
      .then((data) => {
        if (cancelled) return;
        const items = (data?.items ?? []).filter((it) => it && SHOWN[it.symbol] && it.value);
        const ordered = Object.keys(SHOWN)
          .map((sym) => items.find((it) => it.symbol === sym))
          .filter((it): it is TickerItem => Boolean(it));
        if (!data || data.usingFallback || ordered.length === 0) setState({ kind: "hidden" });
        else setState({ kind: "ready", items: ordered, asOf: data.asOf });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "hidden" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "hidden") return null;
  const clock = state.kind === "ready" ? istClock(state.asOf) : null;

  return (
    <section aria-labelledby="home-prices" className={`ftp-container ${styles.section}`}>
      <div className={styles.sectionHeadRow}>
        <h2 id="home-prices" className={styles.h2}>
          {t("pricesTitle")}
        </h2>
        <Link href={`/${locale}/prices`} className={styles.textLink}>
          {t("pricesMore")}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {state.kind === "loading" ? (
        <ul className={styles.prices} aria-hidden>
          {Object.keys(SHOWN).map((sym) => (
            <li key={sym} className={`${styles.price} ${styles.priceLoading}`} />
          ))}
        </ul>
      ) : (
        <ul className={styles.prices}>
          {state.items.map((it) => {
            const unit = unitKey(it.unit);
            const hasChange = it.direction !== "flat" && it.changePct !== 0 && Number.isFinite(it.changePct);
            const pct = `${Math.abs(it.changePct).toFixed(2)}%`;
            return (
              <li key={it.symbol} className={styles.price}>
                <span className={styles.priceLabel}>{t(SHOWN[it.symbol])}</span>
                <span className={styles.priceValue}>
                  <span className="ftp-num">{it.value}</span>
                  {unit && <span className={styles.priceUnit}>{t(unit)}</span>}
                </span>
                {hasChange && (
                  <span className={it.direction === "up" ? styles.priceUp : styles.priceDown}>
                    <span aria-hidden>{it.direction === "up" ? "▲" : "▼"} </span>
                    <span className="sr-only">{it.direction === "up" ? t("priceUp", { change: pct }) : t("priceDown", { change: pct })}</span>
                    <span aria-hidden className="ftp-num">
                      {pct}
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.sectionFoot}>
        {clock && <>{t("pricesAsOf", { time: clock })} · </>}
        {t("pricesNote")}
      </p>
    </section>
  );
}
