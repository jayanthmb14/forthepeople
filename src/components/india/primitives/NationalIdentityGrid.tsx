/**
 * NationalIdentityGrid — one row of six national identity facts
 * (capital, currency, national animal, bird, flower, tree) under the hero
 * banner. Fixed facts, translated through page_india "identity.*".
 *
 * Cells wrap instead of cutting words off, so longer languages fit.
 * Sync server component (useTranslations).
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bird, Building, Flower, IndianRupee, PawPrint, Trees, type LucideIcon } from "lucide-react";
import { INDIA_NS } from "../i18n";

interface IdentityCell {
  key: "capital" | "currency" | "animal" | "bird" | "flower" | "tree";
  icon: LucideIcon;
  glyph: string;
}

const CELLS: IdentityCell[] = [
  { key: "capital", icon: Building, glyph: "🏛" },
  { key: "currency", icon: IndianRupee, glyph: "₹" },
  { key: "animal", icon: PawPrint, glyph: "🐅" },
  { key: "bird", icon: Bird, glyph: "🦚" },
  { key: "flower", icon: Flower, glyph: "🪷" },
  { key: "tree", icon: Trees, glyph: "🌳" },
];

export function NationalIdentityGrid() {
  const t = useTranslations(`${INDIA_NS}.identity`);
  return (
    <ul
      aria-label={t("aria")}
      data-ftp-national-symbols="1"
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: "1px",
        // Peacock-blue gap + border; the tricolor stripe is the only saffron source.
        background: "rgba(30, 95, 139, 0.30)",
        border: "0.5px solid rgba(30, 95, 139, 0.45)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {CELLS.map((cell) => {
        const Icon = cell.icon;
        return (
          <li key={cell.key} style={{ background: "rgba(255, 253, 247, 0.96)", padding: "7px 8px" }}>
            <div
              style={{
                fontFamily: "var(--ftp-font-sans)",
                fontSize: "11px",
                lineHeight: "15px",
                fontWeight: 600,
                color: "#885410",
                marginBottom: "2px",
              }}
            >
              {t(`${cell.key}.label`)}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                lineHeight: "16px",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              <Icon size={11} aria-hidden style={{ color: "#BA7517", flexShrink: 0 }} />
              <span aria-hidden className="ftp-emoji" style={{ fontSize: "12px" }}>
                {cell.glyph}
              </span>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{t(`${cell.key}.value`)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default NationalIdentityGrid;
