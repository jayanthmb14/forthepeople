/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { Briefcase, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useServices } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock } from "@/components/district/ui";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";

export default function ServicesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useServices(district, state);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const services = data?.data ?? [];
  const active = services.filter((s) => s.active);
  const categories = ["all", ...Array.from(new Set(active.map((s) => s.category)))];
  const filtered = filter === "all" ? active : active.filter((s) => s.category === filter);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Briefcase} title="Citizen Services" description="Step-by-step guides for government services, documents needed, fees, and timelines" backHref={base} />
      {(() => { const _src = getModuleSources("services", state); return <DataSourceBanner moduleName="services" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && active.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: filter === c ? "#2563EB" : "#F5F5F0",
                color: filter === c ? "#FFF" : "#6B6B6B",
                border: filter === c ? "1px solid #2563EB" : "1px solid #E8E8E4",
              }}>
                {c === "all" ? `All (${active.length})` : `${c} (${active.filter(s => s.category === c).length})`}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => {
              const isOpen = expanded === s.id;
              return (
                <div key={s.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
                  <button onClick={() => setExpanded(isOpen ? null : s.id)} style={{
                    width: "100%", padding: "14px 16px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Briefcase size={16} style={{ color: "#2563EB" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{s.serviceName}</div>
                        {s.serviceNameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{s.serviceNameLocal}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#6B6B6B", background: "#F5F5F0", padding: "2px 8px", borderRadius: 12 }}>{s.office}</span>
                      {isOpen ? <ChevronUp size={16} style={{ color: "#9B9B9B" }} /> : <ChevronDown size={16} style={{ color: "#9B9B9B" }} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0F0EC" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 12 }}>
                        {s.fees && (
                          <div>
                            <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}>FEE</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{s.fees}</div>
                          </div>
                        )}
                        {s.timeline && (
                          <div>
                            <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 2 }}>TIMELINE</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{s.timeline}</div>
                          </div>
                        )}
                      </div>

                      {s.documentsNeeded.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 6 }}>DOCUMENTS NEEDED</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {s.documentsNeeded.map((doc, i) => (
                              <span key={i} style={{ fontSize: 12, padding: "3px 8px", background: "#FFF7ED", color: "#92400E", borderRadius: 6, border: "1px solid #FED7AA" }}>{doc}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.steps.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 6 }}>STEPS</div>
                          <ol style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                            {s.steps.map((step, i) => (
                              <li key={i} style={{ fontSize: 13, color: "#4B4B4B" }}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {s.tips && (
                        <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#15803D", marginBottom: 2 }}>TIP</div>
                          <div style={{ fontSize: 12, color: "#166534" }}>{s.tips}</div>
                        </div>
                      )}

                      {s.onlineUrl && (
                        <a href={s.onlineUrl} target="_blank" rel="noopener noreferrer" style={{
                          display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12,
                          padding: "7px 14px", background: "#2563EB", color: "#FFF",
                          borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none",
                        }}>
                          Apply Online <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
