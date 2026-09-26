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
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { Bus, Train, Clock, MapPin } from "lucide-react";
import { useTransport } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, LoadingShell, ErrorBlock } from "@/components/district/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function TransportPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useTransport(district, state);
  const [tab, setTab] = useState<"bus" | "train">("bus");
  const [busFilter, setBusFilter] = useState("all");

  const buses = (data?.data?.buses ?? []).filter((b) => b.active);
  const trains = data?.data?.trains ?? [];

  const operators = ["all", ...Array.from(new Set(buses.map((b) => b.operator)))];
  const filteredBuses = busFilter === "all" ? buses : buses.filter((b) => b.operator === busFilter);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Bus} title="Transport" description="Bus routes and train schedules serving the district" backHref={base} />
      {(() => { const _src = getModuleSources("transport", state); return <DataSourceBanner moduleName="transport" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="transport" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Bus Routes" value={buses.length} icon={Bus} />
            <StatCard label="Train Services" value={trains.length} icon={Train} />
            <StatCard label="Operators" value={new Set(buses.map(b => b.operator)).size} />
          </div>

          {/* Tab Switch */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "#F5F5F0", borderRadius: 10, padding: 3, width: "fit-content" }}>
            {(["bus", "train"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "7px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                background: tab === t ? "#FFF" : "transparent",
                color: tab === t ? "#1A1A1A" : "#6B6B6B",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>
                {t === "bus" ? `🚌 Buses (${buses.length})` : `🚆 Trains (${trains.length})`}
              </button>
            ))}
          </div>

          {tab === "bus" && (
            <>
              {/* Operator filter */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {operators.map((op) => (
                  <button key={op} onClick={() => setBusFilter(op)} style={{
                    padding: "4px 10px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                    background: busFilter === op ? "#2563EB" : "#F5F5F0",
                    color: busFilter === op ? "#FFF" : "#6B6B6B",
                    border: busFilter === op ? "1px solid #2563EB" : "1px solid #E8E8E4",
                  }}>
                    {op === "all" ? "All" : op}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredBuses.map((b) => (
                  <div key={b.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Bus size={16} style={{ color: "#2563EB" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {b.routeNumber && <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", background: "#2563EB", color: "#FFF", padding: "2px 6px", borderRadius: 4 }}>{b.routeNumber}</span>}
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{b.origin} → {b.destination}</span>
                        </div>
                        {b.via && <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>via {b.via}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>{b.operator}</div>
                        <div style={{ fontSize: 11, color: "#6B6B6B" }}>{b.busType}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                      {b.departureTime && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#4B4B4B" }}>
                          <Clock size={11} style={{ color: "#9B9B9B" }} /> {b.departureTime}
                        </div>
                      )}
                      {b.frequency && (
                        <div style={{ fontSize: 12, color: "#4B4B4B" }}>{/^every\s/i.test(b.frequency) ? b.frequency : `Every ${b.frequency}`}</div>
                      )}
                      {b.duration && (
                        <div style={{ fontSize: 12, color: "#4B4B4B" }}>⏱ {b.duration}</div>
                      )}
                      {b.fare && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#16A34A", fontFamily: "var(--font-mono)" }}>₹{b.fare}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "train" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trains.map((t) => (
                <div key={t.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: "#F5F3FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Train size={16} style={{ color: "#7C3AED" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", background: "#7C3AED", color: "#FFF", padding: "2px 6px", borderRadius: 4 }}>{t.trainNumber}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{t.trainName}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
                        <MapPin size={10} style={{ display: "inline", marginRight: 3 }} />{t.origin} → {t.destination}
                      </div>
                      <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>Station: {t.stationName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {t.arrivalTime && <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>Arr: {t.arrivalTime}</div>}
                      {t.departureTime && <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>Dep: {t.departureTime}</div>}
                    </div>
                  </div>
                  {t.daysOfWeek.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {DAYS.map((d) => (
                        <span key={d} style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 5px", borderRadius: 4,
                          background: t.daysOfWeek.includes(d) ? "#2563EB" : "#F5F5F0",
                          color: t.daysOfWeek.includes(d) ? "#FFF" : "#C0C0C0",
                        }}>{d[0]}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <ModuleNews district={district} state={state} locale={locale} module="transport" />
        </>
      )}
    </div>
  );
}

export default function TransportPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Transport">
      <TransportPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
