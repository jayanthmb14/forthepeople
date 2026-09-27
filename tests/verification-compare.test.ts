/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Data verification: comparison, tolerance and verdict rules
// (src/lib/verification/compare.ts, offices.ts). The names and roles below
// are real values from the Leader table (Sept 2026).
import { describe, expect, it } from "vitest";
import {
  compareDamPercent,
  compareModalPrice,
  compareTemperature,
  decideStatus,
  freshnessVerdict,
  isPlaceholderName,
  istDayKey,
  levenshtein,
  namesMatch,
  namesMatchAny,
  nameTokens,
  parseIsoDay,
  withinAbs,
  withinRel,
} from "@/lib/verification/compare";
import { classifyStateOffice, coreOffices, roleIsForState, roleSlug } from "@/lib/verification/offices";
import type { SourceCheck } from "@/lib/verification/types";

const at = (iso: string) => new Date(iso);

describe("number tolerances", () => {
  it("withinAbs is inclusive and rejects non-finite values", () => {
    expect(withinAbs(27.4, 30.4, 3)).toBe(true);
    expect(withinAbs(27.4, 30.5, 3)).toBe(false);
    expect(withinAbs(NaN, 1, 3)).toBe(false);
  });
  it("withinRel measures against the reference", () => {
    expect(withinRel(115, 100, 0.15)).toBe(true);
    expect(withinRel(116, 100, 0.15)).toBe(false);
    expect(withinRel(0, 0, 0.15)).toBe(true);
    expect(withinRel(1, 0, 0.15)).toBe(false);
  });
});

describe("compareTemperature", () => {
  const ours = { temperature: 27.4, recordedAt: at("2026-09-27T11:00:00Z") };
  it("agrees within ±3 °C when the readings are close in time", () => {
    const r = compareTemperature(ours, { temperature: 25.6, recordedAt: at("2026-09-27T11:30:00Z") });
    expect(r.agreed).toBe(true);
    expect(r.diff).toBe(1.8);
    expect(r.gapMinutes).toBe(30);
  });
  it("disagrees beyond ±3 °C", () => {
    expect(compareTemperature(ours, { temperature: 31.0, recordedAt: at("2026-09-27T11:10:00Z") }).agreed).toBe(false);
  });
  it("does not compare readings more than 90 minutes apart", () => {
    expect(compareTemperature(ours, { temperature: 27.4, recordedAt: at("2026-09-27T13:00:00Z") }).agreed).toBeNull();
  });
});

describe("compareDamPercent", () => {
  it("allows ±2 points", () => {
    expect(compareDamPercent(55, 57)).toBe(true);
    expect(compareDamPercent(55, 57.5)).toBe(false);
  });
});

describe("compareModalPrice", () => {
  it("agrees within ±15 % of the district modal", () => {
    const r = compareModalPrice([1900, 2100], { min: 1500, max: 2500, modal: 2100 })!;
    expect(r.agreed).toBe(true);
    expect(r.storedMean).toBe(2000);
    expect(r.diffPct).toBe(-4.8);
  });
  it("agrees inside the district min–max even when the modal differs", () => {
    expect(compareModalPrice([2400], { min: 1500, max: 2500, modal: 1600 })!.agreed).toBe(true);
  });
  it("disagrees outside both", () => {
    expect(compareModalPrice([4000], { min: 1500, max: 2500, modal: 2000 })!.agreed).toBe(false);
  });
  it("returns null when nothing is comparable", () => {
    expect(compareModalPrice([0, NaN], { min: 1, max: 2, modal: 1 })).toBeNull();
    expect(compareModalPrice([100], { min: 1, max: 2, modal: 0 })).toBeNull();
  });
});

describe("dates", () => {
  it("maps UTC midnight and IST midnight of the same Indian day to one key", () => {
    expect(istDayKey(at("2026-09-27T00:00:00Z"))).toBe("2026-09-27");
    expect(istDayKey(at("2026-09-26T18:30:00Z"))).toBe("2026-09-27");
    expect(istDayKey(at("2026-09-26T18:29:00Z"))).toBe("2026-09-26");
  });
  it("parses ISO days strictly", () => {
    expect(parseIsoDay("2025-10-30")?.toISOString()).toBe("2025-10-30T00:00:00.000Z");
    expect(parseIsoDay("2025-02-30")).toBeNull();
    expect(parseIsoDay("30/10/2025")).toBeNull();
  });
});

