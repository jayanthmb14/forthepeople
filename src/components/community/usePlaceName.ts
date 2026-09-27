/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// District name in the reader's language, for sentences on module pages
// that only know the URL slug. Follows docs/I18N.md §3B: the local-script
// name when it is written in the page language (ಮಂಡ್ಯ on /kn/), otherwise
// the English registry name, otherwise the slug in title case.
"use client";

import { useLocale } from "next-intl";
import { getDistrict } from "@/lib/constants/districts";
import { scriptLang } from "@/lib/utils/script-lang";

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useDistrictName(stateSlug: string, districtSlug: string, fallback?: string | null): string {
  const locale = useLocale();
  const d = getDistrict(stateSlug, districtSlug);
  if (d?.nameLocal && scriptLang(d.nameLocal) === locale) return d.nameLocal;
  return d?.name ?? fallback ?? titleCase(districtSlug);
}
