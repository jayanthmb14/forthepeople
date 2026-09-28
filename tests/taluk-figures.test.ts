/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { SHOW_TALUK_FIGURES, taluksForDisplay } from "@/lib/data-filters";

const taluk = (name: string, population: number | null, area: number | null) => ({ name, slug: name.toLowerCase(), population, area });

// Chennai (Sept 2026 audit): 7 seeded zones sum to 11,734,732 people and
// 852 km²; the Census 2011 row says 4,646,732 people, 26,553 per km² (175 km²).
const chennaiZones = [
  taluk("Zone A", 1_900_000, 120), taluk("Zone B", 1_700_000, 110), taluk("Zone C", 1_600_000, 130),
  taluk("Zone D", 1_800_000, 125), taluk("Zone E", 1_634_732, 122), taluk("Zone F", 1_500_000, 120), taluk("Zone G", 1_600_000, 125),
];
const chennaiCensus = { population: 4_646_732, density: 26_553 };

describe("taluksForDisplay (seeded taluk people and areas are hidden)", () => {
  it("sends no taluk population or area while SHOW_TALUK_FIGURES is off", () => {
    expect(SHOW_TALUK_FIGURES).toBe(false);
    const out = taluksForDisplay([taluk("Mandya", 480_000, 714), taluk("Maddur", 320_000, 695)]);
    expect(out.map((t) => [t.name, t.population, t.area])).toEqual([["Mandya", null, null], ["Maddur", null, null]]);
  });

  it("with the flag on, hides figures whose sum overshoots the district's Census row", () => {
    const out = taluksForDisplay(chennaiZones, { show: true, census: chennaiCensus });
    expect(out.every((t) => t.population === null && t.area === null)).toBe(true);
  });

  it("with the flag on, keeps figures that add up to the Census row", () => {
    const rows = [taluk("North", 2_000_000, 80), taluk("South", 2_646_732, 95)];
    expect(taluksForDisplay(rows, { show: true, census: chennaiCensus })).toEqual(rows);
  });

  it("keeps every other field", () => {
    const [t] = taluksForDisplay([{ ...taluk("Pandavapura", 1, 2), villages: [{ name: "X" }], _count: { villages: 1 } }]);
    expect(t).toMatchObject({ name: "Pandavapura", slug: "pandavapura", villages: [{ name: "X" }], _count: { villages: 1 } });
  });
});
