/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlyphScene — a small illustration built from the glyphs
// ═══════════════════════════════════════════════════════════════════════
//  For empty states and quiet moments: a soft pastel cloud, the main glyph
//  on a white tile in the middle, up to two smaller companion glyphs
//  tilted at its sides and a few sparkles. Calm: one gentle pop-in on
//  load (.ftp-pop), nothing loops, and prefers-reduced-motion turns the
//  pop off (globals.css). Purely decorative: aria-hidden, no text.
//
//    <GlyphScene pick={glyphPick("general")} companions={[glyphPick("weather"), glyphPick("farming")]} />

import { CategoryGlyph, Glyph } from "./CategoryGlyph";
import type { GlyphPick } from "./category-map";

/** A four-point sparkle, centred on (x, y), in grid units of the scene. */
function sparkle(x: number, y: number, r: number): string {
  const k = r * 0.28;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}z`;
}

export function GlyphScene({
  pick,
  companions = [],
  size = 120,
}: {
  pick: GlyphPick;
  /** Up to two smaller glyphs beside the main one. */
  companions?: GlyphPick[];
  /** Height in px; the scene is 1.3 × as wide. */
  size?: number;
}) {
  const w = Math.round(size * 1.3);
  const main = Math.round(size * 0.52);
  const side = Math.round(size * 0.3);
  const [left, right] = companions;
  return (
    <span
      aria-hidden
      className={`ftp-hue-${pick.hue}`}
      style={{ position: "relative", display: "inline-block", width: w, height: size, flexShrink: 0 }}
    >
      {/* Soft cloud and a dashed orbit behind everything. */}
      <svg viewBox="0 0 130 100" width={w} height={size} style={{ position: "absolute", inset: 0, display: "block" }} focusable="false">
        <path
          d="M22 58c-8-18 6-40 30-42 10-9 32-9 42 4 18 1 30 18 24 36 8 14-2 32-20 32-8 8-26 9-36 2-14 6-34 0-38-14-10-2-8-16-2-18z"
          fill="var(--hue-tint)"
        />
        <ellipse cx="65" cy="52" rx="50" ry="30" fill="none" stroke="var(--hue-pop)" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" />
        <path d={sparkle(18, 22, 5)} fill="var(--hue)" opacity="0.55" />
        <path d={sparkle(114, 80, 4)} fill="var(--hue)" opacity="0.45" />
        <circle cx="108" cy="18" r="2.5" fill="var(--hue-pop)" />
        <circle cx="26" cy="86" r="2" fill="var(--hue-pop)" />
      </svg>

      {/* The main glyph on a white tile. */}
      <span
        className="ftp-pop"
        style={{
          position: "absolute",
          left: (w - main) / 2,
          top: (size - main) / 2,
          width: main,
          height: main,
          borderRadius: Math.round(main * 0.3),
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ftp-surface)",
          border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          boxShadow: "var(--ftp-shadow-2)",
        }}
      >
        <Glyph name={pick.glyph} size={Math.round(main * 0.66)} />
      </span>

      {left && (
        <CategoryGlyph
          pick={left}
          size={side}
          chip
          className="ftp-pop"
          style={{ position: "absolute", left: Math.round(w * 0.06), top: Math.round(size * 0.1), rotate: "-8deg", ["--i" as string]: 2 }}
        />
      )}
      {right && (
        <CategoryGlyph
          pick={right}
          size={side}
          chip
          className="ftp-pop"
          style={{ position: "absolute", right: Math.round(w * 0.05), bottom: Math.round(size * 0.08), rotate: "7deg", ["--i" as string]: 4 }}
        />
      )}
    </span>
  );
}
