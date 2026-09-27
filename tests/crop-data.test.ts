/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Crop price comparisons (src/components/land-water/crop-data.ts): a
// "since the last market day" change compares the same crop, variety and
// mandi, a few days apart at most (Sept 2026 audit).
import { describe, expect, it } from "vitest";
import { MAX_PREVIOUS_DAY_GAP, previousDay, weekBefore } from "@/components/land-water/crop-data";
import type { CropPrice } from "@/hooks/useRealtimeData";

let n = 0;
const row = (commodity: string, variety: string | null, date: string, modalPrice: number, market = "Mumbai APMC"): CropPrice => ({
  id: `r${++n}`,
  commodity,
  variety,
  market,
  minPrice: modalPrice,
  maxPrice: modalPrice,
  modalPrice,
  date: `${date}T00:00:00.000Z`,
  source: "AGMARKNET / data.gov.in",
});

describe("previousDay", () => {
  it("never compares across a months-long gap (Mumbai green peas, 20 Apr vs 22 Jun)", () => {
    const latest = row("Green Peas", "White Fozi", "2026-06-22", 5000);
    const prices = [latest, row("Green Peas", "White Fozi", "2026-04-20", 11500)];
    expect(previousDay(prices, latest)).toBeUndefined();
  });

  it("never compares two varieties (Lucknow rice: Broken Rice vs Other)", () => {
    const latest = row("Rice", "Other", "2026-06-22", 6831.03, "Lucknow APMC");
    const prices = [latest, row("Rice", "Broken Rice", "2026-06-21", 3650, "Lucknow APMC")];
    expect(previousDay(prices, latest)).toBeUndefined();
  });

  it("finds the same variety at the same mandi a market day or a weekend earlier", () => {
    const latest = row("Tomato", "Local", "2026-06-22", 1200);
    const friday = row("Tomato", "Local", "2026-06-19", 1000);
    const other = row("Tomato", "Local", "2026-06-21", 900, "Vashi APMC");
    expect(previousDay([latest, other, friday], latest)).toBe(friday);
    expect(MAX_PREVIOUS_DAY_GAP).toBeGreaterThanOrEqual(3);
  });

  it("treats a missing variety and differently-cased names as the same", () => {
    const latest = row("Onion", null, "2026-06-22", 1500);
    const before = row("onion ", null, "2026-06-21", 1400);
    expect(previousDay([latest, before], latest)).toBe(before);
  });
});

describe("weekBefore", () => {
  it("compares the same variety only", () => {
    const latest = row("Rice", "Other", "2026-06-22", 6800);
    const otherVariety = row("Rice", "Broken Rice", "2026-06-15", 3650);
    const sameVariety = row("Rice", "Other", "2026-06-16", 6600);
    expect(weekBefore([latest, otherVariety], latest)).toBeUndefined();
    expect(weekBefore([latest, otherVariety, sameVariety], latest)).toBe(sameVariety);
  });
});
