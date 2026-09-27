/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The rule table that turns news into "What you can do" topics
// (src/lib/civic/news-topics.ts): headline keywords first, then the news
// pipeline's module tag, then its category, else no topic.
import { describe, expect, it } from "vitest";
import { NEWS_TOPICS, topicOf, topicRule } from "@/lib/civic/news-topics";

describe("topicOf", () => {
  it("reads the headline first, in table order", () => {
    expect(topicOf({ title: "Dengue cases rise in Mandya, 40 hospitalised" })).toBe("dengue");
    expect(topicOf({ title: "Heavy rain floods low-lying areas of the city" })).toBe("flood");
    expect(topicOf({ title: "Man loses ₹2 lakh in digital arrest scam" })).toBe("cyber");
    expect(topicOf({ title: "Residents protest over drinking water shortage" })).toBe("water");
    expect(topicOf({ title: "Commuters angry over potholes on Bengaluru–Mysuru road" })).toBe("roads");
    expect(topicOf({ title: "Two killed in road accident near Maddur" })).toBe("traffic");
  });

  it("uses whole words, so short keywords do not match inside other words", () => {
    // "dam" must not match "damage"; "exam" must not match "example".
    expect(topicOf({ title: "Storm causes damage to houses" })).toBeNull();
    expect(topicOf({ title: "An example for the whole state" })).toBeNull();
    // A "*" keyword allows endings: "inundat*" matches "inundated".
    expect(topicOf({ title: "Villages inundated after release" })).toBe("flood");
  });

  it("falls back to the module tag, then the category", () => {
    expect(topicOf({ title: "Officials review progress", targetModule: "power" })).toBe("power");
    expect(topicOf({ title: "Officials review progress", targetModule: "news", category: "agriculture" })).toBe("farming");
    expect(topicOf({ title: "Officials review progress", targetModule: "news", category: "general" })).toBeNull();
  });

  it("matches Indian-script keywords anywhere in the text", () => {
    expect(topicOf({ title: "ಮಂಡ್ಯದಲ್ಲಿ ಡೆಂಗ್ಯೂ ಪ್ರಕರಣಗಳು ಹೆಚ್ಚಳ" })).toBe("dengue");
    expect(topicOf({ title: "शहर में डेंगू के मामले बढ़े" })).toBe("dengue");
  });
});

describe("NEWS_TOPICS", () => {
  it("has unique ids and one emoji each", () => {
    const ids = NEWS_TOPICS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of NEWS_TOPICS) expect(r.emoji.length).toBeGreaterThan(0);
  });

  it("looks rules up by id", () => {
    expect(topicRule("cyber")?.helpline).toBe("1930");
    expect(topicRule("nope")).toBeUndefined();
  });
});
