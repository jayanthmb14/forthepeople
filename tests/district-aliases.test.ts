/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// District spellings used by outside sources (src/scraper/lib/district-aliases.ts).
import { describe, expect, it } from "vitest";
import {
  agmarknetDistrictNames,
  alertDistrictNames,
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
