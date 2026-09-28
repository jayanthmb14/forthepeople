/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Stored GePNIC tenders past their closing date must become BID_CLOSED on
// every run, by date — not only for bodies on today's "Tenders by
// Organisation" list that the run reached in time (a body whose last
// tender closed drops off that list, and its tenders stayed "Open").
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn<(...a: unknown[]) => Promise<{ count: number }>>(async () => ({ count: 3 }));
vi.mock("@/lib/db", () => ({
  prisma: { tender: { updateMany: (...a: unknown[]) => updateMany(...a) } },
}));

import { collectGepnicTenders } from "@/scraper/jobs/gepnic-tenders";
import { GEPNIC_HOSTS, GEPNIC_PORTALS } from "@/scraper/lib/gepnic";

describe("GEPNIC_HOSTS", () => {
  it("lists every portal host once", () => {
    const hosts = Object.values(GEPNIC_PORTALS).map((p) => p.host);
    expect([...GEPNIC_HOSTS].sort()).toEqual([...new Set(hosts)].sort());
    expect(GEPNIC_HOSTS).toContain("mahatenders.gov.in");
  });
});

describe("collectGepnicTenders closing sweep", () => {
  beforeEach(() => updateMany.mockClear());

  it("closes past-deadline tenders on every portal even when no body was read", async () => {
    const before = Date.now();
    const out = await collectGepnicTenders(
      [{ id: "d1", slug: "mandya", name: "Mandya", stateSlug: "karnataka", stateName: "Karnataka" }],
      { deadlineMs: Date.now() + 60_000, log: () => {} },
    );
    expect(out.notCovered).toEqual(["mandya"]);
    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0][0] as {
      where: { sourcePortal: { in: string[] }; status: string; bidSubmissionEnd: { lt: Date } };
      data: { status: string; statusChangedAt: Date };
    };
    expect(arg.where.sourcePortal.in).toEqual(GEPNIC_HOSTS);
    expect(arg.where.status).toBe("OPEN_FOR_BIDS");
    expect(arg.where.bidSubmissionEnd.lt.getTime()).toBeGreaterThanOrEqual(before);
    expect(arg.data.status).toBe("BID_CLOSED");
    expect(out.closed).toBe(3);
  });
});
