/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Shared graphics (v5.1 "Warm Calm") — crafted SVG category glyphs
// ═══════════════════════════════════════════════════════════════════════
//  Pictures that tell categories apart at a glance, in place of emoji:
//  news topics, crime types and kinds of project, each with one pastel
//  module hue. Everything is drawn with the hue variables, so there is no
//  hex here and dark text stays AA.
//
//  Use:
//    import { CategoryGlyph, newsStoryGlyph } from "@/components/graphics";
//    <CategoryGlyph pick={newsStoryGlyph(story)} size={40} chip />
//    <CategoryGlyph category="Cyber Crimes" domain="crime" size={32} chip />
//    <GlyphChips items={…} />          filter chips with glyphs
//    <GlyphBarList rows={…} />         "how many of each kind" with glyphs
//    <GlyphEmptyState pick={…} … />    empty state with a small illustration
//
//  Adding a glyph: draw it in glyph-data.ts (24 × 24 grid, the part tones
//  explained there), give it a hue in GLYPH_HUE (category-map.ts), map the
//  category words to it, and extend tests/category-glyph.test.ts.

export { GLYPHS, GLYPH_NAMES, glyphParts, type GlyphName, type GlyphPart, type GlyphTone } from "./glyph-data";
export {
  GLYPH_HUE,
  NEWS_TOPIC_GLYPH,
  MODULE_GLYPH,
  PROJECT_KIND_GLYPH,
  categoryGlyph,
  crimeGlyph,
  glyphPick,
  isGlyphName,
  moduleGlyph,
  newsStoryGlyph,
  newsTopicGlyph,
  projectKindGlyph,
  type GlyphDomain,
  type GlyphPick,
} from "./category-map";
export { CategoryGlyph, Glyph, glyphChipStyle, glyphStroke } from "./CategoryGlyph";
export { GlyphChips, type GlyphChipItem } from "./GlyphChips";
export { GlyphBarList, type GlyphBarRow } from "./GlyphBarList";
export { GlyphScene } from "./GlyphScene";
export { GlyphEmptyState } from "./GlyphEmptyState";
