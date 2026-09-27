/**
 * IndiaKpiStrip — 5-tile per-cell-accent KPI strip rendered below the hero
 * (file 48 §4.7.4 + Section 2.1 v10 — extracted out of IndiaHero so the
 * tricolor badges panel can sit between hero and KPI strip per spec order).
 *
 * Each cell uses an accent ramp from :root (Phase 4.6.9):
 * blue / forest-green / amber / indigo / pink. Lucide icon top-right at 70%
 * opacity. Number uses CountUpNumber with the accent's "800" stop.
 */

import * as React from "react";
import {
  Building2,
  IndianRupee,
  Languages as LanguagesIcon,
  Square,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CountUpNumber } from "@/components/india/primitives/CountUpNumber";

interface KpiTileSpec {
  id: string;
  icon: LucideIcon;
  label: string;
  value?: number;
  valueRaw?: string;
  decimals?: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  meta: string;
  source: string;
  accent: "blue" | "forest-green" | "amber" | "indigo" | "pink";
  numColor: string;
  iconColor: string;
}

const ACCENT_RGB: Record<KpiTileSpec["accent"], string> = {
  blue: "24, 95, 165",
  "forest-green": "90, 143, 46",
  amber: "186, 117, 23",
  indigo: "83, 74, 183",
  pink: "153, 53, 86",
};

const KPI_TILES: KpiTileSpec[] = [
  { id: "population", icon: Users,        label: "Population",   value: 1.43, decimals: 2, unit: "billion", meta: "↑ 0.8% YoY",        source: "UN · 2024 est.", accent: "blue",         numColor: "#082F58", iconColor: "#185FA5" },
  { id: "area",       icon: Square,       label: "Area",         value: 3.29, decimals: 2, unit: "M km²",   meta: "7th largest country", source: "Survey of India", accent: "forest-green", numColor: "#27500A", iconColor: "#5A8F2E" },
  { id: "gdp",        icon: IndianRupee,  label: "Nominal GDP",  value: 4.1,  decimals: 1, prefix: "$", suffix: "T", meta: "↑ 6.5% projected", source: "IMF · FY26",     accent: "amber",        numColor: "#633806", iconColor: "#BA7517" },
  { id: "states",     icon: Building2,    label: "States and UTs", valueRaw: "28 + 8",         meta: "780 districts",   source: "MHA · 2024",      accent: "indigo",       numColor: "#26215C", iconColor: "#534AB7" },
  { id: "languages",  icon: LanguagesIcon, label: "Languages",   value: 22,   decimals: 0, unit: "scheduled", meta: "+ 100s of dialects", source: "Schedule 8",      accent: "pink",         numColor: "#4D182A", iconColor: "#993556" },
];

function KpiTileV5({ tile }: { tile: KpiTileSpec }) {
  const Icon = tile.icon;
  const accentRgb = ACCENT_RGB[tile.accent];
  // Design v4: big numbers in the display face with lining tabular figures.
  const numStyle: React.CSSProperties = {
    fontFamily: "var(--ftp-font-display)",
    fontSize: "24px",
    fontWeight: 650,
    fontVariantNumeric: "tabular-nums lining-nums",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    color: tile.numColor,
  };

  return (
    <div
      style={{
        border: `0.5px solid rgba(${accentRgb}, 0.20)`,
        background: `linear-gradient(135deg, rgba(${accentRgb}, 0.06) 0%, rgba(${accentRgb}, 0.01) 100%)`,
        borderRadius: "var(--border-radius-md)",
        padding: "11px 13px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 200ms",
      }}
    >
      <Icon
        size={14}
        style={{ position: "absolute", right: "8px", top: "8px", color: tile.iconColor, opacity: 0.7 }}
      />
      <div
        style={{
          fontFamily: "var(--ftp-font-sans)",
          fontSize: "12px",
          lineHeight: "16px",
          color: "var(--ftp-text-2)",
          fontWeight: 600,
          paddingRight: "18px",
        }}
      >
        {tile.label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "1px" }}>
        {tile.valueRaw ? (
          <span style={numStyle}>{tile.valueRaw}</span>
        ) : (
          <>
            {tile.prefix && <span style={numStyle}>{tile.prefix}</span>}
            <CountUpNumber target={tile.value ?? 0} decimals={tile.decimals} inlineStyle={numStyle} />
            {tile.suffix && <span style={numStyle}>{tile.suffix}</span>}
            {tile.unit && (
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{tile.unit}</span>
            )}
          </>
        )}
      </div>
      <div style={{ fontSize: "11px", lineHeight: "15px", color: "var(--ftp-text-2)", marginTop: "1px" }}>{tile.meta}</div>
      <span
        style={{
          fontFamily: "var(--ftp-font-sans)",
          fontSize: "10px",
          lineHeight: "15px",
          fontVariantNumeric: "tabular-nums",
          padding: "1px 6px",
          background: "rgba(0,0,0,0.04)",
          color: "var(--color-text-secondary)",
          borderRadius: "3px",
          display: "inline-block",
          marginTop: "5px",
          width: "fit-content",
        }}
      >
        {tile.source}
      </span>
    </div>
  );
}

interface IndiaKpiStripProps {
  freshnessLine?: string;
}

export function IndiaKpiStrip({ freshnessLine }: IndiaKpiStripProps = {}) {
  return (
    <section style={{ padding: "0" }}>
      <div
        className="india-hero-kpi-strip"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "6px",
        }}
      >
        {KPI_TILES.map((tile) => (
          <KpiTileV5 key={tile.id} tile={tile} />
        ))}
      </div>

      {/* Freshness strip */}
      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          padding: "8px 4px",
          marginTop: "1rem",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-text-secondary)",
        }}
      >
        {/* Design v4 honesty rule: nothing says "Live" unless the data is
            under 30 minutes old. These figures are yearly releases, each
            with its source on the tile; the dated freshness pill sits in
            the LiveStrip above. */}
        <span>{freshnessLine ?? "Each figure names its source"}</span>
        <span style={{ color: "var(--color-text-tertiary)" }}>
          Independent. Sourced from .gov.in and NDSAP
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .india-hero-kpi-strip {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .india-hero-kpi-strip > :nth-child(5) {
            grid-column: span 2;
          }
        }
      `}</style>
    </section>
  );
}

export default IndiaKpiStrip;
