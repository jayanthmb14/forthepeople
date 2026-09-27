/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Schools — Layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Which schools are there, and how good are they?"
//  The answer, in one sentence: "The 40 schools listed for Mandya have
//  18,000 students and 700 teachers: about 26 students for each teacher.
//  In 2024, about 8 of every 10 students passed their board exam."
//
//  Data: /api/data/schools → `snapshot`: the district's UDISE+ totals
//  (schools, teachers, students for the school year) from the UDISE+
//  collector — when it exists, the answer, tiles and classroom picture use
//  it, never a sum of the list — and `data`: up to 200 schools listed by
//  name (entered by hand), each with up to 3 years of board results. The API sends every column, so this page also reads
//  the UDISE code, toilets / library / lab flags, the map point and the
//  update date (the shared School type does not list them). UDISE+ is
//  yearly, so the tiles say which result year they reach instead of a
//  "fresh" date.
//
//  Page: header → the answer → 4 tiles → one picture (ten caps for the
//  pass share + one teacher's class) → "Find a school" cards (tap → a
//  sheet with results by year, facilities, students and teachers, the
//  UDISE code, directions) → charts (kinds of schools, pass rate by year)
//  → teachers' posts → AI insight → news, share (sources are in the layout's verification panel).
//
//  Text: page_schools (en/kn/hi). School names, types, levels and exam
//  names are data and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useDistrictData } from "@/hooks/useDistrictData";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/page-kit";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import StaffingSection from "@/components/district/daily-services/StaffingSection";
import { HueDonut, MiniRing, topWithOther } from "@/components/district/daily-services/BreakdownVisuals";
import { fitGrid, TapCard, CardBar, SearchBox, MoreButton, ActionLink, SheetNote, SheetHeading, matches, mapsUrl, usePlaceName } from "@/components/services-1/kit";
import PageEnd from "@/components/services-1/PageEnd";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import type { DistrictSnapshot } from "@/scraper/lib/district-snapshot";
import type { UdiseSnapshotData } from "@/scraper/lib/udise";

const UDISE = { label: "UDISE+", href: "https://udiseplus.gov.in" };

/** One school as the API returns it (Prisma School + its latest results). */
interface SchoolRow {
  id: string;
  name: string;
  nameLocal?: string | null;
  type: string;
  level: string;
  udiseCode?: string | null;
  address?: string | null;
  students?: number | null;
  teachers?: number | null;
  studentTeacherRatio?: number | null;
  hasToilets?: boolean | null;
  hasLibrary?: boolean | null;
  hasLab?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string | null;
  results: Array<{
    id: string;
    year: number;
    exam: string;
    appeared: number;
    passed: number;
    passPercentage: number;
    distinction?: number | null;
    firstClass?: number | null;
    source?: string | null;
  }>;
}

/** The classroom picture draws at most this many students; the rest is a "+N". */
const CLASS_SHOWN_MAX = 40;
/** Cards shown before "Show all". */
const FIRST_SHOWN = 24;

/** Students per teacher → how it reads. ≤ 20 good, ≤ 30 all right, above 30 crowded. */
function ratioBand(ratio: number): "good" | "ok" | "high" {
  return ratio <= 20 ? "good" : ratio <= 30 ? "ok" : "high";
}
const BAND_TONE: Record<"good" | "ok" | "high", Tone> = { good: "live", ok: "warn", high: "danger" };

/** Students per teacher for one school: the published ratio, else worked out from the two counts. */
function ratioOf(s: SchoolRow): number | null {
  if (s.students && s.teachers) return s.students / s.teachers;
  return s.studentTeacherRatio && s.studentTeacherRatio > 0 ? s.studentTeacherRatio : null;
}

/**
 * ClassroomPicture — one teacher beside the real number of students per
 * teacher (rounded). Above CLASS_SHOWN_MAX the extra students are written
 * as "+N" rather than drawn.
 */
