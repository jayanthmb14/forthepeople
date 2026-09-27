/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  StaffingSection — "Sanctioned vs. filled posts" in Design v3
// ═══════════════════════════════════════════════════════════════════════
//
//  Same data and rules as src/components/district/StaffingWidget.tsx
//  (which the police and exams pages still use), drawn with kit pieces:
//
//   • Data: the "exams" module response carries a `staffing` array; we
//     keep only rows for this module (health / schools).
//   • Danger rule: more than 30 % of posts vacant → "shortage", shown in
//     the danger colour as TEXT and as the bar fill (no red boxes).
//   • Renders nothing while loading or when there are no rows, exactly
//     like the old widget, so a page never shows a fake zero.
"use client";

import { useDistrictData } from "@/hooks/useDistrictData";
import { Section, Card, StatTile, StatStrip, ProgressBar, AsOfText, SourcePill } from "@/components/district/ui";

interface StaffingRecord {
  id: string;
  module: string;
  department: string;
  roleName: string;
  sanctionedPosts: number;
  workingStrength: number;
  vacantPosts: number;
  asOfDate: string;
  sourceUrl: string | null;
}

interface StaffingResponse {
  staffing: StaffingRecord[];
}

/** Vacancy share above which we call it a shortage (same as before). */
const SHORTAGE_VACANT_PCT = 30;

export default function StaffingSection({
  module,
  roleLabel,
  district,
  state,
}: {
  module: "health" | "schools";
  /** e.g. "Healthcare Staff", "Teachers". */
  roleLabel: string;
  district: string;
  state: string;
}) {
  const { data: apiResponse, isLoading } = useDistrictData<StaffingResponse>("exams", district, state);
  const rows = (apiResponse?.data?.staffing ?? []).filter((s) => s.module === module);

  if (isLoading || rows.length === 0) return null;

  const totalSanctioned = rows.reduce((s, r) => s + r.sanctionedPosts, 0);
  const totalWorking = rows.reduce((s, r) => s + r.workingStrength, 0);
  const totalVacant = rows.reduce((s, r) => s + r.vacantPosts, 0);
  const filledPct = totalSanctioned > 0 ? Math.round((totalWorking / totalSanctioned) * 100) : 0;
  const vacantPct = 100 - filledPct;
  const shortage = vacantPct > SHORTAGE_VACANT_PCT;
  const asOf = rows[0]?.asOfDate;
  const sourceUrl = rows[0]?.sourceUrl;

  return (
    <Section
      title={`${roleLabel}: sanctioned vs. filled`}
      action={
        <>
          <AsOfText asOf={asOf} />
          {sourceUrl && <SourcePill label="Official data" href={sourceUrl} />}
        </>
      }
    >
      <StatStrip cols={3}>
        <StatTile label="Fill rate" value={filledPct} unit="%" sub={`${vacantPct}% vacant`} asOf={asOf} />
        <StatTile label="Working" value={totalWorking.toLocaleString("en-IN")} sub={`of ${totalSanctioned.toLocaleString("en-IN")} sanctioned`} asOf={asOf} />
        <StatTile label="Vacant posts" value={totalVacant.toLocaleString("en-IN")} sub={shortage ? "Shortage" : undefined} asOf={asOf} />
      </StatStrip>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {rows.map((s) => {
          const rowFilled = s.sanctionedPosts > 0 ? Math.round((s.workingStrength / s.sanctionedPosts) * 100) : 0;
          const rowVacant = 100 - rowFilled;
          const danger = rowVacant > SHORTAGE_VACANT_PCT;
          const tone = danger ? "danger" : rowFilled >= 70 ? "live" : "warn";
          return (
            <Card key={s.id} padding={14}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ftp-title">{s.roleName}</div>
                  <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                </div>
                <span className="ftp-num" style={{ fontSize: 13, color: danger ? "var(--ftp-danger)" : "var(--ftp-text)", flexShrink: 0 }}>
                  {rowFilled}% filled
                </span>
              </div>
              <ProgressBar pct={rowFilled} tone={tone} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span>
                  <span className="ftp-num">{s.workingStrength}</span> working · <span className="ftp-num">{s.vacantPosts}</span> vacant
                </span>
                {danger && <span style={{ color: "var(--ftp-danger)" }}>{rowVacant}% shortage</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
