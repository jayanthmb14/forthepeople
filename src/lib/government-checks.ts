/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Small checks for the "who runs it" pages (leaders, offices), added after
// the September 2026 audit. Pure functions, no database: safe to unit test
// (tests/government-checks.test.ts). Rule: verified or hidden — a stored
// value that fails a check is not shown.

/**
 * A leader's stored phone, or null when it is not a real office number.
 *
 * The audit found the Mumbai Police Commissioner's record with phone "100"
 * (the old police emergency code, which the site removed from its helplines
 * because no official page confirms it). A short code — 100, 112, 1098,
 * 1947 … — is a public helpline, never one person's office line, so any
 * number with fewer than 8 digits is dropped. Indian landlines with STD
 * code and mobiles have 10 or more digits.
 */
export function leaderOfficePhone(phone: string | null | undefined): string | null {
  const value = phone?.trim() ?? "";
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? value : null;
}

/**
 * True when the stored local-language role (Leader.roleLocal) still fits
 * the English role and may be shown instead of it on /hi/ and /kn/ pages.
 *
 * roleLocal is a translation written once; nothing re-checks it when the
 * facts change. The audit found Siddaramaiah's record with role "MLA,
 * Varuna" but roleLocal "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)" — "MLA (Chief
 * Minister)" — months after he stopped being Chief Minister. A local role
 * that carries a bracketed extra ("(Chief Minister)") which the English
 * role does not have says more than the checked record, so it is not used.
 */
export function localRoleFits(role: string, roleLocal: string | null | undefined): boolean {
  const local = roleLocal?.trim() ?? "";
  if (!local) return false;
  const localHasBracket = /[(（[]/.test(local);
  const roleHasBracket = /[(（[]/.test(role);
  return !(localHasBracket && !roleHasBracket);
}

/**
 * The outlets a leader record cites, from its free-text `source`:
 *   "manual-research 2026-09 · Wikipedia; IndiaVotes" → ["Wikipedia", "IndiaVotes"]
 *   "Free Press Journal | https://…"                   → ["Free Press Journal"]
 *   "results.eci.gov.in"                               → ["results.eci.gov.in"]
 * Rows written from a news URL (source starting "http") are never shown, so
 * they give nothing here.
 */
export function leaderSourceOutlets(source: string | null | undefined): string[] {
  const s = source?.trim() ?? "";
  if (!s || /^https?:/i.test(s)) return [];
  const afterDot = s.includes("·") ? s.slice(s.indexOf("·") + 1) : s;
  return afterDot
    .split(";")
    .map((part) => part.split("|")[0].replace(/\(.*?\)/g, "").trim())
    .filter((name) => name.length > 0 && !/^manual-research\b/i.test(name));
}

/**
 * The outlets the shown leader records cite, most-cited first (ties in
 * name order). The leadership page names these as its source instead of a
 * fixed "ECI" label: the Sept 2026 audit found no row citing the Election
 * Commission while the header said "ECI".
 */
export function leaderSourceSummary(sources: ReadonlyArray<string | null | undefined>): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const src of sources) {
    for (const name of new Set(leaderSourceOutlets(src))) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
