/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Which districts people can vote for on /vote-district (and the "not live
// yet" district page): the ones in the district registry that are not live.
// POST /api/district-request accepts only these, stored under the
// registry's spelling, so the public "most requested" chart on /contribute
// can only ever show real district names — never text a script typed in.
// Pure (reads the registry constant only).

import { INDIA_STATES } from "@/lib/constants/districts";

const fold = (s: string) => s.trim().toLowerCase();

/** The registry's spelling of a district that is listed but not live yet, or null. */
export function waitingDistrict(stateName: unknown, districtName: unknown): { stateName: string; districtName: string } | null {
  if (typeof stateName !== "string" || typeof districtName !== "string") return null;
  const state = INDIA_STATES.find((s) => fold(s.name) === fold(stateName));
  const district = state?.districts.find((d) => fold(d.name) === fold(districtName));
  if (!state || !district || district.active) return null;
  return { stateName: state.name, districtName: district.name };
}
