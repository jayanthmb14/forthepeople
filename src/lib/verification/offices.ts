/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// State-level offices the leaders verifier checks (pure)
//
// Leader rows are per district, so the Chief Minister of Karnataka is
// stored once for Mandya, once for Mysuru and once for Bengaluru Urban.
// classifyStateOffice() recognises those rows from their free-text role
// ("Chief Minister of Karnataka", "MLA, Kanakapura (Deputy CM)",
// "Lieutenant Governor of Delhi"); the verifier then compares every such
// row with what Wikipedia and Wikidata say for the state.
// ═══════════════════════════════════════════════════════════

export type StateOffice = "chief-minister" | "deputy-cm" | "governor" | "lieutenant-governor";

export const STATE_OFFICES: readonly StateOffice[] = ["chief-minister", "deputy-cm", "governor", "lieutenant-governor"];

/** English office names, for admin notes and review headlines. */
export function officeTitle(office: StateOffice, stateName: string): string {
  switch (office) {
    case "chief-minister":
      return `Chief Minister of ${stateName}`;
    case "deputy-cm":
      return `Deputy Chief Minister of ${stateName}`;
    case "governor":
      return `Governor of ${stateName}`;
    case "lieutenant-governor":
      return `Lieutenant Governor of ${stateName}`;
  }
}

/**
 * Which state office a role (or an infobox label) names, or null.
 * Order matters: "Deputy Chief Minister" before "Chief Minister",
 * "Lieutenant Governor" before "Governor".
 */
export function classifyStateOffice(role: string | null | undefined): StateOffice | null {
  const r = (role ?? "").toLowerCase();
  if (!r) return null;
  if (/\bdeputy\s+(chief\s+minister|c\.?\s?m)\b/.test(r)) return "deputy-cm";
  if (/\bchief\s+minister\b/.test(r) && !/\b(office|secretary|advisor|adviser|principal)\b/.test(r)) return "chief-minister";
  if (/\b(lieutenant|lt\.?)\s+governor/.test(r)) return "lieutenant-governor";
  if (/\bgovernor\b/.test(r) && !/\b(deputy|reserve bank|rbi|vice)\b/.test(r)) return "governor";
  return null;
}

/**
 * The offices every district page should list for its state: the head of
 * government and the head of state. A missing one is reported ("coverage");
 * Deputy Chief Ministers are optional and only checked when we show one.
 */
export function coreOffices(found: ReadonlySet<StateOffice>): StateOffice[] {
  const head: StateOffice = found.has("lieutenant-governor") && !found.has("governor") ? "lieutenant-governor" : "governor";
  return ["chief-minister", head];
}

/** "Chief Minister of Karnataka" → "chief-minister" style slug for any role (datasetKey part). */
export function roleSlug(role: string): string {
  return (
    role
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "role"
  );
}

/** False when a role names a different state ("Governor of Kerala" on a Karnataka page). */
export function roleIsForState(role: string, stateName: string): boolean {
  const m = /\bof\s+([a-z .&-]+)$/i.exec(role.replace(/\([^)]*\)?/g, "").trim());
  if (!m) return true;
  const place = m[1].toLowerCase().trim();
  const st = stateName.toLowerCase();
  if (st.includes("delhi") && /delhi|nct|gnctd/.test(place)) return true;
  return place.includes(st) || st.includes(place);
}
