/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it, vi } from "vitest";

// health-score.ts imports the Prisma client; the helpers under test are pure.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/scraper/lib/district-snapshot", () => ({ readDistrictSnapshot: async () => null }));

import { getDistrictType } from "@/lib/health-score";

describe("getDistrictType (which report-card weights a district gets)", () => {
  it("uses the Census urban share first", () => {
    // Mandya: 1.8 M people but 17 % urban — rural, not "urban" (Sept 2026 audit).
    expect(getDistrictType(1_805_769, 364, 17.08)).toBe("rural");
    // Chennai, Kolkata, Hyderabad, New Delhi: all-urban districts are metros.
    expect(getDistrictType(4_646_732, 26_553, 100)).toBe("metro");
    expect(getDistrictType(142_004, 4_057, 100)).toBe("metro");
    // Mysuru: 41.5 % urban.
    expect(getDistrictType(3_001_127, 476, 41.5)).toBe("urban");
    // Pune: 61 % urban but 9.4 M people.
    expect(getDistrictType(9_429_408, 603, 60.89)).toBe("metro");
  });

  it("falls back to population and density without an urban share", () => {
    expect(getDistrictType(null, null, null)).toBe("rural");
    expect(getDistrictType(undefined, undefined)).toBe("rural");
    expect(getDistrictType(6_000_000, 100, null)).toBe("metro");
    expect(getDistrictType(2_000_000, 100, null)).toBe("urban");
    expect(getDistrictType(800_000, 600, null)).toBe("semi-urban");
  });
});
