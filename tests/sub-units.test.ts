/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Sub-district units a page may show (shownSubUnits, src/lib/constants/districts.ts).
// Sept 2026 audit: the metro "taluk" lists were invented zones; counts
// must be the official ones or not shown at all.
import { describe, expect, it } from "vitest";
import { SUB_UNIT_CHECKS, getDistrict, shownSubUnits } from "@/lib/constants/districts";

const shown = (state: string, district: string) => shownSubUnits(state, getDistrict(state, district)!);

describe("shownSubUnits (Sept 2026 audit)", () => {
  it("hides invented units: no count, no chips, no switcher", () => {
    for (const [state, district] of [["tamil-nadu", "chennai"], ["maharashtra", "mumbai"], ["west-bengal", "kolkata"], ["delhi", "new-delhi"]]) {
      const s = shown(state, district);
      expect(s.count).toBeNull();
      expect(s.taluks).toEqual([]);
      expect(s.missing).toEqual([]);
    }
  });

  it("uses the portal's count and names the units that have no page yet", () => {
    const mysuru = shown("karnataka", "mysuru");
    expect(mysuru.count).toBe(9);
    expect(mysuru.taluks.length + mysuru.missing.length).toBe(9);
    const lucknow = shown("uttar-pradesh", "lucknow");
    expect(lucknow.count).toBe(5);
    expect(lucknow.taluks.length + lucknow.missing.length).toBe(5);
    expect(lucknow.taluks.map((t) => t.name)).toContain("Lucknow Sadar");
    const pune = shown("maharashtra", "pune");
    expect(pune.count).toBe(16);
    expect(pune.taluks.length + pune.missing.length).toBe(16);
  });

  it("leaves districts that were not flagged as they were", () => {
    const mandya = shown("karnataka", "mandya");
    expect(mandya.count).toBe(7);
    expect(mandya.taluks).toHaveLength(7);
  });

  it("every check names its source", () => {
    for (const c of Object.values(SUB_UNIT_CHECKS)) expect(c.source).toMatch(/^https:\/\//);
  });
});

// From v54/fix-people-services (finding #11), adapted at the merge with
// v54/fix-news: its `subUnitsUnchecked` flag was folded into SUB_UNIT_CHECKS.
describe("sub-district counts and lists", () => {
  it("gives the official counts where checked", () => {
    expect(getDistrict("karnataka", "mysuru")?.talukCount).toBe(9); // incl. Saligrama, Sargur
    expect(getDistrict("uttar-pradesh", "lucknow")?.talukCount).toBe(5);
    expect(getDistrict("maharashtra", "pune")?.talukCount).toBe(16);
  });

  it("gives no stored count where the listed units were invented", () => {
    for (const [state, slug] of [["tamil-nadu", "chennai"], ["west-bengal", "kolkata"], ["maharashtra", "mumbai"], ["delhi", "new-delhi"]] as const) {
      expect(getDistrict(state, slug)!.talukCount).toBeUndefined();
      expect(SUB_UNIT_CHECKS[`${state}/${slug}`]?.listShown).toBe(false);
    }
    expect(SUB_UNIT_CHECKS["karnataka/mandya"]).toBeUndefined();
  });
});

describe("badges", () => {
  it("Mysuru no longer claims to be India's cleanest city", () => {
    expect(getDistrict("karnataka", "mysuru")!.badges?.map((b) => b.label)).not.toContain("India's Cleanest City");
  });
});
