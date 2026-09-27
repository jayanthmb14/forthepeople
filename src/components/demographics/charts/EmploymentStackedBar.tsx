"use client";

// Main / marginal / non-workers as one stacked bar. Worker series use the
// colour-blind-safe Okabe-Ito palette (../types); "Non-workers" is a
// neutral token. Chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  OKABE_ITO,
  isNonEmptyObject,
  type EmploymentData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, ChartNote, LEGEND_STYLE, NEUTRAL_SERIES, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  employment: EmploymentData | null | undefined;
}

export function canRenderEmploymentStackedBar(
  profile: ProfileLike | null | undefined,
): boolean {
  if (!isNonEmptyObject(profile?.employment)) return false;
  const e = profile!.employment as EmploymentData;
  return (
    typeof e.mainWorkersPct === "number" ||
    typeof e.marginalWorkersPct === "number" ||
    typeof e.nonWorkersPct === "number"
  );
}

export default function EmploymentStackedBar({ employment }: Props) {
  if (!employment) {
    return <ChartEmpty message="Employment data is not available for this district yet." />;
  }

  const data = [
    {
      name: "Working-age pop.",
      mainWorkers: employment.mainWorkersPct ?? 0,
      marginalWorkers: employment.marginalWorkersPct ?? 0,
      nonWorkers: employment.nonWorkersPct ?? 0,
    },
  ];

  return (
    <div>
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={110} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? `${v.toFixed(2)}%` : "—")} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="mainWorkers" name="Main workers" stackId="w" fill={OKABE_ITO.bluishGreen} radius={[6, 0, 0, 6]} />
            <Bar dataKey="marginalWorkers" name="Marginal workers" stackId="w" fill={OKABE_ITO.yellow} />
            <Bar dataKey="nonWorkers" name="Non-workers" stackId="w" fill={NEUTRAL_SERIES.mid} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {typeof employment.workerParticipationRate === "number" && (
        <ChartNote>
          Worker participation rate (WPR):{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>
            {employment.workerParticipationRate.toFixed(2)}%
          </span>
        </ChartNote>
      )}
    </div>
  );
}
