/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Client-side i18n helpers used by components. Every string a person
// reads goes through `useTranslations` (next-intl); numbers and dates go
// through `useFormat` so they follow the chosen language (month names,
// digit grouping). Module names come from `useModuleText`, which falls back
// to the English registry label if a key is missing.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "./languages";
import { SIDEBAR_MODULES, tierFromPriority, type TierLabel } from "@/lib/constants/sidebar-modules";

const TIER_KEY: Record<TierLabel, string> = {
  "Civic duty": "civic",
  "Money & resources": "money",
  "Daily services": "services",
  "Accountability": "accountability",
  "Community & people": "community",
};

/** Locale-aware number and date formatting (IST for dates). */
export function useFormat() {
  const locale = useLocale();
  const intl = intlLocale(locale);
  return {
    locale,
    intl,
    number: (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(intl, opts),
    date: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      new Date(d).toLocaleDateString(intl, { timeZone: "Asia/Kolkata", ...opts }),
    time: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      new Date(d).toLocaleTimeString(intl, { timeZone: "Asia/Kolkata", ...opts }),
  };
}

/** Translated module label / description / group, keyed by module slug. */
export function useModuleText() {
  const tName = useTranslations("moduleNames");
  const tDesc = useTranslations("moduleDescriptions");
  const tGroup = useTranslations("moduleGroups");
  const find = (slug: string) => SIDEBAR_MODULES.find((m) => m.slug === slug);
  return {
    label: (slug: string) => (tName.has(slug) ? tName(slug) : find(slug)?.label ?? slug),
    description: (slug: string) => (tDesc.has(slug) ? tDesc(slug) : find(slug)?.description ?? ""),
    group: (tier: TierLabel) => {
      const key = TIER_KEY[tier];
      return key && tGroup.has(key) ? tGroup(key) : tier;
    },
    groupOf: (slug: string) => {
      const m = find(slug);
      if (!m) return null;
      const tier = tierFromPriority(m.priority);
      const key = TIER_KEY[tier];
      return key && tGroup.has(key) ? tGroup(key) : tier;
    },
  };
}
