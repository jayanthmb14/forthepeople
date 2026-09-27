/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Water & Dams — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useWater() → { dams (newest 20 readings), canals (newest 20) }.
//  Dam readings are checked every 6 hours, so the header shows an honest
//  FreshnessPill from the newest recordedAt instead of a "Live" tag.
"use client";

import { use } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Info, Waves } from "lucide-react";
import { useWater } from "@/hooks/useRealtimeData";
import type { DamReading } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  DataTable,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  AsOfText,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

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

/** A small labelled number inside a dam card, with an explanatory tooltip. */
function DamFigure({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        title={help}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", cursor: "help" }}
      >
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
      storage: d.storagePct,
      inflow: d.inflow,
      outflow: d.outflow,
    }));

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
        <NoDataCard module="water" district={district} state={state} />
      )}

      {!isLoading && damList.length > 0 && (
        <Section title="Dam status">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {damList.map((dam) => {
              const tone = storageTone(dam.storagePct);
              return (
                <Card key={dam.id} as="article">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="ftp-title">{dam.damName}</h3>
                      {dam.damNameLocal && (
                        <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{dam.damNameLocal}</div>
                      )}
                    </div>
                    {/* Semantic colour as text only. */}
                    <div
                      className="ftp-num ftp-stat-value"
                      style={{ color: TONE_TEXT[tone], flexShrink: 0 }}
                      title="Current water stored as a percentage of total reservoir capacity"
                    >
                      {dam.storagePct.toFixed(1)}%
                    </div>
                  </div>
                  <ProgressBar value={dam.storagePct} tone={tone === "live" ? "brand" : tone} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 14 }}>
                    <DamFigure label="Level (ft)" value={dam.waterLevel.toFixed(1)} help="Current water level in the reservoir measured in feet" />
                    <DamFigure label="Inflow" value={dam.inflow.toFixed(0)} help="Volume of water flowing INTO the reservoir (cusecs)" />
                    <DamFigure
                      label="Outflow"
                      value={dam.outflow.toFixed(0)}
                      help="Volume of water released FROM the reservoir for irrigation, drinking water, or flood management (cusecs)"
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <span
                      title="Usable water stored vs total capacity in Million Cubic Metres"
                      style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", cursor: "help" }}
                    >
                      Live storage <span className="ftp-num">{dam.storage.toFixed(0)} / {dam.maxStorage.toFixed(0)}</span> MCM
                    </span>
                    <AsOfText asOf={dam.recordedAt} />
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* Storage trend for the first dam. */}
      {!isLoading && firstDam && damHistory.length > 1 && (
        <Section title={`${firstDam.damName} storage trend`}>
          <Card>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={damHistory} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="date" tick={CHART.tick} stroke={CHART.axis} interval={4} />
                <YAxis tick={CHART.tick} stroke={CHART.axis} width={44} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Storage"]} />
                <Line type="monotone" dataKey="storage" stroke={CHART.primary} strokeWidth={2} dot={false} name="Storage" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {/* Canal releases. */}
      {!isLoading && canals.length > 0 && (
        <Section title="Canal release schedule">
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
