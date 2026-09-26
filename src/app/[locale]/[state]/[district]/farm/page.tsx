/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Leaf } from "lucide-react";
import { useSoil } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

const PH_LABEL = (ph: number) => ph < 6 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Neutral";
const PH_COLOR = (ph: number) => ph < 6 ? "#DC2626" : ph > 7.5 ? "#D97706" : "#16A34A";

const CAT_COLORS: Record<string, string> = {
  pest: "#DC2626", weather: "#2563EB", fertilizer: "#16A34A", crop: "#7C3AED", irrigation: "#0891B2",
};

export default function FarmPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSoil(district, state);

  const soilData = data?.data?.soil ?? [];
  const advisories = data?.data?.advisories ?? [];
  const activeAdvisories = advisories.filter((a) => a.active);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Leaf} title="Farm & Soil" description="Soil health reports and agri advisory for farmers" backHref={base} />
      {(() => { const _src = getModuleSources("farm", state); return <DataSourceBanner moduleName="farm" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="farm" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && soilData.length === 0 && advisories.length === 0 && (
        <NoDataCard module="farm" district={district} state={state} />
      )}

      {!isLoading && (soilData.length > 0 || advisories.length > 0) && (
        <>
          {/* Active advisories */}
          {activeAdvisories.length > 0 && (
            <>
              <SectionLabel>Active Advisories</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {activeAdvisories.map((a) => {
                  const color = CAT_COLORS[a.category.toLowerCase()] ?? "#6B7280";
                  return (
                    <div key={a.id} style={{ background: "#FFF", border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, padding: "2px 7px", borderRadius: 10 }}>{a.category.toUpperCase()}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{a.crop}</span>
                          {a.cropLocal && <span style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{a.cropLocal}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#9B9B9B", flexShrink: 0 }}>w/o {new Date(a.weekOf).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                      </div>
                      <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.5 }}>{a.advisory}</div>
                      {a.advisoryLocal && (
                        <div style={{ fontSize: 13, color: "#6B6B6B", fontFamily: "var(--font-regional)", marginTop: 6, lineHeight: 1.5 }}>{a.advisoryLocal}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Soil health */}
          {soilData.length > 0 && (
            <>
              <SectionLabel>Soil Health Reports ({soilData.length} villages)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {soilData.map((s) => (
                  <div key={s.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 10 }}>
                      {s.villageName ?? "Unknown Village"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      {s.pH !== null && s.pH !== undefined && (
                        <div style={{ background: "#F9F9F7", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 11, color: "#9B9B9B" }}>pH</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: PH_COLOR(s.pH) }}>{s.pH.toFixed(1)}</div>
                          <div style={{ fontSize: 10, color: PH_COLOR(s.pH), fontWeight: 600 }}>{PH_LABEL(s.pH)}</div>
                        </div>
                      )}
                      {s.organicCarbon && (
                        <div style={{ background: "#F9F9F7", borderRadius: 8, padding: "8px 10px" }}>
                          <div style={{ fontSize: 11, color: "#9B9B9B" }}>Organic Carbon</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{s.organicCarbon}</div>
                        </div>
                      )}
                    </div>
                    {/* NPK */}
                    {(s.nitrogen || s.phosphorus || s.potassium) && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                        {[
                          { label: "N", value: s.nitrogen, color: "#2563EB" },
                          { label: "P", value: s.phosphorus, color: "#7C3AED" },
                          { label: "K", value: s.potassium, color: "#D97706" },
                        ].filter((n) => n.value).map(({ label, value, color }) => (
                          <div key={label} style={{ background: `${color}10`, border: `1px solid ${color}20`, borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                            <div style={{ fontSize: 11, color: "#4B4B4B" }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {s.recommendation && (
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#166534" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", marginBottom: 2 }}>RECOMMENDATION</div>
                        {s.recommendation}
                      </div>
                    )}
                    {s.testedAt && (
                      <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 8 }}>
                        Tested: {new Date(s.testedAt).toLocaleDateString("en-IN")}
                      </div>
                    )}
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
