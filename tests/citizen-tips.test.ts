/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Weekly citizen tips: validation and the "never overwrite good tips with
// an empty list" rule (src/lib/citizen-tips.ts).
import { describe, expect, it } from "vitest";
import { CITIZEN_TIPS_TTL_S, MAX_TIPS, citizenTipsKey, normalizeCitizenTips, tipsToStore, type StoredTips } from "@/lib/citizen-tips";

const tip = (over: Record<string, unknown> = {}) => ({
  category: "health",
  title: "Boil drinking water",
  description: "Dengue season: store water covered.",
  urgency: "now",
  ...over,
});

describe("normalizeCitizenTips", () => {
  it("accepts {tips:[…]} and a bare list, and cleans fields", () => {
    const a = normalizeCitizenTips({ tips: [tip()] });
    expect(a).toEqual([{ category: "Health", icon: "", title: "Boil drinking water", description: "Dengue season: store water covered.", urgency: "now" }]);
    expect(normalizeCitizenTips([tip({ urgency: "later" })])[0].urgency).toBe("general");
  });

  it("drops incomplete tips and caps the list", () => {
    expect(normalizeCitizenTips({ tips: [tip({ title: "" }), tip({ description: 5 }), tip({ category: "" }), null, "x"] })).toEqual([]);
    expect(normalizeCitizenTips({ tips: Array.from({ length: 20 }, () => tip()) })).toHaveLength(MAX_TIPS);
  });

  it("returns [] for answers without a list", () => {
    expect(normalizeCitizenTips({ error: "x" })).toEqual([]);
    expect(normalizeCitizenTips(null)).toEqual([]);
  });
});

describe("tipsToStore", () => {
  const week = (tips: StoredTips["tips"], generatedAt: string): StoredTips => ({ tips, month: 9, year: 2026, generatedAt, generatedBy: "cron" });
  const good = normalizeCitizenTips({ tips: [tip()] });

  it("stores new tips when there are some", () => {
    const r = tipsToStore(week(good, "2026-09-27"), week(good, "2026-09-20"));
    expect(r).toEqual({ payload: week(good, "2026-09-27"), kept: false });
  });

  it("keeps last week's tips (with their own date) when this week has none", () => {
    const r = tipsToStore(week([], "2026-09-27"), week(good, "2026-09-20"));
    expect(r?.kept).toBe(true);
    expect(r?.payload.generatedAt).toBe("2026-09-20");
  });

  it("writes nothing when there are no tips at all", () => {
    expect(tipsToStore(week([], "2026-09-27"), null)).toBeNull();
    expect(tipsToStore(week([], "2026-09-27"), week([], "2026-09-20"))).toBeNull();
  });
});

describe("stored tips key and lifetime", () => {
  it("one key for the cron and the page", () => {
    expect(citizenTipsKey("mandya")).toBe("ftp:ai:citizen-tips:mandya");
  });

  it("outlive the next weekly run, so a failed week can keep last week's tips", () => {
    const week = 7 * 24 * 60 * 60;
    // The next run may reach a district up to its 240 s budget later than last week.
    expect(CITIZEN_TIPS_TTL_S).toBeGreaterThan(week + 300);
  });
});
