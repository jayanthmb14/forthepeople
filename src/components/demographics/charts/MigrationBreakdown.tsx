"use client";

// In-migrants by origin and by reason, as two small bar charts side by side
// (stacked on phones). Every bar is named on its axis, so both charts are
// one series drawn in the page hue (Design v4 recharts theme: gradients,
// rounded bar ends). Chrome comes from ../chartKit. The share of residents
// born elsewhere is said once, in the page's "simple" line above the chart.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { ChartGradients } from "@/components/district/visuals";
import {
  isNonEmptyObject,
  type MigrationData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  migration: MigrationData | null | undefined;
}

export function canRenderMigrationBreakdown(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.migration);
}

/** Origins of in-migrants (only the ones with a figure above zero).
 *  `key` → page_population.origins.<key>; `name` is the English fallback. */
export function migrationOrigins(migration: MigrationData): { key: string; name: string; value: number }[] {
  return [
    { key: "sameState", name: "Same state", value: migration.fromSameState ?? 0 },
    { key: "otherState", name: "Other state", value: migration.fromOtherState ?? 0 },
    { key: "abroad", name: "From abroad", value: migration.fromAbroad ?? 0 },
  ].filter((r) => r.value > 0);
}

/** Reasons for moving (only the ones with a figure above zero).
 *  `key` → page_population.reasons.<key>; `name` is the English fallback. */
export function migrationReasons(migration: MigrationData): { key: string; name: string; value: number }[] {
  if (!migration.reasons) return [];
  return [
    { key: "work", name: "Work", value: migration.reasons.work ?? 0 },
    { key: "marriage", name: "Marriage", value: migration.reasons.marriage ?? 0 },
    { key: "education", name: "Education", value: migration.reasons.education ?? 0 },
    { key: "family", name: "Family", value: migration.reasons.family ?? 0 },
    { key: "other", name: "Other", value: migration.reasons.other ?? 0 },
  ].filter((r) => r.value > 0);
}

/** Small sub-heading above each of the two charts. */
function ChartTitle({ children }: { children: React.ReactNode }) {
  return <p className="ftp-label" style={{ marginBottom: 4, color: "var(--hue-deep)" }}>{children}</p>;
}

export default function MigrationBreakdown({ migration }: Props) {
  const t = useTranslations("page_population");
  const f = useFormat();
  const pct = (v: number, d = 2) => f.number(v / 100, { style: "percent", minimumFractionDigits: d, maximumFractionDigits: d });
  if (!migration) {
    return <ChartEmpty message={t("migrationEmpty")} />;
  }

  const origins = migrationOrigins(migration).map((o) => ({ ...o, name: t(`origins.${o.key}`) }));
  const reasonsData = migrationReasons(migration).map((r) => ({ ...r, name: t(`reasons.${r.key}`) }));

  if (origins.length === 0 && reasonsData.length === 0) {
    return <ChartEmpty message={t("migrationEmpty")} />;
  }

  const tooltipFormat = (v: unknown) => (typeof v === "number" ? pct(v) : "—");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      <div>
        <ChartTitle>{t("migrationByOrigin")}</ChartTitle>
        {origins.length > 0 ? (
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={origins} layout="vertical" margin={{ left: 10, right: 10 }}>
                <ChartGradients />
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => pct(v, 0)} />
                <YAxis type="category" dataKey="name" width={90} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value" name={t("share")} fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty message={t("originEmpty")} />
        )}
      </div>
      <div>
        <ChartTitle>{t("migrationByReason")}</ChartTitle>
        {reasonsData.length > 0 ? (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={reasonsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <ChartGradients />
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => pct(v, 0)} />
                <YAxis type="category" dataKey="name" width={80} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value" name={t("share")} fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty message={t("reasonEmpty")} />
        )}
      </div>
    </div>
  );
}
