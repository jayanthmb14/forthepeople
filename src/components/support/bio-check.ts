/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Is the admin-written founder bio safe to show on /support?
// ═══════════════════════════════════════════════════════════════════════
//
//  The bio is free text saved in the admin panel (SupportPageConfig). The
//  saved version (April 2026) names the owner's company, calls the project
//  "not for profit" before any Section 8 registration exists, and says
//  "9 districts across 7 states, 29 live dashboards" while the registry now
//  has more. The support page hides the bio while any of these is true and
//  shows it again, unchanged, once the owner rewrites it in the admin panel.
//
//  Counts are compared with platform-facts (derived from the registries), so
//  a correct bio never goes stale just because a district launches.

export interface BioFacts {
  activeDistricts: number;
  activeStates: number;
  modulesPerDistrict: number;
  totalIndiaDistricts: number;
}

/** Plain-English reasons the bio is hidden (for server logs and the report); [] = show it. */
export function bioIssues(text: string, facts: BioFacts): string[] {
  const issues: string[] = [];
  const toNum = (s: string) => Number(s.replace(/,/g, ""));

  if (/pinnakle|pkjmb/i.test(text)) issues.push("names the owner's company (Pinnakle / PKJMB)");
  if (/not[\s-]+for[\s-]+profit|non[\s-]?profit/i.test(text)) issues.push('says "not for profit" / "non-profit"');

  for (const m of text.matchAll(/(\d[\d,]*)\+?\s+districts?\b/gi)) {
    const n = toNum(m[1]);
    if (n !== facts.activeDistricts && n !== facts.totalIndiaDistricts) {
      issues.push(`says ${n} districts (live now: ${facts.activeDistricts})`);
    }
  }
  for (const m of text.matchAll(/(\d[\d,]*)\+?\s+states?\b/gi)) {
    const n = toNum(m[1]);
    if (n !== facts.activeStates) issues.push(`says ${n} states (live now: ${facts.activeStates})`);
  }
  for (const m of text.matchAll(/(\d[\d,]*)\+?\s+(?:live\s+)?(?:dashboards|data modules|modules)\b/gi)) {
    const n = toNum(m[1]);
    if (n !== facts.modulesPerDistrict) issues.push(`says ${n} dashboards (now: ${facts.modulesPerDistrict} per district)`);
  }
  return issues;
}
