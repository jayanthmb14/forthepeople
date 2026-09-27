/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Locale-aware number, date and unit formatting for the India dashboard.
 *
 * Plain functions (no hooks) so server components can use them; client
 * components can use them too, or `useFormat()` from src/i18n/client.ts.
 * Digits stay Latin with Indian grouping (12,34,567) in every language,
 * as docs/I18N.md §4 asks.
 *
 * `formatIndicator` turns an IndiaIndicator row's value + machine unit
 * ("lakh_crore_inr", "per_1000_births", …) into a readable value and a
 * translated unit, e.g. 47.6 + "lakh_crore_inr" → "₹47.6" + "lakh crore".
 */

import { intlLocale } from "@/i18n/languages";
import type { Tr } from "./i18n";

export function fmtNumber(
  locale: string,
  n: number,
  opts?: Intl.NumberFormatOptions,
): string {
  return n.toLocaleString(intlLocale(locale), opts);
}

/** Up to `max` decimals, fewer when the number is whole. */
export function fmtDecimal(locale: string, n: number, max = 2): string {
  return fmtNumber(locale, n, { maximumFractionDigits: max });
}

/** Exactly `d` decimals (for count-up targets that must not jump in width). */
export function fmtFixed(locale: string, n: number, d: number): string {
  return fmtNumber(locale, n, { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Full dates use dateStyle "medium": "26 Jan 1950" / "ಜನ 26, 1950" (the
 *  day/month/year option set drops the space after the comma in Kannada). */
export function fmtDate(
  locale: string,
  d: Date | string | number,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Date(d).toLocaleDateString(intlLocale(locale), { timeZone: "Asia/Kolkata", ...opts });
}

/** "3 days ago" / "3 ದಿನಗಳ ಹಿಂದೆ"; older than ~11 months → "Apr 2023". */
export function fmtAgo(locale: string, d: Date | string | number): string {
  const intl = intlLocale(locale);
  const diffMin = Math.round((new Date(d).getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
  const diffD = Math.round(diffH / 24);
  if (Math.abs(diffD) < 30) return rtf.format(diffD, "day");
  const diffMo = Math.round(diffD / 30);
  if (Math.abs(diffMo) < 11) return rtf.format(diffMo, "month");
  return fmtDate(locale, d, { month: "short", year: "numeric" });
}

/** A formatted indicator: the number part and its (translated) unit. */
export interface FormattedValue {
  value: string;
  unit: string;
}

/**
 * Machine units stored in IndiaIndicator.unit → a key under "units" in
 * page_india, plus how to dress the number. Units not listed here are
 * shown as stored.
 */
type UnitRule = { key?: string; prefix?: string; suffix?: string; scale?: "people" | "rupees"; year?: boolean; rank?: boolean };

const UNIT_RULES: Record<string, UnitRule> = {
  percent: { suffix: "%" },
  count: {},
  integer: {},
  year: { year: true },
  rank: { rank: true },
  people: { scale: "people" },
  rupees: { scale: "rupees" },
  trillion_usd: { prefix: "$", key: "trillion" },
  billion_usd: { prefix: "$", key: "billion" },
  lakh_crore_inr: { prefix: "₹", key: "lakhCrore" },
  lakh_cr: { prefix: "₹", key: "lakhCrore" },
  thousand_cr: { prefix: "₹", key: "thousandCrore" },
  crore: { key: "crore" },
  crore_cards: { key: "crore" },
  crore_doses: { key: "crore" },
  crore_people: { key: "crore" },
  crore_farmers: { key: "crore" },
  crore_students: { key: "crore" },
  lakh: { key: "lakh" },
  lakh_schools: { key: "lakh" },
  lakh_tonnes: { key: "lakhTonnes" },
  lakh_per_year: { key: "lakhPerYear" },
  lakh_km2: { key: "lakhKm2" },
  thousand: { key: "thousand" },
  million: { key: "million" },
  millions_people: { key: "million" },
  million_tonnes: { key: "millionTonnes" },
  million_kg: { key: "millionKg" },
  million_km2: { key: "millionKm2" },
  billion_per_month: { key: "billionPerMonth" },
  gigawatts: { key: "gw" },
  km: { key: "km" },
  "km²": { key: "km2" },
  square_km: { key: "km2" },
  per_1000_births: { key: "per1000Births" },
  per_1000_people: { key: "per1000People" },
  per_lakh: { key: "perLakh" },
  per_sq_km: { key: "perKm2" },
  years: { key: "years" },
  seats: { key: "seats" },
  stages: { key: "stages" },
  individuals: { key: "individuals" },
  tigers: { key: "tigers" },
  parks: { key: "protectedAreas" },
  notified: { key: "notified" },
  ports: { key: "ports" },
  airports: { key: "airports" },
  cities: { key: "cities" },
  projects: { key: "projects" },
  entities: { key: "companies" },
  unicorns: { key: "unicorns" },
  satellites: { key: "satellites" },
  monuments: { key: "monuments" },
  sites: { key: "sites" },
  languages: { key: "languages" },
  museums: { key: "museums" },
  gi_tags: { key: "giTags" },
  medals: { key: "medals" },
  films_per_year: { key: "filmsPerYear" },
};

/**
 * @param t  translator for "page_india" (reads "units.*")
 */
export function formatIndicator(
  t: Tr,
  locale: string,
  value: number,
  unit: string | null | undefined,
): FormattedValue {
  const rule = unit ? UNIT_RULES[unit] : UNIT_RULES.count;
  if (!rule) return { value: fmtDecimal(locale, value), unit: unit ?? "" };
  if (rule.year) return { value: String(Math.round(value)), unit: "" };
  if (rule.rank) return { value: `#${fmtNumber(locale, Math.round(value))}`, unit: "" };
  if (rule.scale) {
    const abs = Math.abs(value);
    const pre = rule.scale === "rupees" ? "₹" : "";
    if (abs >= 1e7) return { value: `${pre}${fmtDecimal(locale, value / 1e7, 1)}`, unit: t("units.crore") };
    if (abs >= 1e5) return { value: `${pre}${fmtDecimal(locale, value / 1e5, 1)}`, unit: t("units.lakh") };
    return { value: `${pre}${fmtDecimal(locale, value, 0)}`, unit: "" };
  }
  const num = `${rule.prefix ?? ""}${fmtDecimal(locale, value)}${rule.suffix ?? ""}`;
  return { value: num, unit: rule.key ? t(`units.${rule.key}`) : "" };
}

/** "₹47.6 lakh crore" — value and unit in one string. */
export function formatIndicatorText(t: Tr, locale: string, value: number, unit: string | null | undefined): string {
  const f = formatIndicator(t, locale, value, unit);
  return f.unit ? `${f.value} ${f.unit}` : f.value;
}

/** Hostname of a URL without "www." (falls back to the input). */
export function domainOf(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
