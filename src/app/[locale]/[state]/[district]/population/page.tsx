/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";
import { usePopulation } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, ErrorBlock, DataTable } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";

export default function PopulationPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePopulation(district, state);

  const rows = data?.data ?? [];
  const latest = rows[rows.length - 1];

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={BarChart3} title="Population & Demographics" description="Census data, literacy rates, sex ratio, and rainfall history" backHref={base} />
      {(() => { const _src = getModuleSources("population", state); return <DataSourceBanner moduleName="population" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="population" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && latest && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Population (2021)" value={latest.population?.toLocaleString("en-IN") ?? "—"} icon={BarChart3} />
            <StatCard label="Sex Ratio" value={latest.sexRatio ? `${latest.sexRatio}/1k` : "—"} />
            <StatCard label="Literacy" value={latest.literacy ? `${latest.literacy}%` : "—"} accent="#16A34A" />
            <StatCard label="Urban %" value={latest.urbanPct ? `${latest.urbanPct}%` : "—"} />
            <StatCard label="Density" value={latest.density ? `${latest.density}/km²` : "—"} />
          </div>

          <SectionLabel>Population Trend</SectionLabel>
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rows} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9B9B9B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9B9B9B" }} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString("en-IN"), "Population"]} />
                <Bar dataKey="population" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionLabel>Census Table</SectionLabel>
          <DataTable
            columns={[
              { key: "year", label: "Year" },
              { key: "pop", label: "Population", mono: true },
              { key: "sex", label: "Sex Ratio", mono: true },
              { key: "lit", label: "Literacy", mono: true },
              { key: "urb", label: "Urban %", mono: true },
            ]}
            rows={rows.map(r => ({
              year: r.year,
              pop: r.population?.toLocaleString("en-IN"),
              sex: r.sexRatio ? `${r.sexRatio}/1k` : "—",
              lit: r.literacy ? `${r.literacy}%` : "—",
              urb: r.urbanPct ? `${r.urbanPct}%` : "—",
            }))}
          />
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="population" />
    </div>
  );
}
