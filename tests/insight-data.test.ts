/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "Is there anything to judge?" check before a paid insight call
// (src/lib/insight-data.ts).
import { describe, expect, it } from "vitest";
import { isEmptyModuleData } from "@/lib/insight-data";

describe("isEmptyModuleData", () => {
  it("treats missing and empty payloads as empty", () => {
    expect(isEmptyModuleData(null)).toBe(true);
    expect(isEmptyModuleData(undefined)).toBe(true);
    expect(isEmptyModuleData([])).toBe(true);
    expect(isEmptyModuleData({})).toBe(true);
    expect(isEmptyModuleData("  ")).toBe(true);
  });

  it("treats an object of empty lists as empty (police: stations, crime, traffic)", () => {
    expect(isEmptyModuleData({ stations: [], crime: [], traffic: [] })).toBe(true);
    expect(isEmptyModuleData({ current: null, forecast: [], extra: {} })).toBe(true);
  });

  it("treats any real value as data", () => {
    expect(isEmptyModuleData([{ temperature: 31 }])).toBe(false);
    expect(isEmptyModuleData({ stations: [], crime: [{ year: 2024 }] })).toBe(false);
    expect(isEmptyModuleData({ population: 0 })).toBe(false);
    expect(isEmptyModuleData({ name: "Pune" })).toBe(false);
  });
});
