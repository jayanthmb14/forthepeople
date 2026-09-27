/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Projects being built — "Where does the money go, and is the work done?"
 * News-driven: every fact links to a news article; the platform presents
 * facts from the press, never judgment. The API sends only this
 * district's own projects (LOCAL_INFRA).
 *
 * The answer in one line: "This page follows 14 projects in Mandya: 3
 * are finished and 9 are planned or being built."
 * Page recipe (docs/LAYOUT.md, v4.1):
 *   ModulePage → PageHeader → Explainer → 4 StatTiles (tracked, finished,
 *   running late, total budget) → freshness line + one-line notice →
 *   the picture (10 cranes lit for finished + a "running late" dial) →
 *   filters + project cards in .ftp-grid; tapping a card opens the
 *   project's DetailSheet (status + progress, money, dates, people, every
 *   news update, source links, AI analysis) → cancelled projects →
 *   charts two to a row (biggest by money, by category) → AI insight →
 *   sources → news → legal notice → Download / Share / Compare.
 * Pieces live in ./components/ (one file each). Words live in
 * "page_infrastructure"; project names, agencies and news text stay as
 * published.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useCallback, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { HardHat } from "lucide-react";
import { useInfrastructure } from "@/hooks/useRealtimeData";
import type { InfraProject } from "@/hooks/useRealtimeData";
import {
  ModulePage,
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
import ModuleNews from "@/components/district/ModuleNews";
import { useDistrictName, useModuleText } from "@/i18n/client";
import { TopBarList } from "@/components/money/visuals";
import { useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";
import knDict from "@/dictionaries/kn.json";
import { normalizeCategory, normalizeStatus, isCancelled, isActive, isCompleted, isDelayed, categoryEmoji } from "./components/infra-utils";
import { useInfraText } from "./components/infra-i18n";
import DisclaimerBanner from "./components/DisclaimerBanner";
import ProjectCard, { budgetOf } from "./components/ProjectCard";
import ProjectSheet from "./components/ProjectSheet";
import LegalFooter from "./components/LegalFooter";
import DataFreshnessIndicator from "./components/DataFreshnessIndicator";

type StatusFilter = "all" | "active" | "delayed" | "completed";
type SortOption = "latest" | "budget" | "progress" | "delay";

const GRID_CARDS = { ["--ftp-grid-min" as string]: "300px" } as React.CSSProperties;
const GRID_CHARTS = { ["--ftp-grid-min" as string]: "360px", alignItems: "start" } as React.CSSProperties;

const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const { t, m, category, status, inr } = useInfraText();
  const st = useSourceText();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useInfrastructure(district, state);
  const projects = useMemo<InfraProject[]>(() => data?.data ?? [], [data]);

  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [openId, setOpenId] = useState<string | null>(null);
  // Stable, so the open sheet does not re-run its focus effect on every render.
  const closeSheet = useCallback(() => setOpenId(null), []);

  // Merge category variants before building the filter list.
  const { categoryOrder, categoryCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      const c = normalizeCategory(p.category);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const ordered = [...counts.entries()].sort((a, c) => c[1] - a[1]).map(([k]) => k);
    return { categoryOrder: ordered, categoryCounts: counts };
  }, [projects]);

  const activeList = useMemo(() => projects.filter((p) => !isCancelled(p)), [projects]);
  const cancelledList = projects.filter((p) => isCancelled(p));

  const totalBudget = activeList.reduce((s, p) => s + (budgetOf(p) ?? 0), 0);
  const withBudget = activeList.filter((p) => (budgetOf(p) ?? 0) > 0).length;
  const counts = {
    total: projects.length,
    active: projects.filter(isActive).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
    cancelled: cancelledList.length,
  };

  // The picture: share of tracked projects that are finished (out of 10)
  // and share reported as running late. Same counts as the tiles.
  const doneOf10 = counts.total > 0 ? (counts.completed / counts.total) * 10 : 0;
  const latePct = counts.total > 0 ? (counts.delayed / counts.total) * 100 : 0;

  // Chart rows: how many projects fall in each category (largest first).
  const categoryChart = categoryOrder.map((c) => ({ category: category(c), count: categoryCounts.get(c) ?? 0 }));
  // Biggest projects by money (latest reported budget), cancelled ones left out.
  const biggest = activeList.filter((p) => (budgetOf(p) ?? 0) > 0).sort((a, c) => (budgetOf(c) ?? 0) - (budgetOf(a) ?? 0));

  const filtered = useMemo(() => {
    const list = activeList.filter((p) => {
      if (catFilter !== "all" && normalizeCategory(p.category) !== catFilter) return false;
      if (statusFilter === "active" && !isActive(p)) return false;
      if (statusFilter === "delayed" && !isDelayed(p)) return false;
      if (statusFilter === "completed" && !isCompleted(p)) return false;
      return true;
    });
    const sorted = [...list];
    if (sortBy === "latest") sorted.sort((a, c) => (c.lastNewsAt ? new Date(c.lastNewsAt).getTime() : 0) - (a.lastNewsAt ? new Date(a.lastNewsAt).getTime() : 0));
    if (sortBy === "budget") sorted.sort((a, c) => (budgetOf(c) ?? 0) - (budgetOf(a) ?? 0));
    if (sortBy === "progress") sorted.sort((a, c) => (c.progressPct ?? 0) - (a.progressPct ?? 0));
    if (sortBy === "delay") sorted.sort((a, c) => (c.delayMonths ?? 0) - (a.delayMonths ?? 0));
    return sorted;
  }, [activeList, catFilter, statusFilter, sortBy]);

  const open = openId ? projects.find((p) => p.id === openId) ?? null : null;
  // Header freshness = newest project `updatedAt` (sent by the API as meta.lastUpdated).
  const asOf = data?.meta?.lastUpdated ?? null;
  const src = getModuleSources("infrastructure", state);
  // The module's own name (same as the sidebar), in the reader's language.
  const title = mt.label("infrastructure");
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
        budget_inr: budgetOf(p) ?? "",
        progress_pct: p.progressPct ?? "",
        delay_months: p.delayMonths ?? "",
        last_news: p.lastNewsAt ?? "",
      })),
    );

  return (
    <ModulePage>
      <PageHeader
        icon={HardHat}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: t("sourceLabel") }}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && <EmptyState emoji="🏗️" title={t("empty.title")} body={t("empty.body")} />}

      {!isLoading && projects.length > 0 && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer emoji="🏗️">
            {counts.cancelled > 0
              ? t.rich("explainerCancelledIn", { district: districtName, total: counts.total, done: counts.completed, active: counts.active, cancelled: counts.cancelled, num })
              : t.rich("explainerIn", { district: districtName, total: counts.total, done: counts.completed, active: counts.active, num })}{" "}
            {t("explainerTap")}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile emoji="🏗️" label={t("tiles.total")} value={m.num(counts.total)} sub={t("tiles.activeCount", { n: counts.active })} asOf={asOf} />
            <StatTile emoji="✅" label={t("tiles.completed")} value={m.num(counts.completed)} />
            <StatTile emoji="⏰" label={t("tiles.delayed")} value={m.num(counts.delayed)} sub={t("tiles.delayedSub")} />
            <StatTile
              emoji="💰"
              label={t("tiles.budget")}
              value={totalBudget > 0 ? inr(totalBudget) : "—"}
              sub={totalBudget > 0 ? t("tiles.budgetSub", { n: withBudget }) : t("card.budgetUnknown")}
              countUp={false}
            />
          </StatStrip>

          <div style={{ marginTop: 12 }}>
            <DataFreshnessIndicator projects={projects} />
          </div>
          <DisclaimerBanner />

          {/* 3. The picture: finished projects as 10 cranes + a "running late" dial. */}
          {counts.total >= 2 && (
            <div className="ftp-picture-row">
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center" }}>
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

          {/* 4. The list: every project as a card; tap for the full story. */}
          <Section title={t("list.title")} emoji="🚧">
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {categoryOrder.length >= 2 && (
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.category")}</div>
                  <Chips
                    label={t("list.categoryAria")}
                    value={catFilter}
                    onChange={setCatFilter}
                    items={[
                      { value: "all", label: t("list.all"), count: activeList.length },
                      ...categoryOrder.map((c) => ({ value: c, label: `${categoryEmoji(c)} ${category(c)}`, count: categoryCounts.get(c) ?? 0 })),
                    ]}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.status")}</div>
                  <Chips
                    label={t("list.statusAria")}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as StatusFilter)}
                    items={[
                      { value: "all", label: t("list.all"), count: activeList.length },
                      { value: "active", label: t("tiles.active"), count: counts.active },
                      { value: "delayed", label: t("tiles.delayed"), count: counts.delayed },
                      { value: "completed", label: t("tiles.completed"), count: counts.completed },
                    ]}
                  />
                </div>
                <label style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 8 }}>
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
                      fontSize: 13,
                      background: "var(--ftp-surface)",
                      color: "var(--ftp-text)",
                      fontFamily: "var(--ftp-font-sans)",
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

            {filtered.length > 0 ? (
              <div className="ftp-grid" style={GRID_CARDS}>
                {filtered.map((p) => (
                  <ProjectCard key={p.id} p={p} onOpen={() => setOpenId(p.id)} />
                ))}
              </div>
            ) : (
              <EmptyState emoji="🔍" title={t("list.noMatch")} body={t("list.noMatchBody")} />
            )}
          </Section>

          {cancelledList.length > 0 && (
            <Section emoji="🚫" title={t("cancelledTitle", { n: cancelledList.length })}>
              <div className="ftp-grid" style={GRID_CARDS}>
                {cancelledList.map((p) => (
                  <ProjectCard key={p.id} p={p} onOpen={() => setOpenId(p.id)} />
                ))}
              </div>
            </Section>
          )}

          {/* 5. Charts, two to a row on wide screens. */}
          {(biggest.length >= 2 || categoryChart.length >= 2) && (
            <div className="ftp-grid" style={{ ...GRID_CHARTS, marginTop: 28 }}>
              {biggest.length >= 2 && (
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
                      value: budgetOf(p) ?? 0,
                      display: inr(budgetOf(p)),
                    }))}
                  />
                </ChartCard>
              )}
              {categoryChart.length >= 2 && (
                <ChartCard
                  title={t("byCategory.title")}
                  emoji="📊"
                  units={t("byCategory.units")}
                  simple={t.rich("byCategory.simple", { name: categoryChart[0].category, n: categoryChart[0].count, total: counts.total, b })}
                  source={{ label: t("sourceLabel") }}
                  asOf={asOf}
                  table={categoryChart.map((r) => ({ label: r.category, value: m.num(r.count) }))}
                >
                  <ResponsiveContainer width="100%" height={Math.max(160, categoryChart.length * 36 + 40)}>
                    <BarChart data={categoryChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                      <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} tickFormatter={(v) => m.num(Number(v))} />
                      <YAxis type="category" dataKey="category" tick={CHART_AXIS} width={120} interval={0} />
                      <Tooltip formatter={(v) => [m.num(Number(v)), t("byCategory.legend")]} contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} />
                      <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("byCategory.legend")} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="infrastructure" district={district} />
      </div>

      <SourcesFooter sources={src.sources.map((name) => ({ name: st.name(name), frequency: st.freq(src.frequency) }))} />
      <NotOfficialNote />

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <LegalFooter />

      <MoneyToolbar shareTitle={title} onCsv={onCsv} csvDisabled={projects.length === 0} compareHref={`/${locale}/compare?module=infrastructure&a=${district}`} />

      <ProjectSheet p={open} onClose={closeSheet} />
    </ModulePage>
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
