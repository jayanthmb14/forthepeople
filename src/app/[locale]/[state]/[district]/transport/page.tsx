/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Transport — Design v3 module page (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useTransport() → { buses, trains }. Only active bus routes are
//  shown. Rows carry no timestamp, so the tiles state how often the
//  source is refreshed (from getModuleSources) instead of a date.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { Bus, Train, Clock, MapPin, Timer } from "lucide-react";
import { useTransport } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Mono route / train number tag (brand tint, not a filled block). */
function NumberTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="ftp-num"
      style={{
        fontSize: 11,
        lineHeight: "16px",
        padding: "2px 6px",
        borderRadius: 4,
        background: "var(--ftp-brand-tint)",
        color: "var(--ftp-brand-deep)",
      }}
    >
      {children}
    </span>
  );
}

/** A small meta line item (icon + text) under a route. */
function Meta({ icon: Icon, children }: { icon?: typeof Clock; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
      {Icon && <Icon size={12} aria-hidden style={{ color: "var(--ftp-text-2)" }} />}
      {children}
    </span>
  );
}

function TransportPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useTransport(district, state);
  const [tab, setTab] = useState<"bus" | "train">("bus");
  const [busFilter, setBusFilter] = useState("all");

  const buses = (data?.data?.buses ?? []).filter((b) => b.active);
  const trains = data?.data?.trains ?? [];

  const operators = Array.from(new Set(buses.map((b) => b.operator)));
  const filteredBuses = busFilter === "all" ? buses : buses.filter((b) => b.operator === busFilter);
  const refresh = `Source updates: ${getModuleSources("transport", state).frequency.toLowerCase()}`;

  const listStyle = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: 8 };

  return (
    <ModulePage>
      <PageHeader
        icon={Bus}
        title="Transport"
        description="Bus routes and train schedules serving the district"
        backHref={base}
        accent={getModuleAccent("transport")}
      />

      <AIInsightCard module="transport" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && buses.length === 0 && trains.length === 0 && (
        <NoDataCard module="transport" district={district} state={state} />
      )}

      {!isLoading && (buses.length > 0 || trains.length > 0) && (
        <>
          <StatStrip cols={3}>
            <StatTile label="Bus routes" value={buses.length} icon={Bus} sub={refresh} />
            <StatTile label="Train services" value={trains.length} icon={Train} sub={refresh} />
            <StatTile label="Operators" value={operators.length} sub={refresh} />
          </StatStrip>

          <Section title="Timetables">
            {/* Bus / train switch. */}
            <Chips
              label="Mode of transport"
              value={tab}
              onChange={(v) => setTab(v as "bus" | "train")}
              items={[
                { value: "bus", label: "Buses", count: buses.length },
                { value: "train", label: "Trains", count: trains.length },
              ]}
            />

            {tab === "bus" && (
              <div style={{ marginTop: 12 }}>
                {operators.length > 1 && (
                  <div style={{ marginBottom: 12 }}>
                    <Chips
                      label="Bus operator"
                      value={busFilter}
                      onChange={setBusFilter}
                      items={[{ value: "all", label: "All" }, ...operators.map((op) => ({ value: op, label: op }))]}
                    />
                  </div>
                )}
                {filteredBuses.length === 0 ? (
                  <EmptyState title="No active bus routes listed for this district yet." />
                ) : (
                  <ul style={listStyle}>
                    {filteredBuses.map((b) => (
                      <Card key={b.id} as="li" padding={14}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <Bus size={18} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              {b.routeNumber && <NumberTag>{b.routeNumber}</NumberTag>}
                              <span className="ftp-title">{b.origin} → {b.destination}</span>
                            </div>
                            {b.via && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>via {b.via}</div>}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            <div>{b.operator}</div>
                            <div>{b.busType}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", paddingLeft: 30 }}>
                          {b.departureTime && <Meta icon={Clock}><span className="ftp-num">{b.departureTime}</span></Meta>}
                          {b.frequency && <Meta>{/^every\s/i.test(b.frequency) ? b.frequency : `Every ${b.frequency}`}</Meta>}
                          {b.duration && <Meta icon={Timer}>{b.duration}</Meta>}
                          {b.fare ? <Meta><span className="ftp-num">₹{b.fare}</span></Meta> : null}
                        </div>
                      </Card>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "train" && (
              <div style={{ marginTop: 12 }}>
                {trains.length === 0 ? (
                  <EmptyState title="No train services listed for this district yet." />
                ) : (
                  <ul style={listStyle}>
                    {trains.map((t) => (
                      <Card key={t.id} as="li" padding={14}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <Train size={18} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <NumberTag>{t.trainNumber}</NumberTag>
                              <span className="ftp-title">{t.trainName}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>
                              <MapPin size={11} aria-hidden />
                              {t.origin} → {t.destination}
                            </div>
                            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>Station: {t.stationName}</div>
                          </div>
                          <div className="ftp-num" style={{ textAlign: "right", flexShrink: 0, fontSize: 13, lineHeight: "20px" }}>
                            {t.arrivalTime && <div>Arr: {t.arrivalTime}</div>}
                            {t.departureTime && <div>Dep: {t.departureTime}</div>}
                          </div>
                        </div>
                        {t.daysOfWeek.length > 0 && (
                          <div
                            aria-label={`Runs on ${DAYS.filter((d) => t.daysOfWeek.includes(d)).join(", ")}`}
                            style={{ display: "flex", gap: 4, marginTop: 8, paddingLeft: 30 }}
                          >
                            {DAYS.map((d) => {
                              const runs = t.daysOfWeek.includes(d);
                              return (
                                <span
                                  key={d}
                                  aria-hidden
                                  className="ftp-num"
                                  style={{
                                    fontSize: 11,
                                    lineHeight: "16px",
                                    width: 20,
                                    textAlign: "center",
                                    borderRadius: 4,
                                    background: runs ? "var(--ftp-brand-tint)" : "var(--ftp-surface-2)",
                                    color: runs ? "var(--ftp-brand-deep)" : "var(--ftp-text-2)",
                                    opacity: runs ? 1 : 0.6,
                                  }}
                                >
                                  {d[0]}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Section>
        </>
      )}

      <ModuleSources module="transport" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="transport" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="transport"
        moduleLabel="Transport"
        shareText={`Transport in ${district}: ${buses.length} bus routes, ${trains.length} train services`}
      />
    </ModulePage>
  );
}

export default function TransportPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Transport">
      <TransportPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
