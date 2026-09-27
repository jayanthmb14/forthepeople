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

describe("getModuleSources links", () => {
  it("gives official links for known source names and the district's power company", () => {
    expect(getModuleSources("courts", "karnataka").links?.["NJDG (National Judicial Data Grid)"]).toBe("https://njdg.ecourts.gov.in");
    const power = getModuleSources("power", "maharashtra", "pune");
    expect(power.links?.[power.sources[0]]).toBe("https://www.mahadiscom.in");
    expect(getModuleSources("unknown-module", "karnataka").links).toBeUndefined();
  });
});

describe("Sept 2026 audit (land & water)", () => {
  it("names the power companies and water suppliers that actually serve the district", () => {
    expect(getStateConfig("tamil-nadu", "chennai")!.discomFullName).toMatch(/Tamil Nadu Power Distribution Corporation Limited \(TNPDCL\)/);
    const nd = getStateConfig("delhi", "new-delhi")!;
    expect(nd.discomFullName).toMatch(/New Delhi Municipal Council/);
    expect(nd.discomFullName).not.toMatch(/Yamuna|Tata Power/);
    expect(nd.waterBoard).toMatch(/NDMC/);
    expect(getModuleSources("power", "karnataka", "mandya").sources[0]).toMatch(/CESC/);
  });

  it("names only the sources the collectors read: no IMD for weather, no India-WRIS for dams", () => {
    expect(getModuleSources("weather", "karnataka").sources).toEqual(["OpenWeatherMap", "Open-Meteo"]);
    expect(getModuleSources("water", "karnataka", "mandya").sources).toEqual(["Karnataka Water Resources Department"]);
    expect(getModuleSources("weather", "karnataka").links?.OpenWeatherMap).toBe("https://openweathermap.org");
  });
});

// Sept 2026 audit: the population page lists only the sources it shows, and
// New Delhi district is not run by MCD alone.
describe("audit 2026-09 — people and services", () => {
  it("population sources name only the Census and the NITI MPI", () => {
    const s = getModuleSources("population", "karnataka", "mandya").sources.join(" | ");
    expect(s).toMatch(/Census of India 2011/);
    expect(s).not.toMatch(/NFHS|SRS|PLFS|Municipal/);
  });
  it("New Delhi's civic bodies are NDMC, the Cantonment Board and part of MCD", () => {
    expect(getStateConfig("delhi", "new-delhi")?.municipalBody).toMatch(/NDMC/);
    expect(getStateConfig("delhi")?.municipalBody).toBe("MCD");
 });
});
