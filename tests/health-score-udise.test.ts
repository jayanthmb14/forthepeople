/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it, vi } from "vitest";

// health-score.ts imports the Prisma client; the helper under test is pure.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/scraper/lib/district-snapshot", () => ({ readDistrictSnapshot: async () => null }));

import { udiseSchoolInfraPct } from "@/lib/health-score";
import type { UdiseSnapshotData } from "@/scraper/lib/udise";

const part = (schools: number, toilet: number | null, library: number | null) =>
  ({ schools, facilitiesPct: { toiletFunctional: toilet, libraryOrReadingCorner: library } }) as unknown as UdiseSnapshotData["parts"][number];

describe("udiseSchoolInfraPct (report card: school facilities from UDISE+)", () => {
  it("averages working toilets and libraries, weighted by schools", () => {
    const data = { parts: [part(3000, 100, 90), part(1000, 90, 70)] } as unknown as UdiseSnapshotData;
    // (95 × 3000 + 80 × 1000) / 4000 = 91.25
    expect(udiseSchoolInfraPct(data)).toBeCloseTo(91.25, 5);
  });

  it("is null without UDISE+ figures (never 0 %)", () => {
    expect(udiseSchoolInfraPct(null)).toBeNull();
    expect(udiseSchoolInfraPct({ parts: [part(100, null, 80)] } as unknown as UdiseSnapshotData)).toBeNull();
  });
});
