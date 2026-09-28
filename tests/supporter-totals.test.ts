/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// supporterTotals (src/lib/supporter-totals.ts): one aggregate over
// successful payments, replacing five "load every row and add in JS" copies.
import { beforeEach, describe, expect, it, vi } from "vitest";

const aggregate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { supporter: { aggregate } } }));

import { supporterTotals } from "@/lib/supporter-totals";

beforeEach(() => aggregate.mockReset());

describe("supporterTotals", () => {
  it("sums successful payments all-time", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: 1500 }, _count: 3 });
    expect(await supporterTotals()).toEqual({ amount: 1500, count: 3 });
    expect(aggregate).toHaveBeenCalledWith({ where: { status: "success" }, _sum: { amount: true }, _count: true });
  });

  it("limits to payments since a date", async () => {
    const since = new Date("2026-09-21T00:00:00Z");
    aggregate.mockResolvedValue({ _sum: { amount: 499 }, _count: 1 });
    expect(await supporterTotals(since)).toEqual({ amount: 499, count: 1 });
    expect(aggregate).toHaveBeenCalledWith({
      where: { status: "success", createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    });
  });

  it("gives 0 (not null) when there are no payments", async () => {
    aggregate.mockResolvedValue({ _sum: { amount: null }, _count: 0 });
    expect(await supporterTotals()).toEqual({ amount: 0, count: 0 });
  });
});
