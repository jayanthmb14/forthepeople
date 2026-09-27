/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Builds the translated, formatted view model for one PriceCard on /prices
// (see PriceCard.tsx). Kept out of page.tsx so it can be reused and checked
// outside a page. `t` is a translator for the "page_prices" namespace.

import {
  ageInDays,
  beforeNow,
  chartWindow,
  isStale,
  latestWithChange,
  todayIST,
  type Change,
  type PricePoint,
} from "@/lib/markets/compute";
import type { PriceItem, PriceSeries } from "@/lib/markets/prices";
import { NUMBER_LOCALE, intlLocale } from "@/i18n/languages";
import { dateFormatter } from "@/i18n/format-date";
import type { PriceCardView } from "./PriceCard";

type Values = Record<string, string | number>;
/** The part of a next-intl translator this file uses. */
export type PricesT = (key: string, values?: Values) => string;

/** Builds every string one card needs (translated and formatted). */
export function makePriceViewBuilder(t: PricesT, locale: string, nowMs: number = Date.now()) {
  const intl = intlLocale(locale);
  const numberFmt = (decimals: number) =>
    new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const pctFmt = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  // Trading days are plain "YYYY-MM-DD": format them in UTC so they never shift.
  // Kannada is written day first ("27 ಸೆಪ್ಟೆಂಬರ್ 2026"), src/i18n/format-date.ts.
  const dayShort = dateFormatter(intl, { day: "numeric", month: "short", timeZone: "UTC" });
  const dayLong = dateFormatter(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const timeIST = new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const asDate = (d: string) => new Date(`${d}T00:00:00Z`);
  const today = todayIST(nowMs);

  const money = (item: PriceItem, v: number) => {
    const n = numberFmt(item.decimals).format(Math.abs(v));
    const sign = v < 0 ? "−" : "";
    return item.currency === "INR" ? `${sign}₹${n}` : item.currency === "USD" ? `${sign}$${n}` : `${sign}${n}`;
  };
  const pct = (c: Change) => `${pctFmt.format(Math.abs(c.pct))}%`;
  const changeText = (c: Change) =>
    c.direction === "up" ? t("changeUp", { pct: pct(c) }) : c.direction === "down" ? t("changeDown", { pct: pct(c) }) : t("changeFlat");

  return function build(item: PriceItem, series: PriceSeries | undefined): PriceCardView {
    const key = item.key;
    const base = { id: key, name: t(`name_${key}`), about: t(`about_${key}`) };
    const points: PricePoint[] = series?.points ?? [];
    const lw = latestWithChange(points);
    if (!series || !lw) return { ...base, missing: t("missing") };

    const latest = lw.latest;
    const rows = beforeNow(points);
    const month = rows.find((r) => r.span === "month");

    // Change since the previous trading day.
    let sincePrevious: NonNullable<PriceCardView["data"]>["sincePrevious"] = null;
    if (lw.change && lw.previous) {
      const date = dayShort.format(asDate(lw.previous.d));
      const vals = { abs: money(item, Math.abs(lw.change.abs)), pct: pct(lw.change), date };
      sincePrevious = {
        direction: lw.change.direction,
        text: lw.change.direction === "up" ? t("prevUp", vals) : lw.change.direction === "down" ? t("prevDown", vals) : t("prevFlat", { date }),
      };
    }

    // One plain sentence, using the 1-month change.
    const line = month
      ? t("line", {
          name: t(`lineName_${key}`),
          amount: t(`amount_${key}`, { value: money(item, latest.v) }),
          when: latest.d === today ? "today" : "other",
          date: dayShort.format(asDate(latest.d)),
          dir: month.change.direction,
          pct: pct(month.change),
        })
      : null;

    // The 3-month line.
    const win = chartWindow(points);
    const vals = win.map((p) => p.v);
    const chart =
      win.length >= 2
        ? {
            points: win,
            label: t("chartLabel", {
              from: money(item, win[0].v),
              fromDate: dayLong.format(asDate(win[0].d)),
              to: money(item, latest.v),
              toDate: dayLong.format(asDate(latest.d)),
              high: money(item, Math.max(...vals)),
              low: money(item, Math.min(...vals)),
            }),
            startLabel: dayShort.format(asDate(win[0].d)),
            endLabel: dayShort.format(asDate(latest.d)),
            highLabel: t("chartHigh", { value: money(item, Math.max(...vals)) }),
            lowLabel: t("chartLow", { value: money(item, Math.min(...vals)) }),
          }
        : null;

    // "As of": IBJA gives a date (evening rate); Yahoo gives a time.
    let asOf: string;
    if (item.source === "ibja") {
      asOf = t("asOfIbja", { date: dayLong.format(asDate(latest.d)) });
    } else if (series.asOf) {
      const when = new Date(series.asOf);
      asOf = t("asOfDateTime", {
        date: dateFormatter(intl, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(when),
        time: timeIST.format(when),
      });
    } else {
      asOf = t("asOfDate", { date: dayLong.format(asDate(latest.d)) });
    }

    return {
      ...base,
      data: {
        value: money(item, latest.v),
        unit: t(`unit_${key}`),
        sincePrevious,
        line,
        stale: isStale(latest.d, nowMs) ? t("stale", { days: ageInDays(latest.d, nowMs) }) : null,
        chart,
        rows: rows.map((r) => ({
          label: t(`ago_${r.span}`, { date: dayShort.format(asDate(r.before.d)) }),
          before: money(item, r.before.v),
          now: money(item, latest.v),
          change: changeText(r.change),
          direction: r.change.direction,
        })),
        source: item.source === "ibja" ? t("sourceIbja") : t("sourceYahoo"),
        asOf,
        sourceUrl: series.sourceUrl,
        checkLabel: t("checkLink"),
      },
    };
  };
}
