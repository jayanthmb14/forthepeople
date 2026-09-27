/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The level (tier) a person is listed under on the Leadership page.
// Pure, unit tested in tests/leader-level.test.ts.
//
// Levels 1–5 are government, top to bottom (country, state, district
// officers, the MP and MLAs you vote for, city and departments). Level 6
// is the courts: judges are independent of the government, so they are
// listed on their own and left out of the "levels of government" picture
// and counts. Sept 2026 audit (language area): the Telangana High Court
// Chief Justice was stored at tier 5 and shown under "City and
// departments — the Mayor, the city commissioner and the heads of local
// departments". A judge's role now decides the level, whatever tier the
// record carries.

export const COURTS_TIER = 6;

/** A judge's role: "Chief Justice, Telangana High Court", "Principal District & Sessions Judge". */
const JUDICIAL_ROLE = /\bchief justice\b|^justice\b|\bjudges?\b|\bjudicial magistrate\b|\b(high|district|sessions|civil|family) court\b/i;

export function isJudicialRole(role: string | null | undefined): boolean {
  return JUDICIAL_ROLE.test(role?.trim() ?? "");
}

/** The level to list a person under: the courts for judges, else the record's tier. */
export function ladderTier(l: { tier: number; role: string }): number {
  return isJudicialRole(l.role) ? COURTS_TIER : l.tier;
}
