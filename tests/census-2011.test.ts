/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { censusOnlyProfile, pickCensus2011, reconcileCensusProfile } from "@/lib/census-2011";

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
