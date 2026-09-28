/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Which tour a page has (pure; tests/tour.test.ts):
//
//   /en                               → "home"
//   /en/karnataka/mandya[/weather/…]  → "district" (a LIVE district only:
//                                       overview, module, taluk, village)
//   everything else                   → null — no tour, no offer, no
//                                       "Take the tour" link: /admin*,
//                                       /support (checkout, thank-you),
//                                       /india, /about, the state page,
//                                       error and not-found pages …
//
// A not-found page keeps the address it was asked for, so the district
// check uses the registry: a mistyped district is not a district page.
import { getDistrict, getState } from "@/lib/constants/districts";
import { routing } from "@/i18n/routing";
import type { TourKind } from "./memory";

export function tourKindForPath(pathname: string | null | undefined): TourKind | null {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  const [locale, stateSlug, districtSlug] = parts;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) return null;
  if (parts.length === 1) return "home";
  if (!stateSlug || !districtSlug) return null;
  const state = getState(stateSlug);
  const district = state ? getDistrict(state.slug, districtSlug) : undefined;
  return district?.active ? "district" : null;
}
