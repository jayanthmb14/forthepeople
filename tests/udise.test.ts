/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// UDISE+ district school statistics (src/scraper/lib/udise.ts).
// Fixtures are real replies from api.udiseplus.gov.in on 27 Sep 2026.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseUdiseHighlights,
  parseUdiseRegions,
  parseUdiseYears,
  sumUdiseParts,
  udiseAvailablePct,
  udiseHighlightsBody,
  udiseProblems,
} from "@/scraper/lib/udise";
import { pickByName, sourceDistrictNames, udiseParts } from "@/scraper/lib/source-districts";

const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures/collectors", name), "utf8")) as unknown;

describe("UDISE+ lists", () => {
  it("reads school years newest first", () => {
    const years = parseUdiseYears(fixture("udise-years.json"))!;
    expect(years[0]).toEqual({ yearId: 12, label: "2025-26" });
    expect(years[1]).toEqual({ yearId: 11, label: "2024-25" });
  });

  it("reads education districts and finds ours, including split ones", () => {
    const list = parseUdiseRegions(fixture("udise-districts-karnataka.json"), "district")!;
    expect(pickByName(list, (r) => r.name, sourceDistrictNames("udise", "mandya", "Mandya"))?.code).toBe("2922");
    expect(pickByName(list, (r) => r.name, sourceDistrictNames("udise", "mysuru", "Mysuru"))?.code).toBe("2926");
    const parts = udiseParts("bengaluru-urban")!.map((n) => pickByName(list, (r) => r.name, [n])?.code);
    expect(parts).toEqual(["2928", "2920"]);
  });

  it("rejects replies that are not a success", () => {
    expect(parseUdiseYears({ status: false, data: "" })).toBeNull();
    expect(parseUdiseRegions(null, "state")).toBeNull();
  });

  it("builds the district request", () => {
    expect(JSON.parse(udiseHighlightsBody(12, "2922"))).toEqual({ yearId: 12, regionCode: "2922", regionType: 12, valueType: 1 });
  });
});

describe("parseUdiseHighlights + checks", () => {
  it("reads Mandya 2025-26 as published", () => {
    const p = parseUdiseHighlights(fixture("udise-mandya-12.json"))!;
    expect(p.yearId).toBe(12);
    expect(p.stats).toMatchObject({ udiseName: "MANDYA", udiseCode: "2922", schools: 2274, teachers: 10644, students: 218379 });
    expect(p.stats.schoolsByManagement).toEqual({ government: 1733, governmentAided: 165, privateUnaided: 376, other: 0 });
    expect(p.stats.facilitiesPct.girlsToiletFunctional).toBe(99.12);
    expect(p.stats.facilitiesPct.internet).toBe(51.5);
  });

  it("passes every consistency check on real data", () => {
    const now = fixture("udise-mandya-12.json");
    const before = parseUdiseHighlights(fixture("udise-mandya-11.json"))!;
    expect(udiseProblems(parseUdiseHighlights(now)!, udiseAvailablePct(now), before.stats.schools)).toEqual([]);
    const mum = fixture("udise-mumbai-suburban-12.json");
    expect(udiseProblems(parseUdiseHighlights(mum)!, udiseAvailablePct(mum), null)).toEqual([]);
  });

  it("rejects figures whose breakdowns do not add up", () => {
    const body = fixture("udise-mandya-12.json") as { data: Array<Record<string, unknown>> };
    const bad = { ...body, data: [{ ...body.data[0], totSch: 2275 }] };
    expect(udiseProblems(parseUdiseHighlights(bad)!, udiseAvailablePct(bad), null).join(" ")).toMatch(/management/);
    const bad2 = { ...body, data: [{ ...body.data[0], tenrS: 1 }] };
    expect(udiseProblems(parseUdiseHighlights(bad2)!, udiseAvailablePct(bad2), null).join(" ")).toMatch(/stage/);
    const bad3 = { ...body, data: [{ ...body.data[0], toiletGPerFun: 120 }] };
    expect(udiseProblems(parseUdiseHighlights(bad3)!, udiseAvailablePct(bad3), null).join(" ")).toMatch(/outside/);
  });

  it("rejects a school count that jumps more than 30% in a year", () => {
    const now = fixture("udise-mandya-12.json");
    expect(udiseProblems(parseUdiseHighlights(now)!, udiseAvailablePct(now), 1200).join(" ")).toMatch(/in a year/);
  });

  it("returns null for missing totals or other shapes", () => {
    const body = fixture("udise-mandya-12.json") as { data: Array<Record<string, unknown>> };
    expect(parseUdiseHighlights({ ...body, data: [{ ...body.data[0], totSch: null }] })).toBeNull();
    expect(parseUdiseHighlights({ status: true, data: [] })).toBeNull();
    expect(parseUdiseHighlights({ status: false, data: "", errorDetails: { message: "Invalid Region Type" } })).toBeNull();
  });

  it("sums the counts of split districts", () => {
    const a = parseUdiseHighlights(fixture("udise-mandya-12.json"))!.stats;
    const b = parseUdiseHighlights(fixture("udise-mumbai-suburban-12.json"))!.stats;
    expect(sumUdiseParts([a, b])).toEqual({
      schools: a.schools + b.schools,
      teachers: a.teachers + b.teachers,
      students: a.students + b.students,
      governmentSchools: a.schoolsByManagement.government + b.schoolsByManagement.government,
    });
  });
});
