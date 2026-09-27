/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// News keyword classifier + state-aware sources (src/lib/news-keywords.ts).
import { describe, expect, it } from "vitest";
import {
  buildNewsQueries,
  categorize,
  classifyModule,
  districtAliases,
  mentionsDistrict,
  mentionsOtherState,
  newsFeedsFor,
  searchName,
} from "@/lib/news-keywords";

describe("classifyModule (whole words)", () => {
  it("classifies clear headlines", () => {
    expect(classifyModule("KRS dam water level rises after heavy inflow")).toBe("water");
    expect(classifyModule("Farmers protest over sugarcane price")).toBe("crops");
    expect(classifyModule("Two arrested for chain snatching")).toBe("police");
    expect(classifyModule("Power cut in Mandya city on Tuesday")).toBe("power");
    expect(classifyModule("New flyover inaugurated on NH-275")).toBe("infrastructure");
    expect(classifyModule("Vande Bharat train to stop at Mandya")).toBe("transport");
  });

  it("does not match keywords inside other words", () => {
    // "fir" in "first", "dam" in "damage", "rain" in "drain"/"train", "mp" in "camp"
    expect(classifyModule("First look at the new park")).toBe("news");
    expect(classifyModule("Storm damage to homes")).not.toBe("water");
    expect(classifyModule("Blocked drain floods street")).toBe("weather"); // via "flood*", not "rain"
    expect(classifyModule("Blocked drain on the street")).toBe("news");
    expect(classifyModule("Health camp held for children")).toBe("health");
  });

  it("accepts simple plurals and prefix keywords", () => {
    expect(classifyModule("Dams across the region")).toBe("water");
    expect(classifyModule("Minister inaugurates new bus depot")).toBe("leaders");
    expect(classifyModule("Police station gets new building")).toBe("police");
  });
});

describe("classifyModule — Sept 2026 audit headlines", () => {
  it("files crimes under police, not where they happened", () => {
    expect(classifyModule("Man sleeping in auto-rickshaw brutally murdered")).toBe("police");
    expect(classifyModule("Hyderabad man loses Rs 3.73 crore in fake investment scheme")).toBe("police");
  });

  it("does not tag money amounts, job candidates or a house as budget / elections / housing", () => {
    expect(classifyModule("University of Mysore: Rs 150 crore irregularities")).toBe("education");
    expect(classifyModule("Hyderabad mega job mela on Saturday, SSC candidates eligible")).not.toBe("elections");
    expect(classifyModule("Youth dies by suicide at relative's house")).toBe("news");
  });

  it("leaves sport and festival events without a data page", () => {
    expect(classifyModule("Pune wins historic bid to host UCI Road World Championships 2032")).toBe("news");
    expect(classifyModule("Mysuru Kambala: 150–160 buffalo pairs to participate")).toBe("news");
    expect(categorize("Pune wins historic bid to host UCI Road World Championships 2032")).toBe("general");
  });

  it("whole words: old substring tags do not come back", () => {
    expect(classifyModule("Students demonstrate scientific temper at Maths Olympiad")).toBe("education");
    expect(classifyModule("Heavy rain lashes Pune, waterlogs Pimpri Chinchwad localities")).toBe("weather");
    expect(classifyModule("Lokayukta raids in Mandya, Kalaburagi")).not.toBe("crops");
    expect(classifyModule("Child Sexual Abuse Cases Can't Be Settled By Victim's Family: Delhi High Court")).toBe("courts");
  });
});

describe("categorize", () => {
  it("a housing market is not farming; a fake scheme is a crime", () => {
    expect(categorize("MMR overtakes NCR as India's biggest housing market")).not.toBe("agriculture");
    expect(categorize("Hyderabad man loses Rs 3.73 crore in fake investment scheme")).toBe("crime");
  });

  it("returns a broad category or general", () => {
    expect(categorize("Farmer suicides rise")).toBe("agriculture");
    expect(categorize("Dengue cases at district hospital")).toBe("health");
    expect(categorize("A quiet Sunday")).toBe("general");
  });
});

