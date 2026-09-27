/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Water & Dams — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md §4)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useWater() → { dams (newest 20 readings), canals (newest 20) }.
//  Dam readings are checked every 6 hours, so the header shows an honest
//  FreshnessPill from the newest recordedAt instead of a "Live" tag.
//
//  Page order: header → summary → AI insight → emoji StatTiles → picture
//  row (plain sentence + dams more than half full, and one tank for all
//  dams together) → water flowing in and out of each dam → a WaterTank
//  card per dam → storage trend ChartCard (pick a dam) → canal release
//  table → sources → news → toolbar.
//
//  Every word comes from the "page_water" messages; numbers and dates go
//  through useFormat(). Dam and canal names are data: the local-script
//  name leads when it is in the reader's language.
"use client";

import { use, useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Info, Waves } from "lucide-react";
import { useWater } from "@/hooks/useRealtimeData";
import type { DamReading } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  DataTable,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  AsOfText,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, WaterTank, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { FlowBars, FLOW_IN_FILL, FLOW_OUT_FILL } from "@/components/water/WaterVisuals";
import { namePair, useDistrictName } from "@/components/land-water/visuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getStateConfig } from "@/lib/constants/state-config";

/**
 * Storage level → tone. Same thresholds as before: above 75 % is healthy,
 * 30–75 % is a watch level, below 30 % is low.
 */
function storageTone(pct: number): Tone {
  return pct > 75 ? "live" : pct > 30 ? "warn" : "danger";
}
const TONE_TEXT: Record<string, string> = {
  live: "var(--ftp-live-text)",
  warn: "var(--ftp-warn)",
  danger: "var(--ftp-danger)",
};

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** A small labelled number inside a dam card, with an explanatory tooltip. */
function DamFigure({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div title={help} className="ftp-label" style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "help" }}>
        {label}
        <Info size={11} aria-hidden />
      </div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
        {value}
      </div>
    </div>
  );
}

function WaterPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_water");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const waterPortal = getStateConfig(state)?.waterPortalName ?? t("fallbackPortal");
  const { data, isLoading, error } = useWater(district, state);
  const [pickedDam, setPickedDam] = useState<string | null>(null);

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  /** "12 Sep, 6:00 pm" — one dam reading's time, for the chart's table view. */
  const readingTime = (iso: string) =>
    new Date(iso).toLocaleString(f.intl, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

  const dams = data?.data?.dams ?? [];
  const canals = data?.data?.canals ?? [];

  // Latest reading per dam (rows arrive newest first).
  const latestByDam: Record<string, DamReading> = {};
  dams.forEach((d) => {
    if (!latestByDam[d.damName]) latestByDam[d.damName] = d;
  });
  const damList = Object.values(latestByDam);
  const shownName = (d: DamReading) => namePair(d.damName, d.damNameLocal, locale);

  // Storage history per dam, oldest → newest. The trend chart shows the
  // picked dam (default: the first); only dams with two or more readings
  // can be picked, because one reading is not a trend.
  const historyOf = (name: string) =>
    dams
      .filter((d) => d.damName === name)
      .slice(0, 30)
      .reverse()
      .map((d) => ({ at: d.recordedAt, storage: d.storagePct }));
  const trendDams = damList.filter((d) => dams.filter((x) => x.damName === d.damName).length > 1);
  const trendDam = trendDams.find((d) => d.damName === pickedDam) ?? trendDams[0];
  const damHistory = trendDam ? historyOf(trendDam.damName) : [];

  // Figures for the tiles and the picture, all from each dam's latest reading.
  const newestReading = damList.reduce<string | null>((best, d) => (!best || d.recordedAt > best ? d.recordedAt : best), null);
  const withCapacity = damList.filter((d) => d.maxStorage > 0);
  const storedAll = withCapacity.reduce((s, d) => s + d.storage, 0);
  const capacityAll = withCapacity.reduce((s, d) => s + d.maxStorage, 0);
  const combinedPct = capacityAll > 0 ? (storedAll / capacityAll) * 100 : null;
  const fillingUp = damList.filter((d) => d.inflow > d.outflow).length;
  const overHalf = damList.filter((d) => d.storagePct > 50).length;
  const byLevel = [...damList].sort((a, b) => b.storagePct - a.storagePct);
  const fullest = byLevel[0];
  const lowest = byLevel[byLevel.length - 1];

  const halfPicture =
    damList.length <= 12
      ? { filled: overHalf, total: damList.length, label: t("halfCount", { n: overHalf, total: damList.length }) }
      : {
          filled: (overHalf / damList.length) * 10,
          total: 10,
          label: t("halfAbout", { n: Math.round((overHalf / damList.length) * 10) }),
        };

  // Second picture: water flowing in and out of each dam (needs two dams
  // and at least one non-zero flow, so it never draws empty bars).
  const showFlows = damList.length >= 2 && damList.some((d) => d.inflow > 0 || d.outflow > 0);
  const flowRows = [...damList]
    .sort((a, b) => Math.max(b.inflow, b.outflow) - Math.max(a.inflow, a.outflow))
    .map((d) => {
      const n = shownName(d);
      return { key: d.id, name: n.primary, nameLang: n.primaryLang, inflow: d.inflow, outflow: d.outflow };
    });

  // Chart copy, from the same rows the chart draws.
  const trendSimple = (() => {
    if (!trendDam || damHistory.length < 2) return null;
    const a = Math.round(damHistory[0].storage);
    const b = Math.round(damHistory[damHistory.length - 1].storage);
    const values = {
      b: bold,
      dam: shownName(trendDam).primary,
      from: shortDay(damHistory[0].at),
      to: shortDay(damHistory[damHistory.length - 1].at),
      start: pct(a),
      end: pct(b),
    };
    return a === b ? t.rich("trendSame", values) : t.rich("trendChange", values);
  })();

  const shareText =
    damList.length > 0
      ? t("share", {
          district: districtName,
          list: new Intl.ListFormat(f.intl, { style: "short", type: "unit" }).format(
            damList.slice(0, 3).map((d) => t("shareItem", { dam: shownName(d).primary, pct: pct(d.storagePct, 1) })),
          ),
        })
      : t("shareEmpty", { district: districtName });

  return (
    <ModulePage>
      <PageHeader
        icon={Waves}
        title={mt.label("water")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("water")}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={{ label: "India-WRIS", href: "https://indiawris.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read.
          Dam readings are checked every 6 hours (not every 30 minutes). */}
      <ModuleSummary>{t("summary")}</ModuleSummary>

      <AIInsightCard module="water" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && dams.length === 0 && canals.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState emoji="🏞️" title={t("emptyTitle", { district: districtName })} body={t("emptyBody", { portal: waterPortal })} />
        </div>
      )}

      {!isLoading && (damList.length > 0 || canals.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          <StatStrip>
            {damList.length > 0 && <StatTile emoji="🏞️" label={t("tileDams")} value={f.number(damList.length)} asOf={newestReading} />}
            {combinedPct !== null && (
              <StatTile
                emoji="💧"
                label={t("tileStored")}
                value={f.number(Math.round(combinedPct))}
                unit="%"
                sub={t("tileStoredSub", { stored: f.number(Math.round(storedAll)), capacity: f.number(Math.round(capacityAll)) })}
                asOf={newestReading}
              />
            )}
            {damList.length > 0 && (
              <StatTile
                emoji="📈"
                label={t("tileFilling")}
                value={`${f.number(fillingUp)}/${f.number(damList.length)}`}
                sub={t("tileFillingSub")}
                asOf={newestReading}
                countUp={false}
              />
            )}
            {canals.length > 0 && (
              <StatTile emoji="🌊" label={t("tileCanals")} value={f.number(canals.length)} sub={t("tileCanalsSub")} />
            )}
          </StatStrip>
        </div>
      )}

      {/* The picture: one plain sentence, dams more than half full, and a
          tank for all dams together (capacity-weighted, from the same live
          storage figures shown on each dam card). */}
      {!isLoading && damList.length >= 2 && fullest && lowest && (
        <div className={combinedPct !== null ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer emoji="💧">
              {combinedPct !== null && (
                <>
                  {t.rich("explainerTogether", { b: bold, n: damList.length, pct: pct(combinedPct) })}{" "}
                </>
              )}
              {t.rich("explainerRange", {
                b: bold,
                fullest: shownName(fullest).primary,
                fullestPct: pct(fullest.storagePct),
                lowest: shownName(lowest).primary,
                lowestPct: pct(lowest.storagePct),
              })}
            </Explainer>
            <Pictogram filled={halfPicture.filled} total={halfPicture.total} emoji="💧" label={halfPicture.label} size={24} />
          </Card>
          {combinedPct !== null && (
            <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WaterTank pct={combinedPct} label={t("tankAll")} />
            </Card>
          )}
        </div>
      )}
      {!isLoading && damList.length === 1 && fullest && (
        <div style={{ marginTop: 16 }}>
          <Explainer emoji="💧">
            {t.rich("explainerOne", {
              b: bold,
              dam: shownName(fullest).primary,
              pct: pct(fullest.storagePct),
              flow: fullest.inflow > fullest.outflow ? "in" : fullest.inflow < fullest.outflow ? "out" : "same",
            })}
          </Explainer>
        </div>
      )}

      {/* Second picture: how much water is coming in and going out of each dam. */}
      {!isLoading && showFlows && (
        <div style={{ marginTop: 20 }}>
          <ChartCard
            title={t("flowTitle")}
            emoji="🔁"
            units={t("flowUnits")}
            simple={t.rich("flowSimple", { b: bold, n: fillingUp, total: damList.length })}
            legend={[
              { label: t("flowInLegend"), swatch: FLOW_IN_FILL },
              { label: t("flowOutLegend"), swatch: FLOW_OUT_FILL },
            ]}
            source={{ label: "India-WRIS", href: "https://indiawris.gov.in" }}
            asOf={newestReading}
            table={flowRows.map((r) => ({
              label: r.name,
              value: t("flowRow", { inflow: f.number(Math.round(r.inflow)), outflow: f.number(Math.round(r.outflow)) }),
            }))}
          >
            <div style={{ marginTop: 14 }}>
              <FlowBars rows={flowRows} />
            </div>
          </ChartCard>
        </div>
      )}

      {!isLoading && damList.length > 0 && (
        <Section title={t("damsTitle")} emoji="🏞️">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
            {damList.map((dam) => {
              const tone = storageTone(dam.storagePct);
              const n = shownName(dam);
              return (
                <Card key={dam.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <WaterTank pct={dam.storagePct} label={t("tankOne")} width={84} height={108} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="ftp-title" lang={n.primaryLang}>
                        {n.primary}
                      </h3>
                      {n.secondary && (
                        <div lang={n.secondaryLang} style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                          {n.secondary}
                        </div>
                      )}
                      {/* Semantic colour as text only. */}
                      <div className="ftp-num ftp-stat-value" style={{ color: TONE_TEXT[tone], marginTop: 6 }} title={t("pctHelp")}>
                        {pct(dam.storagePct, 1)}
                      </div>
                      <div title={t("liveHelp")} style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", cursor: "help", marginTop: 2 }}>
                        {t.rich("liveStorage", {
                          num: (c) => <span className="ftp-num">{c}</span>,
                          stored: f.number(Math.round(dam.storage)),
                          capacity: f.number(Math.round(dam.maxStorage)),
                        })}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <AsOfText asOf={dam.recordedAt} />
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
                    }}
                  >
                    <DamFigure
                      label={t("levelLabel")}
                      value={f.number(dam.waterLevel, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      help={t("levelHelp")}
                    />
                    <DamFigure label={t("inflowLabel")} value={f.number(Math.round(dam.inflow))} help={t("inflowHelp")} />
                    <DamFigure label={t("outflowLabel")} value={f.number(Math.round(dam.outflow))} help={t("outflowHelp")} />
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Storage trend for one dam; chips pick the dam when there are several. */}
      {!isLoading && trendDam && damHistory.length > 1 && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {trendDams.length > 1 && (
            <Chips
              label={t("pickDam")}
              value={trendDam.damName}
              onChange={(v) => setPickedDam(v)}
              items={trendDams.map((d) => ({ value: d.damName, label: shownName(d).primary }))}
            />
          )}
          <ChartCard
            title={t("trendTitle", { dam: shownName(trendDam).primary })}
            emoji="📈"
            units={t("trendUnits")}
            simple={trendSimple}
            legend={[{ label: t("trendLegend"), swatch: "var(--hue)" }]}
            source={{ label: "India-WRIS", href: "https://indiawris.gov.in" }}
            asOf={trendDam.recordedAt}
            table={damHistory.map((h) => ({ label: readingTime(h.at), value: pct(h.storage, 1) }))}
          >
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={damHistory} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                  <XAxis dataKey="at" tickFormatter={(v) => shortDay(String(v))} tick={CHART_AXIS} stroke="var(--ftp-border)" interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={44} domain={[0, 100]} tickFormatter={(v) => pct(Number(v))} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ stroke: "var(--hue-pop)", strokeWidth: 1 }}
                    formatter={(v) => [pct(Number(v), 1), t("trendLegend")]}
                    labelFormatter={(v) => readingTime(String(v))}
                  />
                  <Area type="monotone" dataKey="storage" stroke="var(--hue)" strokeWidth={2.5} fill="url(#ftpHueArea)" dot={false} name={t("trendLegend")} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Canal releases. */}
      {!isLoading && canals.length > 0 && (
        <Section title={t("canalsTitle")} emoji="🌊">
          <DataTable
            caption={t("canalsCaption", { district: districtName })}
            columns={[
              { key: "canal", label: t("colCanal") },
              { key: "date", label: t("colDate") },
              { key: "cusecs", label: t("colCusecs"), numeric: true },
              { key: "area", label: t("colArea") },
              { key: "dur", label: t("colDuration") },
            ]}
            rows={canals.map((c) => {
              const n = namePair(c.canalName, c.canalNameLocal, locale);
              return {
                canal: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 26, height: 26, fontSize: 14, borderRadius: 8 }}>
                      🌊
                    </span>
                    <span lang={n.primaryLang}>{n.primary}</span>
                  </span>
                ),
                date: f.date(c.scheduledDate, { day: "numeric", month: "short", year: "numeric" }),
                cusecs: f.number(Math.round(c.releaseCusecs)),
                area: c.targetArea ?? "—",
                dur: c.duration ?? "—",
              };
            })}
          />
        </Section>
      )}

      <ModuleSources module="water" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="water" />
      <ModuleToolbar locale={locale} district={district} moduleSlug="water" moduleLabel={mt.label("water")} shareText={shareText} />
    </ModulePage>
  );
}

export default function WaterPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("water")}>
      <WaterPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
