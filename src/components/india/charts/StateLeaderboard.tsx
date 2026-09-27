/**
 * StateLeaderboard — top 5 states + view-all link per Mockup 2.
 *
 * Reads IndiaStateBreakdown rows for a given (moduleSlug, metricKey).
 */

import * as React from "react";
import { prisma } from "@/lib/db";
import { SourcePill } from "@/components/india/primitives/SourcePill";

export interface StateLeaderboardProps {
  moduleSlug: string;
  metricKey: string;
  title: string;
  unit?: string;
  accentHex?: string;
  className?: string;
}

export async function StateLeaderboard({
  moduleSlug,
  metricKey,
  title,
  unit,
  accentHex = "#185FA5",
  className,
}: StateLeaderboardProps) {
  const rows = await prisma.indiaStateBreakdown.findMany({
    where: { moduleSlug, metricKey },
    orderBy: { value: "desc" },
    take: 5,
  });

  if (rows.length === 0) {
    return (
      <section
        className={className}
        style={{
          background: "var(--color-surface)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "18px 22px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 6px" }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: 0 }}>
          Awaiting first sync.
        </p>
      </section>
    );
  }

  const top = Number(rows[0].value);
  const sourceDomain = (() => {
    try {
      return new URL(rows[0].sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return rows[0].source;
    }
  })();

  return (
    <section
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "18px 22px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <h3 className="ftp-display" style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{title}</h3>
        {unit && (
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{unit}</span>
        )}
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((r, i) => {
          const pct = (Number(r.value) / top) * 100;
          return (
            <li
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 1fr 80px",
                alignItems: "center",
                gap: "10px",
                padding: "6px 0",
                borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {i + 1}
              </span>
              <div>
                <div style={{ marginBottom: "3px" }}>{r.stateName}</div>
                <div
                  style={{
                    height: "3px",
                    width: "100%",
                    background: "var(--color-background-secondary)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: accentHex,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "13px",
                  fontWeight: 500,
                  textAlign: "right",
                }}
              >
                {Number(r.value).toLocaleString("en-IN")}
              </span>
            </li>
          );
        })}
      </ul>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
        }}
      >
        <SourcePill domain={sourceDomain} url={rows[0].sourceUrl} variant="gov" />
        <span style={{ color: "var(--color-text-info)" }}>View all states ›</span>
      </div>
    </section>
  );
}

export default StateLeaderboard;
