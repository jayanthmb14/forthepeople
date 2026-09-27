/**
 * SourceDot — small color dot used inside the table view of the v3
 * split hero pattern (file 47 §4.6.4). On hover, scales 1.4x and
 * surfaces a tooltip with source domain + cadence/sync info.
 *
 * Pure presentational client component — caller supplies the tooltip
 * content (composed of the source's domain + cadence string).
 */

"use client";

import * as React from "react";

export interface SourceDotProps {
  accentHex: string;
  domain: string;
  cadence: string;
  className?: string;
}

export function SourceDot({ accentHex, domain, cadence, className }: SourceDotProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <span
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
      style={{
        position: "relative",
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: accentHex,
        verticalAlign: "middle",
        transform: hovered ? "scale(1.4)" : "scale(1)",
        transition: "transform 180ms",
        cursor: "default",
        outline: "none",
      }}
    >
      <span
        role="tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "-6px",
          background: "#1A1A1A",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontFamily: "var(--ftp-font-sans)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "11px",
          whiteSpace: "nowrap",
          opacity: hovered ? 1 : 0,
          visibility: hovered ? "visible" : "hidden",
          transition: "opacity 180ms, visibility 180ms",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "block", opacity: 1 }}>{domain}</span>
        <span style={{ display: "block", opacity: 0.7, marginTop: "2px" }}>{cadence}</span>
      </span>
    </span>
  );
}

export default SourceDot;
