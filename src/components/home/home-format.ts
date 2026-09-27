/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Home page — small pure formatters (and two lookup tables) shared by the
// ticker, the price cards and the map card. Numbers always use Indian grouping (docs/I18N.md §2.5).
import { NUMBER_LOCALE, intlLocale } from "@/i18n/languages";

/** page_home message key for a price unit ("/10 g", "/kg"). */
export const UNIT_KEY = { "10g": "ticker.per10g", kg: "ticker.perKg" } as const;

/** Petrol and diesel pictures and cards take these hues (identity only). */
export const FUEL_HUE = { petrol: "teal", diesel: "indigo" } as const;

/** "₹15,211", "$67.42", "81,234" (index points). */
export function money(value: number, currency: "INR" | "USD" | null, decimals: number): string {
  const n = value.toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return currency === "INR" ? `₹${n}` : currency === "USD" ? `$${n}` : n;
}

/** "0.88%" — always positive; the arrow and the words say up or down. */
export function pct(p: number): string {
  return `${Math.abs(p).toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** A "YYYY-MM-DD" trading day as a Date at noon IST (safe to format in IST). */
export function dayDate(day: string): Date {
  return new Date(`${day}T12:00:00+05:30`);
}

/** "26 Sep" in the page language. */
export function shortDay(day: string, locale: string): string {
  return dayDate(day).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** "today" / "yesterday" (Intl, in the page language) for 0 or 1 day old, else "26 Sep". */
export function dayWords(day: string, ageDays: number, locale: string): string {
  if (ageDays <= 1) {
    const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
    return rtf.format(-ageDays, "day");
  }
  return shortDay(day, locale);
}

/** "6 hr ago" / "3 days ago" (narrow Intl wording, page language) from `then` to `now`. */
export function agoShort(then: Date, now: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto", style: "narrow" });
  const min = Math.round((then.getTime() - now) / 60000);
  if (Math.abs(min) < 60) return rtf.format(Math.min(0, min), "minute");
  const h = Math.round(min / 60);
  if (Math.abs(h) < 24) return rtf.format(h, "hour");
  return rtf.format(Math.round(h / 24), "day");
}
