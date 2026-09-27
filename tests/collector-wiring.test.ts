/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The portal collectors (src/scraper/lib/collector-registry.ts) must show
// up as "collected automatically" on the "Where our data comes from" page
// and in the freshness rules, with the same cron — so the page cannot say
// "entered by hand" for data a collector fetches, or the reverse.
// Also: how an MGNREGA lakh count is shown ("0.00 lakh" is never "0").
import { describe, expect, it } from "vitest";
import { PORTAL_COLLECTORS } from "@/scraper/lib/collector-registry";
import { DATASETS, RURAL_SCHEME_DISTRICTS, collectionFor } from "@/lib/constants/dataset-collection";
import { MODULE_FRESHNESS } from "@/lib/constants/sidebar-modules";
import { countDisplay, lakhDisplay } from "@/lib/mgnrega-display";

/** Registry key → the dataset key on the data-sources page. */
const DATASET_OF: Record<string, string> = { jjm: "jjm", schools: "schools", mgnrega: "panchayats" };

describe("portal collectors ↔ data-sources page", () => {
  for (const c of PORTAL_COLLECTORS.filter((x) => DATASET_OF[x.key])) {
    it(`${c.key}: automatic, same cron, freshness rule is auto`, () => {
      const d = DATASETS.find((x) => x.key === DATASET_OF[c.key]);
      expect(d, `no dataset for ${c.key}`).toBeDefined();
      expect(d!.collection).toBe("auto");
      expect(d!.cron).toBe(c.cronPath);
      expect(d!.slug).toBe(c.module);
      expect(MODULE_FRESHNESS[c.module]?.method).toBe("auto");
    });
  }

  it("rural-only collectors fall back for urban districts", () => {
    const jjm = DATASETS.find((x) => x.key === "jjm")!;
    for (const slug of RURAL_SCHEME_DISTRICTS) expect(collectionFor(jjm, slug)).toBe("auto");
    expect(collectionFor(jjm, "mumbai")).not.toBe("auto");
  });
});

describe("MGNREGA lakh counts", () => {
  it("shows a printed 0.00 lakh as fewer than 1,000, never 0", () => {
    expect(lakhDisplay(0)).toEqual({ kind: "fewer" });
    expect(lakhDisplay(0.004)).toEqual({ kind: "fewer" });
  });
  it("keeps real figures in lakh", () => {
    expect(lakhDisplay(1.92)).toEqual({ kind: "lakh", lakh: 1.92 });
    expect(lakhDisplay(0.01)).toEqual({ kind: "lakh", lakh: 0.01 });
  });
  it("leaves a missing figure out", () => {
    expect(lakhDisplay(null)).toEqual({ kind: "none" });
    expect(lakhDisplay(undefined)).toEqual({ kind: "none" });
    expect(lakhDisplay(Number.NaN)).toEqual({ kind: "none" });
    expect(lakhDisplay(-1)).toEqual({ kind: "none" });
  });
  it("rounds plain counts and drops missing ones", () => {
    expect(countDisplay(233)).toBe(233);
    expect(countDisplay(null)).toBeNull();
  });
});
