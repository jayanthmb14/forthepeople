/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * getPlatformFacts (src/lib/platform-facts.ts): the vote count is the
 * vote list itself (Sept 2026 audit: the page said "770 districts
 * waiting" while listing 142).
 */
import { describe, expect, it } from "vitest";
import { getPlatformFacts } from "@/lib/platform-facts";
import { INDIA_STATES } from "@/lib/constants/districts";

describe("platform facts", () => {
  it("comingDistricts = the not-yet-live districts the vote page lists", () => {
    const locked = INDIA_STATES.flatMap((s) => s.districts.filter((d) => !d.active));
    expect(getPlatformFacts().comingDistricts).toBe(locked.length);
  });
  it("the India total is a goal, larger than live + votable", () => {
    const f = getPlatformFacts();
    expect(f.totalIndiaDistricts).toBeGreaterThanOrEqual(f.activeDistricts + f.comingDistricts);
  });
});
