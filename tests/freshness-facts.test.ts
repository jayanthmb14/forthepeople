/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { buildDatasets, type FreshnessExtra, type FreshnessRow } from "@/lib/freshness-facts";
import { newerFy } from "@/lib/freshness";

const NOW = new Date("2026-09-28T06:00:00Z");

/** A district with nothing collected: every count 0, every date null. */
function emptyRow(over: Partial<FreshnessRow> = {}): FreshnessRow {
  const row: Record<string, unknown> = {
    tenders_active: false, budget_estimate: false, housing_estimate: false, dams_estimate: false,
  };
  return new Proxy({ ...row, ...over } as FreshnessRow, {
    get: (t, k) => (k in t ? t[k as keyof FreshnessRow] : typeof k === "string" && k.endsWith("_rows") ? 0 : null),
  });
}

const noExtra: FreshnessExtra = {
  courtsDate: null,
  gp: { rows: 0, date: null },
  nrega: null,
  udiseAt: null,
  alertsCheckedAt: null,
};

const dataset = (row: FreshnessRow, key: string, extra: FreshnessExtra = noExtra) => {
  const d = buildDatasets(row, NOW, extra).find((x) => x.key === key);
  if (!d) throw new Error(`no dataset ${key}`);
  return d;
};

describe("freshness facts — budget (finance)", () => {
  it("counts published allocations (Pune: 5 BudgetAllocation rows, no BudgetEntry rows)", () => {
    const row = emptyRow({
      budget_alloc_rows: 5,
      budget_alloc_fy: "2026-27",
      budget_alloc_checked: new Date("2026-09-20T00:00:00Z"),
    } as Partial<FreshnessRow>);
    const d = dataset(row, "budget");
    expect(d.rows).toBe(5);
    expect(d.status).toBe("current");
    expect(d.period).toBe("2026-27");
    expect(d.dataDate).toBe("2026-04-01T00:00:00.000Z");
    expect(d.lastChecked).toBe("2026-09-20T00:00:00.000Z");
  });

  it("adds entries and allocations and takes the newer year and check", () => {
    const row = emptyRow({
      budget_rows: 3,
      budget_fy: "2025-26",
      budget_checked: new Date("2026-09-25T00:00:00Z"),
      budget_alloc_rows: 2,
      budget_alloc_fy: "2026-27",
      budget_alloc_checked: new Date("2026-06-01T00:00:00Z"),
    } as Partial<FreshnessRow>);
    const d = dataset(row, "budget");
    expect(d.rows).toBe(5);
    expect(d.period).toBe("2026-27");
    expect(d.lastChecked).toBe("2026-09-25T00:00:00.000Z");
  });

  it("is still 'not collected' with neither", () => {
    expect(dataset(emptyRow(), "budget").status).toBe("not_collected");
  });
});

describe("newerFy", () => {
  it("picks the later financial year, either may be missing", () => {
    expect(newerFy("2025-26", "2026-27")).toBe("2026-27");
    expect(newerFy("FY 2026-27", "2025-2026")).toBe("FY 2026-27");
    expect(newerFy(null, "2024-25")).toBe("2024-25");
    expect(newerFy("2024-25", null)).toBe("2024-25");
    expect(newerFy(null, undefined)).toBeNull();
  });
});

describe("freshness facts — no maintenance edit counts as a data date (Sept 2026 audit)", () => {
  const touched = new Date("2026-09-28T00:39:00Z"); // one clean-up pass touched some rows

  it("schemes and industries are reference lists: no date, never 'current' or 'late'", () => {
    const row = emptyRow({ schemes_rows: 12, industries_rows: 9, schemes_date: touched, industries_date: touched } as Partial<FreshnessRow>);
    for (const key of ["schemes", "industries"]) {
      const d = dataset(row, key);
      expect(d.status).toBe("reference");
      expect(d.dataDate).toBeNull();
      expect(d.maxAgeHours).toBeNull();
    }
  });

  it("schools without a UDISE+ snapshot have no data date (the listed rows' updatedAt is not one)", () => {
    const d = dataset(emptyRow({ schools_rows: 40, schools_date: touched } as Partial<FreshnessRow>), "schools");
    expect(d.rows).toBe(40);
    expect(d.dataDate).toBeNull();
    expect(d.status).toBe("unknown");
  });

  it("schools with a UDISE+ snapshot use when UDISE+ was read", () => {
    const udiseAt = new Date("2026-09-22T05:00:00Z");
    const d = dataset(emptyRow({ schools_rows: 40 }), "schools", { ...noExtra, udiseAt });
    expect(d.rows).toBe(41);
    expect(d.dataDate).toBe(udiseAt.toISOString());
    expect(d.status).toBe("current");
  });
});
