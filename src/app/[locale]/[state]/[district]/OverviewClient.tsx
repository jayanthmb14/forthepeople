/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Overview Client Dashboard
// ═══════════════════════════════════════════════════════════
"use client";

import Link from "next/link";
import {
  MapPin, Users, TreePine, Percent, Activity,
  BarChart3, Cloud,
  Shield, ScrollText, AlertTriangle, HardHat, TrendingUp, Newspaper,
} from "lucide-react";
import {
  useOverview, useCropPrices, useWeather, useWater,
  useAlerts, useInfrastructure, useBudget, usePolice, useNews,
} from "@/hooks/useRealtimeData";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { StatCard, SectionLabel, CardGrid, LoadingShell, LiveBadge, SeverityBadge } from "@/components/district/ui";
import EmptyState from "@/components/district/EmptyState";
import AIInsightCard from "@/components/common/AIInsightCard";
import { DistrictHealthScoreCard } from "@/components/district/DistrictHealthScoreCard";
import DistrictSponsorBanner from "@/components/common/DistrictSponsorBanner";
import { getStateConfig } from "@/lib/constants/state-config";
import DistrictHeroIllustration from "@/components/district/DistrictHeroIllustration";
import InfraSnippet from "@/components/district/InfraSnippet";
import LeadersSnippet from "@/components/district/LeadersSnippet";
import PopulationSnippet from "@/components/district/PopulationSnippet";
import TenderSnippet from "@/components/district/TenderSnippet";
import LiveElectionBanner from "@/components/district/LiveElectionBanner";
import type { DistrictBadge } from "@/lib/constants/districts";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  stateName: string;
  districtData: {
    name: string;
    nameLocal?: string;
    tagline?: string;
    population?: number | null;
    area?: number | null;
    talukCount?: number;
    villageCount?: number | null;
    literacy?: number | null;
    sexRatio?: number | null;
    active: boolean;
    badges?: DistrictBadge[];
    taluks: Array<{ slug: string; name: string; nameLocal?: string; tagline?: string }>;
  };
}

// ── Module categories for the overview grid ──────────────
const MODULE_CATEGORIES = [
  {
    label: "📊 Live Data",
    slugs: ["crops", "weather", "water", "population", "police"],
  },
  {
    label: "🏛️ Governance & Services",
    slugs: ["leadership", "finance", "schemes", "services", "elections"],
  },
  {
    label: "🏘️ Community & Infrastructure",
    slugs: ["transport", "jjm", "housing", "power", "schools"],
  },
  {
    label: "📜 Transparency & Rights",
    slugs: ["rti", "file-rti", "gram-panchayat", "courts", "health"],
  },
  {
    label: "🤝 Local Info",
    slugs: ["alerts", "offices", "citizen-corner", "famous-personalities", "news"],
  },
  {
    label: "🏭 Local Economy",
    slugs: ["industries", "farm", "map", "data-sources", "responsibility"],
  },
];

// Modules with live/frequently-updated data
const LIVE_MODULES = new Set(["crops", "weather", "water", "news", "alerts", "power"]);

