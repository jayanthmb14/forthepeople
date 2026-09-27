/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// AGMARKNET record checks (src/scraper/lib/agmarknet.ts): only sane,
// complete price records are stored; everything else is counted and dropped.
import { describe, expect, it } from "vitest";
import { cropPriceProblems, isRetryableStatus, parseArrivalDate, toCropRow } from "@/scraper/lib/agmarknet";

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

describe("isRetryableStatus", () => {
  it("retries gateway errors only", () => {
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
  });
});
