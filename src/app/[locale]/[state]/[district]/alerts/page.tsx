/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { use } from "react";
import { Bell } from "lucide-react";
import { useAlerts } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SeverityBadge, LoadingShell, ErrorBlock } from "@/components/district/ui";

const SEV_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: "#FFF1F2", border: "#FECDD3", text: "#DC2626" },
  high: { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C" },
  medium: { bg: "#FEFCE8", border: "#FEF08A", text: "#CA8A04" },
  low: { bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A" },
};

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start) return null;
  const s = new Date(start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  if (!end) return `From ${s}`;
  const e = new Date(end).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return `${s} – ${e}`;
}

function AlertsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useAlerts(district, state);

  const alerts = data?.data ?? [];
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const high = alerts.filter((a) => a.severity === "high").length;

  const byType = Object.entries(
    alerts.reduce((acc: Record<string, number>, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  // "water_supply" → "Water Supply" for display
  const formatTypeLabel = (raw: string) =>
    raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Bell} title="Local Alerts" description="Active alerts and advisories for the district" backHref={base} liveTag />
      {(() => { const _src = getModuleSources("alerts", state); return <DataSourceBanner moduleName="alerts" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="alerts" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Active Alerts" value={alerts.length} icon={Bell} accent={critical > 0 ? "#DC2626" : "#D97706"} />
            <StatCard label="Critical" value={critical} accent="#DC2626" />
            <StatCard label="High Priority" value={high} accent="#EA580C" />
            <StatCard label="Alert Types" value={byType.length} />
          </div>

          {alerts.length === 0 ? (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <Bell size={28} style={{ color: "#16A34A", marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>No active alerts</div>
              <div style={{ fontSize: 13, color: "#16A34A" }}>All clear for the district</div>
            </div>
          ) : (
            <>
              {/* Type pills */}
              {byType.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {byType.map(([type, count]) => (
                    <span key={type} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 12, background: "#F5F5F0", color: "#6B6B6B", border: "1px solid #E8E8E4" }}>
                      {formatTypeLabel(type)} ({count})
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {alerts.map((a) => {
                  const sev = SEV_COLORS[a.severity.toLowerCase()] ?? SEV_COLORS.low;
                  const dateRange = formatDateRange(a.startDate, a.endDate);
                  return (
                    <div key={a.id} style={{
                      background: sev.bg, border: `1px solid ${sev.border}`,
                      borderLeft: `3px solid ${sev.text}`, borderRadius: 10, padding: "14px 16px",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <SeverityBadge severity={a.severity} />
                            <span style={{ fontSize: 11, background: "#00000010", padding: "2px 7px", borderRadius: 10, color: "#6B6B6B" }}>{formatTypeLabel(a.type)}</span>
                            {dateRange && <span style={{ fontSize: 11, color: "#9B9B9B" }}>📅 {dateRange}</span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>{a.title}</div>
                          {a.titleLocal && <div style={{ fontSize: 13, color: "#4B4B4B", fontFamily: "var(--font-regional)", marginBottom: 4 }}>{a.titleLocal}</div>}
                          <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.5 }}>{a.description}</div>
                          {a.location && <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 6 }}>📍 {a.location}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function AlertsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Alerts">
      <AlertsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
