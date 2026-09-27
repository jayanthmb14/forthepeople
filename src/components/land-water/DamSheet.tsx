/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DamSheet — everything about one dam, one tap away
// ═══════════════════════════════════════════════════════════════════════
//    a big tank filled to the dam's level + the % and the storage
//    one plain sentence: how full, and whether it is filling or emptying
//    storage over time (every stored reading, ChartCard with table view)
//    detail rows: storage, level, inflow, outflow, river, reading time, source
//    footer: the state water portal
//  Storage figures are TMC ft (thousand million cubic feet), as the state
//  portal publishes them. Words come from "page_water".
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DamReading } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { CHART_AXIS, ChartCard, ChartGradients, WaterTank, chartTooltipStyle } from "@/components/district/visuals";
import { hueClass } from "@/lib/design/hues";
import { SheetAction, SheetBlock, SheetNote } from "./cards";
import { namePair } from "./visuals";

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Filling / emptying / steady from the latest inflow and outflow. */
export function flowState(d: Pick<DamReading, "inflow" | "outflow">): "filling" | "emptying" | "steady" {
  return d.inflow > d.outflow ? "filling" : d.inflow < d.outflow ? "emptying" : "steady";
}

export function DamSheet({
  dam,
  history,
  locale,
  river,
  portal,
  onClose,
}: {
  /** The dam's newest reading, or null when closed. */
  dam: DamReading | null;
  /** This dam's readings, oldest → newest. */
  history: DamReading[];
  locale: string;
  /** River name from the dam registry, when known. */
  river?: string | null;
  /** Where the reading comes from (state water portal), for the main action. */
  portal?: { name: string; href: string } | null;
  onClose: () => void;
}) {
  const t = useTranslations("page_water");
  const f = useFormat();
  if (!dam) return null;

  const n = namePair(dam.damName, dam.damNameLocal, locale);
  const pct = (v: number, digits = 0) => f.number(v / 100, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits });
  const tmc = (v: number) => f.number(v, { maximumFractionDigits: 2 });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const readingTime = (iso: string) =>
    new Date(iso).toLocaleString(f.intl, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const state = flowState(dam);
  const series = history.map((h) => ({ at: h.recordedAt, storage: h.storagePct }));

  const trendSimple = (() => {
    if (series.length < 2) return null;
    const a = Math.round(series[0].storage);
    const b = Math.round(series[series.length - 1].storage);
    const values = { b: bold, dam: n.primary, from: shortDay(series[0].at), to: shortDay(series[series.length - 1].at), start: pct(a), end: pct(b) };
    return a === b ? t.rich("trendSame", values) : t.rich("trendChange", values);
  })();

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={n.primary}
      titleLang={n.primaryLang}
      subtitle={
        n.secondary || river ? (
          <>
            {n.secondary && <span lang={n.secondaryLang}>{n.secondary}</span>}
            {n.secondary && river ? " · " : null}
            {river && t("river", { river })}
          </>
        ) : undefined
      }
      emoji="🏞️"
      hueClassName={hueClass("water")}
      footer={
        portal ? (
          <SheetAction href={portal.href} emoji="🔗" primary>
            {t("openPortal", { portal: portal.name })}
          </SheetAction>
        ) : undefined
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <WaterTank pct={dam.storagePct} label={t("tankOne")} width={128} height={160} />
        <div style={{ minWidth: 0, flex: "1 1 160px" }}>
          <div className="ftp-bignum" style={{ fontSize: 44, lineHeight: "48px", color: "var(--hue-deep)" }}>
            {pct(dam.storagePct, 1)}
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 14, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("fullOfCapacity")}</p>
          {dam.maxStorage > 0 && (
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)" }}>
              {t("storageOf", { stored: tmc(dam.storage), capacity: tmc(dam.maxStorage) })}
            </p>
          )}
        </div>
      </div>

      <SheetNote emoji={state === "filling" ? "📈" : state === "emptying" ? "📉" : "➖"}>
        {t.rich("sheetSentence", {
          b: bold,
          dam: n.primary,
          pct: pct(dam.storagePct),
          state,
          inflow: f.number(Math.round(dam.inflow)),
          outflow: f.number(Math.round(dam.outflow)),
        })}
      </SheetNote>

      {series.length > 1 && (
        <ChartCard
          title={t("trendTitle", { dam: n.primary })}
          emoji="📈"
          units={t("trendUnitsOne")}
          simple={trendSimple}
          source={{ label: dam.source }}
          asOf={dam.recordedAt}
          table={series.map((h) => ({ label: readingTime(h.at), value: pct(h.storage, 1) }))}
        >
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={series} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
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
      )}

      <SheetBlock emoji="📋" title={t("rowsTitle")}>
        <DetailList
          rows={[
            { emoji: "💧", label: t("rowFull"), value: pct(dam.storagePct, 1) },
            {
              emoji: "🛢️",
              label: t("rowStorage"),
              value: dam.maxStorage > 0 ? t("storageOf", { stored: tmc(dam.storage), capacity: tmc(dam.maxStorage) }) : null,
            },
            {
              emoji: "📏",
              label: t("rowLevel"),
              value:
                dam.waterLevel > 0
                  ? dam.maxLevel > 0
                    ? t("levelOf", { level: f.number(dam.waterLevel, { maximumFractionDigits: 1 }), max: f.number(dam.maxLevel, { maximumFractionDigits: 1 }) })
                    : t("levelFt", { level: f.number(dam.waterLevel, { maximumFractionDigits: 1 }) })
                  : null,
            },
            { emoji: "⬇️", label: t("rowInflow"), value: t("cusecs", { n: f.number(Math.round(dam.inflow)) }) },
            { emoji: "⬆️", label: t("rowOutflow"), value: t("cusecs", { n: f.number(Math.round(dam.outflow)) }) },
            { emoji: "🏞️", label: t("rowRiver"), value: river ?? null },
            { emoji: "📅", label: t("rowReading"), value: readingTime(dam.recordedAt) },
            { emoji: "📜", label: t("rowSource"), value: dam.source },
          ]}
        />
        <p style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
          {t("unitsHelp", { litres: f.number(2832) })}
        </p>
      </SheetBlock>
    </DetailSheet>
  );
}
