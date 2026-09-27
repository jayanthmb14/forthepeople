/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import {
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
    expect(map?.dams.checks).toEqual([{ source: "India-WRIS", agreed: false, checkedAt: null }]);
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
