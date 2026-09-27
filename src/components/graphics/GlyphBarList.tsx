/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlyphBarList — "how many of each kind", one picture per row
// ═══════════════════════════════════════════════════════════════════════
//  A ranked list for a ChartCard: each row is the category's glyph chip,
//  its name (+ a small line), the number, and a bar for its share of the
//  biggest row. With colour="row" (default) every row wears its own
//  pastel hue — crime types, kinds of project — so the colours match the
//  chips and cards above. colour="page" keeps the bars in the page hue
//  (a money ranking), and only the chips carry their category colour.
//  Real text and numbers, so screen readers and the ChartCard "table
//  view" read the same values. `dense` packs long lists (a dozen kinds)
//  tighter: smaller chips, thinner bars. Bars grow in once (.ftp-grow-x;
//  off under prefers-reduced-motion).

import type React from "react";
import { CategoryGlyph } from "./CategoryGlyph";
import type { GlyphPick } from "./category-map";

export interface GlyphBarRow {
  key: string;
  label: React.ReactNode;
  /** lang of the label when it is not in the page language (a name as published). */
  labelLang?: string;
  sub?: React.ReactNode;
  value: number;
  /** The value as shown ("4,500", "₹120 Cr"). */
  display: string;
  pick: GlyphPick;
}

export function GlyphBarList({
  rows,
  max,
  colour = "row",
  dense = false,
  ariaLabel,
}: {
  rows: GlyphBarRow[];
  /** Show only the first N rows. */
  max?: number;
  colour?: "row" | "page";
  /** Smaller chips and thinner bars, for long lists. */
  dense?: boolean;
  ariaLabel?: string;
}) {
  const list = typeof max === "number" ? rows.slice(0, max) : rows;
  const top = Math.max(0, ...list.map((r) => r.value));
  if (list.length === 0 || top <= 0) return null;
  const chip = dense ? 30 : 36;
  return (
    <ol aria-label={ariaLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: dense ? 10 : 14 }}>
      {list.map((r, i) => (
        <li key={r.key} className={colour === "row" ? `ftp-hue-${r.pick.hue}` : undefined} style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: dense ? 4 : 6, minWidth: 0 }}>
            <CategoryGlyph pick={r.pick} size={chip} chip />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span lang={r.labelLang} style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)", overflowWrap: "break-word" }}>
                {r.label}
              </span>
              {r.sub && <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{r.sub}</span>}
            </span>
            <span className="ftp-num" style={{ fontSize: 15, fontWeight: 700, color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
              {r.display}
            </span>
          </div>
          <div aria-hidden style={{ height: dense ? 8 : 10, marginInlineStart: chip + 10, borderRadius: 999, background: "color-mix(in srgb, var(--hue-tint) 75%, var(--ftp-surface-2))", overflow: "hidden" }}>
            <div
              className="ftp-grow-x"
              style={{
                width: `${Math.max(3, (r.value / top) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, var(--hue-pop), var(--hue))",
                ["--i" as string]: i,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
