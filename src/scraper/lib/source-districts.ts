/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// How each government portal spells our districts and states
// (pure, no DB, no network).
//
// Every portal has its own list: JJM says "Mysuru", NREGA says
// "MYSURU", UDISE+ splits Bengaluru Urban into two education districts
// ("BENGALURU U NORTH", "BENGALURU U SOUTH") and Mumbai into
// "MUMBAI II" + "MUMBAI (SUBURBAN)". The collectors read the portal's
// own list at run time and match it with the names below, so a
// district that is added later works without code changes as long as
// the portal uses the same name we do.
//
// Rule when adding: only list spellings you have SEEN in that portal's
// list (checked 27 Sep 2026 unless noted).
// ═══════════════════════════════════════════════════════════

/** "Chennai (Ext. GCC)" → "CHENNAIEXTGCC". Case, spaces and punctuation do not matter. */
export function normName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

interface SourceNames {
  /** JJM dashboard district names (ejalshakti.gov.in). */
  jjm?: string[];
  /** NREGA "At a glance" district names (nrega.dord.gov.in). */
  nrega?: string[];
  /**
   * UDISE+ education districts. When a district is split into several
   * education districts, EVERY name here is one part and the figures
   * are listed per part (and counts summed).
   */
  udiseParts?: string[];
  /** Other UDISE+ spellings (alternatives, first found wins). */
  udise?: string[];
}

const NAMES: Record<string, SourceNames> = {
  "bengaluru-urban": {
    jjm: ["Bengaluru Urban", "Bangalore Urban"],
    // NREGA lists "BENGALURU" (urban), "BENGALURU RURAL" and "BENGALURU SOUTH" (ex-Ramanagara).
    nrega: ["BENGALURU", "BENGALURU URBAN", "BANGALORE URBAN"],
    udiseParts: ["BENGALURU U NORTH", "BENGALURU U SOUTH"],
  },
  mysuru: { jjm: ["Mysuru", "Mysore"], nrega: ["MYSURU", "MYSORE"], udise: ["MYSURU", "MYSORE"] },
  mandya: { jjm: ["Mandya"], nrega: ["MANDYA"], udise: ["MANDYA"] },
  pune: { jjm: ["Pune"], nrega: ["PUNE"], udise: ["PUNE"] },
  lucknow: { jjm: ["Lucknow"], nrega: ["LUCKNOW"], udise: ["LUCKNOW"] },
  // Greater Mumbai. JJM and NREGA are rural schemes and do not list it;
  // never match one half ("Mumbai Suburban") for the whole city.
  mumbai: { jjm: ["Mumbai"], nrega: ["MUMBAI"], udiseParts: ["MUMBAI II", "MUMBAI (SUBURBAN)"] },
  chennai: { jjm: ["Chennai"], nrega: ["CHENNAI"], udise: ["CHENNAI (EXT. GCC)", "CHENNAI"] },
  hyderabad: { jjm: ["Hyderabad"], nrega: ["HYDERABAD"], udise: ["HYDERABAD"] },
  kolkata: { jjm: ["Kolkata"], nrega: ["KOLKATA"], udise: ["KOLKATA"] },
  "new-delhi": { jjm: ["New Delhi"], nrega: ["NEW DELHI"], udise: ["NEW DELHI"] },
};

const STATE_NAMES: Record<string, string[]> = {
  delhi: ["Delhi", "NCT of Delhi", "National Capital Territory of Delhi"],
  "tamil-nadu": ["Tamil Nadu", "Tamilnadu"],
  "jammu-and-kashmir": ["Jammu and Kashmir", "Jammu & Kashmir"],
  "andaman-and-nicobar-islands": ["Andaman and Nicobar Islands", "A & N Islands", "Andaman & Nicobar Islands", "Andaman and Nicobar"],
};

const uniq = (xs: string[]) => Array.from(new Map(xs.map((x) => [normName(x), x])).values());

/** Spellings to try for a district on one portal, ending with our own name. */
export function sourceDistrictNames(source: "jjm" | "nrega" | "udise", slug: string, districtName: string): string[] {
  const n = NAMES[slug];
  const listed = source === "udise" ? (n?.udise ?? []) : (n?.[source] ?? []);
  return uniq([...listed, districtName]);
}

/** UDISE+ parts for a district split into several education districts, else null. */
export function udiseParts(slug: string): string[] | null {
  return NAMES[slug]?.udiseParts ?? null;
}

/** Spellings to try for a state, ending with our own name. */
export function sourceStateNames(stateSlug: string, stateName: string): string[] {
  return uniq([...(STATE_NAMES[stateSlug] ?? []), stateName]);
}

/**
 * Find the first item whose name matches one of `names` (in the order of
 * `names`, so the preferred spelling wins). Returns null when none match.
 */
export function pickByName<T>(items: T[], nameOf: (t: T) => string, names: string[]): T | null {
  const byName = new Map<string, T>();
  for (const it of items) {
    const k = normName(nameOf(it));
    if (k && !byName.has(k)) byName.set(k, it);
  }
  for (const n of names) {
    const hit = byName.get(normName(n));
    if (hit) return hit;
  }
  return null;
}

/** A district as the portal collectors need it. */
export interface CollectorDistrict {
  id: string;
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
}

/** DB rows (district + state) → collector districts; rows without a state are dropped. */
export function toCollectorDistricts(
  rows: Array<{ id: string; slug: string; name: string; state: { slug: string; name: string } | null }>,
): CollectorDistrict[] {
  return rows
    .filter((d) => d.state)
    .map((d) => ({ id: d.id, slug: d.slug, name: d.name, stateSlug: d.state!.slug, stateName: d.state!.name }));
}

/** Stalest first: never-fetched, then oldest fetchedAt; ties keep the given order. */
export function stalestFirst<T extends { slug: string }>(items: T[], ages: Record<string, string | null>): T[] {
  return items
    .map((it, i) => ({ it, i, t: ages[it.slug] ? Date.parse(ages[it.slug]!) : -Infinity }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.it);
}