describe("decideStatus", () => {
  const c = (agreed: boolean | null, independent = true): SourceCheck => ({ source: "x", value: agreed === null ? null : "v", agreed, independent });

  it("a feed confirmed by one independent source is verified", () => {
    expect(decideStatus([c(true)], { primaryCounts: true })).toEqual({ status: "verified", agreed: true, reason: "sources-agree" });
  });
  it("hand-entered data needs two agreeing outside sources", () => {
    expect(decideStatus([c(true), c(true)], { primaryCounts: false }).status).toBe("verified");
    expect(decideStatus([c(true), c(null)], { primaryCounts: false })).toEqual({ status: "single-source", agreed: true, reason: "second-source-no-data" });
  });
  it("any disagreeing answer wins", () => {
    expect(decideStatus([c(true), c(false)], { primaryCounts: false })).toEqual({ status: "disagreement", agreed: false, reason: "sources-disagree" });
  });
  it("a re-read of the same publisher is never 'verified'", () => {
    expect(decideStatus([c(true, false)], { primaryCounts: true })).toEqual({ status: "single-source", agreed: true, reason: "same-publisher" });
  });
  it("no answers / no sources", () => {
    expect(decideStatus([c(null)], { primaryCounts: true, noAnswerReason: "second-source-failed" })).toEqual({ status: "single-source", agreed: null, reason: "second-source-failed" });
    expect(decideStatus([], { primaryCounts: true })).toEqual({ status: "single-source", agreed: null, reason: "no-second-source" });
  });
});

describe("freshnessVerdict", () => {
  it("maps the stale-notice judgement", () => {
    expect(freshnessVerdict("current")).toEqual({ status: "fresh", reason: "on-time" });
    expect(freshnessVerdict("late")).toEqual({ status: "stale", reason: "late" });
    expect(freshnessVerdict("unknown")).toEqual({ status: "unchecked", reason: "no-date" });
    expect(freshnessVerdict("not_collected")).toEqual({ status: "unchecked", reason: "not-collected" });
  });
});

describe("names", () => {
  it("tokenises without titles, punctuation or notes", () => {
    expect(nameTokens("Dasari Harichandana, IAS")).toEqual(["dasari", "harichandana"]);
    expect(nameTokens("Revanth Reddy (politician)")).toEqual(["revanth", "reddy"]);
    expect(nameTokens("जिष्णू देव वर्मा")).toEqual([]);
  });
  it("levenshtein", () => {
    expect(levenshtein("gehlot", "gehlot")).toBe(0);
    expect(levenshtein("thaavar", "thawar")).toBe(2);
  });
  it.each([
    ["Thaavar Chand Gehlot", "Thawar Chand Gehlot"],
    ["D.K. Shivakumar", "D. K. Shivakumar"],
    ["DK Shivakumar", "D. K. Shivakumar"],
    ["D. K. Shivakumar", "Doddalahalli Kempegowda Shivakumar"],
    ["Rajendra Vishwanath Arlekar", "Rajendra Arlekar"],
    ["Yogi Adityanath", "Adityanath Yogi"],
    ["Vishak G Iyer, IAS", "Vishak G. Iyer"],
    ["V.K. Saxena", "Vinai Kumar Saxena"],
    ["Siddaramaiah", "Siddaramaiah"],
    ["C.V. Ananda Bose", "C. V. Ananda Bose"],
  ])("%s = %s", (a, b) => {
    expect(namesMatch(a, b)).toBe(true);
    expect(namesMatch(b, a)).toBe(true);
  });
  it.each([
    ["Siddaramaiah", "D. K. Shivakumar"],
    ["Mamata Banerjee", "Suvendu Adhikari"],
    ["C.V. Ananda Bose", "R. N. Ravi"],
    ["V.K. Saxena", "Taranjit Singh Sandhu"],
    ["Eknath Shinde", "Shrikant Shinde"],
    ["Revanth Reddy", "Rajasekhara Reddy"],
    ["Gupta", "Rekha Gupta"],
    ["D.K. Shivakumar", "G. Parameshwara"],
    ["Jishnu Dev Varma", "जिष्णू देव वर्मा"],
  ])("%s ≠ %s", (a, b) => {
    expect(namesMatch(a, b)).toBe(false);
  });
  it("namesMatchAny", () => {
    expect(namesMatchAny("Jishnu Dev Varma", ["जिष्णू देव वर्मा", "Ramesh Bais"])).toBe(false);
    expect(namesMatchAny("Rekha Gupta", ["Pravesh Wahi", "Rekha Jindal Gupta"])).toBe(true);
  });
});

