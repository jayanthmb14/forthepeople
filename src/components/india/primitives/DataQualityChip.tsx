/**
 * DataQualityChip — PUBLISHED / DERIVED / ESTIMATED chip.
 *
 * Authenticity move #8 (file 45 §6). Always uppercase.
 */

import * as React from "react";

export type DataQualityKind = "published" | "derived" | "estimated";

export interface DataQualityChipProps {
  quality: DataQualityKind;
  className?: string;
}

const PALETTE: Record<DataQualityKind, { bg: string; fg: string }> = {
  published: { bg: "#EAF3DE", fg: "#27500A" },
  derived: { bg: "var(--color-background-secondary)", fg: "var(--color-text-secondary)" },
  estimated: { bg: "#FAEEDA", fg: "#854F0B" },
};

const BASE_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  // Design v4: sentence case ("Published"), no tracked-out capitals.
  textTransform: "capitalize",
  borderRadius: "3px",
  padding: "1px 5px",
  display: "inline-block",
  lineHeight: 1.4,
};

export function DataQualityChip({ quality, className }: DataQualityChipProps) {
  const { bg, fg } = PALETTE[quality];
  return (
    <span
      style={{ ...BASE_STYLE, background: bg, color: fg }}
      className={className}
    >
      {quality}
    </span>
  );
}

export default DataQualityChip;
