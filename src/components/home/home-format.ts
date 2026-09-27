/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Home page — small pure formatters shared by the ticker, the price cards
// and the map card. Numbers always use Indian grouping (docs/I18N.md §2.5).
import { NUMBER_LOCALE, intlLocale } from "@/i18n/languages";

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

/** Rupees per quintal → rupees per kg ("17.5"), one decimal at most. */
export function perKg(perQuintal: number): string {
  return (perQuintal / 100).toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 1 });
}
