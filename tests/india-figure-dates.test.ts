/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Standing facts and old-figure years (src/lib/india/figure-dates.ts).
 */
import { describe, expect, it } from "vitest";
import { isStandingFact, oldFigureYear } from "@/lib/india/figure-dates";

describe("standing facts", () => {
  it("counts, seats, targets and inscription years are standing facts", () => {
    for (const k of ["states_count", "uts_count", "loksabha_seats_total", "forest_cover_target_pct", "unesco_hampi_year", "isfr_year"]) {
      expect(isStandingFact(k)).toBe(true);
    }
  });
  it("measured figures are not (live counters keep their read date)", () => {
    for (const k of ["population_total", "total_pending_crore_cases", "cards_issued_crore", "forest_cover_pct", "unesco_sites_count"]) {
      expect(isStandingFact(k)).toBe(false);
    }
  });
});

describe("oldFigureYear", () => {
  const now = Date.parse("2026-09-28T00:00:00Z");
  it("gives the year of a figure older than 18 months", () => {
    expect(oldFigureYear("2020-12-30T18:30:00.000Z", now)).toBe("2020"); // R&D spending, 31 Dec 2020 IST
    expect(oldFigureYear(new Date("2023-06-30T18:30:00.000Z"), now)).toBe("2023"); // density, 1 Jul 2023 IST
  });
  it("gives nothing for a recent figure or no date", () => {
    expect(oldFigureYear("2026-05-27T00:00:00.000Z", now)).toBeNull();
    expect(oldFigureYear("2025-06-01T00:00:00.000Z", now)).toBeNull(); // ~16 months
    expect(oldFigureYear(null, now)).toBeNull();
    expect(oldFigureYear("not a date", now)).toBeNull();
  });
});
