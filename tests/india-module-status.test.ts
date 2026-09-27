/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Module status rule (src/lib/india/module-status.ts).
 */
import { describe, expect, it } from "vitest";
import { moduleStatusMismatches } from "@/lib/india/module-status";

describe("moduleStatusMismatches", () => {
  const mods = [
    { slug: "a", status: "live" as const, contentType: "data" as const },
    { slug: "b", status: "coming_soon" as const, contentType: "data" as const },
    { slug: "c", status: "live" as const, contentType: "data" as const },
    { slug: "d", status: "planned" as const, contentType: "editorial" as const },
  ];
  it("flags live-without-figures and soon-with-figures; ignores editorial modules", () => {
    expect(moduleStatusMismatches(mods, new Set(["b", "c", "d"]))).toEqual([
      { slug: "a", status: "live", shouldBe: "coming_soon" },
      { slug: "b", status: "coming_soon", shouldBe: "live" },
    ]);
  });
  it("is empty when labels match", () => {
    expect(moduleStatusMismatches(mods, new Set(["a", "c"]))).toEqual([]);
  });
});
