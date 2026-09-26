/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Factory, Phone, MapPin, AlertTriangle, Building2, Cpu, Landmark, TrendingUp, Star, Camera } from "lucide-react";
import { useFactories, useLocalIndustries } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock } from "@/components/district/ui";

interface LocalIndustry {
  id: string;
  name: string;
  category?: string | null;
  location?: string | null;
  type?: string | null;
  phone?: string | null;
  details?: Record<string, string | number | null | undefined> | null;
}
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

// ── District-specific metadata ────────────────────────────
function getIndustryMeta(district: string) {
  if (district === "bengaluru-urban") return {
    title: "IT Parks & Startup Ecosystem",
    description: "Bengaluru's tech parks, IT clusters, and startup statistics",
    icon: Cpu,
    mode: "tech" as const,
  };
  if (district === "mysuru") return {
    title: "Heritage, Tourism & Manufacturing",
    description: "Mysuru's heritage sites, tourism footfall, and major industries",
    icon: Landmark,
    mode: "heritage" as const,
  };
  if (district === "hyderabad") return {
    title: "IT, Pharma & GCCs",
    description: "Hyderabad's tech parks, biotech clusters, GCCs, and major markets",
    icon: Cpu,
    mode: "general" as const,
  };
  // Karnataka sugar belt districts (Mandya, etc.)
  const sugarDistricts = ["mandya", "mysuru-rural", "chamarajanagar", "kodagu"];
  if (sugarDistricts.includes(district)) return {
    title: "Local Industries",
    description: "Sugar factories, crushing season data, and farmer arrears tracker",
    icon: Factory,
    mode: "sugar" as const,
  };
  // Default: generic industries view using LocalIndustries data
  return {
    title: "Local Industries",
    description: "Major industries, business hubs, and economic activity in this district",
    icon: Factory,
    mode: "general" as const,
  };
}

