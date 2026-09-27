/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Housing — Design v4 "Rang" module page (see docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useHousing() → one row per housing scheme per fiscal year
//  (target, sanctioned, completed, in progress, funds). Rows carry a
//  fiscal year rather than a timestamp, so the tiles name the fiscal
//  year(s) they cover. Funds are stored in whole rupees and only turned
//  into crores for display.
//
//  Order: PageHeader → summary → AI insight → emoji StatTiles → picture
//  (10 houses, N finished, plus a dial) → scheme chart and the money ring
//  in ChartCards → one card per scheme (with its own progress ring) →
//  sources → news → toolbar. Colours come from the page hue (orange for
//  housing), set by HueScope in the district layout.
//
//  Text: every word comes from the "page_housing" messages
//  (src/dictionaries/<locale>/page_housing.json); numbers go through
//  useFormat(). Scheme names are data and stay as published.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Home } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useHousing } from "@/hooks/useRealtimeData";
import type { HousingScheme } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { HueDonut, MUTED_SHADE, ProgressRing, type DonutSegment } from "@/components/district/daily-services/HueCharts";
import { useDistrictName } from "@/components/district/daily-services/useDistrictName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const AWAASSOFT = { label: "AwaasSoft", href: "https://pmayg.nic.in" };

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** One emoji per scheme card: village homes for Gramin, city for Urban. */
function schemeEmoji(name: string): string {
  if (/gramin|rural|pmay-?g\b/i.test(name)) return "🏡";
  if (/urban|pmay-?u\b/i.test(name)) return "🏙️";
  return "🏠";
}

/** One small labelled number inside a scheme card. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

/**
 * The money ring's segments, or null when the funds data cannot be drawn
 * honestly. Only schemes that report an allocation count. Spending must
 * be reported for every one of them (a missing figure is not a zero).
 * Three segments (spent / released but unspent / not released) when the
 * released figures are complete and consistent; otherwise two (spent /
 * not yet spent).
 */
function fundsBreakdown(schemes: HousingScheme[]) {
  const withFunds = schemes.filter((h) => (h.fundsAllocated ?? 0) > 0);
  if (withFunds.length === 0) return null;
  if (withFunds.some((h) => h.fundsSpent === null || h.fundsSpent === undefined)) return null;
  const alloc = withFunds.reduce((s, h) => s + (h.fundsAllocated ?? 0), 0);
  const spent = withFunds.reduce((s, h) => s + (h.fundsSpent ?? 0), 0);
  if (spent > alloc) return null;
  const releasedKnown = withFunds.every((h) => h.fundsReleased !== null && h.fundsReleased !== undefined);
  const released = withFunds.reduce((s, h) => s + (h.fundsReleased ?? 0), 0);
  const withReleased = releasedKnown && spent <= released && released <= alloc;
  return { alloc, spent, released: withReleased ? released : null };
}

function HousingPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_housing");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useHousing(district, state);

  const n = (v: number) => f.number(v);
  const pct = (share: number, digits = 0) => f.number(share, { style: "percent", maximumFractionDigits: digits });
  const crore = (rupees: number) =>
    t("crore", { n: f.number(rupees / 10_000_000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });

  const schemes = data?.data ?? [];
  const totalTarget = schemes.reduce((s, h) => s + h.targetHouses, 0);
  const totalCompleted = schemes.reduce((s, h) => s + h.completed, 0);
  const totalInProgress = schemes.reduce((s, h) => s + h.inProgress, 0);
  const totalSanctioned = schemes.reduce((s, h) => s + h.sanctioned, 0);
  const overallPct = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;

  // Fiscal years covered, e.g. "FY 2024-25" or "FY 2023-24 to 2024-25".
  const years = Array.from(new Set(schemes.map((h) => h.fiscalYear))).sort();
  const fyLabel =
    years.length === 0
      ? undefined
      : years.length === 1
        ? t("fy", { year: years[0] })
        : t("fyRange", { from: years[0], to: years[years.length - 1] });

  const chartData = schemes.map((h) => ({
    name: h.schemeName.replace("Pradhan Mantri", "PM").replace("Awaas Yojana", "AY").slice(0, 16),
    // Full name + year for the tooltip and the "Show as table" view.
    full: t("chart.schemeYear", { scheme: h.schemeName, fy: t("fy", { year: h.fiscalYear }) }),
    target: h.targetHouses,
    completed: h.completed,
    inProgress: h.inProgress,
    remaining: Math.max(0, h.targetHouses - h.sanctioned),
  }));
  // The scheme with the most finished houses, for the chart's one-line summary.
  const topScheme = [...chartData].sort((a, b) => b.completed - a.completed)[0];

  // Money: set aside → released → spent, from the schemes that report it.
  const funds = fundsBreakdown(schemes);
  const fundSegments: DonutSegment[] = funds
    ? funds.released !== null
      ? [
          { key: "spent", label: t("funds.spent"), value: funds.spent, display: crore(funds.spent), emoji: "✅", color: "var(--hue-deep)" },
          { key: "released", label: t("funds.releasedUnspent"), value: funds.released - funds.spent, display: crore(funds.released - funds.spent), emoji: "📤", color: "var(--hue-pop)" },
          { key: "held", label: t("funds.notReleased"), value: funds.alloc - funds.released, display: crore(funds.alloc - funds.released), emoji: "⏳", color: MUTED_SHADE },
        ]
      : [
          { key: "spent", label: t("funds.spent"), value: funds.spent, display: crore(funds.spent), emoji: "✅", color: "var(--hue-deep)" },
          { key: "left", label: t("funds.notSpent"), value: funds.alloc - funds.spent, display: crore(funds.alloc - funds.spent), emoji: "⏳", color: MUTED_SHADE },
        ]
    : [];

  const filledTenths = totalTarget > 0 ? (totalCompleted / totalTarget) * 10 : 0;

  return (
    <ModulePage>
      <PageHeader
        icon={Home}
        title={mt.label("housing")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("housing")}
        source={AWAASSOFT}
      />

      <ModuleSummary>{t("summary", { district: districtName })}</ModuleSummary>

      <AIInsightCard module="housing" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && <NoDataCard module="housing" district={district} state={state} />}

      {!isLoading && schemes.length > 0 && (
        <>
          <StatStrip cols={4}>
            <StatTile emoji="🎯" label={t("tiles.target")} value={n(totalTarget)} sub={fyLabel} />
            <StatTile emoji="📝" label={t("tiles.sanctioned")} value={n(totalSanctioned)} sub={fyLabel} />
            <StatTile emoji="🏠" label={t("tiles.completed")} value={n(totalCompleted)} sub={fyLabel} />
            <StatTile emoji="🏗️" label={t("tiles.inProgress")} value={n(totalInProgress)} sub={fyLabel} />
          </StatStrip>

          {/* The picture: 10 houses, one per tenth of the target, lit for
              the share already finished; plus a dial. Same totals as above. */}
          {totalTarget > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🏠">
                  {t.rich(fyLabel ? "explainerFy" : "explainer", {
                    done: n(totalCompleted),
                    target: n(totalTarget),
                    building: n(totalInProgress),
                    fy: fyLabel ?? "",
                    b: bold,
                  })}
                </Explainer>
                <Pictogram
                  filled={filledTenths}
                  emoji="🏠"
                  label={totalCompleted === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(Math.min(10, filledTenths)) })}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge
                  value={overallPct}
                  label={t("gaugeLabel")}
                  caption={fyLabel ? t("gaugeCaptionFy", { fy: fyLabel }) : t("gaugeCaption")}
                />
              </Card>
            </div>
          )}

          {/* Two charts side by side: houses by scheme, and the money. The
              scheme chart needs at least two schemes to compare. */}
          {(chartData.length > 1 || fundSegments.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, marginTop: 24 }}>
              {chartData.length > 1 && (
                <ChartCard
                  title={t("chart.title")}
                  emoji="🏗️"
                  units={t("chart.units")}
                  simple={
                    topScheme && topScheme.target > 0
                      ? t.rich("chart.simple", { scheme: topScheme.full, done: n(topScheme.completed), target: n(topScheme.target), b: bold })
                      : undefined
                  }
                  legend={[
                    { label: t("chart.completed"), swatch: "var(--hue)" },
                    { label: t("chart.inProgress"), swatch: "var(--hue-pop)" },
                    { label: t("chart.notSanctioned"), swatch: MUTED_SHADE },
                  ]}
                  source={AWAASSOFT}
                  asOfPeriod={fyLabel}
                  table={chartData.map((r) => ({
                    label: r.full,
                    value: t("chart.tableRow", { done: n(r.completed), building: n(r.inProgress), target: n(r.target) }),
                  }))}
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                      <XAxis dataKey="name" tick={{ ...CHART_AXIS, fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis tick={CHART_AXIS} width={48} tickFormatter={(v) => n(Number(v))} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: "var(--hue-tint)" }}
                        formatter={(v, name) => [n(Number(v)), name]}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                      />
                      <Bar dataKey="completed" name={t("chart.completed")} stackId="a" fill="url(#ftpHueFill)" />
                      <Bar dataKey="inProgress" name={t("chart.inProgress")} stackId="a" fill="var(--hue-pop)" />
                      <Bar dataKey="remaining" name={t("chart.notSanctioned")} stackId="a" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {funds && fundSegments.length > 0 && (
                <ChartCard
                  title={t("funds.title")}
                  emoji="💰"
                  units={t("funds.units")}
                  simple={
                    funds.released !== null
                      ? t.rich("funds.simpleReleased", { alloc: crore(funds.alloc), released: crore(funds.released), spent: crore(funds.spent), b: bold })
                      : t.rich("funds.simpleSpent", { alloc: crore(funds.alloc), spent: crore(funds.spent), b: bold })
                  }
                  source={AWAASSOFT}
                  asOfPeriod={fyLabel}
                  table={fundSegments.map((s) => ({ label: s.label, value: s.display }))}
                >
                  <HueDonut
                    segments={fundSegments}
                    center={pct(funds.spent / funds.alloc)}
                    centerSub={t("funds.centerSub")}
                    ariaLabel={t("funds.aria", { spent: crore(funds.spent), alloc: crore(funds.alloc) })}
                    percentOf={(s) => pct(s)}
                  />
                </ChartCard>
              )}
            </div>
          )}

          {/* One card per scheme, each with its own progress ring. */}
          <Section title={t("details.title")} emoji="📋">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: 12 }}>
              {schemes.map((h, i) => {
                const completedPct = h.targetHouses > 0 ? (h.completed / h.targetHouses) * 100 : 0;
                const hasSpent = h.fundsSpent !== null && h.fundsSpent !== undefined;
                const fundsSpentPct = h.fundsAllocated && hasSpent ? ((h.fundsSpent ?? 0) / h.fundsAllocated) * 100 : null;
                return (
                  <Card key={h.id} as="article">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                          {schemeEmoji(h.schemeName)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="ftp-title">{h.schemeName}</h3>
                          <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("fy", { year: h.fiscalYear })}</div>
                        </div>
                      </div>
                      {h.targetHouses > 0 && (
                        <ProgressRing pct={completedPct} size={64} i={i} label={t("details.ringAria", { pct: pct(completedPct / 100) })}>
                          <span className="ftp-bignum" style={{ fontSize: 15, color: "var(--hue-deep)" }}>
                            {pct(completedPct / 100)}
                          </span>
                        </ProgressRing>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 8 }}>
                      <Figure label={t("details.target")} value={n(h.targetHouses)} />
                      <Figure label={t("details.sanctioned")} value={n(h.sanctioned)} />
                      <Figure label={t("details.completed")} value={n(h.completed)} />
                      <Figure label={t("details.inProgress")} value={n(h.inProgress)} />
                    </div>
                    {h.fundsAllocated ? (
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                        <Figure label={t("details.allocated")} value={crore(h.fundsAllocated)} />
                        <Figure label={t("details.released")} value={h.fundsReleased !== null && h.fundsReleased !== undefined ? crore(h.fundsReleased) : "—"} />
                        <Figure label={t("details.spent")} value={hasSpent ? crore(h.fundsSpent ?? 0) : "—"} />
                      </div>
                    ) : null}
                    {fundsSpentPct !== null && (
                      <div style={{ marginTop: 10 }}>
                        <ProgressBar label={t("details.fundsUsed")} pct={fundsSpentPct} />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <ModuleSources module="housing" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="housing" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="housing"
        moduleLabel={mt.label("housing")}
        shareText={
          schemes.length > 0
            ? t("share", { district: districtName, done: n(totalCompleted), target: n(totalTarget), pct: pct(overallPct / 100, 1) })
            : t("shareEmpty", { district: districtName })
        }
      />
    </ModulePage>
  );
}

export default function HousingPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("housing")}>
      <HousingPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
