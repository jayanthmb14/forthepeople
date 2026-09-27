/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — news-driven timeline model.
 * Every data point links to a news article. The platform presents
 * facts aggregated from the press, never judgment.
 *
 * Design v4 "Rang" (docs/DESIGN-SYSTEM.md): PageHeader → notices →
 * freshness line → StatStrip of emoji tiles → the picture (explainer +
 * pictogram of finished projects + a "running late" gauge) → projects by
 * category chart → filter Chips + sort → project cards → cancelled
 * projects → SourcesFooter → ModuleNews → legal notice → Toolbar. The
 * card, timeline, analysis and notice pieces live in ./components/ (one
 * file each, see the comment at the top of each). Every number in the
 * picture and the chart comes from the same project list as the tiles.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { HardHat, ArrowLeftRight, Download, Share2 } from "lucide-react";
import { useInfrastructure } from "@/hooks/useRealtimeData";
import type { InfraProject } from "@/hooks/useRealtimeData";
import ModuleDisclaimer from "@/components/common/ModuleDisclaimer";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import knDict from "@/dictionaries/kn.json";
import {
  normalizeCategory, normalizeStatus, isCancelled, isActive, isCompleted, isDelayed, formatINR,
} from "./components/infra-utils";
import DisclaimerBanner from "./components/DisclaimerBanner";
import ProjectCard from "./components/ProjectCard";
import LegalFooter from "./components/LegalFooter";
import DataFreshnessIndicator from "./components/DataFreshnessIndicator";

// ═══════════════════════════════════════════════════════════
// Inner page
// ═══════════════════════════════════════════════════════════

type CategoryFilter = "all" | string;
type StatusFilter = "all" | "active" | "delayed" | "completed" | "cancelled";
type SortOption = "latest" | "budget" | "progress" | "delay";

