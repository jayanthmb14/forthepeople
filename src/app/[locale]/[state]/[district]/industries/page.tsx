/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local industries — "Who gives work here, and who owes farmers money?"
// ═══════════════════════════════════════════════════════════════════════
//  Two views, picked by the district's data:
//    sugar  → sugar factories + crushing seasons + money owed to farmers
//             (the Karnataka sugar belt: Mandya …)
//    local  → every listed place from the LocalIndustry table (IT parks in
//             Bengaluru, heritage and factories in Mysuru, IT and pharma
//             in Hyderabad, anything elsewhere)
//  Page recipe (docs/LAYOUT.md, v4.1):
//    ModulePage → PageHeader → Explainer → 3–4 StatTiles → the picture
//    (factories that still owe farmers / a row of counts by kind) →
//    cards in .ftp-grid; tapping a card opens a DetailSheet with every
//    stored detail, the seasons, the source and Call / Directions →
//    charts two to a row → AI insight → Download / Share / Compare.
//  v5: no emoji (small line icons for kinds of place); sources, "not an
//  official website" and the stale-data note come from the district shell.
//  Every number is counted from the rows the API sends; nothing is typed
//  in by hand. Names, descriptions and figures from the database stay as
//  published. Words live in "page_industries".
"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Briefcase, Building2, Coins, Cpu, Factory, Landmark, Layers, Luggage, Sprout, Tractor, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFactories, useLocalIndustries } from "@/hooks/useRealtimeData";
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
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/calm-parts";
import { useDistrictName, useModuleText } from "@/i18n/client";
import { IconCountRow, TopBarList } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import MoneyToolbar, { downloadCsv } from "@/components/money/MoneyToolbar";
import {
  FactoryCard,
  FactorySheet,
  IndustryCard,
  IndustrySheet,
  companiesOf,
  industryIcon,
  jobsOf,
  numeric,
  useGloss,
  visitorsOf,
  type FactoryRow,
  type LocalIndustry,
} from "./industry-parts";

/** One CSV row. */
type CsvRow = Record<string, string | number | null | undefined>;
/** What each view reports to the page: freshness date + CSV rows. */
type ViewData = { asOf: string | null; rows: CsvRow[] };

const CRORE = 10_000_000;
const GRID_CARDS = { ["--ftp-grid-min" as string]: "280px" } as React.CSSProperties;
const GRID_CHARTS = { ["--ftp-grid-min" as string]: "360px", alignItems: "start", marginTop: 28 } as React.CSSProperties;

/** The newest `updatedAt` among rows (the API sends it with every row). */
function latestUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
  return best;
}

