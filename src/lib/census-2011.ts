/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Census 2011: one set of core numbers for every page (pure helpers, no DB).
//
// The Sept 2026 audit found the hand-seeded DemographicProfile "Census 2011"
// rows disagreeing with the district's PopulationHistory Census 2011 row —
// Mandya's profile said sex ratio 985 / literacy 70.14 / urban 16.08 /
// density 365 (provisional or mistyped), the Census says 995 / 70.40 /
// 17.08 / 364; New Delhi's profile had area 22 km² (density 6,454) against
// the Census's 35 km² (4,057). PopulationHistory is the table that was
// checked row by row against the Census figures (scripts/fix-records-2026-09/
// population.ts), so it wins: the profile's core numbers are replaced by it,
// and a district with no profile row at all (Pune) still gets its Census
// tiles instead of "not available".

/** A PopulationHistory row counts as a Census figure only when its source says so. */
export const CENSUS_SOURCE = /^census of india/i;

/** The PopulationHistory fields we use. */
export interface CensusHistoryRow {
  year: number;
  population: number;
  sexRatio: number | null;
  literacy: number | null;
  urbanPct: number | null;
  density: number | null;
  source: string | null;
}

/** The district's Census 2011 row from PopulationHistory, or null. */
export function pickCensus2011<T extends CensusHistoryRow>(rows: T[]): T | null {
  return rows.find((r) => r.year === 2011 && CENSUS_SOURCE.test(r.source ?? "") && r.population > 0) ?? null;
}

/** The DemographicProfile fields this module reads or replaces. */
export interface CensusProfileLike {
  dataset: string;
  totalPopulation: number | null;
  sexRatio: number | null;
  literacyTotal: number | null;
  urbanPct: number | null;
  density: number | null;
  areaSqKm: number | null;
}

/** Density implied by population ÷ area differs from the stated density by more than this → the area is not shown. */
const AREA_TOLERANCE = 0.05;

/**
 * A "Census 2011" profile with its core numbers taken from the checked
 * Census row: population, sex ratio, literacy, urban share and density. A
 * figure the Census row leaves empty (hidden as unverifiable) is empty here
 * too. The area is kept only while it agrees with population ÷ density.
 * Any other dataset (NFHS-5, NITI MPI …) is returned unchanged.
 */
export function reconcileCensusProfile<P extends CensusProfileLike>(profile: P, census: CensusHistoryRow | null): P {
  if (!census || profile.dataset !== "Census 2011") return profile;
  const out: P = {
    ...profile,
    totalPopulation: census.population,
    sexRatio: census.sexRatio,
    literacyTotal: census.literacy,
    urbanPct: census.urbanPct,
    density: census.density,
  };
  if (out.areaSqKm && out.density && out.totalPopulation) {
    const implied = out.totalPopulation / out.areaSqKm;
    if (Math.abs(implied - out.density) / out.density > AREA_TOLERANCE) out.areaSqKm = null;
  }
  return out;
}

/**
 * A minimal "Census 2011" profile built from the Census row alone, for a
 * district that has no DemographicProfile row (every other field empty,
 * so the page draws only what the Census row holds).
 */
export function censusOnlyProfile(districtId: string, census: CensusHistoryRow) {
  return {
    id: `census-2011-${districtId}`,
    districtId,
    stateId: null,
    level: "DISTRICT",
    year: 2011,
    dataset: "Census 2011",
    totalPopulation: census.population,
    malePopulation: null,
    femalePopulation: null,
    sexRatio: census.sexRatio,
    childSexRatio: null,
    pop_0_6: null,
    pop_7_14: null,
    pop_15_59: null,
    pop_60_plus: null,
    medianAge: null,
    literacyTotal: census.literacy,
    literacyMale: null,
    literacyFemale: null,
    urbanPopulation: null,
    ruralPopulation: null,
    urbanPct: census.urbanPct,
    density: census.density,
    areaSqKm: null,
    households: null,
    avgHouseholdSize: null,
    religion: null,
    caste: null,
    employment: null,
    economicClass: null as unknown, // the route may add the NITI MPI figures
    education: null,
    migration: null,
    disability: null,
    language: null,
    householdAmenities: null,
    maritalStatus: null,
    sourceName: "Census of India 2011",
    sourceUrl: "https://censusindia.gov.in",
    sourceLicense: null,
    retrievedAt: null,
    publishedAt: null,
    notes: "Core Census 2011 figures from the district's population history (no full Census profile on file).",
    boundaryVintage: "Census_2011",
    createdAt: null,
    updatedAt: null,
  };
}
