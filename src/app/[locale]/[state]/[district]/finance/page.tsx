/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Finance & Budget — module page (Design v3 "Civic Ledger", CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//  Order on the page (same for every module page):
//    PageHeader → one-paragraph summary → StatStrip → Sections (charts,
//    lapsed funds, allocations table) → SourcesFooter → ModuleNews → Toolbar
//
//  Data comes from the same hooks as before (useBudget, useRevenue,
//  useAIInsight). Only the presentation changed: colours are CSS tokens
//  (var(--ftp-…)), numbers are mono, and every total carries the fiscal
//  year plus an "As of" date taken from when we fetched the rows.
"use client";

import { use, useState } from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AlertTriangle, ArrowLeftRight, Download, PiggyBank, Share2 } from "lucide-react";
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
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import knDict from "@/dictionaries/kn.json";

/** 1 crore = 10 million rupees. Amounts in the database are in rupees. */
const CRORE = 10_000_000;
const LAKH = 100_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Official websites for the sources named by getModuleSources("budget"). */
const SOURCE_URLS: Record<string, string> = {
  "PFMS (Public Financial Management System)": "https://pfms.nic.in",
  "State Treasury / eGramSwaraj": "https://egramswaraj.gov.in",
};

/** Chart styling from tokens: brand bars, text-2 axis labels, surface-2 grid. */
const AXIS_TICK = { fontSize: 11, fill: "var(--ftp-text-2)" };
const TOOLTIP_STYLE = {
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--ftp-text)",
};

/** The newest timestamp in a list of rows (rows carry `fetchedAt` from the API). */
function latestFetchedAt(rows: Array<{ fetchedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.fetchedAt && (!best || r.fetchedAt > best)) best = r.fetchedAt;
  }
  return best;
}

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

function FinancePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: budgetData, isLoading: bLoading } = useBudget(district, state);
  const { data: revenueData, isLoading: rLoading } = useRevenue(district, state);
  const { data: aiInsight } = useAIInsight(district, "finance");
  const [shareNote, setShareNote] = useState<string | null>(null);

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
    sector: e.sector.length > 12 ? e.sector.slice(0, 12) + "…" : e.sector,
    allocated: Math.round(e.allocated / CRORE),
    spent: Math.round(e.spent / CRORE),
    utilPct: e.allocated > 0 ? Math.round((e.spent / e.allocated) * 100) : 0,
  }));

  const revChart = collections
    .slice(0, 12)
    .map((c) => ({
      label: `${MONTHS[c.month - 1]}`,
      amount: Math.round(c.amount / LAKH),
      target: c.target ? Math.round(c.target / LAKH) : 0,
    }))
    .reverse();

  const lapsedRows = allocations.filter((a) => a.lapsed > 0).sort((a, b) => b.lapsed - a.lapsed);

  // Sources: the same list the old DataSourceBanner showed, now as a footer.
  const src = getModuleSources("budget", state);
  const sc = getStateConfig(state);
  const stateFinSource = sc ? `${sc.name} Finance Department, PFMS, eGramSwaraj` : "State Finance Department, PFMS, eGramSwaraj";
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.budget : undefined;
  const fyLabel = latestYear ? `FY ${latestYear}` : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Finance & Budget", url });
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
        title="Finance & Budget"
        titleLocal={titleLocal}
        description="District budget allocation, utilisation, lapsed funds and revenue collections"
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "PFMS", href: SOURCE_URLS["PFMS (Public Financial Management System)"] }}
      />

      {/* AI-crawler readable summary — plain body text. */}
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>
        This page shows the annual budget allocation and expenditure data for this district&apos;s government departments, sourced from {stateFinSource}. Figures are in Indian Rupees in Crores (1 Crore = ₹10 million). Unspent budget that lapses at fiscal year end is highlighted as &ldquo;lapsed funds.&rdquo;
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
        <EmptyState
          title="No budget data yet for this district."
          body="We add allocations and spending as PFMS and the state treasury publish them."
        />
      )}

      {!bLoading && (entries.length > 0 || allocations.length > 0) && (
        <>
          <div style={{ marginBottom: 8 }}>
            <StatStrip cols={4}>
              <StatTile icon={PiggyBank} label="Total Budget" value={(totalAllocated / CRORE).toFixed(0)} unit="₹ Cr" sub={fyLabel} asOf={asOf} />
              <StatTile
                label="Spent"
                value={totalSpent === 0 && totalAllocated > 0 ? "Data pending" : (totalSpent / CRORE).toFixed(0)}
                unit={totalSpent === 0 && totalAllocated > 0 ? undefined : "₹ Cr"}
                sub={fyLabel}
                asOf={asOf}
              />
              <StatTile
                label="Utilisation"
                value={totalAllocated > 0 ? (totalSpent === 0 ? "Pending" : `${Math.round((totalSpent / totalAllocated) * 100)}`) : "—"}
                unit={totalAllocated > 0 && totalSpent > 0 ? "%" : undefined}
                sub={fyLabel}
                asOf={asOf}
              />
              <StatTile
                label="Lapsed Funds"
                value={totalSpent === 0 && totalLapsed === 0 ? "—" : (totalLapsed / CRORE).toFixed(1)}
                unit={totalSpent === 0 && totalLapsed === 0 ? undefined : "₹ Cr"}
                sub="Funds not utilised"
                trend="down"
                asOf={asOf}
              />
            </StatStrip>
          </div>

          {totalSpent === 0 && totalAllocated > 0 && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "8px 0 0" }}>
              Allocation data is available. Expenditure tracking from PFMS/state treasury will be updated as data becomes available.
            </p>
          )}

          {/* Sector-wise chart */}
          {budgetChart.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Section title={`${latestYear} — Sector Budget vs Spent (₹ Cr)`}>
                <Card>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={budgetChart} margin={{ top: 5, right: 10, bottom: 50, left: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                      <XAxis type="number" tick={AXIS_TICK} tickFormatter={(v) => `₹${v}Cr`} />
                      <YAxis type="category" dataKey="sector" tick={AXIS_TICK} width={90} />
                      <Tooltip formatter={(v) => [`₹${Number(v)}Cr`, ""]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--ftp-surface-2)" }} />
                      <Bar dataKey="allocated" fill="var(--ftp-border-strong)" radius={[0, 4, 4, 0]} name="Allocated" />
                      <Bar dataKey="spent" fill="var(--ftp-brand)" radius={[0, 4, 4, 0]} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Section>
            </div>
          )}

          {/* Lapsed funds — money that was allocated but NOT spent */}
          {lapsedRows.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Section
                title={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={18} aria-hidden style={{ color: "var(--ftp-danger)" }} />
                    Lapsed Funds — Money NOT Spent
                  </span>
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lapsedRows.map((a) => (
                    <Card key={a.id} padding={14}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        <div className="ftp-title">{a.department}</div>
                        <div className="ftp-num" style={{ fontSize: 15, color: "var(--ftp-danger)" }}>
                          ₹{(a.lapsed / CRORE).toFixed(2)}Cr lapsed
                        </div>
                      </div>
                      <ProgressBar value={a.spent} max={a.allocated} label={`${a.fiscalYear} · ₹${(a.allocated / CRORE).toFixed(1)}Cr allocated`} tone="danger" />
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Allocations table */}
          <div style={{ marginTop: 24 }}>
            <Section title="Department Allocations">
              <DataTable
                caption="Department budget allocations by fiscal year, in crore rupees"
                emptyText="No department allocations published for this district yet."
                columns={[
                  { key: "fy", label: "FY" },
                  { key: "dept", label: "Department" },
                  { key: "alloc", label: "Allocated (Cr)", numeric: true },
                  { key: "spent", label: "Spent (Cr)", numeric: true },
                  { key: "lapsed", label: "Lapsed (Cr)", numeric: true },
                ]}
                rows={allocations.map((a) => ({
                  fy: a.fiscalYear,
                  dept: a.department,
                  alloc: (a.allocated / CRORE).toFixed(2),
                  spent: (a.spent / CRORE).toFixed(2),
                  // Lapsed money is the one number we colour: danger text, no fill.
                  lapsed: (
                    <span style={{ color: a.lapsed > 0 ? "var(--ftp-danger)" : "var(--ftp-text)" }}>
                      {(a.lapsed / CRORE).toFixed(2)}
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
          <Section title="Revenue Collections (₹ Lakhs)">
            <Card>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis tick={AXIS_TICK} />
                  <Tooltip formatter={(v) => [`₹${Number(v)}L`, ""]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--ftp-surface-2)" }} />
                  <Bar dataKey="amount" fill="var(--ftp-brand)" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="target" fill="var(--ftp-border-strong)" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
              {revenueAsOf && (
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
                  As of {new Date(revenueAsOf).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                </p>
              )}
            </Card>
          </Section>
        </div>
      )}

      <SourcesFooter
        sources={src.sources.map((name) => ({ name, url: SOURCE_URLS[name], frequency: src.frequency }))}
      />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="budget" />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={allocations.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=finance&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function FinancePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Finance & Budget">
      <FinancePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
