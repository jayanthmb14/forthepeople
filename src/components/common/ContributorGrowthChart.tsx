/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  ContributorGrowthChart — supporters over time (cumulative, per month)
// ═══════════════════════════════════════════════════════════════════════
//
//  Used on /contributors and on each district's contributors page.
//  With one month of data it shows a single honest sentence (a chart from
//  one point says nothing); from two months on it draws an area chart in
//  the v4 ChartCard frame: title, emoji, the 👉 takeaway, the recharts
//  theme (hue gradient, CHART_AXIS, tooltip) and a "Show as table" view.
//  Month names follow the reader's language (useFormat).
//  Text: "page_site.growth" messages. Colour: the surrounding page hue.
//
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/district/ui";
import { CHART_AXIS, ChartCard, ChartGradients, chartTooltipStyle } from "@/components/district/visuals";
import { useFormat } from "@/i18n/client";

interface Point {
  month: string;
  newCount: number;
  cumulative: number;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ContributorGrowthChart() {
  const t = useTranslations("page_site");
  const { number, date } = useFormat();
  const { data, isLoading } = useQuery<{ points: Point[] }>({
    queryKey: ["contributor-growth"],
    queryFn: () => fetch("/api/data/contributors?type=growth-trend").then((r) => r.json()),
    staleTime: 300_000,
  });

  const points = data?.points ?? [];
  if (isLoading) return null;
  if (points.length === 0) return null;

  // "2026-04" → "Apr 26" / "ಏಪ್ರಿ 26" / "अप्रैल 26" (mid-month, so no time zone can shift it).
  const monthLabel = (m: string) => {
    const [y, mo] = m.split("-");
    return date(`${y}-${mo}-15T12:00:00Z`, { month: "short", year: "2-digit" });
  };

  const currentKey = currentMonthKey();
  const thisMonth = points.find((p) => p.month === currentKey)?.newCount ?? 0;
  const totalCumulative = points[points.length - 1]?.cumulative ?? 0;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  // If we only have one month of data, show a sentence instead of a chart.
  if (points.length < 2) {
    const only = points[0];
    return (
      <Card padding={20} style={{ marginBottom: 24 }}>
        <h2 className="ftp-display" style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 10, fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            📈
          </span>
          {t("growth.title")}
        </h2>
        <p className="ftp-body" style={{ color: "var(--ftp-text)", fontSize: 14 }}>
          {t.rich("growth.oneMonth", { month: monthLabel(only.month), n: only.newCount, b })}
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 6 }}>{t("growth.oneMonthNote")}</p>
      </Card>
    );
  }

  const chartData = points.map((p) => ({ ...p, label: monthLabel(p.month) }));

  return (
    <div style={{ marginBottom: 24 }}>
      <ChartCard
        title={t("growth.title")}
        emoji="📈"
        units={t("growth.units")}
        simple={t.rich("growth.simple", { n: number(thisMonth), total: number(totalCumulative), b })}
        source={{ label: t("growth.source") }}
        table={chartData.map((p) => ({ label: p.label, value: t("growth.tableValue", { total: number(p.cumulative), n: number(p.newCount) }) }))}
      >
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <ChartGradients />
              <CartesianGrid stroke="var(--ftp-surface-2)" vertical={false} />
              <XAxis dataKey="label" tick={CHART_AXIS} tickLine={false} axisLine={false} />
              <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} tickFormatter={(v: number) => number(v)} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v) => [t("growth.tooltipTotal", { n: number(typeof v === "number" ? v : Number(v)) }), t("growth.tooltipName")]}
                labelFormatter={(l, payload) => {
                  const pt = (payload?.[0]?.payload ?? null) as (Point & { label: string }) | null;
                  if (!pt) return String(l ?? "");
                  return t("growth.tooltipNew", { month: pt.label, n: number(pt.newCount) });
                }}
              />
              <Area type="monotone" dataKey="cumulative" stroke="var(--hue)" strokeWidth={2.5} fill="url(#ftpHueArea)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
