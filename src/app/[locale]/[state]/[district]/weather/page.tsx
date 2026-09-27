/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Weather & Rainfall — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useWeather() → up to 48 readings, newest first (recordedAt).
//        useRainfall() → monthly actual vs normal rainfall.
//
//  Honesty rules on this page:
//   • The header pill is fed by the newest reading's recordedAt. It is
//     green only when that reading is at most 6 hours old, and it says
//     "Live" only under 30 minutes (FreshnessPill handles both). Nothing
//     on this page hard-codes "Live".
//   • In the "Recent readings" table, rows older than 24 hours are greyed
//     and their time column reads "As of <date>".
"use client";

import { use, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Cloud } from "lucide-react";
import { useWeather, useRainfall } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  StatTile,
  StatStrip,
  DataTable,
  LoadingShell,
  FreshnessPill,
  AsOfText,
} from "@/components/district/ui";
import { isWithinMinutes } from "@/lib/utils/timeAgo";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar, ChartLegend, mutedIf } from "@/components/district/daily-services/ModuleShell";
import { CHART, CHART_TOOLTIP } from "@/components/district/daily-services/chart-tokens";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { downloadCSV, todayISO } from "@/lib/csv";

// A reading counts as "current" only when it was recorded in the last 6
// hours (audit 2026-09, finding 3.7). Older readings are labelled
// "Last recorded conditions" with an honest date.
const FRESH_HOURS = 6;
// Rows in the readings table older than this are greyed with "As of".
const STALE_ROW_MINUTES = 24 * 60;

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Show a number or an em dash when the source left it empty. */
function orDash(v: number | null | undefined): string {
  return v === null || v === undefined ? "—" : String(v);
}

function WeatherPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: weatherData, isLoading: wLoading } = useWeather(district, state);
  const { data: rainfallData, isLoading: rLoading } = useRainfall(district, state);

  const readings = useMemo(() => weatherData?.data ?? [], [weatherData]);
  const latest = readings[0];
  const isRecent = isWithinMinutes(latest?.recordedAt ?? null, FRESH_HOURS * 60);

  // Rainfall rows sorted newest month first (the API sorts months
  // ascending inside each year, so we re-sort here for display).
  const rainfallRows = useMemo(
    () => [...(rainfallData?.data ?? [])].sort((a, b) => b.year - a.year || b.month - a.month),
    [rainfallData],
  );
  const latestRain = rainfallRows[0];

  // Monthly rainfall chart data: the last 24 months, oldest → newest.
  const chartData = rainfallRows
    .slice(0, 24)
    .map((r) => ({
      label: `${MONTHS_SHORT[r.month - 1]} '${String(r.year).slice(2)}`,
      actual: r.rainfall,
      normal: r.normal,
      departure: r.departure,
    }))
    .reverse();

  function handleDownload() {
    const rows = rainfallRows.slice(0, 60).map((r) => ({
      Month: MONTHS_LONG[r.month - 1],
      Year: r.year,
      "Actual Rainfall (mm)": r.rainfall,
      "Normal Rainfall (mm)": r.normal,
      "Departure (mm)": r.departure,
    }));
    downloadCSV(rows, `forthepeople_${district}_rainfall_${todayISO()}.csv`);
  }

  const shareText = latest
    ? `${district} weather: ${latest.temperature}°C, ${latest.conditions}, humidity ${latest.humidity}%`
    : `Weather data for ${district}`;

  return (
    <ModulePage>
      <PageHeader
        icon={Cloud}
        title="Weather & Rainfall"
        description="Weather readings and historical monsoon data"
        backHref={base}
        accent={getModuleAccent("weather")}
        source={{ label: "IMD", href: "https://mausam.imd.gov.in" }}
        actions={<FreshnessPill asOf={latest?.recordedAt} thresholdHours={FRESH_HOURS} />}
      />

      {/* Plain-language summary — also what search engines and AI crawlers read. */}
      <ModuleSummary>
        This page shows weather readings and monthly rainfall history for this district, sourced from India
        Meteorological Department (IMD) and OpenWeatherMap. Temperature is in Celsius, rainfall in millimetres.
        Readings are updated when the source publishes; each one shows the time it was recorded.
      </ModuleSummary>

      <AIInsightCard module="weather" district={district} />

      {/* ── Current (or last recorded) conditions ── */}
      {wLoading && <LoadingShell rows={3} />}
      {!wLoading && !latest && <NoDataCard module="weather" district={district} state={state} />}
      {!wLoading && latest && (
        <Section
          title={isRecent ? "Current conditions" : "Last recorded conditions"}
          action={<AsOfText asOf={latest.recordedAt} prefix="Recorded" />}
        >
          <StatStrip cols={4}>
            <StatTile
              label="Temperature"
              value={orDash(latest.temperature)}
              unit="°C"
              sub={[
                latest.conditions ?? undefined,
                latest.feelsLike !== null && latest.feelsLike !== undefined ? `feels like ${latest.feelsLike}°C` : undefined,
              ].filter(Boolean).join(" · ") || undefined}
              asOf={latest.recordedAt}
            />
            <StatTile label="Humidity" value={orDash(latest.humidity)} unit="%" asOf={latest.recordedAt} />
            <StatTile
              label="Wind"
              value={orDash(latest.windSpeed)}
              unit="km/h"
              sub={latest.windDir ?? undefined}
              asOf={latest.recordedAt}
            />
            <StatTile label="Rainfall (day)" value={latest.rainfall ?? 0} unit="mm" asOf={latest.recordedAt} />
          </StatStrip>
        </Section>
      )}

      {/* ── Recent readings: rows older than 24 h are greyed with "As of" ── */}
      {!wLoading && readings.length > 1 && (
        <Section title="Recent readings">
          <DataTable
            dense
            caption={`Recent weather readings for ${district}`}
            columns={[
              { key: "time", label: "Recorded" },
              { key: "temp", label: "Temp °C", numeric: true },
              { key: "conditions", label: "Conditions" },
              { key: "humidity", label: "Humidity %", numeric: true },
              { key: "rain", label: "Rain mm", numeric: true },
            ]}
            rows={distinctReadings(readings).slice(0, 12).map((r) => {
              const stale = !isWithinMinutes(r.recordedAt, STALE_ROW_MINUTES);
              const muted = mutedIf(stale);
              return {
                // Date AND time on every row: readings arrive every few
                // minutes, so a date alone made rows look like duplicates.
                time: (
                  <span suppressHydrationWarning style={stale ? { ...muted, fontSize: 13 } : undefined}>
                    {new Date(r.recordedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                  </span>
                ),
                temp: <span style={muted}>{orDash(r.temperature)}</span>,
                conditions: <span style={muted}>{r.conditions ?? "—"}</span>,
                humidity: <span style={muted}>{orDash(r.humidity)}</span>,
                rain: <span style={muted}>{orDash(r.rainfall)}</span>,
              };
            })}
          />
        </Section>
      )}

      {/* ── Rainfall history ── */}
      {rLoading && <LoadingShell rows={3} />}
      {!rLoading && chartData.length > 0 && (
        <>
          <Section
            title="Monthly rainfall, actual vs normal"
            action={
              latestRain ? (
                <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                  Latest month: {MONTHS_SHORT[latestRain.month - 1]} {latestRain.year}
                </span>
              ) : undefined
            }
          >
            <Card>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="label" tick={CHART.tick} stroke={CHART.axis} angle={-45} textAnchor="end" interval={1} />
                  <YAxis tick={CHART.tick} stroke={CHART.axis} width={40} />
                  <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "var(--ftp-surface-2)" }} formatter={(v, name) => [`${Number(v)} mm`, name]} />
                  <Bar dataKey="actual" fill={CHART.primary} radius={[3, 3, 0, 0]} name="Actual" />
                  <Bar dataKey="normal" fill={CHART.tertiary} radius={[3, 3, 0, 0]} name="Normal" />
                </BarChart>
              </ResponsiveContainer>
              <ChartLegend
                entries={[
                  { label: "Actual (mm)", color: CHART.primary },
                  { label: "Normal (mm)", color: CHART.tertiary },
                ]}
              />
            </Card>
          </Section>

          <Section title="Departure from normal">
            <Card>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="label" tick={CHART.tick} stroke={CHART.axis} angle={-45} textAnchor="end" interval={1} />
                  <YAxis tick={CHART.tick} stroke={CHART.axis} width={40} />
                  <Tooltip {...CHART_TOOLTIP} cursor={{ fill: "var(--ftp-surface-2)" }} formatter={(v) => [`${Number(v)} mm`, "Departure"]} />
                  <ReferenceLine y={0} stroke={CHART.secondary} />
                  <Bar dataKey="departure" fill={CHART.secondary} radius={[3, 3, 0, 0]} name="Departure" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Section>

          <Section title="Rainfall history table">
            <DataTable
              caption={`Monthly rainfall for ${district}`}
              columns={[
                { key: "month", label: "Month" },
                { key: "year", label: "Year", mono: true },
                { key: "actual", label: "Actual (mm)", numeric: true },
                { key: "normal", label: "Normal (mm)", numeric: true },
                { key: "dep", label: "Departure", numeric: true },
              ]}
              rows={rainfallRows.slice(0, 30).map((r) => ({
                month: MONTHS_SHORT[r.month - 1],
                year: r.year,
                actual: r.rainfall.toFixed(1),
                normal: r.normal.toFixed(1),
                // Semantic colour as text only: surplus green, deficit red.
                dep: (
                  <span style={{ color: r.departure > 0 ? "var(--ftp-live-text)" : r.departure < 0 ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}>
                    {r.departure > 0 ? "+" : ""}
                    {r.departure.toFixed(1)}
                  </span>
                ),
              }))}
            />
          </Section>
        </>
      )}

      <ModuleSources module="weather" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="weather" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="weather"
        moduleLabel="Weather"
        shareText={shareText}
        onCsv={rainfallRows.length > 0 ? handleDownload : undefined}
        csvLabel="Download rainfall data as CSV"
      />
    </ModulePage>
  );
}

export default function WeatherPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Weather & Rainfall">
      <WeatherPageInner params={params} />
    </ModuleErrorBoundary>
  );
}

/**
 * The feed is polled every few minutes but the upstream observation changes
 * less often, so consecutive rows often repeat the same numbers. Keep only
 * the newest row of each run of identical readings (input is newest first).
 */
function distinctReadings<T extends { temperature?: number | null; humidity?: number | null; conditions?: string | null; rainfall?: number | null }>(
  rows: T[],
): T[] {
  const out: T[] = [];
  let prevKey: string | null = null;
  for (const r of rows) {
    const key = `${r.temperature}|${r.humidity}|${r.conditions}|${r.rainfall}`;
    if (key !== prevKey) out.push(r);
    prevKey = key;
  }
  return out;
}
