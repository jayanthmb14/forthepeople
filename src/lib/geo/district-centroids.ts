/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  district-centroids.ts — one lat/lng per registry district
// ═══════════════════════════════════════════════════════════════════════
//
//  Used ONLY to answer "which district is nearest to the visitor?" in the
//  "Your district" strip. Values are the coordinates of the district
//  headquarters town (not the polygon centroid), rounded to ~2–3 decimals
//  (a few hundred metres). That is plenty for nearest-district ranking and
//  deliberately NOT precise enough to be mistaken for survey data.
//
//  Keys are "<stateSlug>/<districtSlug>" because a few slugs repeat across
//  states (e.g. "puducherry/puducherry", "chandigarh/chandigarh").
//
//  Rule when adding: only copy a value you can verify from an authoritative
//  source (Census town directory, Survey of India, the district website).
//  If unsure, leave it out — the strip falls back to the state level and
//  the missing key shows up in `listMissingCentroids()`.
//

import type { DistrictCandidate } from "./locate";

export interface Centroid {
  lat: number;
  lng: number;
}

export const DISTRICT_CENTROIDS: Record<string, Centroid> = {
  // ── The 10 live districts ─────────────────────────────────────────────
  "karnataka/mandya":            { lat: 12.524, lng: 76.897 },
  "karnataka/bengaluru-urban":   { lat: 12.972, lng: 77.595 },
  "karnataka/mysuru":            { lat: 12.296, lng: 76.639 },
  "delhi/new-delhi":             { lat: 28.614, lng: 77.209 },
  "maharashtra/mumbai":          { lat: 19.076, lng: 72.878 },
  "maharashtra/pune":            { lat: 18.520, lng: 73.857 },
  "tamil-nadu/chennai":          { lat: 13.083, lng: 80.271 },
  "west-bengal/kolkata":         { lat: 22.573, lng: 88.364 },
  "uttar-pradesh/lucknow":       { lat: 26.847, lng: 80.946 },
  "telangana/hyderabad":         { lat: 17.385, lng: 78.487 },

  // ── Karnataka (HQ towns) ──────────────────────────────────────────────
  "karnataka/bengaluru-rural":   { lat: 13.292, lng: 77.538 }, // Doddaballapura
  "karnataka/tumakuru":          { lat: 13.339, lng: 77.114 },
  "karnataka/kolar":             { lat: 13.136, lng: 78.130 },
  "karnataka/ramanagara":        { lat: 12.721, lng: 77.280 },
  "karnataka/chikkaballapur":    { lat: 13.436, lng: 77.732 },
  "karnataka/hassan":            { lat: 13.007, lng: 76.100 },
  "karnataka/chikkamagaluru":    { lat: 13.316, lng: 75.772 },
  "karnataka/kodagu":            { lat: 12.424, lng: 75.738 }, // Madikeri
  "karnataka/shivamogga":        { lat: 13.930, lng: 75.568 },
  "karnataka/davanagere":        { lat: 14.464, lng: 75.922 },
  "karnataka/chitradurga":       { lat: 14.223, lng: 76.401 },
  "karnataka/ballari":           { lat: 15.139, lng: 76.921 },
  "karnataka/vijayanagara":      { lat: 15.269, lng: 76.391 }, // Hosapete
  "karnataka/raichur":           { lat: 16.212, lng: 77.344 },
  "karnataka/koppal":            { lat: 15.355, lng: 76.157 },
  "karnataka/gadag":             { lat: 15.432, lng: 75.636 },
  "karnataka/dharwad":           { lat: 15.459, lng: 75.008 },
  "karnataka/haveri":            { lat: 14.794, lng: 75.405 },
  "karnataka/belagavi":          { lat: 15.850, lng: 74.498 },
  "karnataka/vijayapura":        { lat: 16.830, lng: 75.710 },
  "karnataka/bagalkot":          { lat: 16.182, lng: 75.696 },
  "karnataka/bidar":             { lat: 17.910, lng: 77.520 },
  "karnataka/kalaburagi":        { lat: 17.330, lng: 76.834 },
  "karnataka/yadgir":            { lat: 16.770, lng: 77.138 },
  "karnataka/dakshina-kannada":  { lat: 12.914, lng: 74.856 }, // Mangaluru
  "karnataka/udupi":             { lat: 13.341, lng: 74.742 },
  "karnataka/uttara-kannada":    { lat: 14.814, lng: 74.129 }, // Karwar
  "karnataka/chamarajanagar":    { lat: 11.924, lng: 76.940 },

  // ── Andhra Pradesh ────────────────────────────────────────────────────
  "andhra-pradesh/visakhapatnam": { lat: 17.687, lng: 83.219 },
  "andhra-pradesh/vijayawada":   { lat: 16.506, lng: 80.648 },
  "andhra-pradesh/tirupati":     { lat: 13.629, lng: 79.419 },
  "andhra-pradesh/guntur":       { lat: 16.307, lng: 80.437 },
  "andhra-pradesh/kurnool":      { lat: 15.828, lng: 78.037 },

  // ── Telangana ─────────────────────────────────────────────────────────
  "telangana/warangal":          { lat: 17.969, lng: 79.594 },
  "telangana/nizamabad":         { lat: 18.673, lng: 78.094 },
  "telangana/karimnagar":        { lat: 18.439, lng: 79.129 },
  "telangana/khammam":           { lat: 17.247, lng: 80.151 },

  // ── Tamil Nadu ────────────────────────────────────────────────────────
  "tamil-nadu/coimbatore":       { lat: 11.017, lng: 76.956 },
  "tamil-nadu/madurai":          { lat: 9.925, lng: 78.120 },
  "tamil-nadu/tiruchirappalli":  { lat: 10.791, lng: 78.705 },
  "tamil-nadu/salem":            { lat: 11.664, lng: 78.146 },

  // ── Kerala ────────────────────────────────────────────────────────────
  "kerala/thiruvananthapuram":   { lat: 8.524, lng: 76.937 },
  "kerala/kochi":                { lat: 9.931, lng: 76.267 },
  "kerala/kozhikode":            { lat: 11.259, lng: 75.780 },
  "kerala/thrissur":             { lat: 10.528, lng: 76.214 },
  "kerala/malappuram":           { lat: 11.051, lng: 76.071 },

  // ── Maharashtra ───────────────────────────────────────────────────────
  "maharashtra/nagpur":          { lat: 21.146, lng: 79.088 },
  "maharashtra/nashik":          { lat: 19.998, lng: 73.790 },
  "maharashtra/chhatrapati-sambhajinagar": { lat: 19.876, lng: 75.343 },

  // ── Gujarat ───────────────────────────────────────────────────────────
  "gujarat/ahmedabad":           { lat: 23.023, lng: 72.571 },
  "gujarat/surat":               { lat: 21.170, lng: 72.831 },
  "gujarat/vadodara":            { lat: 22.307, lng: 73.181 },
  "gujarat/rajkot":              { lat: 22.304, lng: 70.802 },
  "gujarat/gandhinagar":         { lat: 23.216, lng: 72.637 },

  // ── Rajasthan ─────────────────────────────────────────────────────────
  "rajasthan/jaipur":            { lat: 26.912, lng: 75.787 },
  "rajasthan/jodhpur":           { lat: 26.239, lng: 73.024 },
  "rajasthan/udaipur":           { lat: 24.585, lng: 73.713 },
  "rajasthan/kota":              { lat: 25.214, lng: 75.865 },
  "rajasthan/ajmer":             { lat: 26.450, lng: 74.640 },

  // ── Madhya Pradesh ────────────────────────────────────────────────────
  "madhya-pradesh/bhopal":       { lat: 23.260, lng: 77.413 },
  "madhya-pradesh/indore":       { lat: 22.720, lng: 75.858 },
  "madhya-pradesh/jabalpur":     { lat: 23.182, lng: 79.986 },
  "madhya-pradesh/gwalior":      { lat: 26.218, lng: 78.183 },
  "madhya-pradesh/ujjain":       { lat: 23.177, lng: 75.789 },

  // ── Uttar Pradesh ─────────────────────────────────────────────────────
  "uttar-pradesh/kanpur":        { lat: 26.450, lng: 80.332 },
  "uttar-pradesh/agra":          { lat: 27.177, lng: 78.008 },
  "uttar-pradesh/varanasi":      { lat: 25.318, lng: 82.974 },
  "uttar-pradesh/meerut":        { lat: 28.985, lng: 77.706 },

  // ── Bihar ─────────────────────────────────────────────────────────────
  "bihar/patna":                 { lat: 25.594, lng: 85.138 },
  "bihar/gaya":                  { lat: 24.796, lng: 85.000 },
  "bihar/bhagalpur":             { lat: 25.243, lng: 86.984 },
  "bihar/muzaffarpur":           { lat: 26.121, lng: 85.365 },
  "bihar/darbhanga":             { lat: 26.154, lng: 85.892 },

  // ── West Bengal ───────────────────────────────────────────────────────
  "west-bengal/howrah":          { lat: 22.596, lng: 88.264 },
  "west-bengal/darjeeling":      { lat: 27.041, lng: 88.266 },
  "west-bengal/murshidabad":     { lat: 24.104, lng: 88.252 }, // Baharampur
  "west-bengal/bardhaman":       { lat: 23.232, lng: 87.862 },

  // ── Odisha ────────────────────────────────────────────────────────────
  "odisha/bhubaneswar":          { lat: 20.296, lng: 85.825 },
  "odisha/cuttack":              { lat: 20.463, lng: 85.883 },
  "odisha/puri":                 { lat: 19.814, lng: 85.831 },
  "odisha/sambalpur":            { lat: 21.467, lng: 83.981 },

  // ── Punjab ────────────────────────────────────────────────────────────
  "punjab/ludhiana":             { lat: 30.901, lng: 75.857 },
  "punjab/amritsar":             { lat: 31.634, lng: 74.872 },
  "punjab/jalandhar":            { lat: 31.326, lng: 75.576 },
  "punjab/patiala":              { lat: 30.340, lng: 76.387 },

  // ── Haryana ───────────────────────────────────────────────────────────
  "haryana/gurugram":            { lat: 28.460, lng: 77.027 },
  "haryana/faridabad":           { lat: 28.409, lng: 77.318 },
  "haryana/ambala":              { lat: 30.378, lng: 76.777 },
  "haryana/rohtak":              { lat: 28.896, lng: 76.607 },

  // ── Himachal Pradesh ──────────────────────────────────────────────────
  "himachal-pradesh/shimla":     { lat: 31.105, lng: 77.173 },
  "himachal-pradesh/kangra":     { lat: 32.219, lng: 76.323 }, // Dharamshala
  "himachal-pradesh/mandi":      { lat: 31.708, lng: 76.932 },

  // ── Uttarakhand ───────────────────────────────────────────────────────
  "uttarakhand/dehradun":        { lat: 30.317, lng: 78.032 },
  "uttarakhand/haridwar":        { lat: 29.946, lng: 78.164 },
  "uttarakhand/nainital":        { lat: 29.380, lng: 79.464 },

  // ── Jharkhand ─────────────────────────────────────────────────────────
  "jharkhand/ranchi":            { lat: 23.344, lng: 85.310 },
  "jharkhand/dhanbad":           { lat: 23.796, lng: 86.430 },
  "jharkhand/jamshedpur":        { lat: 22.805, lng: 86.203 },

  // ── Chhattisgarh ──────────────────────────────────────────────────────
  "chhattisgarh/raipur":         { lat: 21.251, lng: 81.630 },
  "chhattisgarh/bilaspur":       { lat: 22.080, lng: 82.141 },
  "chhattisgarh/durg":           { lat: 21.190, lng: 81.285 },

  // ── Assam ─────────────────────────────────────────────────────────────
  "assam/guwahati":              { lat: 26.145, lng: 91.736 },
  "assam/dibrugarh":             { lat: 27.473, lng: 94.912 },
  "assam/jorhat":                { lat: 26.751, lng: 94.204 },

  // ── Goa ───────────────────────────────────────────────────────────────
  "goa/north-goa":               { lat: 15.491, lng: 73.828 }, // Panaji
  "goa/south-goa":               { lat: 15.283, lng: 73.986 }, // Margao

  // ── North-east ────────────────────────────────────────────────────────
  "arunachal-pradesh/itanagar":  { lat: 27.084, lng: 93.605 },
  "arunachal-pradesh/tawang":    { lat: 27.586, lng: 91.859 },
  "manipur/imphal-west":         { lat: 24.817, lng: 93.937 },
  "meghalaya/east-khasi-hills":  { lat: 25.579, lng: 91.893 }, // Shillong
  "mizoram/aizawl":              { lat: 23.727, lng: 92.718 },
  "mizoram/lunglei":             { lat: 22.888, lng: 92.733 },
  "nagaland/kohima":             { lat: 25.675, lng: 94.109 },
  "nagaland/dimapur":            { lat: 25.904, lng: 93.727 },
  "sikkim/gangtok":              { lat: 27.339, lng: 88.607 },
  "tripura/west-tripura":        { lat: 23.832, lng: 91.287 }, // Agartala

  // ── Union territories ─────────────────────────────────────────────────
  "jammu-kashmir/srinagar":      { lat: 34.084, lng: 74.797 },
  "jammu-kashmir/jammu":         { lat: 32.727, lng: 74.857 },
  "ladakh/leh":                  { lat: 34.153, lng: 77.577 },
  "ladakh/kargil":               { lat: 34.554, lng: 76.135 },
  "puducherry/puducherry":       { lat: 11.942, lng: 79.808 },
  "puducherry/karaikal":         { lat: 10.925, lng: 79.838 },
  "chandigarh/chandigarh":       { lat: 30.733, lng: 76.779 },
  "andaman-nicobar/south-andaman": { lat: 11.623, lng: 92.727 }, // Port Blair
  "lakshadweep/lakshadweep":     { lat: 10.559, lng: 72.636 }, // Kavaratti
  "dadra-nagar-haveli/daman":    { lat: 20.397, lng: 72.833 },
  "dadra-nagar-haveli/dadra":    { lat: 20.274, lng: 73.014 }, // Silvassa
};

