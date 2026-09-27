/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — news-driven timeline model.
 * Every data point links to a news article. The platform presents
 * facts aggregated from the press, never judgment.
 *
 * Design v4 "Rang" (docs/DESIGN-SYSTEM.md): PageHeader → one notice →
 * freshness line → StatStrip of emoji tiles → the picture (explainer +
 * pictogram of finished projects + a "running late" gauge) → "biggest
 * projects by money" list → projects by category chart → filter Chips +
 * sort → project cards → cancelled projects → SourcesFooter → ModuleNews
 * → legal notice → Toolbar. The card, timeline, analysis and notice
 * pieces live in ./components/ (one file each, see the comment at the top
 * of each). Every number in the pictures and the chart comes from the
 * same project list as the tiles. Words live in "page_infrastructure";
 * project names, agencies and news text stay as published.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { HardHat } from "lucide-react";
import { useInfrastructure } from "@/hooks/useRealtimeData";
import type { InfraProject } from "@/hooks/useRealtimeData";
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
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import { useModuleText } from "@/i18n/client";
import { TopBarList } from "@/components/money/visuals";
import { useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";
import knDict from "@/dictionaries/kn.json";
import {
  normalizeCategory, normalizeStatus, isCancelled, isActive, isCompleted, isDelayed, categoryEmoji,
} from "./components/infra-utils";
import { useInfraText } from "./components/infra-i18n";
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

const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const { t, m, category, status, inr } = useInfraText();
  const st = useSourceText();
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
  const categoryChart = categoryOrder.map((c) => ({ category: category(c), count: categoryCounts.get(c) ?? 0 }));

  // Biggest projects by money (latest reported budget), cancelled ones left out.
  const budgetOf = (p: InfraProject) => p.revisedBudget ?? p.originalBudget ?? p.budget ?? 0;
  const biggest = activeList.filter((p) => budgetOf(p) > 0).sort((a, b) => budgetOf(b) - budgetOf(a));

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
  const title = t("title");
  // Local-script title: the module name in the state's language (Kannada
  // only for now). PageHeader hides it when it is already the title.
  const titleLocal = state === "karnataka" ? knDict.moduleNames.infrastructure : undefined;

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
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: t("sourceLabel") }}
      />

      <DisclaimerBanner />

      <AIInsightCard module="infrastructure" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyState emoji="🏗️" title={t("empty.title")} body={t("empty.body")} />
      )}

      {!isLoading && projects.length > 0 && (
        <>
          <DataFreshnessIndicator projects={projects} />

          {/* Stats — StatStrip wraps to a second row after four tiles */}
          <div style={{ marginBottom: 20 }}>
            <StatStrip cols={4}>
              <StatTile emoji="🏗️" label={t("tiles.total")} value={m.num(counts.total)} asOf={asOf} />
              <StatTile emoji="🚧" label={t("tiles.active")} value={m.num(counts.active)} sub={t("tiles.activeSub")} />
              <StatTile emoji="✅" label={t("tiles.completed")} value={m.num(counts.completed)} />
              <StatTile emoji="⏰" label={t("tiles.delayed")} value={m.num(counts.delayed)} sub={t("tiles.delayedSub")} />
              <StatTile emoji="🚫" label={t("tiles.cancelled")} value={m.num(counts.cancelled)} />
              <StatTile emoji="💰" label={t("tiles.budget")} value={inr(totalBudget)} sub={t("tiles.asReported")} asOf={asOf} />
              {totalSpent > 0 && (
                <StatTile emoji="🧾" label={t("tiles.released")} value={inr(totalSpent)} sub={t("tiles.asReported")} asOf={asOf} />
              )}
            </StatStrip>
          </div>

          {/* The picture: finished projects as 10 cranes, plus a dial for the
              share running late. Needs at least two projects to mean anything. */}
          {counts.total >= 2 && (
            <div className="ftp-picture-row" style={{ marginBottom: 24 }}>
              <Card tinted padding={18}>
                <Explainer>
                  {counts.cancelled > 0
                    ? t.rich("explainerCancelled", { total: counts.total, done: counts.completed, active: counts.active, cancelled: counts.cancelled, num })
                    : t.rich("explainer", { total: counts.total, done: counts.completed, active: counts.active, num })}
                </Explainer>
                <Pictogram
                  filled={doneOf10}
                  emoji="🏗️"
                  label={counts.completed === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(doneOf10) })}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge value={latePct} label={t("gauge.label")} caption={t("gauge.caption")} />
              </Card>
            </div>
          )}

          {/* Biggest projects by money — the budget side of the story.
              Needs at least two projects with a reported budget. */}
          {biggest.length >= 2 && (
            <div style={{ marginBottom: 24 }}>
              <ChartCard
                title={t("biggest.title")}
                emoji="💰"
                units={t("biggest.units")}
                simple={t.rich("biggest.simple", { name: biggest[0].name, amount: inr(budgetOf(biggest[0])), b })}
                source={{ label: t("sourceLabel") }}
                asOf={asOf}
                table={biggest.slice(0, 5).map((p) => ({ label: p.name, value: inr(budgetOf(p)) }))}
              >
                <TopBarList
                  rows={biggest.map((p) => ({
                    key: p.id,
                    label: p.name,
                    sub: t("biggest.sub", { category: category(p.category), status: status(p.status) }),
                    emoji: categoryEmoji(p.category),
                    value: budgetOf(p),
                    display: inr(budgetOf(p)),
                  }))}
                />
              </ChartCard>
            </div>
          )}

          {/* Projects by category — only when there is more than one category. */}
          {categoryChart.length >= 2 && (
            <ChartCard
              title={t("byCategory.title")}
              emoji="📊"
              units={t("byCategory.units")}
              simple={t.rich("byCategory.simple", { name: categoryChart[0].category, n: categoryChart[0].count, total: counts.total, b })}
              legend={[{ label: t("byCategory.legend"), swatch: "var(--hue)" }]}
              source={{ label: t("sourceLabel") }}
              asOf={asOf}
              table={categoryChart.map((r) => ({ label: r.category, value: m.num(r.count) }))}
            >
              <ResponsiveContainer width="100%" height={Math.max(160, categoryChart.length * 36 + 40)}>
                <BarChart data={categoryChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                  <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} tickFormatter={(v) => m.num(Number(v))} />
                  <YAxis type="category" dataKey="category" tick={CHART_AXIS} width={130} interval={0} />
                  <Tooltip
                    formatter={(v) => [m.num(Number(v)), t("byCategory.legend")]}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--hue-tint)" }}
                  />
                  <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("byCategory.legend")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <Section title={t("list.title")} emoji="🚧">
            {/* Filters */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.category")}</div>
                <Chips
                  label={t("list.categoryAria")}
                  value={catFilter}
                  onChange={(v) => setCatFilter(v as CategoryFilter)}
                  items={[
                    { value: "all", label: t("list.all"), count: projects.length },
                    ...categoryOrder.map((c) => ({ value: c, label: category(c), count: categoryCounts.get(c) ?? 0 })),
                  ]}
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.status")}</div>
                  <Chips
                    label={t("list.statusAria")}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as StatusFilter)}
                    items={[
                      { value: "all", label: t("list.all"), count: projects.length },
                      { value: "active", label: t("tiles.active"), count: counts.active },
                      { value: "delayed", label: t("tiles.delayed"), count: counts.delayed },
                      { value: "completed", label: t("tiles.completed"), count: counts.completed },
                    ]}
                  />
                </div>
                <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ftp-label">{t("list.sort")}</span>
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
                    <option value="latest">{t("list.sortLatest")}</option>
                    <option value="budget">{t("list.sortBudget")}</option>
                    <option value="progress">{t("list.sortProgress")}</option>
                    <option value="delay">{t("list.sortDelay")}</option>
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
                <EmptyState emoji="🔍" title={t("list.noMatch")} body={t("list.noMatchBody")} />
              </div>
            )}
          </Section>

          {/* Cancelled section */}
          {cancelledList.length > 0 && (
            <Section emoji="🚫" title={t("cancelledTitle", { n: cancelledList.length })}>
              <div style={{ ...CARD_GRID, marginBottom: 28 }}>
                {cancelledList.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            </Section>
          )}
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name: st.name(name), frequency: st.freq(src.frequency) }))} />
      <NotOfficialNote />

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <LegalFooter />

      <MoneyToolbar
        shareTitle={title}
        onCsv={onCsv}
        csvDisabled={projects.length === 0}
        compareHref={`/${locale}/compare?module=infrastructure&a=${district}`}
      />
    </div>
  );
}

export default function InfrastructurePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("infrastructure")}>
      <InfrastructurePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
