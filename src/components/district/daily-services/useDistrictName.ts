/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The district's name for sentences on a module page, in the reader's
// language when the registry has it (docs/I18N.md §3B):
//   Kannada UI on a Karnataka page → "ಮಂಡ್ಯ" (nameLocal is Kannada script)
//   anything else                  → the English name ("Mandya")
// Falls back to the slug in title case when the district is not in the
// registry, so a sentence never shows "bengaluru-urban".
"use client";

import { useLocale } from "next-intl";
import { getDistrict } from "@/lib/constants/districts";
import { scriptLang } from "@/lib/utils/script-lang";

export function useDistrictName(stateSlug: string, districtSlug: string): string {
  const locale = useLocale();
  const d = getDistrict(stateSlug, districtSlug);
  if (!d) return districtSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (d.nameLocal && scriptLang(d.nameLocal) === locale) return d.nameLocal;
  return d.name;
}