const CATEGORY_COLORS: Record<string, string> = {
  agriculture: "#16A34A",
  water: "#2563EB",
  politics: "#7C3AED",
  crime: "#DC2626",
  health: "#D97706",
  education: "#0891B2",
  infrastructure: "#D97706",
  weather: "#0891B2",
  economy: "#16A34A",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OverviewClient({ locale, stateSlug, districtSlug, stateName, districtData }: Props) {
  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const stateConfig = getStateConfig(stateSlug);
  const { data: overview } = useOverview(districtSlug, stateSlug);
  const dbTalukCount = overview?.data?.taluks?.length;
  const displayedTalukCount = dbTalukCount ?? districtData.talukCount;
  const { data: crops, isLoading: cropsLoading } = useCropPrices(districtSlug, stateSlug);
  const { data: weather, isLoading: weatherLoading } = useWeather(districtSlug, stateSlug);
  const { data: water, isLoading: waterLoading } = useWater(districtSlug, stateSlug);
  const { data: alerts } = useAlerts(districtSlug, stateSlug);
  const { data: infraData } = useInfrastructure(districtSlug, stateSlug);
  const { data: budgetData, isLoading: budgetLoading } = useBudget(districtSlug, stateSlug);
  const { data: policeData, isLoading: policeLoading } = usePolice(districtSlug, stateSlug);
  const { data: newsData, isLoading: newsLoading } = useNews(districtSlug, stateSlug);

  const latestCrops = crops?.data?.slice(0, 5) ?? [];
  const latestWeather = weather?.data?.[0];
  const latestDam = water?.data?.dams?.[0];
  const activeAlerts = alerts?.data ?? [];
  const ongoingProjects = (infraData?.data ?? [])
    .filter((p) => p.status === "ongoing" || p.status === "active" || p.status === "under_construction")
    .slice(0, 4);

  // Finance summary — use latest fiscal year only (matches finance page)
  const allBudgetEntries = budgetData?.data?.entries ?? [];
  const latestFY = allBudgetEntries.length > 0 ? allBudgetEntries[0].fiscalYear : null;
  const budgetEntries = latestFY ? allBudgetEntries.filter((e) => e.fiscalYear === latestFY) : [];
  const totalAllocated = budgetEntries.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = budgetEntries.reduce((s, e) => s + e.spent, 0);
  const spentPct = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Police summary
  const policeStations = policeData?.data?.stations ?? [];
  const trafficRows = policeData?.data?.traffic ?? [];
  const trafficRevenue = trafficRows.reduce((s, t) => s + t.amount, 0);

  // News
  const newsItems = (newsData?.data ?? []).slice(0, 5);

  return (
    <div style={{ padding: "0" }}>

      {/* ── District Hero with SVG Illustration ─── */}
      <DistrictHeroIllustration
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtData.name}
        stateName={stateName}
        districtNameLocal={districtData.nameLocal}
        tagline={districtData.tagline}
        badges={districtData.badges}
        active={districtData.active}
        stats={{
          population: districtData.population ? `${(districtData.population / 1000000).toFixed(2)}M` : undefined,
          area: districtData.area ? districtData.area.toLocaleString("en-IN") : undefined,
          literacy: districtData.literacy ? `${districtData.literacy}%` : undefined,
          subDistrictCount: displayedTalukCount,
          subDistrictLabel: stateConfig?.subDistrictUnitPlural ?? "Taluks",
        }}
      />

      <div style={{ padding: "20px 24px 24px" }}>
        {/* Combined supporters + sponsor CTA card (cool gray, distinct from AI Analysis) */}
        <DistrictSponsorBanner
          district={districtSlug}
          state={stateSlug}
          districtName={districtData.name}
          stateName={stateName}
          locale={locale}
        />

        <LiveElectionBanner stateSlug={stateSlug} leadershipHref={`${base}/leadership`} />

        <AIInsightCard module="overview" district={districtSlug} />
        <DistrictHealthScoreCard districtSlug={districtSlug} />

        {/* ── Active Alerts ────────────────────────────── */}
        {activeAlerts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {activeAlerts.slice(0, 3).map((a) => {
              const isCritical = a.severity === "critical";
              const isHigh = a.severity === "high";
              const bg = isCritical ? "#FFF1F0" : isHigh ? "#FFFBEB" : "#F0F7FF";
              const border = isCritical ? "#FECACA" : isHigh ? "#FDE68A" : "#BFDBFE";
              const leftBorder = isCritical ? "#DC2626" : isHigh ? "#D97706" : "#2563EB";
              return (
                <Link key={a.id} href={`${base}/alerts`} style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 14px 10px 12px",
                    background: bg, border: `1px solid ${border}`,
                    borderLeft: `4px solid ${leftBorder}`,
                    borderRadius: 10, fontSize: 13, color: "#1A1A1A",
                  }}>
                    <AlertTriangle size={14} style={{ color: leftBorder, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      {a.description && (
                        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2, lineHeight: 1.4 }}>
                          {a.description.length > 100 ? a.description.slice(0, 100) + "…" : a.description}
                        </div>
                      )}
                    </div>
                    <SeverityBadge severity={a.severity} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Live Data Row ─────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))", gap: 12, marginBottom: 24 }}>

          {/* Weather Widget */}
          <Link href={`${base}/weather`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(37,99,235,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.05)"; }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderLeft: "4px solid #2563EB", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px rgba(37,99,235,0.05)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cloud size={15} style={{ color: "#2563EB" }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Weather</span>
                </div>
                <LiveBadge />
              </div>
              {weatherLoading ? <LoadingShell rows={2} /> : latestWeather ? (
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#1A1A1A", fontFamily: "var(--font-mono)", letterSpacing: "-2px", lineHeight: 1 }}>
                    {latestWeather.temperature != null ? `${latestWeather.temperature}°` : "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>{latestWeather.conditions ?? "—"}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                    {latestWeather.humidity != null && <span style={{ fontSize: 12, color: "#9B9B9B" }}>💧 {latestWeather.humidity}%</span>}
                    {latestWeather.windSpeed != null && <span style={{ fontSize: 12, color: "#9B9B9B" }}>🌬 {latestWeather.windSpeed} km/h</span>}
                  </div>
                </div>
              ) : <EmptyState module="weather" compact />}
            </div>
          </Link>

          {/* Dam Level Widget */}
          <Link href={`${base}/water`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(217,119,6,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(37,99,235,0.05)"; }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderLeft: "4px solid #D97706", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px rgba(37,99,235,0.05)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🚰</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Dam Levels</span>
                </div>
                <LiveBadge />
              </div>
              {waterLoading ? <LoadingShell rows={2} /> : latestDam ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>{latestDam.damName}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-1px", lineHeight: 1, color: latestDam.storagePct > 70 ? "#16A34A" : latestDam.storagePct > 30 ? "#D97706" : "#DC2626" }}>
                      {latestDam.storagePct.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 14, color: "#9B9B9B", fontWeight: 600 }}>%</span>
                  </div>
                  <div style={{ marginTop: 10, background: "#F0F0EC", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, latestDam.storagePct)}%`, height: "100%", background: latestDam.storagePct > 70 ? "#2563EB" : latestDam.storagePct > 30 ? "#D97706" : "#DC2626", borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 5 }}>
                    {latestDam.waterLevel.toFixed(1)} / {latestDam.maxLevel.toFixed(1)} ft
                  </div>
                </div>
              ) : <EmptyState module="water" compact />}
            </div>
          </Link>

          {/* Crop Prices Widget */}
          <Link href={`${base}/crops`} style={{ textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 6px 18px rgba(22,163,74,0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget.firstElementChild as HTMLElement).style.transform = ""; (e.currentTarget.firstElementChild as HTMLElement).style.boxShadow = "0 2px 8px rgba(22,163,74,0.05)"; }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderLeft: "4px solid #16A34A", borderRadius: 14, padding: 18, height: "100%", boxShadow: "0 2px 8px rgba(22,163,74,0.05)", transition: "transform 200ms, box-shadow 200ms" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🌾</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>Mandi Prices</span>
                </div>
                <LiveBadge />
              </div>
              {cropsLoading ? <LoadingShell rows={3} /> : latestCrops.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {latestCrops.map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#1A1A1A" }}>{c.commodity}</span>
                      <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "#16A34A" }}>
                        ₹{Math.round(c.modalPrice / 100).toLocaleString("en-IN")}<span style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 400 }}>/kg</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState module="crops" compact />}
            </div>
          </Link>
        </div>

        {/* ── District Snapshot ─────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>District Snapshot</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <StatCard label="Population" value={districtData.population?.toLocaleString("en-IN") ?? "—"} icon={Users} />
            <StatCard label="Area (km²)" value={districtData.area?.toLocaleString("en-IN") ?? "—"} icon={TreePine} />
            <StatCard label={stateConfig?.subDistrictUnitPlural ?? "Taluks"} value={displayedTalukCount ?? "—"} icon={MapPin} />
            {(stateConfig?.showVillages !== false) && <StatCard label="Villages" value={districtData.villageCount?.toLocaleString("en-IN") ?? "—"} icon={MapPin} />}
            <StatCard label="Literacy" value={districtData.literacy ? `${districtData.literacy}%` : "—"} icon={Percent} accent="#16A34A" />
            <StatCard label="Sex Ratio" value={districtData.sexRatio ? `${districtData.sexRatio}/1k` : "—"} icon={Activity} />
            <StatCard label="Schemes" value={overview?.data?._count?.schemes?.toString() ?? "—"} icon={ScrollText} />
            <StatCard label="Schools" value={overview?.data?._count?.schools?.toString() ?? "—"} icon={BarChart3} />
          </div>
        </div>

        {/* ── Population & Demographics snippet — auto-hides if no DemographicProfile ── */}
        <PopulationSnippet district={districtSlug} state={stateSlug} base={base} />

        {/* ── District Leadership snippet — auto-hides if 0 leaders ── */}
        <LeadersSnippet district={districtSlug} state={stateSlug} base={base} />

        {/* ── Infrastructure At a Glance — auto-hides if 0 projects ── */}
        <InfraSnippet district={districtSlug} state={stateSlug} base={base} />

        {/* ── Govt. Tenders snippet — always renders (lock/live/stale/no-data).
            No outer wrapper: the snippet carries its own marginBottom:24,
            matching LeadersSnippet + InfraSnippet for consistent alignment. */}
        <TenderSnippet locale={locale} district={districtSlug} state={stateSlug} base={base} />

        {/* ── Ongoing Projects ─────────────────────────── */}
        {ongoingProjects.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionLabel action={<Link href={`${base}/map`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>See map →</Link>}>
              Ongoing Projects
            </SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {ongoingProjects.map((p) => {
                const pct = p.progressPct ?? 0;
                const catColors: Record<string, string> = {
                  Roads: "#F59E0B", Irrigation: "#2563EB", "Urban Development": "#7C3AED",
                  Health: "#DC2626", Education: "#16A34A",
                };
                const catColor = catColors[p.category] ?? "#6B6B6B";
                return (
                  <div key={p.id} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4 }}>{p.name}</div>
                        {p.contractor && (
                          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
                            <HardHat size={10} style={{ display: "inline", marginRight: 3 }} />
                            {p.contractor}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: catColor + "18", color: catColor, borderRadius: 20, flexShrink: 0 }}>
                        {p.category}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#6B6B6B" }}>Progress</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 75 ? "#16A34A" : pct >= 40 ? "#D97706" : "#DC2626", fontFamily: "var(--font-mono)" }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{ height: 6, background: "#F0F0EC", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? "#16A34A" : pct >= 40 ? "#F59E0B" : "#DC2626", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                    {p.budget && (
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#6B6B6B", marginTop: 8 }}>
                        <span>₹{(p.budget / 1e7).toFixed(0)} Cr budget</span>
                        {p.expectedEnd && <span>· Due {new Date(p.expectedEnd).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Finance & Budget Summary — hidden entirely when no data ── */}
        {(budgetLoading || budgetEntries.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/finance`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>Full report →</Link>}>
            Finance & Budget
          </SectionLabel>
          <Link href={`${base}/finance`} style={{ textDecoration: "none" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {budgetLoading ? (
                <LoadingShell rows={3} />
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Allocated</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(totalAllocated / 1e7).toFixed(0)} Cr
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Spent</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#16A34A", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(totalSpent / 1e7).toFixed(0)} Cr
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Utilisation</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: spentPct >= 75 ? "#16A34A" : spentPct >= 50 ? "#D97706" : "#DC2626", fontFamily: "var(--font-mono)", letterSpacing: "-1px", lineHeight: 1 }}>
                          {spentPct.toFixed(1)}%
                        </div>
                        <TrendingUp size={14} style={{ color: spentPct >= 75 ? "#16A34A" : "#D97706" }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ background: "#F0F0EC", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, spentPct)}%`, height: "100%", background: spentPct >= 75 ? "#16A34A" : spentPct >= 50 ? "#F59E0B" : "#DC2626", borderRadius: 6, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
                    {budgetEntries.length} sector{budgetEntries.length !== 1 ? "s" : ""} tracked
                  </div>
                </>
              )}
            </div>
          </Link>
        </div>
        )}

        {/* ── Police & Crime Summary — hidden entirely when no data ── */}
        {(policeLoading || policeStations.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/police`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>Station directory →</Link>}>
            Police & Public Safety
          </SectionLabel>
          <Link href={`${base}/police`} style={{ textDecoration: "none" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {policeLoading ? (
                <LoadingShell rows={2} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Police Stations</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FFF1F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={15} style={{ color: "#DC2626" }} />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>
                        {policeStations.length}
                      </div>
                    </div>
                  </div>
                  {trafficRevenue > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Traffic Revenue</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#D97706", fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>
                        ₹{(trafficRevenue / 1e5).toFixed(1)}L
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        </div>
        )}

        {/* ── Local News — hidden entirely when no items and not loading ── */}
        {(newsLoading || newsItems.length > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel action={<Link href={`${base}/news`} style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>All news →</Link>}>
            Local News
          </SectionLabel>
          {newsLoading ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "18px 20px" }}>
              <LoadingShell rows={4} />
            </div>
          ) : newsItems.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "24px 20px", textAlign: "center" }}>
              <Newspaper size={28} style={{ color: "#C0C0BA", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, color: "#9B9B9B" }}>No news available yet</div>
            </div>
          ) : (
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, overflow: "hidden" }}>
              {newsItems.map((item, idx) => {
                const catColor = CATEGORY_COLORS[item.category?.toLowerCase()] ?? "#6B6B6B";
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 18px",
                      borderBottom: idx < newsItems.length - 1 ? "1px solid #F0F0EC" : "none",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, marginBottom: 4 }}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                            {item.headline}
                          </a>
                        ) : item.headline}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#9B9B9B" }}>{item.source}</span>
                        <span style={{ fontSize: 11, color: "#C0C0BA" }}>·</span>
                        <span style={{ fontSize: 11, color: "#9B9B9B" }}>{timeAgo(item.publishedAt)}</span>
                        {item.category && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 7px",
                            background: catColor + "18", color: catColor,
                            borderRadius: 20, textTransform: "capitalize",
                          }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* ── Taluks ────────────────────────────────────── */}
        {districtData.taluks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>{stateConfig?.subDistrictUnitPlural ?? "Taluks"} in {districtData.name}</SectionLabel>
            <CardGrid>
              {districtData.taluks.map((t) => (
                <Link
                  key={t.slug}
                  href={`${base}/${t.slug}`}
                  style={{ display: "block", padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, textDecoration: "none" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1A1A" }}>{t.name}</div>
                  {t.nameLocal && (
                    <div style={{ fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 2 }}>{t.nameLocal}</div>
                  )}
                  {t.tagline && (
                    <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{t.tagline}</div>
                  )}
                </Link>
              ))}
            </CardGrid>
          </div>
        )}

        {/* ── All Data Modules — Categorized Grid ──────── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>All {SIDEBAR_MODULES.length - 1} Data Modules</SectionLabel>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {MODULE_CATEGORIES.map((cat) => {
              const mods = cat.slugs
                .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
                .filter(Boolean) as typeof SIDEBAR_MODULES;
              if (!mods.length) return null;

              return (
                <div key={cat.label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                    {cat.label}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 8,
                    }}
                    className="module-grid"
                  >
                    {mods.map((mod) => {
                      const isLive = LIVE_MODULES.has(mod.slug);
                      const href = mod.slug === "overview" ? base : `${base}/${mod.slug}`;
                      return (
                        <Link
                          key={mod.slug}
                          href={href}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            padding: "12px 12px 10px",
                            background: "#FFFFFF",
                            border: "1px solid #E8E8E4",
                            borderRadius: 12,
                            textDecoration: "none",
                            color: "#1A1A1A",
                            position: "relative",
                            transition: "border-color 150ms, box-shadow 150ms",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                            (e.currentTarget as HTMLElement).style.borderColor = "#2563EB";
                            (e.currentTarget as HTMLElement).style.background = "#F8FBFF";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = "none";
                            (e.currentTarget as HTMLElement).style.borderColor = "#E8E8E4";
                            (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                          }}
                        >
                          {isLive && (
                            <div style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#16A34A", letterSpacing: "0.04em" }}>LIVE</span>
                            </div>
                          )}
                          <span style={{ fontSize: 20, marginBottom: 8, lineHeight: 1 }}>{mod.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.3, wordBreak: "break-word", hyphens: "auto" }}>
                            {mod.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
