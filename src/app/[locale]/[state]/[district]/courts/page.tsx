/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Courts module page — Design v4 "Rang" module recipe (see the finance page):
//   PageHeader → plain summary → AI summary → StatStrip of emoji tiles →
//   picture (case files still waiting + the exact pendency rate) →
//   "keeping up" rings (cases decided for every new case, per court) →
//   court-wise ChartCard → full table → honest EmptyState when there are no
//   rows → sources + Share/Compare.
// Data comes from useCourts() (NJDG figures stored per court per year).
// Every word on the page comes from src/dictionaries/<locale>/page_courts.json.

"use client";
import type React from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCourts } from "@/hooks/useRealtimeData";
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
import { MiniRing } from "@/components/accountability/AccountabilityVisuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

const NJDG = { label: "NJDG", href: "https://njdg.ecourts.gov.in" };

/** At most this many "keeping up" rings; the courts with the most new cases win. */
const MAX_RINGS = 8;

/** Bold text inside translated sentences (t.rich "<b>…</b>"). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function CourtsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_courts");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtInfo = getDistrict(state, district);
  // In sentences, use the district's local name when the page is in its language.
  const districtName =
    districtInfo?.nameLocal && scriptLang(districtInfo.nameLocal) === locale
      ? districtInfo.nameLocal
      : districtInfo?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = useCourts(district, state);
  const num = (n: number) => f.number(n);
  const pctText = (share: number, digits = 0) => f.number(share, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits });

  const stats = data?.data ?? [];
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const year = String(recentYear);
  const latestStats = stats.filter((s) => s.year === recentYear);

  const totalFiled = latestStats.reduce((s, c) => s + (c.filed ?? 0), 0);
  const totalPending = latestStats.reduce((s, c) => s + (c.pending ?? 0), 0);
  const totalDisposed = latestStats.reduce((s, c) => s + (c.disposed ?? 0), 0);
  const pendingPct = totalFiled + totalPending > 0 ? (totalPending / (totalFiled + totalPending)) * 100 : 0;
  const avgDaysStats = latestStats.filter((c) => c.avgDays != null);
  // null (not 0) when no court reported an average, so we never show a fake zero.
  const avgDays = avgDaysStats.length > 0 ? avgDaysStats.reduce((s, c) => s + (c.avgDays ?? 0), 0) / avgDaysStats.length : null;

  const chartData = latestStats.map((c) => ({
    // Full name for the tooltip and table; a shorter one for the axis.
    courtFull: c.courtName,
    court: c.courtName.length > 22 ? c.courtName.slice(0, 21) + "…" : c.courtName,
    filed: c.filed,
    disposed: c.disposed,
    pending: c.pending,
  }));
  const mostPending = [...chartData].sort((a, b) => (b.pending ?? 0) - (a.pending ?? 0))[0];

  // Pendency above 40 % is flagged in the danger colour, otherwise amber.
  const pendencyTone = pendingPct > 40 ? "danger" : "warn";
  // Out of every 10 cases (new + waiting), how many were still waiting.
  const pendingOfTen = Math.round(pendingPct / 10);

  // "Keeping up": cases decided as a share of new cases filed, per court.
  // 100 % or more means the court decided at least as many as it received.
  const courtsWithFiled = latestStats.filter((c) => (c.filed ?? 0) > 0);
  const rings = [...courtsWithFiled]
    .sort((a, b) => (b.filed ?? 0) - (a.filed ?? 0))
    .slice(0, MAX_RINGS)
    .map((c) => ({ court: c.courtName, filed: c.filed ?? 0, disposed: c.disposed ?? 0, share: (c.disposed ?? 0) / (c.filed ?? 1) }));
  const keptUp = courtsWithFiled.filter((c) => (c.disposed ?? 0) >= (c.filed ?? 0)).length;

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={Scale}
        title={mt.label("courts")}
        description={mt.description("courts")}
        backHref={base}
        accent={getModuleAccent("courts")}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={NJDG}
      />

      {/* Plain summary for readers and search engines. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        {t("summary", { district: districtName })}
      </p>

      <AIInsightCard module="courts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState emoji="⚖️" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="📥" label={t("tileFiled")} value={num(totalFiled)} sub={t("yearSub", { year })} />
            <StatTile emoji="✅" label={t("tileDisposed")} value={num(totalDisposed)} sub={t("yearSub", { year })} />
            <StatTile emoji="⏳" label={t("tilePending")} value={num(totalPending)} sub={t("yearSub", { year })} />
            <StatTile
              emoji="📅"
              label={t("tileAvg")}
              value={avgDays != null ? num(Math.round(avgDays)) : "—"}
              unit={avgDays != null ? t("daysUnit") : undefined}
              sub={t("yearSub", { year })}
            />
          </StatStrip>

          {/* The picture: 10 case files, lit for the ones still waiting;
              beside it the exact pendency rate in its warning colour. */}
          {totalFiled + totalPending > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="⚖️">
                  {t.rich("explain", { year, filed: num(totalFiled), pending: num(totalPending), n: num(pendingOfTen), b: bold })}
                </Explainer>
                <Pictogram filled={pendingPct / 10} emoji="📁" label={t("picto", { n: num(pendingOfTen), year })} />
              </Card>
              <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <p className="ftp-label">{t("rateLabel", { year })}</p>
                <div className="ftp-bignum" style={{ fontSize: 40, lineHeight: 1, color: `var(--ftp-${pendencyTone})` }}>
                  {pctText(pendingPct / 100, 1)}
                </div>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("rateNote")}</p>
                <ProgressBar pct={pendingPct} tone={pendencyTone} />
              </Card>
            </div>
          )}

          {/* Keeping up: one ring per court — cases decided for every new
              case filed. A different question from the backlog above: is
              each court at least keeping pace with what comes in? */}
          {rings.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("ringsTitle", { year })}
                emoji="🎯"
                units={courtsWithFiled.length > MAX_RINGS ? t("ringsUnitsTop", { n: MAX_RINGS }) : t("ringsUnits")}
                simple={t.rich("ringsSimple", { kept: keptUp, n: courtsWithFiled.length, b: bold })}
                source={NJDG}
                asOf={lastUpdated}
                asOfPeriod={year}
                table={rings.map((r) => ({
                  label: r.court,
                  value: t("ringsTableValue", { pct: pctText(r.share), disposed: num(r.disposed), filed: num(r.filed) }),
                }))}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 130px), 1fr))",
                    gap: 18,
                    justifyItems: "center",
                  }}
                >
                  {rings.map((r, i) => (
                    <MiniRing
                      key={r.court}
                      index={i}
                      pct={r.share * 100}
                      valueText={pctText(r.share)}
                      caption={r.court}
                      sub={t("ringsSub", { disposed: num(r.disposed), filed: num(r.filed) })}
                      ariaLabel={t("ringsAria", { court: r.court, pct: pctText(r.share), year })}
                    />
                  ))}
                </div>
              </ChartCard>
            </div>
          )}

          {/* Court-wise chart */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("chartTitle", { year })}
                emoji="📂"
                units={t("chartUnits")}
                simple={
                  mostPending && (mostPending.pending ?? 0) > 0
                    ? t.rich("chartSimple", { court: mostPending.courtFull, count: num(mostPending.pending ?? 0), b: bold })
                    : null
                }
                legend={[
                  { label: t("legendFiled"), swatch: "var(--ftp-border-strong)" },
                  { label: t("legendDisposed"), swatch: "var(--hue)" },
                  { label: t("legendPending"), swatch: "var(--ftp-danger)" },
                ]}
                source={NJDG}
                asOf={lastUpdated}
                asOfPeriod={year}
                table={chartData.map((r) => ({
                  label: r.courtFull,
                  value: t("chartTableValue", { filed: num(r.filed ?? 0), disposed: num(r.disposed ?? 0), pending: num(r.pending ?? 0) }),
                }))}
              >
                {/* 72 px per court (three bars each) so every name is readable. */}
                <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 72 + 40)}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }} barGap={2}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} />
                    <YAxis type="category" dataKey="court" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v, name) => [num(Number(v)), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.courtFull ?? ""}
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

          {/* Table */}
          <Section title={t("tableTitle")} emoji="📋">
            <DataTable
              caption={t("tableCaption")}
              columns={[
                { key: "year", label: t("colYear"), mono: true, align: "left" },
                { key: "court", label: t("colCourt") },
                { key: "filed", label: t("colFiled"), numeric: true },
                { key: "disposed", label: t("colDisposed"), numeric: true },
                { key: "pending", label: t("colPending"), numeric: true },
                { key: "days", label: t("colDays"), numeric: true },
              ]}
              rows={stats.map((c) => ({
                year: c.year,
                court: c.courtName,
                filed: num(c.filed ?? 0),
                disposed: num(c.disposed ?? 0),
                pending: num(c.pending ?? 0),
                days: c.avgDays != null ? num(Math.round(c.avgDays)) : "—",
              }))}
            />
          </Section>
        </>
      )}

      <ModulePageFooter
        moduleSlug="courts"
        locale={locale}
        state={state}
        district={district}
        sourceUrls={{ "NJDG (National Judicial Data Grid)": "https://njdg.ecourts.gov.in" }}
      />
    </div>
  );
}

export default function CourtsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("courts")}>
      <CourtsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
