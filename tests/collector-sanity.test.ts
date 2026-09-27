/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Sanity checks the collectors run before writing anything
// (src/scraper/lib/sanity.ts). Rule: a missing or impossible value is
// never replaced by an invented one — the row is skipped instead.
import { describe, expect, it } from "vitest";
import { firstAmount, parseAmount } from "@/scraper/lib/sanity";

describe("parseAmount", () => {
  it("reads numbers and Indian-grouped strings", () => {
    expect(parseAmount(1234.5)).toBe(1234.5);
    expect(parseAmount("1,23,456")).toBe(123456);
    expect(parseAmount(" ₹ 2,500.75 ")).toBe(2500.75);
    expect(parseAmount("0")).toBe(0);
  });

  it("returns null for anything it cannot trust", () => {
    expect(parseAmount(undefined)).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("NA")).toBeNull();
    expect(parseAmount("12abc")).toBeNull();
    expect(parseAmount(-5)).toBeNull();
    expect(parseAmount(Number.NaN)).toBeNull();
  });
});

describe("firstAmount", () => {
  it("takes the first field that parses, in order", () => {
    expect(firstAmount({ released: "", disbursed: "900" }, ["released", "disbursed"])).toBe(900);
    expect(firstAmount({ released: "1000", disbursed: "900" }, ["released", "disbursed"])).toBe(1000);
  });

  it("never falls back to a derived figure", () => {
    // The old finance job filled a missing "released" with allocated × 0.85.
    expect(firstAmount({ allocated: "1000" }, ["released", "disbursed"])).toBeNull();
  });
});
