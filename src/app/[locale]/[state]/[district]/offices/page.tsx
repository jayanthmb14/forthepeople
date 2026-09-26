/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { Building, Phone, Mail, Globe, MapPin, Clock } from "lucide-react";
import { useOffices } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, LoadingShell, ErrorBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

function isOpenNow() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

export default function OfficesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useOffices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const offices = (data?.data ?? []).filter((o) => o.active);
  const departments = ["all", ...Array.from(new Set(offices.map((o) => o.department)))];
  const openNow = isOpenNow();

  const filtered = offices.filter((o) => {
    const matchesDept = filter === "all" || o.department === filter;
    const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Building} title="Government Offices" description="Directory of government offices — addresses, contacts, and services" backHref={base} />
      {(() => { const _src = getModuleSources("offices", state); return <DataSourceBanner moduleName="offices" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="offices" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Offices" value={offices.length} icon={Building} />
            <StatCard label="Departments" value={departments.length - 1} />
            <StatCard label="Status" value={openNow ? "Open Now" : "Closed"} accent={openNow ? "#16A34A" : "#DC2626"} />
          </div>

          {/* Office hours banner */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: openNow ? "#F0FDF4" : "#F9F9F7",
            border: `1px solid ${openNow ? "#BBF7D0" : "#E8E8E4"}`,
            borderRadius: 10, marginBottom: 20,
          }}>
            <Clock size={14} style={{ color: openNow ? "#16A34A" : "#9B9B9B" }} />
            <div style={{ fontSize: 13, color: openNow ? "#15803D" : "#6B6B6B" }}>
              {openNow ? "Offices are open now (Mon–Fri, 10:00 AM – 5:30 PM)" : "Offices are currently closed. Open Mon–Fri, 10:00 AM – 5:30 PM"}
            </div>
          </div>

          {/* Search + filter */}
          <input
            type="text"
            placeholder="Search offices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #E8E8E4", fontSize: 14, marginBottom: 12, background: "#FFF", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {departments.map((d) => (
              <button key={d} onClick={() => setFilter(d)} style={{
                padding: "4px 10px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                background: filter === d ? "#2563EB" : "#F5F5F0",
                color: filter === d ? "#FFF" : "#6B6B6B",
                border: filter === d ? "1px solid #2563EB" : "1px solid #E8E8E4",
              }}>
                {d === "all" ? `All (${offices.length})` : `${d} (${offices.filter(o => o.department === d).length})`}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {filtered.map((o) => (
              <div key={o.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building size={16} style={{ color: "#2563EB" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.3 }}>{o.name}</div>
                    {o.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{o.nameLocal}</div>}
                    <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 2 }}>{o.department} · {o.type}</div>
                  </div>
                </div>

                {o.headName && (
                  <div style={{ fontSize: 12, color: "#4B4B4B", marginBottom: 6 }}>
                    Head: <span style={{ fontWeight: 600 }}>{o.headName}</span>
                    {o.headDesignation && <span style={{ color: "#9B9B9B" }}> ({o.headDesignation})</span>}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 6, fontSize: 12, color: "#9B9B9B" }}>
                  <MapPin size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{o.address}</span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.phone && (
                    <a href={`tel:${o.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563EB", textDecoration: "none" }}>
                      <Phone size={11} /> {o.phone}
                    </a>
                  )}
                  {o.email && (
                    <a href={`mailto:${o.email}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563EB", textDecoration: "none" }}>
                      <Mail size={11} /> {o.email.split("@")[0]}
                    </a>
                  )}
                  {o.website && (
                    <a href={o.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563EB", textDecoration: "none" }}>
                      <Globe size={11} /> Website
                    </a>
                  )}
                </div>

                {o.services.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 4 }}>SERVICES</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {o.services.slice(0, 4).map((s, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 7px", background: "#F5F5F0", color: "#4B4B4B", borderRadius: 6 }}>{s}</span>
                      ))}
                      {o.services.length > 4 && <span style={{ fontSize: 11, color: "#9B9B9B" }}>+{o.services.length - 4} more</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
