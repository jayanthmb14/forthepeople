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
