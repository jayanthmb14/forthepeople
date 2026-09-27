/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop Prices — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useCropPrices() → up to 100 AGMARKNET rows, newest date first.
//  Page order: header → summary → AI insight → unit + commodity chips →
//  latest price per commodity (StatTiles) → trend chart → full table →
//  sources → news → CSV / Share / Compare.
//
//  Prices arrive in ₹ per quintal (100 kg). The Kg/Quintal chips only
//  change how we DISPLAY them (÷100 for kg); CSV exports stay per quintal.
"use client";

import { use, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wheat } from "lucide-react";
import { useCropPrices } from "@/hooks/useRealtimeData";
import type { CropPrice } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  StatTile,
  StatStrip,
  DataTable,
  LoadingShell,
  ErrorBlock,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar, ChartLegend } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { downloadCSV, todayISO } from "@/lib/csv";

/** Commodity names sometimes differ only by case/spaces between mandis. */
function commodityKey(name: string): string {
  return name.trim().toLowerCase();
}

/** "12 Sep" — short date for axis ticks and table cells. */
function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** Calendar day of a row, used to compare "same day" vs "earlier day". */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function CropsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useCropPrices(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [unit, setUnit] = useState<"kg" | "quintal">("kg");

  // Display helper: ₹/quintal → ₹/kg when the Kg chip is on.
  const dp = (price: number) => Math.round(unit === "kg" ? price / 100 : price);
  const unitLabel = unit === "kg" ? "/kg" : "/q";

  const prices = useMemo(() => data?.data ?? [], [data]);

  // Newest row per commodity (rows arrive newest-first, so the first one
  // we meet for each commodity is the latest). This also removes duplicate
  // commodity names that differ only by case or spacing.
  const latestByCrop = useMemo(() => {
    const seen = new Map<string, CropPrice>();
    for (const p of prices) {
      const k = commodityKey(p.commodity);
      if (!seen.has(k)) seen.set(k, p);
    }
    return Array.from(seen.values());
  }, [prices]);

  const activeKey = selected ?? (latestByCrop[0] ? commodityKey(latestByCrop[0].commodity) : null);
  const activeLatest = latestByCrop.find((p) => commodityKey(p.commodity) === activeKey) ?? null;

  // Trend series for the chosen commodity: one point per day. We prefer the
  // same market as the latest price so the line compares like with like;
  // if that market has fewer than two days, we fall back to all markets.
  const trend = useMemo(() => {
    if (!activeLatest) return [];
    const rows = prices.filter((p) => commodityKey(p.commodity) === activeKey);
    const onePerDay = (list: CropPrice[]) => {
      const byDay = new Map<string, CropPrice>();
      for (const p of list) if (!byDay.has(dayOf(p.date))) byDay.set(dayOf(p.date), p);
      return Array.from(byDay.values()).reverse(); // oldest → newest for the chart
    };
    const sameMarket = onePerDay(rows.filter((p) => p.market === activeLatest.market));
    return sameMarket.length > 1 ? sameMarket : onePerDay(rows);
  }, [prices, activeKey, activeLatest]);

  /** Previous day's price for the same commodity and market (for the trend arrow). */
  function previousOf(p: CropPrice): CropPrice | undefined {
    return prices.find(
      (x) =>
        commodityKey(x.commodity) === commodityKey(p.commodity) &&
        x.market === p.market &&
        dayOf(x.date) < dayOf(p.date),
    );
  }

  function handleDownload() {
    const rows = prices.slice(0, 100).map((p) => ({
      Date: new Date(p.date).toLocaleDateString("en-IN"),
      Commodity: p.commodity,
      Market: p.market,
      "Min Price (₹/quintal)": p.minPrice,
      "Modal Price (₹/quintal)": p.modalPrice,
      "Max Price (₹/quintal)": p.maxPrice,
    }));
    downloadCSV(rows, `forthepeople_${district}_crop-prices_${todayISO()}.csv`);
  }

  const shareText = latestByCrop.length > 0
    ? `Crop prices in ${district}: ${latestByCrop.slice(0, 3).map((p) => `${p.commodity} ₹${dp(p.modalPrice)}${unitLabel}`).join(", ")}`
    : `Crop prices data for ${district}`;

  return (
    <ModulePage>
      <PageHeader
        icon={Wheat}
        title="Crop Prices"
        description="Mandi prices from AGMARKNET, updated daily"
        backHref={base}
        accent={getModuleAccent("crops")}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>
        This page shows the latest agricultural mandi prices for this district, sourced daily from AGMARKNET
        (Agricultural Marketing Information Network), India&apos;s official government portal for regulated market
        prices. Prices can be viewed per Kg or per quintal. Data covers all commodities traded at APMC (Agricultural
        Produce Market Committee) mandis in the district.
      </ModuleSummary>

      <AIInsightCard module="crops" district={district} />

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && latestByCrop.length === 0 && (
        <NoDataCard module="crops" district={district} state={state} />
      )}

      {!isLoading && latestByCrop.length > 0 && (
        <>
          {/* Controls: unit and commodity. Chips are 44 px tall on phones. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <Chips
              label="Price unit"
              value={unit}
              onChange={(v) => setUnit(v as "kg" | "quintal")}
              items={[
                { value: "kg", label: "per Kg" },
                { value: "quintal", label: "per Quintal" },
              ]}
            />
            <Chips
              label="Commodity"
              value={activeKey ?? ""}
              onChange={(v) => setSelected(v)}
              items={latestByCrop.map((p) => ({ value: commodityKey(p.commodity), label: p.commodity }))}
            />
          </div>

          {/* Latest modal price per commodity, each with its market and date. */}
          <Section title="Latest price per commodity">
            <StatStrip cols={4}>
              {latestByCrop.map((p) => {
                const prev = previousOf(p);
                const change = prev ? p.modalPrice - prev.modalPrice : 0;
                const changeText = prev
                  ? change !== 0
                    ? ` · ${change > 0 ? "+" : "−"}₹${dp(Math.abs(change)).toLocaleString("en-IN")} vs ${shortDay(prev.date)}`
                    : ` · no change vs ${shortDay(prev.date)}`
                  : "";
                return (
                  <StatTile
                    key={p.id}
                    label={p.commodity}
                    value={`₹${dp(p.modalPrice).toLocaleString("en-IN")}`}
                    unit={unitLabel}
                    sub={`${p.market}${changeText}`}
                    trend={prev ? (change > 0 ? "up" : change < 0 ? "down" : "neutral") : undefined}
                    asOf={p.date}
                  />
                );
              })}
            </StatStrip>
          </Section>

          {/* Price trend for the selected commodity. */}
          {activeLatest && trend.length > 1 && (
            <Section title={`${activeLatest.commodity} price trend`}>
              <Card>
                <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "0 0 8px" }}>
                  {trend.every((p) => p.market === activeLatest.market) ? `${activeLatest.market} mandi` : "All mandis in the district"} · ₹{unitLabel}
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                    <XAxis dataKey="date" tickFormatter={shortDay} tick={CHART.tick} stroke={CHART.axis} />
                    <YAxis tick={CHART.tick} stroke={CHART.axis} width={52} tickFormatter={(v) => `₹${dp(Number(v))}`} />
                    <Tooltip
                      {...CHART_TOOLTIP}
                      formatter={(v, name) => [`₹${dp(Number(v)).toLocaleString("en-IN")}${unitLabel}`, name]}
                      labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN")}
                    />
                    <Line type="monotone" dataKey="modalPrice" stroke={CHART.primary} strokeWidth={2} dot={{ r: 2 }} name="Modal" />
                    <Line type="monotone" dataKey="minPrice" stroke={CHART.secondary} strokeWidth={1} dot={false} name="Min" />
                    <Line type="monotone" dataKey="maxPrice" stroke={CHART.tertiary} strokeWidth={1} dot={false} name="Max" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <ChartLegend
                  entries={[
                    { label: "Modal price", color: CHART.primary },
                    { label: "Min price", color: CHART.secondary },
                    { label: "Max price", color: CHART.tertiary, dashed: true },
                  ]}
                />
              </Card>
            </Section>
          )}

          {/* Every row we hold (newest 30), for people who want the detail. */}
          <Section title="All prices">
            <DataTable
              caption={`Mandi prices in ${district}, ₹${unitLabel}`}
              columns={[
                { key: "date", label: "Date" },
                { key: "commodity", label: "Commodity" },
                { key: "market", label: "Market" },
                { key: "min", label: `Min ₹${unitLabel}`, numeric: true },
                { key: "modal", label: `Modal ₹${unitLabel}`, numeric: true },
                { key: "max", label: `Max ₹${unitLabel}`, numeric: true },
              ]}
              rows={prices.slice(0, 30).map((p) => ({
                date: shortDay(p.date),
                commodity: p.commodity,
                market: p.market,
                min: dp(p.minPrice).toLocaleString("en-IN"),
                modal: dp(p.modalPrice).toLocaleString("en-IN"),
                max: dp(p.maxPrice).toLocaleString("en-IN"),
              }))}
            />
          </Section>
        </>
      )}

      <ModuleSources module="crops" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="crops" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="crops"
        moduleLabel="Crop Prices"
        shareText={shareText}
        onCsv={prices.length > 0 ? handleDownload : undefined}
        csvLabel="Download crop prices as CSV"
      />
    </ModulePage>
  );
}

export default function CropsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Crop Prices">
      <CropsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
