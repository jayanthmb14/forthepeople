/**
 * DataQualityChip — Published / Worked out / Estimate chip.
 *
 * Authenticity move #8 (file 45 §6). Sentence case (Design v4), translated
 * through page_india "quality.*". Works in server and client components.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calculator, CircleCheck, Waves, type LucideIcon } from "lucide-react";
import { INDIA_NS } from "../i18n";

export type DataQualityKind = "published" | "derived" | "estimated";

export interface DataQualityChipProps {
  quality: DataQualityKind;
  className?: string;
}

/** Each kind's colours and a small Lucide icon (v5.1: were emoji). */
const PALETTE: Record<DataQualityKind, { bg: string; fg: string; icon: LucideIcon }> = {
  published: { bg: "#EAF3DE", fg: "#27500A", icon: CircleCheck },
  derived: { bg: "var(--ftp-surface-2)", fg: "var(--ftp-text-2)", icon: Calculator },
  estimated: { bg: "#FAEEDA", fg: "#854F0B", icon: Waves },
};

export function DataQualityChip({ quality, className }: DataQualityChipProps) {
  const t = useTranslations(INDIA_NS);
  const { bg, fg, icon: Icon } = PALETTE[quality] ?? PALETTE.published;
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
      <Icon size={12} aria-hidden style={{ flexShrink: 0 }} />
      {t(`quality.${quality}`)}
    </span>
  );
}

export default DataQualityChip;
