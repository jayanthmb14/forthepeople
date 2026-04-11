/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Cloud, Download } from "lucide-react";
import { useWeather, useRainfall } from "@/hooks/useRealtimeData";
import {
  ModuleHeader,
  SectionLabel,
  LoadingShell,
  LiveBadge,
  DataTable,
  LastUpdatedBadge,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";
import ShareButtons from "@/components/common/ShareButtons";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { downloadCSV, todayISO } from "@/lib/csv";

function WeatherPageInner({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: weatherData, isLoading: wLoading } = useWeather(
    district,
    state,
  );
  const { data: rainfallData, isLoading: rLoading } = useRainfall(
    district,
    state,
  );

  const readings = weatherData?.data ?? [];
  const latest = readings[0];
  const rainfallRows = rainfallData?.data ?? [];

  // Yearly rainfall aggregation (NEW)
  const rainfallByYear = Object.entries(
    rainfallRows.reduce((acc: Record<number, number>, r) => {
      const year = Number(r.year);
      const rainfall = Number(r.rainfall);

      if (!year || isNaN(rainfall)) return acc;

      acc[year] = (acc[year] ?? 0) + rainfall;
      return acc;
    }, {}),
  )
    .map(([year, total]) => ({
      year: Number(year),
      total: Math.round(total),
    }))
    .sort((a, b) => a.year - b.year);
  console.log("rainfallByYear:", rainfallByYear);

  // Monthly rainfall chart data (last 24 months)
  const chartData = rainfallRows
    .slice(0, 24)
    .map((r) => ({
      label: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][r.month - 1]} '${String(r.year).slice(2)}`,
      actual: r.rainfall,
      normal: r.normal,
      departure: r.departure,
    }))
    .reverse();

  function handleDownload() {
    const rows = rainfallRows.slice(0, 60).map((r) => ({
      Month: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ][r.month - 1],
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
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Cloud}
        title="Weather & Rainfall"
        description="Live weather readings and historical monsoon data"
        backHref={base}
        liveTag
      >
        <LastUpdatedBadge lastUpdated={weatherData?.meta?.lastUpdated} />
      </ModuleHeader>

      {/* AI-crawler readable summary */}
      <p
        style={{
          fontSize: 13,
          color: "#6B6B6B",
          lineHeight: 1.7,
          marginBottom: 16,
          padding: "12px 16px",
          background: "#FAFAF8",
          borderRadius: 8,
          borderLeft: "3px solid #2563EB",
        }}
      >
        This page shows live weather readings and monthly rainfall history for
        this district, sourced from India Meteorological Department (IMD) and
        OpenWeatherMap. Temperature is in Celsius, rainfall in millimetres. Data
        is updated every 5 minutes during active monitoring.
      </p>
      {(() => {
        const _src = getModuleSources("weather", state);
        return (
          <DataSourceBanner
            moduleName="weather"
            sources={_src.sources}
            updateFrequency={_src.frequency}
            isLive={_src.isLive}
          />
        );
      })()}
      <AIInsightCard module="weather" district={district} />

      {/* Current Weather */}
      {wLoading && <LoadingShell rows={3} />}
      {!wLoading && latest && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<LiveBadge />}>Current Conditions</SectionLabel>
          <div
            style={{
              background: "linear-gradient(135deg, #EFF6FF, #F0F9FF)",
              border: "1px solid #BFDBFE",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "#1A1A1A",
                    letterSpacing: "-2px",
                  }}
                >
                  {latest.temperature !== null &&
                  latest.temperature !== undefined
                    ? `${latest.temperature}°C`
                    : "—"}
                </div>
                <div style={{ fontSize: 16, color: "#6B6B6B", marginTop: 4 }}>
                  {latest.conditions ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 4 }}>
                  Recorded:{" "}
                  {new Date(latest.recordedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}
                  >
                    Humidity
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {latest.humidity ?? "—"}%
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}
                  >
                    Wind
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {latest.windSpeed ?? "—"}{" "}
                    <span style={{ fontSize: 12, fontWeight: 400 }}>km/h</span>
                    {latest.windDir && (
                      <span style={{ fontSize: 12 }}> {latest.windDir}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}
                  >
                    Rainfall (day)
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "#2563EB",
                    }}
                  >
                    {latest.rainfall ?? 0}{" "}
                    <span style={{ fontSize: 12, fontWeight: 400 }}>mm</span>
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}
                  >
                    Feels Like
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {latest.feelsLike !== null && latest.feelsLike !== undefined
                      ? `${latest.feelsLike}°C`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rainfall History */}
      {rLoading && <LoadingShell rows={3} />}
      {!rLoading && (
        <>
          {chartData.length > 0 && (
            <>
              <SectionLabel>
                Monthly Rainfall — Actual vs Normal (mm)
              </SectionLabel>
              <div
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#9B9B9B" }}
                      angle={-45}
                      textAnchor="end"
                      interval={1}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip
                      formatter={(v, name) => [
                        `${Number(v)} mm`,
                        name === "actual" ? "Actual" : "Normal",
                      ]}
                    />
                    <Bar
                      dataKey="actual"
                      fill="#2563EB"
                      radius={[3, 3, 0, 0]}
                      name="Actual"
                    />
                    <Bar
                      dataKey="normal"
                      fill="#E8E8E4"
                      radius={[3, 3, 0, 0]}
                      name="Normal"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <SectionLabel>Departure from Normal</SectionLabel>
              <div
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#9B9B9B" }}
                      angle={-45}
                      textAnchor="end"
                      interval={1}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <Tooltip
                      formatter={(v) => [`${Number(v)} mm`, "Departure"]}
                    />
                    <ReferenceLine y={0} stroke="#9B9B9B" />
                    <Bar
                      dataKey="departure"
                      fill="#D97706"
                      radius={[3, 3, 0, 0]}
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          {rainfallByYear.length > 0 && (
            <>
              <SectionLabel>Annual Rainfall Trend (mm)</SectionLabel>
              <div
                style={{
                  background: "#FFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height={160}
                  key={rainfallByYear.length}
                >
                  <LineChart data={rainfallByYear}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="year" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={[
                        0,
                        (dataMax: number) => Math.ceil(dataMax / 100) * 100,
                      ]}
                    />
                    <Tooltip
                      formatter={(v) => [`${Number(v)} mm`, "Rainfall"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          <SectionLabel
            action={
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={handleDownload}
                  aria-label="Download rainfall data as CSV"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    border: "1px solid #E8E8E4",
                    borderRadius: 8,
                    background: "#FAFAF8",
                    color: "#6B6B6B",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Download size={13} aria-hidden="true" /> CSV
                </button>
                <ShareButtons
                  text={shareText}
                  district={district}
                  module="Weather"
                />
              </div>
            }
          >
            Rainfall History Table
          </SectionLabel>
          <DataTable
            columns={[
              { key: "month", label: "Month" },
              { key: "year", label: "Year", mono: true },
              {
                key: "actual",
                label: "Actual (mm)",
                mono: true,
                align: "right",
              },
              {
                key: "normal",
                label: "Normal (mm)",
                mono: true,
                align: "right",
              },
              { key: "dep", label: "Departure", mono: true, align: "right" },
            ]}
            rows={rainfallRows.slice(0, 30).map((r) => ({
              month: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ][r.month - 1],
              year: r.year,
              actual: r.rainfall.toFixed(1),
              normal: r.normal.toFixed(1),
              dep: (
                <span
                  style={{ color: r.departure > 0 ? "#16A34A" : "#DC2626" }}
                >
                  {r.departure > 0 ? "+" : ""}
                  {r.departure.toFixed(1)}
                </span>
              ),
            }))}
          />
        </>
      )}
    </div>
  );
}

export default function WeatherPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  return (
    <ModuleErrorBoundary moduleName="Weather & Rainfall">
      <WeatherPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
