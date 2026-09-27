/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// District spellings used by outside sources (src/scraper/lib/district-aliases.ts).
import { describe, expect, it } from "vitest";
import {
  agmarknetDistrictNames,
  agmarknetMarketsInDistrict,
  alertDistrictNames,
  isMarketInDistrict,
  mentionsName,
  weatherCityName,
} from "@/scraper/lib/district-aliases";

describe("agmarknetDistrictNames", () => {
  it("tries the old and new spellings, then the district's own name", () => {
    expect(agmarknetDistrictNames("bengaluru-urban", "Bengaluru Urban")).toEqual([
      "Bangalore",
      "Bengaluru Urban",
      "Bangalore Urban",
      "Bengaluru",
    ]);
    expect(agmarknetDistrictNames("mysuru", "Mysuru")).toEqual(["Mysore", "Mysuru"]);
  });

  it("falls back to the district name for districts without aliases", () => {
    expect(agmarknetDistrictNames("tumakuru", "Tumakuru")).toEqual(["Tumakuru"]);
  });
});

describe("weatherCityName / alertDistrictNames", () => {
  it("uses the city OpenWeather knows", () => {
    expect(weatherCityName("bengaluru-urban", "Bengaluru Urban")).toBe("Bangalore");
    expect(weatherCityName("tumakuru", "Tumakuru")).toBe("Tumakuru");
  });

  it("never lets plain 'Delhi' stand for New Delhi district", () => {
    expect(alertDistrictNames("new-delhi", "New Delhi")).toEqual(["New Delhi"]);
  });
});

describe("mentionsName", () => {
  it("matches whole words only", () => {
    expect(mentionsName("isolated places over Pune, Satara in next 3 hours", "Pune")).toBe(true);
    expect(mentionsName("Punekar family", "Pune")).toBe(false);
    expect(mentionsName("Bengaluru-Urban district", "Bengaluru Urban")).toBe(true);
    expect(mentionsName("MANDYA district of Karnataka", "Mandya")).toBe(true);
  });
});

describe("isMarketInDistrict (Sept 2026 audit)", () => {
  it("keeps only Bangalore APMC for Bengaluru Urban, not the old undivided district's mandis", () => {
    expect(isMarketInDistrict("bengaluru-urban", "Bangalore APMC")).toBe(true);
    expect(isMarketInDistrict("bengaluru-urban", "Binny Mill (F&V), Bangalore")).toBe(true);
    for (const m of ["Ramanagara APMC", "Kanakapura APMC", "Doddaballa Pur APMC", "Hoskote APMC"]) {
      expect(isMarketInDistrict("bengaluru-urban", m)).toBe(false);
    }
  });
  it("counts no Delhi mandi as New Delhi district's", () => {
    expect(agmarknetMarketsInDistrict("new-delhi")).toEqual([]);
    expect(isMarketInDistrict("new-delhi", "APMC Azadpur")).toBe(false);
    expect(isMarketInDistrict("new-delhi", "Flower Market,Gazipur APMC")).toBe(false);
  });
  it("keeps every mandi where the AGMARKNET district is ours", () => {
    expect(agmarknetMarketsInDistrict("mandya")).toBeNull();
    expect(isMarketInDistrict("mandya", "Pandavapura APMC")).toBe(true);
    expect(isMarketInDistrict("tumakuru", "Tiptur APMC")).toBe(true);
  });
});
