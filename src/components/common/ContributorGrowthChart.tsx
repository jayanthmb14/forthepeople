/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  ContributorGrowthChart — cumulative supporters per month
// ═══════════════════════════════════════════════════════════════════════
//
//  With one month of data it shows a single stat line; from two months on
//  it draws a line/area chart. Design v3: a plain Card, chart colours from
//  tokens (brand line, flat brand-tint fill — no gradient), mono numbers.
//
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/district/ui";

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

/** Card title row: icon + H2 on the left, summary on the right. */
function Title({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
      <h2 className="ftp-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingUp size={16} aria-hidden style={{ color: "var(--ftp-brand)" }} />
        Contributor growth
      </h2>
      {children}
    </div>
  );
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

  // If we only have one month of data, show a stat line instead of a chart.
  if (points.length < 2) {
    const only = points[0];
    return (
      <Card padding={20} style={{ marginBottom: 24 }}>
        <Title />
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{formatMonth(only.month)}</span>:{" "}
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{only.newCount}</span> new contributor
          {only.newCount === 1 ? "" : "s"} this month · Tracking since April 2026
        </p>
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 6 }}>
          Growth chart appears once a second month of data is available.
        </p>
      </Card>
    );
  }

  const chartData = points.map((p) => ({ ...p, label: formatMonth(p.month) }));

  return (
    <Card padding={20} style={{ marginBottom: 24 }}>
      <Title>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>+{thisMonth}</span> new this month
          {" · "}
          <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{totalCumulative.toLocaleString("en-IN")}</span> total
        </p>
      </Title>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--ftp-surface-2)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--ftp-text-2)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ftp-text-2)" fontSize={11} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: "var(--ftp-radius-tile)",
                border: "1px solid var(--ftp-border)",
                background: "var(--ftp-surface)",
                color: "var(--ftp-text)",
              }}
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
              stroke="var(--ftp-brand)"
              strokeWidth={2}
              fill="var(--ftp-brand-tint)"
              fillOpacity={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
