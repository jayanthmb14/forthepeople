/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  India dashboard → drawn glyphs (v5.1 "Warm Calm", Sep 2026)
// ═══════════════════════════════════════════════════════════════════════
//  The India pages used an emoji for every module, topic and card (about
//  120 on /india alone). They now draw the shared glyphs from
//  src/components/graphics, chosen here from the module slug, the module
//  category or the super-category — never from the registry's `icon`
//  emoji, which stays as data only.
//
//    <CategoryGlyph pick={indiaModuleGlyph("wildlife-tigers")} size={16} />
//    <CategoryGlyph pick={indiaCategoryGlyph("energy")} size={32} chip />
//    <CategoryGlyph pick={indiaSuperCategoryGlyph("culture")} size={48} chip />
//
//  Each glyph keeps its own pastel hue (the same picture looks the same on
//  every page); a few modules set another hue where the colour carries
//  meaning (an oil drop is dark, a medal is gold, silver or bronze).
//  Pure data, no React: safe in server and client components.

import { glyphPick, type GlyphName, type GlyphPick } from "@/components/graphics";
import type { Hue } from "@/lib/design/hues";
import type { IndiaModuleCategory } from "@/lib/india/india-modules";

type Entry = GlyphName | { glyph: GlyphName; hue: Hue };

const pick = (e: Entry): GlyphPick => (typeof e === "string" ? glyphPick(e) : e);

/** Module slug → glyph (every module in INDIA_MODULES; tests/category-glyph.test.ts checks it). */
const MODULE: Record<string, Entry> = {
  // Macro snapshot
  "national-snapshot": "map",
  "demographics-population": "people",
  "economy-gdp": "growth",
  "economy-inflation": "business",
  "economy-employment": "briefcase",
  "budget-union": "civic",
  "budget-gst": "money",
  // Agriculture and livestock
  "agriculture-production": "farming",
  "agriculture-plantation": "farming",
  "agriculture-pmkisan": "money",
  "livestock-census": "cow",
  "livestock-fisheries": "fish",
  // Wildlife and forests
  "wildlife-forests": "parks",
  "wildlife-tigers": "paw",
  "wildlife-protected-areas": { glyph: "shield", hue: "green" },
  // Infrastructure
  "infra-roads": "road",
  "infra-railways": "rail",
  "infra-aviation": "airport",
  "infra-ports": "port",
  "infra-telecom": "phone",
  "infra-smart-cities": "city",
  // Natural resources and energy
  "energy-power": "power",
  "energy-renewables": "sun",
  "energy-fuels": { glyph: "water", hue: "slate" },
  "energy-coal": { glyph: "industry", hue: "slate" },
  // Living standards
  "health-overview": "health",
  "health-pmjay": "hospital",
  "health-immunisation": "health",
  "education-schools": "school",
  "education-higher": "education",
  "education-skills": "hardhat",
  // Governance
  "defence-budget": "shield",
  "defence-exports": "airport",
  "defence-dpsu": "industry",
  "justice-pendency": "justice",
  "justice-crime": "crime",
  "justice-police": "shield",
  "justice-prisons": "lock",
  "elections-loksabha": "politics",
  "elections-rajyasabha": "civic",
  "elections-turnout": "politics",
  // Innovation and trade
  "science-isro": "rocket",
  "science-rd": "flask",
  "science-startups": "rocket",
  "science-digital": "phone",
  "trade-overview": "globe",
  "trade-fdi": "briefcase",
  "trade-diaspora": "airport",
  // Culture, tourism and sport
  "tourism-overview": "airport",
  "tourism-heritage": "civic",
  "tourism-gi-tags": "business",
  "sports-olympics": "medal",
  "sports-khelo-india": "medal",
  // Know India
  "know-india-constitution": "book",
  "know-india-history-timeline": "civic",
  "know-india-geography-physical": "map",
  "know-india-parliament": "civic",
  "know-india-elections": "politics",
  "know-india-budget": "money",
};

/** Module category → glyph (topic chips and rows on the update log). */
const CATEGORY: Record<IndiaModuleCategory, GlyphName> = {
  snapshot: "map",
  demographics: "people",
  economy: "growth",
  budget: "money",
  agriculture: "farming",
  livestock: "cow",
  wildlife: "paw",
  infrastructure: "construction",
  energy: "power",
  health: "health",
  education: "education",
  defence: "shield",
  justice: "justice",
  elections: "politics",
  science: "flask",
  trade: "globe",
  tourism: "airport",
  sports: "medal",
  custom: "book",
};

/** Super-category slug → glyph (category page hero, band watermarks). */
const SUPER_CATEGORY: Record<string, GlyphName> = {
  "macro-snapshot": "growth",
  "know-india": "book",
  "living-standards": "people",
  "wildlife-forests": "paw",
  "agriculture-livestock": "farming",
  "natural-resources-energy": "power",
  infrastructure: "construction",
  governance: "justice",
  innovation: "rocket",
  culture: "lotus",
};

export const INDIA_MODULE_GLYPH_SLUGS = Object.keys(MODULE);

export function indiaModuleGlyph(slug: string | null | undefined, category?: IndiaModuleCategory): GlyphPick {
  const e = MODULE[(slug ?? "").trim()];
  if (e) return pick(e);
  return category ? indiaCategoryGlyph(category) : glyphPick("general");
}

export function indiaCategoryGlyph(category: IndiaModuleCategory | string | null | undefined): GlyphPick {
  return glyphPick(CATEGORY[(category ?? "") as IndiaModuleCategory] ?? "general");
}

export function indiaSuperCategoryGlyph(slug: string | null | undefined): GlyphPick {
  return glyphPick(SUPER_CATEGORY[(slug ?? "").trim()] ?? "general");
}

/** Gold, silver and bronze for the top three ranks (the medal glyph). */
export function medalPick(rank: number): GlyphPick | null {
  const hue: Hue | undefined = rank === 1 ? "yellow" : rank === 2 ? "slate" : rank === 3 ? "orange" : undefined;
  return hue ? { glyph: "medal", hue } : null;
}
