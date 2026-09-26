/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// StaffingWidget — Sanctioned vs. Filled progress widget
// Shows danger state (red) when vacancies > 30%
// Used in: Health, Police, Schools pages
// ═══════════════════════════════════════════════════════════
"use client";
import { useDistrictData } from "@/hooks/useDistrictData";
import { SectionLabel } from "@/components/district/ui";

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
  accentColor: string;  // module theme color
}

const MODULE_ICONS: Record<string, string> = {
  health: "🏥",
  police: "👮",
  schools: "🎓",
};

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

export default function StaffingWidget({
  module,
  roleLabel,
  district,
  state,
  accentColor,
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

  return (
    <div style={{
      background: "#FFF",
      border: `1px solid ${accentColor}20`,
      borderRadius: 14,
      padding: "18px 20px",
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionLabel>
          {MODULE_ICONS[module]} {roleLabel} — Sanctioned vs. Filled
        </SectionLabel>
        <span style={{ fontSize: 11, color: "#9B9B9B" }}>
          As of {fmtDate(moduleStaffing[0]?.asOfDate ?? new Date().toISOString())}
        </span>
      </div>

      {/* Overall summary bar */}
      <div style={{
        background: hasDanger ? "#FFF5F5" : "#F0FFF4",
        border: `1px solid ${hasDanger ? "#FECACA" : "#BBF7D0"}`,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
            Overall Fill Rate
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            color: hasDanger ? "#DC2626" : "#16A34A",
            fontFamily: "var(--font-mono)",
          }}>
            {overallFilledPct}% filled · {overallVacantPct}% vacant
          </span>
        </div>
        <div style={{ background: "#F0F0EC", borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{
            background: hasDanger ? "#DC2626" : "#16A34A",
            width: `${overallFilledPct}%`,
            height: "100%",
            borderRadius: 6,
            transition: "width 600ms ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#9B9B9B" }}>
          <span>Working: <strong style={{ color: "#1A1A1A" }}>{totalWorking.toLocaleString("en-IN")}</strong> / Sanctioned: <strong style={{ color: "#1A1A1A" }}>{totalSanctioned.toLocaleString("en-IN")}</strong></span>
          {hasDanger && <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠ Shortage: {totalVacant} posts vacant</span>}
        </div>
      </div>

      {/* Per-department breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {moduleStaffing.map((s) => {
          const filledPct = s.sanctionedPosts > 0
            ? Math.round((s.workingStrength / s.sanctionedPosts) * 100)
            : 0;
          const vacantPct = 100 - filledPct;
          const dangerLevel = vacantPct > 30;
          const barColor = dangerLevel ? "#DC2626" : filledPct >= 70 ? "#16A34A" : "#D97706";

          return (
            <div key={s.id} style={{
              border: `1px solid ${accentColor}15`,
              borderRadius: 8,
              padding: "10px 14px",
              background: `${accentColor}05`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{s.roleName}</div>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>{s.department}</div>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: dangerLevel ? "#DC2626" : accentColor,
                  background: dangerLevel ? "#FEE2E2" : `${accentColor}15`,
                  padding: "2px 7px",
                  borderRadius: 20,
                }}>
                  {filledPct}% filled
                </span>
              </div>
              <div style={{ background: "#F0F0EC", borderRadius: 4, height: 5, overflow: "hidden" }}>
                <div style={{
                  background: barColor,
                  width: `${filledPct}%`,
                  height: "100%",
                  borderRadius: 4,
                  transition: "width 600ms ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#9B9B9B" }}>
                <span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{s.workingStrength}</span>
                  {" working · "}
                  <span style={{ fontFamily: "var(--font-mono)" }}>{s.vacantPosts}</span>
                  {" vacant"}
                </span>
                {dangerLevel && (
                  <span style={{ color: "#DC2626", fontWeight: 700 }}>⚠ {vacantPct}% shortage</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Source link */}
      {moduleStaffing[0]?.sourceUrl && (
        <div style={{ marginTop: 12, fontSize: 11, color: "#9B9B9B" }}>
          Source:{" "}
          <a
            href={moduleStaffing[0].sourceUrl!}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563EB", textDecoration: "none" }}
          >
            Official data ↗
          </a>
        </div>
      )}
    </div>
  );
}
