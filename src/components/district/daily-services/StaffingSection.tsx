/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  StaffingSection — "Sanctioned vs. filled posts" in Design v4 "Rang"
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
//   • `picture` adds the page's picture row: ten people with the filled
//     share lit, plus a dial. Same totals as the tiles; only drawn when
//     sanctioned posts are on record.
"use client";

import { useDistrictData } from "@/hooks/useDistrictData";
import { Section, Card, StatTile, StatStrip, ProgressBar, AsOfText, SourcePill } from "@/components/district/ui";
import { Explainer, Gauge, Pictogram } from "@/components/district/visuals";

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
  emoji = "🧑‍💼",
  personEmoji = "🧑",
  picture = false,
}: {
  module: "health" | "schools";
  /** e.g. "Healthcare staff", "Teaching staff". */
  roleLabel: string;
  district: string;
  state: string;
  /** Emoji chip before the section heading. */
  emoji?: string;
  /** One person, repeated in the picture and used on the "Working" tile. */
  personEmoji?: string;
  /** Draw the picture row (use it on pages that have no other picture). */
  picture?: boolean;
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
  const filledOfTen = Math.min(10, (totalWorking / Math.max(1, totalSanctioned)) * 10);

  return (
    <Section
      title={`${roleLabel}: sanctioned vs. filled`}
      emoji={emoji}
      action={
        <>
          <AsOfText asOf={asOf} />
          {sourceUrl && <SourcePill label="Official data" href={sourceUrl} />}
        </>
      }
    >
      <StatStrip cols={3}>
        <StatTile emoji="✅" label="Fill rate" value={filledPct} unit="%" sub={`${vacantPct}% vacant`} asOf={asOf} />
        <StatTile emoji={personEmoji} label="Working" value={totalWorking.toLocaleString("en-IN")} sub={`of ${totalSanctioned.toLocaleString("en-IN")} sanctioned`} asOf={asOf} />
        <StatTile emoji="🪑" label="Vacant posts" value={totalVacant.toLocaleString("en-IN")} sub={shortage ? "Shortage" : undefined} asOf={asOf} />
      </StatStrip>

      {/* The picture: ten people, the filled share lit, and a dial. */}
      {picture && totalSanctioned > 0 && (
        <div className="ftp-picture-row" style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer title="In simple words" emoji="💡">
              Of the <strong className="ftp-num">{totalSanctioned.toLocaleString("en-IN")}</strong> {roleLabel.toLowerCase()} posts the
              government has sanctioned here, <strong className="ftp-num">{totalWorking.toLocaleString("en-IN")}</strong> have someone
              working in them.
            </Explainer>
            <Pictogram
              filled={filledOfTen}
              emoji={personEmoji}
              label={`About ${Math.round(filledOfTen)} of every 10 sanctioned posts are filled.`}
            />
          </Card>
          <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gauge value={filledPct} label="Posts filled" caption="Sanctioned posts that are filled" />
          </Card>
        </div>
      )}

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
                  <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                </div>
                <span className="ftp-num" style={{ fontSize: 13, color: danger ? "var(--ftp-danger)" : "var(--hue-deep)", flexShrink: 0 }}>
                  {rowFilled}% filled
                </span>
              </div>
              <ProgressBar pct={rowFilled} tone={tone} />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span>
                  <span className="ftp-num">{s.workingStrength}</span> working, <span className="ftp-num">{s.vacantPosts}</span> vacant
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
