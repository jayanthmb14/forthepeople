/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "kn", "bn"],  // English + Kannada (pilot) + Bengali
  defaultLocale: "en",
  localePrefix: "always",  // /en/... and /kn/...
});

export type Locale = (typeof routing.locales)[number];
