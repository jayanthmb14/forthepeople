"use client";

// Five-year age-band pyramid: males to the left, females to the right.
// Male / female colours are the Okabe-Ito pair from ../types (colour-blind
// safe); chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SEX_COLORS, type AgeBand } from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, LEGEND_STYLE, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  ageBands: AgeBand[] | null | undefined;
}

export function canRenderPopulationPyramid(
  profile: { ageBands?: AgeBand[] | null } | null | undefined,
): boolean {
  return Array.isArray(profile?.ageBands) && profile!.ageBands!.length > 0;
}

export default function PopulationPyramid({ ageBands }: Props) {
  if (!Array.isArray(ageBands) || ageBands.length === 0) {
    return (
      <ChartEmpty message="Five-year age-band data is not available — see the four-group chart instead." />
    );
  }

  const data = ageBands.map((b) => ({
    band: b.band,
    male: -Math.abs(b.male),
    female: b.female,
  }));

  return (
    <div style={{ width: "100%", height: Math.max(280, ageBands.length * 22) }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          stackOffset="sign"
          margin={{ left: 10, right: 10 }}
        >
          <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => String(Math.abs(Number(v)))} />
          <YAxis type="category" dataKey="band" width={50} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <Tooltip
            {...TOOLTIP_PROPS}
            formatter={(v) => (typeof v === "number" ? new Intl.NumberFormat("en-IN").format(Math.abs(v)) : "—")}
          />
          <Legend wrapperStyle={LEGEND_STYLE} />
          <Bar dataKey="male" name="Male" fill={SEX_COLORS.male} />
          <Bar dataKey="female" name="Female" fill={SEX_COLORS.female} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
