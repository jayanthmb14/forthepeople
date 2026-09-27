/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// StaffingWidget — Sanctioned vs. Filled posts for one module
// Used in: Health, Police, Schools pages.
//
// Design v3 "Civic Ledger":
//   • A plain Card (no tinted background, no coloured border).
//   • Semantic colour only as text, a 6 px dot or a progress fill:
//       more than 30 % vacant → danger, 70 %+ filled → live, else warn.
//   • Every number in mono; the data date ("As of …") is always shown.
//   • Lucide icons, no emoji.
// ═══════════════════════════════════════════════════════════
"use client";
import { AlertTriangle, ExternalLink, HeartPulse, Shield, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDistrictData } from "@/hooks/useDistrictData";
import { Card, SectionHeader, ProgressBar, Pill, AsOfText } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

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
  stateExams: unknown[];
  districtExams: unknown[];
  summary: unknown;
}

interface StaffingWidgetProps {
  module: "health" | "police" | "schools";
  roleLabel: string;   // e.g. "Doctors", "Police Officers", "Teachers"
  district: string;
  state: string;
  /**
   * DEPRECATED (v2 hex theme colour). Accepted so existing callers keep
   * compiling, but ignored — v3 widgets carry no module colour.
   */
  accentColor?: string;
}

const MODULE_ICONS: Record<StaffingWidgetProps["module"], LucideIcon> = {
  health: HeartPulse,
  police: Shield,
  schools: GraduationCap,
};

/** Tone for a fill rate: >30 % vacant = danger, ≥70 % filled = live, else warn. */
function fillTone(filledPct: number): Tone {
  const vacantPct = 100 - filledPct;
  if (vacantPct > 30) return "danger";
  if (filledPct >= 70) return "live";
  return "warn";
}

export default function StaffingWidget({
  module,
  roleLabel,
  district,
  state,
}: StaffingWidgetProps) {
  const { data: apiResponse, isLoading } = useDistrictData<StaffingResponse>("exams", district, state);
  const allStaffing: StaffingRecord[] = apiResponse?.data?.staffing ?? [];
  const moduleStaffing = allStaffing.filter((s) => s.module === module);

  if (isLoading || moduleStaffing.length === 0) return null;

  const totalSanctioned = moduleStaffing.reduce((s, r) => s + r.sanctionedPosts, 0);
  const totalWorking = moduleStaffing.reduce((s, r) => s + r.workingStrength, 0);
  const totalVacant = moduleStaffing.reduce((s, r) => s + r.vacantPosts, 0);
  const overallFilledPct = totalSanctioned > 0
    ? Math.round((totalWorking / totalSanctioned) * 100)
    : 0;
  const overallVacantPct = 100 - overallFilledPct;
  const hasDanger = overallVacantPct > 30;
  const Icon = MODULE_ICONS[module];

  return (
    <section style={{ marginBottom: 20 }}>
      <SectionHeader
        as="h3"
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
            {roleLabel} — sanctioned vs. filled
          </span>
        }
        action={<AsOfText asOf={moduleStaffing[0]?.asOfDate} />}
      />
      <Card>
        {/* Overall fill rate */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 13, lineHeight: "20px", marginBottom: 6 }}>
          <span style={{ fontWeight: 500, color: "var(--ftp-text)" }}>Overall fill rate</span>
          <span className="ftp-num" style={{ color: hasDanger ? "var(--ftp-danger)" : "var(--ftp-live-text)" }}>
            {overallFilledPct}% filled · {overallVacantPct}% vacant
          </span>
        </div>
        <ProgressBar pct={overallFilledPct} tone={hasDanger ? "danger" : "live"} height={8} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <span>
            Working: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{totalWorking.toLocaleString("en-IN")}</span>
            {" / "}Sanctioned: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{totalSanctioned.toLocaleString("en-IN")}</span>
          </span>
          {hasDanger && (
            <span style={{ color: "var(--ftp-danger)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} aria-hidden />
              Shortage: <span className="ftp-num">{totalVacant}</span> posts vacant
            </span>
          )}
        </div>

        {/* Per-department breakdown — hairline-separated rows, not nested boxes */}
        <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
          {moduleStaffing.map((s) => {
            const filledPct = s.sanctionedPosts > 0
              ? Math.round((s.workingStrength / s.sanctionedPosts) * 100)
              : 0;
            const vacantPct = 100 - filledPct;
            const dangerLevel = vacantPct > 30;
            const tone = fillTone(filledPct);

            return (
              <li key={s.id} style={{ borderTop: "1px solid var(--ftp-border)", padding: "12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{s.roleName}</div>
                    <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{s.department}</div>
                  </div>
                  <Pill tone={tone} dot>
                    <span className="ftp-num">{filledPct}%</span> filled
                  </Pill>
                </div>
                <ProgressBar pct={filledPct} tone={tone} height={6} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                  <span>
                    <span className="ftp-num">{s.workingStrength}</span>
                    {" working · "}
                    <span className="ftp-num">{s.vacantPosts}</span>
                    {" vacant"}
                  </span>
                  {dangerLevel && (
                    <span style={{ color: "var(--ftp-danger)" }}>
                      <span className="ftp-num">{vacantPct}%</span> shortage
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Source link */}
        {moduleStaffing[0]?.sourceUrl && (
          <div style={{ marginTop: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
            Source:{" "}
            <a
              href={moduleStaffing[0].sourceUrl!}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ftp-brand)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}
            >
              Official data <ExternalLink size={11} aria-hidden />
            </a>
          </div>
        )}
      </Card>
    </section>
  );
}
