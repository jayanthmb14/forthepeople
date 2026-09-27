/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// District name aliases for outside sources (pure, no DB)
//
// Government feeds spell district names their own way: AGMARKNET still
// says "Bangalore" and "Mysore", OpenWeather knows "Bangalore", NDMA alerts
// say "Bengaluru Urban". One table here, used by the crops, weather and
// alerts collectors, instead of three overrides that drifted apart.
//
// Rule when adding: list the source's spelling you have SEEN in that
// source (or the official old/new name pair). Order matters for AGMARKNET:
// the collector tries the names in order and logs which one matched.
// ═══════════════════════════════════════════════════════════

interface AliasEntry {
  /** City name OpenWeather resolves for this district (`q=<city>,IN`). */
  weatherCity?: string;
  /** AGMARKNET `district` values to try, in order. */
  agmarknet?: string[];
  /** Names that identify this district in an alert text (whole words). */
  alertNames?: string[];
}

const ALIASES: Record<string, AliasEntry> = {
  "bengaluru-urban": {
    weatherCity: "Bangalore",
    agmarknet: ["Bangalore", "Bengaluru Urban", "Bangalore Urban", "Bengaluru"],
    alertNames: ["Bengaluru Urban", "Bangalore Urban", "Bengaluru", "Bangalore"],
  },
  mysuru: {
    weatherCity: "Mysore",
    agmarknet: ["Mysore", "Mysuru"],
    alertNames: ["Mysuru", "Mysore"],
  },
  mandya: {
    agmarknet: ["Mandya"],
    alertNames: ["Mandya"],
  },
  "new-delhi": {
    weatherCity: "New Delhi",
    agmarknet: ["Delhi", "New Delhi"],
    // "Delhi" alone covers all 11 Delhi districts, so only the district's own name.
    alertNames: ["New Delhi"],
  },
  mumbai: {
    weatherCity: "Mumbai",
    agmarknet: ["Mumbai", "Greater Mumbai", "Mumbai City", "Mumbai Suburban"],
    alertNames: ["Mumbai City", "Mumbai Suburban", "Greater Mumbai", "Mumbai"],
  },
  pune: {
    weatherCity: "Pune",
    agmarknet: ["Pune"],
    alertNames: ["Pune"],
  },
  kolkata: {
    weatherCity: "Kolkata",
    agmarknet: ["Kolkata", "Calcutta"],
    alertNames: ["Kolkata"],
  },
  chennai: {
    weatherCity: "Chennai",
    agmarknet: ["Chennai"],
    alertNames: ["Chennai"],
  },
  hyderabad: {
    weatherCity: "Hyderabad",
    agmarknet: ["Hyderabad"],
    alertNames: ["Hyderabad"],
  },
  lucknow: {
    weatherCity: "Lucknow",
    agmarknet: ["Lucknow"],
    alertNames: ["Lucknow"],
  },
};

const unique = (xs: string[]) => {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = x.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/** City to ask OpenWeather for. Falls back to the district's own name. */
export function weatherCityName(slug: string, districtName: string): string {
  return ALIASES[slug]?.weatherCity ?? districtName;
}

/** AGMARKNET district names to try, in order, ending with the district's own name. */
export function agmarknetDistrictNames(slug: string, districtName: string): string[] {
  return unique([...(ALIASES[slug]?.agmarknet ?? []), districtName]);
}

/** Names that mark an alert as being about this district (whole-word match). */
export function alertDistrictNames(slug: string, districtName: string): string[] {
  return unique([...(ALIASES[slug]?.alertNames ?? []), districtName]);
}

/** Escape a string for use inside a RegExp. */
export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when `name` appears in `text` as whole words (case-insensitive).
 * "Pune" matches "over Pune, Satara" but not "Punekar"; spaces in the
 * name match any run of whitespace, hyphens or underscores.
 */
export function mentionsName(text: string, name: string): boolean {
  const pattern = escapeRegExp(name.trim()).replace(/\s+/g, "[\\s_-]+");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${pattern}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}
