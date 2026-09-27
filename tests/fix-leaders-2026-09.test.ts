/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The Sept 2026 leaders fix plan (scripts/fix-leaders-2026-09.ts) is data.
 * These checks keep it honest without touching the database.
 */
import { describe, expect, it } from "vitest";
import {
  PLAN, SOURCES, computeWrites, dbSourceString, normalizeName, validatePlan, type LeaderRow, type Op,
} from "../scripts/fix-leaders-2026-09";

const LIVE = ["mandya", "mysuru", "bengaluru-urban", "pune", "mumbai", "lucknow", "hyderabad", "chennai", "kolkata", "new-delhi"];

describe("leaders fix plan (Sept 2026)", () => {
  it("passes its own validation (two outlets per change, unique rows, sane tiers)", () => {
    expect(validatePlan(PLAN)).toEqual([]);
  });

  it("covers every live district and nothing else", () => {
    expect(new Set(PLAN.map((op) => op.slug))).toEqual(new Set(LIVE));
  });

  it("flags a change backed by a single outlet", () => {
    const bad: Op = {
      kind: "add", slug: "mandya", reason: "test", sources: ["W_KA16", "W_KA_COM"],
      row: { name: "Someone", role: "MLA, Somewhere", tier: 4, party: null, constituency: "Somewhere", since: null },
    };
    expect(validatePlan([bad]).join()).toMatch(/different outlets/);
  });

  it("flags the same row touched twice", () => {
    const a = PLAN.find((op) => op.kind === "deactivate")!;
    expect(validatePlan([a, a]).join()).toMatch(/used twice/);
  });

  it("never stores a source that would hide the row (URL-first sources are treated as news)", () => {
    for (const op of PLAN) {
      if (op.sources.length) expect(dbSourceString(op.sources).startsWith("http")).toBe(false);
    }
    expect(dbSourceString(["W_KA_COM", "BS_DKS"])).toBe("manual-research 2026-09 · Wikipedia; Business Standard");
  });

  it("has the Karnataka change the owner reported", () => {
    const adds = PLAN.filter((op): op is Extract<Op, { kind: "add" }> => op.kind === "add");
    for (const slug of ["mandya", "mysuru", "bengaluru-urban"]) {
      expect(adds.some((a) => a.slug === slug && a.row.name === "D. K. Shivakumar" && a.row.role === "Chief Minister of Karnataka")).toBe(true);
      expect(adds.some((a) => a.slug === slug && a.row.name === "G. Parameshwara" && /Deputy Chief Minister/.test(a.row.role))).toBe(true);
    }
    const siddaramaiahCm = PLAN.filter((op) => op.kind === "deactivate" && op.expectName === "Siddaramaiah");
    expect(siddaramaiahCm.map((op) => op.slug).sort()).toEqual(["bengaluru-urban", "mandya"]);
  });

  it("deactivates, never deletes", () => {
    expect(PLAN.every((op) => ["add", "update", "deactivate"].includes(op.kind))).toBe(true);
  });

  it("uses only https sources that exist", () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
});

describe("computeWrites (planner, no DB)", () => {
  const district = { id: "d-mandya", slug: "mandya", name: "Mandya" };
  const base: Omit<LeaderRow, "id" | "name"> = {
    districtId: district.id, role: "Some role", roleLocal: null, tier: 4, party: null, constituency: null,
    since: null, source: "seed", active: true, lastVerifiedAt: null, roleDescription: null,
  };
  const mandyaPlan = PLAN.filter((op) => op.slug === "mandya");
  const seedRows = (): LeaderRow[] =>
    mandyaPlan.flatMap((op) => (op.kind === "add" ? [] : [{ ...base, id: op.id, name: op.expectName }]));

  function apply(rows: LeaderRow[], writes: ReturnType<typeof computeWrites>["writes"]): LeaderRow[] {
    const next = rows.map((r) => ({ ...r }));
    let n = 0;
    for (const w of writes) {
      if (w.action === "create") next.push({ ...base, id: `new-${n++}`, ...(w.data as Partial<LeaderRow>) } as LeaderRow);
      else Object.assign(next.find((r) => r.id === w.id)!, w.data);
    }
    return next;
  }

  it("is idempotent: a second run plans nothing", () => {
    const first = computeWrites(mandyaPlan, [district], seedRows());
    expect(first.warnings).toEqual([]);
    expect(first.writes.length).toBeGreaterThan(0);
    const second = computeWrites(mandyaPlan, [district], apply(seedRows(), first.writes));
    expect(second.writes).toEqual([]);
    expect(second.warnings).toEqual([]);
  });

  it("skips a row whose name does not match (never edits the wrong person)", () => {
    const rows = seedRows().map((r) => (r.id === "cmnziu4xf0000asxn0u1li5xm" ? { ...r, name: "Somebody Else" } : r));
    const { writes, warnings } = computeWrites(mandyaPlan, [district], rows);
    expect(writes.some((w) => w.action === "update" && w.id === "cmnziu4xf0000asxn0u1li5xm")).toBe(false);
    expect(warnings.join()).toMatch(/Somebody Else/);
  });

  it("does not reuse a news-derived row for an add, and stores a non-URL source", () => {
    const news: LeaderRow = { ...base, id: "news-1", name: "D K Shivakumar", role: "Chief Minister", tier: 2, source: "https://news.example/x", active: false };
    const { writes } = computeWrites(mandyaPlan, [district], [...seedRows(), news]);
    const dks = writes.find((w) => w.action === "create" && (w.data as { name: string }).name === "D. K. Shivakumar");
    expect(dks).toBeDefined();
    expect(String((dks!.data as { source: string }).source).startsWith("http")).toBe(false);
    expect(writes.some((w) => w.action === "update" && w.id === "news-1")).toBe(false);
  });

  it("clears the local-script role when the role text changes", () => {
    const blr = { id: "d-blr", slug: "bengaluru-urban", name: "Bengaluru Urban" };
    const op = PLAN.find((o) => o.kind === "update" && o.id === "cmnakas6m000a1axn9idscyk7")!; // Priya Krishna
    const row: LeaderRow = { ...base, districtId: blr.id, id: "cmnakas6m000a1axn9idscyk7", name: "Priya Krishna", role: "MLA, Pulakeshinagar", roleLocal: "ಶಾಸಕ, ಪುಲಕೇಶಿನಗರ" };
    const { writes } = computeWrites([op], [blr], [row]);
    expect(writes[0].data.roleLocal).toBeNull();
    expect(writes[0].data.role).toBe("MLA, Govindraj Nagar");
  });
});

describe("normalizeName", () => {
  it("ignores dots, spaces, titles and service suffixes", () => {
    expect(normalizeName("Dr. C. N. Manjunath")).toBe(normalizeName("C.N. Manjunath"));
    expect(normalizeName("V.C. Sajjanar, IPS")).toBe(normalizeName("V C Sajjanar"));
    expect(normalizeName("Justice T.S. Sivagnanam")).toBe(normalizeName("T. S. Sivagnanam"));
    expect(normalizeName("P. Ravikumar (Ganiga)")).toBe(normalizeName("P Ravikumar"));
  });
  it("keeps different people apart", () => {
    expect(normalizeName("M. Krishnappa")).not.toBe(normalizeName("M. Krishna"));
    expect(normalizeName(null)).toBe("");
  });
});
