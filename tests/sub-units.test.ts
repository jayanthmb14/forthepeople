/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { getDistrict } from "@/lib/constants/districts";

// Sept 2026 audit: the metro "taluk" lists were invented zones; counts
// must be the official ones or not shown at all.
describe("sub-district counts and lists", () => {
  it("gives the official counts where checked", () => {
    expect(getDistrict("karnataka", "mysuru")?.talukCount).toBe(9); // incl. Saligrama, Sargur
    expect(getDistrict("uttar-pradesh", "lucknow")?.talukCount).toBe(5);
    expect(getDistrict("delhi", "new-delhi")?.talukCount).toBe(3);
  });

  it("marks the invented lists and gives no count where none is checked", () => {
    for (const [state, slug] of [["tamil-nadu", "chennai"], ["west-bengal", "kolkata"], ["maharashtra", "mumbai"]] as const) {
      const d = getDistrict(state, slug)!;
      expect(d.subUnitsUnchecked).toBe(true);
      expect(d.talukCount).toBeUndefined();
    }
    expect(getDistrict("uttar-pradesh", "lucknow")?.subUnitsUnchecked).toBe(true);
    expect(getDistrict("delhi", "new-delhi")?.subUnitsUnchecked).toBe(true);
    expect(getDistrict("karnataka", "mandya")?.subUnitsUnchecked).toBeUndefined();
  });
});
