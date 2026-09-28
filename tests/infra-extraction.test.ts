/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// An infrastructure extraction from the news (src/lib/infra-extraction.ts):
// wrong types are dropped, progress is clamped, and the scope rules still
// hold after the verifier's corrections are merged in.
import { describe, expect, it } from "vitest";
import { applyScopeOverride, sanitizeInfra } from "@/lib/infra-extraction";

describe("sanitizeInfra", () => {
  it("returns null without a project name (a verifier correction can null it)", () => {
    expect(sanitizeInfra({ projectName: "" }, "t")).toBeNull();
    expect(sanitizeInfra({ projectName: null, shortName: "Metro" }, "t")).toBeNull();
    expect(sanitizeInfra({ projectName: 42 }, "t")).toBeNull();
    expect(sanitizeInfra({}, "t")).toBeNull();
  });

  it("drops values of the wrong type instead of storing them", () => {
    const x = sanitizeInfra(
      { projectName: "Hebbal Flyover Loop", budget: "120 crore", progressPct: "40%", keyPeople: { name: "X" }, districtNames: "Bengaluru", announcedBy: 7 },
      "headline",
    )!;
    expect(x.budget).toBeNull();
    expect(x.progressPct).toBeNull();
    expect(x.keyPeople).toEqual([]);
    expect(x.districtNames).toEqual([]);
    expect(x.announcedBy).toBeNull();
    expect(x.summary).toBe("headline");
    expect(x.shortName).toBe("Hebbal Flyover Loop");
    expect(x.confidence).toBe(0.5);
  });

  it("clamps progress and confidence, keeps valid people and names", () => {
    const x = sanitizeInfra(
      {
        projectName: "  Mumbai Coastal Road Phase 2 ",
        shortName: "Coastal Road",
        budget: 127_000_000_000,
        progressPct: 150,
        confidence: 1.4,
        keyPeople: [{ name: "A", role: "CM", party: null, context: null }, { role: "no name" }, null],
        districtNames: ["Mumbai", 3],
      },
      "t",
    )!;
    expect(x.projectName).toBe("Mumbai Coastal Road Phase 2");
    expect(x.budget).toBe(127_000_000_000);
    expect(x.progressPct).toBe(100);
    expect(x.confidence).toBe(1);
    expect(x.keyPeople).toHaveLength(1);
    expect(x.districtNames).toEqual(["Mumbai"]);
    expect(sanitizeInfra({ projectName: "Some Road", progressPct: -5 }, "t")!.progressPct).toBe(0);
  });
});

describe("applyScopeOverride after the verifier's corrections", () => {
  it("still forces a single-area project to its district", () => {
    const first = sanitizeInfra({ projectName: "Hebbal Flyover Loop", scope: "DISTRICT", districtNames: [] }, "t")!;
    // The verifier "corrects" the scope to STATE and names other districts.
    const merged = sanitizeInfra({ ...first, scope: "STATE", districtNames: ["Mysuru", "Mandya"] }, "t")!;
    const out = applyScopeOverride(merged);
    expect(out.scope).toBe("DISTRICT");
    expect(out.districtNames).toEqual(["bengaluru-urban"]);
  });

  it("keeps a national project national", () => {
    const merged = sanitizeInfra({ projectName: "NH-44 widening", scope: "DISTRICT", districtNames: ["Mandya"] }, "t")!;
    expect(applyScopeOverride(merged).scope).toBe("NATIONAL");
  });
});
