/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// hreflang alternates for a page, generated from the routed languages in
// the registry. Use in generateMetadata: `alternates: languageAlternates(path, locale)`.
import { DEFAULT_LOCALE, ROUTED_LOCALES } from "./languages";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

/** `path` is everything after the locale, e.g. "" or "/india/updates". */
export function languageAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const code of ROUTED_LOCALES) languages[code] = `${BASE_URL}/${code}${path}`;
  languages["x-default"] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;
  return { canonical: `${BASE_URL}/${locale}${path}`, languages };
}
