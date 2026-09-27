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
  /**
   * Only for districts whose AGMARKNET district is bigger than ours: the
   * mandis inside our district, matched as a whole-word part of the
   * AGMARKNET market name. An empty list means none of the source
   * district's mandis is in ours. Leave it out when the AGMARKNET
   * district is the same as ours (every mandi counts).
   */
  agmarknetMarkets?: string[];
  /** Names that identify this district in an alert text (whole words). */
  alertNames?: string[];
}

const ALIASES: Record<string, AliasEntry> = {
  "bengaluru-urban": {
    weatherCity: "Bangalore",
    agmarknet: ["Bangalore", "Bengaluru Urban", "Bangalore Urban", "Bengaluru"],
    // AGMARKNET's "Bangalore" is the old undivided district. Sept 2026
    // audit: 94 of its 100 rows came from Ramanagara and Kanakapura APMCs
    // (Bengaluru South district, https://bengalurusouth.nic.in) and from
    // Doddaballapur and Hoskote APMCs (Bengaluru Rural district,
    // https://bangalorerural.nic.in/en/subdivision-blocks/). Only the
    // Bangalore APMC (Yeshwanthpur / Binny Mill) is in Bengaluru Urban.
    agmarknetMarkets: ["Bangalore", "Bengaluru", "Binny Mill"],
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
    // AGMARKNET's "Delhi" covers all 11 Delhi districts. New Delhi
    // district (Chanakyapuri, Delhi Cantonment, Vasant Vihar tehsils) has
    // no APMC: Azadpur, Gazipur and Keshopur are in other districts
    // (Sept 2026 audit). So no AGMARKNET mandi counts as New Delhi's.
    agmarknetMarkets: [],
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

/**
 * Mandis of the AGMARKNET district that are inside this district, as name
 * parts (see AliasEntry.agmarknetMarkets), or null when every mandi of the
 * matched AGMARKNET district is ours.
 */
export function agmarknetMarketsInDistrict(slug: string): readonly string[] | null {
  return ALIASES[slug]?.agmarknetMarkets ?? null;
}

/** True when an AGMARKNET market (mandi) is inside this district. */
export function isMarketInDistrict(slug: string, market: string): boolean {
  const names = agmarknetMarketsInDistrict(slug);
  if (names === null) return true;
  return names.some((n) => mentionsName(market, n));
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
