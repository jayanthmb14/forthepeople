/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "About N of every 10 homes have a tap" (src/components/land-water/tap-share.ts).
import { describe, expect, it } from "vitest";
import { tapShare } from "@/components/land-water/tap-share";

describe("tapShare", () => {
  it("never says '10 of every 10' while homes still wait (Lucknow 98.3 %, Sept 2026 audit)", () => {
    expect(tapShare(246351, 250572)).toEqual({ per: 100, n: 98 });
    expect(tapShare(9996, 10000)).toEqual({ per: 100, n: 99 });
  });

  it("says '10 of every 10' only when every home has a tap", () => {
    expect(tapShare(500, 500)).toEqual({ per: 10, n: 10 });
  });

  it("uses tenths in between, and per 100 instead of a false 0", () => {
    expect(tapShare(82, 100)).toEqual({ per: 10, n: 8 });
    expect(tapShare(3, 100)).toEqual({ per: 100, n: 3 });
    expect(tapShare(0, 100)).toEqual({ per: 10, n: 0 });
    expect(tapShare(0, 0)).toEqual({ per: 10, n: 0 });
  });
});
