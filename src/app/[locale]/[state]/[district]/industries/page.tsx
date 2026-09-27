/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local Industries — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  One page, four views chosen by district (unchanged from v2):
//    sugar    → sugar factories + crushing seasons + farmer arrears (Mandya …)
//    tech     → IT parks + startup ecosystem (Bengaluru Urban)
//    heritage → heritage / tourism sites + manufacturing (Mysuru)
//    general  → any other district, from the LocalIndustry table
//  Each view fetches its own data (same hooks as before) and reports two
//  things up to the page through `onData`: the newest `updatedAt` (for the
//  FreshnessPill in the header) and the rows for the CSV download.
//  Presentation: PageHeader → emoji StatStrip → the picture (an explainer
//  in plain words, plus a factory pictogram or a ChartCard built from the
//  rows the view already has) → Sections of Cards / DataTable →
//  SourcesFooter → Toolbar. Colours come from the module hue (--hue…).
"use client";

import { use, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  ArrowLeftRight, Building2, Camera, Cpu, Download, Factory, Landmark, MapPin, Phone, Share2,
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
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
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

/** Where the rows on this page come from (same label as the header pill). */
const SOURCE = { label: "District Industries Centre" };

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

/** "completed" → "Completed" (status words arrive in lower case). */
function sentenceCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** Cut long names for a chart axis; the tooltip keeps the full name. */
function shortName(s: string, max = 22): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── Small building blocks shared by the views ─────────────

/** 40 px icon chip at the top of each card, in the module hue. */
function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="ftp-icon-chip" aria-hidden style={{ width: 40, height: 40, borderRadius: 12 }}>
      <Icon size={20} />
    </span>
  );
}

/** A label + number pair inside a card ("Area" over "120 acres"). */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>{value}</div>
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

/**
 * A horizontal bar chart in the module hue, inside a ChartCard.
 * Rows are { name (full), label (axis), value }.
 */
