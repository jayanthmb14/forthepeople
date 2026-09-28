/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  GlyphChips — filter chips that carry their category's picture
// ═══════════════════════════════════════════════════════════════════════
//  The kit's <Chips> (src/components/district/ui.tsx) with a small glyph
//  in front of each label, and each chip in its own pastel colour: a road
//  chip is grey-blue, a water chip cyan, so the row reads at a glance.
//  Same sizes as the kit (34 px, 44 px on phones via .ftp-chip), same
//  pressed state (tint + deep text + hue border). An item without a
//  `pick` (usually "All") uses the page hue and draws no glyph.
//
//    <GlyphChips
//      label={t("list.categoryAria")}
//      value={kind}
//      onChange={setKind}
//      items={[{ value: "all", label: t("all"), count: 23 },
//              { value: "road", label: t("kind.road"), count: 6, pick: projectKindGlyph("road") }]}
//    />
"use client";

import { useTranslations } from "next-intl";
import { Glyph } from "./CategoryGlyph";
import type { GlyphPick } from "./category-map";

export interface GlyphChipItem {
  value: string;
  label: string;
  count?: number;
  pick?: GlyphPick;
}

export function GlyphChips({
  items,
  value,
  onChange,
  label,
}: {
  items: GlyphChipItem[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible group label (default: the kit's "Filter"). */
  label?: string;
}) {
  const tk = useTranslations("kit");
  return (
    <div role="group" aria-label={label ?? tk("filter")} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={`ftp-chip${item.pick ? ` ftp-hue-${item.pick.hue}` : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              minHeight: 34,
              padding: item.pick ? "0 12px 0 8px" : "0 12px",
              borderRadius: "var(--ftp-radius-tile)",
              border: `1px solid ${active ? "var(--hue)" : "var(--ftp-border)"}`,
              background: active ? "var(--hue-tint)" : "var(--ftp-surface)",
              color: active ? "var(--hue-deep)" : "var(--ftp-text)",
              boxShadow: active ? "inset 0 0 0 1px var(--hue)" : undefined,
              transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
              fontFamily: "var(--ftp-font-sans)",
              fontSize: 13,
              lineHeight: "20px",
              fontWeight: active ? 650 : 500,
              cursor: "pointer",
            }}
          >
            {item.pick && <Glyph name={item.pick.glyph} size={20} />}
            {item.label}
            {item.count !== undefined && (
              <span className="ftp-num" style={{ fontSize: 12, color: active ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
