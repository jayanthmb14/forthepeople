"use client";

// In-migrants by origin and by reason, as two small bar charts side by side
// (stacked on phones). Bar colours come from the colour-blind-safe Okabe-Ito
// palette (../types); "Other" is a neutral token. Chrome from ../chartKit.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  OKABE_ITO,
  isNonEmptyObject,
  type MigrationData,
  type ProfileLike,
} from "../types";
import { AXIS_LINE, AXIS_TICK, CATEGORY_TICK, ChartEmpty, ChartNote, NEUTRAL_SERIES, TOOLTIP_PROPS } from "../chartKit";

interface Props {
  migration: MigrationData | null | undefined;
}

export function canRenderMigrationBreakdown(
  profile: ProfileLike | null | undefined,
): boolean {
  return isNonEmptyObject(profile?.migration);
}

/** Small sub-heading above each of the two charts. */
function ChartTitle({ children }: { children: React.ReactNode }) {
  return <p className="ftp-label" style={{ marginBottom: 4 }}>{children}</p>;
}

export default function MigrationBreakdown({ migration }: Props) {
  if (!migration) {
    return <ChartEmpty message="Migration data is not available for this district yet." />;
  }

  const origins = [
    { name: "Same state", value: migration.fromSameState ?? 0, color: OKABE_ITO.bluishGreen },
    { name: "Other state", value: migration.fromOtherState ?? 0, color: OKABE_ITO.skyBlue },
    { name: "From abroad", value: migration.fromAbroad ?? 0, color: OKABE_ITO.orange },
  ].filter((r) => r.value > 0);

  const reasonsData = migration.reasons
    ? ([
        { name: "Work", value: migration.reasons.work ?? 0, color: OKABE_ITO.blue },
        { name: "Marriage", value: migration.reasons.marriage ?? 0, color: OKABE_ITO.vermillion },
        { name: "Education", value: migration.reasons.education ?? 0, color: OKABE_ITO.reddishPurple },
        { name: "Family", value: migration.reasons.family ?? 0, color: OKABE_ITO.yellow },
        { name: "Other", value: migration.reasons.other ?? 0, color: NEUTRAL_SERIES.mid },
      ].filter((r) => r.value > 0))
    : [];

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
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={90} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value">
                  {origins.map((o) => (
                    <Cell key={o.name} fill={o.color} />
                  ))}
                </Bar>
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
                <XAxis type="number" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={AXIS_LINE} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={80} tick={CATEGORY_TICK} axisLine={AXIS_LINE} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} formatter={tooltipFormat} />
                <Bar dataKey="value">
                  {reasonsData.map((r) => (
                    <Cell key={r.name} fill={r.color} />
                  ))}
                </Bar>
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
