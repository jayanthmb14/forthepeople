/**
 * TimeSeriesChart — calm SVG line chart per Mockup 2.
 *
 * No third-party chart lib in Phase 4 (bundle-size discipline). Phase 5
 * may swap in a lib if interactivity is needed.
 */

import * as React from "react";
import { prisma } from "@/lib/db";
import { SourcePill } from "@/components/india/primitives/SourcePill";

export interface TimeSeriesChartProps {
  moduleSlug: string;
  metricKey: string;
  title: string;
  unit?: string;
  accentHex?: string;
  className?: string;
}

const PADDING = { top: 18, right: 16, bottom: 28, left: 36 };
const VIEW_W = 480;
const VIEW_H = 200;

export async function TimeSeriesChart({
  moduleSlug,
  metricKey,
  title,
  unit,
  accentHex = "#185FA5",
  className,
}: TimeSeriesChartProps) {
  const rows = await prisma.indiaTimeSeries.findMany({
    where: { moduleSlug, metricKey },
    orderBy: { date: "asc" },
    select: { date: true, value: true, source: true, sourceUrl: true },
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
          marginTop: "1.5rem",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 6px" }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", margin: 0 }}>
          Awaiting first sync.
        </p>
      </section>
    );
  }

  const values = rows.map((r) => Number(r.value));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const innerW = VIEW_W - PADDING.left - PADDING.right;
  const innerH = VIEW_H - PADDING.top - PADDING.bottom;

  const points = rows.map((r, i) => {
    const x = PADDING.left + (i / Math.max(rows.length - 1, 1)) * innerW;
    const y = PADDING.top + innerH - ((Number(r.value) - minV) / range) * innerH;
    return { x, y, value: Number(r.value), date: r.date };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // 3 horizontal grid lines at min, mid, max
  const gridYs = [0, 0.5, 1].map(
    (frac) => PADDING.top + innerH - frac * innerH,
  );

  const lastSource = rows[rows.length - 1];
  const sourceDomain = (() => {
    try {
      return lastSource?.sourceUrl ? new URL(lastSource.sourceUrl).hostname.replace(/^www\./, "") : lastSource.source;
    } catch {
      return lastSource.source;
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
        <h3 className="ftp-display" style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{title}</h3>
        {unit && (
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{unit}</span>
        )}
      </div>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="200" role="img" aria-label={title}>
        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={PADDING.left}
            y1={y}
            x2={VIEW_W - PADDING.right}
            y2={y}
            stroke="var(--color-border-tertiary)"
            strokeWidth="0.5"
          />
        ))}

        {/* Y-axis labels (min, mid, max) */}
        {/* gridYs runs bottom → top (frac 0, 0.5, 1), so the minimum sits on
            gridYs[0] and the maximum on gridYs[2]. */}
        <text x="6" y={gridYs[0] + 4} fontSize="9" fill="var(--color-text-tertiary)">
          {minV.toLocaleString("en-IN")}
        </text>
        <text x="6" y={gridYs[1] + 4} fontSize="9" fill="var(--color-text-tertiary)">
          {Math.round((minV + maxV) / 2).toLocaleString("en-IN")}
        </text>
        <text x="6" y={gridYs[2] + 4} fontSize="9" fill="var(--color-text-tertiary)">
          {maxV.toLocaleString("en-IN")}
        </text>

        <polyline
          points={polyline}
          fill="none"
          stroke={accentHex}
          strokeWidth="1.6"
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill={accentHex} />
            <text
              x={p.x}
              y={p.y - 6}
              fontSize="9"
              textAnchor="middle"
              fill="var(--color-text-secondary)"
            >
              {p.value.toLocaleString("en-IN")}
            </text>
            <text
              x={p.x}
              y={VIEW_H - 8}
              fontSize="9"
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
            >
              {new Date(p.date).getFullYear()}
            </text>
          </g>
        ))}
      </svg>

      <div
        style={{
          marginTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
        }}
      >
        <SourcePill domain={sourceDomain} url={lastSource.sourceUrl} variant="gov" />
        <span>{rows.length} census points</span>
      </div>
    </section>
  );
}

export default TimeSeriesChart;
