/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { censusOnlyProfile, pickCensus2011, reconcileCensusProfile, withCensusFigures } from "@/lib/census-2011";
import { getDistrict } from "@/lib/constants/districts";

// Mandya's checked PopulationHistory row (census2011.co.in, Census 2011 PCA).
const MANDYA_2011 = { year: 2011, population: 1805769, sexRatio: 995, literacy: 70.4, urbanPct: 17.08, density: 364, source: "Census of India" };

describe("pickCensus2011", () => {
  it("takes the 2011 row whose source is the Census", () => {
    const rows = [
      { ...MANDYA_2011, year: 2001, population: 1763705 },
      MANDYA_2011,
      { ...MANDYA_2011, year: 2011, source: "Estimate (projection)" },
    ];
    expect(pickCensus2011(rows)).toBe(MANDYA_2011);
  });

  it("ignores projections and other years", () => {
    expect(pickCensus2011([{ ...MANDYA_2011, source: "Census of India (Projected)", year: 2021 }])).toBeNull();
    expect(pickCensus2011([{ ...MANDYA_2011, source: "State estimate" }])).toBeNull();
  });
});

describe("reconcileCensusProfile", () => {
  // The hand-seeded profile row the audit found (sex ratio 985 etc.).
  const seeded = { dataset: "Census 2011", totalPopulation: 1805769, sexRatio: 985, literacyTotal: 70.14, urbanPct: 16.08, density: 365, areaSqKm: 4961 };

  it("replaces the core numbers with the checked Census row", () => {
    const out = reconcileCensusProfile(seeded, MANDYA_2011);
    expect(out).toMatchObject({ sexRatio: 995, literacyTotal: 70.4, urbanPct: 17.08, density: 364, areaSqKm: 4961 });
  });

  it("hides a figure the Census row leaves empty", () => {
    const out = reconcileCensusProfile(seeded, { ...MANDYA_2011, literacy: null });
    expect(out.literacyTotal).toBeNull();
  });

  it("drops an area that does not agree with population ÷ density (New Delhi 22 km²)", () => {
    const nd = { dataset: "Census 2011", totalPopulation: 142004, sexRatio: 822, literacyTotal: 88.34, urbanPct: 100, density: 6454, areaSqKm: 22 };
    const out = reconcileCensusProfile(nd, { year: 2011, population: 142004, sexRatio: 822, literacy: 88.34, urbanPct: 100, density: 4057, source: "Census of India" });
    expect(out.density).toBe(4057);
    expect(out.areaSqKm).toBeNull();
    const fixed = reconcileCensusProfile({ ...nd, areaSqKm: 35 }, { year: 2011, population: 142004, sexRatio: 822, literacy: 88.34, urbanPct: 100, density: 4057, source: "Census of India" });
    expect(fixed.areaSqKm).toBe(35);
  });

  it("leaves other datasets and a missing Census row alone", () => {
    const nfhs = { ...seeded, dataset: "NFHS-5" };
    expect(reconcileCensusProfile(nfhs, MANDYA_2011)).toBe(nfhs);
    expect(reconcileCensusProfile(seeded, null)).toBe(seeded);
  });
});

describe("censusOnlyProfile", () => {
  it("builds the Census tiles for a district with no profile row (Pune)", () => {
    const p = censusOnlyProfile("pune-id", { year: 2011, population: 9429408, sexRatio: 915, literacy: 86.15, urbanPct: 60.99, density: 603, source: "Census of India 2011" });
    expect(p).toMatchObject({ dataset: "Census 2011", year: 2011, totalPopulation: 9429408, sexRatio: 915, literacyTotal: 86.15, urbanPct: 60.99 });
    expect(p.religion).toBeNull();
    expect(p.areaSqKm).toBeNull();
  });
});

describe("withCensusFigures (overview / compare / report card)", () => {
  it("replaces the hand-typed District figures (Mandya 19,40,428 / 72.8 / 982)", () => {
    const row = { id: "x", population: 1940428, literacy: 72.8, sexRatio: 982, density: 391.2, area: 4961 };
    expect(withCensusFigures(row, MANDYA_2011)).toMatchObject({ population: 1805769, literacy: 70.4, sexRatio: 995, density: 364, area: 4961 });
  });

  it("drops an area that contradicts population ÷ density (Bengaluru BBMP 741 km²)", () => {
    const row = { population: 12765000, literacy: 88.5, sexRatio: 916, density: 17230, area: 741 };
    const out = withCensusFigures(row, { year: 2011, population: 9621551, sexRatio: 916, literacy: 87.67, urbanPct: 90.94, density: 4381, source: "Census of India" });
    expect(out.population).toBe(9621551);
    expect(out.area).toBeNull();
  });

  it("returns the row unchanged without a Census row", () => {
    const row = { population: 1, literacy: null, sexRatio: null, density: null, area: null };
    expect(withCensusFigures(row, null)).toBe(row);
  });
});

describe("district constants agree with Census 2011", () => {
  // Sept 2026 audit: the constants carried projections and city figures.
  const cases: Array<[string, string, number, number]> = [
    ["karnataka", "mandya", 1805769, 4961],
    ["karnataka", "bengaluru-urban", 9621551, 2196],
    ["karnataka", "mysuru", 3001127, 6307],
    ["telangana", "hyderabad", 3943323, 217],
    ["tamil-nadu", "chennai", 4646732, 175],
    ["west-bengal", "kolkata", 4496694, 185],
    ["delhi", "new-delhi", 142004, 35],
  ];
  it.each(cases)("%s/%s", (state, slug, pop, area) => {
    const d = getDistrict(state, slug)!;
    expect(d.population).toBe(pop);
    expect(d.area).toBe(area);
  });
});
