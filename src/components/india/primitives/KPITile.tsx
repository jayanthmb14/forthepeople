/**
 * KPITile — the standard small KPI tile.
 *
 * Used in module hero supporting metrics, super-category page hero strip,
 * and homepage KPI strip. File 45 §2 typography, §3 spacing.
 */

import * as React from "react";
import { DataQualityChip, DataQualityKind } from "./DataQualityChip";
import { formatIndiaNumber } from "@/lib/india/format-number";

export interface KPITileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  quality?: DataQualityKind;
  source?: string;
  span?: number;
  className?: string;
}

const TREND_GLYPH: Record<NonNullable<KPITileProps["delta"]>["trend"], string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

const TREND_COLOR: Record<NonNullable<KPITileProps["delta"]>["trend"], string> = {
  up: "#16A34A",
  down: "#A32D2D",
  flat: "var(--color-text-tertiary)",
};

export function KPITile({
  label,
  value,
  unit,
  delta,
  quality,
  source,
  span,
  className,
}: KPITileProps) {
  const formatted = typeof value === "number" ? formatIndiaNumber(value) : value;

  return (
    <div
      className={className}
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "12px 14px",
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--color-text-secondary)",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
        <span
          style={{
            fontFamily: "var(--ftp-font-display)",
            fontVariantNumeric: "tabular-nums lining-nums",
            letterSpacing: "-0.02em",
            fontSize: "24px",
            fontWeight: 650,
            lineHeight: 1.05,
            color: "var(--color-text-primary)",
          }}
        >
          {formatted}
        </span>
        {unit && (
          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{unit}</span>
        )}
        {delta && (
          <span style={{ fontSize: "10px", color: TREND_COLOR[delta.trend], marginLeft: "4px" }}>
            {TREND_GLYPH[delta.trend]} {delta.value}
          </span>
        )}
      </div>

      {(quality || source) && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {quality && <DataQualityChip quality={quality} />}
          {source && (
            <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{source}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default KPITile;
