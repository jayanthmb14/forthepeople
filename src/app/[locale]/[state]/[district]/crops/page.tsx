/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Crop prices — layout v4.1 (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "What will my crop fetch?"
//  The answer, in one line: "The latest prices are from 26 Sep: 14 crops
//  at 3 mandis in Mandya." Then tap any crop to see everything about it.
//
//    PageHeader → Explainer (the answer) → 4 StatTiles → picture: how
//    many crops went up / stayed / went down since their last market day
//    → one price card per crop (tap → CropSheet: price, week-ago
//    comparison, trend, each mandi, detail rows) → AI insight → charts
//    (which crops cost the most · biggest changes) → news → footer.
//
//  Data: useCropPrices() → the newest ≤ 100 AGMARKNET rows (the collector
//  keeps only 100 per district). Prices arrive in ₹ per quintal (100 kg);
//  the Kg / Quintal chips only change how they are SHOWN (÷100 for kg).
//  Every word comes from "page_crops"; numbers and dates go through
//  useFormat(). Commodity and mandi names stay as AGMARKNET publishes them.
"use client";

import { use, useMemo, useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { Search, Wheat } from "lucide-react";
import { useCropPrices } from "@/hooks/useRealtimeData";
import type { CropPrice } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { cropEmoji, PriceMoves } from "@/components/crops/CropVisuals";
import type { PriceMove } from "@/components/crops/CropVisuals";
import { HueBarList, useDistrictName } from "@/components/land-water/visuals";
import { fitGrid, Chip, EmojiTile, Sparkline, SplitBar, TapCard, TapHint } from "@/components/land-water/cards";
import { CropSheet } from "@/components/land-water/CropSheet";
import { LandWaterFooter } from "@/components/land-water/PageFooter";
import { commodityKey, dailySeries, dayOf, latestPerCrop, latestPerMarket, previousDay } from "@/components/land-water/crop-data";
import { downloadCSV, todayISO } from "@/lib/csv";

type Unit = "kg" | "quintal";

const AGMARKNET = { label: "AGMARKNET", href: "https://agmarknet.gov.in" };

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** How many crops the "which crops cost the most" bars show. */
const LADDER_MAX = 8;
/** How many crops the "biggest changes" bars show. */
const MOVES_MAX = 5;
/** Show the crop search box when there are more cards than this. */
const SEARCH_FROM = 12;

function CropsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_crops");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useCropPrices(district, state);
  const [unit, setUnit] = useState<Unit>("kg");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Display helpers: ₹/quintal → ₹/kg when the Kg chip is on.
  const dp = (price: number) => Math.round(unit === "kg" ? price / 100 : price);
  const rupees = (n: number) => f.number(n, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  /** "₹42/kg" — a display-unit price with its unit. */
  const perUnit = (quintalPrice: number) => t("pricePer", { price: rupees(dp(quintalPrice)), unit });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const fullDay = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const pctText = (pct: number) => f.number(Math.abs(pct) / 100, { style: "percent", maximumFractionDigits: 1 });

  const prices = useMemo(() => data?.data ?? [], [data]);
  const latestByCrop = useMemo(() => latestPerCrop(prices), [prices]);
  const openCrop = openKey ? latestByCrop.find((p) => commodityKey(p.commodity) === openKey) ?? null : null;

  // Each crop's newest price next to its price on the market day before
  // (same mandi). Crops with only one day have nothing to compare.
  const compared = latestByCrop.flatMap((p) => {
    const prev = previousDay(prices, p);
    return prev ? [{ p, prev }] : [];
  });
  const up = compared.filter(({ p, prev }) => p.modalPrice > prev.modalPrice).length;
  const down = compared.filter(({ p, prev }) => p.modalPrice < prev.modalPrice).length;
  const same = compared.length - up - down;

  const markets = new Set(prices.map((p) => p.market)).size;
  const newestDate = latestByCrop.reduce<string | null>((best, p) => (!best || p.date > best ? p.date : best), null);
  const cropsOnNewest = newestDate ? latestByCrop.filter((p) => dayOf(p.date) === dayOf(newestDate)).length : 0;
  const marketsOnNewest = newestDate ? new Set(prices.filter((p) => dayOf(p.date) === dayOf(newestDate)).map((p) => p.market)).size : 0;

  // Chart: latest typical price per crop, dearest first.
  const ladder = [...latestByCrop].sort((a, b) => b.modalPrice - a.modalPrice);
  // Chart: the biggest changes (in %) since each crop's previous market day.
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
  const showLadder = ladder.length >= 3;
  const showMoves = moves.length >= 2;

  const q = search.trim().toLowerCase();
  const shownCrops = q ? latestByCrop.filter((p) => p.commodity.toLowerCase().includes(q)) : latestByCrop;

  function handleDownload() {
    const rows = prices.map((p) => ({
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

  const hasData = !isLoading && !error && latestByCrop.length > 0;

  return (
    <ModulePage>
      <PageHeader
        icon={Wheat}
        title={mt.label("crops")}
        description={t("description")}
        backHref={base}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={AGMARKNET}
      />

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && latestByCrop.length === 0 && (
        <EmptyState emoji="🧺" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} />
      )}

      {hasData && newestDate && (
        <>
          {/* 1 · The answer in plain words. */}
          <Explainer emoji="🌾">
            {t.rich("answer", {
              b: bold,
              date: fullDay(newestDate),
              n: cropsOnNewest,
              markets: marketsOnNewest,
              district: districtName,
            })}{" "}
            {t("tapHint")}
          </Explainer>

          {/* 2 · The big numbers. */}
          <StatStrip cols={4}>
            <StatTile emoji="🧺" label={t("tileCrops")} value={f.number(latestByCrop.length)} asOf={newestDate} />
            <StatTile emoji="🏪" label={t("tileMarkets")} value={f.number(markets)} sub={t("tileMarketsSub")} />
            {compared.length > 0 ? (
              <StatTile emoji="📈" label={t("tileUp")} value={f.number(up)} sub={t("tileMovesSub", { n: compared.length })} />
            ) : (
              <StatTile emoji="📅" label={t("tileLatest")} value={shortDay(newestDate)} countUp={false} />
            )}
            {compared.length > 0 && (
              <StatTile emoji="📉" label={t("tileDown")} value={f.number(down)} sub={t("tileMovesSub", { n: compared.length })} />
            )}
          </StatStrip>

          {/* 3 · The picture: up / same / down since the last market day. */}
          {compared.length >= 2 && (
            <Card tinted padding={18} style={{ marginTop: 16, ...fitGrid(300, { alignItems: "center", gap: 18 }) }}>
              <div>
                <p className="ftp-display" style={{ margin: "0 0 4px", fontSize: 19, lineHeight: "24px", fontWeight: 650 }}>
                  {t("pictureTitle")}
                </p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("pictureSub")}</p>
              </div>
              <SplitBar
                ariaLabel={t("splitAria", { total: compared.length, up, same, down })}
                parts={[
                  { key: "up", emoji: "📈", label: t("splitUp"), value: up, fill: "linear-gradient(90deg, var(--hue), var(--hue-deep))" },
                  { key: "same", emoji: "➖", label: t("splitSame"), value: same, fill: "var(--hue-pop)", ink: "var(--hue-deep)" },
                  {
                    key: "down",
                    emoji: "📉",
                    label: t("splitDown"),
                    value: down,
                    fill: "color-mix(in srgb, var(--hue-pop) 45%, var(--ftp-surface))",
                    ink: "var(--hue-deep)",
                  },
                ]}
              />
            </Card>
          )}

          {/* 4 · One card per crop. Tap → everything about it. */}
          <Section
            title={t("latestTitle")}
            emoji="🏷️"
            action={
              <Chips
                label={t("unitGroup")}
                value={unit}
                onChange={(v) => setUnit(v as Unit)}
                items={[
                  { value: "kg", label: t("perKg") },
                  { value: "quintal", label: t("perQuintal") },
                ]}
              />
            }
          >
            {latestByCrop.length > SEARCH_FROM && (
              <label style={{ position: "relative", display: "block", marginBottom: 14, maxWidth: 420 }}>
                <span className="sr-only">{t("searchLabel")}</span>
                <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 12, top: 14, color: "var(--hue)" }} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    paddingBlock: 0,
                    paddingInline: "36px 14px",
                    borderRadius: 12,
                    border: "1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border))",
                    fontSize: 15,
                    fontFamily: "var(--ftp-font-sans)",
                    background: "var(--ftp-surface)",
                    color: "var(--ftp-text)",
                    boxSizing: "border-box",
                  }}
                />
              </label>
            )}
            {shownCrops.length === 0 && <EmptyState emoji="🔍" title={t("noMatch", { q: search })} />}
            <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "260px" }}>
              {shownCrops.map((p) => (
                <li key={p.id}>
                  <PriceCard
                    row={p}
                    prices={prices}
                    unit={unit}
                    onOpen={() => setOpenKey(commodityKey(p.commodity))}
                    fmt={{ rupees, dp, perUnit, shortDay }}
                  />
                </li>
              ))}
            </ul>
          </Section>

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="crops" district={district} />
          </div>

          {/* 5 · Charts, each with its one-line takeaway. */}
          {(showLadder || showMoves) && (
            <div style={fitGrid(340, { marginTop: 8 })}>
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
                  source={AGMARKNET}
                  asOf={newestDate}
                  table={ladder.map((p) => ({
                    label: p.commodity,
                    value: t("ladderRow", { price: perUnit(p.modalPrice), market: p.market, date: fullDay(p.date) }),
                  }))}
                >
                  <HueBarList
                    rows={ladder.slice(0, LADDER_MAX).map((p) => ({
                      key: commodityKey(p.commodity),
                      label: p.commodity,
                      emoji: cropEmoji(p.commodity),
                      value: p.modalPrice,
                      display: perUnit(p.modalPrice),
                      sub: t("ladderSub", { market: p.market, date: shortDay(p.date) }),
                    }))}
                    onSelect={(k) => setOpenKey(k)}
                    selectAria={(row) => t("ladderPick", { crop: row.label })}
                  />
                  {ladder.length > LADDER_MAX && (
                    <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                      {t("ladderMore", { shown: LADDER_MAX, total: ladder.length })}
                    </p>
                  )}
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
                  source={AGMARKNET}
                  asOf={newestDate}
                  table={moves.map((m) => ({
                    label: m.crop,
                    value: t("movesRow", { dir: m.pct > 0 ? "up" : "down", pct: pctText(m.pct), detail: m.sub }),
                  }))}
                >
                  <PriceMoves moves={moves} />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="crops" />

      <LandWaterFooter
        ns="page_crops"
        about={t("summary")}
        sources={[{ name: t("sourceName"), url: AGMARKNET.href, frequency: t("footer.frequency") }]}
        locale={locale}
        district={district}
        moduleSlug="crops"
        shareText={shareText}
        onCsv={prices.length > 0 ? handleDownload : undefined}
      />

      <CropSheet crop={openCrop} prices={prices} unit={unit} onClose={() => setOpenKey(null)} />
    </ModulePage>
  );
}

/**
 * One crop's price card: emoji, name, the typical price big, the day's
 * low–high, mandi and date, the change since the market day before, and a
 * small line of recent prices. A tap anywhere on the card opens the
 * crop's sheet.
 */
function PriceCard({
  row,
  prices,
  unit,
  onOpen,
  fmt,
}: {
  row: CropPrice;
  prices: CropPrice[];
  unit: Unit;
  onOpen: () => void;
  fmt: {
    rupees: (n: number) => string;
    dp: (q: number) => number;
    perUnit: (q: number) => string;
    shortDay: (iso: string) => string;
  };
}) {
  const t = useTranslations("page_crops");
  const prev = previousDay(prices, row);
  const change = prev ? row.modalPrice - prev.modalPrice : 0;
  const shownChange = fmt.dp(Math.abs(change));
  const otherMarkets = latestPerMarket(prices, commodityKey(row.commodity)).length - 1;
  const { rows: series } = dailySeries(prices, row);
  return (
    <TapCard onClick={onOpen} label={t("detailsFor", { name: row.commodity })}>
      <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <EmojiTile emoji={cropEmoji(row.commodity)} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, overflowWrap: "anywhere" }}>
            {row.commodity}
          </h3>
          <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", overflowWrap: "anywhere" }}>
            {t("cardMarket", { market: row.market, date: fmt.shortDay(row.date) })}
          </span>
        </span>
      </span>

      <span style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
            <span className="ftp-bignum" style={{ fontSize: 30, lineHeight: "34px", color: "var(--hue-deep)" }}>
              {fmt.rupees(fmt.dp(row.modalPrice))}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ftp-text-2)" }}>{t("unitShort", { unit })}</span>
          </span>
          <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
            {t("cardRange", { min: fmt.rupees(fmt.dp(row.minPrice)), max: fmt.rupees(fmt.dp(row.maxPrice)) })}
          </span>
        </span>
        <Sparkline values={series.map((s) => s.modalPrice)} width={88} height={32} />
      </span>

      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {prev && (
          <Chip tone={change > 0 && shownChange > 0 ? "hue" : "quiet"}>
            <span aria-hidden>{change > 0 && shownChange > 0 ? "▲" : change < 0 && shownChange > 0 ? "▼" : "="}</span>
            {shownChange === 0
              ? t("cardSame", { date: fmt.shortDay(prev.date) })
              : t(change > 0 ? "cardMore" : "cardLess", { amount: fmt.rupees(shownChange), date: fmt.shortDay(prev.date) })}
          </Chip>
        )}
        {otherMarkets > 0 && <Chip tone="quiet">{t("moreMarkets", { n: otherMarkets })}</Chip>}
      </span>

      <TapHint>{t("details")}</TapHint>
    </TapCard>
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
