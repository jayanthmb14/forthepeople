/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  <Glyph> and <CategoryGlyph> — the crafted category pictures
// ═══════════════════════════════════════════════════════════════════════
//  <Glyph name="metro" size={24} />
//      the bare drawing, coloured by the hue variables around it
//      (--hue-pop fill, --hue-deep outline, --hue accent).
//
//  <CategoryGlyph glyph="metro" size={40} chip />
//  <CategoryGlyph category="Cyber Crimes" domain="crime" size={32} chip />
//  <CategoryGlyph pick={newsStoryGlyph(story)} size={40} chip />
//      the same drawing in its own pastel colour; `chip` puts it on a soft
//      rounded tile (tint → white wash, hairline border in the hue).
//
//  Sizes: 16 / 20 / 24 inline, 32 / 40 / 48 as chips; the outline stays
//  near 2 px at every size. Decorative by default (aria-hidden): the text
//  next to it says what it is. Pass `title` only when the glyph stands
//  alone. No hooks, no text of its own: safe in server and client
//  components. Tokens and hue classes only, never hex.

import type React from "react";
import type { Hue } from "@/lib/design/hues";
import { glyphParts, type GlyphName, type GlyphPart } from "./glyph-data";
import { categoryGlyph, GLYPH_HUE, type GlyphDomain, type GlyphPick } from "./category-map";

/** Outline width in grid units: about 1.4 px at 16 px, 2 px at 32 px, 2.6 px at 48 px. */
export function glyphStroke(size: number): number {
  if (size <= 18) return 2;
  if (size <= 26) return 1.75;
  if (size <= 36) return 1.5;
  return 1.3;
}

const FILL: Record<GlyphPart[0], string> = {
  b: "var(--hue-pop)",
  s: "none",
  f: "var(--hue-pop)",
  i: "var(--hue-deep)",
  a: "var(--hue)",
  p: "var(--ftp-surface)",
  w: "none",
};
const STROKE: Record<GlyphPart[0], string | undefined> = {
  b: "var(--hue-deep)",
  s: "var(--hue-deep)",
  f: undefined,
  i: undefined,
  a: undefined,
  p: "var(--hue-deep)",
  w: "var(--ftp-surface)",
};

/** The bare drawing (24 × 24 grid) at any size. */
export function Glyph({
  name,
  size = 24,
  title,
  className,
  style,
}: {
  name: GlyphName;
  size?: number;
  /** Accessible name; leave it out when text beside the glyph says the same. */
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const parts = glyphParts(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", flexShrink: 0, overflow: "visible", ...style }}
      strokeWidth={glyphStroke(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {parts.map(([tone, d, hue], i) => (
        <path
          key={i}
          d={d}
          className={hue ? `ftp-hue-${hue}` : undefined}
          fill={FILL[tone]}
          stroke={STROKE[tone]}
        />
      ))}
    </svg>
  );
}

/** Tile look for a chip of `size` px. */
export function glyphChipStyle(size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.3),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "var(--hue-tint)",
    border: "1px solid color-mix(in srgb, var(--hue) 14%, transparent)",
  };
}

/**
 * A glyph in its category colour, optionally on a pastel tile.
 * Give it a `glyph` (+ optional `hue`), a ready `pick`, or a `category`
 * text (+ `domain`) and it chooses the picture itself.
 */
export function CategoryGlyph({
  glyph,
  hue,
  pick,
  category,
  domain,
  size = 24,
  chip = false,
  title,
  className,
  style,
}: {
  glyph?: GlyphName;
  hue?: Hue;
  pick?: GlyphPick;
  category?: string | null;
  domain?: GlyphDomain;
  /** Outer size in px (the tile when `chip`, else the drawing). */
  size?: number;
  chip?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const chosen: GlyphPick = pick ?? (glyph ? { glyph, hue: GLYPH_HUE[glyph] } : categoryGlyph(category, domain));
  const h = hue ?? chosen.hue;
  const hueCls = `ftp-hue-${h}`;
  if (!chip) {
    return <Glyph name={chosen.glyph} size={size} title={title} className={[hueCls, className].filter(Boolean).join(" ")} style={style} />;
  }
  const inner = Math.round(size * 0.62);
  return (
    <span
      className={[hueCls, className].filter(Boolean).join(" ")}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ ...glyphChipStyle(size), ...style }}
    >
      <Glyph name={chosen.glyph} size={inner} />
    </span>
  );
}
