/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop Prices — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md §4)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useCropPrices() → up to 100 AGMARKNET rows, newest date first.
//  Page order: header → summary → AI insight → unit + commodity chips →
//  latest price per commodity (emoji StatTiles) → picture row (the chosen
//  crop's price in plain words + its cheapest-to-dearest bar, and how many
//  crops got dearer) → trend ChartCard → full table → sources → news →
//  CSV / Share / Compare.
//
//  Prices arrive in ₹ per quintal (100 kg). The Kg/Quintal chips only
//  change how we DISPLAY them (÷100 for kg); CSV exports stay per quintal.
"use client";

import { use, useMemo, useState } from "react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { cropEmoji, PriceRange } from "@/components/crops/CropVisuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";
import { downloadCSV, todayISO } from "@/lib/csv";

/** Commodity names sometimes differ only by case/spaces between mandis. */
function commodityKey(name: string): string {
  return name.trim().toLowerCase();
}

/** "12 Sep" — short date for axis ticks and table cells. */
function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/** "12 Sep 2026" — used where two years could meet (the chart's table view). */
function fullDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** Calendar day of a row, used to compare "same day" vs "earlier day". */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Dashed swatch for the "Highest" line in the chart legend. */
const DASHED_SWATCH = "repeating-linear-gradient(90deg, var(--hue-deep) 0 4px, transparent 4px 7px)";

function CropsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const { data, isLoading, error } = useCropPrices(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [unit, setUnit] = useState<"kg" | "quintal">("kg");

  // Display helper: ₹/quintal → ₹/kg when the Kg chip is on.
  const dp = (price: number) => Math.round(unit === "kg" ? price / 100 : price);
  const unitLabel = unit === "kg" ? "/kg" : "/q";
  const unitWords = unit === "kg" ? "a kg" : "a quintal";

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

  // For the picture: how many crops cost more than on their previous
  // market day (only crops that have an earlier price to compare with).
  const compared = latestByCrop.flatMap((p) => {
    const prev = previousOf(p);
    return prev ? [{ p, prev }] : [];
  });
  const rising = compared.filter(({ p, prev }) => p.modalPrice > prev.modalPrice).length;

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

  // Chart copy, computed from the same trend rows the chart draws.
  const trendOneMarket = activeLatest ? trend.every((p) => p.market === activeLatest.market) : false;
  const trendSimple = (() => {
    if (trend.length < 2) return null;
    const first = trend[0];
    const last = trend[trend.length - 1];
    const a = dp(first.modalPrice);
    const b = dp(last.modalPrice);
    if (a === b) {
      return (
        <>
          The typical price stayed at <strong>₹{b.toLocaleString("en-IN")}</strong> {unitWords} from {shortDay(first.date)} to{" "}
          {shortDay(last.date)}.
        </>
      );
    }
    return (
      <>
        From {shortDay(first.date)} to {shortDay(last.date)}, the typical price went {b > a ? "up" : "down"} from{" "}
        <strong>₹{a.toLocaleString("en-IN")}</strong> to <strong>₹{b.toLocaleString("en-IN")}</strong> {unitWords}.
      </>
    );
  })();

  const showRisingPicture = compared.length >= 2;
  const risingPicture = showRisingPicture
    ? compared.length <= 12
      ? { filled: rising, total: compared.length, label: `${rising} of ${compared.length} crops cost more than on their previous market day.` }
      : {
          filled: (rising / compared.length) * 10,
          total: 10,
          label: `About ${Math.round((rising / compared.length) * 10)} of every 10 crops cost more than on their previous market day.`,
        }
    : null;

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
        <div style={{ marginBottom: 20 }}>
          <EmptyState
            emoji="🧺"
            title={`No mandi prices for ${districtName} yet.`}
            body="Daily prices from AGMARKNET will show here once we start receiving them for the mandis in this district."
            action={
              <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
              </p>
            }
          />
        </div>
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
                { value: "kg", label: "Per kg" },
                { value: "quintal", label: "Per quintal" },
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
          <Section title="Latest price per commodity" emoji="🏷️">
            <StatStrip cols={4}>
              {latestByCrop.map((p) => {
                const prev = previousOf(p);
                const change = prev ? p.modalPrice - prev.modalPrice : 0;
                const shownChange = dp(Math.abs(change));
                const changeText = prev
                  ? change === 0
                    ? `, same as on ${shortDay(prev.date)}`
                    : shownChange === 0
                      ? `, about the same as on ${shortDay(prev.date)}`
                      : `, ₹${shownChange.toLocaleString("en-IN")} ${change > 0 ? "more" : "less"} than on ${shortDay(prev.date)}`
                  : "";
                return (
                  <StatTile
                    key={p.id}
                    emoji={cropEmoji(p.commodity)}
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

          {/* The picture: the chosen crop's price in one plain sentence and a
              cheapest → dearest bar, plus how many crops got dearer. Every
              number is from the rows above. */}
          {activeLatest && (
            <div className={showRisingPicture ? "ftp-picture-row" : undefined} style={{ marginTop: 20 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji={cropEmoji(activeLatest.commodity)}>
                  At <strong>{activeLatest.market}</strong> mandi on {shortDay(activeLatest.date)},{" "}
                  {unit === "kg" ? "1 kg" : "1 quintal (100 kg)"} of {activeLatest.commodity} sold for about{" "}
                  <strong>₹{dp(activeLatest.modalPrice).toLocaleString("en-IN")}</strong>. The cheapest lot went for ₹
                  {dp(activeLatest.minPrice).toLocaleString("en-IN")} and the dearest for ₹
                  {dp(activeLatest.maxPrice).toLocaleString("en-IN")}.
                </Explainer>
                <PriceRange
                  min={dp(activeLatest.minPrice)}
                  modal={dp(activeLatest.modalPrice)}
                  max={dp(activeLatest.maxPrice)}
                  unitLabel={unitLabel}
                  emoji={cropEmoji(activeLatest.commodity)}
                />
              </Card>
              {risingPicture && (
                <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                  <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
                    Prices that went up
                  </p>
                  <Pictogram filled={risingPicture.filled} total={risingPicture.total} emoji="📈" label={risingPicture.label} size={24} />
                </Card>
              )}
            </div>
          )}

          {/* Price trend for the selected commodity. */}
          {activeLatest && trend.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={`${activeLatest.commodity} price over time`}
                emoji="📈"
                units={`Rupees ${unit === "kg" ? "per kg" : "per quintal"}, ${trendOneMarket ? `${activeLatest.market} mandi` : "all mandis in the district"}`}
                simple={trendSimple}
                legend={[
                  { label: "Typical (modal) price", swatch: "var(--hue)" },
                  { label: "Lowest price", swatch: "var(--hue-pop)" },
                  { label: "Highest price", swatch: DASHED_SWATCH },
                ]}
                source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
                asOf={activeLatest.date}
                table={trend.map((p) => ({
                  label: trendOneMarket ? fullDay(p.date) : `${fullDay(p.date)}, ${p.market}`,
                  value: `₹${dp(p.modalPrice).toLocaleString("en-IN")} (₹${dp(p.minPrice).toLocaleString("en-IN")} to ₹${dp(p.maxPrice).toLocaleString("en-IN")})`,
                }))}
              >
                <ResponsiveContainer width="100%" height={230}>
                  <ComposedChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDay} tick={CHART_AXIS} stroke="var(--ftp-border)" />
                    <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={52} tickFormatter={(v) => `₹${dp(Number(v))}`} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      cursor={{ stroke: "var(--hue-pop)", strokeWidth: 1 }}
                      formatter={(v, name) => [`₹${dp(Number(v)).toLocaleString("en-IN")}${unitLabel}`, name]}
                      labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN")}
                    />
                    <Area
                      type="monotone"
                      dataKey="modalPrice"
                      stroke="var(--hue)"
                      strokeWidth={2.5}
                      fill="url(#ftpHueArea)"
                      dot={{ r: 2.5, fill: "var(--hue)", strokeWidth: 0 }}
                      name="Typical"
                    />
                    <Line type="monotone" dataKey="minPrice" stroke="var(--hue-pop)" strokeWidth={1.5} dot={false} name="Lowest" />
                    <Line type="monotone" dataKey="maxPrice" stroke="var(--hue-deep)" strokeWidth={1.5} dot={false} name="Highest" strokeDasharray="4 3" />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Every row we hold (newest 30), for people who want the detail. */}
          <Section title="All prices" emoji="📋">
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
