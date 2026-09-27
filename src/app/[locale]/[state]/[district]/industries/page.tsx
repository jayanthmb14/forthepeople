/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local Industries — module page (Design v3 "Civic Ledger", CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//  One page, four views chosen by district (unchanged from v2):
//    sugar    → sugar factories + crushing seasons + farmer arrears (Mandya …)
//    tech     → IT parks + startup ecosystem (Bengaluru Urban)
//    heritage → heritage / tourism sites + manufacturing (Mysuru)
//    general  → any other district, from the LocalIndustry table
//  Each view fetches its own data (same hooks as before) and reports two
//  things up to the page through `onData`: the newest `updatedAt` (for the
//  FreshnessPill in the header) and the rows for the CSV download.
//  Presentation: PageHeader → StatStrip → Sections of Cards / DataTable →
//  SourcesFooter → Toolbar. No gradients, shadows, emoji or hex colours.
"use client";

import { use, useEffect, useState } from "react";
import {
  ArrowLeftRight, Building2, Camera, Cpu, Download, Factory, Landmark, MapPin, Phone, Share2, Star, TrendingUp,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFactories, useLocalIndustries } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  DataTable,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

interface LocalIndustry {
  id: string;
  name: string;
  category?: string | null;
  location?: string | null;
  type?: string | null;
  phone?: string | null;
  details?: Record<string, string | number | null | undefined> | null;
  updatedAt?: string | null;
}

/** One CSV row. */
type CsvRow = Record<string, string | number | null | undefined>;
/** What each view reports to the page: freshness date + CSV rows. */
type ViewData = { asOf: string | null; rows: CsvRow[] };

const CRORE = 10_000_000;

/** The newest `updatedAt` among rows (the API sends it with every row). */
function latestUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
  }
  return best;
}

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Small building blocks shared by the views ─────────────

/** 40 px icon square used at the top of each card (module accent tint). */
function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  const accent = getModuleAccent("industries");
  return (
    <div
      aria-hidden
      style={{
        width: 40, height: 40, borderRadius: "var(--ftp-radius-tile)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `color-mix(in srgb, var(--accent-${accent}-700) 10%, transparent)`,
        color: `var(--accent-${accent}-700)`,
      }}
    >
      <Icon size={20} />
    </div>
  );
}

/** A label + mono value pair inside a card ("Area · 120 acres"). */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{value}</div>
    </div>
  );
}

