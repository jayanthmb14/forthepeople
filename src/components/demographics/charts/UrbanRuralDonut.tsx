"use client";

// Urban vs rural share as a two-slice donut. Slice colours are from the
// colour-blind-safe Okabe-Ito palette (../types); chrome from ../chartKit.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { OKABE_ITO, type ProfileLike } from "../types";
import { ChartEmpty, LEGEND_STYLE, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  urbanPct?: number | null;
  ruralPct?: number | null;
}

export function canRenderUrbanRuralDonut(profile: ProfileLike | null | undefined): boolean {
  return typeof profile?.urbanPct === "number";
}

export default function UrbanRuralDonut({ urbanPct, ruralPct }: Props) {
  const urban = typeof urbanPct === "number" ? urbanPct : null;
  if (urban == null) {
    return <ChartEmpty message="The urban / rural split is not available for this district yet." />;
  }
  const rural = typeof ruralPct === "number" ? ruralPct : Math.max(0, 100 - urban);

  const data = [
    { name: "Urban", value: urban },
    { name: "Rural", value: rural },
  ];

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} stroke="var(--ftp-surface)">
            <Cell fill={OKABE_ITO.skyBlue} />
            <Cell fill={OKABE_ITO.bluishGreen} />
          </Pie>
          <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? `${v.toFixed(2)}%` : "—")} />
          <Legend verticalAlign="bottom" height={32} wrapperStyle={LEGEND_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
