/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// After a payment or an admin edit, every supporter list must be cleared —
// also the per-district and per-state sponsor lists, which only one of the
// seven writers used to clear (the rest lagged up to 2 minutes).
// Redis is replaced by an in-memory fake; nothing leaves the process.
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Set<string>();
/** What a SCAN walk saw at its start, per pattern (like Redis, deletes do not shift the walk). */
const walks = new Map<string, string[]>();
const fake = {
  del: vi.fn(async (...keys: string[]) => keys.filter((k) => store.delete(k)).length),
  // Two pages, to check the cursor walk.
  scan: vi.fn(async (cursor: string, opts: { match: string }) => {
    const re = new RegExp("^" + opts.match.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    if (cursor === "0") walks.set(opts.match, [...store].filter((k) => re.test(k)).sort());
    const all = walks.get(opts.match) ?? [];
    const half = Math.ceil(all.length / 2);
    return cursor === "0" ? ["7", all.slice(0, half)] : ["0", all.slice(half)];
  }),
};
vi.mock("@/lib/redis", () => ({ redis: fake, default: fake }));

const { CONTRIBUTOR_CACHE_KEYS, CONTRIBUTOR_KEYS, bustSupporterCaches } = await import("@/lib/supporter-cache");

describe("bustSupporterCaches", () => {
  beforeEach(() => {
    store.clear();
    fake.del.mockClear();
    fake.scan.mockClear();
  });

  it("clears the fixed lists and every per-district and per-state list, nothing else", async () => {
    for (const k of CONTRIBUTOR_CACHE_KEYS) store.add(k);
    store.add(CONTRIBUTOR_KEYS.district("mandya", "karnataka"));
    store.add(CONTRIBUTOR_KEYS.district("agra", "uttar-pradesh"));
    store.add(CONTRIBUTOR_KEYS.statePage("karnataka"));
    store.add("ftp:mandya:crops");
    store.add("admin:session:abc");

    await bustSupporterCaches();

    expect([...store].sort()).toEqual(["admin:session:abc", "ftp:mandya:crops"]);
  });

  it("never throws when Redis fails", async () => {
    fake.del.mockRejectedValueOnce(new Error("down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(bustSupporterCaches()).resolves.toBeUndefined();
    err.mockRestore();
  });
});
