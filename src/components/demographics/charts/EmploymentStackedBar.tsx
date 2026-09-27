"use client";

// Main / marginal / non-workers as one stacked bar. Worker series use the
// colour-blind-safe Okabe-Ito palette (../types); "Non-workers" is a
// neutral token. Chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
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
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = (v: number, d = 2) => f.number(v / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  if (!employment) {
    return <ChartEmpty message={t("employmentEmpty")} />;
  }

  const data = [
    {
      name: t("employmentAxis"),
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
            <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => pct(v, 0)} />
            <YAxis type="category" dataKey="name" width={70} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? pct(v) : "—")} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="mainWorkers" name={t("employment.main")} stackId="w" fill={OKABE_ITO.bluishGreen} radius={[6, 0, 0, 6]} />
            <Bar dataKey="marginalWorkers" name={t("employment.marginal")} stackId="w" fill={OKABE_ITO.yellow} />
            <Bar dataKey="nonWorkers" name={t("employment.non")} stackId="w" fill={NEUTRAL_SERIES.mid} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {typeof employment.workerParticipationRate === "number" && (
        <ChartNote>
          {t.rich("wprNote", {
            v: pct(employment.workerParticipationRate),
            n: (c) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span>,
          })}
        </ChartNote>
      )}
    </div>
  );
}
