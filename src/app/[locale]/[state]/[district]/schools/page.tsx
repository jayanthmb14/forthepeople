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
//  Pictures (each drawn only when its numbers exist):
//    1. ten graduation caps with the latest year's real pass share lit,
//       and a "classroom" of one teacher beside the real number of
//       students per teacher;
//    2. a ring of the kinds of schools listed (Government, Aided,
//       Private …), when there are two or more kinds;
//    3. the pass rate by year (two or more years only), and a small ring
//       with each school's latest pass rate on its card.
//
//  Text: every sentence comes from the "page_schools" messages; numbers
//  go through useFormat(). School names, types, levels and exam names are
//  data and stay as published.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
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
import { HueDonut, MiniRing, topWithOther } from "@/components/district/daily-services/BreakdownVisuals";
import { useDistrictName } from "@/components/district/daily-services/district-name";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat, useModuleText } from "@/i18n/client";

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
  const t = useTranslations("page_schools");
  const f = useFormat();
  const kids = Math.max(1, Math.round(ratio));
  const shown = Math.min(kids, CLASS_SHOWN_MAX);
  const sentence = t("picture.classroom", { kids, n: f.number(kids) });
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
            <span className="ftp-num" style={{ marginInlineStart: 4, fontSize: 13, color: "var(--hue-deep)" }}>
              +{f.number(kids - shown)}
            </span>
          )}
        </div>
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{sentence}</figcaption>
    </figure>
  );
}

function SchoolsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_schools");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchools(district, state);
  const [filter, setFilter] = useState("all");

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits });
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const schools = data?.data ?? [];
  const types = Array.from(new Set(schools.map((s) => s.type)));
  const filtered = filter === "all" ? schools : schools.filter((s) => s.type === filter);

  const totalStudents = schools.reduce((s, sc) => s + (sc.students ?? 0), 0);
  const totalTeachers = schools.reduce((s, sc) => s + (sc.teachers ?? 0), 0);
  const avgRatio = totalTeachers > 0 ? totalStudents / totalTeachers : 0;
  const ratioText = t("ratioValue", { n: f.number(Math.round(avgRatio)) });

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
    .sort(([a], [bY]) => Number(a) - Number(bY))
    .map(([year, { total, passed }]) => ({
      year,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }));
  const latestYear = passChart.length > 0 ? passChart[passChart.length - 1].year : null;
  // Honest "as of" line for the headline tiles (annual data).
  const tileSub = latestYear ? t("tileSub", { year: latestYear }) : t("tileSubNoYear");

  // Picture 1: latest year's pass share, and students per teacher.
  const latestTotals = latestYear ? passByYear[Number(latestYear)] : null;
  const latestPassPct = latestTotals && latestTotals.total > 0 ? (latestTotals.passed / latestTotals.total) * 100 : null;
  const hasRatio = totalTeachers > 0 && totalStudents > 0;
  const firstPoint = passChart[0];
  const lastPoint = passChart[passChart.length - 1];

  // Picture 2: kinds of schools (types are data, shown as published).
  const typeItems = topWithOther(
    types.map((type) => ({ key: type, label: type, value: schools.filter((s) => s.type === type).length })),
    4,
    t("types.other"),
  );
  const typedTotal = typeItems.reduce((s, i) => s + i.value, 0);
  const topType = typeItems[0];
  const listFormat = new Intl.ListFormat(f.intl, { type: "conjunction" });

  return (
    <ModulePage>
      <PageHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("schools")}
        source={UDISE}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>{t("summary")}</ModuleSummary>

      <AIInsightCard module="schools" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schools.length === 0 && <NoDataCard module="schools" district={district} state={state} />}

      {!isLoading && schools.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="🏫" label={t("tiles.schools")} value={f.number(schools.length)} sub={tileSub} />
            <StatTile emoji="🧒" label={t("tiles.students")} value={f.number(totalStudents)} sub={tileSub} />
            <StatTile emoji="🧑‍🏫" label={t("tiles.teachers")} value={f.number(totalTeachers)} sub={tileSub} />
            <StatTile emoji="⚖️" label={t("tiles.ratio")} value={totalTeachers > 0 ? ratioText : "—"} sub={tileSub} />
          </StatStrip>

          {/* Picture 1: pass share as ten caps, and one teacher's class. */}
          {(latestPassPct !== null || hasRatio) && (
            <div className={latestPassPct !== null && hasRatio ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              {latestPassPct !== null && latestTotals && latestYear ? (
                <Card tinted padding={18}>
                  <Explainer emoji="🎓">
                    {t.rich("picture.pass", {
                      year: latestYear,
                      passed: f.number(latestTotals.passed),
                      total: f.number(latestTotals.total),
                      b: bNum,
                    })}
                  </Explainer>
                  <Pictogram
                    filled={Math.min(100, latestPassPct) / 10}
                    emoji="🎓"
                    label={t("picture.passPictogram", { n: Math.round(Math.min(100, latestPassPct) / 10), year: latestYear })}
                  />
                </Card>
              ) : null}
              {hasRatio ? (
                <Card tinted padding={18}>
                  {latestPassPct === null && (
                    <Explainer emoji="🍎">
                      {t.rich("picture.people", { students: f.number(totalStudents), teachers: f.number(totalTeachers), b: bNum })}
                    </Explainer>
                  )}
                  <ClassroomPicture ratio={avgRatio} />
                </Card>
              ) : null}
            </div>
          )}

          {/* Picture 2: kinds of schools, when there are two or more kinds. */}
          {typeItems.length >= 2 && topType && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("types.title")}
                emoji="🏫"
                units={t("types.units")}
                simple={t.rich("types.simple", {
                  type: topType.label,
                  count: f.number(topType.value),
                  total: f.number(typedTotal),
                  b,
                })}
                source={UDISE}
                asOfPeriod={latestYear ?? undefined}
                table={typeItems.map((i) => ({ label: i.label, value: f.number(i.value) }))}
              >
                <HueDonut
                  items={typeItems}
                  centerValue={f.number(typedTotal)}
                  centerLabel={t("types.center", { count: typedTotal })}
                  ariaLabel={t("types.aria", { list: listFormat.format(typeItems.map((i) => `${i.label} ${f.number(i.value)}`)) })}
                />
              </ChartCard>
            </div>
          )}

          {/* Sanctioned vs. filled teaching posts (renders nothing without data). */}
          <StaffingSection module="schools" district={district} state={state} emoji="🧑‍🏫" personEmoji="🧑‍🏫" />

          {/* Pass rate chart — only with two or more years (never a chart from one point). */}
          {passChart.length > 1 && firstPoint && lastPoint && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("chart.title")}
                emoji="📈"
                units={t("chart.units")}
                simple={
                  firstPoint.passRate === lastPoint.passRate
                    ? t.rich("chart.same", { rate: pct(lastPoint.passRate), from: firstPoint.year, to: lastPoint.year, b })
                    : t.rich(lastPoint.passRate > firstPoint.passRate ? "chart.up" : "chart.down", {
                        start: pct(firstPoint.passRate),
                        end: pct(lastPoint.passRate),
                        from: firstPoint.year,
                        to: lastPoint.year,
                        b,
                      })
                }
                legend={[{ label: t("chart.legend"), swatch: "linear-gradient(180deg, var(--hue), var(--hue-pop))" }]}
                source={UDISE}
                asOfPeriod={latestYear ?? undefined}
                table={passChart.map((p) => ({ label: p.year, value: pct(p.passRate) }))}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={passChart} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="year" tick={CHART_AXIS} />
                    <YAxis tick={CHART_AXIS} width={44} domain={[0, 100]} tickFormatter={(v) => pct(Number(v))} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v) => [pct(Number(v)), t("chart.legend")]}
                    />
                    <Bar dataKey="passRate" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("chart.legend")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* School directory with a type filter. */}
          <Section title={t("directory.title")} emoji="📚">
            <div style={{ marginBottom: 12 }}>
              <Chips
                label={t("directory.typeAria")}
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: t("directory.all"), count: schools.length },
                  ...types.map((type) => ({ value: type, label: type, count: schools.filter((s) => s.type === type).length })),
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {filtered.map((sc) => {
                const latestResult = sc.results[0];
                const ratio = sc.students && sc.teachers ? sc.students / sc.teachers : null;
                return (
                  <Card key={sc.id} as="article">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 17, borderRadius: 11 }}>
                          🏫
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="ftp-title" style={{ fontWeight: 600 }}>{sc.name}</h3>
                          {sc.nameLocal && (
                            <div lang="und" style={{ fontSize: 13, lineHeight: 1.55, color: "var(--hue-deep)" }}>
                              {sc.nameLocal}
                            </div>
                          )}
                        </div>
                      </div>
                      <Pill>{sc.type}</Pill>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("directory.level", { level: sc.level })}</div>
                    {sc.address && <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 2 }}>{sc.address}</div>}

                    {sc.students || sc.teachers ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                        {sc.students ? (
                          <div>
                            <div className="ftp-label">{t("directory.students")}</div>
                            <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>
                              {f.number(sc.students)}
                            </div>
                          </div>
                        ) : null}
                        {sc.teachers ? (
                          <div>
                            <div className="ftp-label">{t("directory.teachers")}</div>
                            <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)" }}>
                              {f.number(sc.teachers)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {ratio ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginBottom: 4 }}>
                          <span>{t("directory.ratio")}</span>
                          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>
                            {t("ratioValue", { n: f.number(Math.round(ratio)) })}
                          </span>
                        </div>
                        <ProgressBar pct={Math.min(100, (ratio / 40) * 100)} tone={ratioTone(ratio)} />
                      </div>
                    ) : null}

                    {latestResult && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ftp-border)" }}>
                        <MiniRing
                          pct={latestResult.passPercentage}
                          label={t("directory.passAria", {
                            exam: latestResult.exam,
                            year: String(latestResult.year),
                            pct: pct(latestResult.passPercentage, 1),
                          })}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                            {latestResult.exam} {latestResult.year}
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text)" }}>
                            <span className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                              {pct(latestResult.passPercentage, 1)}
                            </span>{" "}
                            {t("directory.pass")}
                            <span className="ftp-num" style={{ color: "var(--ftp-text-2)", fontSize: 12, marginInlineStart: 8 }}>
                              {t("directory.passCount", { passed: f.number(latestResult.passed), appeared: f.number(latestResult.appeared) })}
                            </span>
                          </div>
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
        moduleLabel={mt.label("schools")}
        shareText={
          schools.length === 0
            ? t("share.noData", { district: districtName })
            : totalTeachers > 0
              ? t("share.withData", { district: districtName, n: f.number(schools.length), ratio: f.number(Math.round(avgRatio)) })
              : t("share.withDataNoRatio", { district: districtName, n: f.number(schools.length) })
        }
      />
    </ModulePage>
  );
}

export default function SchoolsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("schools")}>
      <SchoolsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
