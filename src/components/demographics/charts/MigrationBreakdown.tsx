"use client";

// In-migrants by origin and by reason, as two small bar charts side by side
// (stacked on phones). Every bar is named on its axis, so both charts are
// one series drawn in the page hue (Design v4 recharts theme: gradients,
// rounded bar ends). Chrome comes from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartGradients } from "@/components/district/visuals";
import {
  isNonEmptyObject,
  type MigrationData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, ChartNote, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  migration: MigrationData | null | undefined;
}

export function canRenderMigrationBreakdown(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.migration);
}

/** Origins of in-migrants (only the ones with a figure above zero). */
export function migrationOrigins(migration: MigrationData): { name: string; value: number }[] {
  return [
    { name: "Same state", value: migration.fromSameState ?? 0 },
    { name: "Other state", value: migration.fromOtherState ?? 0 },
    { name: "From abroad", value: migration.fromAbroad ?? 0 },
  ].filter((r) => r.value > 0);
}

/** Reasons for moving (only the ones with a figure above zero). */
export function migrationReasons(migration: MigrationData): { name: string; value: number }[] {
  if (!migration.reasons) return [];
  return [
    { name: "Work", value: migration.reasons.work ?? 0 },
    { name: "Marriage", value: migration.reasons.marriage ?? 0 },
    { name: "Education", value: migration.reasons.education ?? 0 },
    { name: "Family", value: migration.reasons.family ?? 0 },
    { name: "Other", value: migration.reasons.other ?? 0 },
  ].filter((r) => r.value > 0);
}

/** Small sub-heading above each of the two charts. */
function ChartTitle({ children }: { children: React.ReactNode }) {
  return <p className="ftp-label" style={{ marginBottom: 4, color: "var(--hue-deep)" }}>{children}</p>;
}

export default function MigrationBreakdown({ migration }: Props) {
  if (!migration) {
    return <ChartEmpty message="Migration data is not available for this district yet." />;
  }

  const origins = migrationOrigins(migration);
  const reasonsData = migrationReasons(migration);

  if (origins.length === 0 && reasonsData.length === 0) {
    return <ChartEmpty message="Migration data is not available for this district yet." />;
  }

  const tooltipFormat = (v: unknown) => (typeof v === "number" ? `${v.toFixed(2)}%` : "—");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      <div>
        <ChartTitle>In-migrants by origin (%)</ChartTitle>
        {origins.length > 0 ? (
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={origins} layout="vertical" margin={{ left: 10, right: 10 }}>
                <ChartGradients />
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={90} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value" name="Share" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty message="Origin breakdown is not available." />
        )}
      </div>
      <div>
        <ChartTitle>Reasons for migration (%)</ChartTitle>
        {reasonsData.length > 0 ? (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={reasonsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <ChartGradients />
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value" name="Share" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty message="Reason breakdown is not available." />
        )}
      </div>
      {typeof migration.totalInMigrantsPct === "number" && (
        <div style={{ gridColumn: "1 / -1" }}>
          <ChartNote>
            Total in-migrants:{" "}
            <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{migration.totalInMigrantsPct.toFixed(1)}%</span>{" "}
            of residents were born outside this district.
          </ChartNote>
        </div>
      )}
    </div>
  );
}
