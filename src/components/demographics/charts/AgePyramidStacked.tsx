"use client";

// Age structure in four Census groups (0–6, 7–14, 15–59, 60+) as horizontal
// bars. One series, so it is drawn in the page hue (Design v4 recharts
// theme: ChartGradients, rounded bar ends); chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { ChartGradients } from "@/components/district/visuals";
import { type ProfileLike } from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  pop_0_6?: number | null;
  pop_7_14?: number | null;
  pop_15_59?: number | null;
  pop_60_plus?: number | null;
}

export function canRenderAgePyramidStacked(profile: ProfileLike | null | undefined): boolean {
  return (
    typeof profile?.pop_0_6 === "number" ||
    typeof profile?.pop_7_14 === "number" ||
    typeof profile?.pop_15_59 === "number" ||
    typeof profile?.pop_60_plus === "number"
  );
}

/** The four age groups, oldest first, with the groups that have no figure dropped. */
export function ageRows({ pop_0_6, pop_7_14, pop_15_59, pop_60_plus }: Props): { band: string; value: number }[] {
  return [
    { band: "60+", value: pop_60_plus ?? 0 },
    { band: "15–59", value: pop_15_59 ?? 0 },
    { band: "7–14", value: pop_7_14 ?? 0 },
    { band: "0–6", value: pop_0_6 ?? 0 },
  ].filter((r) => r.value > 0);
}

export default function AgePyramidStacked(props: Props) {
  const t = useTranslations("page_population");
  const f = useFormat();
  const rows = ageRows(props);

  if (rows.length === 0) {
    return <ChartEmpty message={t("ageEmpty")} />;
  }

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 16 }}>
          <ChartGradients />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={AXIS_LINE}
            tickFormatter={(v) => f.number(v)}
          />
          <YAxis type="category" dataKey="band" width={60} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <Tooltip
            {...TOOLTIP_PROPS}
            formatter={(v) => (typeof v === "number" ? f.number(v) : "—")}
          />
          <Bar dataKey="value" name={t("statPopulation")} fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
