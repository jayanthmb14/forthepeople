/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { NOT_STUB_TENDER, TENDER_STUB_MARKER, VERIFIED_SUGAR_SEASON, VERIFIED_SUGAR_SEASON_SOURCES } from "@/lib/data-filters";

describe("tender stub filter", () => {
  it("drops the seed's placeholder marker but keeps rows with no snapshot", () => {
    expect(TENDER_STUB_MARKER).toBe("STUB_PENDING_SCRAPER_VERIFICATION");
    expect(NOT_STUB_TENDER).toEqual({ OR: [{ rawHtmlSnapshot: null }, { NOT: { rawHtmlSnapshot: TENDER_STUB_MARKER } }] });
  });
});

describe("sugar season filter", () => {
  it("shows no season row until a collector label is listed (seeded seasons are hidden)", () => {
    expect(VERIFIED_SUGAR_SEASON_SOURCES).not.toContain("Karnataka Sugar Directorate");
    expect(VERIFIED_SUGAR_SEASON).toEqual({ source: { in: VERIFIED_SUGAR_SEASON_SOURCES } });
  });
});
