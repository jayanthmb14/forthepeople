/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Routed locales come from the language registry (src/i18n/languages.ts):
// every language whose status is "live" or "beta" gets /<code>/… URLs.
// Nothing about individual languages is typed here — edit the registry.
import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, ROUTED_LOCALES } from "./languages";

export const routing = defineRouting({
  locales: ROUTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always", // /en/..., /kn/...
});

export type Locale = string;
