/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Point {
  month: string;
  newCount: number;
  cumulative: number;
}

function formatMonth(m: string): string {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ContributorGrowthChart() {
  const { data, isLoading } = useQuery<{ points: Point[] }>({
    queryKey: ["contributor-growth"],
    queryFn: () => fetch("/api/data/contributors?type=growth-trend").then((r) => r.json()),
    staleTime: 300_000,
  });

  const points = data?.points ?? [];
  if (isLoading) return null;
  if (points.length === 0) return null;

  const currentKey = currentMonthKey();
  const thisMonth = points.find((p) => p.month === currentKey)?.newCount ?? 0;
  const totalCumulative = points[points.length - 1]?.cumulative ?? 0;

  // If we only have one month of data, show a stat card instead of a chart.
  if (points.length < 2) {
    const only = points[0];
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 32 }}>📊</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
            {formatMonth(only.month)}
          </div>
          <div style={{ fontSize: 13, color: "#6B6B6B" }}>
            <strong style={{ color: "#2563EB" }}>{only.newCount}</strong> new contributor{only.newCount === 1 ? "" : "s"} this month ·{" "}
            <span style={{ color: "#9B9B9B" }}>Tracking since April 2026</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9B9B9B", fontStyle: "italic" }}>
          Growth chart appears once a second month of data is available.
        </div>
      </div>
    );
  }

  const chartData = points.map((p) => ({ ...p, label: formatMonth(p.month) }));

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
          📈 Contributor Growth
        </h2>
        <div style={{ fontSize: 12, color: "#6B6B6B" }}>
          <span style={{ fontWeight: 700, color: "#2563EB" }}>+{thisMonth}</span> new this month
          {" · "}
          <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{totalCumulative.toLocaleString("en-IN")}</span> total
        </div>
      </div>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grow-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" stroke="#9B9B9B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9B9B9B" fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8E8E4" }}
              formatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return [`${n.toLocaleString("en-IN")} total`, "Cumulative"];
              }}
              labelFormatter={(l, payload) => {
                const pt = (payload?.[0]?.payload ?? null) as (Point & { label: string }) | null;
                if (!pt) return String(l ?? "");
                return `${pt.label} — +${pt.newCount} new`;
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#grow-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
