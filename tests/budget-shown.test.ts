/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { hasEstimatedSpend, rowsSource, withPublishedSpend } from "@/lib/money/budget-shown";
import { COLLECTED_BUDGET_SOURCES, SHOWN_BUDGET_ALLOCATION, SHOWN_BUDGET_ENTRY } from "@/lib/data-filters";

describe("withPublishedSpend", () => {
  it("blanks spend and release figures the row calls an estimate (Pune, Sept 2026)", () => {
    const row = {
      allocated: 126180000000,
      released: 98420400000,
      spent: 82017000000,
      lapsed: 0,
      remarks: "Presented on 2025-03-04.\n\nFY 2025-26 utilization estimate: 78% released, 65% spent — defensible approximation pending CAG audit publication.",
    };
    const out = withPublishedSpend(row);
    expect(out.spent).toBe(0);
    expect(out.released).toBe(0);
    expect(out.allocated).toBe(row.allocated);
  });
  it("reads the source label too (Hyderabad 'estimated from state avg utilisation')", () => {
    expect(hasEstimatedSpend({ source: "finance.telangana.gov.in (estimated from state avg utilisation)" })).toBe(true);
  });
  it("keeps published figures and notes that are not about spending", () => {
    const row = { allocated: 100, released: 80, spent: 60, remarks: "Mid-year collection figures indicative. Budget as presented to the Standing Committee." };
    expect(withPublishedSpend(row)).toBe(row);
    expect(hasEstimatedSpend({ remarks: null, source: "Lokmat Times" })).toBe(false);
  });
});

describe("rowsSource", () => {
  it("names the one shared source, with its link", () => {
    expect(rowsSource([{ source: "Lokmat Times", sourceUrl: "https://www.lokmattimes.com/x" }, { source: "Lokmat Times" }])).toEqual({
      label: "Lokmat Times",
      href: "https://www.lokmattimes.com/x",
    });
  });
  it("says 'mixed' for several sources and null for none (never a fixed 'PFMS')", () => {
    expect(rowsSource([{ source: "Lokmat Times" }, { source: "Punekar News" }])).toBe("mixed");
    expect(rowsSource([{ source: null }, { source: "  " }])).toBeNull();
    expect(rowsSource([])).toBeNull();
  });
  it("ignores a link that is not http(s)", () => {
    expect(rowsSource([{ source: "KMC", sourceUrl: "javascript:alert(1)" }])).toEqual({ label: "KMC" });
  });
});

describe("budget row filters", () => {
  it("shows BudgetEntry rows only from collector labels", () => {
    expect(COLLECTED_BUDGET_SOURCES).toContain("Karnataka Finance Dept / data.gov.in");
    expect(SHOWN_BUDGET_ENTRY.OR).toEqual([
      { source: { in: COLLECTED_BUDGET_SOURCES } },
      { source: { startsWith: "data.gov.in (" } },
    ]);
  });
  it("shows BudgetAllocation rows only when they link to their source", () => {
    expect(SHOWN_BUDGET_ALLOCATION).toEqual({ sourceUrl: { not: null } });
  });
});

/**
 * BudgetEntry source labels written by hand-made seed scripts
 * (prisma/seed-bengaluru-data.ts, seed-hyderabad-data.ts,
 * seed-lucknow-data.ts, seed-mumbai-data.ts, seed-delhi-data.ts), not read
 * from a budget document. The Sept 2026 audit found their totals were state
 * or agency budgets credited to one district (New Delhi's twelve Delhi
 * Government heads sum to the same ₹65,200 crore as Mumbai's; Lucknow's
 * are UP state heads), and their "spent" was a fixed share of every line
 * (Bengaluru Urban 44 % / 70 %, Hyderabad "estimated from state avg
 * utilisation"). (BMC's own 2025-26 budget estimate is ₹74,427.41 crore —
 * not what the Mumbai rows add up to.) Kept here as the audit's record:
 * v54/fix-news hid them by these exact labels (NOT_SEEDED_BUDGET, removed
 * from src/lib/data-filters.ts in v55 — no query used it); the queries use
 * SHOWN_BUDGET_ENTRY, which must hide every one of these labels too.
 */
const SEEDED_BUDGET_SOURCES: string[] = [
  "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
  "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
  "finance.telangana.gov.in (estimated from state avg utilisation)",
  "ghmc.gov.in (estimated from state avg utilisation)",
  "UP Finance Department",
  "UP Finance Department (budget.up.nic.in)",
  "BMC Budget 2025-26",
  "MMRDA / State Allocation",
  "Delhi Budget",
  "Delhi Budget / delhiplanning.delhi.gov.in",
];
describe("seeded budget labels (v54/fix-news)", () => {
  const passesShown = (source: string | null) =>
    source !== null && (COLLECTED_BUDGET_SOURCES.includes(source) || source.startsWith("data.gov.in ("));
  it("no seeded label is shown as a district budget", () => {
    expect(SEEDED_BUDGET_SOURCES.length).toBeGreaterThan(0);
    for (const label of SEEDED_BUDGET_SOURCES) expect(passesShown(label)).toBe(false);
  });
  it("collector labels are not on the seeded list", () => {
    for (const label of COLLECTED_BUDGET_SOURCES) expect(SEEDED_BUDGET_SOURCES).not.toContain(label);
  });
});
