/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  district-search — find a district by any name people actually type
// ═══════════════════════════════════════════════════════════════════════
//
//  Pure functions (no React, no fetch), shared by the header's district
//  finder and the home-page search box, and covered by
//  tests/district-search.test.ts.
//
//  What it matches, for every district in the registry
//  (src/lib/constants/districts.ts):
//    - the English name ("Mysuru"), the local-script name ("ಮೈಸೂರು") and
//      every names[*] entry ("मैसूरु")
//    - the state, in English, its own script and the page language
//    - old and everyday names ("Mysore", "Bangalore", "Gurgaon", "Tumkur",
//      "Bombay", "Calcutta"…) from DISTRICT_ALIASES below
//
//  Spaces, hyphens and dots are ignored ("bengaluru-urban" = "Bengaluru
//  Urban" = "bengaluruurban"), and so are Latin accents.
//
import { INDIA_STATES } from "@/lib/constants/districts";
import type { PlaceNames } from "@/lib/constants/districts";

/**
 * Other names people use for a district, keyed "<stateSlug>/<districtSlug>".
 * Only districts that exist in the registry may be listed (the test checks
 * this). Add a line when a visitor reports "I searched X and found nothing".
 */
export const DISTRICT_ALIASES: Record<string, readonly string[]> = {
  // Karnataka
  "karnataka/bengaluru-urban": ["Bangalore", "Bangalore Urban", "Bengaluru", "Bangaluru"],
  "karnataka/bengaluru-rural": ["Bangalore Rural"],
  "karnataka/mysuru": ["Mysore"],
  "karnataka/tumakuru": ["Tumkur"],
  "karnataka/shivamogga": ["Shimoga"],
  "karnataka/chikkamagaluru": ["Chikmagalur", "Chickmagalur"],
  "karnataka/kodagu": ["Coorg", "Madikeri"],
  "karnataka/ballari": ["Bellary"],
  "karnataka/belagavi": ["Belgaum"],
  "karnataka/vijayapura": ["Bijapur"],
  "karnataka/kalaburagi": ["Gulbarga"],
  "karnataka/dakshina-kannada": ["Mangalore", "Mangaluru", "South Canara"],
  "karnataka/uttara-kannada": ["Karwar", "North Canara"],
  "karnataka/udupi": ["Manipal"],
  "karnataka/dharwad": ["Hubli", "Hubballi", "Dharwar", "Hubli-Dharwad"],
  "karnataka/chamarajanagar": ["Chamrajnagar"],
  "karnataka/bagalkot": ["Bagalkote"],
  "karnataka/vijayanagara": ["Hospet", "Hosapete", "Hampi"],
  "karnataka/ramanagara": ["Ramanagaram"],
  "karnataka/chikkaballapur": ["Chickballapur"],
  "karnataka/davanagere": ["Davangere"],
  "karnataka/yadgir": ["Yadagiri"],
  "karnataka/hassan": ["Hasana"],
  // Andhra Pradesh and Telangana
  "andhra-pradesh/visakhapatnam": ["Vizag", "Vishakhapatnam", "Waltair"],
  "andhra-pradesh/vijayawada": ["Bezawada"],
  "andhra-pradesh/tirupati": ["Tirupathi"],
  "telangana/hyderabad": ["Secunderabad"],
  "telangana/warangal": ["Orugallu"],
  "telangana/nizamabad": ["Indur"],
  // Tamil Nadu and Kerala
  "tamil-nadu/chennai": ["Madras"],
  "tamil-nadu/tiruchirappalli": ["Trichy", "Tiruchi", "Trichinopoly"],
  "tamil-nadu/coimbatore": ["Kovai"],
  "kerala/thiruvananthapuram": ["Trivandrum"],
  "kerala/kochi": ["Cochin", "Ernakulam"],
  "kerala/kozhikode": ["Calicut"],
  "kerala/thrissur": ["Trichur"],
  // West and north
  "maharashtra/mumbai": ["Bombay", "Mumbai City", "Mumbai Suburban"],
  "maharashtra/pune": ["Poona"],
  "maharashtra/nashik": ["Nasik"],
  "maharashtra/chhatrapati-sambhajinagar": ["Aurangabad", "Sambhajinagar"],
  "gujarat/ahmedabad": ["Ahmadabad", "Amdavad"],
  "gujarat/vadodara": ["Baroda"],
  "madhya-pradesh/jabalpur": ["Jubbulpore"],
  "uttar-pradesh/kanpur": ["Kanpur Nagar", "Cawnpore"],
  "uttar-pradesh/varanasi": ["Benares", "Banaras", "Kashi"],
  "haryana/gurugram": ["Gurgaon"],
  "himachal-pradesh/shimla": ["Simla"],
  "himachal-pradesh/kangra": ["Dharamshala", "Dharamsala"],
  "uttarakhand/haridwar": ["Hardwar"],
  "uttarakhand/dehradun": ["Dehra Dun"],
  // East and north-east
  "west-bengal/kolkata": ["Calcutta"],
  "west-bengal/howrah": ["Haora"],
  "west-bengal/darjeeling": ["Darjiling"],
  "west-bengal/bardhaman": ["Burdwan", "Barddhaman"],
  "odisha/bhubaneswar": ["Bhubaneshwar", "Khordha", "Khurda"],
  "jharkhand/jamshedpur": ["Tatanagar", "East Singhbhum", "Purbi Singhbhum"],
  "assam/guwahati": ["Gauhati", "Kamrup Metropolitan"],
  "meghalaya/east-khasi-hills": ["Shillong"],
  "manipur/imphal-west": ["Imphal"],
  "tripura/west-tripura": ["Agartala"],
  "sikkim/gangtok": ["East Sikkim"],
  "sikkim/gyalshing": ["West Sikkim", "Geyzing"],
  // Union territories and Goa
  "puducherry/puducherry": ["Pondicherry", "Pondy"],
  "andaman-nicobar/south-andaman": ["Port Blair"],
  "goa/north-goa": ["Panaji", "Panjim"],
  "goa/south-goa": ["Margao", "Madgaon"],
};

