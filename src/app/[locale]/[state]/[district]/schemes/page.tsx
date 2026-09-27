/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Schemes — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  PageHeader → emoji StatStrip → the picture (explainer + a pictogram of
//  schemes with an online apply link) → schemes-by-category ChartCard →
//  category Chips → scheme cards → SourcesFooter → ModuleNews → Toolbar.
//  Data still comes from useSchemes(); only the look changed. Every
//  number in the picture and chart is counted from the same scheme rows
//  as the tiles. Category tags and the apply button use the module hue.
"use client";

import { use, useState } from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowLeftRight, Download, ExternalLink, ScrollText, Share2 } from "lucide-react";
import { useSchemes } from "@/hooks/useRealtimeData";
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
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleNews from "@/components/district/ModuleNews";
import knDict from "@/dictionaries/kn.json";

/** Official websites for the sources named by getModuleSources("schemes"). */
const SOURCE_URLS: Record<string, string> = {
  "MyScheme.gov.in": "https://www.myscheme.gov.in",
};

/** The newest `updatedAt` among the rows (the API sends it with every scheme). */
function latestUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
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

function SchemesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useSchemes(district, state);
  const [filter, setFilter] = useState("all");
  const [shareNote, setShareNote] = useState<string | null>(null);

  const schemes = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(schemes.map((s) => s.category)))];
  const filtered = filter === "all" ? schemes : schemes.filter((s) => s.category === filter);

  const asOf = latestUpdatedAt(schemes as Array<{ updatedAt?: string | null }>);
  const withApplyLink = schemes.filter((s) => !!s.applyUrl).length;

  // The picture: of every 10 schemes listed, how many have an online apply link.
  const applyOf10 = schemes.length > 0 ? (withApplyLink / schemes.length) * 10 : 0;
  // Chart rows: schemes per category, largest first.
  const categoryChart = categories
    .filter((c) => c !== "all")
    .map((c) => ({
      name: c,
      label: c.length > 22 ? c.slice(0, 21) + "…" : c,
      count: schemes.filter((s) => s.category === c).length,
    }))
    .sort((a, b) => b.count - a.count);
  const src = getModuleSources("schemes", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.schemes : undefined;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Government Schemes", url });
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
      `${district}-schemes.csv`,
      schemes.map((s) => ({
        name: s.name,
        category: s.category,
        level: s.level ?? "",
        eligibility: s.eligibility ?? "",
        benefit_amount_inr: s.amount ?? "",
        beneficiaries: s.beneficiaryCount ?? "",
        apply_url: s.applyUrl ?? "",
      }))
    );

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={ScrollText}
        accent={getModuleAccent("schemes")}
        title="Government Schemes"
        titleLocal={titleLocal}
        description="Active central and state schemes with eligibility and application links"
        backHref={base}
        freshness={asOf ? { asOf } : undefined}
        source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
      />

      <AIInsightCard module="schemes" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && schemes.length === 0 && (
        <EmptyState
          emoji="📋"
          title="No schemes data yet for this district."
          body="We add schemes as MyScheme.gov.in and the state scheme portals publish them."
        />
      )}

      {!isLoading && schemes.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <StatStrip cols={3}>
              <StatTile emoji="📋" label="Schemes listed" value={schemes.length} asOf={asOf} />
              <StatTile emoji="🗂️" label="Categories" value={categories.length - 1} asOf={asOf} />
              <StatTile emoji="🔗" label="With apply link" value={withApplyLink} sub={`of ${schemes.length}`} asOf={asOf} />
            </StatStrip>
          </div>

          {/* The picture: out of every 10 schemes, how many you can apply
              for online from here. Needs at least two schemes. */}
          {schemes.length >= 2 && (
            <Card tinted padding={18}>
              <Explainer>
                This page lists <strong className="ftp-num">{schemes.length}</strong> government schemes in{" "}
                <strong className="ftp-num">{categories.length - 1}</strong>{" "}
                {categories.length - 1 === 1 ? "category" : "categories"}.{" "}
                <strong className="ftp-num">{withApplyLink}</strong> of them have a link where you can apply online.
              </Explainer>
              <Pictogram
                filled={applyOf10}
                emoji="📝"
                label={
                  withApplyLink === 0
                    ? "None of the schemes listed here has an online apply link yet."
                    : `About ${Math.round(applyOf10)} of every 10 schemes listed here have an online apply link.`
                }
              />
            </Card>
          )}

          {/* Schemes by category — only when there is more than one category. */}
          {categoryChart.length >= 2 && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title="Schemes by category"
                emoji="📊"
                units="Number of schemes listed in each category"
                simple={
                  <>
                    The biggest category is <strong>{categoryChart[0].name}</strong>:{" "}
                    <span className="ftp-num">{categoryChart[0].count}</span> of{" "}
                    <span className="ftp-num">{schemes.length}</span> schemes.
                  </>
                }
                legend={[{ label: "Schemes", swatch: "var(--hue)" }]}
                source={{ label: "MyScheme", href: SOURCE_URLS["MyScheme.gov.in"] }}
                asOf={asOf}
                table={categoryChart.map((r) => ({ label: r.name, value: r.count.toLocaleString("en-IN") }))}
              >
                <ResponsiveContainer width="100%" height={Math.max(160, categoryChart.length * 36 + 40)}>
                  <BarChart data={categoryChart} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
                    <ChartGradients />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                    <XAxis type="number" tick={CHART_AXIS} allowDecimals={false} />
                    <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={150} interval={0} />
                    <Tooltip
                      formatter={(v) => [Number(v).toLocaleString("en-IN"), "Schemes"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                      contentStyle={chartTooltipStyle}
                      cursor={{ fill: "var(--hue-tint)" }}
                    />
                    <Bar dataKey="count" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name="Schemes" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}

          <Section title="Schemes" emoji="📋">
            <div style={{ marginBottom: 16 }}>
              <Chips
                label="Filter schemes by category"
                value={filter}
                onChange={setFilter}
                items={categories.map((c) => ({
                  value: c,
                  label: c === "all" ? "All" : c,
                  count: c === "all" ? schemes.length : schemes.filter((s) => s.category === c).length,
                }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 12 }}>
              {filtered.map((s) => (
                <Card key={s.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="ftp-title" style={{ marginBottom: 4 }}>{s.name}</h3>
                      {s.nameLocal && (
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)", marginBottom: 6 }}>
                          {s.nameLocal}
                        </div>
                      )}
                    </div>
                    {/* Category tag in the module hue. */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 24,
                        padding: "0 8px",
                        flexShrink: 0,
                        borderRadius: "var(--ftp-radius-pill)",
                        background: "var(--hue-tint)",
                        color: "var(--hue-deep)",
                        fontSize: 11,
                        lineHeight: "16px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.category}
                    </span>
                  </div>

                  {s.eligibility && (
                    <div style={{ marginTop: 8 }}>
                      <div className="ftp-label" style={{ marginBottom: 2 }}>Eligibility</div>
                      <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{s.eligibility}</div>
                    </div>
                  )}
                  {s.amount && (
                    <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div className="ftp-label">Benefit amount</div>
                        <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>₹{s.amount.toLocaleString("en-IN")}</div>
                      </div>
                      {s.beneficiaryCount && (
                        <div>
                          <div className="ftp-label">Beneficiaries</div>
                          <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>{s.beneficiaryCount.toLocaleString("en-IN")}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {s.level && (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
                      Level: {s.level}
                    </div>
                  )}
                  {s.applyUrl ? (
                    // Primary action. `ftp-chip` gives it a 32 px height on
                    // desktop and a 44 px tap target on phones.
                    <a
                      href={s.applyUrl.startsWith("http") ? s.applyUrl : `https://${s.applyUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ftp-chip"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 12,
                        padding: "0 16px",
                        background: "linear-gradient(135deg, var(--hue) 0%, var(--hue-deep) 100%)",
                        color: "#fff",
                        borderRadius: "var(--ftp-radius-pill)",
                        boxShadow: "0 8px 16px -10px color-mix(in srgb, var(--hue) 80%, transparent)",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Apply online <ExternalLink size={14} aria-hidden />
                    </a>
                  ) : (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
                      No apply link listed yet
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Section>
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name, url: SOURCE_URLS[name], frequency: src.frequency }))} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 8 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>

      <ModuleNews district={district} state={state} locale={locale} module="schemes" />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={schemes.length === 0}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=schemes&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}

export default function SchemesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Govt. Schemes">
      <SchemesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
