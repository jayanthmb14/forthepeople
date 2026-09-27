/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * "N days ago" counts calendar days in IST (src/lib/utils/timeAgo.ts), so
 * the overview and the home price ticker agree (Sept 2026 audit: 97 vs 98).
 */
import { describe, expect, it } from "vitest";
import { calendarDaysAgoIST } from "../src/lib/utils/timeAgo";

describe("calendarDaysAgoIST", () => {
  it("counts 22 Jun → 28 Sep 2026 as 98 days at any hour of 28 Sep (IST)", () => {
    const day = "2026-06-22T00:00:00.000Z";
    expect(calendarDaysAgoIST(day, Date.parse("2026-09-28T00:30:00+05:30"))).toBe(98);
    expect(calendarDaysAgoIST(day, Date.parse("2026-09-28T23:30:00+05:30"))).toBe(98);
  });

  it("reads a late-evening UTC timestamp as the next IST day", () => {
    // 21 Jun 20:00 UTC = 22 Jun 01:30 IST
    expect(calendarDaysAgoIST("2026-06-21T20:00:00Z", Date.parse("2026-06-22T12:00:00+05:30"))).toBe(0);
  });

  it("is null for no date and never negative", () => {
    expect(calendarDaysAgoIST(null)).toBeNull();
    expect(calendarDaysAgoIST("not a date")).toBeNull();
    expect(calendarDaysAgoIST("2026-10-01T00:00:00Z", Date.parse("2026-09-28T12:00:00+05:30"))).toBe(0);
  });
});
