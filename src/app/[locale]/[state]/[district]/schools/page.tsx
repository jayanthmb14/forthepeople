/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Schools — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useSchools() → schools with up to 3 years of board results each.
//  UDISE+ is an annual dataset, so the headline tiles say which result
//  year they reach instead of pretending to be current.
//
//  Picture: ten graduation caps with the latest year's real pass share
//  lit, and a "classroom" of one teacher beside the real number of
//  students per teacher. Each part is drawn only when its numbers exist.
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
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const UDISE = { label: "UDISE+", href: "https://udiseplus.gov.in" };

/** The classroom picture draws at most this many students; the rest is a "+N". */
const CLASS_SHOWN_MAX = 40;

/**
 * Student:teacher ratio → bar tone. Same bands as before:
 * ≤ 20 good, ≤ 30 watch, above 30 stretched.
 */
function ratioTone(ratio: number): Tone {
  return ratio <= 20 ? "live" : ratio <= 30 ? "warn" : "danger";
}

/**
 * ClassroomPicture — one teacher beside the real number of students per
 * teacher (rounded). Above CLASS_SHOWN_MAX the extra students are written
 * as "+N" rather than drawn.
 */
function ClassroomPicture({ ratio }: { ratio: number }) {
  const kids = Math.max(1, Math.round(ratio));
  const shown = Math.min(kids, CLASS_SHOWN_MAX);
  const sentence = `One teacher for every ${kids} student${kids === 1 ? "" : "s"} in the schools listed.`;
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={sentence} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 52, height: 52, fontSize: 30, borderRadius: 16 }}>
          🧑‍🏫
        </span>
        <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", minWidth: 0 }}>
          {Array.from({ length: shown }).map((_, i) => (
            <span key={i} className="ftp-emoji" style={{ fontSize: 16, lineHeight: "22px" }}>
              🧒
            </span>
          ))}
          {kids > shown && (
            <span className="ftp-num" style={{ marginLeft: 4, fontSize: 13, color: "var(--hue-deep)" }}>
              +{kids - shown}
            </span>
          )}
        </div>
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{sentence}</figcaption>
    </figure>
  );
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
  const tileSub = latestYear ? `From UDISE+, results up to ${latestYear}` : "UDISE+ annual data";

  // The picture: latest year's pass share, and students per teacher.
  const latestTotals = latestYear ? passByYear[Number(latestYear)] : null;
  const latestPassPct = latestTotals && latestTotals.total > 0 ? (latestTotals.passed / latestTotals.total) * 100 : null;
  const hasRatio = totalTeachers > 0 && totalStudents > 0;
  const firstPoint = passChart[0];
  const lastPoint = passChart[passChart.length - 1];

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
            <StatTile emoji="🏫" label="Schools listed" value={schools.length.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile emoji="🧒" label="Students" value={totalStudents.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile emoji="🧑‍🏫" label="Teachers" value={totalTeachers.toLocaleString("en-IN")} sub={tileSub} />
            <StatTile emoji="⚖️" label="Student : teacher" value={totalTeachers > 0 ? `${avgRatio.toFixed(0)}:1` : "—"} sub={tileSub} />
          </StatStrip>

          {/* The picture: pass share as ten caps, and one teacher's class. */}
          {(latestPassPct !== null || hasRatio) && (
            <div className={latestPassPct !== null && hasRatio ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              {latestPassPct !== null && latestTotals ? (
                <Card tinted padding={18}>
                  <Explainer title="In simple words" emoji="🎓">
                    In {latestYear}, <strong className="ftp-num">{latestTotals.passed.toLocaleString("en-IN")}</strong> of the{" "}
                    <strong className="ftp-num">{latestTotals.total.toLocaleString("en-IN")}</strong> students who sat exams in the schools
                    listed here passed.
                  </Explainer>
                  <Pictogram
                    filled={Math.min(100, latestPassPct) / 10}
                    emoji="🎓"
                    label={`About ${Math.round(Math.min(100, latestPassPct) / 10)} of every 10 students passed in ${latestYear}.`}
                  />
                </Card>
              ) : null}
              {hasRatio ? (
                <Card tinted padding={18}>
                  {latestPassPct === null && (
                    <Explainer title="In simple words" emoji="🍎">
                      The schools listed here have <strong className="ftp-num">{totalStudents.toLocaleString("en-IN")}</strong> students and{" "}
                      <strong className="ftp-num">{totalTeachers.toLocaleString("en-IN")}</strong> teachers.
                    </Explainer>
                  )}
                  <ClassroomPicture ratio={avgRatio} />
                </Card>
              ) : null}
            </div>
          )}

          {/* Sanctioned vs. filled teaching posts (renders nothing without data). */}
          <StaffingSection
            module="schools"
            district={district}
            state={state}
            emoji="🧑‍🏫"
            personEmoji="🧑‍🏫"
          />

          {/* Pass rate chart — only with two or more years (never a chart from one point). */}
          {passChart.length > 1 && firstPoint && lastPoint && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Overall pass rate by year"
                emoji="📈"
                units="Share of students who passed, all schools listed (%)"
                simple={
                  firstPoint.passRate === lastPoint.passRate ? (
                    <>
                      The pass rate was <strong>{lastPoint.passRate}%</strong> in both {firstPoint.year} and {lastPoint.year}.
                    </>
                  ) : (
                    <>
                      The pass rate {lastPoint.passRate > firstPoint.passRate ? "went up" : "went down"} from{" "}
                      <strong>{firstPoint.passRate}%</strong> in {firstPoint.year} to <strong>{lastPoint.passRate}%</strong> in {lastPoint.year}.
                    </>
                  )
                }
                legend={[{ label: "Pass rate", swatch: "linear-gradient(180deg, var(--hue), var(--hue-pop))" }]}
                source={UDISE}
                asOfPeriod={latestYear ?? undefined}
                table={passChart.map((p) => ({ label: p.year, value: `${p.passRate}%` }))}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={passChart} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="year" tick={CHART_AXIS} />
                    <YAxis tick={CHART_AXIS} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} formatter={(v) => [`${Number(v)}%`, "Pass rate"]} />
                    <Bar dataKey="passRate" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name="Pass rate" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* School directory with a type filter. */}
          <Section title="School directory" emoji="📚">
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
                        <h3 className="ftp-title" style={{ fontWeight: 600 }}>{sc.name}</h3>
                        {sc.nameLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{sc.nameLocal}</div>}
                      </div>
                      <Pill>{sc.type}</Pill>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>Level: {sc.level}</div>
                    {sc.address && <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{sc.address}</div>}

                    {(sc.students || sc.teachers) ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                        {sc.students ? (
                          <div>
                            <div className="ftp-label">Students</div>
                            <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>{sc.students.toLocaleString("en-IN")}</div>
                          </div>
                        ) : null}
                        {sc.teachers ? (
                          <div>
                            <div className="ftp-label">Teachers</div>
                            <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>{sc.teachers}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {ratio ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
                          <span>Student : teacher ratio</span>
                          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{ratio.toFixed(0)}:1</span>
                        </div>
                        <ProgressBar pct={Math.min(100, (ratio / 40) * 100)} tone={ratioTone(ratio)} />
                      </div>
                    ) : null}

                    {latestResult && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
                        <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                          {latestResult.exam} {latestResult.year}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
                            <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{latestResult.passPercentage.toFixed(1)}%</span> pass
                          </span>
                          <span className="ftp-num" style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>
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
