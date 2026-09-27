/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Place names in the reader's language (docs/I18N.md §3B). Pure functions,
// safe on the server and the client.
//
//   1. names[locale]   — the registry's name in that language ({ hi: "मंड्या" })
//   2. nameLocal       — when it is written in the page's language
//                        (ಮಂಡ್ಯ on /kn, मुंबई on /hi)
//   3. name            — the English registry name
//
// useDistrictName() (src/i18n/client.ts) is the hook form for districts.
import { scriptLang } from "@/lib/utils/script-lang";
import type { PlaceNames } from "@/lib/constants/districts";

export interface NamedPlace {
  name: string;
  nameLocal?: string | null;
  names?: PlaceNames | null;
}

/** The place's name for use in a sentence or a list, in the page language. */
export function placeName(p: NamedPlace, locale: string): string {
  const own = p.names?.[locale];
  if (own) return own;
  if (p.nameLocal && p.nameLocal !== p.name && scriptLang(p.nameLocal) === locale) return p.nameLocal;
  return p.name;
}

export interface PlaceNamePair {
  /** Leads the heading: the name in the page language. */
  primary: string;
  /** `lang` for the primary name (only when it is not in the page language). */
  primaryLang?: string;
  /** Shown beside it: English when the primary is not English, else the local-script name. */
  secondary?: string;
  secondaryLang?: string;
}

/**
 * A heading pair, e.g. "मंड्या  Mandya" on /hi, "ಮಂಡ್ಯ  Mandya" on /kn and
 * "Mandya  ಮಂಡ್ಯ" on /en. Each part carries a `lang` so screen readers
 * switch voice.
 */
export function placeNamePair(p: NamedPlace, locale: string): PlaceNamePair {
  const primary = placeName(p, locale);
  if (primary !== p.name) {
    return { primary, secondary: p.name, secondaryLang: "en" };
  }
  const local = p.nameLocal && p.nameLocal !== p.name ? p.nameLocal : undefined;
  return {
    primary,
    primaryLang: locale === "en" ? undefined : "en",
    secondary: local,
    secondaryLang: local ? scriptLang(local) : undefined,
  };
}

/** Every spelling of a place (English, local script, names[*]), lower-cased, for search. */
export function placeSearchText(p: NamedPlace): string {
  return [p.name, p.nameLocal ?? "", ...Object.values(p.names ?? {})].join(" ").toLowerCase();
}