/*
 * TODO — registry districts still WITHOUT a centroid (state-level fallback
 * applies; the nearest live district is still computed from the visitor's
 * own position, so the strip keeps working):
 *
 *   delhi/central-delhi, delhi/north-delhi, delhi/north-west-delhi,
 *   delhi/north-east-delhi, delhi/east-delhi, delhi/south-delhi,
 *   delhi/south-west-delhi, delhi/south-east-delhi, delhi/west-delhi,
 *   delhi/shahdara            — all within ~15 km of new-delhi; add from the
 *                               Delhi revenue-district HQ list when needed.
 *   manipur/imphal-east, meghalaya/ri-bhoi, sikkim/gyalshing,
 *   tripura/gomati, andaman-nicobar/north-middle-andaman
 *                             — HQ towns not verified; add from Census 2011.
 *   maharashtra/pune taluks   — taluks are not districts; not needed here.
 *
 * `listMissingCentroids(INDIA_STATES)` prints the live list at runtime.
 */

/** Minimal shape of the registry we read (see src/lib/constants/districts.ts). */
export interface RegistryState {
  slug: string;
  name: string;
  districts: { slug: string; name: string; active: boolean }[];
}

/** Lookup by state + district slug. */
export function getDistrictCentroid(stateSlug: string, districtSlug: string): Centroid | null {
  return DISTRICT_CENTROIDS[`${stateSlug}/${districtSlug}`] ?? null;
}

/**
 * buildCandidates(states) — every registry district that has a centroid,
 * in the shape `nearestDistrict()` expects. Districts without a centroid
 * are skipped (never guessed).
 */
export function buildCandidates(states: RegistryState[]): DistrictCandidate[] {
  const out: DistrictCandidate[] = [];
  for (const s of states) {
    for (const d of s.districts) {
      const c = getDistrictCentroid(s.slug, d.slug);
      if (!c) continue;
      out.push({ slug: d.slug, stateSlug: s.slug, name: d.name, lat: c.lat, lng: c.lng, active: d.active });
    }
  }
  return out;
}

/** "<state>/<district>" keys present in the registry but missing here. */
export function listMissingCentroids(states: RegistryState[]): string[] {
  const missing: string[] = [];
  for (const s of states) {
    for (const d of s.districts) {
      if (!getDistrictCentroid(s.slug, d.slug)) missing.push(`${s.slug}/${d.slug}`);
    }
  }
  return missing;
}
