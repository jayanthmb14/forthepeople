/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Schools — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useSchools() → schools with up to 3 years of board results each.
//  UDISE+ is an annual dataset, so the headline tiles say which result
//  year they reach instead of pretending to be current.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSchools } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  StatTile,
  StatStrip,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const UDISE = { label: "UDISE+", href: "https://udiseplus.gov.in" };

/**
 * Student:teacher ratio → bar tone. Same bands as before:
 * ≤ 20 good, ≤ 30 watch, above 30 stretched.
 */
function ratioTone(ratio: number): Tone {
  return ratio <= 20 ? "live" : ratio <= 30 ? "warn" : "danger";
}

function SchoolsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchools(district, state);
  const [filter, setFilter] = useState("all");

  const schools = data?.data ?? [];
  const types = Array.from(new Set(schools.map((s) => s.type)));
  const filtered = filter === "all" ? schools : schools.filter((s) => s.type === filter);

  const totalStudents = schools.reduce((s, sc) => s + (sc.students ?? 0), 0);
  const totalTeachers = schools.reduce((s, sc) => s + (sc.teachers ?? 0), 0);
  const avgRatio = totalTeachers > 0 ? (totalStudents / totalTeachers) : 0;

  // Aggregate pass rates by year across all schools.
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
  const latestYear = passChart.length > 0 ? passChart[passChart.length - 1].year : null;
  // Honest "as of" line for the headline tiles (annual data).
  const tileSub = latestYear ? `UDISE+ · results up to ${latestYear}` : "UDISE+ annual data";

  return (
    <ModulePage>
      <PageHeader
        icon={GraduationCap}
        title="Schools"
        description="School directory, student-teacher ratios, and exam pass rates"
        backHref={base}
        accent={getModuleAccent("schools")}
        source={UDISE}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>
        This page shows school-level data for this district including Class 10 board exam pass rates, student
        enrollment, teacher count, and student-teacher ratios. Data is sourced from UDISE+ (Unified District
        Information System for Education). Government and private school data is from the National School Directory.
      </ModuleSummary>

      <AIInsightCard module="schools" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schools.length === 0 && <NoDataCard module="schools" district={district} state={state} />}

      {!isLoading && schools.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile label="Schools listed" value={schools.length.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile label="Students" value={totalStudents.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile label="Teachers" value={totalTeachers.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile label="Student : teacher" value={`${avgRatio.toFixed(0)}:1`} sub={tileSub} />
          </StatStrip>

          {/* Sanctioned vs. filled teaching posts (renders nothing without data). */}
          <StaffingSection module="schools" roleLabel="Teaching staff" district={district} state={state} />

          {/* Pass rate chart. */}
          {passChart.length > 0 && (
            <Section title="Overall pass rate by year">
              <Card>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={passChart} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                    <XAxis dataKey="year" tick={CHART.tick} stroke={CHART.axis} />
                    <YAxis tick={CHART.tick} stroke={CHART.axis} width={36} domain={[0, 100]} />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "var(--ftp-surface-2)" }} formatter={(v) => [`${Number(v)}%`, "Pass rate"]} />
                    <Bar dataKey="passRate" fill={CHART.primary} radius={[4, 4, 0, 0]} name="Pass rate" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Section>
          )}

          {/* School directory with a type filter. */}
          <Section title="School directory">
            <div style={{ marginBottom: 12 }}>
              <Chips
                label="School type"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All", count: schools.length },
                  ...types.map((t) => ({ value: t, label: t, count: schools.filter((s) => s.type === t).length })),
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {filtered.map((sc) => {
                const latestResult = sc.results[0];
                const ratio = sc.students && sc.teachers ? (sc.students / sc.teachers) : null;
                return (
                  <Card key={sc.id} as="article">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{sc.name}</h3>
                        {sc.nameLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{sc.nameLocal}</div>}
                      </div>
                      <Pill>{sc.type}</Pill>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>Level: {sc.level}</div>
                    {sc.address && <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{sc.address}</div>}

                    {(sc.students || sc.teachers) ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                        {sc.students ? (
                          <div>
                            <div className="ftp-label">Students</div>
                            <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px" }}>{sc.students.toLocaleString("en-IN")}</div>
                          </div>
                        ) : null}
                        {sc.teachers ? (
                          <div>
                            <div className="ftp-label">Teachers</div>
                            <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px" }}>{sc.teachers}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {ratio ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
                          <span>Student : teacher ratio</span>
                          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{ratio.toFixed(0)}:1</span>
                        </div>
                        <ProgressBar pct={Math.min(100, (ratio / 40) * 100)} tone={ratioTone(ratio)} />
                      </div>
                    ) : null}

                    {latestResult && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
                        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                          {latestResult.exam} {latestResult.year}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
                            <span className="ftp-num">{latestResult.passPercentage.toFixed(1)}%</span> pass
                          </span>
                          <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>
                            {latestResult.passed}/{latestResult.appeared}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <ModuleSources module="schools" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="schools" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="schools"
        moduleLabel="Schools"
        shareText={
          schools.length > 0
            ? `Schools in ${district}: ${schools.length} listed, student-teacher ratio ${avgRatio.toFixed(0)}:1`
            : `School data for ${district}`
        }
      />
    </ModulePage>
  );
}

export default function SchoolsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Schools">
      <SchoolsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
