/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlyphStack — a few category chips, overlapping like a hand of cards
// ═══════════════════════════════════════════════════════════════════════
//  For an "All" tile or chip: shows the biggest categories inside it at a
//  glance (e.g. the three busiest news topics). Decorative (aria-hidden);
//  the label beside it says "All stories".
//
//    <GlyphStack picks={topTopics.map((c) => newsTopicGlyph(c.category))} size={32} />

import { CategoryGlyph } from "./CategoryGlyph";
import type { GlyphPick } from "./category-map";

export function GlyphStack({ picks, size = 32, max = 3 }: { picks: GlyphPick[]; size?: number; max?: number }) {
  const shown = picks.slice(0, max);
  if (shown.length === 0) return null;
  const step = Math.round(size * 0.58);
  return (
    <span aria-hidden style={{ position: "relative", display: "inline-block", flexShrink: 0, width: size + step * (shown.length - 1), height: size }}>
      {shown.map((p, i) => (
        <CategoryGlyph
          key={`${p.glyph}-${i}`}
          pick={p}
          size={size}
          chip
          style={{
            position: "absolute",
            insetInlineStart: i * step,
            top: 0,
            zIndex: shown.length - i,
            boxShadow: "0 0 0 2px var(--ftp-surface)",
          }}
        />
      ))}
    </span>
  );
}
