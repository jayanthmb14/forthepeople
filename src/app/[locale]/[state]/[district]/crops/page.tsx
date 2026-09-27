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
//  crops got dearer) → second picture row (which crops cost the most, and
//  the biggest price changes since the last market day) → trend ChartCard
//  → full table → sources → news → CSV / Share / Compare.
//
//  Prices arrive in ₹ per quintal (100 kg). The Kg/Quintal chips only
//  change how we DISPLAY them (÷100 for kg); CSV exports stay per quintal.
//
//  Every word comes from the "page_crops" messages
//  (src/dictionaries/<locale>/page_crops.json); numbers and dates go
//  through useFormat(). Commodity and market names are data and stay as
//  AGMARKNET publishes them.
"use client";

import { use, useMemo, useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wheat } from "lucide-react";
import { useCropPrices } from "@/hooks/useRealtimeData";
import type { CropPrice } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
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
import { cropEmoji, PriceMoves, PriceRange } from "@/components/crops/CropVisuals";
import type { PriceMove } from "@/components/crops/CropVisuals";
import { HueBarList, useDistrictName } from "@/components/land-water/visuals";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { downloadCSV, todayISO } from "@/lib/csv";

type Unit = "kg" | "quintal";

/** Commodity names sometimes differ only by case/spaces between mandis. */
function commodityKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Calendar day of a row, used to compare "same day" vs "earlier day". */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Dashed swatch for the "Highest" line in the chart legend. */
const DASHED_SWATCH = "repeating-linear-gradient(90deg, var(--hue-deep) 0 4px, transparent 4px 7px)";

/** How many crops the "which crops cost the most" bars show. */
const LADDER_MAX = 8;
/** How many crops the "biggest changes" bars show. */
const MOVES_MAX = 5;

function CropsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_crops");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useCropPrices(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>("kg");

  // Display helpers: ₹/quintal → ₹/kg when the Kg chip is on.
  const dp = (price: number) => Math.round(unit === "kg" ? price / 100 : price);
  const rupees = (n: number) => f.number(n, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  /** "₹42/kg" — a display-unit price with its unit. */
  const perUnit = (quintalPrice: number) => t("pricePer", { price: rupees(dp(quintalPrice)), unit });
  const unitShort = t("unitShort", { unit });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const fullDay = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });

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

  // For the pictures: every crop that has an earlier price at the same
  // market to compare with, and how many of them got dearer.
  const compared = latestByCrop.flatMap((p) => {
    const prev = previousOf(p);
    return prev ? [{ p, prev }] : [];
  });
  const rising = compared.filter(({ p, prev }) => p.modalPrice > prev.modalPrice).length;

  // Picture 2a: latest typical price per crop, dearest first.
  const ladder = [...latestByCrop].sort((a, b) => b.modalPrice - a.modalPrice);
  const newestDate = latestByCrop.reduce<string | null>((best, p) => (!best || p.date > best ? p.date : best), null);

  // Picture 2b: the biggest changes (in %) since each crop's previous
  // market day. Crops whose price did not change are left out.
  const moves: PriceMove[] = compared
    .filter(({ p, prev }) => prev.modalPrice > 0 && p.modalPrice !== prev.modalPrice)
    .map(({ p, prev }) => ({
      key: commodityKey(p.commodity),
      crop: p.commodity,
      emoji: cropEmoji(p.commodity),
      pct: ((p.modalPrice - prev.modalPrice) / prev.modalPrice) * 100,
      sub: t("movesSub", { from: perUnit(prev.modalPrice), to: perUnit(p.modalPrice), date: shortDay(prev.date) }),
    }))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, MOVES_MAX);
  const pctText = (pct: number) => f.number(Math.abs(pct) / 100, { style: "percent", maximumFractionDigits: 1 });

  function handleDownload() {
    const rows = prices.slice(0, 100).map((p) => ({
      [t("csvDate")]: dayOf(p.date),
      [t("csvCommodity")]: p.commodity,
      [t("csvMarket")]: p.market,
      [t("csvMin")]: p.minPrice,
      [t("csvModal")]: p.modalPrice,
      [t("csvMax")]: p.maxPrice,
    }));
    downloadCSV(rows, `forthepeople_${district}_crop-prices_${todayISO()}.csv`);
  }

  const shareText =
    latestByCrop.length > 0
      ? t("share", {
          district: districtName,
          list: new Intl.ListFormat(f.intl, { style: "short", type: "unit" }).format(
            latestByCrop.slice(0, 3).map((p) => t("shareItem", { crop: p.commodity, price: perUnit(p.modalPrice) })),
          ),
        })
      : t("shareEmpty", { district: districtName });

  // Chart copy, computed from the same trend rows the chart draws.
  const trendOneMarket = activeLatest ? trend.every((p) => p.market === activeLatest.market) : false;
  const trendSimple = (() => {
    if (trend.length < 2) return null;
    const first = trend[0];
    const last = trend[trend.length - 1];
    const a = dp(first.modalPrice);
    const b = dp(last.modalPrice);
    if (a === b) {
      return t.rich("trendSame", { b: bold, price: rupees(b), unit, from: shortDay(first.date), to: shortDay(last.date) });
    }
    return t.rich("trendChange", {
      b: bold,
      from: shortDay(first.date),
      to: shortDay(last.date),
      dir: b > a ? "up" : "down",
      oldPrice: rupees(a),
      newPrice: rupees(b),
      unit,
    });
  })();

  const showRisingPicture = compared.length >= 2;
  const risingPicture = showRisingPicture
    ? compared.length <= 12
      ? { filled: rising, total: compared.length, label: t("risingCount", { rising, total: compared.length }) }
      : {
          filled: (rising / compared.length) * 10,
          total: 10,
          label: t("risingAbout", { n: Math.round((rising / compared.length) * 10) }),
        }
    : null;

  const showLadder = ladder.length >= 3;
  const showMoves = moves.length >= 2;

  return (
    <ModulePage>
      <PageHeader
        icon={Wheat}
        title={mt.label("crops")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("crops")}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>{t("summary")}</ModuleSummary>

      <AIInsightCard module="crops" district={district} />

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && latestByCrop.length === 0 && (
        <div style={{ marginBottom: 20 }}>
          <EmptyState emoji="🧺" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
        </div>
      )}

      {!isLoading && latestByCrop.length > 0 && (
        <>
          {/* Controls: unit and commodity. Chips are 44 px tall on phones. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <Chips
              label={t("unitGroup")}
              value={unit}
              onChange={(v) => setUnit(v as Unit)}
              items={[
                { value: "kg", label: t("perKg") },
                { value: "quintal", label: t("perQuintal") },
              ]}
            />
            <Chips
              label={t("commodityGroup")}
              value={activeKey ?? ""}
              onChange={(v) => setSelected(v)}
              items={latestByCrop.map((p) => ({ value: commodityKey(p.commodity), label: `${cropEmoji(p.commodity)} ${p.commodity}` }))}
            />
          </div>

          {/* Latest modal price per commodity, each with its market and date. */}
          <Section title={t("latestTitle")} emoji="🏷️">
            <StatStrip cols={4}>
              {latestByCrop.map((p) => {
                const prev = previousOf(p);
                const change = prev ? p.modalPrice - prev.modalPrice : 0;
                const shownChange = dp(Math.abs(change));
                const sub = !prev
                  ? p.market
                  : change === 0
                    ? t("tileSame", { market: p.market, date: shortDay(prev.date) })
                    : shownChange === 0
                      ? t("tileAbout", { market: p.market, date: shortDay(prev.date) })
                      : t(change > 0 ? "tileMore" : "tileLess", { market: p.market, amount: rupees(shownChange), date: shortDay(prev.date) });
                return (
                  <StatTile
                    key={p.id}
                    emoji={cropEmoji(p.commodity)}
                    label={p.commodity}
                    value={rupees(dp(p.modalPrice))}
                    unit={unitShort}
                    sub={sub}
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
                <Explainer emoji={cropEmoji(activeLatest.commodity)}>
                  {t.rich("explainer", {
                    b: bold,
                    market: activeLatest.market,
                    date: shortDay(activeLatest.date),
                    unit,
                    crop: activeLatest.commodity,
                    modal: rupees(dp(activeLatest.modalPrice)),
                    min: rupees(dp(activeLatest.minPrice)),
                    max: rupees(dp(activeLatest.maxPrice)),
                  })}
                </Explainer>
                <PriceRange
                  min={dp(activeLatest.minPrice)}
                  modal={dp(activeLatest.modalPrice)}
                  max={dp(activeLatest.maxPrice)}
                  unit={unit}
                  emoji={cropEmoji(activeLatest.commodity)}
                />
              </Card>
              {risingPicture && (
                <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                  <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 600, color: "var(--ftp-text)" }}>
                    {t("risingTitle")}
                  </p>
                  <Pictogram filled={risingPicture.filled} total={risingPicture.total} emoji="📈" label={risingPicture.label} size={24} />
                </Card>
              )}
            </div>
          )}

          {/* Second picture row: which crops cost the most right now (tap a
              bar to follow that crop), and which prices moved the most since
              their previous market day. */}
          {(showLadder || showMoves) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: 12,
                marginTop: 20,
              }}
            >
              {showLadder && (
                <ChartCard
                  title={t("ladderTitle")}
                  emoji="🏆"
                  units={t("ladderUnits", { unit })}
                  simple={t.rich("ladderSimple", {
                    b: bold,
                    top: ladder[0].commodity,
                    topPrice: perUnit(ladder[0].modalPrice),
                    bottom: ladder[ladder.length - 1].commodity,
                    bottomPrice: perUnit(ladder[ladder.length - 1].modalPrice),
                  })}
                  source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
                  asOf={newestDate}
                  table={ladder.map((p) => ({
                    label: p.commodity,
                    value: t("ladderRow", { price: perUnit(p.modalPrice), market: p.market, date: fullDay(p.date) }),
                  }))}
                >
                  <div style={{ marginTop: 12 }}>
                    <HueBarList
                      rows={ladder.slice(0, LADDER_MAX).map((p) => ({
                        key: commodityKey(p.commodity),
                        label: p.commodity,
                        emoji: cropEmoji(p.commodity),
                        value: p.modalPrice,
                        display: perUnit(p.modalPrice),
                        sub: t("ladderSub", { market: p.market, date: shortDay(p.date) }),
                      }))}
                      selectedKey={activeKey}
                      onSelect={(k) => setSelected(k)}
                      selectAria={(row) => t("ladderPick", { crop: row.label })}
                    />
                    {ladder.length > LADDER_MAX && (
                      <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                        {t("ladderMore", { shown: LADDER_MAX, total: ladder.length })}
                      </p>
                    )}
                  </div>
                </ChartCard>
              )}
              {showMoves && (
                <ChartCard
                  title={t("movesTitle")}
                  emoji="↕️"
                  units={t("movesUnits")}
                  simple={t.rich("movesSimple", {
                    b: bold,
                    crop: moves[0].crop,
                    dir: moves[0].pct > 0 ? "up" : "down",
                    pct: pctText(moves[0].pct),
                  })}
                  source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
                  asOf={newestDate}
                  table={moves.map((m) => ({
                    label: m.crop,
                    value: t("movesRow", { dir: m.pct > 0 ? "up" : "down", pct: pctText(m.pct), detail: m.sub }),
                  }))}
                >
                  <div style={{ marginTop: 14 }}>
                    <PriceMoves moves={moves} />
                  </div>
                </ChartCard>
              )}
            </div>
          )}

          {/* Price trend for the selected commodity. */}
          {activeLatest && trend.length > 1 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("trendTitle", { crop: activeLatest.commodity })}
                emoji="📈"
                units={trendOneMarket ? t("trendUnitsOne", { unit, market: activeLatest.market }) : t("trendUnitsAll", { unit })}
                simple={trendSimple}
                legend={[
                  { label: t("legendTypical"), swatch: "var(--hue)" },
                  { label: t("legendLowest"), swatch: "var(--hue-pop)" },
                  { label: t("legendHighest"), swatch: DASHED_SWATCH },
                ]}
                source={{ label: "AGMARKNET", href: "https://agmarknet.gov.in" }}
                asOf={activeLatest.date}
                table={trend.map((p) => ({
                  label: trendOneMarket ? fullDay(p.date) : t("trendRowLabel", { date: fullDay(p.date), market: p.market }),
                  value: t("trendRowValue", { modal: rupees(dp(p.modalPrice)), min: rupees(dp(p.minPrice)), max: rupees(dp(p.maxPrice)) }),
                }))}
              >
                <div dir="ltr">
                  <ResponsiveContainer width="100%" height={230}>
                    <ComposedChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={shortDay} tick={CHART_AXIS} stroke="var(--ftp-border)" />
                      <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={56} tickFormatter={(v) => rupees(dp(Number(v)))} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ stroke: "var(--hue-pop)", strokeWidth: 1 }}
                        formatter={(v, name) => [perUnit(Number(v)), name]}
                        labelFormatter={(d) => fullDay(String(d))}
                      />
                      <Area
                        type="monotone"
                        dataKey="modalPrice"
                        stroke="var(--hue)"
                        strokeWidth={2.5}
                        fill="url(#ftpHueArea)"
                        dot={{ r: 2.5, fill: "var(--hue)", strokeWidth: 0 }}
                        name={t("seriesTypical")}
                      />
                      <Line type="monotone" dataKey="minPrice" stroke="var(--hue-pop)" strokeWidth={1.5} dot={false} name={t("seriesLowest")} />
                      <Line
                        type="monotone"
                        dataKey="maxPrice"
                        stroke="var(--hue-deep)"
                        strokeWidth={1.5}
                        dot={false}
                        name={t("seriesHighest")}
                        strokeDasharray="4 3"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Every row we hold (newest 30), for people who want the detail. */}
          <Section title={t("allTitle")} emoji="📋">
            <DataTable
              caption={t("tableCaption", { district: districtName, unit })}
              columns={[
                { key: "date", label: t("colDate") },
                { key: "commodity", label: t("colCommodity") },
                { key: "market", label: t("colMarket") },
                { key: "min", label: t("colMin", { unit }), numeric: true },
                { key: "modal", label: t("colModal", { unit }), numeric: true },
                { key: "max", label: t("colMax", { unit }), numeric: true },
              ]}
              rows={prices.slice(0, 30).map((p) => ({
                date: shortDay(p.date),
                commodity: (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="ftp-emoji" aria-hidden>
                      {cropEmoji(p.commodity)}
                    </span>
                    {p.commodity}
                  </span>
                ),
                market: p.market,
                min: f.number(dp(p.minPrice)),
                modal: f.number(dp(p.modalPrice)),
                max: f.number(dp(p.maxPrice)),
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
        moduleLabel={mt.label("crops")}
        shareText={shareText}
        onCsv={prices.length > 0 ? handleDownload : undefined}
        csvLabel={t("csvLabel")}
      />
    </ModulePage>
  );
}

export default function CropsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("crops")}>
      <CropsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
