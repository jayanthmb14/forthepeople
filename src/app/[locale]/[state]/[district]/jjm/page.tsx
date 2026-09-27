/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Jal Jeevan Mission — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useJJM() → one row per village (households, tap connections,
//  coverage %, water-quality test). Each row has its own updatedAt; the
//  newest one is the "as of" for the headline tiles.
//  Urban districts in states where JJM does not apply get a short note
//  pointing to the municipal water board instead of an empty table.
//
//  Pictures (all from the same rows as the tiles):
//    1. a water tank filled to the district's real tap coverage and ten
//       houses with the same share lit (how many homes have a tap);
//    2. a ring of villages by their latest water-test result (is the
//       water safe), drawn only when at least one village was tested;
//    3. a bar chart of the best-covered villages, and a small bar in each
//       row of the village table.
//  With no households on record the tank is not drawn.
//
//  Text: every sentence comes from the "page_jjm" messages
//  (src/dictionaries/<locale>/page_jjm.json); numbers go through
//  useFormat(). Village names and test results are data and stay as
//  published.
"use client";
import { use } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useJJM } from "@/hooks/useRealtimeData";
import type { JJMStatus } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  DataTable,
  LoadingShell,
  ErrorBlock,
  AsOfText,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, WaterTank, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getStateConfig } from "@/lib/constants/state-config";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { HueDonut, OTHER_SHADE } from "@/components/district/daily-services/BreakdownVisuals";
import { useDistrictName } from "@/components/district/daily-services/district-name";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat, useModuleText } from "@/i18n/client";

const EJALSHAKTI = { label: "eJalShakti", href: "https://ejalshakti.gov.in" };

/** Coverage → colour: 100 % green, 50 %+ amber, below that red. */
function coverageColor(pct: number): string {
  return pct >= 100 ? "var(--ftp-live-text)" : pct >= 50 ? "var(--ftp-warn)" : "var(--ftp-danger)";
}

type Quality = "safe" | "issue" | "other" | "untested";

/**
 * The latest water test of a village, read from the published result text
 * ("Safe", "Safe for drinking (treated)", "Requires treatment" …). A
 * tested village whose result is empty or unclear is "other", never
 * guessed as safe or unsafe.
 */
function qualityOf(v: JJMStatus): Quality {
  if (!v.waterQualityTested) return "untested";
  const r = (v.waterQualityResult ?? "").toLowerCase();
  if (/unsafe|not safe|requires|contamin|fail|unfit|issue|problem/.test(r)) return "issue";
  if (/safe|potable/.test(r)) return "safe";
  return "other";
}

/** Coverage cell: a small bar in the coverage colour plus the share. */
function CoverageCell({ pct, text }: { pct: number; text: string }) {
  const color = coverageColor(pct);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <span aria-hidden style={{ width: 56, height: 6, borderRadius: 999, background: "var(--ftp-surface-2)", overflow: "hidden" }}>
        <span
          className="ftp-grow-x"
          style={{ display: "block", width: `${Math.min(100, Math.max(2, pct))}%`, height: "100%", borderRadius: 999, background: color }}
        />
      </span>
      <span style={{ color }}>{text}</span>
    </span>
  );
}

function JJMPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_jjm");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useJJM(district, state);

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits });

  const villages = data?.data ?? [];
  const totalHH = villages.reduce((s, v) => s + v.totalHouseholds, 0);
  const totalTaps = villages.reduce((s, v) => s + v.tapConnections, 0);
  const overallCoverage = totalHH > 0 ? (totalTaps / totalHH) * 100 : 0;
  const tested = villages.filter((v) => v.waterQualityTested).length;
  const testedPct = villages.length > 0 ? (tested / villages.length) * 100 : 0;
  const fullyConverted = villages.filter((v) => v.coveragePct >= 100).length;

  // Newest update across all villages (ISO strings sort correctly as text).
  const asOf = villages.reduce<string | null>((m, v) => (!m || v.updatedAt > m ? v.updatedAt : m), null);

  const unknownVillage = t("table.unknownVillage");
  const chartData = [...villages]
    .sort((a, b) => b.coveragePct - a.coveragePct)
    .slice(0, 20)
    .map((v) => ({
      name: (v.villageName ?? unknownVillage).slice(0, 12),
      nameFull: v.villageName ?? unknownVillage,
      coverage: Math.round(v.coveragePct),
      full: v.coveragePct >= 100,
    }));
  const fullInChart = chartData.filter((d) => d.full).length;

  // Houses lit out of 10: the same share the tank shows.
  const homesOfTen = Math.round(Math.min(100, overallCoverage) / 10);

  // Water-quality ring: villages by their latest test result.
  const qCount: Record<Quality, number> = { safe: 0, issue: 0, other: 0, untested: 0 };
  villages.forEach((v) => {
    qCount[qualityOf(v)] += 1;
  });
  const qualityItems = [
    { key: "safe", label: t("quality.safe"), value: qCount.safe, color: "var(--hue)", emoji: "✅" },
    { key: "issue", label: t("quality.issue"), value: qCount.issue, color: "var(--ftp-warn)", emoji: "⚠️" },
    { key: "other", label: t("quality.other"), value: qCount.other, color: "var(--hue-pop)", emoji: "🧪" },
    { key: "untested", label: t("quality.untested"), value: qCount.untested, color: OTHER_SHADE, emoji: "⏳" },
  ];
  const qualityValues = {
    safe: f.number(qCount.safe),
    issue: f.number(qCount.issue),
    other: f.number(qCount.other),
    untested: f.number(qCount.untested),
    tested: f.number(tested),
  };
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  // Urban districts where JJM does not apply: point to the water board.
  const sc = getStateConfig(state);
  const urbanWaterBoard = sc && !sc.jjmApplicable && sc.waterBoard ? sc.waterBoard : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Droplets}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("jjm")}
        freshness={asOf ? { asOf } : undefined}
        source={EJALSHAKTI}
      />

      <AIInsightCard module="jjm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && villages.length === 0 && (
        urbanWaterBoard ? (
          <Card tinted style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                🚰
              </span>
              <h2 className="ftp-title" style={{ fontWeight: 600 }}>{t("urban.title")}</h2>
            </div>
            <p className="ftp-body" style={{ margin: "0 0 8px" }}>
              {t("urban.body", { district: districtName, board: urbanWaterBoard })}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)", margin: 0 }}>
              {t("urban.contact", { board: urbanWaterBoard, body: sc?.municipalBody ?? t("urban.fallbackBody") })}
            </p>
          </Card>
        ) : (
          <NoDataCard module="jjm" district={district} state={state} isUrban={true} />
        )
      )}

      {!isLoading && villages.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏘️" label={t("tiles.villages")} value={f.number(villages.length)} asOf={asOf} />
            <StatTile
              emoji="💧"
              label={t("tiles.coverage")}
              value={f.number(overallCoverage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              unit="%"
              asOf={asOf}
            />
            <StatTile emoji="🚰" label={t("tiles.taps")} value={f.number(totalTaps)} asOf={asOf} />
            <StatTile emoji="🏠" label={t("tiles.households")} value={f.number(totalHH)} asOf={asOf} />
            <StatTile emoji="✅" label={t("tiles.full")} value={f.number(fullyConverted)} sub={t("tiles.fullSub")} asOf={asOf} />
            <StatTile
              emoji="🧪"
              label={t("tiles.tested")}
              value={f.number(testedPct, { maximumFractionDigits: 0 })}
              unit="%"
              sub={t("tiles.testedSub")}
              asOf={asOf}
            />
          </StatStrip>

          {/* Picture 1: a tank filled to the real coverage, and ten houses
              with the same share lit. Only when households are on record. */}
          {totalHH > 0 && (
            <Section title={t("picture.title")} emoji="🚰" action={<AsOfText asOf={asOf} />}>
              <div className="ftp-picture-row">
                <Card tinted padding={18}>
                  <Explainer emoji="💧">
                    {t.rich("picture.simple", {
                      villages: f.number(villages.length),
                      count: villages.length,
                      taps: f.number(totalTaps),
                      homes: f.number(totalHH),
                      b: bNum,
                    })}
                  </Explainer>
                  <Pictogram filled={Math.min(100, overallCoverage) / 10} emoji="🏠" label={t("picture.homes", { n: homesOfTen })} />
                </Card>
                <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WaterTank pct={overallCoverage} label={t("picture.tank")} />
                </Card>
              </div>
            </Section>
          )}

          {/* Picture 2: is the water safe? Villages by their latest test.
              Only when at least one village has been tested. */}
          {tested > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("quality.title")}
                emoji="🧪"
                units={t("quality.units")}
                simple={
                  qCount.issue > 0
                    ? t.rich("quality.simpleIssue", { ...qualityValues, b })
                    : qCount.safe === tested
                      ? t.rich("quality.simpleAllSafe", { ...qualityValues, b })
                      : t.rich("quality.simpleSome", { ...qualityValues, b })
                }
                source={EJALSHAKTI}
                asOf={asOf}
                table={qualityItems.filter((q) => q.value > 0).map((q) => ({ label: q.label, value: f.number(q.value) }))}
              >
                <HueDonut
                  items={qualityItems}
                  centerValue={f.number(villages.length)}
                  centerLabel={t("quality.center", { count: villages.length })}
                  ariaLabel={t("quality.aria", qualityValues)}
                />
              </ChartCard>
            </div>
          )}

          {/* Bar chart of the 20 best-covered villages. */}
          {chartData.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={chartData.length < villages.length ? t("chart.titleTop", { n: f.number(chartData.length) }) : t("chart.titleAll")}
                emoji="🏘️"
                units={t("chart.units")}
                simple={
                  fullInChart > 0
                    ? fullInChart === chartData.length
                      ? t.rich("chart.simpleAll", { n: chartData.length, shown: f.number(chartData.length), b })
                      : t.rich("chart.simpleSome", { full: fullInChart, shown: f.number(chartData.length), b })
                    : t.rich("chart.simpleBest", { name: chartData[0].nameFull, pct: pct(chartData[0].coverage), b })
                }
                legend={[
                  { label: t("chart.legendTap"), swatch: "linear-gradient(180deg, var(--hue), var(--hue-pop))" },
                  { label: t("chart.legendFull"), swatch: "var(--hue-deep)" },
                ]}
                source={EJALSHAKTI}
                asOf={asOf}
                table={chartData.map((d) => ({ label: d.nameFull, value: pct(d.coverage) }))}
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 40, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ ...CHART_AXIS, fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={CHART_AXIS} width={44} domain={[0, 100]} tickFormatter={(v) => pct(Number(v))} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                      formatter={(v) => [pct(Number(v)), t("chart.tooltip")]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.nameFull ?? ""}
                    />
                    <ReferenceLine y={100} stroke="var(--hue-deep)" strokeDasharray="4 4" />
                    <Bar dataKey="coverage" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("chart.tooltip")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Village list, with a small coverage bar in each row. */}
          <Section title={t("table.title")} emoji="📋">
            <DataTable
              caption={t("table.caption", { district: districtName })}
              columns={[
                { key: "village", label: t("table.village") },
                { key: "taps", label: t("table.taps"), numeric: true },
                { key: "coverage", label: t("table.coverage"), numeric: true },
                { key: "quality", label: t("table.quality") },
              ]}
              rows={villages.map((v) => {
                const q = qualityOf(v);
                return {
                  village: v.villageName ?? unknownVillage,
                  taps: `${f.number(v.tapConnections)} / ${f.number(v.totalHouseholds)}`,
                  coverage: <CoverageCell pct={v.coveragePct} text={pct(Math.round(v.coveragePct))} />,
                  quality:
                    q === "safe" ? (
                      <span title={v.waterQualityResult ?? undefined} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-live-text)" }}>
                        <CheckCircle2 size={13} aria-hidden /> {t("quality.safe")}
                      </span>
                    ) : q === "issue" ? (
                      <span title={v.waterQualityResult ?? undefined} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--ftp-warn)" }}>
                        <AlertTriangle size={13} aria-hidden /> {t("quality.issue")}
                      </span>
                    ) : q === "other" ? (
                      <span style={{ color: "var(--ftp-text-2)" }}>{v.waterQualityResult || t("quality.other")}</span>
                    ) : (
                      <span style={{ color: "var(--ftp-text-2)" }}>{t("quality.untested")}</span>
                    ),
                };
              })}
            />
          </Section>
        </>
      )}

      <ModuleSources module="jjm" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="jjm" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="jjm"
        moduleLabel={mt.label("jjm")}
        shareText={
          villages.length > 0
            ? t("share.withData", { district: districtName, pct: pct(overallCoverage, 1) })
            : t("share.noData", { district: districtName })
        }
      />
    </ModulePage>
  );
}

export default function JJMPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("jjm")}>
      <JJMPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
