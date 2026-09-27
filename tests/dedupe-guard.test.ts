/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Duplicate guard (src/lib/dedupe/guard.ts, match.ts): which rows are exact
 * duplicates, which one is kept, what it inherits, which pairs go to a person.
 */
import { describe, expect, it } from "vitest";
import { TABLE_SPECS, findConflicts, findFuzzyCandidates, placeNameKey, planExactDuplicates, type Row, type TableSpec } from "@/lib/dedupe/guard";
import { findSameNamed } from "@/lib/dedupe/match";

const spec = (table: string): TableSpec => {
  const s = TABLE_SPECS.find((t) => t.table === table);
  if (!s) throw new Error(`no spec ${table}`);
  return s;
};

describe("ElectionResult — the Bengaluru 2024 Lok Sabha pairs", () => {
  const rows: Row[] = [
    { id: "cmmvn6vjp00io", districtId: "blr", year: 2024, electionType: "LokSabha", constituency: "Bengaluru Central", winnerName: "P.C. Mohan", source: "ECI 2024", margin: 158440, turnoutPct: 71.3, runnerUpName: "Mansoor Ali Khan", runnerUpVotes: 1, totalVoters: 1, votesPolled: 1 },
    { id: "cmnuptbxg0001", districtId: "blr", year: 2024, electionType: "Lok Sabha", constituency: "Bengaluru Central", winnerName: "P.C. Mohan", source: "Election Commission of India (eci.gov.in)", margin: 135730, turnoutPct: 73, runnerUpName: "Mansoor Ali Khan", runnerUpVotes: 1, totalVoters: 1, votesPolled: 1 },
    { id: "a3", districtId: "blr", year: 2023, electionType: "Assembly", constituency: "Shivajinagar", winnerName: "Rizwan Arshad", source: "ECI" },
    { id: "a4", districtId: "blr", year: 2023, electionType: "Assembly", constituency: "Shivajinagar (157)", winnerName: "Rizwan Arshad", source: "Election Commission of India" },
    { id: "a5", districtId: "blr", year: 2023, electionType: "Assembly", constituency: "Yelahanka", winnerName: "S.R. Vishwanath", source: "ECI" },
  ];

  it("groups LokSabha / Lok Sabha and seat-numbered names as one result each", () => {
    const plans = planExactDuplicates(rows, spec("ElectionResult"));
    expect(plans).toHaveLength(2);
  });

  it("keeps the row whose source names the official site", () => {
    const plan = planExactDuplicates(rows, spec("ElectionResult")).find((p) => p.key.includes("LOK_SABHA"))!;
    expect(plan.keepId).toBe("cmnuptbxg0001");
    expect(plan.removeIds).toEqual(["cmmvn6vjp00io"]);
  });

  it("never merges two different winners for one seat — that is a conflict for a person", () => {
    const seat: Row[] = [
      { id: "x1", districtId: "blr", year: 2023, electionType: "Assembly", constituency: "Bangalore South", winnerName: "M. Krishnappa", source: "ECI" },
      { id: "x2", districtId: "blr", year: 2023, electionType: "Assembly", constituency: "Bengaluru South", winnerName: "Tejasvi Surya (MLA)", source: "ECI" },
    ];
    expect(planExactDuplicates(seat, spec("ElectionResult"))).toEqual([]);
    const [c] = findConflicts(seat, spec("ElectionResult"));
    expect(c).toMatchObject({ kind: "conflict", ids: ["x1", "x2"] });
  });

  it("rewrites every type in the canonical spelling", () => {
    const s = spec("ElectionResult");
    expect(s.canonicalColumn?.to("LokSabha")).toBe("LOK_SABHA");
    expect(s.canonicalColumn?.to("Assembly")).toBe("ASSEMBLY");
  });
});

describe("InfraProject", () => {
  const rows: Row[] = [
    { id: "p1", districtId: "mum", name: "Atal Setu", sourceUrls: ["u1"], verificationCount: 2, updatedAt: new Date("2026-06-01") },
    { id: "p2", districtId: "mum", name: "Sewri–Nhava Sheva Trans Harbour Link", sourceUrls: ["u2", "u3"], budget: 17_843_00_00_000, executingAgency: "MMRDA", updatedAt: new Date("2026-05-01") },
    { id: "p3", districtId: "mum", name: "Mumbai Metro Line 2A", updatedAt: new Date("2026-05-01") },
    { id: "p4", districtId: "mum", name: "Mumbai Metro Line 3", updatedAt: new Date("2026-05-01") },
    { id: "p5", districtId: "blr", name: "Namma Metro Phase-2", updatedAt: new Date("2026-05-01") },
    { id: "p6", districtId: "blr", name: "Bengaluru Metro Phase II", updatedAt: new Date("2026-04-01") },
    { id: "p7", districtId: "pune", name: "Atal Setu", updatedAt: new Date("2026-04-01") },
  ];

  it("merges aliases and roman numerals within a district, never across districts or line numbers", () => {
    const plans = planExactDuplicates(rows, spec("InfraProject"));
    expect(plans.map((p) => [p.keepId, ...p.removeIds].sort())).toEqual([["p1", "p2"], ["p5", "p6"]]);
  });

  it("fills the kept row from the copy and pools the source links", () => {
    const plan = planExactDuplicates(rows, spec("InfraProject")).find((p) => p.removeIds.includes("p1") || p.keepId === "p1")!;
    const keptRow = rows.find((r) => r.id === plan.keepId)!;
    expect([...(plan.fill.sourceUrls as string[])].sort()).toEqual(["u1", "u2", "u3"]);
    if (keptRow.id === "p1") expect(plan.fill).toMatchObject({ executingAgency: "MMRDA" });
  });

  it("moves timeline rows to the kept project", () => {
    expect(spec("InfraProject").children?.[0]).toMatchObject({ delegate: "infraUpdate", fk: "projectId" });
  });
});

