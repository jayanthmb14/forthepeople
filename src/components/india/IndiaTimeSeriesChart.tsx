/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Recharts wrapper for module time-series charts. Used by any module
 * with hasTimeSeries=true once IndiaTimeSeries rows exist.
 *
 * Phase 4 ships the wrapper but no module uses it yet — modules are
 * still in their "Awaiting first sync" empty state. Phase 5+ wires
 * specific modules.
 */

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INDIA_DESIGN } from "@/lib/india/india-design";

export interface TimeSeriesPoint {
  date: string; // ISO yyyy-mm-dd
  value: number;
  source?: string;
}

interface Props {
  series: TimeSeriesPoint[];
  unit?: string;
  height?: number;
  /** Optional accent color override; defaults to FTP blue. */
  color?: string;
}

export default function IndiaTimeSeriesChart({
  series,
  unit,
  height = 240,
  color = INDIA_DESIGN.accentBlue,
}: Props) {
  if (series.length === 0) return null;

  return (
    <div
      style={{
        background: INDIA_DESIGN.bgCard,
        border: `1px solid ${INDIA_DESIGN.border}`,
        borderRadius: 12,
        padding: "16px 12px 12px",
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={series} margin={{ top: 4, right: 12, bottom: 4, left: -8 }}>
          <CartesianGrid stroke={INDIA_DESIGN.border} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: INDIA_DESIGN.textMuted }}
            stroke={INDIA_DESIGN.border}
          />
          <YAxis
            tick={{ fontSize: 11, fill: INDIA_DESIGN.textMuted }}
            stroke={INDIA_DESIGN.border}
            tickFormatter={(v) => (unit ? `${v}${unit === "%" ? "%" : ""}` : `${v}`)}
            width={50}
          />
          <Tooltip
            wrapperStyle={{ outline: "none" }}
            contentStyle={{
              background: INDIA_DESIGN.bgCard,
              border: `1px solid ${INDIA_DESIGN.border}`,
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value);
              const display = Number.isFinite(num)
                ? num.toLocaleString("en-IN")
                : String(value ?? "");
              return [`${display}${unit ? ` ${unit}` : ""}`, "Value"];
            }}
            labelFormatter={(label) => `As of ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2.5, fill: color }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
