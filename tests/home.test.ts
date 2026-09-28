/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Home page (v5.1) — the pure rules behind the fuel prices, the map card,
 * the support band and the number formats (src/components/home/home-picks.ts,
 * home-format.ts). No database, no React.
 */
import { describe, expect, it } from "vitest";
import { buildMapStat, fuelFigures, pickSupporters, type PublicSupporter } from "@/components/home/home-picks";
import { agoShort, dayWords, money, pct, shortDay } from "@/components/home/home-format";
import { pickDistrictHead, pickHeadline, pickWeatherNow } from "@/components/home/your-district";
import type { Leader, WeatherReading } from "@/hooks/useRealtimeData";

// 27 Sep 2026, 17:30 IST
const NOW = Date.parse("2026-09-27T12:00:00Z");

describe("fuelFigures", () => {
  const snap = {
    kind: "fuel" as const,
    asOf: "2026-09-25",
    cities: [
      { city: "Delhi" as const, petrol: 102.12, diesel: 95.2, check: "double" as const },
      { city: "Mumbai" as const, petrol: 111.21, diesel: 97.83, check: "single" as const },
      { city: "Chennai" as const, petrol: 107.77, diesel: 99.55, check: "single" as const },
      { city: "Kolkata" as const, petrol: 113.51, diesel: 99.82, check: "single" as const },
    ],
    sources: { ppacHome: "https://ppac.gov.in/", ppacTable: "https://ppac.gov.in/x.pdf", bpcl: { petrol: "a", diesel: "b" } },
    bpclEffective: { petrol: "2026-08-01", diesel: "2026-08-01" },
    fetchedAt: "2026-09-27T07:00:00.000Z",
  };

  it("Delhi as the headline, the other metros beside it, PPAC's day and age", () => {
    const [petrol, diesel] = fuelFigures(snap, NOW);
    expect(petrol).toEqual({
      fuel: "petrol",
      city: "Delhi",
      value: 102.12,
      check: "double",
      others: [
        { city: "Mumbai", value: 111.21 },
        { city: "Chennai", value: 107.77 },
        { city: "Kolkata", value: 113.51 },
      ],
      day: "2026-09-25",
      ageDays: 2,
      old: false,
      sourceUrl: "https://ppac.gov.in/",
    });
    expect(diesel.value).toBe(95.2);
  });

  it("an old day is marked old; no snapshot, a broken one or no Delhi shows nothing", () => {
    const later = Date.parse("2026-10-02T06:00:00Z");
    expect(fuelFigures(snap, later)[0]).toMatchObject({ ageDays: 7, old: true });
    expect(fuelFigures(null, NOW)).toEqual([]);
    expect(fuelFigures({ ...snap, cities: [{ ...snap.cities[0], petrol: Number.NaN }] }, NOW)).toEqual([]);
    expect(fuelFigures({ ...snap, cities: snap.cities.slice(1) }, NOW)).toEqual([]);
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
    expect(money(152110, "INR", 0)).toBe("₹1,52,110");
    expect(money(102.12, "INR", 2)).toBe("₹102.12");
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

describe("Your district cards (your-district.ts)", () => {
  it("pickHeadline: the first story with a headline and a date; null when there is none", () => {
    expect(pickHeadline(null)).toBeNull();
    expect(pickHeadline([{ title: "  ", publishedAt: "2026-09-27T10:00:00Z" }])).toBeNull();
    expect(
      pickHeadline([
        { title: "No date" },
        { headline: "Dam gates opened", title: "Dam gates opened", source: "Google News", publisher: "The Hindu", publishedAt: "2026-09-27T10:00:00Z" },
      ]),
    ).toEqual({ title: "Dam gates opened", source: "The Hindu", publishedAt: "2026-09-27T10:00:00Z" });
  });

  it("pickDistrictHead: the Collector / DC / DM, never a placeholder or a police post", () => {
    const L = (name: string, role: string): Leader => ({ id: name, name, role, tier: 3 });
    expect(pickDistrictHead([L("[Verify at mandya.nic.in]", "Deputy Commissioner"), L("A B", "Deputy Commissioner of Police")])).toBeNull();
    const two = pickDistrictHead([L("X Y", "Collector, Mumbai City"), L("P Q", "Collector, Mumbai Suburban"), L("R S", "Superintendent of Police")]);
    expect(two?.leader.name).toBe("X Y");
    expect(two?.more).toBe(1);
  });

  it("pickWeatherNow: a stored reading only while it is at most 3 hours old", () => {
    const reading = (hoursAgo: number): WeatherReading => ({
      id: "w",
      temperature: 27.4,
      conditions: "Partly cloudy",
      source: "OpenWeatherMap",
      recordedAt: new Date(NOW - hoursAgo * 3600_000).toISOString(),
    });
    expect(pickWeatherNow(reading(1), null, null, NOW)?.temp).toBe(27.4);
    // Old reading and no forecast: nothing is "now".
    expect(pickWeatherNow(reading(30), null, null, NOW)).toBeNull();
    // Old reading, fresh forecast value: the forecast wins, with its source.
    const live = { time: new Date(NOW - 15 * 60_000).toISOString(), temperature: 25, kind: "clear" as const, isDay: false };
    expect(pickWeatherNow(reading(30), live, "Open-Meteo.com", NOW)).toMatchObject({ temp: 25, night: true, source: "Open-Meteo.com" });
  });
});
