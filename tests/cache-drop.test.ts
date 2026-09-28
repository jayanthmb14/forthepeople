/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// dropModuleCaches (src/lib/cache.ts): the one way a writer clears a
// district's cached /api/data responses (it replaced 17 inline deletes).
import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn());
vi.mock("@/lib/redis", () => ({ default: { del }, redis: { del } }));

import { cacheKey, dropModuleCaches } from "@/lib/cache";

// Block body: a function returned from beforeEach would run as a teardown.
beforeEach(() => {
  del.mockReset();
});

describe("dropModuleCaches", () => {
  it("deletes each module's key for the district in one call", async () => {
    del.mockResolvedValue(2);
    expect(await dropModuleCaches("mandya", ["alerts", "overview"])).toBe(true);
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(cacheKey("mandya", "alerts"), cacheKey("mandya", "overview"));
  });

  it("also deletes the translated copies when locales are given", async () => {
    del.mockResolvedValue(3);
    await dropModuleCaches("pune", ["news"], { locales: ["hi", "kn"] });
    expect(del).toHaveBeenCalledWith("ftp:pune:news", "ftp:pune:news@hi", "ftp:pune:news@kn");
  });

  it("never throws; reports false when Redis refuses", async () => {
    del.mockRejectedValue(new Error("down"));
    expect(await dropModuleCaches("mysuru", ["weather"])).toBe(false);
  });

  it("does nothing for an empty module list", async () => {
    expect(await dropModuleCaches("mysuru", [])).toBe(true);
    expect(del).not.toHaveBeenCalled();
  });
});
