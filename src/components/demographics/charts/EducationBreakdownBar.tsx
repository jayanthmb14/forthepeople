"use client";

// Education attainment as one stacked bar, ordered from "Illiterate" to
// "Postgraduate". The ordinal series use the colour-blind-safe Viridis ramp
// (../types); chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import {
  VIRIDIS,
  isNonEmptyObject,
  type EducationData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, ChartEmpty, LEGEND_STYLE, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  education: EducationData | null | undefined;
}

/** Education levels in order, lowest first (also used by the page's table view).
 *  `label` is the English fallback; the shown name is page_population.education.<key>. */
export const LEVELS: { key: keyof EducationData; label: string; color: string }[] = [
  { key: "illiterate", label: "Illiterate", color: VIRIDIS[0] },
  { key: "belowPrimary", label: "Below primary", color: VIRIDIS[1] },
  { key: "primary", label: "Primary", color: VIRIDIS[2] },
  { key: "middle", label: "Middle", color: VIRIDIS[3] },
  { key: "secondary", label: "Secondary", color: VIRIDIS[4] },
  { key: "higherSec", label: "Higher secondary", color: VIRIDIS[5] },
  { key: "graduate", label: "Graduate", color: VIRIDIS[6] },
  { key: "postgrad", label: "Postgraduate", color: VIRIDIS[8] },
];

export function canRenderEducationBreakdownBar(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.education);
}

export default function EducationBreakdownBar({ education }: Props) {
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = (v: number, d = 2) => f.number(v / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  if (!education) {
    return <ChartEmpty message={t("educationEmpty")} />;
  }

  const row: Record<string, number | string> = { name: t("educationTitle") };
  let any = false;
  for (const l of LEVELS) {
    const v = education[l.key];
    if (typeof v === "number") {
      row[l.key] = v;
      any = true;
    } else {
      row[l.key] = 0;
    }
  }
  if (!any) {
    return <ChartEmpty message={t("educationEmpty")} />;
  }

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <BarChart data={[row]} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => pct(v, 0)} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? pct(v) : "—")} />
          <Legend wrapperStyle={{ ...LEGEND_STYLE, fontSize: 11 }} />
          {LEVELS.map((l, i) => (
            <Bar
              key={l.key}
              dataKey={l.key}
              name={t(`education.${l.key}`)}
              stackId="edu"
              fill={l.color}
              radius={i === 0 ? [6, 0, 0, 6] : i === LEVELS.length - 1 ? [0, 6, 6, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
