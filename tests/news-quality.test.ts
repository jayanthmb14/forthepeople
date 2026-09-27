/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// News quality rules (src/lib/news-quality.ts), with the headlines the
// Sept 2026 audit found on district pages.
import { describe, expect, it } from "vitest";
import {
  cleanHeadline,
  displayHeadline,
  isPlaceChecked,
  isPromotional,
  looksTruncated,
  newsForDisplay,
  stripFeedSuffix,
} from "@/lib/news-quality";

describe("cleanHeadline", () => {
  it("drops outlet names and section tags at the end", () => {
    expect(cleanHeadline("Lax action on 164 dark spots amid gang-rape at Delhi park | Latest News Delhi", "Hindustan Times")).toBe(
      "Lax action on 164 dark spots amid gang-rape at Delhi park",
    );
    expect(cleanHeadline("24-hr downpour in Lko delivers monsoon’s parting punch | Hindustan Times", "Hindustan Times")).toBe(
      "24-hr downpour in Lko delivers monsoon’s parting punch",
    );
    expect(cleanHeadline("BWSSB limits expanded to entire Bengaluru Urban district | Tap to know more | Inshorts", "Inshorts")).toBe(
      "BWSSB limits expanded to entire Bengaluru Urban district",
    );
    expect(cleanHeadline("In major reshuffle, 23 police officers transferred in West Bengal | Kolkata", "Hindustan Times")).toBe(
      "In major reshuffle, 23 police officers transferred in West Bengal",
    );
  });

  it("drops leading section kickers and invisible characters", () => {
    expect(cleanHeadline("India News | Karnataka: Lokayukta Raids in Mandya", "LatestLY")).toBe("Karnataka: Lokayukta Raids in Mandya");
    expect(cleanHeadline("Video | Karnataka News | DK Shivakumar Sparks Row", "NDTV")).toBe("DK Shivakumar Sparks Row");
    expect(cleanHeadline("​​​Dy CM Sunetra Pawar flags off 1st Beed-Pune train")).toBe("Dy CM Sunetra Pawar flags off 1st Beed-Pune train");
  });

  it("keeps a headline's own kicker and its long second half", () => {
    expect(cleanHeadline("CEC row | Why CJP chose Mumbai as protest site after Delhi?", "Deccan Herald")).toBe(
      "CEC row | Why CJP chose Mumbai as protest site after Delhi?",
    );
    expect(cleanHeadline("Lucknow Fire | UP Has No Compensation Policy For Incidents Outside Natural Calamities", "Live Law")).toBe(
      "Lucknow Fire | UP Has No Compensation Policy For Incidents Outside Natural Calamities",
    );
  });

  it("stripFeedSuffix removes only the last ' - Publisher'", () => {
    expect(stripFeedSuffix("Mysuru - Kodagu MP inspects work - The Hindu", "The Hindu")).toBe("Mysuru - Kodagu MP inspects work");
    expect(stripFeedSuffix("Metro fares revised - Deccan Herald", "")).toBe("Metro fares revised");
  });
});

describe("looksTruncated / displayHeadline", () => {
  it("marks headlines the feed cut short", () => {
    const toi105 = "Two among 5 critically injured after MSRTC bus rams into 5 vehicles causing pile-up on Sion-Panvel highwa";
    expect(toi105).toHaveLength(105);
    expect(looksTruncated(toi105)).toBe(true);
    expect(displayHeadline("BJP would have lost 60 seats, alleges Sena UBT’s Sanjay R")).toBe("BJP would have lost 60 seats, alleges Sena UBT’s Sanjay R…");
    expect(displayHeadline("New 5-member command structure to steer BJP in T")).toBe("New 5-member command structure to steer BJP in T…");
    expect(displayHeadline("Rain in 10 cities; alert in 58 UP di...")).toBe("Rain in 10 cities; alert in 58 UP di…");
  });

  it("leaves complete headlines alone", () => {
    expect(looksTruncated("Railway recruitment for Group D posts")).toBe(false);
    expect(looksTruncated("Railway recruitment results for Group D")).toBe(false);
    expect(looksTruncated("Starbucks to set up India GCC in Chennai, create 800 jobs")).toBe(false);
    expect(displayHeadline("Heavy rain lashes Pune")).toBe("Heavy rain lashes Pune");
  });
});