function ClassroomPicture({ ratio, wholeDistrict = false }: { ratio: number; wholeDistrict?: boolean }) {
  const t = useTranslations("page_schools");
  const f = useFormat();
  const kids = Math.max(1, Math.round(ratio));
  const shown = Math.min(kids, CLASS_SHOWN_MAX);
  const sentence = t(wholeDistrict ? "picture.classroomDistrict" : "picture.classroom", { kids, n: f.number(kids) });
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={sentence} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 52, height: 52, borderRadius: 16 }}>
          <User size={30} strokeWidth={2} />
        </span>
        <div aria-hidden style={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", minWidth: 0 }}>
          {Array.from({ length: shown }).map((_, i) => (
            <User key={i} size={16} strokeWidth={1.75} style={{ color: "var(--hue)" }} />
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
  const place = usePlaceName();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useDistrictData<SchoolRow[]>("schools", district, state);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [limit, setLimit] = useState(FIRST_SHOWN);
  const [openId, setOpenId] = useState<string | null>(null);

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits });
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const schools = data?.data ?? [];
  // The district's UDISE+ totals (collector), or null.
  const udise = (data?.snapshot ?? null) as DistrictSnapshot<UdiseSnapshotData> | null;
  const ut = udise?.data.totals ?? null;
  const types = Array.from(new Set(schools.map((s) => s.type).filter(Boolean)));
  const levels = Array.from(new Set(schools.map((s) => s.level).filter(Boolean)));

  // Students and teachers: UDISE+ for the whole district only. The schools
  // listed by name carry no checked counts (Sept 2026 audit), so they are
  // never added up into a district figure.
  const totalStudents = ut ? ut.students : 0;
  const totalTeachers = ut ? ut.teachers : 0;
  const avgRatio = totalTeachers > 0 ? totalStudents / totalTeachers : 0;
  const hasRatio = totalTeachers > 0 && totalStudents > 0;
  const hasAny = schools.length > 0 || ut !== null;

  // Pass rates by year, all schools together.
  const passByYear: Record<number, { total: number; passed: number }> = {};
  schools.forEach((sc) => {
    sc.results.forEach((r) => {
      if (!passByYear[r.year]) passByYear[r.year] = { total: 0, passed: 0 };
      passByYear[r.year].total += r.appeared;
      passByYear[r.year].passed += r.passed;
    });
  });
  const passChart = Object.entries(passByYear)
    .sort(([a], [c]) => Number(a) - Number(c))
    .map(([year, { total, passed }]) => ({ year, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 }));
  const latestYear = passChart.length > 0 ? passChart[passChart.length - 1].year : null;
  const latestTotals = latestYear ? passByYear[Number(latestYear)] : null;
  const latestPassPct = latestTotals && latestTotals.total > 0 ? (latestTotals.passed / latestTotals.total) * 100 : null;
  const firstPoint = passChart[0];
  const lastPoint = passChart[passChart.length - 1];
  // Honest "as of" line for the tiles (yearly data).
  const tileSub = ut && udise
    ? t("tileSubUdise", { year: udise.data.year })
    : latestYear
      ? t("tileSub", { year: latestYear })
      : t("tileSubNoYear");

  // Kinds of schools (types are data, shown as published).
  const typeItems = topWithOther(
    types.map((type) => ({ key: type, label: type, value: schools.filter((s) => s.type === type).length })),
    4,
    t("types.other"),
  );
  const typedTotal = typeItems.reduce((s, i) => s + i.value, 0);
  const topType = typeItems[0];
  const listFormat = new Intl.ListFormat(f.intl, { type: "conjunction" });

  // The list.
  const listed = schools
    .filter((s) => typeFilter === "all" || s.type === typeFilter)
    .filter((s) => levelFilter === "all" || s.level === levelFilter)
    .filter((s) => matches(query, s.name, s.nameLocal, s.address, s.type, s.level, s.udiseCode));
  const shown = listed.slice(0, limit);
  const open = schools.find((s) => s.id === openId) ?? null;
  const openRatio = open ? ratioOf(open) : null;
  const yesNo = (v: boolean | null | undefined) => (v === true ? t("sheet.yes") : v === false ? t("sheet.no") : null);

  return (
    <ModulePage>
      <PageHeader icon={GraduationCap} title={mt.label("schools")} description={t("description")} backHref={base} source={UDISE} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && !hasAny && <NoDataCard module="schools" district={district} state={state} />}

      {!isLoading && hasAny && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer>
            {ut && udise
              ? t.rich(hasRatio ? "answer.udise" : "answer.udiseNoRatio", {
                  n: f.number(ut.schools),
                  district: districtName,
                  students: f.number(ut.students),
                  teachers: f.number(ut.teachers),
                  ratio: f.number(Math.round(avgRatio)),
                  year: udise.data.year,
                  b: bNum,
                })
              : hasRatio
              ? t.rich("answer.main", {
                  count: schools.length,
                  n: f.number(schools.length),
                  district: districtName,
                  students: f.number(totalStudents),
                  teachers: f.number(totalTeachers),
                  ratio: f.number(Math.round(avgRatio)),
                  b: bNum,
                })
              : t.rich("answer.noRatio", { count: schools.length, n: f.number(schools.length), district: districtName, b: bNum })}
            {latestPassPct !== null && latestYear && (
              <> {t.rich(ut ? "answer.passListed" : "answer.pass", { year: latestYear, tenths: f.number(Math.round(Math.min(100, latestPassPct) / 10)), b: bNum })}</>
            )}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile label={t(ut ? "tiles.schoolsUdise" : "tiles.schools")} value={f.number(ut ? ut.schools : schools.length)} sub={tileSub} />
            <StatTile label={t("tiles.students")} value={ut ? f.number(totalStudents) : "—"} sub={tileSub} />
            <StatTile label={t("tiles.teachers")} value={ut ? f.number(totalTeachers) : "—"} sub={tileSub} />
            <StatTile
              label={t("tiles.ratio")}
              value={hasRatio ? t("ratioValue", { n: f.number(Math.round(avgRatio)) }) : "—"}
              sub={hasRatio ? t(`band.${ratioBand(avgRatio)}`) : tileSub}
              countUp={false}
            />
          </StatStrip>

          {/* 3. One picture: pass share as ten caps, and one teacher's class. */}
          {(latestPassPct !== null || hasRatio) && (
            <div className={latestPassPct !== null && hasRatio ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              {latestPassPct !== null && latestTotals && latestYear ? (
                <Card tinted padding={18}>
                  <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                    {t(ut ? "picture.passTitleListed" : "picture.passTitle", { year: latestYear })}
                  </p>
                  <IconPictogram
                    icon={GraduationCap}
                    filled={Math.min(100, latestPassPct) / 10}
                    label={t("picture.pass", { year: latestYear, passed: f.number(latestTotals.passed), total: f.number(latestTotals.total) })}
                  />
                </Card>
              ) : null}
              {hasRatio ? (
                <Card tinted padding={18}>
                  <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                    {t("picture.classTitle")}
                  </p>
                  <ClassroomPicture ratio={avgRatio} wholeDistrict={ut !== null} />
                </Card>
              ) : null}
            </div>
          )}

          {/* 4. Find a school; tap a card for everything about it. */}
          {schools.length > 0 && (
            <Section title={t("list.title")}>
              {ut && (
                <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>
                  {t("list.udiseNote", { n: f.number(schools.length), total: f.number(ut.schools) })}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
                <SearchBox
                  id="schools-search"
                  label={t("list.searchLabel")}
                  placeholder={t("list.searchPlaceholder")}
                  value={query}
                  onChange={(v) => {
                    setQuery(v);
                    setLimit(FIRST_SHOWN);
                  }}
                />
              </div>
              {types.length >= 2 && (
                <div style={{ marginBottom: 10 }}>
                  <Chips
                    label={t("list.typeAria")}
                    value={typeFilter}
                    onChange={(v) => {
                      setTypeFilter(v);
                      setLimit(FIRST_SHOWN);
                    }}
                    items={[
                      { value: "all", label: t("list.allTypes"), count: schools.length },
                      ...types.map((type) => ({ value: type, label: type, count: schools.filter((s) => s.type === type).length })),
                    ]}
                  />
                </div>
              )}
              {levels.length >= 2 && (
                <div style={{ marginBottom: 12 }}>
                  <Chips
                    label={t("list.levelAria")}
                    value={levelFilter}
                    onChange={(v) => {
                      setLevelFilter(v);
                      setLimit(FIRST_SHOWN);
                    }}
                    items={[{ value: "all", label: t("list.allLevels") }, ...levels.map((lv) => ({ value: lv, label: lv }))]}
                  />
                </div>
              )}
              {listed.length === 0 ? (
                <EmptyState title={t("list.noMatch", { query })} body={t("list.noMatchBody")} />
              ) : (
                <>
                  <div className="ftp-grid">
                    {shown.map((sc) => {
                      const nm = place(sc.name, sc.nameLocal);
                      const latest = sc.results[0];
                      const ratio = ratioOf(sc);
                      return (
                        <TapCard
                          key={sc.id}
                          title={nm.text}
                          titleLang={nm.lang}
                          subtitle={t("list.typeLevel", { type: sc.type, level: sc.level })}
                          aside={
                            latest ? (
                              <MiniRing
                                pct={latest.passPercentage}
                                label={t("list.passAria", { exam: latest.exam, year: String(latest.year), pct: pct(latest.passPercentage, 1) })}
                              />
                            ) : undefined
                          }
                          hint={t("list.open")}
                          onOpen={() => setOpenId(sc.id)}
                        >
                          <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {sc.students && sc.teachers ? (
                              <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text)" }}>
                                {t("list.people", { students: f.number(sc.students), teachers: f.number(sc.teachers) })}
                              </span>
                            ) : null}
                            {ratio !== null && (
                              <CardBar
                                pct={Math.min(100, (ratio / 40) * 100)}
                                color={ratioBand(ratio) === "high" ? "var(--ftp-danger)" : ratioBand(ratio) === "ok" ? "var(--ftp-warn)" : undefined}
                                label={
                                  <>
                                    <span>{t("list.ratio")}</span>
                                    <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>
                                      {t("ratioValue", { n: f.number(Math.round(ratio)) })}
                                    </span>
                                  </>
                                }
                              />
                            )}
                            {sc.address && <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", overflowWrap: "anywhere" }}>{sc.address}</span>}
                          </span>
                        </TapCard>
                      );
                    })}
                  </div>
                  <MoreButton shown={shown.length} total={listed.length} label={t("list.showAll", { n: f.number(listed.length) })} onClick={() => setLimit(listed.length)} />
                </>
              )}
            </Section>
          )}

          {/* 5. Charts, two to a row on wide screens. */}
          {((typeItems.length >= 2 && topType) || (passChart.length > 1 && firstPoint && lastPoint)) && (
            <div style={fitGrid(340, 28)}>
              {typeItems.length >= 2 && topType && (
                <ChartCard
                  title={t("types.title")}
                  units={t("types.units")}
                  simple={t.rich("types.simple", { type: topType.label, count: f.number(topType.value), total: f.number(typedTotal), b })}
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
              )}
              {/* Pass rate by year — only with two or more years (never a chart from one point). */}
              {passChart.length > 1 && firstPoint && lastPoint && (
                <ChartCard
                  title={t("chart.title")}
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
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={passChart} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                      <XAxis dataKey="year" tick={CHART_AXIS} />
                      <YAxis tick={CHART_AXIS} width={44} domain={[0, 100]} tickFormatter={(v) => pct(Number(v))} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} formatter={(v) => [pct(Number(v)), t("chart.legend")]} />
                      <Bar dataKey="passRate" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("chart.legend")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}

          {/* 6. Are the teachers' posts filled? (nothing without rows) */}
          <StaffingSection module="schools" district={district} state={state} />

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="schools" district={district} />
          </div>
        </>
      )}

      <PageEnd
        ns="page_schools"
        module="schools"
        locale={locale}
        state={state}
        district={district}
        shareText={
          schools.length === 0
            ? t("end.shareNoData", { district: districtName })
            : hasRatio
              ? t("end.shareWithData", { district: districtName, n: f.number(schools.length), ratio: f.number(Math.round(avgRatio)) })
              : t("end.shareNoRatio", { district: districtName, n: f.number(schools.length) })
        }
      />

      {/* The sheet: everything about one school. */}
      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        hueClassName={hueClass("schools")}
        title={open ? place(open.name, open.nameLocal).text : ""}
        titleLang={open ? place(open.name, open.nameLocal).lang : undefined}
        subtitle={open ? t("list.typeLevel", { type: open.type, level: open.level }) : undefined}
        footer={
          open ? (
            <>
              <ActionLink href={mapsUrl([open.name, open.address].filter(Boolean).join(", "), open.latitude, open.longitude)} primary newTab>
                {t("sheet.directions")}
              </ActionLink>
              <ActionLink href={UDISE.href} newTab>
                {t("sheet.udise")}
              </ActionLink>
            </>
          ) : undefined
        }
      >
        {open && (
          <>
            {openRatio !== null && open.students && open.teachers ? (
              <SheetNote>
                {t.rich("sheet.people", {
                  students: f.number(open.students),
                  teachers: f.number(open.teachers),
                  ratio: f.number(Math.round(openRatio)),
                  b: bNum,
                })}{" "}
                {t(`sheet.band.${ratioBand(openRatio)}`)}
              </SheetNote>
            ) : (
              <SheetNote>{t("sheet.noPeople")}</SheetNote>
            )}

            <SheetHeading>{t("sheet.results")}</SheetHeading>
            {open.results.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--ftp-text-2)" }}>{t("sheet.noResults")}</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {open.results.map((r) => (
                  <li key={r.id}>
                    <CardBar
                      pct={r.passPercentage}
                      label={
                        <>
                          <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{t("sheet.examYear", { exam: r.exam, year: String(r.year) })}</span>
                          <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                            {pct(r.passPercentage, 1)}
                          </span>
                        </>
                      }
                    />
                    <span className="ftp-num" style={{ display: "block", marginTop: 4, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                      {t("sheet.passCount", { passed: f.number(r.passed), appeared: f.number(r.appeared) })}
                      {r.distinction ? ` · ${t("sheet.distinction", { n: f.number(r.distinction) })}` : ""}
                      {r.firstClass ? ` · ${t("sheet.firstClass", { n: f.number(r.firstClass) })}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {(open.hasToilets !== null && open.hasToilets !== undefined) ||
            (open.hasLibrary !== null && open.hasLibrary !== undefined) ||
            (open.hasLab !== null && open.hasLab !== undefined) ? (
              <>
                <SheetHeading>{t("sheet.facilities")}</SheetHeading>
                <DetailList
                  rows={[
                    { label: t("sheet.toilets"), value: yesNo(open.hasToilets) },
                    { label: t("sheet.library"), value: yesNo(open.hasLibrary) },
                    { label: t("sheet.lab"), value: yesNo(open.hasLab) },
                  ]}
                />
              </>
            ) : null}

            <SheetHeading>{t("sheet.about")}</SheetHeading>
            <DetailList
              rows={[
                { label: t("sheet.type"), value: open.type },
                { label: t("sheet.level"), value: open.level },
                { label: t("sheet.students"), value: open.students ? f.number(open.students) : null },
                { label: t("sheet.teachers"), value: open.teachers ? f.number(open.teachers) : null },
                {
                  label: t("sheet.ratio"),
                  value:
                    openRatio !== null ? (
                      <Pill tone={BAND_TONE[ratioBand(openRatio)]}>{t("ratioValue", { n: f.number(Math.round(openRatio)) })}</Pill>
                    ) : null,
                },
                { label: t("sheet.udiseCode"), value: open.udiseCode ? <span className="ftp-num">{open.udiseCode}</span> : null },
                { label: t("sheet.address"), value: open.address },
                { label: t("sheet.updated"), value: open.updatedAt ? f.date(open.updatedAt, { day: "numeric", month: "short", year: "numeric" }) : null },
              ]}
            />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("sheet.note")}</p>
          </>
        )}
      </DetailSheet>
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
