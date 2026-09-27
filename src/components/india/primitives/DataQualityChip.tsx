/**
 * DataQualityChip — Published / Worked out / Estimate chip.
 *
 * Authenticity move #8 (file 45 §6). Sentence case (Design v4), translated
 * through page_india "quality.*". Works in server and client components.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { INDIA_NS } from "../i18n";

export type DataQualityKind = "published" | "derived" | "estimated";

export interface DataQualityChipProps {
  quality: DataQualityKind;
  className?: string;
}

const PALETTE: Record<DataQualityKind, { bg: string; fg: string; emoji: string }> = {
  published: { bg: "#EAF3DE", fg: "#27500A", emoji: "✅" },
  derived: { bg: "var(--ftp-surface-2)", fg: "var(--ftp-text-2)", emoji: "🧮" },
  estimated: { bg: "#FAEEDA", fg: "#854F0B", emoji: "〰️" },
};

export function DataQualityChip({ quality, className }: DataQualityChipProps) {
  const t = useTranslations(INDIA_NS);
  const { bg, fg, emoji } = PALETTE[quality] ?? PALETTE.published;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        borderRadius: 999,
        padding: "1px 9px 1px 7px",
        background: bg,
        color: fg,
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 11 }}>
        {emoji}
      </span>
      {t(`quality.${quality}`)}
    </span>
  );
}

export default DataQualityChip;
