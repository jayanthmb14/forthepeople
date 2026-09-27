/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { leaderOfficePhone, leaderSourceOutlets, leaderSourceSummary, localRoleFits } from "@/lib/government-checks";
import { MAX_INSIGHT_DAYS, insightTooOld } from "@/lib/insight-age";

describe("leaderOfficePhone", () => {
  it("drops emergency and helpline short codes (Sept 2026: CP Mumbai had '100')", () => {
    expect(leaderOfficePhone("100")).toBeNull();
    expect(leaderOfficePhone("112")).toBeNull();
    expect(leaderOfficePhone(" 1947 ")).toBeNull();
    expect(leaderOfficePhone("")).toBeNull();
    expect(leaderOfficePhone(null)).toBeNull();
  });

  it("keeps real landline and mobile numbers as stored", () => {
    expect(leaderOfficePhone("+91-11-23015321")).toBe("+91-11-23015321");
    expect(leaderOfficePhone("080-22211292")).toBe("080-22211292");
    expect(leaderOfficePhone("9818022044")).toBe("9818022044");
  });
});

describe("localRoleFits", () => {
  it("rejects a local role with an extra bracketed title the English role lacks", () => {
    expect(localRoleFits("MLA, Varuna", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)")).toBe(false);
  });

  it("accepts a plain translation", () => {
    expect(localRoleFits("MLA, Varuna", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ")).toBe(true);
    expect(localRoleFits("Member of Parliament (Lok Sabha)", "ಲೋಕಸಭಾ ಸದಸ್ಯ")).toBe(true);
    expect(localRoleFits("Member of Parliament (Lok Sabha)", "ಸಂಸದ (ಲೋಕಸಭೆ)")).toBe(true);
  });

  it("has nothing to show for an empty local role", () => {
    expect(localRoleFits("MLA", null)).toBe(false);
    expect(localRoleFits("MLA", "  ")).toBe(false);
  });
});

describe("leaderSourceOutlets / leaderSourceSummary", () => {
  it("reads the outlets from the stored source formats", () => {
    expect(leaderSourceOutlets("manual-research 2026-09 · Wikipedia; IndiaVotes")).toEqual(["Wikipedia", "IndiaVotes"]);
    expect(leaderSourceOutlets("Free Press Journal | https://www.freepressjournal.in/x")).toEqual(["Free Press Journal"]);
    expect(leaderSourceOutlets("Wikipedia (PMC) | https://en.wikipedia.org/wiki/Pune_Municipal_Corporation")).toEqual(["Wikipedia"]);
    expect(leaderSourceOutlets("results.eci.gov.in")).toEqual(["results.eci.gov.in"]);
    expect(leaderSourceOutlets("https://news.example.com/story")).toEqual([]);
    expect(leaderSourceOutlets(null)).toEqual([]);
  });

  it("counts each record once per outlet, most cited first", () => {
    const summary = leaderSourceSummary([
      "manual-research 2026-09 · Wikipedia; IndiaVotes",
      "manual-research 2026-09 · IndiaVotes; Wikipedia",
      "manual-research 2026-09 · Wikipedia; News24",
      "manual-research 2026-09 · mandya.nic.in; Star of Mysore",
      null,
    ]);
    expect(summary[0]).toEqual({ name: "Wikipedia", count: 3 });
    expect(summary[1]).toEqual({ name: "IndiaVotes", count: 2 });
    expect(summary.map((s) => s.name)).not.toContain("Election Commission of India (ECI)");
  });
});

describe("insightTooOld (card and /api/data/insight share it)", () => {
  const now = Date.UTC(2026, 8, 28);
  it("hides analyses older than MAX_INSIGHT_DAYS or undated", () => {
    expect(insightTooOld("2026-03-15T00:00:00Z", now)).toBe(true);
    expect(insightTooOld(null, now)).toBe(true);
    expect(insightTooOld("not a date", now)).toBe(true);
    expect(insightTooOld(new Date(now - (MAX_INSIGHT_DAYS + 1) * 86_400_000), now)).toBe(true);
  });
  it("keeps recent ones", () => {
    expect(insightTooOld(new Date(now - 2 * 86_400_000), now)).toBe(false);
  });
});
