/**
 * SourcePill — a clickable .gov.in domain pill.
 *
 * Used everywhere a source needs inline citation. File 45 §1, §5.
 * Variants: default | gov | major-outlet | specialist (file 45 §5 source-tier).
 */

import * as React from "react";

export type SourcePillVariant = "default" | "gov" | "major-outlet" | "specialist";

export interface SourcePillProps {
  domain: string;
  url?: string;
  variant?: SourcePillVariant;
  className?: string;
}

const VARIANT_STYLE: Record<SourcePillVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-background-secondary)",
    color: "var(--color-text-secondary)",
  },
  gov: {
    background: "rgba(15, 110, 86, 0.10)",
    color: "#0F6E56",
  },
  "major-outlet": {
    background: "rgba(24, 95, 165, 0.08)",
    color: "#185FA5",
  },
  specialist: {
    background: "rgba(74, 83, 88, 0.10)",
    color: "#4A5358",
  },
};

const BASE_STYLE: React.CSSProperties = {
  fontFamily: "var(--ftp-font-sans)",
  fontVariantNumeric: "tabular-nums",
  fontSize: "11px",
  fontWeight: 500,
  borderRadius: "999px",
  padding: "2px 7px",
  display: "inline-flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  textDecoration: "none",
  lineHeight: 1.4,
};

export function SourcePill({
  domain,
  url,
  variant = "default",
  className,
}: SourcePillProps) {
  const style = { ...BASE_STYLE, ...VARIANT_STYLE[variant] };

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={style}
        className={className}
      >
        {domain}
      </a>
    );
  }

  return (
    <span style={style} className={className}>
      {domain}
    </span>
  );
}

export default SourcePill;
