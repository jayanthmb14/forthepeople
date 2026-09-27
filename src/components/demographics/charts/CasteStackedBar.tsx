"use client";

// Share of Scheduled Caste / Scheduled Tribe / Other as one stacked bar.
// Colours are neutral greys built from design tokens (../types) — no
// category gets a saturated colour, and deliberately not the page hue
// either. Chrome (v4 tooltip, axis) comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { CASTE_COLORS, isNonEmptyObject, type CasteMap, type ProfileLike } from "../types";
import { AXIS_LINE, AXIS_TICK, ChartEmpty, ChartNote, LEGEND_STYLE, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  caste: CasteMap | null | undefined;
}

export function canRenderCasteStackedBar(profile: ProfileLike | null | undefined): boolean {
  return isNonEmptyObject(profile?.caste);
}

export default function CasteStackedBar({ caste }: Props) {
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = (v: number, d = 2) => f.number(v / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  const hasAny =
    caste &&
    (typeof caste.SC === "number" ||
      typeof caste.ST === "number" ||
      typeof caste.Other === "number");

  if (!hasAny) {
    return <ChartEmpty message={t("casteEmpty")} />;
  }

  const data = [
    {
      name: t("casteTitle"),
      SC: caste!.SC ?? 0,
      ST: caste!.ST ?? 0,
      Other: caste!.Other ?? 0,
    },
  ];

  return (
    <div>
      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => pct(v, 0)} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip {...TOOLTIP_PROPS} formatter={(v) => (typeof v === "number" ? pct(v) : "—")} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey="SC" name={t("caste.SC")} stackId="c" fill={CASTE_COLORS.SC} radius={[6, 0, 0, 6]} />
            <Bar dataKey="ST" name={t("caste.ST")} stackId="c" fill={CASTE_COLORS.ST} />
            <Bar dataKey="Other" name={t("caste.Other")} stackId="c" fill={CASTE_COLORS.Other} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartNote>{t("casteNote")}</ChartNote>
    </div>
  );
}
