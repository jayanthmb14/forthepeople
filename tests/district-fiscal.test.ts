/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { isPastFiscalYear } from "@/components/district/shell/fiscal";

const at = (iso: string) => new Date(iso).getTime();

describe("isPastFiscalYear", () => {
  it("flags a financial year that has ended", () => {
    expect(isPastFiscalYear("2024-25", at("2026-09-27T12:00:00Z"))).toBe(true);
    expect(isPastFiscalYear("2025-26", at("2026-04-01T00:00:00Z"))).toBe(true);
  });
  it("does not flag the current financial year", () => {
    expect(isPastFiscalYear("2026-27", at("2026-09-27T12:00:00Z"))).toBe(false);
    expect(isPastFiscalYear("2025-26", at("2026-03-31T12:00:00Z"))).toBe(false);
  });
  it("is false when it cannot tell", () => {
    expect(isPastFiscalYear(null, at("2026-09-27T12:00:00Z"))).toBe(false);
    expect(isPastFiscalYear("FY unknown", at("2026-09-27T12:00:00Z"))).toBe(false);
    expect(isPastFiscalYear("2024-25", 0)).toBe(false);
  });
});
