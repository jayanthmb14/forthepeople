"use client";

// Religion shares as a donut, categories in alphabetical order (of the
// English Census names). Slice colours come from the colour-blind-safe
// Okabe-Ito palette (../types) — deliberately not the page hue, so no
// community reads as "highlighted"; tooltip and legend use the v4 chart
// chrome (../chartKit). Names: page_population.religions.<key>.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import {
  ALPHABETICAL_RELIGIONS,
  RELIGION_COLORS,
  isNonEmptyObject,
  type ReligionMap,
  type ProfileLike,
} from "../types";
import { ChartEmpty, LEGEND_STYLE, NEUTRAL_SERIES, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  religion: ReligionMap | null | undefined;
}

export function canRenderReligionDonut(profile: ProfileLike | null | undefined): boolean {
  return isNonEmptyObject(profile?.religion);
}

export default function ReligionDonut({ religion }: Props) {
  const t = useTranslations("page_population");
  const f = useFormat();
  if (!religion || Object.keys(religion).length === 0) {
    return <ChartEmpty message={t("religionEmpty")} />;
  }

  const data = ALPHABETICAL_RELIGIONS.filter((k) => typeof religion[k] === "number").map((k) => ({
    key: k,
    name: t.has(`religions.${k}`) ? t(`religions.${k}`) : k,
    value: religion[k]!,
  }));

  if (data.length === 0) {
    return <ChartEmpty message={t("religionEmpty")} />;
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={1}
            cornerRadius={4}
            stroke="var(--ftp-surface)"
          >
            {data.map((d) => (
              <Cell key={d.key} fill={RELIGION_COLORS[d.key] ?? NEUTRAL_SERIES.mid} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_PROPS}
            formatter={(v) => (typeof v === "number" ? f.number(v / 100, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—")}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={LEGEND_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
