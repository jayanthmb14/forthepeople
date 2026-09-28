/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Tender red flags (src/lib/tenders/tender-redflags.ts). No database: the
// Prisma client is replaced by a small fake. Sept 2026 review: no job runs
// the red-flag computer, so the pages must say "not checked yet" rather than
// "0 flagged" — redFlagsComputed() is that signal.
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  tender: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  tenderRedFlag: { findFirst: vi.fn() },
  tenderBidder: { count: vi.fn() },
  tenderAward: { count: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: db }));

import { computeFlagsForTender, redFlagsComputed } from "@/lib/tenders/tender-redflags";

beforeEach(() => {
  vi.clearAllMocks();
  db.tender.findFirst.mockResolvedValue(null);
});

describe("redFlagsComputed", () => {
  it("is false while no flag was ever written (the check never ran)", async () => {
    db.tenderRedFlag.findFirst.mockResolvedValue(null);
    expect(await redFlagsComputed()).toBe(false);
  });

  it("is true once any flag exists", async () => {
    db.tenderRedFlag.findFirst.mockResolvedValue({ id: "f1" });
    expect(await redFlagsComputed()).toBe(true);
  });
});

describe("computeFlagsForTender", () => {
  const base = {
    id: "t1",
    title: "Road resurfacing ward 12",
    status: "OPEN_FOR_BIDS",
    procurementType: "OPEN",
    authorityId: "a1",
    categoryId: null,
    eligibility: null,
    estimatedValueInr: null,
    awards: [],
    authority: { id: "a1" },
  };

  it("flags a 10-day bid window as SHORT_WINDOW (GFR 173: 21 days)", async () => {
    db.tender.findUnique.mockResolvedValue({
      ...base,
      publishedAt: new Date("2026-09-01T05:30:00Z"),
      bidSubmissionEnd: new Date("2026-09-11T05:30:00Z"),
    });
    const flags = await computeFlagsForTender("t1");
    expect(flags.map((f) => f.flagType)).toEqual(["SHORT_WINDOW"]);
    expect(flags[0].referenceRule).toBe("GFR_173_MIN_21_DAYS");
    expect(flags[0].computedValue).toEqual({ actualDays: 10, baseline: 21 });
  });

  it("raises nothing for a 30-day open tender", async () => {
    db.tender.findUnique.mockResolvedValue({
      ...base,
      publishedAt: new Date("2026-09-01T05:30:00Z"),
      bidSubmissionEnd: new Date("2026-10-01T05:30:00Z"),
    });
    expect(await computeFlagsForTender("t1")).toEqual([]);
  });
});
