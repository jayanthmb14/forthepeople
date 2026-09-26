/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use } from "react";
import { Zap, Clock, MapPin } from "lucide-react";
import { usePower } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell, ErrorBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function PowerPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = usePower(district, state);

  const outages = data?.data ?? [];
  const active = outages.filter((o) => !o.endTime);
  const resolved = outages.filter((o) => o.endTime);
  const totalAffected = active.reduce((s, o) => s + (o.affectedHouseholds ?? 0), 0);
  const avgDuration = outages.filter(o => o.durationHours).reduce((s, o) => s + (o.durationHours ?? 0), 0) / (outages.filter(o => o.durationHours).length || 1);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Zap} title="Power Outages" description="Planned and unplanned power cut notifications and history" backHref={base} />
      {(() => { const _src = getModuleSources("power", state); return <DataSourceBanner moduleName="power" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="power" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && outages.length === 0 && (
        <NoDataCard module="power" district={district} state={state} />
      )}

      {!isLoading && outages.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Active Outages" value={active.length} accent={active.length > 0 ? "#DC2626" : "#16A34A"} icon={Zap} />
            <StatCard label="Affected HH" value={totalAffected.toLocaleString("en-IN")} />
            <StatCard label="Resolved (30d)" value={resolved.length} accent="#16A34A" />
            <StatCard label="Avg Duration" value={`${avgDuration.toFixed(1)}h`} />
          </div>

          {active.length > 0 && (
            <>
              <SectionLabel>Active Outages</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {active.map((o) => (
                  <div key={o.id} style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", marginTop: 5, flexShrink: 0, animation: "pulse 2s infinite" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <MapPin size={12} style={{ color: "#DC2626" }} />
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{o.area}</div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "1px 6px", borderRadius: 10 }}>LIVE</span>
                        </div>
                        {o.reason && <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>Reason: {o.reason}</div>}
                        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9B9B9B" }}>
                            <Clock size={11} /> Started: {formatDate(o.startTime)}
                          </div>
                          {o.affectedHouseholds && (
                            <div style={{ fontSize: 12, color: "#9B9B9B" }}>{o.affectedHouseholds.toLocaleString("en-IN")} households</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {active.length === 0 && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16, marginBottom: 24, textAlign: "center" }}>
              <Zap size={24} style={{ color: "#16A34A", marginBottom: 6 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#15803D" }}>No active power outages</div>
              <div style={{ fontSize: 12, color: "#16A34A" }}>Power supply is normal across all areas</div>
            </div>
          )}

          {resolved.length > 0 && (
            <>
              <SectionLabel>Recent Outage History</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resolved.map((o) => (
                  <div key={o.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <MapPin size={12} style={{ color: "#6B6B6B" }} />
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{o.area}</div>
                          <span style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, background: "#F0FDF4", padding: "1px 6px", borderRadius: 10 }}>RESOLVED</span>
                        </div>
                        {o.reason && <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>Reason: {o.reason}</div>}
                        <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 4 }}>
                          {formatDate(o.startTime)} → {o.endTime ? formatDate(o.endTime) : "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {o.durationHours && (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{o.durationHours.toFixed(1)}h</div>
                            <div style={{ fontSize: 11, color: "#9B9B9B" }}>duration</div>
                          </>
                        )}
                        {o.affectedHouseholds && (
                          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>{o.affectedHouseholds.toLocaleString("en-IN")} HH</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function PowerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Power">
      <PowerPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
