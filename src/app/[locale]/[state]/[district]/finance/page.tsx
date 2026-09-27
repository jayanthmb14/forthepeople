/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Finance & Budget — module page (Design v4 "Rang", the reference page)
// ═══════════════════════════════════════════════════════════════════════
//  Order on the page (same for every module page):
//    PageHeader → one-paragraph summary → AI insight → StatStrip → the
//    picture (coins + dial) → "how each ₹100 is shared" ring → sector
//    chart → lapsed funds → allocations table → revenue chart →
//    SourcesFooter → ModuleNews → Toolbar
//
//  Data comes from the same hooks as before (useBudget, useRevenue,
//  useAIInsight). Every word is in the "page_finance" messages; numbers
//  and dates go through useFormat / useMoney, so the page reads the same
//  in every language. Every total carries the fiscal year plus an "As of"
//  date taken from when we fetched the rows.
"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PiggyBank } from "lucide-react";
import { useBudget, useRevenue, useAIInsight } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  DataTable,
  ProgressBar,
  EmptyState,
  AIInsightBanner,
  SourcesFooter,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Gauge, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import { useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import { ShareDonut, type DonutSlice } from "@/components/money/visuals";
import { useMoney, useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";
import knDict from "@/dictionaries/kn.json";

/** 1 crore = 10 million rupees. Amounts in the database are in rupees. */
const CRORE = 10_000_000;
const LAKH = 100_000;

/** Official websites for the sources named by getModuleSources("budget"). */
const SOURCE_URLS: Record<string, string> = {
  "PFMS (Public Financial Management System)": "https://pfms.nic.in",
  "State Treasury / eGramSwaraj": "https://egramswaraj.gov.in",
};

/** The newest timestamp in a list of rows (rows carry `fetchedAt` from the API). */
function latestFetchedAt(rows: Array<{ fetchedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.fetchedAt && (!best || r.fetchedAt > best)) best = r.fetchedAt;
  }
  return best;
}

const b = (c: React.ReactNode) => <strong>{c}</strong>;

function FinancePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_finance");
  const mt = useModuleText();
  const place = usePlaceText();
  const f = useFormat();
  const m = useMoney();
  const st = useSourceText();
  const base = `/${locale}/${state}/${district}`;
  const { data: budgetData, isLoading: bLoading } = useBudget(district, state);
  const { data: revenueData, isLoading: rLoading } = useRevenue(district, state);
  const { data: aiInsight } = useAIInsight(district, "finance");

  const entries = budgetData?.data?.entries ?? [];
  const allocations = budgetData?.data?.allocations ?? [];
  const collections = revenueData?.data?.collections ?? [];

  const latestYear = entries.length > 0 ? entries[0].fiscalYear : null;
  const latestEntries = entries.filter((e) => e.fiscalYear === latestYear);
  const latestAllocations = allocations.filter((a) => a.fiscalYear === latestYear);
  const totalAllocated = latestEntries.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = latestEntries.reduce((s, e) => s + e.spent, 0);
  const totalLapsed = latestAllocations.reduce((s, a) => s + a.lapsed, 0);

  // When did we last fetch these rows? Shown as "As of …" beside the totals.
  const asOf = latestFetchedAt([
    ...(entries as Array<{ fetchedAt?: string | null }>),
    ...(allocations as Array<{ fetchedAt?: string | null }>),
  ]);
  const revenueAsOf = latestFetchedAt(collections as Array<{ fetchedAt?: string | null }>);

  const budgetChart = latestEntries.map((e) => ({
    // Full name for the tooltip; a shorter one for the axis.
    sectorFull: e.sector,
    sector: e.sector.length > 22 ? e.sector.slice(0, 21) + "…" : e.sector,
    allocated: Math.round(e.allocated / CRORE),
    spent: Math.round(e.spent / CRORE),
    utilPct: e.allocated > 0 ? Math.round((e.spent / e.allocated) * 100) : 0,
  }));

  // "How each ₹100 is shared": the five biggest sectors, the rest as "Other".
  const bySize = [...latestEntries].sort((a, b) => b.allocated - a.allocated);
  const shareSlices: DonutSlice[] = bySize.slice(0, 5).map((e) => ({
    key: e.sector,
    label: e.sector,
    value: e.allocated,
    display: m.short(e.allocated, 0),
  }));
  const restAllocated = bySize.slice(5).reduce((s, e) => s + e.allocated, 0);
  if (restAllocated > 0) {
    shareSlices.push({ key: "__other", label: t("share.other", { n: bySize.length - 5 }), value: restAllocated, display: m.short(restAllocated, 0), other: true });
  }
  const topShare = bySize[0] && totalAllocated > 0 ? Math.round((bySize[0].allocated / totalAllocated) * 100) : 0;

  // Month names come from Intl in the reader's language ("Sep", "ಸೆಪ್ಟೆಂ").
  const monthName = (month: number) => f.date(new Date(Date.UTC(2024, month - 1, 15)), { month: "short" });
  const revChart = collections
    .slice(0, 12)
    .map((c) => ({
      label: monthName(c.month),
      amount: Math.round(c.amount / LAKH),
      target: c.target ? Math.round(c.target / LAKH) : 0,
    }))
    .reverse();

  const lapsedRows = allocations.filter((a) => a.lapsed > 0).sort((a, b) => b.lapsed - a.lapsed);

  // Sources: the same list the old DataSourceBanner showed, now as a footer.
  const src = getModuleSources("budget", state);
  const stateName = place.state(state, "");
  const stateFinSource = stateName ? t("summarySourcesState", { state: stateName }) : t("summarySources");
  // Local-script title: the module name in the state's language (Kannada only
  // for now). PageHeader hides it when it is already the title.
  const title = mt.label("finance");
  const titleLocal = state === "karnataka" ? knDict.moduleNames.finance : undefined;
  const fyLabel = latestYear ? t("fy", { year: latestYear }) : undefined;
  const pctSpent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const cr2 = (rupees: number) => m.num(rupees / CRORE, 2);

  const onCsv = () =>
    downloadCsv(
      `${district}-budget-allocations.csv`,
      allocations.map((a) => ({
        fiscal_year: a.fiscalYear,
        department: a.department,
        allocated_cr: (a.allocated / CRORE).toFixed(2),
        spent_cr: (a.spent / CRORE).toFixed(2),
        lapsed_cr: (a.lapsed / CRORE).toFixed(2),
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={PiggyBank}
        accent={getModuleAccent("finance")}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "PFMS", href: SOURCE_URLS["PFMS (Public Financial Management System)"] }}
      />

      {/* AI-crawler readable summary — plain body text. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        {t("summary", { sources: stateFinSource })}
      </p>

      {aiInsight && (
        <div style={{ marginBottom: 16 }}>
          <AIInsightBanner
            headline={aiInsight.headline}
            summary={aiInsight.summary}
            sentiment={aiInsight.sentiment}
            confidence={aiInsight.confidence}
            sourceUrls={aiInsight.sourceUrls}
            createdAt={aiInsight.createdAt}
          />
        </div>
      )}
      <AIInsightCard module="budget" district={district} />

      {bLoading && <LoadingShell rows={4} />}

      {!bLoading && entries.length === 0 && allocations.length === 0 && (
        <EmptyState emoji="💰" title={t("empty.title")} body={t("empty.body")} />
      )}

      {!bLoading && (entries.length > 0 || allocations.length > 0) && (
        <>
          <div style={{ marginBottom: 8 }}>
            <StatStrip cols={4}>
              <StatTile emoji="💰" label={t("tiles.total")} value={m.num(Math.round(totalAllocated / CRORE))} unit={t("tiles.unitCr")} sub={fyLabel} asOf={asOf} />
              <StatTile
                emoji="🧾"
                label={t("tiles.spent")}
                value={totalSpent === 0 && totalAllocated > 0 ? t("tiles.dataPending") : m.num(Math.round(totalSpent / CRORE))}
                unit={totalSpent === 0 && totalAllocated > 0 ? undefined : t("tiles.unitCr")}
                sub={fyLabel}
                asOf={asOf}
              />
              <StatTile
                emoji="📈"
                label={t("tiles.utilisation")}
                value={totalAllocated > 0 ? (totalSpent === 0 ? t("tiles.pending") : m.num(pctSpent)) : "—"}
                unit={totalAllocated > 0 && totalSpent > 0 ? "%" : undefined}
                sub={fyLabel}
                asOf={asOf}
              />
              <StatTile
                emoji="⏳"
                label={t("tiles.lapsed")}
                value={totalSpent === 0 && totalLapsed === 0 ? "—" : m.num(totalLapsed / CRORE, 1)}
                unit={totalSpent === 0 && totalLapsed === 0 ? undefined : t("tiles.unitCr")}
                sub={t("tiles.lapsedSub")}
                asOf={asOf}
              />
            </StatStrip>
          </div>

          {totalSpent === 0 && totalAllocated > 0 && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "8px 0 0" }}>
              {t("allocationOnly")}
            </p>
          )}

          {/* The picture: 10 coins, one per ₹10 of every ₹100, lit for what
              was spent; plus a dial. Same numbers as the tiles above. */}
          {totalAllocated > 0 && totalSpent > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🪙">
                  {t.rich("explainer", { year: latestYear ?? "", pct: pctSpent, b })}
                </Explainer>
                <Pictogram
                  filled={(totalSpent / totalAllocated) * 10}
                  emoji="💰"
                  label={t("pictogram", { n: Math.round((totalSpent / totalAllocated) * 10) })}
                />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge value={(totalSpent / totalAllocated) * 100} label={t("gauge.label")} caption={t("gauge.caption", { year: latestYear ?? "" })} />
              </Card>
            </div>
          )}

          {/* How each ₹100 is shared between sectors — a different question
              from "how much was spent". Needs at least two sectors. */}
          {shareSlices.length >= 2 && totalAllocated > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("share.title", { year: latestYear ?? "" })}
                emoji="🍰"
                units={t("share.units")}
                simple={t.rich("share.simple", { sector: bySize[0].sector, n: topShare, b })}
                source={{ label: "PFMS", href: SOURCE_URLS["PFMS (Public Financial Management System)"] }}
                asOf={asOf}
                table={shareSlices.map((s) => ({ label: s.label, value: `${s.display} (${m.pct(s.value / totalAllocated)})` }))}
              >
                <ShareDonut
                  slices={shareSlices}
                  centerValue={m.short(totalAllocated, 0)}
                  centerLabel={t("share.center")}
                  ariaLabel={t("share.aria", {
                    year: latestYear ?? "",
                    list: shareSlices.map((s) => `${s.label} ${m.pct(s.value / totalAllocated)}`).join(", "),
                  })}
                  formatPct={(p) => m.pct(p)}
                />
              </ChartCard>
            </div>
          )}

          {/* Sector-wise chart */}
          {budgetChart.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("sectors.title", { year: latestYear ?? "" })}
                emoji="🏗️"
                units={t("sectors.units")}
                simple={(() => {
                  const top = [...budgetChart].sort((a, b) => b.allocated - a.allocated)[0];
                  return top
                    ? t.rich("sectors.simple", { sector: top.sectorFull, given: m.crore(top.allocated), spent: m.crore(top.spent), b })
                    : null;
                })()}
                legend={[
                  { label: t("sectors.legendGiven"), swatch: "#D8D5CB" },
                  { label: t("sectors.legendSpent"), swatch: "var(--hue)" },
                ]}
                source={{ label: "PFMS", href: SOURCE_URLS["PFMS (Public Financial Management System)"] }}
                asOf={asOf}
                table={budgetChart.map((r) => ({ label: r.sectorFull, value: t("sectors.row", { spent: m.crore(r.spent), given: m.crore(r.allocated) }) }))}
              >
                {/* Height follows the number of sectors (44 px each) so every
                    sector gets a readable label instead of every other one. */}
                <ResponsiveContainer width="100%" height={Math.max(200, budgetChart.length * 44 + 40)}>
                  <BarChart data={budgetChart} margin={{ top: 5, right: 16, bottom: 8, left: 0 }} layout="vertical" barGap={3}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => m.crore(Number(v))} />
                    <YAxis type="category" dataKey="sector" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v, name) => [m.crore(Number(v)), name]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.sectorFull ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="allocated" fill="url(#ftpMutedFill)" radius={[0, 6, 6, 0]} name={t("sectors.given")} />
                    <Bar dataKey="spent" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("sectors.spent")} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          {/* Lapsed funds — money that was allocated but NOT spent */}
          {lapsedRows.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Section emoji="⏳" title={t("lapsed.title")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lapsedRows.map((a) => (
                    <Card key={a.id} padding={14}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 15, borderRadius: 10 }}>
                            🏢
                          </span>
                          <div className="ftp-title">{a.department}</div>
                        </div>
                        <div className="ftp-num" style={{ fontSize: 15, color: "var(--ftp-danger)" }}>
                          {t("lapsed.amount", { amount: m.crore(a.lapsed / CRORE, 2) })}
                        </div>
                      </div>
                      <ProgressBar
                        value={a.spent}
                        max={a.allocated}
                        label={t("lapsed.bar", { year: a.fiscalYear, amount: m.crore(a.allocated / CRORE, 1) })}
                        tone="danger"
                      />
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Allocations table */}
          <div style={{ marginTop: 24 }}>
            <Section emoji="📒" title={t("table.title")}>
              <DataTable
                caption={t("table.caption")}
                emptyText={t("table.empty")}
                columns={[
                  { key: "fy", label: t("table.fy") },
                  { key: "dept", label: t("table.department") },
                  { key: "alloc", label: t("table.allocated"), numeric: true },
                  { key: "spent", label: t("table.spent"), numeric: true },
                  { key: "lapsed", label: t("table.lapsed"), numeric: true },
                ]}
                rows={allocations.map((a) => ({
                  fy: a.fiscalYear,
                  dept: a.department,
                  alloc: cr2(a.allocated),
                  spent: cr2(a.spent),
                  // Lapsed money is the one number we colour: danger text, no fill.
                  lapsed: (
                    <span style={{ color: a.lapsed > 0 ? "var(--ftp-danger)" : "var(--ftp-text)" }}>
                      {cr2(a.lapsed)}
                    </span>
                  ),
                }))}
              />
            </Section>
          </div>
        </>
      )}

      {/* Revenue collections */}
      {!rLoading && revChart.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("revenue.title")}
            emoji="🧾"
            units={t("revenue.units")}
            legend={[
              { label: t("revenue.collected"), swatch: "var(--hue)" },
              { label: t("revenue.target"), swatch: "#D8D5CB" },
            ]}
            asOf={revenueAsOf}
            table={revChart.map((r) => ({
              label: r.label,
              value: r.target
                ? t("revenue.rowWithTarget", { amount: m.lakh(r.amount), target: m.lakh(r.target) })
                : m.lakh(r.amount),
            }))}
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <ChartGradients />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                <XAxis dataKey="label" tick={CHART_AXIS} />
                <YAxis tick={CHART_AXIS} tickFormatter={(v) => m.num(Number(v))} />
                <Tooltip formatter={(v, name) => [m.lakh(Number(v)), name]} contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} />
                <Bar dataKey="amount" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("revenue.collected")} />
                <Bar dataKey="target" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} name={t("revenue.target")} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <SourcesFooter
        sources={src.sources.map((name) => ({ name: st.name(name), url: SOURCE_URLS[name], frequency: st.freq(src.frequency) }))}
      />
      <NotOfficialNote />

      <ModuleNews district={district} state={state} locale={locale} module="budget" />

      <MoneyToolbar
        shareTitle={title}
        onCsv={onCsv}
        csvDisabled={allocations.length === 0}
        compareHref={`/${locale}/compare?module=finance&a=${district}`}
      />
    </div>
  );
}

export default function FinancePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("finance")}>
      <FinancePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
