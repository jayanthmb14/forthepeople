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
//  dams together) → a WaterTank card per dam → storage trend ChartCard →
//  canal release table → sources → news → toolbar.
"use client";

import { use } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Info, Waves } from "lucide-react";
import { useWater } from "@/hooks/useRealtimeData";
import type { DamReading } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
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
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getStateConfig } from "@/lib/constants/state-config";
import { getDistrict } from "@/lib/constants/districts";

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

/** "12 Sep, 6:00 pm" — one dam reading's time, for the chart's table view. */
function readingTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

/** A small labelled number inside a dam card, with an explanatory tooltip. */
function DamFigure({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div title={help} className="ftp-label" style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "help" }}>
        {label}
        <Info size={11} aria-hidden />
      </div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

function WaterPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const waterPortal = getStateConfig(state)?.waterPortalName ?? "the state water resources department";
  const { data, isLoading, error } = useWater(district, state);

  const dams = data?.data?.dams ?? [];
  const canals = data?.data?.canals ?? [];

  // Latest reading per dam (rows arrive newest first).
  const latestByDam: Record<string, DamReading> = {};
  dams.forEach((d) => { if (!latestByDam[d.damName]) latestByDam[d.damName] = d; });
  const damList = Object.values(latestByDam);

  // Storage history for the first dam, oldest → newest.
  const firstDam = damList[0];
  const damHistory = dams
    .filter((d) => d.damName === firstDam?.damName)
    .slice(0, 30)
    .reverse()
    .map((d) => ({
      date: new Date(d.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      at: d.recordedAt,
      storage: d.storagePct,
      inflow: d.inflow,
      outflow: d.outflow,
    }));

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
      ? { filled: overHalf, total: damList.length, label: `${overHalf} of ${damList.length} dams are more than half full.` }
      : {
          filled: (overHalf / damList.length) * 10,
          total: 10,
          label: `About ${Math.round((overHalf / damList.length) * 10)} of every 10 dams are more than half full.`,
        };

  // Chart copy, from the same rows the chart draws.
  const trendSimple = (() => {
    if (!firstDam || damHistory.length < 2) return null;
    const a = Math.round(damHistory[0].storage);
    const b = Math.round(damHistory[damHistory.length - 1].storage);
    const from = damHistory[0].date;
    const to = damHistory[damHistory.length - 1].date;
    if (a === b) {
      return <>From {from} to {to}, {firstDam.damName} stayed at about <strong>{b}%</strong> full.</>;
    }
    return (
      <>
        From {from} to {to}, {firstDam.damName} went from <strong>{a}%</strong> to <strong>{b}%</strong> full.
      </>
    );
  })();

  const shareText = damList.length > 0
    ? `Dam levels in ${district}: ${damList.slice(0, 3).map((d) => `${d.damName} ${d.storagePct.toFixed(1)}%`).join(", ")}`
    : `Water and dam data for ${district}`;

  return (
    <ModulePage>
      <PageHeader
        icon={Waves}
        title="Water & Dams"
        description="Dam levels, inflow and outflow, canal release schedules"
        backHref={base}
        accent={getModuleAccent("water")}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={{ label: "India-WRIS", href: "https://indiawris.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read.
          Dam readings are checked every 6 hours (not every 30 minutes). */}
      <ModuleSummary>
        This page shows dam storage levels and canal release schedules for this district, checked every 6 hours from
        India-WRIS (Water Resources Information System). Storage levels are shown as a percentage of total capacity.
        Data includes reservoir inflow, outflow, and current storage levels for dams and reservoirs serving this
        district.
      </ModuleSummary>

      <AIInsightCard module="water" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && dams.length === 0 && canals.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState
            emoji="🏞️"
            title={`No dam or canal readings for ${districtName} yet.`}
            body={`Dam levels, inflow, outflow and canal releases from ${waterPortal} and India-WRIS will show here once we start receiving them for this district.`}
            action={
              <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
              </p>
            }
          />
        </div>
      )}

      {!isLoading && (damList.length > 0 || canals.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          <StatStrip>
            {damList.length > 0 && (
              <StatTile emoji="🏞️" label="Dams tracked" value={damList.length} asOf={newestReading} />
            )}
            {combinedPct !== null && (
              <StatTile
                emoji="💧"
                label="Water in all dams"
                value={combinedPct.toFixed(0)}
                unit="%"
                sub={`${Math.round(storedAll).toLocaleString("en-IN")} of ${Math.round(capacityAll).toLocaleString("en-IN")} MCM live storage`}
                asOf={newestReading}
              />
            )}
            {damList.length > 0 && (
              <StatTile
                emoji="📈"
                label="Dams filling up"
                value={`${fillingUp}/${damList.length}`}
                sub="More water flowing in than out"
                asOf={newestReading}
                countUp={false}
              />
            )}
            {canals.length > 0 && (
              <StatTile emoji="🌊" label="Canal releases listed" value={canals.length} sub="See the schedule below" />
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
            <Explainer title="In simple words" emoji="💧">
              {combinedPct !== null && (
                <>
                  Together, the {damList.length} dams hold about <strong>{Math.round(combinedPct)}%</strong> of the water they can
                  store.{" "}
                </>
              )}
              {fullest.damName} is the fullest at <strong>{Math.round(fullest.storagePct)}%</strong> and {lowest.damName} is the
              lowest at <strong>{Math.round(lowest.storagePct)}%</strong>.
            </Explainer>
            <Pictogram filled={halfPicture.filled} total={halfPicture.total} emoji="💧" label={halfPicture.label} size={24} />
          </Card>
          {combinedPct !== null && (
            <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WaterTank pct={combinedPct} label="All dams together" />
            </Card>
          )}
        </div>
      )}
      {!isLoading && damList.length === 1 && fullest && (
        <div style={{ marginTop: 16 }}>
          <Explainer title="In simple words" emoji="💧">
            {fullest.damName} is about <strong>{Math.round(fullest.storagePct)}%</strong> full
            {fullest.inflow > fullest.outflow
              ? ", and more water is flowing in than out."
              : fullest.inflow < fullest.outflow
                ? ", and more water is flowing out than in."
                : "."}
          </Explainer>
        </div>
      )}

      {!isLoading && damList.length > 0 && (
        <Section title="Dam status" emoji="🏞️">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
            {damList.map((dam) => {
              const tone = storageTone(dam.storagePct);
              return (
                <Card key={dam.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <WaterTank pct={dam.storagePct} label="Water stored" width={84} height={108} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 className="ftp-title">{dam.damName}</h3>
                      {dam.damNameLocal && (
                        <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{dam.damNameLocal}</div>
                      )}
                      {/* Semantic colour as text only. */}
                      <div
                        className="ftp-num ftp-stat-value"
                        style={{ color: TONE_TEXT[tone], marginTop: 6 }}
                        title="Current water stored as a percentage of total reservoir capacity"
                      >
                        {dam.storagePct.toFixed(1)}%
                      </div>
                      <div
                        title="Usable water stored vs total capacity in Million Cubic Metres"
                        style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", cursor: "help", marginTop: 2 }}
                      >
                        Live storage <span className="ftp-num">{dam.storage.toFixed(0)} / {dam.maxStorage.toFixed(0)}</span> MCM
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
                    <DamFigure label="Level (ft)" value={dam.waterLevel.toFixed(1)} help="Current water level in the reservoir measured in feet" />
                    <DamFigure label="Inflow" value={dam.inflow.toFixed(0)} help="Volume of water flowing INTO the reservoir (cusecs)" />
                    <DamFigure
                      label="Outflow"
                      value={dam.outflow.toFixed(0)}
                      help="Volume of water released FROM the reservoir for irrigation, drinking water, or flood management (cusecs)"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Storage trend for the first dam. */}
      {!isLoading && firstDam && damHistory.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={`${firstDam.damName} storage over time`}
            emoji="📈"
            units="Per cent of the dam's full capacity, one point per reading"
            simple={trendSimple}
            legend={[{ label: "Water stored", swatch: "var(--hue)" }]}
            source={{ label: "India-WRIS", href: "https://indiawris.gov.in" }}
            asOf={firstDam.recordedAt}
            table={damHistory.map((h) => ({ label: readingTime(h.at), value: `${h.storage.toFixed(1)}%` }))}
          >
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={damHistory} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                <XAxis dataKey="date" tick={CHART_AXIS} stroke="var(--ftp-border)" interval={4} />
                <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={44} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ stroke: "var(--hue-pop)", strokeWidth: 1 }}
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "Storage"]}
                />
                <Area type="monotone" dataKey="storage" stroke="var(--hue)" strokeWidth={2.5} fill="url(#ftpHueArea)" dot={false} name="Storage" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Canal releases. */}
      {!isLoading && canals.length > 0 && (
        <Section title="Canal release schedule" emoji="🌊">
          <DataTable
            caption={`Canal release schedule for ${district}`}
            columns={[
              { key: "canal", label: "Canal" },
              { key: "date", label: "Date" },
              { key: "cusecs", label: "Cusecs", numeric: true },
              { key: "area", label: "Target area" },
              { key: "dur", label: "Duration" },
            ]}
            rows={canals.map((c) => ({
              canal: c.canalName,
              date: new Date(c.scheduledDate).toLocaleDateString("en-IN"),
              cusecs: c.releaseCusecs.toFixed(0),
              area: c.targetArea ?? "—",
              dur: c.duration ?? "—",
            }))}
          />
        </Section>
      )}

      <ModuleSources module="water" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="water" />
      <ModuleToolbar locale={locale} district={district} moduleSlug="water" moduleLabel="Water & Dams" shareText={shareText} />
    </ModulePage>
  );
}

export default function WaterPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Water & Dams">
      <WaterPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
