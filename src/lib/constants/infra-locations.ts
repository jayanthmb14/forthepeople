/**
 * ForThePeople.in — Infrastructure location mappings
 *
 * Used by the runtime sync path (applyScopeOverride in
 * src/lib/infra-sync.ts); the one-off cleanup script that also read it
 * is gone. Keeping these in one place so future districts/neighborhoods
 * can be added in exactly one file.
 *
 * Semantics
 * ─────────
 * AREA_TO_DISTRICT[area] = "district-slug"  → project anchored to that
 *                                              district's active row.
 * AREA_TO_DISTRICT[area] = null             → city not served by
 *                                              ForThePeople yet; project
 *                                              should be removed.
 *
 * AGENCY_TO_DISTRICT[executingAgency] works the same way — scoped to a
 * single city's agency (BMRCL/CMRL/DMRC/etc.).
 */

// ── NEIGHBORHOOD / AREA → DISTRICT ─────────────────────────
// Lowercase keys. Multi-word keys match on the whole phrase.
export const AREA_TO_DISTRICT: Record<string, string | null> = {
  // Bengaluru Urban
  hebbal: "bengaluru-urban", sarjapur: "bengaluru-urban",
  challaghatta: "bengaluru-urban", kengeri: "bengaluru-urban",
  kothanur: "bengaluru-urban", majestic: "bengaluru-urban",
  whitefield: "bengaluru-urban", yelahanka: "bengaluru-urban",
  "electronic city": "bengaluru-urban", jayanagar: "bengaluru-urban",
  "jp nagar": "bengaluru-urban", bommasandra: "bengaluru-urban",
  anekal: "bengaluru-urban", devanahalli: "bengaluru-urban",
  anjanapura: "bengaluru-urban", nagawara: "bengaluru-urban",
  "silk board": "bengaluru-urban", koramangala: "bengaluru-urban",
  indiranagar: "bengaluru-urban", rajajinagar: "bengaluru-urban",
  peenya: "bengaluru-urban", yeshwanthpur: "bengaluru-urban",
  banashankari: "bengaluru-urban", basavanagudi: "bengaluru-urban",
  malleshwaram: "bengaluru-urban", vijayanagar: "bengaluru-urban",
  nagasandra: "bengaluru-urban", madavara: "bengaluru-urban",
  mysore_road: "bengaluru-urban",      // Majestic-Mysuru Road metro stretch
  hosur_road: "bengaluru-urban",
  ramanagara: "bengaluru-urban",       // sits on BLR suburban rail extension

  // Chennai
  kodambakkam: "chennai", poonamallee: "chennai", guindy: "chennai",
  tambaram: "chennai", avadi: "chennai", sholinganallur: "chennai",
  madhavaram: "chennai", adyar: "chennai", velachery: "chennai",
  egmore: "chennai", pallavaram: "chennai",

  // Mumbai
  andheri: "mumbai", bandra: "mumbai", borivali: "mumbai",
  goregaon: "mumbai", mulund: "mumbai", sewri: "mumbai",
  worli: "mumbai", colaba: "mumbai", dahisar: "mumbai",
  kurla: "mumbai", ghatkopar: "mumbai", dadar: "mumbai",
  chembur: "mumbai", kalyan: "mumbai",
  "navi mumbai": "mumbai",             // part of MMR — Mumbai district page
  "nhava sheva": "mumbai",

  // Delhi
  dwarka: "new-delhi", meerut: "new-delhi",
  "connaught place": "new-delhi", saket: "new-delhi",
  "rohini": "new-delhi", "janakpuri": "new-delhi",
  "aerocity": "new-delhi", "tughlakabad": "new-delhi",
  "rk ashram": "new-delhi", "sarai kale khan": "new-delhi",

  // Kolkata
  joka: "kolkata", howrah: "kolkata", "salt lake": "kolkata",
  "bbd bagh": "kolkata", "bidhannagar": "kolkata",

  // Hyderabad
  miyapur: "hyderabad", "lb nagar": "hyderabad",
  "jbs": "hyderabad", "mgbs": "hyderabad", "nagole": "hyderabad",
  "raidurg": "hyderabad", "hitech city": "hyderabad",

  // Lucknow
  "ccs airport": "lucknow", "munshipulia": "lucknow",
  "amausi": "lucknow",

  // Mysuru
  "nanjangud": "mysuru", "t narsipur": "mysuru",

  // Mandya
  "krs": "mandya",               // Krishnaraja Sagara dam is in Mandya
  "pandavapura": "mandya",

  // ── Cities NOT served by ForThePeople.in (delete references) ──
  nagpur: null, pune: null, surat: null, thane: null,
  nashik: null, vadodara: null, noida: null, gurgaon: null,
  gurugram: null, faridabad: null, ghaziabad: null, indore: null,
  bhopal: null, jaipur: null, kanpur: null, patna: null,
  bhubaneswar: null, guwahati: null, chandigarh: null, kochi: null,
  thiruvananthapuram: null, coimbatore: null, madurai: null,
  visakhapatnam: null, vijayawada: null, ranchi: null, raipur: null,
  dehradun: null, shimla: null, agartala: null, aizawl: null,
  imphal: null, itanagar: null, kohima: null, shillong: null,
  gangtok: null, panaji: null, leh: null, srinagar: null,
  jammu: null, amritsar: null, ludhiana: null,
};