// ── Sugar Factories (Mandya) ──────────────────────────────
function SugarView({ district, state }: { district: string; state: string }) {
  const { data, isLoading, error } = useFactories(district, state);
  const factories = data?.data ?? [];
  const totalArrears = factories.reduce((s, f) => s + (f.seasonData[0]?.totalArrears ?? 0), 0);

  if (isLoading) return <LoadingShell rows={4} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {totalArrears > 0 && (
        <div style={{ background: "#FFF8E1", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
          <AlertTriangle size={16} style={{ color: "#D97706" }} />
          <strong>Total Pending Arrears: ₹{(totalArrears / 10000000).toFixed(2)} Crore</strong>
          <span style={{ color: "#6B5800", fontSize: 13 }}>— Payments due to sugarcane farmers</span>
        </div>
      )}
      <SectionLabel>Sugar Factories ({factories.length})</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {factories.map((f) => {
          const latest = f.seasonData[0];
          return (
            <div key={f.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 36, height: 36, background: "#FEF3C7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Factory size={18} style={{ color: "#D97706" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{f.name}</div>
                      {f.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{f.nameLocal}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "#9B9B9B" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{f.location}{f.taluk && ` · ${f.taluk}`}</span>
                    <span>{f.type}</span>
                    {f.capacity && <span>Cap: {f.capacity.toLocaleString("en-IN")} TCD</span>}
                  </div>
                  {f.phone && (
                    <a href={`tel:${f.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: "#2563EB", textDecoration: "none" }}>
                      <Phone size={11} /> {f.phone}
                    </a>
                  )}
                </div>
                {latest && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>Season {latest.season}</div>
                    {latest.totalArrears != null && latest.totalArrears > 0 && (
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#DC2626", fontFamily: "var(--font-mono)" }}>₹{(latest.totalArrears / 10000000).toFixed(2)}Cr arrears</div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 600, color: latest.status === "completed" ? "#16A34A" : "#D97706", marginTop: 4 }}>{latest.status.toUpperCase()}</div>
                  </div>
                )}
              </div>
              {f.seasonData.length > 0 && (
                <div style={{ marginTop: 14, borderTop: "1px solid #F5F5F0", paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Season Data</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr>{["Season", "Cane Crushed (MT)", "Recovery %", "FRP Rate", "SAP Rate", "Arrears (Cr)", "Farmers"].map((h) => (
                          <th key={h} style={{ padding: "4px 10px", textAlign: "right", color: "#9B9B9B", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {f.seasonData.map((s) => (
                          <tr key={s.id} style={{ borderTop: "1px solid #F5F5F0" }}>
                            <td style={{ padding: "6px 10px", fontWeight: 600 }}>{s.season}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.totalCaneCrushed?.toLocaleString("en-IN") ?? "—"}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.recoveryPct ? `${s.recoveryPct}%` : "—"}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.frpRate ? `₹${s.frpRate}` : "—"}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.sapRate ? `₹${s.sapRate}` : "—"}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)", color: (s.totalArrears ?? 0) > 0 ? "#DC2626" : "#16A34A", fontWeight: 700 }}>{s.totalArrears ? `₹${(s.totalArrears / 10000000).toFixed(2)}Cr` : "—"}</td>
                            <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.farmersCount?.toLocaleString("en-IN") ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── IT Parks (Bengaluru Urban) ────────────────────────────
function TechView({ district, state }: { district: string; state: string }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const itParks = industries.filter((i) => i.category === "IT Park");
  const startupStats = industries.find((i) => i.category === "Startup Ecosystem");

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Startup ecosystem stats banner */}
      {startupStats && (
        <div style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)", border: "1px solid #DBEAFE", borderRadius: 12, padding: 18, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} style={{ color: "#2563EB" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Bengaluru Startup Ecosystem</span>
            <span style={{ fontSize: 11, color: "#9B9B9B" }}>NASSCOM / Inc42 2025</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { label: "Active Startups", value: "13,000+", icon: "🚀" },
              { label: "Unicorns", value: "50+", icon: "🦄" },
              { label: "Total Funding", value: "$45B+", icon: "💰" },
              { label: "Tech Workforce", value: "1.5M+", icon: "👩‍💻" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#FFF", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6B6B6B" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionLabel>IT Parks & Tech Clusters ({itParks.length})</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {itParks.map((p) => {
          const d = p.details ?? {};
          return (
            <div key={p.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={20} style={{ color: "#2563EB" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{p.name}</div>
                  {p.location && (
                    <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} />{p.location}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                {d.area && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>Area</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>{d.area} acres</div>
                </div>}
                {d.companies && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>Companies</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>{d.companies}+</div>
                </div>}
                {d.employees && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>Employees</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono)" }}>{(Number(d.employees) / 1000).toFixed(0)}K+</div>
                </div>}
                {d.builtUpArea && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 11, color: "#9B9B9B" }}>Built-up</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>{d.builtUpArea} MSF</div>
                </div>}
              </div>
              {d.keyTenants && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6B6B6B" }}>
                  <span style={{ fontWeight: 600 }}>Key Tenants: </span>{d.keyTenants}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Heritage & Tourism (Mysuru) ───────────────────────────
function HeritageView({ district, state }: { district: string; state: string }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const heritage = industries.filter((i) => i.category === "Heritage" || i.category === "Tourism");
  const manufacturing = industries.filter((i) => i.category === "Manufacturing");

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Dasara banner */}
      <div style={{ background: "linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)", border: "1px solid #FDE68A", borderRadius: 12, padding: 18, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Star size={18} style={{ color: "#D97706" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>Mysuru Dasara — World Famous Cultural Festival</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "Dasara Footfall", value: "5M+", icon: "🎪" },
            { label: "Festival Budget", value: "₹50Cr", icon: "💰" },
            { label: "Mysore Palace Visitors/yr", value: "6M+", icon: "🏰" },
            { label: "Cleanest City Awards", value: "#1", icon: "🏆" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#FFF", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#D97706", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#6B6B6B" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Heritage & Tourism Sites */}
      <SectionLabel>Heritage & Tourism Sites ({heritage.length})</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginBottom: 28 }}>
        {heritage.map((p) => {
          const d = p.details ?? {};
          return (
            <div key={p.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "#FEF3C7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Camera size={20} style={{ color: "#D97706" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>{p.type}</div>
                </div>
              </div>
              {(d.visitorsPerYear || d.revenue || d.entryfee) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  {d.visitorsPerYear && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>Annual Visitors</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono)" }}>{d.visitorsPerYear}</div>
                  </div>}
                  {d.revenue && <div style={{ background: "#FAFAF8", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>Annual Revenue</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#16A34A", fontFamily: "var(--font-mono)" }}>{d.revenue}</div>
                  </div>}
                </div>
              )}
              {d.description && <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 10 }}>{d.description}</div>}
            </div>
          );
        })}
      </div>

      {/* Manufacturing */}
      {manufacturing.length > 0 && (
        <>
          <SectionLabel>Major Manufacturing & Industries</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {manufacturing.map((p) => {
              const d = p.details ?? {};
              return (
                <div key={p.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, background: "#F0FDF4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Factory size={18} style={{ color: "#16A34A" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#9B9B9B" }}>{p.type}</div>
                    </div>
                  </div>
                  {d.established && <div style={{ fontSize: 12, color: "#6B6B6B" }}>Est. {d.established}</div>}
                  {d.employees && <div style={{ fontSize: 12, color: "#6B6B6B" }}>Employees: {d.employees}</div>}
                  {d.description && <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 6 }}>{d.description}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ── General Industries View (Hyderabad, etc.) ───────────
function GeneralView({ district, state }: { district: string; state: string }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;
  if (industries.length === 0) return <p style={{ color: "#9B9B9B", fontSize: 14 }}>No industry data available for this district yet.</p>;

  return (
    <>
      <SectionLabel>Major Industries & Business Hubs ({industries.length})</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {industries.map((p) => {
          const d = p.details ?? {};
          return (
            <div key={p.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={20} style={{ color: "#2563EB" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>{p.name}</div>
                  {p.type && <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>{p.type}</div>}
                  {p.location && (
                    <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} />{p.location}
                    </div>
                  )}
                </div>
              </div>
              {d.employees && (
                <div style={{ marginTop: 12, background: "#FAFAF8", borderRadius: 8, padding: "8px 12px", display: "inline-block" }}>
                  <span style={{ fontSize: 11, color: "#9B9B9B" }}>Employees: </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono)" }}>{Number(d.employees) >= 1000 ? `${(Number(d.employees) / 1000).toFixed(0)}K+` : d.employees}</span>
                </div>
              )}
              {d.description && <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 10, lineHeight: 1.5 }}>{d.description}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IndustriesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const meta = getIndustryMeta(district);
  const Icon = meta.icon;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Icon} title={meta.title} description={meta.description} backHref={base} />
      {(() => { const _src = getModuleSources("industries", state); return <DataSourceBanner moduleName="industries" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="industries" district={district} />
      {meta.mode === "sugar" && <SugarView district={district} state={state} />}
      {meta.mode === "tech" && <TechView district={district} state={state} />}
      {meta.mode === "heritage" && <HeritageView district={district} state={state} />}
      {meta.mode === "general" && <GeneralView district={district} state={state} />}
    </div>
  );
}
