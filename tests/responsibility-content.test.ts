/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// "What you can do" fallback text (src/lib/constants/responsibility-content.ts).
// Bengaluru Urban has no researched ResponsibilityItem rows, so this text is
// all its visitors get. BBMP was dissolved on 2 Sep 2025 (the Greater
// Bengaluru Authority and five city corporations replaced it): the text must
// not send citizens to BBMP or quote BBMP-only figures.
import { describe, expect, it } from "vitest";
import { getResponsibilityContent } from "@/lib/constants/responsibility-content";

const bengaluru = getResponsibilityContent("bengaluru-urban");
const lines = [bengaluru.intro, ...bengaluru.sections.flatMap((s) => [s.title, ...s.items])];

describe("Bengaluru Urban responsibility text", () => {
  it("is the Bengaluru entry, not the generic one", () => {
    expect(bengaluru.districtName).toBe("Bengaluru Urban");
  });

  it("never names BBMP", () => {
    for (const line of lines) expect(line).not.toMatch(/\bBBMP\b/);
  });

  it("drops the BBMP-era ward count, apps and the BES-COM typo", () => {
    for (const line of lines) {
      expect(line).not.toMatch(/243 wards/);
      expect(line).not.toMatch(/Sahaaya|SWM app/);
      expect(line).not.toMatch(/BES-COM/);
    }
  });

  it("points to the city corporation instead", () => {
    expect(lines.some((l) => l.includes("Greater Bengaluru Authority"))).toBe(true);
  });
});
