/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Election results that are behind a newer election (src/lib/freshness.ts).
import { describe, expect, it } from "vitest";
import { electionResultsBehind } from "@/lib/freshness";

const NOW = new Date("2026-09-28T00:00:00Z");

describe("electionResultsBehind (Sept 2026 audit)", () => {
  it("is late when an assembly election declared results after our newest year", () => {
    // West Bengal / Tamil Nadu: results 3 May 2026, we hold 2024 (Lok Sabha).
    expect(electionResultsBehind(2024, new Date("2026-05-03T18:30:00Z"), NOW)).toBe(147);
  });

  it("is not late when our results cover the latest election", () => {
    expect(electionResultsBehind(2024, new Date("2024-06-03T18:30:00Z"), NOW)).toBeNull();
    expect(electionResultsBehind(2025, new Date("2025-02-04T18:30:00Z"), NOW)).toBeNull();
  });

  it("ignores elections whose results are still to come", () => {
    expect(electionResultsBehind(2024, new Date("2026-11-20T00:00:00Z"), NOW)).toBeNull();
    expect(electionResultsBehind(2024, null, NOW)).toBeNull();
  });
});
