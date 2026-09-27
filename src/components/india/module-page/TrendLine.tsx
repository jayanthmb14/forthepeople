/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * A real time series (IndiaTimeSeries rows) as a hue area chart. The page
 * only renders it when the table holds two or more points, so there is
 * never a line drawn from a single value or from made-up years.
 */
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartGradients, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { useFormat } from "@/i18n/client";

export interface TrendPoint {
  /** Axis label, usually the year ("2018"). */
  label: string;
  value: number;
}

export default function TrendLine({
  points,
  unitLabel,
  height = 240,
}: {
  points: TrendPoint[];
  /** Translated unit shown after values in the tooltip, e.g. "tigers". */
  unitLabel?: string;
  height?: number;
}) {
  const f = useFormat();
  if (points.length < 2) return null;
  const fmt = (v: number) => f.number(v, { maximumFractionDigits: 2 });
  return (
    <div style={{ width: "100%", height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <ChartGradients />
          <CartesianGrid vertical={false} stroke="var(--ftp-border)" strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={CHART_AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return [`${Number.isFinite(n) ? fmt(n) : String(value ?? "")}${unitLabel ? ` ${unitLabel}` : ""}`, ""];
            }}
            separator=""
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--hue)"
            strokeWidth={2.5}
            fill="url(#ftpHueArea)"
            dot={{ r: 4, fill: "var(--hue)", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