// Split multi-word keys that need to match as a phrase (vs single tokens).
// Built once at module load. Length-desc so "electronic city" matches before "city".
export const AREA_PHRASES: Array<{ phrase: string; district: string | null }> = Object.entries(AREA_TO_DISTRICT)
  .filter(([k]) => k.includes(" ") || k.includes("_"))
  .map(([k, v]) => ({ phrase: k.replace(/_/g, " "), district: v }))
  .sort((a, b) => b.phrase.length - a.phrase.length);

// Single-token lookup for fast scan
export const AREA_TOKENS: Map<string, string | null> = new Map(
  Object.entries(AREA_TO_DISTRICT)
    .filter(([k]) => !k.includes(" ") && !k.includes("_"))
);

// ── AGENCY → DISTRICT ──────────────────────────────────────
// Match on the full agency name (case-insensitive substring).
export const AGENCY_TO_DISTRICT: Array<{ pattern: RegExp; districtSlug: string }> = [
  { pattern: /\bBMRCL\b|bangalore metro rail corporation|bengaluru metro rail corporation/i, districtSlug: "bengaluru-urban" },
  { pattern: /\bBDA\b(?!\s*hospital)/i,                                                      districtSlug: "bengaluru-urban" },
  { pattern: /\bBBMP\b/i,                                                                    districtSlug: "bengaluru-urban" },
  { pattern: /\bBESCOM\b/i,                                                                  districtSlug: "bengaluru-urban" },
  { pattern: /\bBIAL\b/i,                                                                    districtSlug: "bengaluru-urban" },
  { pattern: /\bBWSSB\b/i,                                                                   districtSlug: "bengaluru-urban" },
  { pattern: /\bCMRL\b|chennai metro rail limited/i,                                         districtSlug: "chennai" },
  { pattern: /\bCMWSSB\b/i,                                                                  districtSlug: "chennai" },
  { pattern: /\bDMRC\b|delhi metro rail corporation/i,                                       districtSlug: "new-delhi" },
  { pattern: /\bDDA\b/i,                                                                     districtSlug: "new-delhi" },
  { pattern: /\bNCRTC\b/i,                                                                   districtSlug: "new-delhi" },
  { pattern: /\bMMRDA\b/i,                                                                   districtSlug: "mumbai" },
  { pattern: /\bMMRC\b|mumbai metro rail corporation/i,                                      districtSlug: "mumbai" },
  { pattern: /\bBMC\b(?!.*\bbengaluru)/i, /* Brihanmumbai MC — avoid BBMP false-match */     districtSlug: "mumbai" },
  { pattern: /\bKMRC\b|kolkata metro rail/i,                                                 districtSlug: "kolkata" },
  { pattern: /\bKMC\b(?!.*\bbengaluru|.*\bbangalore)/i, /* Kolkata MC */                     districtSlug: "kolkata" },
  { pattern: /\bHMDA\b/i,                                                                    districtSlug: "hyderabad" },
  { pattern: /\bGHMC\b/i,                                                                    districtSlug: "hyderabad" },
  { pattern: /\bL&T\s*metro\s*rail\s*hyderabad|l&t\s*metro/i,                                districtSlug: "hyderabad" },
  { pattern: /\bUPMRC\b|uttar\s*pradesh\s*metro\s*rail/i,                                    districtSlug: "lucknow" },
  { pattern: /\bUPEIDA\b/i,                                                                  districtSlug: "lucknow" },
  { pattern: /\bMUDA\b/i,                                                                    districtSlug: "mysuru" },
];

/**
 * Given a project name, return the district slug it should belong to
 * (based on neighborhood match), or `undefined` if no match, or `null`
 * when the area maps to a city not in our system (caller should delete).
 */
export function detectDistrictFromName(name: string): string | null | undefined {
  const lower = name.toLowerCase();
  // Multi-word phrases first — longest match wins
  for (const { phrase, district } of AREA_PHRASES) {
    if (lower.includes(phrase)) return district;
  }
  // Then single tokens — lower-cased word boundary scan
  const tokens = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    if (AREA_TOKENS.has(t)) return AREA_TOKENS.get(t)!;
  }
  return undefined;
}

/** Agency-based assignment. Returns district slug or undefined. */
export function detectDistrictFromAgency(agency: string | null | undefined): string | undefined {
  if (!agency) return undefined;
  for (const { pattern, districtSlug } of AGENCY_TO_DISTRICT) {
    if (pattern.test(agency)) return districtSlug;
  }
  return undefined;
}

/** Returns every district slug the project name references (for two-city detection). */
export function allDistrictsMentionedInName(name: string): string[] {
  const hit = new Set<string>();
  const lower = name.toLowerCase();
  for (const { phrase, district } of AREA_PHRASES) {
    if (district && lower.includes(phrase)) hit.add(district);
  }
  const tokens = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    const v = AREA_TOKENS.get(t);
    if (v) hit.add(v);
  }
  return [...hit];
}
