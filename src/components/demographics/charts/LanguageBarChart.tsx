"use client";

// Top-10 mother tongues as horizontal bars, largest first. One series, so
// it is drawn in the page hue (Design v4 recharts theme: gradient fill,
// rounded bar ends); chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartGradients } from "@/components/district/visuals";
import {
  isNonEmptyObject,
  type LanguageData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  language: LanguageData | null | undefined;
}

export function canRenderLanguageBarChart(profile: ProfileLike | null | undefined): boolean {
  if (!isNonEmptyObject(profile?.language)) return false;
  const l = profile!.language as Record<string, unknown>;
  return Array.isArray(l.top10) && l.top10.length > 0;
}

export default function LanguageBarChart({ language }: Props) {
  if (!language || !Array.isArray(language.top10) || language.top10.length === 0) {
    return <ChartEmpty message="Language data is not available for this district yet." />;
  }

  const data = [...language.top10].sort((a, b) => b.pct - a.pct);
  const max = data[0]?.pct ?? 0;

  return (
    <div style={{ width: "100%", height: Math.max(260, data.length * 34) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <ChartGradients />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, Math.max(5, Math.ceil(max / 5) * 5)]}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={AXIS_LINE}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis type="category" dataKey="name" width={90} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} interval={0} />
          <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}%` : "—")} />
          <Bar dataKey="pct" name="Share of speakers" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
