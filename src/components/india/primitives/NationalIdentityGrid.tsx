/**
 * NationalIdentityGrid — single-row 1×6 strip of national identity facts.
 *
 * File 48 §Section 2 hero v10. Six static facts (Capital / Currency / Animal
 * / Bird / Flower / Tree). Renders as a horizontal row below the banner block.
 *
 * Phase 5 TODO: lift the data into a registry (e.g. src/lib/india/national-identity.ts)
 * so it can be edited without touching this component.
 */

import * as React from "react";
import {
  Bird,
  Building,
  Flower,
  IndianRupee,
  PawPrint,
  Trees,
  type LucideIcon,
} from "lucide-react";

interface IdentityCell {
  label: string;
  icon: LucideIcon;
  glyph: string;
  value: string;
}

const CELLS: IdentityCell[] = [
  { label: "Capital",  icon: Building,    glyph: "🏛", value: "New Delhi" },
  { label: "Currency", icon: IndianRupee, glyph: "₹",  value: "INR" },
  { label: "Animal",   icon: PawPrint,    glyph: "🐅", value: "Bengal Tiger" },
  { label: "Bird",     icon: Bird,        glyph: "🦚", value: "Peacock" },
  { label: "Flower",   icon: Flower,      glyph: "🪷", value: "Lotus" },
  { label: "Tree",     icon: Trees,       glyph: "🌳", value: "Banyan" },
];

export function NationalIdentityGrid() {
  return (
    <div
      data-ftp-national-symbols="1"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: "1px",
        // Peacock-blue gap + border (Step 2: saffron retired from hero card,
        // tricolor stripe is the only saffron source now).
        background: "rgba(30, 95, 139, 0.30)",
        border: "0.5px solid rgba(30, 95, 139, 0.45)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {CELLS.map((cell) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.label}
            style={{
              background: "rgba(255, 253, 247, 0.96)",
              padding: "7px 8px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ftp-font-sans)",
                fontSize: "10.5px",
                lineHeight: "14px",
                fontWeight: 600,
                color: "#885410",
                marginBottom: "2px",
              }}
            >
              {cell.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11.5px",
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              <Icon size={11} style={{ color: "#BA7517", flexShrink: 0 }} />
              <span aria-hidden style={{ fontSize: "11px" }}>
                {cell.glyph}
              </span>
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {cell.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NationalIdentityGrid;
