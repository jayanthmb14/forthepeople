/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import {
  checkKind,
  newestCheck,
  normaliseVerification,
  summariseVerification,
  verificationFor,
} from "@/components/district/shell/verification";

const ROW = {
  dataset: "mandi",
  status: "verified",
  checks: [
    { source: "AGMARKNET", agreed: true, checkedAt: "2026-09-25T10:00:00Z" },
    { source: "data.gov.in", agreed: true, checkedAt: "2026-09-26T10:00:00Z" },
  ],
};

describe("normaliseVerification", () => {
  it("accepts a bare array and wrapped lists", () => {
    for (const body of [[ROW], { datasets: [ROW] }, { data: [ROW] }, { data: { datasets: [ROW] } }]) {
      const map = normaliseVerification(body);
      expect(map?.mandi?.status).toBe("verified");
      expect(map?.mandi?.checks).toHaveLength(2);
    }
  });

  it("returns null for bodies that are not a verification payload (old behaviour)", () => {
    expect(normaliseVerification(null)).toBeNull();
    expect(normaliseVerification({ error: "Not found" })).toBeNull();
    expect(normaliseVerification("oops")).toBeNull();
  });

  it("treats an unknown status as unchecked and drops bad checks", () => {
    const map = normaliseVerification([
      { dataset: "Dams", status: "maybe", checks: [{ source: "" }, { source: "India-WRIS", agreed: "yes", checkedAt: "not a date" }] },
      { status: "verified" },
    ]);
    expect(Object.keys(map ?? {})).toEqual(["dams"]);
    expect(map?.dams.status).toBe("unchecked");
    // "yes" is not a comparison result: nothing to compare, never "agrees" (Sept 2026 audit).
    expect(map?.dams.checks).toEqual([{ source: "India-WRIS", agreed: null, checkedAt: null, independent: true, role: null }]);
  });
});

describe("checkKind (Sept 2026 audit)", () => {
  it("says 'no data' — not 'does not agree' — when the second source had nothing", () => {
    const map = normaliseVerification([
      {
        dataset: "mandi",
        status: "single-source",
        checks: [
          { source: "AGMARKNET / data.gov.in", role: "shown", agreed: null, independent: true },
          { source: "CEDA Ashoka (AGMARKNET mirror)", role: "check", agreed: null, independent: false },
        ],
      },
    ]);
    const v = map!.mandi;
    expect(v.checks.map((c) => checkKind(c, v.status))).toEqual(["shownOnly", "noData"]);
  });

  it("never counts a re-read of the same publisher as a second source that agrees", () => {
    const map = normaliseVerification([
      {
        dataset: "dams",
        status: "single-source",
        checks: [
          { source: "Karnataka Water Resources Department", role: "shown", agreed: true, independent: true },
          { source: "Karnataka Water Resources Department (read again)", role: "check", agreed: true, independent: false },
        ],
      },
    ]);
    const v = map!.dams;
    expect(v.checks.map((c) => checkKind(c, v.status))).toEqual(["shownOnly", "sameSource"]);
  });

  it("keeps agrees / does not agree for real comparisons", () => {
    const map = normaliseVerification([
      {
        dataset: "weather",
        status: "disagreement",
        checks: [
          { source: "OpenWeatherMap", role: "shown", agreed: false, independent: true },
          { source: "Open-Meteo", role: "check", agreed: false, independent: true },
        ],
      },
      ROW,
    ]);
    expect(map!.weather.checks.map((c) => checkKind(c, "disagreement"))).toEqual(["disagrees", "disagrees"]);
    expect(map!.mandi.checks.map((c) => checkKind(c, "verified"))).toEqual(["agrees", "agrees"]);
  });
});

describe("verificationFor / newestCheck / summariseVerification", () => {
  const map = normaliseVerification([
    ROW,
    { dataset: "finance", status: "single-source", checks: [] },
    { dataset: "weather", status: "disagreement", checks: [] },
  ]);

  it("matches by dataset key, and by module slug for a main dataset only", () => {
    expect(verificationFor(map, { key: "mandi", module: "crops", primary: true })?.status).toBe("verified");
    expect(verificationFor(map, { key: "budget", module: "finance", primary: true })?.status).toBe("single-source");
    expect(verificationFor(map, { key: "canals", module: "finance", primary: false })).toBeNull();
    expect(verificationFor(null, { key: "mandi", module: "crops", primary: true })).toBeNull();
  });

  it("finds the newest check and counts statuses", () => {
    expect(newestCheck(map!.mandi)).toBe("2026-09-26T10:00:00Z");
    expect(newestCheck(map!.finance)).toBeNull();
    expect(summariseVerification([map!.mandi, map!.finance, map!.weather, null])).toEqual({
      verified: 1,
      "single-source": 1,
      disagreement: 1,
      unchecked: 0,
    });
  });
});