describe("isPromotional", () => {
  it("catches advertorials, price pages and listicles", () => {
    expect(isPromotional("Aarthi Scans & Labs Ranked #1 in Diagnostics Across Chennai and Tamil Nadu in Times Health Survey 2026")).toBe(true);
    expect(isPromotional("Gold Rate Today in Lucknow 27th September 2026 : 22 & 24 Carat")).toBe(true);
    expect(isPromotional("Mumbai Gets New Train To Bengaluru: 6 Places You Can Explore Along The Route")).toBe(true);
    expect(isPromotional("Karnataka CM inaugurates Eugenix hair restoration center in Bengaluru, Domlur")).toBe(true);
    expect(isPromotional("Kalpataru Among the First Real Estate Companies in Mumbai to Adopt the Policy")).toBe(true);
    expect(isPromotional("Sri Lanka Tourism holds destination wedding roadshow in Hyderabad")).toBe(true);
  });

  it("keeps civic news", () => {
    expect(isPromotional("Mandya ranked first in paddy procurement")).toBe(false);
    expect(isPromotional("Petrol price hike: autos go on strike")).toBe(false);
    expect(isPromotional("Maharashtra declares drought in 265 talukas")).toBe(false);
  });
});

describe("isPlaceChecked", () => {
  it("trusts rows whose place the AI checked", () => {
    expect(isPlaceChecked({ title: "Telangana declares holiday", classifiedBy: "ai:some/model" }, "Hyderabad", "Telangana")).toBe(true);
  });

  it("keyword rows must name the district and no other state", () => {
    const kw = (title: string) => ({ title, classifiedBy: "keyword" });
    expect(isPlaceChecked(kw("A pedestrian signal is needed at MM Nagar Municipality Office Road junction"), "Chennai", "Tamil Nadu")).toBe(false);
    expect(isPlaceChecked(kw("South Tripura first in state to fully implement IHMIS"), "Kolkata", "West Bengal")).toBe(false);
    expect(isPlaceChecked(kw("Cauvery dispute: SC declines fresh plea seeking 70 TMC water reallocation to Karnataka"), "New Delhi", "Delhi")).toBe(false);
    expect(isPlaceChecked(kw("Chennai Metro phase 2 trial run on Poonamallee stretch"), "Chennai", "Tamil Nadu")).toBe(true);
    expect(isPlaceChecked({ title: "Old row", classifiedBy: null }, "Chennai", "Tamil Nadu")).toBe(false);
  });
});

describe("newsForDisplay", () => {
  it("drops promotions and unchecked other-place rows, cleans titles, re-tags keyword rows", () => {
    const rows = [
      { id: "1", title: "Aarthi Scans & Labs Ranked #1 in Diagnostics Across Chennai", classifiedBy: "ai:m", category: "health", targetModule: "health" },
      { id: "2", title: "Looms fall silent in Kongu Nadu", classifiedBy: "keyword", category: "general", targetModule: "news" },
      { id: "3", title: "Man sleeping in auto-rickshaw in Chennai brutally murdered | Chennai News", publisher: "The Hindu", classifiedBy: "keyword", category: "general", targetModule: "transport" },
      { id: "4", title: "Chennai Corporation budget passed", classifiedBy: "ai:m", category: "development", targetModule: "budget" },
    ];
    const out = newsForDisplay(rows, { districtName: "Chennai", stateName: "Tamil Nadu" });
    expect(out.map((r) => r.id)).toEqual(["3", "4"]);
    expect(out[0].title).toBe("Man sleeping in auto-rickshaw in Chennai brutally murdered");
    expect(out[0].targetModule).toBe("police");
    expect(out[0].category).toBe("crime");
    expect(out[1].targetModule).toBe("budget"); // the AI's tag is kept
  });
});
