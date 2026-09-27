/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Projects being built — "Where does the money go, and is the work done?"
 * News-driven: every fact links to a news article or press release; the
 * platform presents facts, never judgment. The API sends only this
 * district's own projects (LOCAL_INFRA).
 *
 * The answer in one line: "We follow 23 projects in Hyderabad: 12 under
 * construction, 9 announced or approved and 1 completed. 5 are late or
 * stalled."
 * Page recipe (docs/LAYOUT.md, v5 calm):
 *   ModulePage → PageHeader (the district shell adds the "N days old" note
 *   above it when the list is stale) → Explainer → 4 StatTiles (followed, late or stalled, completed,
 *   money announced) → the picture (one stage bar) → one provenance line →
 *   filters + descriptive project cards (what it is, kind, where, stage,
 *   budget in rupees, finish date, our own points, last update); tapping a
 *   card opens the project's DetailSheet → cancelled projects → charts
 *   (biggest by money, by kind) → AI insight → legal notice (collapsed) →
 *   Share / CSV / Compare → related news.
 * v5.1: every kind of project has its own crafted glyph and pastel colour
 * (src/components/graphics, projectKindGlyph) on the kind chips, the
 * cards, the sheet and both charts.
 * Stage and kind come from src/lib/civic/project-facts (closed lists), and
 * rows that are clearly not building projects (a renaming, a railway
 * maintenance block) are left out and counted in one quiet line. Sources,
 * "not an official website" and "report a mistake" live in the district
 * shell's verification panel.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useCallback, useMemo, useState } from "react";
import { CheckCircle2, Clock, HardHat, Wallet } from "lucide-react";
import { useInfrastructure, useOverview } from "@/hooks/useRealtimeData";
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
} from "@/components/district/ui";
import { GlyphBarList, GlyphChips, GlyphEmptyState, projectKindGlyph } from "@/components/graphics";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, Explainer } from "@/components/district/visuals";
import ModuleNews from "@/components/district/ModuleNews";
import { useDistrictName, useModuleText } from "@/i18n/client";
import { StageBar } from "@/components/money/visuals";
import MoneyToolbar, { downloadCsv } from "@/components/money/MoneyToolbar";
import { CalmNote } from "@/components/district/calm-parts";
import knDict from "@/dictionaries/kn.json";
import {
  NO_NEWS_DAYS,
  STAGE_ORDER,
  daysAgo,
  isLate,
  isNonProject,
  projectPoints,
  type ProjectKind,
  type ProjectPoint,
  type ProjectStage,
} from "@/lib/civic/project-facts";
import { STAGE_FILL, isCancelled, isCompleted, kindOf, stageOf } from "./components/infra-utils";
import { useInfraText } from "./components/infra-i18n";
import ProjectCard, { budgetOf } from "./components/ProjectCard";
import ProjectSheet from "./components/ProjectSheet";
import LegalFooter from "./components/LegalFooter";
import DisclaimerBanner from "./components/DisclaimerBanner";
import { NEWS_MAX_DAYS, newestUpdate } from "./components/DataFreshnessIndicator";

type StageFilter = "all" | "building" | "planned" | "late" | "completed";
type SortOption = "stage" | "latest" | "budget" | "progress";

/** The API row carries taluk and update columns the shared type leaves out. */
type Row = InfraProject & { talukId?: string | null };

const GRID_CARDS = { ["--ftp-grid-min" as string]: "300px" } as React.CSSProperties;
const GRID_CHARTS = { ["--ftp-grid-min" as string]: "360px", alignItems: "start" } as React.CSSProperties;
/** Stage bar order: what is moving first, then what is waiting, then what is done. */
const BAR_STAGES: ProjectStage[] = ["building", "stalled", "approved", "announced", "completed"];

