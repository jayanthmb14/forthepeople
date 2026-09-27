/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Jal Jeevan Mission dashboard parsers and checks (src/scraper/lib/jjm.ts)
// plus the portal name matching (src/scraper/lib/source-districts.ts).
// Fixtures are real replies from ejalshakti.gov.in on 27 Sep 2026,
// trimmed to a few rows.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  encodeJjmParam,
  jjmCrossCheck,
  jjmRequestBody,
  jjmRowProblems,
  parseJjmRows,
  type JjmRow,
} from "@/scraper/lib/jjm";
import { normName, pickByName, sourceDistrictNames, sourceStateNames, udiseParts } from "@/scraper/lib/source-districts";

const fixture = (name: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures/collectors", name), "utf8")) as unknown;

describe("encodeJjmParam (the dashboard's encodeTxt)", () => {
  it("matches what the dashboard sends", () => {
    expect(encodeJjmParam("0")).toBe("11");
    expect(encodeJjmParam("1")).toBe("21");
    expect(encodeJjmParam("29")).toBe("3%3A1");
    expect(encodeJjmParam("09")).toBe("1%3A1");
  });
  it("builds the state and district request bodies", () => {
    expect(JSON.parse(jjmRequestBody("0", "states"))).toEqual({ StCode11: "11", Cat: "11", SubCat: "11", Param: "11" });
    expect(JSON.parse(jjmRequestBody("29", "districts"))).toEqual({ StCode11: "3%3A1", Cat: "11", SubCat: "11", Param: "21" });
  });
});

describe("parseJjmRows", () => {
  it("reads the state list", () => {
    const rows = parseJjmRows(fixture("jjm-states.json"))!;
    const ka = rows.find((r) => r.name === "Karnataka")!;
    expect(ka.code).toBe("29");
    expect(rows.find((r) => r.name === "Uttar Pradesh")!.code).toBe("09");
  });

  it("reads a district map row as published", () => {
    const rows = parseJjmRows(fixture("jjm-karnataka-map.json"))!;
    const mandya = rows.find((r) => r.name === "Mandya")!;
    expect(mandya).toMatchObject({ code: "573", withTap: 377759, households: 401102, pct: 94.18 });
    expect(mandya.withTapAtStart).toBeNull(); // the map has no 2019 baseline
  });

  it("reads the table row with the 15 Aug 2019 baseline", () => {
    const rows = parseJjmRows(fixture("jjm-karnataka-table.json"))!;
    const mandya = rows.find((r) => r.name === "Mandya")!;
    expect(mandya).toMatchObject({ withTap: 377759, households: 401102, withTapAtStart: 216254 });
  });

  it("drops rows with a missing figure and rejects other shapes", () => {
    expect(parseJjmRows({ d: [{ Name: "X", KeyValue: "1", Value: "", Total: "10", Per: "1" }] })).toEqual([]);
    expect(parseJjmRows({ d: [{ Name: "X", KeyValue: "1", Value: "5", Total: "abc", Per: "1" }] })).toEqual([]);
    expect(parseJjmRows({ Message: "error" })).toBeNull();
    expect(parseJjmRows(null)).toBeNull();
  });
});

describe("checks", () => {
  const base: JjmRow = { code: "573", name: "Mandya", withTap: 377759, households: 401102, pct: 94.18 };

  it("passes the real Mandya row and the cross-check", () => {
    const map = parseJjmRows(fixture("jjm-karnataka-map.json"))!;
    const table = parseJjmRows(fixture("jjm-karnataka-table.json"))!;
    for (const name of ["Mandya", "Mysuru", "Bengaluru Urban", "Gadag"]) {
      const m = map.find((r) => r.name === name)!;
      expect(jjmRowProblems(m)).toEqual([]);
      expect(jjmCrossCheck(m, table.find((t) => t.code === m.code) ?? null)).toEqual([]);
    }
  });

  it("rejects impossible figures", () => {
    expect(jjmRowProblems({ ...base, withTap: 500000 })).not.toEqual([]);
    expect(jjmRowProblems({ ...base, pct: 80 })).not.toEqual([]); // % does not match taps ÷ homes
    expect(jjmRowProblems({ ...base, households: 10, withTap: 5, pct: 50 })).not.toEqual([]);
  });

  it("rejects when the two endpoints disagree or one is missing", () => {
    expect(jjmCrossCheck(base, { ...base, withTap: base.withTap - 1 })).not.toEqual([]);
    expect(jjmCrossCheck(base, null)).not.toEqual([]);
  });
});

describe("portal names", () => {
  it("normalises spelling, case and punctuation", () => {
    expect(normName("Chennai (Ext. GCC)")).toBe("CHENNAIEXTGCC");
    expect(normName("bengaluru  urban")).toBe(normName("BENGALURU URBAN"));
  });

  it("matches our districts in the JJM list", () => {
    const rows = parseJjmRows(fixture("jjm-karnataka-map.json"))!;
    const pick = (slug: string, name: string) => pickByName(rows, (r) => r.name, sourceDistrictNames("jjm", slug, name))?.name;
    expect(pick("mysuru", "Mysuru")).toBe("Mysuru");
    expect(pick("bengaluru-urban", "Bengaluru Urban")).toBe("Bengaluru Urban");
    expect(pick("mandya", "Mandya")).toBe("Mandya");
    expect(pick("chennai", "Chennai")).toBeUndefined();
  });

  it("knows the multi-part UDISE+ districts and state spellings", () => {
    expect(udiseParts("bengaluru-urban")).toEqual(["BENGALURU U NORTH", "BENGALURU U SOUTH"]);
    expect(udiseParts("mandya")).toBeNull();
    expect(sourceStateNames("delhi", "Delhi")).toContain("NCT of Delhi");
  });
});
