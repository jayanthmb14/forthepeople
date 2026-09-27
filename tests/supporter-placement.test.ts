/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Where a supporter's name is shown (src/components/support/placement.ts).
 */
import { describe, expect, it } from "vitest";
import { isFoundingBuilder, placeSupporters, placementLevel } from "@/components/support/placement";

describe("placementLevel", () => {
  it("puts a one-time ₹50,000 founder gift on the All-India row", () => {
    expect(placementLevel({ id: "f", name: "Founder", tier: "founder", amount: 50000, isRecurring: false })).toBe("india");
    expect(placementLevel({ id: "x", name: "Big gift", tier: "custom", amount: 12000, isRecurring: false })).toBe("india");
  });
  it("uses the tier for monthly supporters (amount hidden by the API)", () => {
    expect(placementLevel({ id: "p", name: "P", tier: "patron", amount: null, isRecurring: true })).toBe("india");
    expect(placementLevel({ id: "s", name: "S", tier: "state", amount: null, isRecurring: true })).toBe("state");
    expect(placementLevel({ id: "d", name: "D", tier: "district", amount: null, isRecurring: true })).toBe("district");
  });
  it("uses the amount for one-time gifts", () => {
    expect(placementLevel({ id: "a", name: "A", tier: "custom", amount: 2500 })).toBe("state");
    expect(placementLevel({ id: "b", name: "B", tier: "custom", amount: 150 })).toBe("district");
  });
});

describe("placeSupporters", () => {
  it("lists the founder first, dedupes names and counts anonymous supporters", () => {
    const rows = placeSupporters([
      { id: "1", name: "Asha", tier: "patron", amount: null },
      { id: "2", name: "Micah", tier: "founder", amount: 50000 },
      { id: "3", name: "Anonymous", tier: "district", amount: null },
      { id: "4", name: "Preethaam", tier: "district", amount: null },
      { id: "5", name: "preethaam ", tier: "district", amount: 199 },
      { id: "6", name: "Ravi", tier: "state", amount: null },
    ]);
    expect(rows.india.named.map((s) => s.name)).toEqual(["Micah", "Asha"]);
    expect(rows.state.named.map((s) => s.name)).toEqual(["Ravi"]);
    expect(rows.district.named.map((s) => s.name)).toEqual(["Preethaam"]);
    expect(rows.district.anonymous).toBe(1);
  });
  it("marks founder gifts", () => {
    expect(isFoundingBuilder({ id: "x", name: "X", tier: "custom", amount: 50000 })).toBe(true);
    expect(isFoundingBuilder({ id: "y", name: "Y", tier: "patron", amount: null })).toBe(false);
  });
});