/** Cut long names for a chart axis; the tooltip keeps the full name. */
function shortName(s: string, max = 22): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** A horizontal bar chart in the module hue. Rows are { name (full), label (axis), value }. */
function HueBarChart({ rows, valueName, format }: { rows: Array<{ name: string; label: string; value: number }>; valueName: string; format: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
        <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => format(Number(v))} />
        <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={130} interval={0} />
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

const b = (c: React.ReactNode) => <strong>{c}</strong>;
const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

// ── Which view, which title ───────────────────────────────
type Mode = "sugar" | "local";
function getIndustryMeta(district: string): { key: string; icon: LucideIcon; mode: Mode } {
  if (district === "bengaluru-urban") return { key: "tech", icon: Cpu, mode: "local" };
  if (district === "mysuru") return { key: "heritage", icon: Landmark, mode: "local" };
  if (district === "hyderabad") return { key: "hyderabad", icon: Cpu, mode: "local" };
  // Karnataka sugar belt districts (Mandya, etc.)
  const sugarDistricts = ["mandya", "mysuru-rural", "chamarajanagar", "kodagu"];
  if (sugarDistricts.includes(district)) return { key: "sugar", icon: Factory, mode: "sugar" };
  return { key: "general", icon: Factory, mode: "local" };
}

// ── Sugar factories ───────────────────────────────────────
function SugarView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const { data, isLoading, error } = useFactories(district, state);
  const factories = (data?.data ?? []) as FactoryRow[];
  const [openId, setOpenId] = useState<string | null>(null);
  const closeSheet = useCallback(() => setOpenId(null), []);
  const open = openId ? factories.find((f) => f.id === openId) ?? null : null;

  const totalArrears = factories.reduce((s, f) => s + (f.seasonData[0]?.totalArrears ?? 0), 0);
  const totalFarmers = factories.reduce((s, f) => s + (f.seasonData[0]?.farmersCount ?? 0), 0);
  const totalCane = factories.reduce((s, f) => s + (f.seasonData[0]?.totalCaneCrushed ?? 0), 0);
  const asOf = latestUpdatedAt(factories);
  const latestSeason = factories.map((f) => f.seasonData[0]?.season).filter(Boolean).sort().pop();
  const source = { label: t("sourceLabel") };

  // The picture: one factory per factory whose latest season has a recorded
  // arrears figure; lit when that figure is above zero.
  const withArrearsFigure = factories.filter((f) => f.seasonData[0]?.totalArrears != null);
  const owing = withArrearsFigure.filter((f) => (f.seasonData[0]?.totalArrears ?? 0) > 0);
  const pictoTotal = withArrearsFigure.length <= 12 ? withArrearsFigure.length : 10;
  const pictoFilled =
    withArrearsFigure.length <= 12 ? owing.length : withArrearsFigure.length > 0 ? (owing.length / withArrearsFigure.length) * 10 : 0;
  // Charts: money owed per factory, and cane crushed per factory (latest season).
  const arrearsChart = owing
    .map((f) => ({ name: f.name, label: shortName(f.name), value: Number(((f.seasonData[0]?.totalArrears ?? 0) / CRORE).toFixed(2)) }))
    .sort((a, c) => c.value - a.value);
  const crushed = factories
    .map((f) => ({ f, season: f.seasonData[0]?.season, value: f.seasonData[0]?.totalCaneCrushed ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, c) => c.value - a.value);
  const tonnes = (n: number) => t("units.tonnes", { n: m.num(n) });

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
        })),
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={4} />;
  if (error) return <ErrorBlock />;
  if (factories.length === 0) return <EmptyState title={t("sugar.empty.title")} body={t("sugar.empty.body")} />;

  return (
    <>
      {/* 1. The answer in one sentence. */}
      {withArrearsFigure.length > 0 && (
        <Explainer>
          {totalArrears > 0
            ? t.rich("sugar.explainer", { amount: m.crore(totalArrears / CRORE, 2), owing: owing.length, total: withArrearsFigure.length, num })
            : t.rich("sugar.explainerNone", { total: withArrearsFigure.length, num })}{" "}
          {t("sugar.explainerTap")}
        </Explainer>
      )}

      {/* 2. The big numbers. */}
      <StatStrip cols={4}>
        <StatTile icon={Factory} label={t("sugar.tiles.factories")} value={m.num(factories.length)} asOf={asOf} />
        <StatTile
          icon={Coins}
          label={t("sugar.tiles.arrears")}
          value={totalArrears > 0 ? m.num(totalArrears / CRORE, 2) : "—"}
          unit={totalArrears > 0 ? t("units.crore") : undefined}
          sub={latestSeason ? t("sugar.tiles.arrearsSubSeason", { season: latestSeason }) : t("sugar.tiles.arrearsSub")}
        />
        <StatTile icon={Sprout} label={t("sugar.tiles.farmers")} value={totalFarmers ? m.num(totalFarmers) : "—"} sub={latestSeason ? t("season", { season: latestSeason }) : undefined} />
        <StatTile icon={Tractor} label={t("sugar.tiles.cane")} value={totalCane ? m.num(totalCane) : "—"} sub={t("sugar.tiles.caneSub")} />
      </StatStrip>

      {/* 3. The picture: who still owes farmers money. Needs two factories with a figure. */}
      {withArrearsFigure.length >= 2 && (
        <Card padding={18} style={{ marginTop: 16 }}>
          <IconPictogram
            total={pictoTotal}
            filled={pictoFilled}
            icon={Factory}
            label={
              withArrearsFigure.length <= 12
                ? t("sugar.pictogramCount", { owing: owing.length, total: withArrearsFigure.length })
                : t("sugar.pictogramShare", { n: Math.round(pictoFilled) })
            }
          />
        </Card>
      )}

      {/* 4. Factories as cards; tap one for its seasons, Call and Directions. */}
      <Section title={t("sugar.listTitle", { n: factories.length })}>
        <div className="ftp-grid" style={GRID_CARDS}>
          {factories.map((f) => (
            <FactoryCard key={f.id} f={f} onOpen={() => setOpenId(f.id)} />
          ))}
        </div>
      </Section>

      {/* 5. Charts. */}
      {(arrearsChart.length >= 2 || crushed.length >= 2) && (
        <div className="ftp-grid" style={GRID_CHARTS}>
          {arrearsChart.length >= 2 && (
            <ChartCard
              title={t("sugar.arrearsChart.title")}
              units={t("sugar.arrearsChart.units")}
              simple={t.rich("sugar.arrearsChart.simple", { name: arrearsChart[0].name, amount: m.crore(arrearsChart[0].value, 2), b })}
              source={source}
              asOf={asOf}
              table={arrearsChart.map((r) => ({ label: r.name, value: m.crore(r.value, 2) }))}
            >
              <HueBarChart rows={arrearsChart} valueName={t("sugar.arrearsChart.legend")} format={(v) => m.crore(v)} />
            </ChartCard>
          )}
          {crushed.length >= 2 && (
            <ChartCard
              title={t("sugar.crushed.title")}
              units={t("sugar.crushed.units")}
              simple={t.rich("sugar.crushed.simple", { name: crushed[0].f.name, amount: tonnes(crushed[0].value), b })}
              source={source}
              asOf={asOf}
              table={crushed.slice(0, 5).map((r) => ({ label: r.f.name, value: tonnes(r.value) }))}
            >
              <TopBarList
                rows={crushed.map((r) => ({
                  key: r.f.id,
                  label: r.f.name,
                  sub: r.season ? t("season", { season: r.season }) : undefined,
                  value: r.value,
                  display: tonnes(r.value),
                }))}
              />
            </ChartCard>
          )}
        </div>
      )}

      <FactorySheet f={open} onClose={closeSheet} />
    </>
  );
}

