/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { getModuleSources, getStateConfig, getStateConfigForDistrict } from "@/lib/constants/state-config";

describe("getStateConfig per district", () => {
  it("does not give Pune Mumbai's settings", () => {
    const pune = getStateConfig("maharashtra", "pune")!;
    expect(pune.gramPanchayatApplicable).toBe(true);
    expect(pune.jjmApplicable).toBe(true);
    expect(pune.showVillages).toBe(true);
    expect(pune.discomName).not.toMatch(/BEST|Adani/);
    expect(pune.municipalBody).not.toBe("BMC");
    expect(pune.waterBoard ?? "").not.toMatch(/BMC/);
  });

  it("keeps Mumbai fully urban", () => {
    const mumbai = getStateConfig("maharashtra", "mumbai")!;
    expect(mumbai.gramPanchayatApplicable).toBe(false);
    expect(mumbai.jjmApplicable).toBe(false);
    expect(mumbai.municipalBody).toBe("BMC");
    expect(mumbai.discomName).toMatch(/BEST/);
  });

  it("uses state-wide values when no district is given", () => {
    const mh = getStateConfig("maharashtra")!;
    expect(mh.gramPanchayatApplicable).toBe(true);
    expect(mh.discomName).toMatch(/MSEDCL/);
  });

  it("gives Mandya and Mysuru their own power company", () => {
    expect(getStateConfig("karnataka", "mandya")!.discomName).toBe("CESC");
    expect(getStateConfigForDistrict("mysuru", "karnataka")!.discomName).toBe("CESC");
    expect(getStateConfig("karnataka", "bengaluru-urban")!.discomName).toBe("BESCOM");
  });

  it("falls back to the state for districts without overrides and to null for unknown states", () => {
    expect(getStateConfig("telangana", "hyderabad")).toBe(getStateConfig("telangana"));
    expect(getStateConfig("nowhere", "x")).toBeNull();
  });

  it("names the district's power company in module sources", () => {
    expect(getModuleSources("power", "maharashtra", "pune").sources[0]).toMatch(/MSEDCL/);
    expect(getModuleSources("power", "maharashtra", "mumbai").sources[0]).toMatch(/BEST/);
  });
});
