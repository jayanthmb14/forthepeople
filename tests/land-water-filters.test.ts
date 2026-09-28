/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Land & water "verified or hidden" filters (src/lib/data-filters.ts,
// Sept 2026 audit): what the crops and alerts pages may show.
import { describe, expect, it } from "vitest";
import { OFFICIAL_ALERTS, SHOWN_CROP_PRICE, bySeverity, shownCropPrices } from "@/lib/data-filters";
import { SACHET_SOURCE_PREFIX } from "@/scraper/lib/sachet";

describe("SHOWN_CROP_PRICE / shownCropPrices", () => {
  it("hides seed rows, sub-₹1/kg figures and livestock / per-nut / per-stem commodities", () => {
    expect(SHOWN_CROP_PRICE.arrivalQty).toBeNull();
    expect(SHOWN_CROP_PRICE.minPrice.gte).toBe(100);
    expect(SHOWN_CROP_PRICE.commodity.notIn).toEqual(expect.arrayContaining(["Ox", "Coconut", "Tender Coconut", "Tulip"]));
  });

  it("adds no mandi filter where the AGMARKNET district is the same as ours", () => {
    expect(shownCropPrices("mandya")).toBe(SHOWN_CROP_PRICE);
  });

  it("keeps only Bangalore APMC for Bengaluru Urban and no mandi for New Delhi", () => {
    expect(shownCropPrices("bengaluru-urban")).toEqual({
      AND: [
        SHOWN_CROP_PRICE,
        {
          OR: [
            { market: { contains: "Bangalore", mode: "insensitive" } },
            { market: { contains: "Bengaluru", mode: "insensitive" } },
            { market: { contains: "Binny Mill", mode: "insensitive" } },
          ],
        },
      ],
    });
    // An empty OR matches no row in Prisma.
    expect(shownCropPrices("new-delhi")).toEqual({ AND: [SHOWN_CROP_PRICE, { OR: [] }] });
  });
});

describe("OFFICIAL_ALERTS", () => {
  it("shows only warnings read from NDMA SACHET, never news stories", () => {
    expect(OFFICIAL_ALERTS).toEqual({ sourceUrl: { startsWith: SACHET_SOURCE_PREFIX } });
  });
});

describe("bySeverity (alerts page and glance row)", () => {
  it("puts the most serious warning first, whatever the case, unknown levels last", () => {
    const rows = [
      { id: "a", severity: "medium" }, { id: "b", severity: "CRITICAL" }, { id: "c", severity: null },
      { id: "d", severity: "info" }, { id: "e", severity: "Severe" }, { id: "f", severity: "low" }, { id: "g", severity: "high" },
    ];
    expect([...rows].sort(bySeverity).map((r) => r.id)).toEqual(["b", "e", "g", "a", "f", "d", "c"]);
  });
});
