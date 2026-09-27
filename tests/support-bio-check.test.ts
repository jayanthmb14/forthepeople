/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The support-page bio guard (src/components/support/bio-check.ts).
 */
import { describe, expect, it } from "vitest";
import { bioIssues } from "@/components/support/bio-check";

const facts = { activeDistricts: 10, activeStates: 7, modulesPerDistrict: 36, totalIndiaDistricts: 780 };

describe("bioIssues", () => {
  it("flags the April 2026 bio", () => {
    const bio =
      "running Pinnakle Media (PKJMB Media PVT Limited), I built it. Today — **9 districts across 7 states**, 29 live dashboards each. The goal: all 780 districts in India. Not for profit.";
    const issues = bioIssues(bio, facts);
    expect(issues.some((s) => s.includes("Pinnakle"))).toBe(true);
    expect(issues.some((s) => s.includes("not for profit"))).toBe(true);
    expect(issues.some((s) => s.includes("9 districts"))).toBe(true);
    expect(issues.some((s) => s.includes("29 dashboards"))).toBe(true);
    expect(issues.some((s) => s.includes("7 states"))).toBe(false);
  });
  it("passes a bio with today's counts and the all-India goal", () => {
    expect(bioIssues("Today 10 districts across 7 states, 36 dashboards each. The goal: all 780 districts.", facts)).toEqual([]);
  });
});
