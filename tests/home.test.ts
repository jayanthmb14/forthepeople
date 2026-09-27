/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Home page (v5.1) — the pure rules behind the ticker, the map card, the
 * support band and the number formats (src/components/home/home-picks.ts,
 * home-format.ts). No database, no React.
 */
import { describe, expect, it } from "vitest";
import { buildMapStat, pickCropTicks, pickSupporters, type CropRow, type PublicSupporter } from "@/components/home/home-picks";
import { agoShort, dayWords, money, pct, perKg, shortDay } from "@/components/home/home-format";

// 27 Sep 2026, 17:30 IST
const NOW = Date.parse("2026-09-27T12:00:00Z");
// Mandi dates are stored as IST midnight (18:30 UTC the day before).
const JUN22 = new Date("2026-06-21T18:30:00Z");
const SEP26 = new Date("2026-09-25T18:30:00Z");

const districts = [
  { id: "d-mandya", slug: "mandya", stateSlug: "karnataka" },
  { id: "d-pune", slug: "pune", stateSlug: "maharashtra" },
  { id: "d-lucknow", slug: "lucknow", stateSlug: "uttar-pradesh" },
];
const row = (districtId: string, commodity: string, modalPrice: number, date: Date, market = "Some APMC"): CropRow => ({ districtId, commodity, market, modalPrice, date });

describe("pickCropTicks", () => {
  it("takes one staple per district, different crops first, newest mandi day first", () => {
    const rows = [
      row("d-mandya", "Paddy(Common)", 1900, JUN22, "Srirangapattana APMC"),
      row("d-pune", "Tomato", 1750, SEP26, "Pune APMC"),
      row("d-pune", "Onion", 1350, SEP26),
      row("d-lucknow", "Tomato", 1200, JUN22),
      row("d-lucknow", "Wheat", 2450, JUN22),
    ];
    const ticks = pickCropTicks(districts, rows, NOW);
    expect(ticks.map((t) => `${t.districtSlug}:${t.cropKey}`)).toEqual(["pune:tomato", "mandya:paddy", "lucknow:wheat"]);
    const pune = ticks[0];
    expect(pune.day).toBe("2026-09-26");
    expect(pune.ageDays).toBe(1);
    expect(pune.old).toBe(false);
    const mandya = ticks.find((t) => t.districtSlug === "mandya")!;
    expect(mandya.day).toBe("2026-06-22");
    expect(mandya.ageDays).toBe(97);
    expect(mandya.old).toBe(true);
    expect(mandya.market).toBe("Srirangapattana APMC");
  });

  it("never shows a zero price or a non-staple, and never invents a tick", () => {
    const rows = [row("d-mandya", "Tomato", 0, SEP26), row("d-mandya", "Arecanut", 45000, SEP26)];
    expect(pickCropTicks(districts, rows, NOW)).toEqual([]);
  });

  it("ignores rows from districts that are not live", () => {
    expect(pickCropTicks(districts, [row("d-other", "Tomato", 1000, SEP26)], NOW)).toEqual([]);
  });

  it("fills up to five from more districts, even with one crop, and stops there", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, slug: `s${i}`, stateSlug: "x" }));
    const rows = many.map((d) => row(d.id, "Onion", 1000, SEP26));
    expect(pickCropTicks(many, rows, NOW)).toHaveLength(5);
  });
});