const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const { t, m, kind, stage, inr } = useInfraText();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useInfrastructure(district, state);
  const { data: overview } = useOverview(district, state);
  const all = useMemo<Row[]>(() => (data?.data ?? []) as Row[], [data]);

  // Clear non-projects (a renaming, a railway maintenance block) are left out.
  const projects = useMemo(() => all.filter((p) => !isNonProject(p)), [all]);
  const hiddenCount = all.length - projects.length;

  const [kindFilter, setKindFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("stage");
  const [openId, setOpenId] = useState<string | null>(null);
  // Stable, so the open sheet does not re-run its focus effect on every render.
  const closeSheet = useCallback(() => setOpenId(null), []);

  // Our points, worked out once per project from its own row (+ the list, for look-alikes).
  const points = useMemo(() => {
    const out = new Map<string, ProjectPoint[]>();
    for (const p of projects) out.set(p.id, projectPoints(p, projects));
    return out;
  }, [projects]);
  const late = useMemo(() => new Set(projects.filter((p) => isLate(p)).map((p) => p.id)), [projects]);

  // Taluk names from the district overview (by id), in the reader's script when it matches.
  const taluks = overview?.data?.taluks ?? [];
  const placeOf = (p: Row) => {
    const tk = p.talukId ? taluks.find((x) => x.id === p.talukId) : undefined;
    if (!tk) return null;
    return locale === "kn" && tk.nameLocal ? tk.nameLocal : tk.name;
  };

  const { kindOrder, kindCounts } = useMemo(() => {
    const counts = new Map<ProjectKind, number>();
    for (const p of projects) {
      const k = kindOf(p);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const ordered = [...counts.entries()].sort((a, c) => c[1] - a[1]).map(([k]) => k);
    return { kindOrder: ordered, kindCounts: counts };
  }, [projects]);

  const activeList = useMemo(() => projects.filter((p) => !isCancelled(p)), [projects]);
  const cancelledList = projects.filter((p) => isCancelled(p));
  // The kind chips filter the active list, so they count only active projects
  // (the "by kind" chart below counts every project, like the page total).
  const activeKindCounts = new Map<ProjectKind, number>();
  for (const p of activeList) activeKindCounts.set(kindOf(p), (activeKindCounts.get(kindOf(p)) ?? 0) + 1);

  const stageCounts = new Map<ProjectStage, number>();
  for (const p of projects) stageCounts.set(stageOf(p), (stageCounts.get(stageOf(p)) ?? 0) + 1);
  const count = (s: ProjectStage) => stageCounts.get(s) ?? 0;

  const totalBudget = activeList.reduce((s, p) => s + (budgetOf(p) ?? 0), 0);
  const withBudget = activeList.filter((p) => (budgetOf(p) ?? 0) > 0).length;
  const quiet = activeList.filter((p) => {
    if (isCompleted(p)) return false;
    const d = daysAgo(p.lastNewsAt ? new Date(p.lastNewsAt).getTime() : null);
    return d === null || d > NO_NEWS_DAYS;
  }).length;
  const counts = {
    total: projects.length,
    building: count("building"),
    planned: count("announced") + count("approved"),
    completed: count("completed"),
    late: late.size,
    cancelled: cancelledList.length,
  };

  // Chart rows: projects of each kind (largest first).
  const kindChart = kindOrder.map((k) => ({ key: k, kind: kind(k), count: kindCounts.get(k) ?? 0 }));
  // Biggest projects by money (latest reported budget), cancelled ones left out.
  const biggest = activeList.filter((p) => (budgetOf(p) ?? 0) > 0).sort((a, c) => (budgetOf(c) ?? 0) - (budgetOf(a) ?? 0));

  const filtered = useMemo(() => {
    const list = activeList.filter((p) => {
      if (kindFilter !== "all" && kindOf(p) !== kindFilter) return false;
      const st = stageOf(p);
      if (stageFilter === "building" && st !== "building") return false;
      if (stageFilter === "planned" && st !== "announced" && st !== "approved") return false;
      if (stageFilter === "late" && !late.has(p.id)) return false;
      if (stageFilter === "completed" && st !== "completed") return false;
      return true;
    });
    const sorted = [...list];
    const byBudget = (a: Row, c: Row) => (budgetOf(c) ?? 0) - (budgetOf(a) ?? 0);
    if (sortBy === "stage") sorted.sort((a, c) => STAGE_ORDER[stageOf(a)] - STAGE_ORDER[stageOf(c)] || byBudget(a, c));
    if (sortBy === "latest") sorted.sort((a, c) => (c.lastNewsAt ? new Date(c.lastNewsAt).getTime() : 0) - (a.lastNewsAt ? new Date(a.lastNewsAt).getTime() : 0));
    if (sortBy === "budget") sorted.sort(byBudget);
    if (sortBy === "progress") sorted.sort((a, c) => (c.progressPct ?? -1) - (a.progressPct ?? -1));
    return sorted;
  }, [activeList, kindFilter, stageFilter, sortBy, late]);

  const open = openId ? projects.find((p) => p.id === openId) ?? null : null;
  // Page date = the newest update of any kind (news, our check, tracked update).
  const asOf = newestUpdate(projects);
  // The module's own name (same as the sidebar), in the reader's language.
  const title = mt.label("infrastructure");
  // Local-script title: the module name in the state's language (Kannada
  // only for now). PageHeader hides it when it is already the title.
  const titleLocal = state === "karnataka" ? knDict.moduleNames.infrastructure : undefined;

  const stageParts = BAR_STAGES.map((s) => ({ key: s, label: stage(s), value: count(s), fill: STAGE_FILL[s] }));

  const onCsv = () =>
    downloadCsv(
      `${district}-infrastructure.csv`,
      projects.map((p) => ({
        name: p.name,
        kind: kindOf(p),
        stage: stageOf(p),
        category_as_published: p.category,
        status_as_published: p.status,
        executing_agency: p.executingAgency ?? "",
        announced_by: p.announcedBy ?? "",
        budget_inr: budgetOf(p) ?? "",
        progress_pct: p.progressPct ?? "",
        delay_months: p.delayMonths ?? "",
        last_news: p.lastNewsAt ?? "",
        last_checked: p.lastVerifiedAt ?? "",
      })),
    );

  return (
    <ModulePage>
      <PageHeader
        icon={HardHat}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        freshness={asOf ? { asOf, thresholdHours: NEWS_MAX_DAYS * 24 } : undefined}
        source={{ label: t("sourceLabel") }}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && (
        <GlyphEmptyState
          pick={projectKindGlyph("other")}
          companions={[projectKindGlyph("road"), projectKindGlyph("bridge")]}
          title={t("empty.title")}
          body={t("empty.body")}
        />
      )}

      {!isLoading && projects.length > 0 && (
        <>
          {/* 1. The answer in one sentence (plus what needs attention). */}
          <Explainer>
            {t.rich("v5.explainer", { district: districtName, total: counts.total, building: counts.building, planned: counts.planned, done: counts.completed, num })}{" "}
            {counts.late > 0 && <>{t.rich("v5.explainerLate", { late: counts.late, num })} </>}
            {quiet > 0 && <>{t.rich("v5.explainerQuiet", { quiet, num })} </>}
            {t("explainerTap")}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile icon={HardHat} label={t("v5.tiles.total")} value={m.num(counts.total)} sub={t("v5.tiles.totalSub", { n: counts.building })} asOf={asOf} />
            <StatTile icon={Clock} label={t("v5.tiles.late")} value={m.num(counts.late)} sub={t("v5.tiles.lateSub")} />
            <StatTile icon={CheckCircle2} label={t("v5.tiles.completed")} value={m.num(counts.completed)} />
            <StatTile
              icon={Wallet}
              label={t("v5.tiles.budget")}
              value={totalBudget > 0 ? inr(totalBudget) : "—"}
              sub={totalBudget > 0 ? t("v5.tiles.budgetSub", { n: withBudget }) : t("v5.card.budgetUnknown")}
              countUp={false}
            />
          </StatStrip>

          {/* 3. The picture: where the projects stand, in one bar. */}
          {counts.total >= 2 && (
            <Card padding={18} style={{ marginTop: 16 }}>
              <p className="ftp-title" style={{ margin: "0 0 12px", fontWeight: 650 }}>{t("v5.stages.title")}</p>
              <StageBar
                parts={stageParts}
                format={(n) => m.num(n)}
                ariaLabel={t("v5.stages.aria", { list: stageParts.map((s) => t("v5.stages.item", { n: s.value, label: s.label })).join(", ") })}
              />
            </Card>
          )}

          {/* Where the facts come from, in one line; the full notice one tap away. */}
          <DisclaimerBanner />

          {/* 4. The list: every project as a card; tap for the full story. */}
          <Section title={t("list.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {kindOrder.length >= 2 && (
                <div>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.category")}</div>
                  <GlyphChips
                    label={t("list.categoryAria")}
                    value={kindFilter}
                    onChange={setKindFilter}
                    items={[
                      { value: "all", label: t("list.all"), count: activeList.length },
                      ...kindOrder
                        .filter((k) => (activeKindCounts.get(k) ?? 0) > 0)
                        .map((k) => ({ value: k, label: kind(k), count: activeKindCounts.get(k) ?? 0, pick: projectKindGlyph(k) })),
                    ]}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ftp-label" style={{ marginBottom: 6 }}>{t("list.status")}</div>
                  <Chips
                    label={t("list.statusAria")}
                    value={stageFilter}
                    onChange={(v) => setStageFilter(v as StageFilter)}
                    items={[
                      { value: "all", label: t("list.all"), count: activeList.length },
                      { value: "building", label: stage("building"), count: counts.building },
                      { value: "planned", label: `${stage("announced")} / ${stage("approved")}`, count: counts.planned },
                      { value: "late", label: t("v5.tiles.late"), count: counts.late },
                      { value: "completed", label: stage("completed"), count: counts.completed },
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
                      border: "1px solid var(--ftp-border-strong)",
                      borderRadius: "var(--ftp-radius-pill)",
                      fontSize: 13,
                      background: "var(--ftp-surface)",
                      color: "var(--ftp-text)",
                      fontFamily: "var(--ftp-font-sans)",
                    }}
                  >
                    <option value="stage">{t("v5.sortStage")}</option>
                    <option value="budget">{t("list.sortBudget")}</option>
                    <option value="latest">{t("list.sortLatest")}</option>
                    <option value="progress">{t("list.sortProgress")}</option>
                  </select>
                </label>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="ftp-grid" style={GRID_CARDS}>
                {filtered.map((p) => (
                  <ProjectCard key={p.id} p={p} points={points.get(p.id) ?? []} place={placeOf(p)} onOpen={() => setOpenId(p.id)} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("list.noMatch")} body={t("list.noMatchBody")} />
            )}

            {hiddenCount > 0 && (
              <CalmNote tone="quiet" style={{ marginTop: 16, fontSize: 13 }}>
                {t("v5.hidden", { n: hiddenCount })}
              </CalmNote>
            )}
          </Section>

          {cancelledList.length > 0 && (
            <Section title={t("cancelledTitle", { n: cancelledList.length })}>
              <div className="ftp-grid" style={GRID_CARDS}>
                {cancelledList.map((p) => (
                  <ProjectCard key={p.id} p={p} points={points.get(p.id) ?? []} place={placeOf(p)} onOpen={() => setOpenId(p.id)} />
                ))}
              </div>
            </Section>
          )}

          {/* 5. Charts, two to a row on wide screens. */}
          {(biggest.length >= 2 || kindChart.length >= 2) && (
            <div className="ftp-grid" style={{ ...GRID_CHARTS, marginTop: 28 }}>
              {biggest.length >= 2 && (
                <ChartCard
                  title={t("biggest.title")}
                  units={t("biggest.units")}
                  simple={t.rich("biggest.simple", { name: biggest[0].name, amount: inr(budgetOf(biggest[0])), b })}
                  source={{ label: t("sourceLabel") }}
                  asOf={asOf}
                  table={biggest.slice(0, 5).map((p) => ({ label: p.name, value: inr(budgetOf(p)) }))}
                >
                  {/* Bars in the page colour (a money ranking); each chip shows the kind. */}
                  <GlyphBarList
                    colour="page"
                    max={5}
                    rows={biggest.map((p) => ({
                      key: p.id,
                      label: p.name,
                      sub: t("biggest.sub", { category: kind(kindOf(p)), status: stage(stageOf(p)) }),
                      pick: projectKindGlyph(kindOf(p)),
                      value: budgetOf(p) ?? 0,
                      display: inr(budgetOf(p)),
                    }))}
                  />
                </ChartCard>
              )}
              {kindChart.length >= 2 && (
                <ChartCard
                  title={t("v5.kindChart.title")}
                  units={t("v5.kindChart.units")}
                  simple={t.rich("v5.kindChart.simple", { name: kindChart[0].kind, n: kindChart[0].count, total: counts.total, b })}
                  source={{ label: t("sourceLabel") }}
                  asOf={asOf}
                  table={kindChart.map((r) => ({ label: r.kind, value: m.num(r.count) }))}
                >
                  {/* One row per kind, each in its own colour, matching the chips and cards. */}
                  <GlyphBarList
                    dense
                    rows={kindChart.map((r) => ({ key: r.key, label: r.kind, value: r.count, display: m.num(r.count), pick: projectKindGlyph(r.key) }))}
                  />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="infrastructure" district={district} />
      </div>

      <LegalFooter />

      <MoneyToolbar shareTitle={title} onCsv={onCsv} csvDisabled={projects.length === 0} compareHref={`/${locale}/compare?module=infrastructure&a=${district}`} />

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <ProjectSheet p={open} points={open ? points.get(open.id) ?? [] : []} place={open ? placeOf(open) : null} onClose={closeSheet} />
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
