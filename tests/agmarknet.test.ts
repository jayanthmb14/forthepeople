/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// AGMARKNET record checks (src/scraper/lib/agmarknet.ts): only sane,
// complete price records are stored; everything else is counted and dropped.
import { describe, expect, it } from "vitest";
import { cropPriceProblems, isPricedPerQuintal, isRetryableStatus, parseArrivalDate, toCropRow } from "@/scraper/lib/agmarknet";

const NOW = Date.UTC(2026, 8, 27, 12, 0, 0);
const good = {
  commodity: "Tomato",
  variety: "Local",
  district: "Mandya",
  market: "Mandya",
  min_price: 800,
  max_price: 1400,
  modal_price: "1,100",
  arrival_date: "26/09/2026",
};

describe("parseArrivalDate", () => {
  it("reads dd/mm/yyyy as UTC midnight", () => {
    expect(parseArrivalDate("26/09/2026")?.toISOString()).toBe("2026-09-26T00:00:00.000Z");
  });
  it("rejects malformed and impossible dates", () => {
    expect(parseArrivalDate("2026-09-26")).toBeNull();
    expect(parseArrivalDate("31/02/2026")).toBeNull();
    expect(parseArrivalDate("")).toBeNull();
    expect(parseArrivalDate(undefined)).toBeNull();
  });
});

describe("cropPriceProblems", () => {
  it("passes a normal record", () => {
    expect(cropPriceProblems(800, 1400, 1100)).toEqual([]);
  });
  it("rejects zero, missing, out-of-order and absurd prices", () => {
    expect(cropPriceProblems(0, 1400, 1100)).toContain("a price is zero");
    expect(cropPriceProblems(null, 1400, 1100)).toEqual(["a price is missing"]);
    expect(cropPriceProblems(1200, 1400, 1100)).toContain("min ≤ modal ≤ max does not hold");
    expect(cropPriceProblems(800, 2_000_000, 1100)).toContain("price is absurdly high");
    expect(cropPriceProblems(10, 5000, 1000)).toContain("spread between min and max is absurd");
  });
  // v54/fix-national (₹50 floor on the modal price) merged with
  // v54/fix-land-water (₹100 floor on the minimum): one rule, the stricter
  // floor, so ₹40–60 a quintal is now rejected too.
  it("rejects per-bunch prices stored as per quintal (under ₹1 a kg)", () => {
    expect(cropPriceProblems(15, 15, 15)).toContain("price is below ₹1 a kg (not a per-quintal price)"); // Pune(Moshi) Onion Green
    expect(cropPriceProblems(4, 10, 7)).toContain("price is below ₹1 a kg (not a per-quintal price)");
    expect(cropPriceProblems(40, 60, 50)).toContain("price is below ₹1 a kg (not a per-quintal price)");
    expect(cropPriceProblems(100, 150, 120)).toEqual([]);
  });
});

describe("toCropRow", () => {
  it("builds a row from a good record", () => {
    const out = toCropRow(good, NOW);
    expect("row" in out && out.row).toMatchObject({
      commodity: "Tomato",
      variety: "Local",
      market: "Mandya",
      minPrice: 800,
      maxPrice: 1400,
      modalPrice: 1100,
    });
  });
  it("gives a reason instead of a row for a bad record", () => {
    expect(toCropRow({ ...good, modal_price: "0" }, NOW)).toEqual({ reason: "a price is zero" });
    expect(toCropRow({ ...good, market: " " }, NOW)).toEqual({ reason: "no commodity or market" });
    expect(toCropRow({ ...good, arrival_date: "30/09/2026" }, NOW)).toEqual({ reason: "arrival date is in the future" });
    expect(toCropRow({ ...good, max_price: undefined }, NOW)).toEqual({ reason: "a price is missing" });
  });
});

describe("prices that are not per quintal (Sept 2026 audit)", () => {
  it("rejects a price below ₹1 a kg — a per-bunch figure shown as ₹0/kg", () => {
    expect(cropPriceProblems(3, 10, 7)).toContain("price is below ₹1 a kg (not a per-quintal price)");
    expect(toCropRow({ ...good, commodity: "Spinach", min_price: 3, max_price: 10, modal_price: 7 }, NOW)).toEqual({
      reason: "price is below ₹1 a kg (not a per-quintal price)",
    });
    expect(cropPriceProblems(300, 900, 600)).toEqual([]);
  });
  it("rejects livestock, coconut by the 1,000 and cut flowers by the stem", () => {
    for (const c of ["Ox", "Cow", "Sheep", "Coconut", "Tender Coconut", "Tulip", " lotus "]) {
      expect(isPricedPerQuintal(c)).toBe(false);
    }
    expect(toCropRow({ ...good, commodity: "Ox", min_price: 70000, max_price: 90000, modal_price: 80000 }, NOW)).toEqual({
      reason: "not priced per quintal (livestock, by count or by stem)",
    });
  });
  it("keeps crops sold by weight, including loose flowers and copra", () => {
    for (const c of ["Tomato", "Copra", "Marigold(loose)", "Chrysanthemum(Loose)", "Rose(Loose))", "Arecanut(Betelnut/Supari)"]) {
      expect(isPricedPerQuintal(c)).toBe(true);
    }
  });
});

describe("isRetryableStatus", () => {
  it("retries gateway errors only", () => {
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
  });
});
