/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The district's name for use inside sentences: its local-script name when
// the page is in that script's language (ಮಂಡ್ಯ on /kn/), otherwise the
// registry's English name. Falls back to a title-cased slug for districts
// that are not in the registry yet. Same rule as the district overview.
"use client";

import { useLocale } from "next-intl";
import { getDistrict } from "@/lib/constants/districts";
import { scriptLang } from "@/lib/utils/script-lang";

export function useDistrictName(stateSlug: string, districtSlug: string): string {
  const locale = useLocale();
  const d = getDistrict(stateSlug, districtSlug);
  if (!d) return districtSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return d.nameLocal && d.nameLocal !== d.name && scriptLang(d.nameLocal) === locale ? d.nameLocal : d.name;
}
