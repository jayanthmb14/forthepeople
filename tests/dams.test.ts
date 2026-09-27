/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Dam names, full levels and reading checks (src/scraper/lib/dams.ts).
// Figures are the Karnataka Water Resources portal's reply of 27 Sep 2026.
import { describe, expect, it } from "vitest";
import {
  canonicalDam,
  checkedFullLevel,
  damReadingProblems,
  parsePortalDate,
  pickStoredName,
} from "@/scraper/lib/dams";

const NOW = Date.UTC(2026, 8, 27, 14, 0, 0);
const KRS = {
  date: parsePortalDate("27 Sep 2026"),
  percentFull: 55,
  level: 2449.28,
  storage: 27.239,
  maxStorage: 49.452,
  inflow: 817,
  outflow: 1899,
};

describe("canonicalDam", () => {
  it("maps every KRS spelling to one dam", () => {
    const names = [
      "K.R.Sagara Dam",
      "Krishna Raja Sagara (KRS)",
      "KRS Dam (Krishnaraja Sagara)",
      "KRS (Krishna Raja Sagara)",
    ];
    const dams = new Set(names.map((n) => canonicalDam(n)?.name));
    expect([...dams]).toEqual(["Krishna Raja Sagara (KRS)"]);
  });

  it("maps the portal and seed spellings of Hemavathi and Kabini", () => {
    expect(canonicalDam("Hemavathy Dam")?.name).toBe("Hemavathi Reservoir");
    expect(canonicalDam("Kabini Dam")?.name).toBe(canonicalDam("Kabini Reservoir")?.name);
    expect(canonicalDam("Almatti Dam")).toBeNull();
  });
});

describe("pickStoredName", () => {
  it("continues the district's existing series (the seed name)", () => {
    expect(pickStoredName("K.R.Sagara Dam", ["Krishna Raja Sagara (KRS)", "Hemavathi Reservoir"])).toBe(
      "Krishna Raja Sagara (KRS)",
    );
    expect(pickStoredName("K.R.Sagara Dam", ["KRS Dam (Krishnaraja Sagara)", "Kabini Reservoir"])).toBe(
      "KRS Dam (Krishnaraja Sagara)",
    );
  });

  it("uses the canonical name for a new dam, and the source name for an unknown one", () => {
    expect(pickStoredName("K.R.Sagara Dam", [])).toBe("Krishna Raja Sagara (KRS)");
    expect(pickStoredName("Almatti Dam", [])).toBe("Almatti Dam");
  });
});

describe("parsePortalDate", () => {
  it("reads the portal's '27 Sep 2026' as that day", () => {
    expect(parsePortalDate("27 Sep 2026")?.toISOString()).toBe("2026-09-27T00:00:00.000Z");
    expect(parsePortalDate("5 September 2026")?.toISOString()).toBe("2026-09-05T00:00:00.000Z");
    expect(parsePortalDate("2026-09-27")).toBeNull();
    expect(parsePortalDate("31 Feb 2026")).toBeNull();
  });
});

describe("damReadingProblems", () => {
  it("accepts the real KRS reading", () => {
    expect(damReadingProblems(KRS, NOW)).toEqual([]);
  });

  it("rejects the portal's 2021 reading and impossible figures", () => {
    // The portal still lists Gayathri Reservoir dated 23 Oct 2021.
    expect(damReadingProblems({ ...KRS, date: parsePortalDate("23 Oct 2021") }, NOW)[0]).toMatch(/days old/);
    expect(damReadingProblems({ ...KRS, percentFull: 140 }, NOW)).toContain("140% full is out of range");
    expect(damReadingProblems({ ...KRS, percentFull: 90 }, NOW)[0]).toMatch(/disagrees with storage/);
    expect(damReadingProblems({ ...KRS, storage: null }, NOW)).toContain("a figure is missing");
    expect(damReadingProblems({ ...KRS, date: null }, NOW)).toEqual(["no valid date"]);
  });
});

describe("checkedFullLevel", () => {
  it("uses the corrected KRS full level (2,468.8 ft, not 2,624)", () => {
    expect(checkedFullLevel("K.R.Sagara Dam", 2449.28)).toEqual({ frlFt: 2468.8, mismatch: false });
  });

  it("stores 'unknown' (0) when a level is above our full level", () => {
    expect(checkedFullLevel("Kabini Dam", 2300)).toEqual({ frlFt: 0, mismatch: true });
    expect(checkedFullLevel("Almatti Dam", 1702)).toEqual({ frlFt: 0, mismatch: false });
  });
});
