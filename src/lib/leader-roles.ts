/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Which office a Leader row holds, from its role text — PURE, unit-tested
// in tests/leader-roles.test.ts. One rule for the glance tile
// (/api/data/glance) and the overview's "District leaders" card
// (LeadersSnippet), so the two never disagree.
//
// Sept 2026 audit: the card only knew "District Collector …" and "Deputy
// Commissioner …", so "Collector & District Magistrate, Hyderabad",
// "Collector, Mumbai City (IAS)" and "District Magistrate, Lucknow" showed
// "Name not published yet"; and it labelled every Commissioner of Police
// "SP" (Pune showed the city Commissioner as its SP).
// ═══════════════════════════════════════════════════════════

/**
 * The district head: Collector, District Collector, Deputy Commissioner
 * (Karnataka) or District Magistrate (UP, Delhi) — never "Deputy
 * Commissioner of Police" or an "Additional …" post.
 */
export function isCollectorRole(role: string): boolean {
  return (
    /^(district collector|collector\b|deputy commissioner(?!\s+of\s+police)|district magistrate)/i.test(role.trim()) &&
    !/additional/i.test(role)
  );
}

/** Superintendent of Police (a district police force; SSP in some states). */
export function isSPRole(role: string): boolean {
  return /^(senior\s+)?superintendent of police\b/i.test(role.trim());
}

/** Commissioner of Police (a city police commissionerate) — not a Deputy/Joint/Additional CP. */
export function isPoliceCommissionerRole(role: string): boolean {
  return /^(commissioner of police|police commissioner)\b/i.test(role.trim());
}
