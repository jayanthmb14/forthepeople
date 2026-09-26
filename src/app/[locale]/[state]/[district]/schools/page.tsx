/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import StaffingWidget from "@/components/district/StaffingWidget";
import { use, useState } from "react";
import { GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSchools } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, ProgressBar, LoadingShell, ErrorBlock } from "@/components/district/ui";

// Type chips: base + selected backgrounds + text colors, keyed by type string.
// Covers current Pune + Mumbai seed values: GOVERNMENT, AIDED, PRIVATE,
// CENTRAL_GOVT, AGGREGATE, University — plus legacy labels.
type ChipColors = { base: string; text: string; sel: string; selText: string };
const TYPE_CHIP_COLORS: Record<string, ChipColors> = {
  GOVERNMENT:     { base: "#ECFDF5", text: "#15803D", sel: "#BBF7D0", selText: "#14532D" },
  Government:     { base: "#ECFDF5", text: "#15803D", sel: "#BBF7D0", selText: "#14532D" },
  AIDED:          { base: "#EFF6FF", text: "#1D4ED8", sel: "#BFDBFE", selText: "#1E3A8A" },
  "Private-Aided":{ base: "#EFF6FF", text: "#1D4ED8", sel: "#BFDBFE", selText: "#1E3A8A" },
  PRIVATE:        { base: "#FFFBEB", text: "#B45309", sel: "#FDE68A", selText: "#78350F" },
  "Private-Unaided":{ base: "#FFFBEB", text: "#B45309", sel: "#FDE68A", selText: "#78350F" },
  CENTRAL_GOVT:   { base: "#EEF2FF", text: "#4338CA", sel: "#C7D2FE", selText: "#312E81" },
  Central:        { base: "#EEF2FF", text: "#4338CA", sel: "#C7D2FE", selText: "#312E81" },
  AGGREGATE:      { base: "#F3F4F6", text: "#374151", sel: "#D1D5DB", selText: "#111827" },
  University:     { base: "#FAF5FF", text: "#6D28D9", sel: "#DDD6FE", selText: "#4C1D95" },
  "Higher Education": { base: "#FAF5FF", text: "#6D28D9", sel: "#DDD6FE", selText: "#4C1D95" },
};
const ALL_CHIP: ChipColors = { base: "#F5F5F0", text: "#6B6B6B", sel: "#E5E7EB", selText: "#111827" };

// Legacy export kept for the card-type badge rendered in the school cards.
const TYPE_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_CHIP_COLORS).map(([k, v]) => [k, v.selText]),
);

function SchoolsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchools(district, state);
  const [filter, setFilter] = useState("all");

  const schools = data?.data ?? [];
  const types = ["all", ...Array.from(new Set(schools.map((s) => s.type)))];
  const filtered = filter === "all" ? schools : schools.filter((s) => s.type === filter);

  const totalStudents = schools.reduce((s, sc) => s + (sc.students ?? 0), 0);
  const totalTeachers = schools.reduce((s, sc) => s + (sc.teachers ?? 0), 0);
  const avgRatio = totalTeachers > 0 ? (totalStudents / totalTeachers) : 0;

  // Aggregate pass rates by year across all schools
  const passByYear: Record<number, { total: number; passed: number }> = {};
  schools.forEach((sc) => {
    sc.results.forEach((r) => {
      if (!passByYear[r.year]) passByYear[r.year] = { total: 0, passed: 0 };
      passByYear[r.year].total += r.appeared;
      passByYear[r.year].passed += r.passed;
    });
  });
  const passChart = Object.entries(passByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, { total, passed }]) => ({
      year,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={GraduationCap} title="Schools" description="School directory, student-teacher ratios, and exam pass rates" backHref={base} />

      {/* AI-crawler readable summary */}
      <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 16, padding: "12px 16px", background: "#FAFAF8", borderRadius: 8, borderLeft: "3px solid #16A34A" }}>
        This page shows school-level data for this district including Class 10 board exam pass rates, student enrollment, teacher count, and student-teacher ratios. Data is sourced from UDISE+ (Unified District Information System for Education). Government and private school data is from the National School Directory.
      </p>
      {(() => { const _src = getModuleSources("schools", state); return <DataSourceBanner moduleName="schools" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="schools" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Total Schools" value={schools.length} icon={GraduationCap} />
            <StatCard label="Students" value={totalStudents.toLocaleString("en-IN")} />
            <StatCard label="Teachers" value={totalTeachers.toLocaleString("en-IN")} />
            <StatCard label="Student:Teacher" value={`${avgRatio.toFixed(0)}:1`} />
          </div>

          {/* Sanctioned vs. Filled staffing widget */}
          <StaffingWidget
            module="schools"
            roleLabel="Teaching Staff"
            district={district}
            state={state}
            accentColor="#7C3AED"
          />

          {/* Pass rate chart */}
          {passChart.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Overall Pass Rate by Year</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={passChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9B9B9B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${Number(v)}%`, "Pass Rate"]} />
                    <Bar dataKey="passRate" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Type filter — one color per school type, flex-wrap responsive */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {types.map((t) => {
              const c = t === "all" ? ALL_CHIP : (TYPE_CHIP_COLORS[t] ?? ALL_CHIP);
              const isActive = filter === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    background: isActive ? c.sel : c.base,
                    color: isActive ? c.selText : c.text,
                    border: `1px solid ${isActive ? c.selText : c.base}`,
                    boxShadow: isActive ? `0 0 0 2px ${c.selText}22` : "none",
                    minHeight: 36, minWidth: 44,
                    transition: "all 120ms ease",
                  }}
                >
                  {t === "all" ? `All (${schools.length})` : `${t} (${schools.filter(s => s.type === t).length})`}
                </button>
              );
            })}
          </div>

          {/* School cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {filtered.map((sc) => {
              const color = TYPE_COLORS[sc.type] ?? "#6B7280";
              const latestResult = sc.results[0];
              const ratio = sc.students && sc.teachers ? (sc.students / sc.teachers) : null;
              return (
                <div key={sc.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.3 }}>{sc.name}</div>
                      {sc.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{sc.nameLocal}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: `${color}15`, color, flexShrink: 0 }}>{sc.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 8 }}>Level: {sc.level}</div>
                  {sc.address && <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 8 }}>{sc.address}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {sc.students && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>Students</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{sc.students.toLocaleString("en-IN")}</div></div>}
                    {sc.teachers && <div><div style={{ fontSize: 11, color: "#9B9B9B" }}>Teachers</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{sc.teachers}</div></div>}
                  </div>
                  {ratio && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9B9B9B", marginBottom: 3 }}>
                        <span>Student:Teacher ratio</span><span>{ratio.toFixed(0)}:1</span>
                      </div>
                      <ProgressBar
                        pct={Math.min(100, (ratio / 40) * 100)}
                        color={ratio <= 20 ? "#16A34A" : ratio <= 30 ? "#D97706" : ratio <= 40 ? "#EA580C" : "#DC2626"}
                      />
                    </div>
                  )}
                  {latestResult && (
                    <div style={{ marginTop: 10, background: "#F9F9F7", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}>{latestResult.exam} {latestResult.year}</div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>{latestResult.passPercentage.toFixed(1)}% Pass</div>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>{latestResult.passed}/{latestResult.appeared}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SchoolsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Schools">
      <SchoolsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