describe("buildMapStat", () => {
  const base = { profile: null, census: null, districtPopulation: null, projects: null, score: null, newest: null };

  it("population: census profile, then the Census row, then the district row as an estimate", () => {
    expect(buildMapStat({ ...base, profile: { totalPopulation: 1805769, dataset: "Census 2011" }, census: { year: 2011, population: 1 }, districtPopulation: 2 }, NOW).population).toEqual({
      value: 1805769,
      dataset: "Census 2011",
      estimate: false,
    });
    expect(buildMapStat({ ...base, census: { year: 2011, population: 1805769 }, districtPopulation: 1940428 }, NOW).population).toEqual({
      value: 1805769,
      dataset: "Census 2011",
      estimate: false,
    });
    expect(buildMapStat({ ...base, districtPopulation: 1940428 }, NOW).population).toEqual({ value: 1940428, dataset: null, estimate: true });
    expect(buildMapStat(base, NOW).population).toBeNull();
  });

  it("being built = the building stage only, renamings left out; null when there are no projects", () => {
    const projects = [
      { status: "In Progress", name: "Ring road" },
      { status: "UNDER_CONSTRUCTION", name: "Bus stand" },
      { status: "PROPOSED", name: "Metro" },
      { status: "COMPLETED", name: "Flyover" },
      { status: "Ongoing", name: "Station renamed to X" },
    ];
    expect(buildMapStat({ ...base, projects }, NOW).building).toBe(2);
    expect(buildMapStat({ ...base, projects: [] }, NOW).building).toBeNull();
    expect(buildMapStat({ ...base, projects: [{ status: "PROPOSED", name: "Metro" }] }, NOW).building).toBe(0);
  });

  it("the grade keeps its date and says when it has expired", () => {
    const old = buildMapStat({ ...base, score: { grade: "C+", generatedAt: new Date("2026-04-10T00:00:00Z"), expiresAt: new Date("2026-04-17T00:00:00Z") } }, NOW);
    expect(old.grade).toEqual({ grade: "C+", date: "2026-04-10T00:00:00.000Z", expired: true });
    const fresh = buildMapStat({ ...base, score: { grade: "B", generatedAt: new Date("2026-09-27T00:00:00Z"), expiresAt: new Date("2026-10-04T00:00:00Z") } }, NOW);
    expect(fresh.grade?.expired).toBe(false);
  });
});

describe("pickSupporters", () => {
  const s = (id: string, name: string, tier: string, isRecurring = false): PublicSupporter => ({ id, name, tier, isRecurring, districtSlug: null, stateSlug: null, stateName: null });

  it("Founding Builder first, then monthly, then one-time; anonymous and repeats left out", () => {
    const picked = pickSupporters({
      subscribers: [s("m1", "Asha", "district", true), s("m2", "Anonymous", "state", true)],
      oneTime: [s("f1", "Ravi", "founder"), s("o1", "Meera", "custom"), s("m1", "Asha", "district", true), s("o2", "  ", "chai")],
    });
    expect(picked.map((p) => p.id)).toEqual(["f1", "m1", "o1"]);
  });

  it("respects the limit", () => {
    const oneTime = Array.from({ length: 10 }, (_, i) => s(`o${i}`, `Name ${i}`, "custom"));
    expect(pickSupporters({ oneTime }, 6)).toHaveLength(6);
    expect(pickSupporters({})).toEqual([]);
  });
});

describe("home formats", () => {
  it("money and percentages use Indian grouping", () => {
    expect(money(232350, "INR", 0)).toBe("₹2,32,350");
    expect(money(95.8, "INR", 2)).toBe("₹95.80");
    expect(money(97.44, "USD", 2)).toBe("$97.44");
    expect(money(73896, null, 0)).toBe("73,896");
    expect(pct(-0.3712)).toBe("0.37%");
    expect(perKg(1750)).toBe("17.5");
    expect(perKg(1800)).toBe("18");
  });

  it("dates read as words in the page language", () => {
    expect(shortDay("2026-06-22", "en")).toMatch(/22 Jun/);
    expect(dayWords("2026-09-27", 0, "en")).toBe("today");
    expect(dayWords("2026-09-26", 1, "en")).toBe("yesterday");
    expect(dayWords("2026-09-25", 2, "en")).toMatch(/25 Sep/);
    expect(agoShort(new Date(NOW - 6 * 3600_000), NOW, "en")).toMatch(/6 hr\.? ago/);
    expect(agoShort(new Date(NOW - 3 * 86400_000), NOW, "en")).toMatch(/3 days ago/);
  });
});