describe("School and named places", () => {
  it("the Yelahanka high-school pair is one school (same name and PIN)", () => {
    const rows: Row[] = [
      { id: "s1", districtId: "blr", name: "Government High School, Yelahanka", address: "Yelahanka New Town, Bengaluru - 560064", talukId: null, students: 840 },
      { id: "s2", districtId: "blr", name: "Government High School Yelahanka", address: "Yelahanka New Town, 560064", talukId: "t1", students: 650 },
    ];
    const [plan] = planExactDuplicates(rows, spec("School"));
    expect(plan.keepId).toBe("s2");
    expect(plan.removeIds).toEqual(["s1"]);
  });

  it("never merges names made only of generic words", () => {
    expect(placeNameKey("Town Police Station")).toBeNull();
    expect(placeNameKey("Government High School")).toBeNull();
    expect(placeNameKey("Yelahanka Police Station")).toBe("police station yelahanka");
  });
});

describe("rows with an active flag are retired, not deleted", () => {
  it("Leader, LocalAlert, CitizenTip, LocalIndustry, FamousPersonality deactivate and only compare active rows", () => {
    for (const t of ["Leader", "LocalAlert", "CitizenTip", "LocalIndustry", "FamousPersonality"]) {
      expect(spec(t).resolve).toBe("deactivate");
      expect(spec(t).where).toEqual({ active: true });
    }
  });

  it("a leader holding two offices is not a duplicate", () => {
    const rows: Row[] = [
      { id: "l1", districtId: "kol", name: "Suvendu Adhikari", role: "Chief Minister of West Bengal", source: "x" },
      { id: "l2", districtId: "kol", name: "Suvendu Adhikari", role: "MLA, Bhabanipur", source: "x" },
    ];
    expect(planExactDuplicates(rows, spec("Leader"))).toEqual([]);
    expect(findFuzzyCandidates(rows, spec("Leader"))).toEqual([]);
  });
});

describe("NewsItem by URL", () => {
  it("the same article URL (www / tracking parameters aside) is one row; the original stays", () => {
    const rows: Row[] = [
      { id: "n2", districtId: "d", url: "https://www.thehindu.com/a/?utm_source=x", fetchedAt: new Date("2026-09-02"), classifiedAt: null, duplicateOf: null },
      { id: "n1", districtId: "d", url: "https://thehindu.com/a", fetchedAt: new Date("2026-09-01"), classifiedAt: new Date("2026-09-01"), duplicateOf: null },
    ];
    const [plan] = planExactDuplicates(rows, spec("NewsItem"));
    expect(plan.keepId).toBe("n1");
    expect(spec("NewsItem").selfRefs).toEqual(["duplicateOf"]);
  });
});

describe("fuzzy candidates — for a person, never merged", () => {
  it("finds near-identical names in the same district only, once per pair", () => {
    const rows: Row[] = [
      { id: "a", districtId: "d1", name: "Kempegowda Bus Station Majestic" },
      { id: "b", districtId: "d1", name: "Kempegowda Bus Stn Majestic" },
      { id: "c", districtId: "d2", name: "Kempegowda Bus Station Majestic" },
      { id: "e", districtId: "d1", name: "Peenya Industrial Area" },
    ];
    const s: TableSpec = { ...spec("Scheme"), key: (r) => `${r.districtId}|${r.name}` };
    const out = findFuzzyCandidates(rows, s);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "similar", ids: ["a", "b"], districtId: "d1", fingerprint: "Scheme:a+b" });
    expect(out[0].score).toBeGreaterThanOrEqual(0.85);
  });

  it("leaves out rows already removed as exact duplicates", () => {
    const rows: Row[] = [
      { id: "a", districtId: "d1", name: "Kempegowda Bus Station Majestic" },
      { id: "b", districtId: "d1", name: "Kempegowda Bus Stn Majestic" },
    ];
    const s: TableSpec = { ...spec("Scheme"), key: (r) => `${r.districtId}|${r.name}` };
    expect(findFuzzyCandidates(rows, s, new Set(["b"]))).toEqual([]);
  });
});

describe("findSameNamed — what writers call before creating", () => {
  const pool = [
    { id: "1", name: "Mumbai Trans Harbour Link", shortName: "MTHL" },
    { id: "2", name: "Mumbai Metro Line 3", shortName: "Metro Line 3" },
    { id: "3", name: "Mumbai Coastal Road Phase 1", shortName: "Coastal Road" },
  ];

  it("finds an alias, and a near-identical name", () => {
    expect(findSameNamed(pool, { name: "Atal Setu" })?.row.id).toBe("1");
    // every word of the stored name is in the new one ("Aqua Line" added)
    expect(findSameNamed(pool, { name: "Mumbai Metro Line-3 (Aqua Line)" })?.row.id).toBe("2");
    expect(findSameNamed(pool, { name: "Mumbai Metro Line III" })?.row.id).toBe("2");
  });

  it("never matches across different numbers, even with the same short name", () => {
    expect(findSameNamed(pool, { name: "Mumbai Coastal Road Phase 2", shortName: "Coastal Road" })).toBeNull();
    expect(findSameNamed(pool, { name: "Mumbai Metro Line 2A" })).toBeNull();
  });

  it("exactOnly ignores near matches", () => {
    expect(findSameNamed(pool, { name: "Mumbai Trans Harbor Link Road" }, { exactOnly: true })).toBeNull();
  });
});
