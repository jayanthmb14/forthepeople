/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "kn"],   // English + Kannada (pilot)
  defaultLocale: "en",
  localePrefix: "always",  // /en/... and /kn/...
});

export type Locale = (typeof routing.locales)[number];