/** Responsive card grid that never forces horizontal scroll on a 375 px phone. */
function CardList({ min = 300, children }: { min?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap: 12 }}>
      {children}
    </div>
  );
}

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
function SugarView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useFactories(district, state);
  const factories = data?.data ?? [];
  const totalArrears = factories.reduce((s, f) => s + (f.seasonData[0]?.totalArrears ?? 0), 0);
  const totalFarmers = factories.reduce((s, f) => s + (f.seasonData[0]?.farmersCount ?? 0), 0);
  const asOf = latestUpdatedAt(factories as Array<{ updatedAt?: string | null }>);
  const latestSeason = factories.map((f) => f.seasonData[0]?.season).filter(Boolean).sort().pop();

  useEffect(() => {
    if (!data) return;
    onData({
      asOf,
      rows: factories.flatMap((f) =>
        f.seasonData.map((s) => ({
          factory: f.name,
          location: f.location,
          season: s.season,
          cane_crushed_mt: s.totalCaneCrushed ?? "",
          recovery_pct: s.recoveryPct ?? "",
          frp_rate: s.frpRate ?? "",
          sap_rate: s.sapRate ?? "",
          arrears_cr: s.totalArrears ? (s.totalArrears / CRORE).toFixed(2) : "",
          farmers: s.farmersCount ?? "",
          status: s.status,
        }))
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={4} />;
  if (error) return <ErrorBlock />;
  if (factories.length === 0) {
    return <EmptyState title="No sugar factory data yet for this district." body="We add factories and crushing seasons as the District Industries Centre publishes them." />;
  }

  return (
    <>
      <StatStrip cols={3}>
        <StatTile icon={Factory} label="Sugar factories" value={factories.length} asOf={asOf} />
        <StatTile
          icon={AlertTriangle}
          label="Total Pending Arrears"
          value={totalArrears > 0 ? (totalArrears / CRORE).toFixed(2) : "—"}
          unit={totalArrears > 0 ? "₹ Crore" : undefined}
          sub={latestSeason ? `Payments due to sugarcane farmers · Season ${latestSeason}` : "Payments due to sugarcane farmers"}
          asOf={asOf}
        />
        <StatTile label="Farmers" value={totalFarmers ? totalFarmers.toLocaleString("en-IN") : "—"} sub={latestSeason ? `Season ${latestSeason}` : undefined} asOf={asOf} />
      </StatStrip>

      <div style={{ marginTop: 24 }}>
        <Section title={<>Sugar Factories (<span className="ftp-num">{factories.length}</span>)</>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {factories.map((f) => {
              const latest = f.seasonData[0];
              return (
                <Card key={f.id} as="article">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CardIcon icon={Factory} />
                        <div style={{ minWidth: 0 }}>
                          <h3 className="ftp-title">{f.name}</h3>
                          {f.nameLocal && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{f.nameLocal}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} aria-hidden />{f.location}{f.taluk && ` · ${f.taluk}`}</span>
                        <span>{f.type}</span>
                        {f.capacity && <span>Cap: <span className="ftp-num">{f.capacity.toLocaleString("en-IN")}</span> TCD</span>}
                      </div>
                      {f.phone && (
                        <a href={`tel:${f.phone}`} className="ftp-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}>
                          <Phone size={14} aria-hidden /> <span className="ftp-num">{f.phone}</span>
                        </a>
                      )}
                    </div>
                    {latest && (
                      <div style={{ textAlign: "right" }}>
                        <div className="ftp-label">Season {latest.season}</div>
                        {latest.totalArrears != null && latest.totalArrears > 0 && (
                          <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-danger)" }}>₹{(latest.totalArrears / CRORE).toFixed(2)}Cr arrears</div>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Pill tone={latest.status === "completed" ? "live" : "warn"} dot>{latest.status.toUpperCase()}</Pill>
                        </div>
                      </div>
                    )}
                  </div>
                  {f.seasonData.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div className="ftp-label" style={{ marginBottom: 8 }}>Season Data</div>
                      <DataTable
                        dense
                        caption={`Crushing seasons for ${f.name}`}
                        columns={[
                          { key: "season", label: "Season" },
                          { key: "cane", label: "Cane Crushed (MT)", numeric: true },
                          { key: "rec", label: "Recovery %", numeric: true },
                          { key: "frp", label: "FRP Rate", numeric: true },
                          { key: "sap", label: "SAP Rate", numeric: true },
                          { key: "arrears", label: "Arrears (Cr)", numeric: true },
                          { key: "farmers", label: "Farmers", numeric: true },
                        ]}
                        rows={f.seasonData.map((s) => ({
                          season: s.season,
                          cane: s.totalCaneCrushed?.toLocaleString("en-IN") ?? "—",
                          rec: s.recoveryPct ? `${s.recoveryPct}%` : "—",
                          frp: s.frpRate ? `₹${s.frpRate}` : "—",
                          sap: s.sapRate ? `₹${s.sapRate}` : "—",
                          // Unpaid arrears are the one number we colour: danger text.
                          arrears: (
                            <span style={{ color: (s.totalArrears ?? 0) > 0 ? "var(--ftp-danger)" : "var(--ftp-text)" }}>
                              {s.totalArrears ? `₹${(s.totalArrears / CRORE).toFixed(2)}Cr` : "—"}
                            </span>
                          ),
                          farmers: s.farmersCount?.toLocaleString("en-IN") ?? "—",
                        }))}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      </div>
    </>
  );
}

// ── IT Parks (Bengaluru Urban) ────────────────────────────
function TechView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const itParks = industries.filter((i) => i.category === "IT Park");
  const startupStats = industries.find((i) => i.category === "Startup Ecosystem");

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: itParks.map((p) => ({
        name: p.name,
        location: p.location ?? "",
        area_acres: p.details?.area ?? "",
        companies: p.details?.companies ?? "",
        employees: p.details?.employees ?? "",
        built_up_msf: p.details?.builtUpArea ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Startup ecosystem figures (published estimates, NASSCOM / Inc42 2025) */}
      {startupStats && (
        <div style={{ marginBottom: 24 }}>
          <Section
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                Bengaluru Startup Ecosystem
              </span>
            }
          >
            <StatStrip cols={4}>
              <StatTile label="Active Startups" value="13,000+" sub="NASSCOM / Inc42 2025" />
              <StatTile label="Unicorns" value="50+" sub="NASSCOM / Inc42 2025" />
              <StatTile label="Total Funding" value="$45B+" sub="NASSCOM / Inc42 2025" />
              <StatTile label="Tech Workforce" value="1.5M+" sub="NASSCOM / Inc42 2025" />
            </StatStrip>
          </Section>
        </div>
      )}

      <Section title={<>IT Parks &amp; Tech Clusters (<span className="ftp-num">{itParks.length}</span>)</>}>
        {itParks.length === 0 ? (
          <EmptyState title="No IT park data yet for this district." />
        ) : (
          <CardList min={320}>
            {itParks.map((p) => {
              const d = p.details ?? {};
              return (
                <Card key={p.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CardIcon icon={Building2} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="ftp-title">{p.name}</h3>
                      {p.location && (
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={12} aria-hidden />{p.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                    {d.area && <Fact label="Area" value={`${d.area} acres`} />}
                    {d.companies && <Fact label="Companies" value={`${d.companies}+`} />}
                    {d.employees && <Fact label="Employees" value={`${(Number(d.employees) / 1000).toFixed(0)}K+`} />}
                    {d.builtUpArea && <Fact label="Built-up" value={`${d.builtUpArea} MSF`} />}
                  </div>
                  {d.keyTenants && (
                    <div className="ftp-body" style={{ marginTop: 10, color: "var(--ftp-text-2)" }}>
                      <span style={{ fontWeight: 500, color: "var(--ftp-text)" }}>Key Tenants: </span>{d.keyTenants}
                    </div>
                  )}
                </Card>
              );
            })}
          </CardList>
        )}
      </Section>
    </>
  );
}

// ── Heritage & Tourism (Mysuru) ───────────────────────────
function HeritageView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const heritage = industries.filter((i) => i.category === "Heritage" || i.category === "Tourism");
  const manufacturing = industries.filter((i) => i.category === "Manufacturing");

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: [...heritage, ...manufacturing].map((p) => ({
        name: p.name,
        category: p.category ?? "",
        type: p.type ?? "",
        visitors_per_year: p.details?.visitorsPerYear ?? "",
        revenue: p.details?.revenue ?? "",
        employees: p.details?.employees ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Dasara figures — published estimates */}
      <div style={{ marginBottom: 24 }}>
        <Section
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Star size={18} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
              Mysuru Dasara — World Famous Cultural Festival
            </span>
          }
        >
          <StatStrip cols={4}>
            <StatTile label="Dasara Footfall" value="5M+" />
            <StatTile label="Festival Budget" value="₹50Cr" />
            <StatTile label="Mysore Palace Visitors/yr" value="6M+" />
            <StatTile label="Cleanest City Awards" value="#1" />
          </StatStrip>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
            Figures as widely reported. We are adding the source and year for each one.
          </p>
        </Section>
      </div>

      {/* Heritage & Tourism Sites */}
      <Section title={<>Heritage &amp; Tourism Sites (<span className="ftp-num">{heritage.length}</span>)</>}>
        {heritage.length === 0 ? (
          <EmptyState title="No heritage or tourism sites listed yet." />
        ) : (
          <CardList>
            {heritage.map((p) => {
              const d = p.details ?? {};
              return (
                <Card key={p.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CardIcon icon={Camera} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="ftp-title">{p.name}</h3>
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>{p.type}</div>
                    </div>
                  </div>
                  {(d.visitorsPerYear || d.revenue || d.entryfee) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      {d.visitorsPerYear && <Fact label="Annual Visitors" value={d.visitorsPerYear} />}
                      {d.revenue && <Fact label="Annual Revenue" value={d.revenue} />}
                    </div>
                  )}
                  {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 10 }}>{d.description}</div>}
                </Card>
              );
            })}
          </CardList>
        )}
      </Section>

      {/* Manufacturing */}
      {manufacturing.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Section title="Major Manufacturing & Industries">
            <CardList>
              {manufacturing.map((p) => {
                const d = p.details ?? {};
                return (
                  <Card key={p.id} as="article">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <CardIcon icon={Factory} />
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{p.name}</h3>
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{p.type}</div>
                      </div>
                    </div>
                    {d.established && <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Est. <span className="ftp-num">{d.established}</span></div>}
                    {d.employees && <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Employees: <span className="ftp-num">{d.employees}</span></div>}
                    {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>{d.description}</div>}
                  </Card>
                );
              })}
            </CardList>
          </Section>
        </div>
      )}
    </>
  );
}

// ── General Industries View (Hyderabad, etc.) ───────────
function GeneralView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: industries.map((p) => ({
        name: p.name,
        category: p.category ?? "",
        type: p.type ?? "",
        location: p.location ?? "",
        employees: p.details?.employees ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;
  if (industries.length === 0) return <EmptyState title="No industry data available for this district yet." />;

  return (
    <Section title={<>Major Industries &amp; Business Hubs (<span className="ftp-num">{industries.length}</span>)</>}>
      <CardList min={320}>
        {industries.map((p) => {
          const d = p.details ?? {};
          return (
            <Card key={p.id} as="article">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CardIcon icon={Building2} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="ftp-title">{p.name}</h3>
                  {p.type && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>{p.type}</div>}
                  {p.location && (
                    <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} aria-hidden />{p.location}
                    </div>
                  )}
                </div>
              </div>
              {d.employees && (
                <div style={{ marginTop: 12 }}>
                  <Fact label="Employees" value={Number(d.employees) >= 1000 ? `${(Number(d.employees) / 1000).toFixed(0)}K+` : d.employees} />
                </div>
              )}
              {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 10 }}>{d.description}</div>}
            </Card>
          );
        })}
      </CardList>
    </Section>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IndustriesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const meta = getIndustryMeta(district);
  const Icon = meta.icon;
  const src = getModuleSources("industries", state);
  // Filled in by whichever view is showing (see ViewData above).
  const [view, setView] = useState<ViewData>({ asOf: null, rows: [] });
  const [shareNote, setShareNote] = useState<string | null>(null);

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: meta.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Icon}
        accent={getModuleAccent("industries")}
        title={meta.title}
        description={meta.description}
        backHref={base}
        freshness={view.asOf ? { asOf: view.asOf } : undefined}
        source={{ label: "District Industries Centre" }}
      />
      <AIInsightCard module="industries" district={district} />
      {meta.mode === "sugar" && <SugarView district={district} state={state} onData={setView} />}
      {meta.mode === "tech" && <TechView district={district} state={state} onData={setView} />}
      {meta.mode === "heritage" && <HeritageView district={district} state={state} onData={setView} />}
      {meta.mode === "general" && <GeneralView district={district} state={state} onData={setView} />}

      <SourcesFooter sources={src.sources.map((name) => ({ name, frequency: src.frequency }))} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <Toolbar>
        <ToolbarButton icon={Download} onClick={() => downloadCsv(`${district}-industries.csv`, view.rows)} disabled={view.rows.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=industries&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
