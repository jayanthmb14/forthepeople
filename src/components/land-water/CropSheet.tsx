/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  CropSheet — everything about one crop, one tap away
// ═══════════════════════════════════════════════════════════════════════
//  Opened from a price card (or a bar in "Which crops cost the most").
//  Top to bottom:
//    big typical price (per kg and per quintal) + cheapest → dearest bar
//    one plain sentence comparing with about a week ago at the same mandi
//      (falls back to the market day before; never advice on selling)
//    price over time (ChartCard with a table view)
//    price at each mandi
//    the detail rows (lowest / typical / highest, mandi, date, variety, source)
//    footer: check on AGMARKNET
//  Words come from "page_crops"; numbers and dates from useFormat().
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CropPrice } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { CHART_AXIS, ChartCard, ChartGradients, chartTooltipStyle } from "@/components/district/visuals";
import { PriceRange, cropEmoji } from "@/components/crops/CropVisuals";
import { hueClass } from "@/lib/design/hues";
import { SheetAction, SheetBlock, SheetNote } from "./cards";
import { dailySeries, latestPerMarket, commodityKey, previousDay, weekBefore } from "./crop-data";

const AGMARKNET = "https://agmarknet.gov.in";
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

export function CropSheet({
  crop,
  prices,
  unit,
  onClose,
}: {
  /** The crop's newest row, or null when the sheet is closed. */
  crop: CropPrice | null;
  prices: CropPrice[];
  unit: "kg" | "quintal";
  onClose: () => void;
}) {
  const t = useTranslations("page_crops");
  const f = useFormat();
  if (!crop) return null;

  const dp = (q: number) => Math.round(unit === "kg" ? q / 100 : q);
  const rupees = (n: number) => f.number(n, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const perUnit = (q: number) => t("pricePer", { price: rupees(dp(q)), unit });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const fullDay = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const pctText = (from: number, to: number) =>
    f.number(Math.abs(to - from) / from, { style: "percent", maximumFractionDigits: 1 });
  const emoji = cropEmoji(crop.commodity);

  // ── Compared with about a week ago (same mandi) ──
  const week = weekBefore(prices, crop);
  const prev = week ? undefined : previousDay(prices, crop);
  const compare = (() => {
    const base = week ?? prev;
    if (!base || base.modalPrice <= 0) return t("noCompare", { crop: crop.commodity, market: crop.market });
    const diff = dp(Math.abs(crop.modalPrice - base.modalPrice));
    if (diff === 0) {
      return t.rich(week ? "weekSame" : "prevSame", { b: bold, date: shortDay(base.date), price: perUnit(crop.modalPrice) });
    }
    return t.rich(week ? "weekChange" : "prevChange", {
      b: bold,
      date: shortDay(base.date),
      old: perUnit(base.modalPrice),
      diff: t("pricePer", { price: rupees(diff), unit }),
      dir: crop.modalPrice > base.modalPrice ? "up" : "down",
      pct: pctText(base.modalPrice, crop.modalPrice),
    });
  })();

  // ── Price over time ──
  const { rows: series, oneMarket } = dailySeries(prices, crop);
  const trendSimple = (() => {
    if (series.length < 2) return null;
    const first = series[0];
    const last = series[series.length - 1];
    const a = dp(first.modalPrice);
    const b = dp(last.modalPrice);
    if (a === b) return t.rich("trendSame", { b: bold, price: rupees(b), unit, from: shortDay(first.date), to: shortDay(last.date) });
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

  // ── Each mandi ──
  const markets = latestPerMarket(prices, commodityKey(crop.commodity));

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={crop.commodity}
      subtitle={t("sheetSub", { market: crop.market, date: fullDay(crop.date) })}
      emoji={emoji}
      hueClassName={hueClass("crops")}
      footer={
        <SheetAction href={AGMARKNET} emoji="🔗" primary>
          {t("openAgmarknet")}
        </SheetAction>
      }
    >
      {/* The price, big, in both units. */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span className="ftp-bignum" style={{ fontSize: 40, lineHeight: "44px", color: "var(--hue-deep)" }}>
            {rupees(dp(crop.modalPrice))}
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ftp-text-2)" }}>{t("unitShort", { unit })}</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          {t("bothUnits", {
            kg: rupees(Math.round(crop.modalPrice / 100)),
            q: rupees(Math.round(crop.modalPrice)),
          })}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("modalHelp")}</p>
      </div>

      <SheetBlock emoji="↔️" title={t("rangeTitle")}>
        <PriceRange min={dp(crop.minPrice)} modal={dp(crop.modalPrice)} max={dp(crop.maxPrice)} unit={unit} emoji={emoji} />
      </SheetBlock>

      <SheetBlock emoji="🗓️" title={t("weekTitle")}>
        <SheetNote emoji={week || prev ? "⚖️" : "🌱"}>{compare}</SheetNote>
      </SheetBlock>

      {series.length > 1 && (
        <ChartCard
          title={t("trendTitle", { crop: crop.commodity })}
          emoji="📈"
          units={oneMarket ? t("trendUnitsOne", { unit, market: crop.market }) : t("trendUnitsAll", { unit })}
          simple={trendSimple}
          source={{ label: "AGMARKNET", href: AGMARKNET }}
          asOf={crop.date}
          table={series.map((p) => ({
            label: oneMarket ? fullDay(p.date) : t("trendRowLabel", { date: fullDay(p.date), market: p.market }),
            value: t("trendRowValue", { modal: rupees(dp(p.modalPrice)), min: rupees(dp(p.minPrice)), max: rupees(dp(p.maxPrice)) }),
          }))}
        >
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={series} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => shortDay(String(d))} tick={CHART_AXIS} stroke="var(--ftp-border)" minTickGap={20} />
                <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={52} tickFormatter={(v) => rupees(dp(Number(v)))} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ stroke: "var(--hue-pop)", strokeWidth: 1 }}
                  formatter={(v) => [perUnit(Number(v)), t("seriesTypical")]}
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {markets.length > 1 && (
        <SheetBlock emoji="🏪" title={t("marketsTitle", { n: markets.length })}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {markets.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--ftp-border)",
                  background: m.market === crop.market ? "var(--hue-tint)" : "var(--ftp-surface)",
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, overflowWrap: "anywhere" }}>{m.market}</span>
                  <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                    {shortDay(m.date)} · {t("cardRange", { min: rupees(dp(m.minPrice)), max: rupees(dp(m.maxPrice)) })}
                  </span>
                </span>
                <span className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
                  {perUnit(m.modalPrice)}
                </span>
              </li>
            ))}
          </ul>
        </SheetBlock>
      )}

      <SheetBlock emoji="📋" title={t("rowsTitle")}>
        <DetailList
          rows={[
            { emoji: "🏷️", label: t("rowTypical"), value: perUnit(crop.modalPrice) },
            { emoji: "⬇️", label: t("rowLowest"), value: perUnit(crop.minPrice) },
            { emoji: "⬆️", label: t("rowHighest"), value: perUnit(crop.maxPrice) },
            { emoji: "🏪", label: t("rowMarket"), value: crop.market },
            { emoji: "📅", label: t("rowDate"), value: fullDay(crop.date) },
            { emoji: "🌱", label: t("rowVariety"), value: crop.variety && crop.variety !== "Other" ? crop.variety : null },
            { emoji: "📜", label: t("rowSource"), value: crop.source },
          ]}
        />
      </SheetBlock>
    </DetailSheet>
  );
}
