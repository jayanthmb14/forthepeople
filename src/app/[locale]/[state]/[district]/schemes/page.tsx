/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Schemes — module page (Design v3 "Civic Ledger", CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//  PageHeader → StatStrip → category Chips → scheme cards → SourcesFooter
//  → ModuleNews → Toolbar. Data still comes from useSchemes(); only the
//  look changed. Categories are neutral Pills (no per-category colours —
//  colour is reserved for meaning, not decoration).
"use client";

import { use, useState } from "react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { ArrowLeftRight, Download, ExternalLink, ScrollText, Share2 } from "lucide-react";
import { useSchemes } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  Pill,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
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
          title="No schemes data yet for this district."
          body="We add schemes as MyScheme.gov.in and the state scheme portals publish them."
        />
      )}

      {!isLoading && schemes.length > 0 && (
        <>
          <div style={{ marginBottom: 24 }}>
            <StatStrip cols={3}>
              <StatTile label="Schemes listed" value={schemes.length} asOf={asOf} />
              <StatTile label="Categories" value={categories.length - 1} asOf={asOf} />
              <StatTile label="With apply link" value={withApplyLink} sub={`of ${schemes.length}`} asOf={asOf} />
            </StatStrip>
          </div>

          <Section title="Schemes">
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
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)", marginBottom: 6 }}>
                          {s.nameLocal}
                        </div>
                      )}
                    </div>
                    <Pill>{s.category}</Pill>
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
                        <div className="ftp-label">Benefit Amount</div>
                        <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>₹{s.amount.toLocaleString("en-IN")}</div>
                      </div>
                      {s.beneficiaryCount && (
                        <div>
                          <div className="ftp-label">Beneficiaries</div>
                          <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>{s.beneficiaryCount.toLocaleString("en-IN")}</div>
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
                        padding: "0 14px",
                        background: "var(--ftp-brand)",
                        color: "var(--ftp-surface)",
                        borderRadius: "var(--ftp-radius-tile)",
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      Apply Online <ExternalLink size={14} aria-hidden />
                    </a>
                  ) : (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 12 }}>
                      Link unavailable
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
