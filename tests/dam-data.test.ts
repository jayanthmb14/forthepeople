/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Dam readings on the water page (src/components/land-water/dam-data.ts),
// Sept 2026 audit: one name per dam, and no decimal the portal never gave.
import { describe, expect, it } from "vitest";
import { damKey, fillPct, sameDam, shownDamName } from "@/components/land-water/dam-data";

describe("dam names", () => {
  it("shows KRS under one canonical name in every district", () => {
    const mysuru = shownDamName({ damName: "KRS Dam (Krishnaraja Sagara)", damNameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ" });
    const mandya = shownDamName({ damName: "Krishna Raja Sagara (KRS)", damNameLocal: "ಕೃಷ್ಣರಾಜಸಾಗರ" });
    expect(mysuru).toEqual(mandya);
    expect(mandya).toEqual({ damName: "Krishna Raja Sagara (KRS)", damNameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ" });
    expect(damKey("KRS (Krishna Raja Sagara)")).toBe("Krishna Raja Sagara (KRS)");
  });

  it("matches the dam registry's spelling for the river lookup, and leaves unknown dams alone", () => {
    expect(sameDam("KRS (Krishna Raja Sagara)", "KRS Dam (Krishnaraja Sagara)")).toBe(true);
    expect(sameDam("Kabini Dam", "Kabini Reservoir")).toBe(true);
    expect(sameDam("Kabini Dam", "Krishna Raja Sagara (KRS)")).toBe(false);
    expect(shownDamName({ damName: "Osmansagar", damNameLocal: null })).toEqual({ damName: "Osmansagar", damNameLocal: null });
  });
});

describe("fillPct", () => {
  it("works the share out from the TMC figures (Kabini 11.048 of 19.516 = 56.6 %, the portal says 56)", () => {
    const f = fillPct({ storage: 11.048, maxStorage: 19.516, storagePct: 56 });
    expect(f.digits).toBe(1);
    expect(f.pct).toBeCloseTo(56.61, 2);
  });

  it("keeps the portal's whole number, with no decimal, when capacity is unknown", () => {
    expect(fillPct({ storage: 0, maxStorage: 0, storagePct: 40 })).toEqual({ pct: 40, digits: 0 });
  });
});
