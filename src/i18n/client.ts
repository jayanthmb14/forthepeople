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
import { intlLocale, NUMBER_LOCALE } from "./languages";
import { SIDEBAR_MODULES, MODULE_GROUPS, getModuleGroup } from "@/lib/constants/sidebar-modules";
import { INDIA_STATES, getDistrict } from "@/lib/constants/districts";
import { placeName } from "./place-name";


/** Locale-aware number and date formatting (IST for dates). */
export function useFormat() {
  const locale = useLocale();
  const intl = intlLocale(locale);
  return {
    locale,
    intl,
    number: (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(NUMBER_LOCALE, opts),
    date: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      new Date(d).toLocaleDateString(intl, { timeZone: "Asia/Kolkata", ...opts }),
    time: (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
      new Date(d).toLocaleTimeString(intl, { timeZone: "Asia/Kolkata", ...opts }),
    /** "5 hours ago" / "5 ಗಂಟೆಗಳ ಹಿಂದೆ" (Intl.RelativeTimeFormat); older than a week → "12 Sep". */
    ago: (d: Date | string | number) => {
      const diffMin = Math.round((new Date(d).getTime() - Date.now()) / 60000);
      const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
      if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
      const diffH = Math.round(diffMin / 60);
      if (Math.abs(diffH) < 24) return rtf.format(diffH, "hour");
      const diffD = Math.round(diffH / 24);
      if (Math.abs(diffD) < 7) return rtf.format(diffD, "day");
      return new Date(d).toLocaleDateString(intl, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    },
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
    /** A group's name by its key ("start") or English label ("Start here"). */
    group: (keyOrLabel: string) => {
      const g = MODULE_GROUPS.find((x) => x.key === keyOrLabel || x.label === keyOrLabel);
      if (!g) return keyOrLabel;
      return tGroup.has(g.key) ? tGroup(g.key) : g.label;
    },
    /** The translated name of the group a module belongs to (docs/MODULE-MAP.md). */
    groupOf: (slug: string) => {
      const g = getModuleGroup(slug);
      if (!g) return null;
      return tGroup.has(g.key) ? tGroup(g.key) : g.label;
    },
  };
}

/**
 * Reference text that lives in the registry/DB in English: state names and
 * district taglines/badges. Returns the translation when the language has
 * one (messages "states" / "placeLabels"), otherwise the English text.
 */
export function usePlaceText() {
  const tState = useTranslations("states");
  const tLabel = useTranslations("placeLabels");
  const stateSlugByName = (name: string) => INDIA_STATES.find((s) => s.name === name)?.slug;
  return {
    state: (slugOrName: string | null | undefined, fallback?: string) => {
      if (!slugOrName) return fallback ?? "";
      const slug = tState.has(slugOrName) ? slugOrName : stateSlugByName(slugOrName);
      return slug && tState.has(slug) ? tState(slug) : fallback ?? slugOrName;
    },
    label: (text: string | null | undefined) => {
      if (!text) return "";
      return tLabel.has(text) ? tLabel(text) : text;
    },
  };
}

/**
 * A district's name for use inside sentences, in the reader's language
 * (docs/I18N.md §3B): the registry's `names[locale]` (मंड्या on /hi/), else
 * the local-script name when it is written in the page language (ಮಂಡ್ಯ on
 * /kn/, मुंबई on /hi/), else the English registry name, else `fallback`
 * (e.g. a name from an API), else the slug in title case — a sentence never
 * shows "bengaluru-urban". The one shared copy; module pages import it from
 * here. Rules live in placeName() (src/i18n/place-name.ts).
 */
export function useDistrictName(stateSlug: string, districtSlug: string, fallback?: string | null): string {
  const locale = useLocale();
  const d = getDistrict(stateSlug, districtSlug);
  if (d) return placeName(d, locale);
  return fallback || districtSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