/** Card grid: one column on phones, as many 360 px columns as fit above that. */
const CARD_GRID: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 12,
};

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
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

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useInfrastructure(district, state);
  const projects = useMemo<InfraProject[]>(() => data?.data ?? [], [data]);

  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [shareNote, setShareNote] = useState<string | null>(null);

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

  const activeList = useMemo(() => projects.filter((p) => !isCancelled(p)), [projects]);
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

  // The picture: share of tracked projects that are finished (out of 10)
  // and share reported as running late. Same counts as the tiles above it.
  const doneOf10 = counts.total > 0 ? (counts.completed / counts.total) * 10 : 0;
  const latePct = counts.total > 0 ? (counts.delayed / counts.total) * 100 : 0;

  // Chart rows: how many projects fall in each category (largest first).
  const categoryChart = categoryOrder.map((c) => ({ category: c, count: categoryCounts.get(c) ?? 0 }));

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

  // Header freshness = newest project `updatedAt` (sent by the API as meta.lastUpdated).
  const asOf = data?.meta?.lastUpdated ?? null;
  const src = getModuleSources("infrastructure", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.infrastructure : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Infrastructure Tracker", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  const onCsv = () =>
    downloadCsv(
      `${district}-infrastructure.csv`,
      projects.map((p) => ({
        name: p.name,
        category: normalizeCategory(p.category),
        status: normalizeStatus(p.status),
        executing_agency: p.executingAgency ?? "",
        announced_by: p.announcedBy ?? "",
        budget_inr: p.revisedBudget ?? p.originalBudget ?? p.budget ?? "",
        progress_pct: p.progressPct ?? "",
        delay_months: p.delayMonths ?? "",
        last_news: p.lastNewsAt ?? "",
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={HardHat}
        accent={getModuleAccent("infrastructure")}
        title="Infrastructure Tracker"
        titleLocal={titleLocal}
        description="Government projects tracked through news — every fact linked to its source"
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "News reports" }}
      />

      <DisclaimerBanner />

      <ModuleDisclaimer
        text="Project timelines and delay information are aggregated from official government announcements and publicly reported news sources. This is not an official government statement. For authoritative information, please consult the concerned government department."
      />

      <AIInsightCard module="infrastructure" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyState
          emoji="🏗️"
          title="No infrastructure projects tracked yet."
          body="News-driven updates will populate this page automatically."
        />
      )}

      {!isLoading && projects.length > 0 && (
        <>
          <DataFreshnessIndicator projects={projects} />

          {/* Stats — StatStrip wraps to a second row after four tiles */}
          <div style={{ marginBottom: 20 }}>
            <StatStrip cols={4}>
              <StatTile emoji="🏗️" label="Total projects" value={counts.total} asOf={asOf} />
              <StatTile emoji="🚧" label="Active" value={counts.active} sub="Planned or being built" />
              <StatTile emoji="✅" label="Completed" value={counts.completed} />
              <StatTile emoji="⏰" label="Delayed" value={counts.delayed} sub="Delayed or stalled" />
              <StatTile emoji="🚫" label="Cancelled" value={counts.cancelled} />
              <StatTile emoji="💰" label="Total budget" value={formatINR(totalBudget)} sub="As reported in news media" asOf={asOf} />
              {totalSpent > 0 && (
                <StatTile emoji="🧾" label="Funds released" value={formatINR(totalSpent)} sub="As reported in news media" asOf={asOf} />
              )}
            </StatStrip>
          </div>

          {/* The picture: finished projects as 10 cranes, plus a dial for the
              share running late. Needs at least two projects to mean anything. */}
          {counts.total >= 2 && (
            <div className="ftp-picture-row" style={{ marginBottom: 24 }}>
              <Card tinted padding={18}>
                <Explainer>
                  This page follows <strong className="ftp-num">{counts.total}</strong> government projects reported in the
                  news. <strong className="ftp-num">{counts.completed}</strong> are finished and{" "}
                  <strong className="ftp-num">{counts.active}</strong> are planned or still being built
                  {counts.cancelled > 0 ? (
                    <>
                      ; <strong className="ftp-num">{counts.cancelled}</strong> were cancelled
                    </>
                  ) : null}
                  .
                </Explainer>
                <Pictogram
                  filled={doneOf10}
                  emoji="🏗️"
                  label={
                    counts.completed === 0
                      ? "None of the projects tracked here is reported as finished yet."
                      : `About ${Math.round(doneOf10)} of every 10 projects tracked here are finished.`
                  }
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge value={latePct} label="Projects running late" caption="Share of tracked projects reported as delayed or stalled" />
              </Card>
            </div>
          )}

          {/* Projects by category — only when there is more than one category. */}
          {categoryChart.length >= 2 && (
            <ChartCard
              title="Projects by category"
              emoji="📊"
              units="Number of tracked projects in each category, cancelled ones included"
              simple={
                <>
                  Most projects here are <strong>{categoryChart[0].category}</strong>:{" "}
                  <span className="ftp-num">{categoryChart[0].count}</span> of{" "}
                  <span className="ftp-num">{counts.total}</span>.
                </>
              }
              legend={[{ label: "Projects", swatch: "var(--hue)" }]}
              source={{ label: "News reports" }}
              asOf={asOf}
              table={categoryChart.map((r) => ({ label: r.category, value: r.count.toLocaleString("en-IN") }))}
            >
              <ResponsiveContainer width="100%" height={Math.max(160, categoryChart.length * 36 + 40)}>
                <BarChart data={categoryChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                  <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" tick={CHART_AXIS} width={130} interval={0} />
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString("en-IN"), "Projects"]}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--hue-tint)" }}
                  />
                  <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name="Projects" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <Section title="Projects" emoji="🚧">
            {/* Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <div className="ftp-label" style={{ marginBottom: 6 }}>Category</div>
                <Chips
                  label="Filter projects by category"
                  value={catFilter}
                  onChange={(v) => setCatFilter(v as CategoryFilter)}
                  items={[
                    { value: "all", label: "All", count: projects.length },
                    ...categoryOrder.map((c) => ({ value: c, label: c, count: categoryCounts.get(c) ?? 0 })),
                  ]}
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>Status</div>
                  <Chips
                    label="Filter projects by status"
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as StatusFilter)}
                    items={[
                      { value: "all", label: "All", count: projects.length },
                      { value: "active", label: "Active", count: counts.active },
                      { value: "delayed", label: "Delayed", count: counts.delayed },
                      { value: "completed", label: "Completed", count: counts.completed },
                    ]}
                  />
                </div>
                <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ftp-label">Sort</span>
                  {/* ftp-chip = 32 px tall on desktop, 44 px tap target on phones. */}
                  <select
                    className="ftp-chip"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    style={{
                      padding: "0 10px",
                      border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                      borderRadius: "var(--ftp-radius-pill)",
                      fontSize: 13, background: "var(--ftp-surface)", color: "var(--ftp-text)", fontFamily: "var(--ftp-font-sans)",
                    }}
                  >
                    <option value="latest">Latest update</option>
                    <option value="budget">Budget (highest)</option>
                    <option value="progress">Most complete</option>
                    <option value="delay">Most delayed</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Active cards */}
            {filtered.length > 0 ? (
              <div style={{ ...CARD_GRID, marginBottom: 28 }}>
                {filtered.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            ) : (
              <div style={{ marginBottom: 28 }}>
                <EmptyState emoji="🔍" title="No projects match these filters." body="Pick another category or status to see more projects." />
              </div>
            )}
          </Section>

          {/* Cancelled section */}
          {cancelledList.length > 0 && (
            <Section
              emoji="🚫"
              title={
                <>
                  Cancelled or shelved projects (<span className="ftp-num">{cancelledList.length}</span>)
                </>
              }
            >
              <div style={{ ...CARD_GRID, marginBottom: 28 }}>
                {cancelledList.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            </Section>
          )}
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name, frequency: src.frequency }))} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <LegalFooter />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={projects.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=infrastructure&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
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