// ── Every listed place (IT parks, heritage, factories, markets …) ──
function LocalView({ district, state, metaKey, onData }: { district: string; state: string; metaKey: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const gloss = useGloss();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const [kind, setKind] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const closeSheet = useCallback(() => setOpenId(null), []);
  const open = openId ? industries.find((p) => p.id === openId) ?? null : null;
  const asOf = latestUpdatedAt(industries);
  const source = { label: t("sourceLabel") };

  // Kinds of place, counted from the rows (largest first).
  const counts = new Map<string, { n: number; sample: LocalIndustry }>();
  for (const p of industries) {
    const c = p.category?.trim() || "Other";
    const cur = counts.get(c);
    counts.set(c, { n: (cur?.n ?? 0) + 1, sample: cur?.sample ?? p });
  }
  const kinds = [...counts.entries()].sort((a, c) => c[1].n - a[1].n);
  const shown = kind === "all" ? industries : industries.filter((p) => (p.category?.trim() || "Other") === kind);

  // Totals that only count rows that report a figure.
  const withJobs = industries.map((p) => ({ p, value: jobsOf(p) })).filter((r): r is { p: LocalIndustry; value: number } => r.value !== null).sort((a, c) => c.value - a.value);
  const jobsTotal = withJobs.reduce((s, r) => s + r.value, 0);
  const withVisitors = industries.map((p) => ({ p, value: visitorsOf(p) })).filter((r): r is { p: LocalIndustry; value: number } => r.value !== null).sort((a, c) => c.value - a.value);
  const visitorsTotal = withVisitors.reduce((s, r) => s + r.value, 0);
  const withCompanies = industries.map((p) => ({ p, value: companiesOf(p) })).filter((r): r is { p: LocalIndustry; value: number } => r.value !== null).sort((a, c) => c.value - a.value);
  const companiesTotal = withCompanies.reduce((s, r) => s + r.value, 0);

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: industries.map((p) => ({
        name: p.name,
        category: p.category ?? "",
        type: p.type ?? "",
        location: p.location ?? "",
        employees: jobsOf(p) ?? "",
        visitors_per_year: visitorsOf(p) ?? "",
        companies: companiesOf(p) ?? "",
        area: numeric(p.details?.area) ?? numeric(p.details?.area_acres) ?? "",
        source: p.source ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;
  if (industries.length === 0) return <EmptyState title={metaKey === "tech" ? t("tech.empty") : t("general.empty")} />;

  const topKind = kinds[0];
  return (
    <>
      {/* 1. The answer in one sentence. */}
      <Explainer>
        {t.rich("local.explainer", { total: industries.length, district: districtName, name: gloss("cat", topKind[0]), n: topKind[1].n, num, b })}
        {withJobs.length > 0 && <> {t.rich("local.explainerJobs", { people: m.num(jobsTotal), places: withJobs.length, num })}</>} {t("local.explainerTap")}
      </Explainer>

      {/* 2. The big numbers — only figures the rows report. */}
      <StatStrip>
        <StatTile icon={Building2} label={t("local.tiles.listed")} value={m.num(industries.length)} asOf={asOf} />
        <StatTile icon={Layers} label={t("local.tiles.kinds")} value={m.num(kinds.length)} />
        {withJobs.length > 0 && (
          <StatTile icon={Users} label={t("local.tiles.jobs")} value={m.num(jobsTotal)} sub={t("local.tiles.reportedBy", { n: withJobs.length })} />
        )}
        {withVisitors.length > 0 ? (
          <StatTile icon={Luggage} label={t("facts.visitors")} value={m.num(visitorsTotal)} sub={t("local.tiles.reportedBy", { n: withVisitors.length })} />
        ) : withCompanies.length > 0 ? (
          <StatTile icon={Briefcase} label={t("facts.companies")} value={m.num(companiesTotal)} sub={t("local.tiles.reportedBy", { n: withCompanies.length })} />
        ) : null}
      </StatStrip>

      {/* 3. The picture: what kinds of place this district has, one tile per kind. */}
      {kinds.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <IconCountRow
            label={t("local.kindsAria")}
            items={kinds.slice(0, 8).map(([c, v]) => ({ key: c, icon: industryIcon(v.sample), count: m.num(v.n), label: gloss("cat", c) }))}
          />
        </div>
      )}

      {/* 4. The list: every place as a card; tap for everything stored about it. */}
      <Section title={t("local.listTitle", { n: industries.length })}>
        {kinds.length >= 2 && (
          <div style={{ marginBottom: 16 }}>
            <Chips
              label={t("local.filterAria")}
              value={kind}
              onChange={setKind}
              // Counts are in the picture above, so the chips stay short.
              items={[{ value: "all", label: t("local.all") }, ...kinds.map(([c]) => ({ value: c, label: gloss("cat", c) }))]}
            />
          </div>
        )}
        <div className="ftp-grid" style={GRID_CARDS}>
          {shown.map((p) => (
            <IndustryCard key={p.id} p={p} onOpen={() => setOpenId(p.id)} />
          ))}
        </div>
      </Section>

      {/* 5. Charts: who gives the most work, most visited, most companies. */}
      {(withJobs.length >= 2 || withVisitors.length >= 2 || withCompanies.length >= 2) && (
        <div className="ftp-grid" style={GRID_CHARTS}>
          {withJobs.length >= 2 && (
            <ChartCard
              title={t("general.jobs.title")}
              units={t("general.jobs.units")}
              simple={t.rich("general.jobs.simple", { name: withJobs[0].p.name, n: m.num(withJobs[0].value), b })}
              source={source}
              asOf={asOf}
              table={withJobs.slice(0, 5).map((r) => ({ label: r.p.name, value: m.num(r.value) }))}
            >
              <TopBarList
                rows={withJobs.map((r) => ({
                  key: r.p.id,
                  label: r.p.name,
                  sub: gloss("cat", r.p.category) || undefined,
                  icon: industryIcon(r.p),
                  value: r.value,
                  display: m.num(r.value),
                }))}
              />
            </ChartCard>
          )}
          {withVisitors.length >= 2 && (
            <ChartCard
              title={t("local.visitors.title")}
              units={t("local.visitors.units")}
              simple={t.rich("local.visitors.simple", { name: withVisitors[0].p.name, n: m.num(withVisitors[0].value), b })}
              source={source}
              asOf={asOf}
              table={withVisitors.slice(0, 5).map((r) => ({ label: r.p.name, value: m.num(r.value) }))}
            >
              <TopBarList
                rows={withVisitors.map((r) => ({ key: r.p.id, label: r.p.name, icon: industryIcon(r.p), value: r.value, display: m.num(r.value) }))}
              />
            </ChartCard>
          )}
          {withCompanies.length >= 2 && (
            <ChartCard
              title={t("tech.companies.title")}
              units={t("tech.companies.units")}
              simple={t.rich("tech.companies.simple", { name: withCompanies[0].p.name, n: m.num(withCompanies[0].value), b })}
              source={source}
              asOf={asOf}
              table={withCompanies.slice(0, 5).map((r) => ({ label: r.p.name, value: t("tech.companies.value", { n: m.num(r.value) }) }))}
            >
              <HueBarChart
                rows={withCompanies.slice(0, 8).map((r) => ({ name: r.p.name, label: shortName(r.p.name), value: r.value }))}
                valueName={t("facts.companies")}
                format={(v) => m.num(v)}
              />
            </ChartCard>
          )}
        </div>
      )}

      <IndustrySheet p={open} onClose={closeSheet} />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IndustriesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_industries");
  const mt = useModuleText();
  const meta = getIndustryMeta(district);
  const title = meta.key === "sugar" || meta.key === "general" ? mt.label("industries") : t(`meta.${meta.key}.title`);
  // Filled in by whichever view is showing (see ViewData above).
  const [view, setView] = useState<ViewData>({ asOf: null, rows: [] });

  return (
    <ModulePage>
      <PageHeader
        icon={meta.icon}
        title={title}
        description={t(`meta.${meta.key}.description`)}
        freshness={view.asOf ? { asOf: view.asOf } : undefined}
        source={{ label: t("sourceLabel") }}
      />
      {meta.mode === "sugar" ? (
        <SugarView district={district} state={state} onData={setView} />
      ) : (
        <LocalView district={district} state={state} metaKey={meta.key} onData={setView} />
      )}

      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="industries" district={district} />
      </div>

      <MoneyToolbar
        shareTitle={title}
        onCsv={() => downloadCsv(`${district}-industries.csv`, view.rows)}
        csvDisabled={view.rows.length === 0}
        compareHref={`/${locale}/compare?module=industries&a=${district}`}
      />
    </ModulePage>
  );
}
