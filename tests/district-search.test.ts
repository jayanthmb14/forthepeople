/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { INDIA_STATES } from "@/lib/constants/districts";
import {
  DISTRICT_ALIASES,
  buildDistrictIndex,
  normaliseSearch,
  searchDistricts,
} from "@/components/home/district-search";

const index = buildDistrictIndex();
const first = (q: string) => {
  const r = searchDistricts(index, q);
  return [...r.live, ...r.notLive].sort((a, b) => b.score - a.score)[0];
};

describe("district search", () => {
  it("every alias points at a district that exists in the registry", () => {
    for (const key of Object.keys(DISTRICT_ALIASES)) {
      const [stateSlug, districtSlug] = key.split("/");
      const state = INDIA_STATES.find((s) => s.slug === stateSlug);
      expect(state?.districts.some((d) => d.slug === districtSlug), key).toBe(true);
    }
  });

  it.each([
    ["Bangalore", "bengaluru-urban"],
    ["bangalore", "bengaluru-urban"],
    ["Mysore", "mysuru"],
    ["Gurgaon", "gurugram"],
    ["Tumkur", "tumakuru"],
    ["Bombay", "mumbai"],
    ["Calcutta", "kolkata"],
    ["Kanpur Nagar", "kanpur"],
    ["Poona", "pune"],
  ])("finds %s by its old or everyday name", (q, slug) => {
    const m = first(q);
    expect(m?.district.slug).toBe(slug);
    expect(m?.via).toBeTruthy();
  });

  it("prefers the real name over an alias", () => {
    const m = first("Mysuru");
    expect(m?.district.slug).toBe("mysuru");
    expect(m?.via).toBeUndefined();
  });

  it("matches local scripts and Hindi names", () => {
    expect(first("ಮಂಡ್ಯ")?.district.slug).toBe("mandya");
    expect(first("मैसूर")?.district.slug).toBe("mysuru");
  });

  it("ignores spaces, hyphens and case", () => {
    expect(first("bengaluru-urban")?.district.slug).toBe("bengaluru-urban");
    expect(first("BENGALURU URBAN")?.district.slug).toBe("bengaluru-urban");
    expect(normaliseSearch("  Bengaluru-Urban. ")).toBe("bengaluru urban");
  });

  it("a state name lists that state's districts, live ones in their own list", () => {
    const r = searchDistricts(index, "Karnataka", { live: 50, notLive: 50 });
    expect(r.live.map((m) => m.district.slug)).toContain("mandya");
    expect(r.live.every((m) => m.district.active)).toBe(true);
    expect(r.notLive.every((m) => !m.district.active)).toBe(true);
    expect(r.notLive.length).toBeGreaterThan(10);
  });

  it("returns nothing for an empty query", () => {
    const r = searchDistricts(index, "   ");
    expect(r.live).toHaveLength(0);
    expect(r.notLive).toHaveLength(0);
  });

  it("adds the state's name in the page language when given", () => {
    const hi = buildDistrictIndex((slug, name) => (slug === "karnataka" ? "कर्नाटक" : name));
    const r = searchDistricts(hi, "कर्नाटक");
    expect(r.live.map((m) => m.district.slug)).toContain("mandya");
  });
});
