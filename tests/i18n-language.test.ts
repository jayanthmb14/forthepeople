/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Hindi and Kannada text rules found in the Sept 2026 language audit.
 * Pure file checks on src/dictionaries (no DB, no network).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "@formatjs/icu-messageformat-parser";
import { INDIA_STATES } from "../src/lib/constants/districts";
import { placeName } from "../src/i18n/place-name";
import { scriptLang } from "../src/lib/utils/script-lang";

const DICT = join(__dirname, "..", "src", "dictionaries");

/** Every string in a locale's dictionaries, as ["file:key.path", value]. */
function strings(locale: string): Array<[string, string]> {
  const files = [`${locale}.json`, ...readdirSync(join(DICT, locale)).filter((f) => f.endsWith(".json")).map((f) => `${locale}/${f}`)];
  const out: Array<[string, string]> = [];
  const walk = (file: string, v: unknown, path: string) => {
    if (typeof v === "string") out.push([`${file}:${path}`, v]);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(file, x, path ? `${path}.${k}` : k);
  };
  for (const f of files) walk(f, JSON.parse(readFileSync(join(DICT, f), "utf8")), "");
  return out;
}

describe("Kannada: no case ending glued to a place name", () => {
  // Kannada case endings depend on how the noun ends (ಮಂಡ್ಯ → ಮಂಡ್ಯದ,
  // ಮೈಸೂರು → ಮೈಸೂರಿನ), so "{district}ನ" / "{district} ಗಾಗಿ" come out wrong
  // ("ಮಂಡ್ಯನ", "ಮಂಡ್ಯ ಗಾಗಿ"). Write "{district} ಜಿಲ್ಲೆಯ", "{state} ರಾಜ್ಯದ",
  // or put the name before a colon.
  const PLACE = "district|name|state|dam|taluk|village|city|districtName|stateName|place";
  const SUFFIX = "ನ|ನಲ್ಲಿ|ಗಾಗಿ|ಗೆ|ಕ್ಕೆ|ದ|ದಲ್ಲಿ|ದಿಂದ|ನಿಂದ|ಕ್ಕಾಗಿ|ಯ|ಯಲ್ಲಿ|ವನ್ನು|ನ್ನು";
  const GLUED = new RegExp(`\\{(?:${PLACE})\\}\\s?(?:${SUFFIX})(?![\\u0C80-\\u0CFF])`);

  // Lines left for the merge with v54/fix-news (kn page_verify.introOverview)
  // were fixed in v54/merge-rest; nothing is pending now.
  const MERGE_PENDING = new Set<string>();

  it("finds none in kn.json and kn/*.json", () => {
    const bad = strings("kn")
      .filter(([k, v]) => GLUED.test(v) && !MERGE_PENDING.has(k))
      .map(([k, v]) => `${k} → ${v}`);
    expect(bad).toEqual([]);
  });
});

describe("Kannada names for the live districts", () => {
  it("every live district has a name in Kannada script on /kn", () => {
    const missing: string[] = [];
    for (const s of INDIA_STATES) {
      for (const d of s.districts) {
        if (!d.active) continue;
        const kn = placeName(d, "kn");
        if (scriptLang(kn) !== "kn") missing.push(`${s.slug}/${d.slug} → ${kn}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("Hindi and Kannada plurals", () => {
  // CLDR's "one" category in Hindi and Kannada covers 0 as well as 1
  // (Intl.PluralRules("hi").select(0) === "one"), so "one {# खुला टेंडर}"
  // printed "0 खुला टेंडर". Use "=1 {…}" for the singular.
  // The nine lines left for the merge (also edited on other Sept 2026 fix
  // branches), and the plurals those branches added (page_crops
  // tileMarketsSub, page_jjm answer.mainHundred), were converted to "=1" in
  // v54/merge-rest; nothing is pending now.
  const MERGE_PENDING = new Set<string>();
  for (const locale of ["hi", "kn"]) {
    it(`${locale}: no plural uses the 'one' selector (it also catches 0)`, () => {
      const bad = strings(locale)
        .filter(([k, v]) => /plural,/.test(v) && /(?<![=\w])one \{/.test(v) && !MERGE_PENDING.has(k))
        .map(([k]) => k);
      expect(bad).toEqual([]);
    });
  }

  it("every en/hi/kn message is valid ICU", () => {
    const bad: string[] = [];
    for (const locale of ["en", "hi", "kn"]) {
      for (const [k, v] of strings(locale)) {
        try {
          parse(v);
        } catch (e) {
          bad.push(`${k}: ${(e as Error).message}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("Hindi: one spelling per word", () => {
  // The Hindi pages mixed जिला/ज़िला, खर्च/ख़र्च and आंकड़े/आँकड़े (and
  // 'यह पन्ना शेयर करें' vs 'यह पेज साझा करें'). The site uses the forms most
  // of its Hindi text already had: जिला, खर्च, आँकड़े, 'यह पेज शेयर करें'.
  const VARIANTS: Array<[string, RegExp]> = [
    ["ज़िला (use जिला)", /ज़िल|ज़िल/],
    ["ख़र्च (use खर्च)", /ख़र्च|ख़र्च/],
    ["आंकड़ (use आँकड़)", /आंक(?:ड़|ड़)/],
    ["share wording (use 'यह पेज शेयर करें')", /यह पन्ना शेयर करें|यह पेज साझा करें/],
  ];
  // The four lines left for the merge, and the ज़िला lines other Sept 2026
  // fix branches added, were respelled in v54/merge-rest; nothing is pending.
  const MERGE_PENDING = new Set<string>();

  it("uses the chosen spelling everywhere", () => {
    const bad: string[] = [];
    for (const [k, v] of strings("hi")) {
      if (MERGE_PENDING.has(k)) continue;
      for (const [name, re] of VARIANTS) if (re.test(v)) bad.push(`${k}: ${name}`);
    }
    expect(bad).toEqual([]);
  });
});
