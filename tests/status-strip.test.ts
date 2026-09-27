/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * The header status strip only says "Share market open/closed" and "Live
 * data refreshed …" when it is sure (src/components/home/status-strip.ts).
 */
import { describe, expect, it } from "vitest";
import { isNseHours, liveDataRefreshedAt, marketStatus } from "@/components/home/status-strip";
import type { DatasetFreshness } from "@/lib/freshness";

/** An IST wall-clock time as epoch ms. */
const ist = (s: string) => Date.parse(`${s}+05:30`);

describe("isNseHours", () => {
  it("is open 09:15–15:29 IST on weekdays", () => {
    expect(isNseHours(ist("2026-09-28T09:15:00"))).toBe(true); // Monday
    expect(isNseHours(ist("2026-09-28T15:29:00"))).toBe(true);
    expect(isNseHours(ist("2026-09-28T15:30:00"))).toBe(false);
    expect(isNseHours(ist("2026-09-28T09:14:00"))).toBe(false);
  });
  it("is closed at weekends", () => {
    expect(isNseHours(ist("2026-09-26T11:00:00"))).toBe(false); // Saturday
    expect(isNseHours(ist("2026-09-27T11:00:00"))).toBe(false); // Sunday
  });
});

describe("marketStatus", () => {
  const mon11 = ist("2026-09-28T11:00:00");

  it("says closed outside trading hours without any quote", () => {
    expect(marketStatus(ist("2026-09-27T21:47:00"), null)).toBe("closed");
    expect(marketStatus(ist("2026-09-28T08:00:00"), null)).toBe("closed");
  });

  it("says nothing in trading hours until the quote is known", () => {
    expect(marketStatus(mon11, null)).toBeNull();
  });

  it("says open when the newest quote is recent", () => {
    const q = { quoteAsOf: new Date(ist("2026-09-28T10:40:00")).toISOString(), fetchedAt: new Date(ist("2026-09-28T10:41:00")).toISOString() };
    expect(marketStatus(mon11, q)).toBe("open");
  });

  it("says closed on a trading holiday (fresh snapshot, quote from an earlier day)", () => {
    const q = { quoteAsOf: new Date(ist("2026-09-25T15:30:00")).toISOString(), fetchedAt: new Date(ist("2026-09-28T10:30:00")).toISOString() };
    expect(marketStatus(mon11, q)).toBe("closed");
  });

  it("says nothing when the snapshot is from before the session (could be cached)", () => {
    // Snapshot taken at 09:00, before the bell: the old quote proves nothing.
    const q = { quoteAsOf: new Date(ist("2026-09-25T15:30:00")).toISOString(), fetchedAt: new Date(ist("2026-09-28T09:00:00")).toISOString() };
    expect(marketStatus(ist("2026-09-28T09:40:00"), q)).toBeNull();
  });

  it("says nothing when the quote is missing", () => {
    expect(marketStatus(mon11, { quoteAsOf: null, fetchedAt: null })).toBeNull();
  });
});

function feed(key: string, status: DatasetFreshness["status"], lastChecked: string | null): DatasetFreshness {
  return {
    module: "x",
    key,
    primary: true,
    rows: 1,
    dataDate: lastChecked,
    period: null,
    periodKind: null,
    lastChecked,
    maxAgeHours: 6,
    every: "hourly",
    method: "auto",
    estimate: false,
    status,
    ageDays: 0,
    ageHours: 0,
    lateByDays: null,
  } as DatasetFreshness;
}

describe("liveDataRefreshedAt", () => {
  const now = Date.parse("2026-09-28T06:00:00Z");

  it("returns the OLDEST check when every live feed is current", () => {
    const got = liveDataRefreshedAt(
      [feed("weather", "current", "2026-09-28T05:50:00Z"), feed("news", "current", "2026-09-28T04:00:00Z"), feed("budget", "late", null)],
      now,
    );
    expect(got).toBe("2026-09-28T04:00:00.000Z");
  });

  it("returns null when any live feed is late", () => {
    expect(liveDataRefreshedAt([feed("weather", "current", "2026-09-28T05:50:00Z"), feed("dams", "late", "2026-04-01T00:00:00Z")], now)).toBeNull();
  });

  it("ignores feeds that are not collected for the district", () => {
    expect(liveDataRefreshedAt([feed("weather", "current", "2026-09-28T05:50:00Z"), feed("mandi", "not_collected", null)], now)).toBe(
      "2026-09-28T05:50:00.000Z",
    );
  });

  it("returns null with no live feeds, or a feed without a check time", () => {
    expect(liveDataRefreshedAt([], now)).toBeNull();
    expect(liveDataRefreshedAt([feed("weather", "current", null)], now)).toBeNull();
  });
});
