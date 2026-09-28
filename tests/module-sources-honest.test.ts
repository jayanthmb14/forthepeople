/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The "Check this data" panel and the stale notice must name the source the
// rows really came from (Sept 2026 review): tenders come only from the
// state GePNIC portals the collector reads, and police stations from state
// police websites, never NCRB.
import { describe, expect, it } from "vitest";
import { getModuleSources } from "@/lib/constants/state-config";
import { GEPNIC_PORTALS as LIB_PORTALS } from "@/scraper/lib/gepnic";
import { GEPNIC_PORTALS, tenderPortalFor } from "@/lib/constants/tender-portals";
import { modulePortal, moduleSourceNames } from "@/components/district/shell/sources";

describe("tender sources", () => {
  it("names the state's GePNIC portal, linked to its app page", () => {
    const mh = getModuleSources("tenders", "maharashtra", "pune");
    expect(mh.sources).toEqual(["mahatenders.gov.in"]);
    expect(mh.links?.["mahatenders.gov.in"]).toBe("https://mahatenders.gov.in/nicgep/app");
    expect(moduleSourceNames("tenders", "delhi", "new-delhi")).toEqual(["govtprocurement.delhi.gov.in"]);
  });

  it("names no source where no collector reads the state", () => {
    expect(getModuleSources("tenders", "karnataka", "mandya").sources).toEqual([]);
    expect(getModuleSources("tenders", "telangana", "hyderabad").sources).toEqual([]);
  });

  it("never names the portals that supplied no row", () => {
    for (const state of ["karnataka", "maharashtra", "tamil-nadu", "west-bengal", "delhi"]) {
      const text = getModuleSources("tenders", state).sources.join(" ");
      expect(text).not.toMatch(/KPPP|CPPP|IREPS|defproc|BEL eProc|TenderWizard/);
    }
  });

  it("links 'check it yourself' to the state portal, or to nothing", () => {
    expect(modulePortal("tenders", "tamil-nadu", "chennai")).toBe("https://tntenders.gov.in/nicgep/app");
    expect(modulePortal("tenders", "karnataka", "mandya")).toBeNull();
    expect(modulePortal("tenders", "west-bengal", "kolkata")).not.toMatch(/eprocure\.gov\.in/);
  });

  it("uses one portal list for the collector and the panels", () => {
    expect(LIB_PORTALS).toBe(GEPNIC_PORTALS);
    expect(tenderPortalFor("maharashtra")?.host).toBe("mahatenders.gov.in");
    expect(tenderPortalFor("karnataka")).toBeNull();
  });
});

describe("police sources", () => {
  it("names state police websites and links nowhere (not NCRB)", () => {
    expect(moduleSourceNames("police", "karnataka", "mandya")).toEqual(["State police websites"]);
    expect(modulePortal("police", "karnataka", "mandya")).toBeNull();
    expect(modulePortal("police", "maharashtra", "pune") ?? "").not.toMatch(/ncrb/);
  });
});

describe("tender switch follows the collector", () => {
  it("is possible only where the collector reads the district", async () => {
    const { tendersCollectedFor, GEPNIC_ORGS } = await import("@/lib/constants/tender-portals");
    for (const [state, district] of [["maharashtra", "pune"], ["maharashtra", "mumbai"], ["tamil-nadu", "chennai"], ["west-bengal", "kolkata"], ["delhi", "new-delhi"]]) {
      expect(tendersCollectedFor(state, district)).toBe(true);
    }
    // The old KPPP pilot districts: switched on in the DB, read by nothing.
    for (const district of ["bengaluru-urban", "mandya", "mysuru"]) {
      expect(tendersCollectedFor("karnataka", district)).toBe(false);
    }
    // A followed body in a state without a portal would not count either.
    expect(tendersCollectedFor("karnataka", "pune")).toBe(false);
    expect(Object.keys(GEPNIC_ORGS).length).toBeGreaterThan(0);
  });
});
