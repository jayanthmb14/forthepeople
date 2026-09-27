/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Judges are listed with the courts, not as a level of government
 * (src/lib/civic/leader-level.ts; Sept 2026 language audit).
 */
import { describe, expect, it } from "vitest";
import { COURTS_TIER, isJudicialRole, ladderTier } from "../src/lib/civic/leader-level";

describe("ladderTier", () => {
  it("moves the High Court Chief Justice out of 'City and departments'", () => {
    expect(ladderTier({ tier: 5, role: "Chief Justice, Telangana High Court" })).toBe(COURTS_TIER);
    expect(ladderTier({ tier: 5, role: "Chief Justice, Calcutta High Court" })).toBe(COURTS_TIER);
    expect(ladderTier({ tier: 6, role: "Principal District & Sessions Judge, Pune" })).toBe(COURTS_TIER);
  });

  it("leaves government roles on their own level", () => {
    expect(ladderTier({ tier: 2, role: "Minister for Social Justice and Empowerment" })).toBe(2);
    expect(ladderTier({ tier: 3, role: "Deputy Commissioner & District Magistrate" })).toBe(3);
    expect(ladderTier({ tier: 4, role: "MLA, Varuna" })).toBe(4);
    expect(ladderTier({ tier: 5, role: "Mayor, Mysuru City Corporation" })).toBe(5);
  });

  it("reads judicial roles only", () => {
    expect(isJudicialRole("Chief Justice, Madras High Court")).toBe(true);
    expect(isJudicialRole("Principal Judge, City Civil Court")).toBe(true);
    expect(isJudicialRole("Advocate General, Karnataka")).toBe(false);
    expect(isJudicialRole(null)).toBe(false);
  });
});
