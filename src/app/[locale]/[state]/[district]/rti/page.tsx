/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// RTI Tracker module page — Design v4 "Rang" module recipe (see the finance
// page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles →
//   picture (applications still waiting + the exact pendency rate) →
//   "File an RTI" card → reply-time bars against the 30-day limit →
//   department ChartCard → full table → honest EmptyState when there are no
//   rows → sources + Share/Compare.
// Data comes from useRTI(). Rows are stored per department per MONTH, so
// the page first adds each department's months together (filed and decided
// are summed; "pending" is a running count, so the newest month's figure is
// used) and names the months it covers instead of claiming a whole year.
// Every word on the page comes from src/dictionaries/<locale>/page_rti.json.

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { useTranslations } from "next-intl";
import { FileText, FilePen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useRTI, type RtiStat } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  DataTable,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { RankBars, officeEmoji } from "@/components/accountability/AccountabilityVisuals";
import Link from "next/link";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Primary call-to-action link, 44 px tall so it is easy to tap. The fill
    and hover come from .ftp-btn-primary (the page hue). */
const PRIMARY_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderWidth: 1,
  borderStyle: "solid",
  color: "var(--ftp-surface)",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  fontWeight: 500,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

/** Section 7(1) of the RTI Act, 2005: a reply is due within 30 days. */
const LEGAL_REPLY_DAYS = 30;

/** Bars in the reply-time picture (slowest first). */
const MAX_REPLY_BARS = 6;

/** The row as the API sends it: the database also stores the month, and
    the average may be missing. */
type RtiRow = Omit<RtiStat, "avgDays"> & { month?: number | null; avgDays: number | null };

/** One department's figures for the newest year on file. */
interface DeptTotals {
  dept: string;
  filed: number;
  disposed: number;
  pending: number;
  avgDays: number | null;
}

/** Bold text inside translated sentences (t.rich "<b>…</b>"). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Adds one department's month rows together (see the header comment). */
function totalsByDepartment(rows: RtiRow[]): DeptTotals[] {
  const byDept = new Map<string, RtiRow[]>();
  for (const r of rows) byDept.set(r.department, [...(byDept.get(r.department) ?? []), r]);
  return [...byDept.entries()].map(([dept, list]) => {
    const newest = [...list].sort((a, b) => (b.month ?? 0) - (a.month ?? 0))[0];
    const withDays = list.filter((r) => r.avgDays != null);
    const weight = withDays.reduce((s, r) => s + Math.max(0, r.disposed), 0);
    const avgDays =
      withDays.length === 0
        ? null
        : weight > 0
          ? withDays.reduce((s, r) => s + (r.avgDays ?? 0) * Math.max(0, r.disposed), 0) / weight
          : withDays.reduce((s, r) => s + (r.avgDays ?? 0), 0) / withDays.length;
    return {
      dept,
      filed: list.reduce((s, r) => s + r.filed, 0),
      disposed: list.reduce((s, r) => s + r.disposed, 0),
      pending: newest.pending,
      avgDays,
    };
  });
}

function RTIPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_rti");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtInfo = getDistrict(state, district);
  // In sentences, use the district's local name when the page is in its language.
  const districtName =
    districtInfo?.nameLocal && scriptLang(districtInfo.nameLocal) === locale
      ? districtInfo.nameLocal
      : districtInfo?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = useRTI(district, state);
  const num = (n: number) => f.number(n);
  const days = (n: number) => f.number(n, { maximumFractionDigits: 1 });
  const monthName = (year: number, month: number, style: "long" | "short" = "long") =>
    f.date(Date.UTC(year, month - 1, 15), { month: style, timeZone: "UTC" });

  const stats = (data?.data?.stats ?? []) as RtiRow[];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestRows = stats.filter((s) => s.year === recentYear);
  const latestStats = totalsByDepartment(latestRows);

  // The months the newest year's figures cover: "2024" for a full year,
  // otherwise "January 2024" or "January to March 2024".
  const months = [...new Set(latestRows.map((r) => r.month).filter((m): m is number => typeof m === "number" && m >= 1 && m <= 12))].sort(
    (a, b) => a - b,
  );
  const period =
    months.length === 0 || months.length === 12
      ? String(recentYear)
      : months.length === 1 || months[0] === months[months.length - 1]
        ? t("oneMonth", { month: monthName(recentYear, months[0]), year: String(recentYear) })
        : t("monthRange", { from: monthName(recentYear, months[0]), to: monthName(recentYear, months[months.length - 1]), year: String(recentYear) });

  const totalFiled = latestStats.reduce((s, r) => s + r.filed, 0);
  const totalPending = latestStats.reduce((s, r) => s + r.pending, 0);
  const totalDisposed = latestStats.reduce((s, r) => s + r.disposed, 0);
  const pendingPct = totalFiled + totalPending > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;

  // Pendency above 30 % is flagged in the danger colour, otherwise amber.
  const pendencyTone = pendingPct > 30 ? "danger" : "warn";
  // Out of every 10 applications (new + waiting), how many were still waiting.
  const pendingOfTen = Math.round(pendingPct / 10);
  const showPicture = totalFiled + totalPending > 0;

  const chartData = latestStats.map((s) => ({
    // Full name for the tooltip and table; a shorter one for the axis.
    deptFull: s.dept,
    dept: s.dept.length > 22 ? s.dept.slice(0, 21) + "…" : s.dept,
    filed: s.filed,
    disposed: s.disposed,
    pending: s.pending,
  }));
  const mostPending = [...chartData].sort((a, b) => b.pending - a.pending)[0];

  // Reply time against the 30-day limit — the slowest departments first.
  const withDays = latestStats.filter((s): s is DeptTotals & { avgDays: number } => s.avgDays != null && s.avgDays > 0);
  const slowest = [...withDays].sort((a, b) => b.avgDays - a.avgDays).slice(0, MAX_REPLY_BARS);
  const overLimit = withDays.filter((s) => s.avgDays > LEGAL_REPLY_DAYS).length;

  const fileRtiLink = (
    <Link href={`${base}/file-rti`} className="ftp-btn ftp-btn-primary" style={PRIMARY_LINK}>
      <FilePen size={14} aria-hidden /> {t("fileRti")}
    </Link>
  );

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={FileText}
        title={mt.label("rti")}
        description={mt.description("rti")}
        backHref={base}
        accent={getModuleAccent("rti")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
      />

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        {t("summary", { district: districtName })}
      </p>

      <AIInsightCard module="rti" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState emoji="🏛️" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} action={fileRtiLink} />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="📨" label={t("tileFiled")} value={num(totalFiled)} sub={period} />
            <StatTile emoji="✅" label={t("tileDisposed")} value={num(totalDisposed)} sub={period} />
            <StatTile emoji="⏳" label={t("tilePending")} value={num(totalPending)} sub={period} />
            <StatTile
              emoji="📊"
              label={t("tileShare")}
              value={f.number(pendingPct, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
              unit="%"
              sub={period}
            />
          </StatStrip>

          {/* The picture: 10 letters, lit for the ones still waiting;
              beside it the exact pendency rate in its warning colour. */}
          {showPicture && (
            <div className={pendingPct > 0 ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="📨">
                  {t.rich("explain", { period, filed: num(totalFiled), pending: num(totalPending), n: num(pendingOfTen), b: bold })}
                </Explainer>
                <Pictogram filled={pendingPct / 10} emoji="✉️" label={t("picto", { n: num(pendingOfTen), period })} />
              </Card>
              {pendingPct > 0 && (
                <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                  <p className="ftp-label">{t("rateLabel", { period })}</p>
                  <div className="ftp-bignum" style={{ fontSize: 40, lineHeight: 1, color: `var(--ftp-${pendencyTone})` }}>
                    {f.number(pendingPct / 100, { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                  </div>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("rateNote")}</p>
                  <ProgressBar pct={pendingPct} tone={pendencyTone} />
                </Card>
              )}
            </div>
          )}

          {/* File RTI call to action */}
          <Section title={t("ctaTitle")} emoji="📜">
            <Card tinted>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("ctaBody")}</p>
                {fileRtiLink}
              </div>
            </Card>
          </Section>

          {/* How long replies take, against the 30-day limit in the law.
              A different question from the backlog above: speed. */}
          {slowest.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("daysTitle", { period })}
                emoji="⏱️"
                units={withDays.length > MAX_REPLY_BARS ? t("daysUnitsTop", { n: MAX_REPLY_BARS }) : t("daysUnits")}
                simple={
                  overLimit > 0
                    ? t.rich("daysSimpleOver", { over: overLimit, n: withDays.length, b: bold })
                    : t.rich("daysSimpleAll", { n: withDays.length, b: bold })
                }
                asOf={lastUpdated}
                asOfPeriod={period}
                table={slowest.map((s) => ({ label: s.dept, value: t("daysValue", { days: days(s.avgDays) }) }))}
              >
                <RankBars
                  ariaLabel={t("daysAria")}
                  marker={{ value: LEGAL_REPLY_DAYS, label: t("daysMarker") }}
                  items={slowest.map((s) => ({
                    key: s.dept,
                    label: s.dept,
                    value: s.avgDays,
                    display: t("daysValue", { days: days(s.avgDays) }),
                    emoji: officeEmoji(s.dept),
                    alert: s.avgDays > LEGAL_REPLY_DAYS,
                  }))}
                />
              </ChartCard>
            </div>
          )}

          {/* Department chart */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("chartTitle", { period })}
                emoji="🏢"
                units={t("chartUnits")}
                simple={
                  mostPending && mostPending.pending > 0
                    ? t.rich("chartSimple", { dept: mostPending.deptFull, count: num(mostPending.pending), b: bold })
                    : null
                }
                legend={[
                  { label: t("legendFiled"), swatch: "var(--ftp-border-strong)" },
                  { label: t("legendDisposed"), swatch: "var(--hue)" },
                  { label: t("legendPending"), swatch: "var(--ftp-danger)" },
                ]}
                asOf={lastUpdated}
                asOfPeriod={period}
                table={chartData.map((r) => ({
                  label: r.deptFull,
                  value: t("chartTableValue", { filed: num(r.filed), disposed: num(r.disposed), pending: num(r.pending) }),
                }))}
              >
                {/* 72 px per department (three bars each) so every name is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 72 + 40)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} />
                    <YAxis type="category" dataKey="dept" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v, name) => [num(Number(v)), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.deptFull ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="filed" name={t("legendFiled")} fill="url(#ftpMutedFill)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="disposed" name={t("legendDisposed")} fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="pending" name={t("legendPending")} fill="var(--ftp-danger)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Full table — one row per department per month, as stored. */}
          <Section title={t("tableTitle")} emoji="📋">
            <DataTable
              caption={t("tableCaption")}
              columns={[
                { key: "year", label: t("colYear"), mono: true, align: "left" },
                ...(stats.some((s) => s.month) ? [{ key: "month", label: t("colMonth") }] : []),
                { key: "dept", label: t("colDept") },
                { key: "filed", label: t("colFiled"), numeric: true },
                { key: "disposed", label: t("colDisposed"), numeric: true },
                { key: "pending", label: t("colPending"), numeric: true },
                { key: "days", label: t("colDays"), numeric: true },
              ]}
              rows={stats.map((s) => ({
                year: s.year,
                month: s.month ? monthName(s.year, s.month, "short") : "—",
                dept: s.department,
                filed: num(s.filed),
                disposed: num(s.disposed),
                pending: num(s.pending),
                days: s.avgDays != null ? days(s.avgDays) : "—",
              }))}
            />
          </Section>
        </>
      )}

      <ModulePageFooter moduleSlug="rti" locale={locale} state={state} district={district} />
    </div>
  );
}

export default function RTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("rti")}>
      <RTIPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
