/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import { ScrollText, ExternalLink } from "lucide-react";
import { useSchemes } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock, EmptyBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";

function SchemesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchemes(district, state);
  const [filter, setFilter] = useState("all");

  const schemes = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(schemes.map((s) => s.category)))];
  const filtered = filter === "all" ? schemes : schemes.filter((s) => s.category === filter);

  const CAT_COLORS: Record<string, string> = {
    agriculture: "#16A34A", housing: "#2563EB", health: "#DC2626", education: "#7C3AED",
    finance: "#D97706", social: "#0891B2", employment: "#059669", welfare: "#B45309",
  };

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={ScrollText} title="Government Schemes" description="Active central and state schemes with eligibility and application links" backHref={base} />
      {(() => { const _src = getModuleSources("schemes", state); return <DataSourceBanner moduleName="schemes" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="schemes" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && <EmptyBlock icon="📋" message="No schemes data yet for this district" />}

      {!isLoading && schemes.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {categories.map((c) => {
              const color = c !== "all" ? (CAT_COLORS[c.toLowerCase()] ?? "#6B7280") : "#2563EB";
              return (
                <button key={c} onClick={() => setFilter(c)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: filter === c ? color : "#F5F5F0",
                  color: filter === c ? "#FFF" : "#6B6B6B",
                  border: filter === c ? `1px solid ${color}` : "1px solid #E8E8E4",
                }}>
                  {c === "all" ? `All (${schemes.length})` : `${c} (${schemes.filter(s => s.category === c).length})`}
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {filtered.map((s) => {
              const color = CAT_COLORS[s.category.toLowerCase()] ?? "#6B7280";
              return (
                <div key={s.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4, lineHeight: 1.3 }}>{s.name}</div>
                      {s.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginBottom: 6 }}>{s.nameLocal}</div>}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                      color, background: `${color}18`, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {s.category}
                    </span>
                  </div>

                  {s.eligibility && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 2 }}>ELIGIBILITY</div>
                      <div style={{ fontSize: 13, color: "#6B6B6B" }}>{s.eligibility}</div>
                    </div>
                  )}
                  {s.amount && (
                    <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#9B9B9B" }}>Benefit Amount</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#16A34A" }}>₹{s.amount.toLocaleString("en-IN")}</div>
                      </div>
                      {s.beneficiaryCount && (
                        <div>
                          <div style={{ fontSize: 11, color: "#9B9B9B" }}>Beneficiaries</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{s.beneficiaryCount.toLocaleString("en-IN")}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {s.level && <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 8 }}>Level: {s.level}</div>}
                  {s.applyUrl ? (
                    <a href={s.applyUrl.startsWith("http") ? s.applyUrl : `https://${s.applyUrl}`} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12,
                      padding: "7px 14px", background: "#0f6e56", color: "#FFF",
                      borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none",
                    }}>
                      Apply Online <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12,
                      padding: "7px 14px", background: "#F5F5F0", color: "#9B9B9B",
                      borderRadius: 8, fontSize: 12, fontWeight: 500,
                    }}>
                      Link unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <ModuleNews district={district} state={state} locale={locale} module="schemes" />
    </div>
  );
}

export default function SchemesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Govt. Schemes">
      <SchemesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
