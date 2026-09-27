/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Category → glyph + pastel colour (pure, no React; tested in
//  tests/category-glyph.test.ts)
// ═══════════════════════════════════════════════════════════════════════
//  Every category gets one picture and one of the 14 module hues, so the
//  same kind of thing looks the same everywhere: a crime story on News, a
//  crime type on Police and a crime chip anywhere else share the handcuffs
//  and the rose colour. Hues are identity only (docs/DESIGN-SYSTEM.md):
//  the tint and pastel behind the glyph, the deep tone for its outline.
//
//    newsTopicGlyph("agriculture")          → farming · green
//    newsStoryGlyph({ category, targetModule })
//    crimeGlyph("Crimes Against Women")      → women · pink
//    projectKindGlyph("metro")               → metro · violet
//    moduleGlyph("courts")                   → justice · slate
//    categoryGlyph(anyText, domain?)         → best guess, else newspaper
//
//  Nothing here decides what a row IS: pages keep their own labels and
//  counts. The glyph only draws the category the data already carries.

import type { Hue } from "@/lib/design/hues";
import { projectKind, type ProjectKind } from "@/lib/civic/project-facts";
import { GLYPHS, type GlyphName } from "./glyph-data";

export interface GlyphPick {
  glyph: GlyphName;
  hue: Hue;
}

export type GlyphDomain = "news" | "crime" | "project" | "module";

/** Default pastel hue for each glyph (distinct within each domain). */
export const GLYPH_HUE: Record<GlyphName, Hue> = {
  // news topics
  general: "blue",
  politics: "indigo",
  crime: "rose",
  accident: "orange",
  weather: "sky",
  farming: "green",
  health: "pink",
  education: "violet",
  construction: "amber",
  business: "yellow",
  civic: "teal",
  growth: "lime",
  justice: "slate",
  money: "yellow",
  bus: "teal",
  // crime types
  theft: "amber",
  burglary: "teal",
  assault: "rose",
  cyber: "indigo",
  fraud: "orange",
  traffic: "slate",
  women: "pink",
  child: "violet",
  shield: "blue",
  // kinds of project
  road: "slate",
  bridge: "indigo",
  metro: "violet",
  rail: "teal",
  airport: "sky",
  port: "blue",
  water: "cyan",
  sewage: "lime",
  power: "yellow",
  housing: "orange",
  city: "blue",
  hospital: "pink",
  school: "rose",
  parks: "green",
  industry: "amber",
  hardhat: "slate",
};

/** A glyph with its default hue. */
export function glyphPick(glyph: GlyphName): GlyphPick {
  return { glyph, hue: GLYPH_HUE[glyph] };
}

export function isGlyphName(name: string): name is GlyphName {
  return Object.prototype.hasOwnProperty.call(GLYPHS, name);
}

// ─────────────────────────────────────────────────────────────────────
//  News
// ─────────────────────────────────────────────────────────────────────

/**
 * News topics (NewsItem.category from the keyword classifier) → glyph.
 * The first nine are what the pipeline writes today; the rest are ready
 * for topics it may add ("accident", "business", "civic").
 */
export const NEWS_TOPIC_GLYPH: Record<string, GlyphName> = {
  politics: "politics",
  development: "growth",
  agriculture: "farming",
  farming: "farming",
  crime: "crime",
  health: "health",
  education: "education",
  infrastructure: "construction",
  weather: "weather",
  general: "general",
  accident: "accident",
  accidents: "accident",
  business: "business",
  economy: "business",
  civic: "civic",
};

/** Topics that say little on their own, so a story's module tag may say more. */
const VAGUE_TOPICS = new Set(["general", "development", ""]);

export function newsTopicGlyph(category: string | null | undefined): GlyphPick {
  const key = (category ?? "").trim().toLowerCase();
  return glyphPick(NEWS_TOPIC_GLYPH[key] ?? "general");
}

/**
 * One story. Its topic decides, unless the topic is vague ("general",
 * "development") and the pipeline tagged the story with a module page
 * (courts, housing, water …) — then that page's glyph says more.
 */
export function newsStoryGlyph(story: { category?: string | null; targetModule?: string | null }): GlyphPick {
  const topic = (story.category ?? "").trim().toLowerCase();
  const mod = (story.targetModule ?? "").trim();
  if (VAGUE_TOPICS.has(topic) && mod && mod !== "news" && MODULE_GLYPH[mod]) return moduleGlyph(mod);
  return newsTopicGlyph(topic);
}

// ─────────────────────────────────────────────────────────────────────
//  Modules (and the news pipeline's module tags)
// ─────────────────────────────────────────────────────────────────────

/** Module slugs and news module tags → glyph. */
export const MODULE_GLYPH: Record<string, GlyphName> = {
  news: "general",
  leaders: "politics",
  leadership: "politics",
  elections: "politics",
  "gram-panchayat": "civic",
  courts: "justice",
  police: "shield",
  alerts: "weather",
  weather: "weather",
  budget: "money",
  finance: "money",
  tenders: "money",
  infrastructure: "construction",
  industries: "industry",
  "sugar-factory": "industry",
  schemes: "civic",
  housing: "housing",
  services: "civic",
  offices: "civic",
  "citizen-corner": "civic",
  rti: "civic",
  "file-rti": "civic",
  exams: "education",
  education: "school",
  schools: "school",
  jjm: "water",
  water: "water",
  power: "power",
  transport: "bus",
  health: "hospital",
  crops: "farming",
  farm: "farming",
  soil: "farming",
  population: "city",
};

export function moduleGlyph(slug: string | null | undefined): GlyphPick {
  return glyphPick(MODULE_GLYPH[(slug ?? "").trim()] ?? "general");
}

// ─────────────────────────────────────────────────────────────────────
//  Crime types (CrimeStat.category, as NCRB and police reports name them)
// ─────────────────────────────────────────────────────────────────────

/** Checked in order: the first rule whose words appear wins. */
const CRIME_RULES: Array<[GlyphName, RegExp]> = [
  ["shield", /\btotal\b|^ipc crimes?$|^all crimes?$|^cognizable/i],
  ["women", /women|woman|dowry|rape|molest|sexual|stalk|domestic violence|cruelty by husband/i],
  ["child", /child|minor|juvenile|pocso|kidnap|abduct|missing|traffick/i],
  ["cyber", /cyber|online|digital|\bit act\b|internet/i],
  ["fraud", /cheat|fraud|forg|counterfeit|scam|embezzl|breach of trust|economic/i],
  ["theft", /theft|steal|stolen|robber|snatch|property|loot|pickpocket|dacoity/i],
  ["burglary", /burglar|house.?break|trespass/i],
  ["assault", /murder|assault|hurt|attack|violen|riot|kill|homicide|grievous|arson|body/i],
  ["traffic", /traffic|road|accident|rash|drunk|hit.and.run|vehicle|motor/i],
];

export function crimeGlyph(category: string | null | undefined): GlyphPick {
  const text = (category ?? "").trim();
  for (const [glyph, re] of CRIME_RULES) if (re.test(text)) return glyphPick(glyph);
  return glyphPick("shield");
}

// ─────────────────────────────────────────────────────────────────────
//  Kinds of project (src/lib/civic/project-facts ProjectKind)
// ─────────────────────────────────────────────────────────────────────

export const PROJECT_KIND_GLYPH: Record<ProjectKind, GlyphName> = {
  road: "road",
  bridge: "bridge",
  metro: "metro",
  rail: "rail",
  airport: "airport",
  port: "port",
  water: "water",
  sewage: "sewage",
  power: "power",
  housing: "housing",
  health: "hospital",
  education: "school",
  parks: "parks",
  industry: "industry",
  city: "city",
  other: "hardhat",
};

export function projectKindGlyph(kind: ProjectKind | string | null | undefined): GlyphPick {
  const k = (kind ?? "other") as ProjectKind;
  return glyphPick(PROJECT_KIND_GLYPH[k] ?? "hardhat");
}

// ─────────────────────────────────────────────────────────────────────
//  Anything
// ─────────────────────────────────────────────────────────────────────

/**
 * Best glyph for any category text. With a domain, that domain's rules
 * decide. Without one: a glyph name, a news topic, a module slug, then a
 * kind of project from the words; else the newspaper.
 */
export function categoryGlyph(text: string | null | undefined, domain?: GlyphDomain): GlyphPick {
  const raw = (text ?? "").trim();
  if (domain === "crime") return crimeGlyph(raw);
  if (domain === "project") return projectKindGlyph(projectKind(raw, raw));
  if (domain === "module") return moduleGlyph(raw);
  if (domain === "news") return newsTopicGlyph(raw);
  const key = raw.toLowerCase();
  if (isGlyphName(key)) return glyphPick(key);
  if (NEWS_TOPIC_GLYPH[key]) return glyphPick(NEWS_TOPIC_GLYPH[key]);
  if (MODULE_GLYPH[key]) return glyphPick(MODULE_GLYPH[key]);
  const kind = projectKind(raw, raw);
  if (kind !== "other") return projectKindGlyph(kind);
  return glyphPick("general");
}
