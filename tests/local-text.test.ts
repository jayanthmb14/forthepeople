/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Stored Hindi/Kannada roles are served only while they name the same
 * offices as the checked English role (src/lib/local-text.ts).
 */
import { describe, expect, it } from "vitest";
import { localRoleMatches, officesNamed, shownRoleLocal } from "../src/lib/local-text";

describe("local role vs English role (Sept 2026 language audit)", () => {
  it("drops the stale 'Chief Minister' on Siddaramaiah's MLA row", () => {
    expect(localRoleMatches("MLA, Varuna", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)")).toBe(false);
    expect(shownRoleLocal("MLA, Varuna", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)")).toBeNull();
  });

  it("drops a Kannada role that leaves out a ministry", () => {
    expect(localRoleMatches("Union Minister for Heavy Industries & Steel; MP, Mandya", "ಲೋಕಸಭಾ ಸದಸ್ಯ")).toBe(false);
    expect(localRoleMatches("Member of Parliament (Lok Sabha) — Union Minister of State", "ಲೋಕಸಭಾ ಸದಸ್ಯ")).toBe(false);
  });

  it("keeps a local role that names the same office", () => {
    expect(shownRoleLocal("MLA, Hebbal", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ")).toBe("ವಿಧಾನಸಭಾ ಸದಸ್ಯ");
    expect(localRoleMatches("MLA, Varuna", "ವಿಧಾನಸಭಾ ಸದಸ್ಯ, ವರುಣ")).toBe(true);
    expect(localRoleMatches("MLA, Pulakeshinagar", "ಶಾಸಕ, ಪುಲಕೇಶಿನಗರ")).toBe(true);
    expect(localRoleMatches("Member of Parliament (Lok Sabha)", "ಲೋಕಸಭಾ ಸದಸ್ಯ")).toBe(true);
    expect(localRoleMatches("Chief Minister of Karnataka", "ಕರ್ನಾಟಕದ ಮುಖ್ಯಮಂತ್ರಿ")).toBe(true);
    expect(localRoleMatches("Deputy Chief Minister", "ಉಪಮುಖ್ಯಮಂತ್ರಿ")).toBe(true);
    expect(localRoleMatches("Member of Parliament (Lok Sabha)", "सांसद (लोकसभा)")).toBe(true);
  });

  it("keeps officer roles that name no elected office", () => {
    expect(localRoleMatches("Deputy Commissioner & District Magistrate", "ಜಿಲ್ಲಾಧಿಕಾರಿ")).toBe(true);
    expect(localRoleMatches("Superintendent of Police, Mysuru", "ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರು, ಮೈಸೂರು")).toBe(true);
    expect(localRoleMatches("Mayor, Mysuru City Corporation", "ಮೈಸೂರು ನಗರ ಪಾಲಿಕೆ ಮೇಯರ್")).toBe(true);
  });

  it("drops a local role that claims an office the English does not", () => {
    expect(localRoleMatches("Deputy Commissioner, Mysuru", "ಮೈಸೂರು ನಗರ ಪಾಲಿಕೆ ಮೇಯರ್")).toBe(false);
    expect(localRoleMatches("MLA, Varuna", "ಲೋಕಸಭಾ ಸದಸ್ಯ")).toBe(false);
  });

  it("serves nothing when either side is empty", () => {
    expect(shownRoleLocal("MLA, Varuna", null)).toBeNull();
    expect(shownRoleLocal("MLA, Varuna", "  ")).toBeNull();
    expect(shownRoleLocal(null, "ವಿಧಾನಸಭಾ ಸದಸ್ಯ")).toBeNull();
  });

  it("reads MP and MLA as abbreviations only (not inside other words)", () => {
    expect(officesNamed("Camp Officer", "en").size).toBe(0);
    expect([...officesNamed("MP, Mandya", "en")]).toEqual(["mp"]);
    expect([...officesNamed("MLA, B.T.M. Layout", "en")]).toEqual(["mla"]);
  });
});
