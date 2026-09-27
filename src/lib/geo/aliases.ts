/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Map shape slugs (public/geo/<state>-districts.json, DataMeet 2011 names)
// that differ from the district registry's slugs (current official names).
// Every map fill, click and location lookup goes through geoToRegistrySlug()
// so a shape and its district page always agree.
//
// Add a line here when a state map shows a live district grey, or a click
// on a shape opens a 404.
const GEO_SLUG_ALIASES: Record<string, Record<string, string>> = {
  maharashtra: {
    aurangabad: "chhatrapati-sambhajinagar",
    "mumbai-suburban": "mumbai", // the site's Mumbai covers City + Suburban
  },
  "uttar-pradesh": { "kanpur-nagar": "kanpur" },
  "west-bengal": { haora: "howrah", darjiling: "darjeeling", barddhaman: "bardhaman" },
  gujarat: { ahmadabad: "ahmedabad" },
  haryana: { gurgaon: "gurugram" },
  uttarakhand: { hardwar: "haridwar" },
  jharkhand: { "purbi-singhbhum": "jamshedpur" },
  assam: { "kamrup-metropolitan": "guwahati" },
  sikkim: { east: "gangtok", west: "gyalshing" }, // renamed in 2021
  "andaman-nicobar": { "north-and-middle-andaman": "north-middle-andaman" },
  delhi: {
    central: "central-delhi",
    east: "east-delhi",
    north: "north-delhi",
    "north-east": "north-east-delhi",
    "north-west": "north-west-delhi",
    south: "south-delhi",
    "south-west": "south-west-delhi",
    west: "west-delhi",
  },
};

/** The registry slug for a map shape's slug. Unchanged when no alias exists. */
export function geoToRegistrySlug(stateSlug: string, geoSlug: string): string {
  return GEO_SLUG_ALIASES[stateSlug]?.[geoSlug] ?? geoSlug;
}

/**
 * India map state names → registry state slugs. Covers both the "&" and
 * "and" spellings used by different DataMeet releases; a missing name
 * renders that state blank on every India map.
 */
export const INDIA_STATE_NAME_TO_SLUG: Record<string, string> = {
  "Andaman & Nicobar Island": "andaman-nicobar",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  "Assam": "assam",
  "Bihar": "bihar",
  "Chandigarh": "chandigarh",
  "Chhattisgarh": "chhattisgarh",
  "Dadra and Nagar Haveli": "dadra-nagar-haveli",
  "Daman and Diu": "dadra-nagar-haveli",
  "NCT of Delhi": "delhi",
  "Delhi": "delhi",
  "Goa": "goa",
  "Gujarat": "gujarat",
  "Haryana": "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu & Kashmir": "jammu-kashmir",
  "Jharkhand": "jharkhand",
  "Karnataka": "karnataka",
  "Kerala": "kerala",
  "Ladakh": "ladakh",
  "Lakshadweep": "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  "Maharashtra": "maharashtra",
  "Manipur": "manipur",
  "Meghalaya": "meghalaya",
  "Mizoram": "mizoram",
  "Nagaland": "nagaland",
  "Odisha": "odisha",
  "Puducherry": "puducherry",
  "Punjab": "punjab",
  "Rajasthan": "rajasthan",
  "Sikkim": "sikkim",
  "Tamil Nadu": "tamil-nadu",
  "Telangana": "telangana",
  "Tripura": "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  "Uttarakhand": "uttarakhand",
  "West Bengal": "west-bengal",
  // Spellings used by the current india-states.json
  "Andaman and Nicobar": "andaman-nicobar",
  "Jammu and Kashmir": "jammu-kashmir",
  "Dadra and Nagar Haveli and Daman and Diu": "dadra-nagar-haveli",
  "Andaman & Nicobar": "andaman-nicobar",
};

/**
 * Cache-buster for public/geo/*-districts.json. Bump it whenever those files
 * change so browsers don't keep an old copy (v2: rings rewound for d3,
 * Telangana split out — see scripts/rewind-geo.mjs).
 */
export const GEO_VERSION = "2";

export function stateGeoUrl(stateSlug: string): string {
  return `/geo/${stateSlug}-districts.json?v=${GEO_VERSION}`;
}
