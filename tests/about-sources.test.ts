/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The About page's data-source list (src/lib/constants/about-sources.ts)
// must name only sources our data comes from, and every entry needs its
// one-line description in all three languages.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ABOUT_DATA_SOURCES } from "@/lib/constants/about-sources";

const messages = (locale: string) =>
  JSON.parse(readFileSync(path.join(__dirname, "..", "src", "dictionaries", locale, "page_about.json"), "utf8")) as Record<string, string>;

describe("About page data sources", () => {
  it("has a src_<key> description in en, hi and kn for every entry", () => {
    for (const locale of ["en", "hi", "kn"]) {
      const m = messages(locale);
      for (const s of ABOUT_DATA_SOURCES) expect(m[`src_${s.key}`], `${locale}: src_${s.key}`).toBeTruthy();
    }
  });

  it("has no description left over for a removed entry", () => {
    const keys = new Set(ABOUT_DATA_SOURCES.map((s) => `src_${s.key}`));
    for (const locale of ["en", "hi", "kn"]) {
      const extra = Object.keys(messages(locale)).filter((k) => k.startsWith("src_") && !keys.has(k));
      expect(extra, locale).toEqual([]);
    }
  });

  it("does not name sources nothing reads (eGramSwaraj, PFMS, PMAY, India-WRIS, IMD)", () => {
    const names = ABOUT_DATA_SOURCES.map((s) => s.name).join(" | ");
    expect(names).not.toMatch(/eGramSwaraj|PFMS|PMAY|India-WRIS|\bIMD\b/);
  });

  it("names the sources the live collectors read", () => {
    const keys = ABOUT_DATA_SOURCES.map((s) => s.key);
    for (const k of ["njdg", "jjm", "nrega", "sachet", "tenders", "openmeteo", "udise", "agmarknet"]) expect(keys).toContain(k);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
