/**
 * IndiaChoropleth — Phase 4 placeholder with legend.
 *
 * Real D3 + topojson choropleth deferred to Phase 5. The interface here
 * (props) is designed to be future-compatible so Phase 5 can swap the
 * implementation without changing call sites.
 */

import * as React from "react";

export interface IndiaChoroplethProps {
  moduleSlug: string;
  metricKey: string;
  title?: string;
  unit?: string;
  accentHex?: string;
  className?: string;
}

const BUCKETS = [
  { label: "Lowest", weight: 0.15 },
  { label: "Low", weight: 0.35 },
  { label: "Moderate", weight: 0.65 },
  { label: "Highest", weight: 0.95 },
];

export function IndiaChoropleth({
  title = "State distribution",
  unit,
  accentHex = "#185FA5",
  className,
}: IndiaChoroplethProps) {
  return (
    <section
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "18px 22px",
        marginTop: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "12px",
        }}
      >
        <h3 className="ftp-display" style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{title}</h3>
        {unit && (
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{unit}</span>
        )}
      </div>

      <div
        style={{
          background: "var(--color-background-secondary)",
          borderRadius: "var(--border-radius-md)",
          padding: "32px",
          textAlign: "center",
          color: "var(--color-text-tertiary)",
          fontSize: "12px",
          marginBottom: "12px",
        }}
      >
        State-level distribution map — coming soon
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Legend:</span>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: "14px",
                height: "10px",
                background: accentHex,
                opacity: b.weight,
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default IndiaChoropleth;
