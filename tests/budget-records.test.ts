/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A data.gov.in budget record becomes a BudgetEntry row only when it names
// OUR district and its own financial year — never the whole state's rows
// on every district, never a year taken from today's date.
import { afterEach, describe, expect, it, vi } from "vitest";
import { budgetRowFromRecord, fiscalYearOf, type BudgetResource } from "@/scraper/lib/budget-records";

const resource: BudgetResource = {
  resourceId: "test",
  description: "test dataset",
  unit: "crore",
  districtField: "district_name",
  yearField: "financial_year",
};
const rec = (over: Record<string, unknown> = {}) => ({
  district_name: "Mandya",
  financial_year: "2023-24",
  department: "Public Works",
  allocated: "12.5",
  released: "10",
  spent: "7.25",
  ...over,
});

describe("budgetRowFromRecord", () => {
  afterEach(() => vi.useRealTimers());

  it("maps a complete record of our district, in whole rupees, with the record's own year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-28T00:00:00Z"));
    expect(budgetRowFromRecord(rec(), resource, "Mandya")).toEqual({
      fiscalYear: "2023-24",
      sector: "Public Works",
      allocated: 125_000_000,
      released: 100_000_000,
      spent: 72_500_000,
    });
  });

  it("rejects a record without the district field, or for another district", () => {
    expect(budgetRowFromRecord(rec({ district_name: undefined }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ district_name: "Mysuru" }), resource, "Mandya")).toBeNull();
    // Case and spacing do not matter.
    expect(budgetRowFromRecord(rec({ district_name: " MANDYA " }), resource, "Mandya")).not.toBeNull();
  });

  it("rejects a record without a readable year (never uses the current date)", () => {
    expect(budgetRowFromRecord(rec({ financial_year: undefined }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ financial_year: "" }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ financial_year: "FY 2024" }), resource, "Mandya")).toBeNull();
  });

  it("rejects missing figures instead of storing 0", () => {
    expect(budgetRowFromRecord(rec({ released: undefined }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ spent: "" }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ allocated: "0" }), resource, "Mandya")).toBeNull();
    expect(budgetRowFromRecord(rec({ department: undefined }), resource, "Mandya")).toBeNull();
  });
});

describe("fiscalYearOf", () => {
  it("normalises the usual spellings", () => {
    expect(fiscalYearOf("2024-25")).toBe("2024-25");
    expect(fiscalYearOf("2024-2025")).toBe("2024-25");
    expect(fiscalYearOf("2024 – 25")).toBe("2024-25");
    expect(fiscalYearOf("1999-00")).toBe("1999-00");
  });

  it("rejects years that do not follow each other", () => {
    expect(fiscalYearOf("2024-26")).toBeNull();
    expect(fiscalYearOf("2024")).toBeNull();
    expect(fiscalYearOf(null)).toBeNull();
  });
});
