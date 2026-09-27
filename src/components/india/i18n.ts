/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Translated reference text for the India dashboard.
 *
 * The India registries (src/lib/india/india-modules.ts and
 * india-super-categories.ts) hold English titles, taglines and
 * descriptions. Their translations live in the page_india namespace
 * (src/dictionaries/<locale>/page_india.json → "mod.<slug>") and in the
 * shared "india.superCategory" keys. These helpers pick the translation
 * when it exists and fall back to the registry's English text, so a new
 * module shows up in English until someone adds its keys.
 *
 * Works on the server and the client: pass a translator from
 * useTranslations / getTranslations.
 */

import type { IndiaModuleCategory, IndiaModuleStatus } from "@/lib/india/india-modules";

/** Namespace for the India pages' own text (shared by all India routes). */
export const INDIA_NS = "page_india";

/** The part of a next-intl translator these helpers need. */
export interface Tr {
  (key: string, values?: Record<string, string | number | Date>): string;
  has(key: string): boolean;
}

/** Super-category slug → key under "india.superCategory" in the shared dictionary. */
export const SC_KEY: Record<string, string> = {
  "macro-snapshot": "macroSnapshot",
  "know-india": "knowIndia",
  "living-standards": "livingStandards",
  "wildlife-forests": "wildlifeForests",
  "agriculture-livestock": "agricultureLivestock",
  "natural-resources-energy": "naturalResourcesEnergy",
  infrastructure: "infrastructure",
  governance: "governance",
  innovation: "innovation",
  culture: "culture",
};

/** "JUSTICE" → "Justice" (registry sub-groups are stored in capitals). */
function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * @param t   translator for the "page_india" namespace
 * @param ti  translator for the shared "india" namespace
 */
export function indiaText(t: Tr, ti: Tr) {
  const pick = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  return {
    moduleTitle: (m: { slug: string; title: string }) => pick(`mod.${m.slug}.t`, m.title),
    moduleTagline: (m: { slug: string; tagline: string }) => pick(`mod.${m.slug}.g`, m.tagline),
    moduleDescription: (m: { slug: string; description: string }) => pick(`mod.${m.slug}.d`, m.description),
    scTitle: (sc: { slug: string; title: string }) => {
      const k = `superCategory.${SC_KEY[sc.slug]}.title`;
      return SC_KEY[sc.slug] && ti.has(k) ? ti(k) : sc.title;
    },
    scTagline: (sc: { slug: string; tagline: string }) => {
      const k = `superCategory.${SC_KEY[sc.slug]}.tagline`;
      return SC_KEY[sc.slug] && ti.has(k) ? ti(k) : sc.tagline;
    },
    category: (c: IndiaModuleCategory) => pick(`cat.${c}`, c),
    subGroup: (g: string) => pick(`subGroup.${g}`, sentenceCase(g)),
    status: (s: IndiaModuleStatus) => pick(`status.${s}`, s),
    /** Short status word for pills: live → "Live", anything else → "Soon". */
    statusShort: (s: IndiaModuleStatus) => (s === "live" ? t("status.live") : t("status.soon")),
  };
}

export type IndiaText = ReturnType<typeof indiaText>;