/** One district in the search index. */
export interface FinderDistrict {
  slug: string;
  name: string;
  nameLocal: string;
  names?: PlaceNames;
  stateSlug: string;
  stateName: string;
  active: boolean;
  /** Other names people use ("Mysore"), as written. */
  aliases: readonly string[];
  /** Normalised district spellings (name, local script, names[*]). */
  keys: string[];
  /** Normalised aliases, same order as `aliases`. */
  aliasKeys: string[];
  /** Normalised state spellings. */
  stateKeys: string[];
}

export interface DistrictMatch {
  district: FinderDistrict;
  /** The alias that matched, when the match came from an old name. */
  via?: string;
  score: number;
}

/**
 * Lower-case, strip Latin accents, and turn every run of spaces, hyphens,
 * dots, commas and brackets into one space. Indic letters are untouched.
 */
export function normaliseSearch(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s\-_.,()/'’]+/g, " ")
    .trim();
}

function compact(text: string): string {
  return text.replace(/ /g, "");
}

/**
 * Every registry district, ready to search. `stateLabel` adds the state's
 * name in the page language (e.g. "कर्नाटक" on /hi) to the state keys.
 */
export function buildDistrictIndex(stateLabel?: (slug: string, name: string) => string): FinderDistrict[] {
  const out: FinderDistrict[] = [];
  for (const s of INDIA_STATES) {
    const stateKeys = [s.name, s.nameLocal, stateLabel ? stateLabel(s.slug, s.name) : ""]
      .filter(Boolean)
      .map(normaliseSearch);
    for (const d of s.districts) {
      const aliases = DISTRICT_ALIASES[`${s.slug}/${d.slug}`] ?? [];
      out.push({
        slug: d.slug,
        name: d.name,
        nameLocal: d.nameLocal,
        names: d.names,
        stateSlug: s.slug,
        stateName: s.name,
        active: d.active,
        aliases,
        keys: [d.name, d.nameLocal, ...Object.values(d.names ?? {})]
          .filter((x): x is string => typeof x === "string" && x.length > 0)
          .map(normaliseSearch),
        aliasKeys: aliases.map(normaliseSearch),
        stateKeys,
      });
    }
  }
  return out;
}

/** How well `key` matches the query: 4 exact, 3 starts with, 2 a word starts with, 1 contains, 0 no. */
function keyScore(key: string, q: string, qc: string): number {
  if (!key) return 0;
  const kc = compact(key);
  if (key === q || kc === qc) return 4;
  if (key.startsWith(q) || kc.startsWith(qc)) return 3;
  if (key.split(" ").some((w) => w.startsWith(q))) return 2;
  if (key.includes(q) || kc.includes(qc)) return 1;
  return 0;
}

/**
 * Districts matching `query`, split into live and not-live lists (live
 * first on screen), each sorted best match first, then by name.
 */
export function searchDistricts(
  index: readonly FinderDistrict[],
  query: string,
  limits: { live?: number; notLive?: number } = {},
): { live: DistrictMatch[]; notLive: DistrictMatch[] } {
  const q = normaliseSearch(query);
  if (!q) return { live: [], notLive: [] };
  const qc = compact(q);

  const matches: DistrictMatch[] = [];
  for (const d of index) {
    let best = 0;
    for (const k of d.keys) best = Math.max(best, keyScore(k, q, qc) * 10);
    let via: string | undefined;
    d.aliasKeys.forEach((k, i) => {
      const s = keyScore(k, q, qc) * 10 - 1; // a real name wins a tie
      if (s > best) {
        best = s;
        via = d.aliases[i];
      }
    });
    if (best === 0) {
      // The state's name matches: list its districts, after name matches.
      const st = Math.max(0, ...d.stateKeys.map((k) => keyScore(k, q, qc)));
      if (st > 0) best = st;
    }
    if (best > 0) matches.push({ district: d, via, score: best });
  }

  matches.sort((a, b) => b.score - a.score || a.district.name.localeCompare(b.district.name));
  return {
    live: matches.filter((m) => m.district.active).slice(0, limits.live ?? 10),
    notLive: matches.filter((m) => !m.district.active).slice(0, limits.notLive ?? 12),
  };
}
