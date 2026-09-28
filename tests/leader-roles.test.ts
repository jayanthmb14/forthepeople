/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Office from a Leader role (src/lib/leader-roles.ts), with the role
// spellings stored for the ten active districts (Sept 2026).
import { describe, expect, it } from "vitest";
import { isCollectorRole, isPoliceCommissionerRole, isSPRole } from "@/lib/leader-roles";

describe("isCollectorRole", () => {
  it("knows every title the district head goes by", () => {
    expect(isCollectorRole("District Collector, Chennai")).toBe(true);
    expect(isCollectorRole("Collector & District Magistrate, Hyderabad")).toBe(true);
    expect(isCollectorRole("Collector, Mumbai City (IAS)")).toBe(true);
    expect(isCollectorRole("District Magistrate, Lucknow")).toBe(true);
    expect(isCollectorRole("Deputy Commissioner, Mandya")).toBe(true);
  });

  it("is not fooled by police or additional posts", () => {
    expect(isCollectorRole("Deputy Commissioner of Police, South Division")).toBe(false);
    expect(isCollectorRole("Additional District Magistrate, Lucknow")).toBe(false);
    expect(isCollectorRole("Additional Divisional Commissioner, Pune Division")).toBe(false);
    expect(isCollectorRole("Municipal Commissioner, BMC (IAS)")).toBe(false);
  });
});

describe("police heads", () => {
  it("tells a Commissioner of Police from a Superintendent of Police", () => {
    expect(isPoliceCommissionerRole("Commissioner of Police, Pune City")).toBe(true);
    expect(isSPRole("Commissioner of Police, Pune City")).toBe(false);
    expect(isSPRole("Superintendent of Police, Pune Rural")).toBe(true);
    expect(isPoliceCommissionerRole("Superintendent of Police, Pune Rural")).toBe(false);
    expect(isSPRole("Senior Superintendent of Police, Agra")).toBe(true);
  });

  it("leaves deputy and additional posts out", () => {
    expect(isPoliceCommissionerRole("Deputy Commissioner of Police, Zone 1")).toBe(false);
    expect(isPoliceCommissionerRole("Additional Commissioner of Police, Traffic")).toBe(false);
    expect(isSPRole("Additional Superintendent of Police, Mandya")).toBe(false);
  });
});

describe("isHeadquartersMla — the MLA for the district's own seat", () => {
  it("matches Mandya's MLA and New Delhi's, not other seats", async () => {
    const { isHeadquartersMla } = await import("@/lib/leader-roles");
    expect(isHeadquartersMla({ role: "MLA, Mandya", constituency: "Mandya — 189" }, "mandya")).toBe(true);
    expect(isHeadquartersMla({ role: "MLA, New Delhi", constituency: "New Delhi — 40" }, "new-delhi")).toBe(true);
    expect(isHeadquartersMla({ role: "MLA, Maddur", constituency: "Maddur — 187" }, "mandya")).toBe(false);
    expect(isHeadquartersMla({ role: "MLA, Lucknow Central", constituency: "Lucknow Central" }, "lucknow")).toBe(false);
    expect(isHeadquartersMla({ role: "MP, Mandya", constituency: "Mandya" }, "mandya")).toBe(false);
    expect(isHeadquartersMla({ role: "MLA, Malavalli (SC)", constituency: "Malavalli (SC) — 186" }, "malavalli")).toBe(true);
  });
});

describe("isInChargeMinisterRole", () => {
  it("matches the district in-charge minister only", async () => {
    const { isInChargeMinisterRole } = await import("@/lib/leader-roles");
    expect(isInChargeMinisterRole("Minister in charge of Mandya district")).toBe(true);
    expect(isInChargeMinisterRole("Minister for Agriculture, Karnataka")).toBe(false);
    expect(isInChargeMinisterRole("Chief Minister of Karnataka")).toBe(false);
  });
});