function HueBarChart({
  rows,
  valueName,
  format,
}: {
  rows: Array<{ name: string; label: string; value: number }>;
  valueName: string;
  format: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
        <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => format(Number(v))} />
        <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={150} interval={0} />
        <Tooltip
          formatter={(v) => [format(Number(v)), valueName]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "var(--hue-tint)" }}
        />
        <Bar dataKey="value" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={valueName} />
      </BarChart>
    </ResponsiveContainer>
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

  // The picture: one factory symbol per factory whose latest season has a
  // recorded arrears figure; lit when that figure is above zero.
  const withArrearsFigure = factories.filter((f) => f.seasonData[0]?.totalArrears != null);
  const owing = withArrearsFigure.filter((f) => (f.seasonData[0]?.totalArrears ?? 0) > 0);
  const pictoTotal = withArrearsFigure.length <= 12 ? withArrearsFigure.length : 10;
  const pictoFilled = withArrearsFigure.length <= 12
    ? owing.length
    : withArrearsFigure.length > 0 ? (owing.length / withArrearsFigure.length) * 10 : 0;
  // Chart rows: latest-season arrears per factory, largest first.
  const arrearsChart = owing
    .map((f) => ({ name: f.name, label: shortName(f.name), value: Number(((f.seasonData[0]?.totalArrears ?? 0) / CRORE).toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

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
    return <EmptyState emoji="🏭" title="No sugar factory data yet for this district." body="We add factories and crushing seasons as the District Industries Centre publishes them." />;
  }

  return (
    <>
      <StatStrip cols={3}>
        <StatTile emoji="🏭" label="Sugar factories" value={factories.length} asOf={asOf} />
        <StatTile
          emoji="💸"
          label="Total pending arrears"
          value={totalArrears > 0 ? (totalArrears / CRORE).toFixed(2) : "—"}
          unit={totalArrears > 0 ? "₹ Crore" : undefined}
          sub={latestSeason ? `Payments due to sugarcane farmers, season ${latestSeason}` : "Payments due to sugarcane farmers"}
          asOf={asOf}
        />
        <StatTile emoji="🌾" label="Farmers" value={totalFarmers ? totalFarmers.toLocaleString("en-IN") : "—"} sub={latestSeason ? `Season ${latestSeason}` : undefined} asOf={asOf} />
      </StatStrip>

      {/* The picture: who still owes farmers money. Needs at least two
          factories with a recorded arrears figure. */}
      {withArrearsFigure.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer>
              {totalArrears > 0 ? (
                <>
                  Sugar factories here still owe sugarcane farmers about{" "}
                  <strong className="ftp-num">₹{(totalArrears / CRORE).toFixed(2)} crore</strong> from their latest crushing
                  season. <strong className="ftp-num">{owing.length}</strong> of the{" "}
                  <strong className="ftp-num">{withArrearsFigure.length}</strong> factories with a recorded figure have not
                  paid in full.
                </>
              ) : (
                <>
                  None of the <strong className="ftp-num">{withArrearsFigure.length}</strong> factories with a recorded figure
                  shows unpaid money to farmers for its latest crushing season.
                </>
              )}
            </Explainer>
            <Pictogram
              total={pictoTotal}
              filled={pictoFilled}
              emoji="🏭"
              label={
                withArrearsFigure.length <= 12
                  ? `${owing.length} of ${withArrearsFigure.length} factories still owe farmers money for their latest season.`
                  : `About ${Math.round(pictoFilled)} of every 10 factories still owe farmers money for their latest season.`
              }
            />
          </Card>
        </div>
      )}

      {arrearsChart.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title="Money still owed to farmers, by factory"
            emoji="💸"
            units="Pending arrears for each factory's latest crushing season, in crore rupees"
            simple={
              <>
                <strong>{arrearsChart[0].name}</strong> owes the most:{" "}
                <span className="ftp-num">₹{arrearsChart[0].value.toFixed(2)} Cr</span>.
              </>
            }
            legend={[{ label: "Pending arrears", swatch: "var(--hue)" }]}
            source={SOURCE}
            asOf={asOf}
            table={arrearsChart.map((r) => ({ label: r.name, value: `₹${r.value.toFixed(2)} Cr` }))}
          >
            <HueBarChart rows={arrearsChart} valueName="Pending arrears" format={(v) => `₹${v.toLocaleString("en-IN")} Cr`} />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏭" title={<>Sugar factories (<span className="ftp-num">{factories.length}</span>)</>}>
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
                        {f.nameLocal && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)" }}>{f.nameLocal}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
                        {f.location}{f.taluk && `, ${f.taluk}`}
                      </span>
                      <span>{f.type}</span>
                      {f.capacity && <span>Cap: <span className="ftp-num">{f.capacity.toLocaleString("en-IN")}</span> TCD</span>}
                    </div>
                    {f.phone && (
                      <a href={`tel:${f.phone}`} className="ftp-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}>
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
                        <Pill tone={latest.status === "completed" ? "live" : "warn"} dot>{sentenceCase(latest.status)}</Pill>
                      </div>
                    </div>
                  )}
                </div>
                {f.seasonData.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="ftp-label" style={{ marginBottom: 8 }}>Season data</div>
                    <DataTable
                      dense
                      caption={`Crushing seasons for ${f.name}`}
                      columns={[
                        { key: "season", label: "Season" },
                        { key: "cane", label: "Cane crushed (MT)", numeric: true },
                        { key: "rec", label: "Recovery %", numeric: true },
                        { key: "frp", label: "FRP rate", numeric: true },
                        { key: "sap", label: "SAP rate", numeric: true },
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
    </>
  );
}

// ── IT Parks (Bengaluru Urban) ────────────────────────────
function TechView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const itParks = industries.filter((i) => i.category === "IT Park");
  const startupStats = industries.find((i) => i.category === "Startup Ecosystem");
  const asOf = latestUpdatedAt(industries);

  // Chart rows: people working in each park that reports a number.
  const workforceChart = itParks
    .map((p) => ({ name: p.name, label: shortName(p.name), value: Number(p.details?.employees) }))
    .filter((r) => Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.value - a.value);
  const workforceTotal = workforceChart.reduce((s, r) => s + r.value, 0);

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
        <Section emoji="🚀" title="Bengaluru startup ecosystem">
          <StatStrip cols={4}>
            <StatTile emoji="🚀" label="Active startups" value="13,000+" sub="NASSCOM / Inc42 2025" />
            <StatTile emoji="🦄" label="Unicorns" value="50+" sub="NASSCOM / Inc42 2025" />
            <StatTile emoji="💵" label="Total funding" value="$45B+" sub="NASSCOM / Inc42 2025" />
            <StatTile emoji="💻" label="Tech workforce" value="1.5M+" sub="NASSCOM / Inc42 2025" />
          </StatStrip>
        </Section>
      )}

      {/* The picture: how many people work in the listed IT parks, and in
          which ones. Only parks that report an employee count are counted. */}
      {workforceChart.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <Explainer>
            The <strong className="ftp-num">{workforceChart.length}</strong> IT parks below that report their workforce have
            about <strong className="ftp-num">{workforceTotal.toLocaleString("en-IN")}</strong> people working in them. The
            biggest is <strong>{workforceChart[0].name}</strong>.
          </Explainer>
          <ChartCard
            title="People working in each IT park"
            emoji="👥"
            units="Employees reported for each park"
            simple={
              <>
                <strong>{workforceChart[0].name}</strong> has about{" "}
                <span className="ftp-num">{workforceChart[0].value.toLocaleString("en-IN")}</span> people at work.
              </>
            }
            legend={[{ label: "Employees", swatch: "var(--hue)" }]}
            source={SOURCE}
            asOf={asOf}
            table={workforceChart.map((r) => ({ label: r.name, value: r.value.toLocaleString("en-IN") }))}
          >
            <HueBarChart rows={workforceChart} valueName="Employees" format={(v) => v.toLocaleString("en-IN")} />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏢" title={<>IT parks and tech clusters (<span className="ftp-num">{itParks.length}</span>)</>}>
        {itParks.length === 0 ? (
          <EmptyState emoji="🏢" title="No IT park data yet for this district." />
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
                          <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />{p.location}
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
                      <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>Key tenants: </span>{d.keyTenants}
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
      <Section emoji="🐘" title="Mysuru Dasara, a world-famous cultural festival">
        <StatStrip cols={4}>
          <StatTile emoji="👥" label="Dasara footfall" value="5M+" />
          <StatTile emoji="💰" label="Festival budget" value="₹50Cr" />
          <StatTile emoji="🏰" label="Mysore Palace visitors a year" value="6M+" />
          <StatTile emoji="🧹" label="Cleanest city awards" value="#1" />
        </StatStrip>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
          Figures as widely reported. We are adding the source and year for each one.
        </p>
      </Section>

      {/* The picture in words: what this page lists, counted from the rows. */}
      {heritage.length + manufacturing.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Explainer>
            This page lists <strong className="ftp-num">{heritage.length}</strong> heritage and tourism{" "}
            {heritage.length === 1 ? "site" : "sites"} and <strong className="ftp-num">{manufacturing.length}</strong> major{" "}
            {manufacturing.length === 1 ? "factory or industry" : "factories and industries"} in this district.
          </Explainer>
        </div>
      )}

      {/* Heritage & Tourism Sites */}
      <Section emoji="🏛️" title={<>Heritage and tourism sites (<span className="ftp-num">{heritage.length}</span>)</>}>
        {heritage.length === 0 ? (
          <EmptyState emoji="🏛️" title="No heritage or tourism sites listed yet." />
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
                      {d.visitorsPerYear && <Fact label="Visitors a year" value={d.visitorsPerYear} />}
                      {d.revenue && <Fact label="Revenue a year" value={d.revenue} />}
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
        <Section emoji="🏭" title="Major manufacturing and industries">
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
      )}
    </>
  );
}

// ── General Industries View (Hyderabad, etc.) ───────────
function GeneralView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const asOf = latestUpdatedAt(industries);

  // Chart rows: how many listed industries fall in each category.
  const byCategory = new Map<string, number>();
  for (const p of industries) {
    const c = p.category?.trim() || "Other";
    byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
  }
  const categoryChart = [...byCategory.entries()]
    .map(([name, value]) => ({ name, label: shortName(name), value }))
    .sort((a, b) => b.value - a.value);

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
  if (industries.length === 0) return <EmptyState emoji="🏭" title="No industry data available for this district yet." />;

  return (
    <>
      {/* The picture: what kinds of industry this district has, counted
          from the listed rows. Only when there is more than one kind. */}
      {categoryChart.length >= 2 && (
        <div style={{ marginBottom: 8 }}>
          <Explainer>
            This page lists <strong className="ftp-num">{industries.length}</strong> major industries and business hubs. The most
            common kind is <strong>{categoryChart[0].name}</strong>, with{" "}
            <strong className="ftp-num">{categoryChart[0].value}</strong> of them.
          </Explainer>
          <ChartCard
            title="Industries by kind"
            emoji="📊"
            units="Number of listed industries and business hubs in each category"
            simple={
              <>
                <span className="ftp-num">{categoryChart[0].value}</span> of{" "}
                <span className="ftp-num">{industries.length}</span> are <strong>{categoryChart[0].name}</strong>.
              </>
            }
            legend={[{ label: "Listed industries", swatch: "var(--hue)" }]}
            source={SOURCE}
            asOf={asOf}
            table={categoryChart.map((r) => ({ label: r.name, value: r.value.toLocaleString("en-IN") }))}
          >
            <HueBarChart rows={categoryChart} valueName="Listed industries" format={(v) => v.toLocaleString("en-IN")} />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏢" title={<>Major industries and business hubs (<span className="ftp-num">{industries.length}</span>)</>}>
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
                        <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />{p.location}
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
    </>
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
        source={SOURCE}
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