describe("isPlaceholderName", () => {
  const mandya = ["Mandya", "mandya", "Karnataka", "karnataka"];
  it.each([
    ["[Verify at mandya.nic.in]", mandya],
    ["[Verify at ksp.gov.in]", mandya],
    ["[Name Not Available]", mandya],
    ["Deputy Commissioner, Bengaluru Urban", ["Bengaluru Urban", "bengaluru-urban", "Karnataka"]],
    ["ADC, Mysuru Division", ["Mysuru", "mysuru", "Karnataka"]],
    ["SP, Mysuru Rural", ["Mysuru", "mysuru", "Karnataka"]],
    ["Vacant", mandya],
    ["N/A", mandya],
    ["", mandya],
  ])("%s is a placeholder", (name, place) => {
    expect(isPlaceholderName(name, place)).toBe(true);
  });
  it.each(["G. Jagadeesha", "Vineet Goyal", "Dasari Harichandana, IAS", "Na. Muthukumaraswamy", "ಜಿ. ಜಗದೀಶ", "Seemant Kumar Singh"])(
    "%s is a name",
    (name) => {
      expect(isPlaceholderName(name, ["Mysuru", "Karnataka"])).toBe(false);
    },
  );
});

describe("state offices", () => {
  it.each([
    ["Chief Minister of Karnataka", "chief-minister"],
    ["MLA, Kanakapura (Deputy CM", "deputy-cm"],
    ["Deputy Chief Minister", "deputy-cm"],
    ["Governor of West Bengal", "governor"],
    ["Lieutenant Governor of Delhi", "lieutenant-governor"],
    ["Lt. Governor of Delhi", "lieutenant-governor"],
    ["Chief Secretary, West Bengal", null],
    ["Principal Secretary to Chief Minister", null],
    ["Governor, Reserve Bank of India", null],
    ["District Collector, Mandya", null],
  ])("%s → %s", (role, office) => {
    expect(classifyStateOffice(role)).toBe(office);
  });
  it("core offices are the CM and the Governor, or the LG in a UT", () => {
    expect(coreOffices(new Set(["chief-minister", "governor"]))).toEqual(["chief-minister", "governor"]);
    expect(coreOffices(new Set(["chief-minister", "lieutenant-governor"]))).toEqual(["chief-minister", "lieutenant-governor"]);
  });
  it("roleIsForState", () => {
    expect(roleIsForState("Chief Minister of Karnataka", "Karnataka")).toBe(true);
    expect(roleIsForState("Governor of Kerala", "Karnataka")).toBe(false);
    expect(roleIsForState("Chief Secretary, GNCTD", "Delhi")).toBe(true);
    expect(roleIsForState("Lieutenant Governor of NCT of Delhi", "Delhi")).toBe(true);
    expect(roleIsForState("MLA, Kanakapura (Deputy CM", "Karnataka")).toBe(true);
  });
  it("roleSlug", () => {
    expect(roleSlug("MLA, Kanakapura (Deputy CM)")).toBe("mla-kanakapura");
    expect(roleSlug("Superintendent of Police, Mandya")).toBe("superintendent-of-police-mandya");
  });
});