describe("district names", () => {
  it("drops the Urban/Rural suffix for searching", () => {
    expect(searchName("Bengaluru Urban")).toBe("Bengaluru");
    expect(searchName("Mandya")).toBe("Mandya");
    expect(districtAliases("Bengaluru Urban")).toEqual(["bengaluru urban", "bengaluru", "bangalore"]);
  });

  it("matches the district and its old names as whole words", () => {
    expect(mentionsDistrict("Traffic jam in Bangalore today", "Bengaluru Urban")).toBe(true);
    expect(mentionsDistrict("Mysore Dasara begins", "Mysuru")).toBe(true);
    expect(mentionsDistrict("Punekar festival", "Pune")).toBe(false);
    expect(mentionsDistrict("Pune metro extended", "Pune")).toBe(true);
  });

  it("spots stories about another state", () => {
    expect(mentionsOtherState("High Court of Karnataka reserves order", "Telangana")).toBe(true);
    expect(mentionsOtherState("Hyderabad metro phase 2 approved", "Telangana")).toBe(false);
    expect(mentionsOtherState("Mandya farmers meet", "Karnataka")).toBe(false);
  });

  it("still spots another state when the own state is named too (Sept 2026 audit)", () => {
    // Naming Delhi used to switch the check off, so this reached New Delhi's feed.
    expect(mentionsOtherState("Delhi Confidential: Centre's lawyer defends Karnataka Congress government", "Delhi")).toBe(true);
    expect(mentionsOtherState("Telangana and Karnataka discuss water sharing", "Telangana")).toBe(true);
    expect(mentionsOtherState("Delhi govt puts new challan system on hold", "Delhi")).toBe(false);
  });

  it("New Delhi: Delhi-wide stories count, other Delhi districts do not", () => {
    expect(mentionsDistrict("Delhi govt puts new challan system on hold", "New Delhi")).toBe(true);
    expect(mentionsDistrict("Traffic curbs near India Gate in New Delhi", "New Delhi")).toBe(true);
    expect(mentionsDistrict("Rs 165-crore plan to build pucca schools in 5 areas in NE, east Delhi", "New Delhi")).toBe(false);
    expect(mentionsDistrict("Delhi Police arrest 379 bad elements in central district", "New Delhi")).toBe(false);
    expect(mentionsDistrict("Gulbarga Tur Dal flagged off from Karnataka to Maldives", "New Delhi")).toBe(false);
  });

  it("Bengaluru Urban: other districts named Bengaluru do not count", () => {
    expect(mentionsDistrict("Lokayukta finds fault with Bengaluru South district administration", "Bengaluru Urban")).toBe(false);
    expect(mentionsDistrict("Bengaluru Rural farmers protest", "Bengaluru Urban")).toBe(false);
    expect(mentionsDistrict("Bengaluru South City Corporation clears potholes", "Bengaluru Urban")).toBe(true);
  });
});

describe("sources", () => {
  it("queries name the district's own state, never Karnataka for others", () => {
    const q = buildNewsQueries("Hyderabad", "Telangana");
    expect(q).toEqual(['"Hyderabad" Telangana', '"Hyderabad" district news', '"Hyderabad" Telangana latest']);
    expect(q.join(" ")).not.toMatch(/karnataka/i);
    expect(buildNewsQueries("New Delhi", "Delhi")[0]).toBe('"New Delhi"');
    expect(buildNewsQueries("Bengaluru Urban", "Karnataka")[0]).toBe('"Bengaluru" Karnataka');
  });

  it("picks The Hindu city + state feeds for the district's state", () => {
    const hyd = newsFeedsFor("hyderabad", "Hyderabad", "telangana", "Telangana");
    expect(hyd.map((f) => f.url)).toEqual([
      "https://www.thehindu.com/news/cities/Hyderabad/feeder/default.rss",
      "https://www.thehindu.com/news/national/telangana/feeder/default.rss",
      expect.stringContaining("news.google.com"),
    ]);
    expect(hyd[0].filterByDistrict).toBe(false);
    expect(hyd[1].filterByDistrict).toBe(true);
    expect(hyd.some((f) => /karnataka/i.test(f.url))).toBe(false);

    const pune = newsFeedsFor("pune", "Pune", "maharashtra", "Maharashtra");
    expect(pune[0]).toEqual({
      url: "https://www.thehindu.com/news/national/other-states/feeder/default.rss",
      sourceName: "The Hindu",
      filterByDistrict: true,
    });

    const delhi = newsFeedsFor("new-delhi", "New Delhi", "delhi", "Delhi");
    expect(delhi.filter((f) => f.url.includes("thehindu"))).toHaveLength(1); // city == state feed, de-duplicated

    const mandya = newsFeedsFor("mandya", "Mandya", "karnataka", "Karnataka");
    expect(mandya[0].url).toContain("/national/karnataka/");
  });
});
