/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import {
  budgetChangePct,
  isLate,
  isNonProject,
  lastUpdateAt,
  oneLine,
  projectKind,
  projectPoints,
  projectStage,
} from "@/lib/civic/project-facts";

const NOW = new Date("2026-09-27T00:00:00Z").getTime();

describe("projectStage", () => {
  it("folds the many spellings into six stages", () => {
    expect(projectStage("In Progress")).toBe("building");
    expect(projectStage("UNDER_CONSTRUCTION")).toBe("building");
    expect(projectStage("ongoing")).toBe("building");
    expect(projectStage("DELAYED")).toBe("building");
    expect(projectStage("Partially Operational")).toBe("building");
    expect(projectStage("PROPOSED")).toBe("announced");
    expect(projectStage("Under Discussion")).toBe("announced");
    expect(projectStage("PLANNED_LAND_ACQUISITION")).toBe("announced");
    expect(projectStage("APPROVED_DPR_PENDING")).toBe("approved");
    expect(projectStage("TENDER_ISSUED")).toBe("approved");
    expect(projectStage("OPERATIONAL")).toBe("completed");
    expect(projectStage("Commissioned")).toBe("completed");
    expect(projectStage("Stalled")).toBe("stalled");
    expect(projectStage("Scrapped by HC Order")).toBe("cancelled");
    expect(projectStage("CANCELLATION")).toBe("cancelled");
    expect(projectStage(null)).toBe("announced");
  });
});

describe("projectKind", () => {
  it("folds category spellings into one closed list", () => {
    expect(projectKind("ROAD")).toBe("road");
    expect(projectKind("Roads & Highways")).toBe("road");
    expect(projectKind("Metro Rail")).toBe("metro");
    expect(projectKind("Railways")).toBe("rail");
    expect(projectKind("FLYOVER")).toBe("bridge");
    expect(projectKind("Water Supply")).toBe("water");
    expect(projectKind("Parks & Lakes")).toBe("parks");
    expect(projectKind("Waste Management")).toBe("sewage");
    expect(projectKind("Healthcare")).toBe("health");
    expect(projectKind("SMART_CITY")).toBe("city");
    expect(projectKind("Aviation")).toBe("airport");
  });
  it("uses the name when the category says nothing", () => {
    expect(projectKind("Mega Project", "Regional Ring Road (RRR) — 340 km")).toBe("road");
    expect(projectKind("OTHER", "PM MITRA Textile Parks")).toBe("industry");
    expect(projectKind("Environment", "Ghazipur Landfill Remediation")).toBe("sewage");
    expect(projectKind("Other", "Supercomputer")).toBe("city");
    expect(projectKind("Other", "Something else")).toBe("other");
  });
});

describe("isNonProject", () => {
  it("hides renamings and maintenance blocks only", () => {
    expect(isNonProject({ name: "Hyderabad Donald Trump Avenue Renaming" })).toBe(true);
    expect(isNonProject({ name: "Mumbai Local Trains Western Railway Maintenance Block" })).toBe(true);
    expect(isNonProject({ name: "Hyderabad Road Maintenance Plan" })).toBe(false);
    expect(isNonProject({ name: "Mandya-Mysuru Highway Widening" })).toBe(false);
  });
});

describe("oneLine", () => {
  it("keeps the first sentence and cuts long text at a word", () => {
    expect(oneLine("A new road. It has 4 lanes.")).toBe("A new road.");
    expect(oneLine("   ")).toBeNull();
    const long = oneLine("word ".repeat(80), 40)!;
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(41);
  });
});

describe("projectPoints", () => {
  it("flags a passed deadline, a revised budget and old news", () => {
    const pts = projectPoints(
      {
        name: "Metro Line",
        status: "UNDER_CONSTRUCTION",
        expectedEnd: "2026-03-01",
        originalBudget: 100,
        revisedBudget: 140,
        lastNewsAt: "2026-05-01",
        progressPct: 40,
        sourceUrls: ["https://a.example/1", "https://b.example/2"],
      },
      [],
      NOW,
    );
    expect(pts).toEqual([
      { kind: "deadlinePassed", months: 7 },
      { kind: "budgetUp", pct: 40 },
      { kind: "noNews", days: 149 },
    ]);
  });
  it("never calls a finished project late, and merges 'no news' with 'no source'", () => {
    const pts = projectPoints({ name: "Old bridge", status: "Completed", expectedEnd: "2020-01-01" }, [], NOW);
    expect(pts).toEqual([{ kind: "noNewsNoSource" }]);
    expect(isLate({ name: "Old bridge", status: "Completed", expectedEnd: "2020-01-01" }, NOW)).toBe(false);
  });
  it("notes missing progress and a copied description", () => {
    const a = { id: "a", name: "Hosur Road Elevated Corridor", status: "In Progress", description: "Multi-level flyover at Silk Board junction connecting Hosur Road to ORR and Bannerghatta Road." };
    const b = { id: "b", name: "Outer Ring Road Improvements", status: "PROPOSED", description: a.description };
    const pts = projectPoints(a, [a, b], NOW);
    expect(pts).toContainEqual({ kind: "progressUnknown" });
    expect(pts).toContainEqual({ kind: "sameDescription", name: "Outer Ring Road Improvements" });
  });
  it("reads the budget change from costOverrunPct first", () => {
    expect(budgetChangePct({ name: "x", costOverrunPct: 12.5, originalBudget: 1, revisedBudget: 5 })).toBe(12.5);
    expect(budgetChangePct({ name: "x", originalBudget: 100, revisedBudget: 100 })).toBe(0);
    expect(budgetChangePct({ name: "x" })).toBeNull();
  });
  it("takes the newest of news, our check and tracked updates as the last update", () => {
    const t = lastUpdateAt({ name: "x", lastNewsAt: "2026-01-01", lastVerifiedAt: "2026-04-01", updates: [{ date: "2026-02-01" }] });
    expect(t).toBe(new Date("2026-04-01").getTime());
  });
});
