/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — news-driven timeline model.
 * Every data point links to a news article. The platform presents
 * facts aggregated from the press, never judgment.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useMemo, useState } from "react";
import { HardHat, AlertTriangle } from "lucide-react";
import { useInfrastructure } from "@/hooks/useRealtimeData";
import type { InfraProject } from "@/hooks/useRealtimeData";
import ModuleDisclaimer from "@/components/common/ModuleDisclaimer";
import {
  ModuleHeader, LoadingShell, ErrorBlock, EmptyBlock, LastUpdatedBadge,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { normalizeCategory, isCancelled, isActive, isCompleted, isDelayed, formatINR } from "./components/infra-utils";
import DisclaimerBanner from "./components/DisclaimerBanner";
import ProjectCard from "./components/ProjectCard";
import LegalFooter from "./components/LegalFooter";
import DataFreshnessIndicator from "./components/DataFreshnessIndicator";
import StatTile from "./components/InfraStatTile";
import FilterRow from "./components/FilterRow";

// ═══════════════════════════════════════════════════════════
// Inner page
// ═══════════════════════════════════════════════════════════

type CategoryFilter = "all" | string;
type StatusFilter = "all" | "active" | "delayed" | "completed" | "cancelled";
type SortOption = "latest" | "budget" | "progress" | "delay";

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useInfrastructure(district, state);
  const projects = useMemo<InfraProject[]>(() => data?.data ?? [], [data]);

  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  // Merge category variants before building the filter list
  const { categoryOrder, categoryCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      const c = normalizeCategory(p.category);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { categoryOrder: ordered, categoryCounts: counts };
  }, [projects]);

  const activeList = projects.filter((p) => !isCancelled(p));
  const cancelledList = projects.filter((p) => isCancelled(p));

  const totalBudget = activeList.reduce((s, p) => s + (p.revisedBudget ?? p.originalBudget ?? p.budget ?? 0), 0);
  const totalSpent = activeList.reduce((s, p) => s + (p.fundsReleased ?? 0), 0);
  const counts = {
    total: projects.length,
    active: projects.filter(isActive).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
    cancelled: cancelledList.length,
  };

  const filtered = useMemo(() => {
    const list = activeList.filter((p) => {
      if (catFilter !== "all" && normalizeCategory(p.category) !== catFilter) return false;
      if (statusFilter === "active" && !isActive(p)) return false;
      if (statusFilter === "delayed" && !isDelayed(p)) return false;
      if (statusFilter === "completed" && !isCompleted(p)) return false;
      return true;
    });
    const sorted = [...list];
    if (sortBy === "latest") sorted.sort((a, b) => {
      const at = a.lastNewsAt ? new Date(a.lastNewsAt).getTime() : 0;
      const bt = b.lastNewsAt ? new Date(b.lastNewsAt).getTime() : 0;
      return bt - at;
    });
    if (sortBy === "budget") sorted.sort((a, b) => (b.revisedBudget ?? b.budget ?? 0) - (a.revisedBudget ?? a.budget ?? 0));
    if (sortBy === "progress") sorted.sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0));
    if (sortBy === "delay") sorted.sort((a, b) => (b.delayMonths ?? 0) - (a.delayMonths ?? 0));
    return sorted;
  }, [activeList, catFilter, statusFilter, sortBy]);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={HardHat}
        title="Infrastructure Tracker"
        description="Government projects tracked through news — every fact linked to its source"
        backHref={base}
      >
        <LastUpdatedBadge lastUpdated={data?.meta?.lastUpdated} />
      </ModuleHeader>

      <DisclaimerBanner />

      <ModuleDisclaimer
        text="Project timelines and delay information are aggregated from official government announcements and publicly reported news sources. This is not an official government statement. For authoritative information, please consult the concerned government department."
      />

      {(() => { const _src = getModuleSources("infrastructure", state); return <DataSourceBanner moduleName="infrastructure" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="infrastructure" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyBlock icon="🔧" message="No infrastructure projects tracked yet. News-driven updates will populate this page automatically." />
      )}

      {!isLoading && projects.length > 0 && (
        <>
          <DataFreshnessIndicator projects={projects} />

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
            <StatTile label="Total Projects" value={counts.total} />
            <StatTile label="Active" value={counts.active} color="#D97706" />
            <StatTile label="Completed" value={counts.completed} color="#16A34A" />
            <StatTile label="Delayed" value={counts.delayed} color="#DC2626" />
            <StatTile label="Cancelled" value={counts.cancelled} color="#6B7280" />
            <StatTile label="Total Budget" value={formatINR(totalBudget)} />
            {totalSpent > 0 && <StatTile label="Funds Released" value={formatINR(totalSpent)} color="#2563EB" />}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <FilterRow
              label="Category"
              options={[
                { id: "all", label: "All", count: projects.length },
                ...categoryOrder.map((c) => ({ id: c, label: c, count: categoryCounts.get(c) ?? 0 })),
              ]}
              value={catFilter}
              onChange={(v) => setCatFilter(v as CategoryFilter)}
            />
            <FilterRow
              label="Status"
              options={[
                { id: "all", label: "All", count: projects.length },
                { id: "active", label: "Active", count: counts.active },
                { id: "delayed", label: "Delayed", count: counts.delayed },
                { id: "completed", label: "Completed", count: counts.completed },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{ padding: "4px 10px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 12, background: "#FFF" }}
              >
                <option value="latest">Latest Update</option>
                <option value="budget">Budget (highest)</option>
                <option value="progress">Most Complete</option>
                <option value="delay">Most Delayed</option>
              </select>
            </div>
          </div>

          {/* Active cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 12, marginBottom: 28 }}>
            {filtered.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>

          {/* Cancelled section */}
          {cancelledList.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} style={{ color: "#6B7280" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Cancelled / Shelved Projects ({cancelledList.length})
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 12, marginBottom: 28 }}>
                {cancelledList.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <LegalFooter />
    </div>
  );
}

export default function InfrastructurePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Infrastructure">
      <InfrastructurePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
