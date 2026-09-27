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

  it("finds none in kn.json and kn/*.json", () => {
    const bad = strings("kn").filter(([, v]) => GLUED.test(v)).map(([k, v]) => `${k} → ${v}`);
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
