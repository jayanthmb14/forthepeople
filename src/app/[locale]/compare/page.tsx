/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Comparison Page
// URL: /en/compare?a=mandya&b=mysuru
//
// Design v3 (2026-09-27): PageHeader, Card and FreshnessPill from the
// kit; token colours only; every number in JetBrains Mono. The "better /
// lower" comparison colours are shown as TEXT colour plus a 6 px dot in
// the legend (never a filled box). Data hooks and URL handling unchanged.
// ═══════════════════════════════════════════════════════════
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import { ArrowRight, GitCompare, Lock, ChevronDown } from "lucide-react";
import { Card, FreshnessPill, LoadingShell, PageHeader } from "@/components/district/ui";
import { INDIA_STATES } from "@/lib/constants/districts";
import { useOverview, useBudget, useWeather } from "@/hooks/useRealtimeData";

// ── Active districts list ──────────────────────────────────
const ACTIVE_DISTRICTS = INDIA_STATES.flatMap((s) =>
  s.active
    ? s.districts
        .filter((d) => d.active)
        .map((d) => ({ state: s, district: d }))
    : []
);

// ── Metric row component ───────────────────────────────────
// Three columns: value A (right-aligned) · label · value B.
// When both values are numbers, the better one is shown in the "live"
// text colour and the other in the "danger" text colour.
function MetricRow({
  label,
  valA,
  valB,
  higherIsBetter = true,
}: {
  label: string;
  valA: string | number | null | undefined;
  valB: string | number | null | undefined;
  higherIsBetter?: boolean;
  /** Kept for older call sites — every value is mono in v3 anyway. */
  mono?: boolean;
}) {
  const na = valA === null || valA === undefined || valA === "";
  const nb = valB === null || valB === undefined || valB === "";
  const numA = !na && typeof valA !== "string" ? valA as number : parseFloat(String(valA));
  const numB = !nb && typeof valB !== "string" ? valB as number : parseFloat(String(valB));
  const bothNum = !na && !nb && !isNaN(numA) && !isNaN(numB);

  let colorA = "var(--ftp-text)";
  let colorB = "var(--ftp-text)";
  if (bothNum && numA !== numB) {
    const aWins = higherIsBetter ? numA > numB : numA < numB;
    colorA = aWins ? "var(--ftp-live-text)" : "var(--ftp-danger)";
    colorB = aWins ? "var(--ftp-danger)" : "var(--ftp-live-text)";
  }

  const notAvailable = <span style={{ color: "var(--ftp-text-2)", fontSize: 13, fontFamily: "var(--ftp-font-sans)", fontWeight: 400 }}>N/A</span>;

  return (
    <div className="ftp-compare-row">
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: colorA, textAlign: "right" }}>
        {na ? notAvailable : String(valA)}
      </div>
      <div className="ftp-compare-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: colorB }}>
        {nb ? notAvailable : String(valB)}
      </div>
    </div>
  );
}

/** Small uppercase group heading inside the comparison card. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ftp-label" style={{ padding: "16px 0 4px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {children}
    </h2>
  );
}

// ── District selector dropdown ─────────────────────────────
function DistrictSelector({
  value,
  onChange,
  label,
  alignRight = false,
}: {
  value: string;
  onChange: (slug: string) => void;
  label: string;
  /** Open the menu towards the left (for the right-hand selector). */
  alignRight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = ACTIVE_DISTRICTS.find((x) => x.district.slug === value);

  return (
    <div style={{ position: "relative", maxWidth: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${selected?.district.name ?? "Select"}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          maxWidth: "100%",
          padding: "0 14px",
          background: "var(--ftp-brand-tint)",
          border: "1px solid var(--ftp-brand)",
          borderRadius: "var(--ftp-radius-tile)",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: 15,
          color: "var(--ftp-brand-deep)",
          textAlign: "left",
        }}
      >
        <span>{selected?.district.name ?? "Select District"}</span>
        <ChevronDown size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="listbox"
            aria-label={label}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              ...(alignRight ? { right: 0 } : { left: 0 }),
              width: 260,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: 280,
              overflowY: "auto",
              background: "var(--ftp-surface)",
              border: "1px solid var(--ftp-border-strong)",
              borderRadius: "var(--ftp-radius-card)",
              zIndex: 50,
            }}
          >
            {ACTIVE_DISTRICTS.map(({ state, district }) => {
              const isSel = district.slug === value;
              return (
                <button
                  key={district.slug}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  onClick={() => { onChange(district.slug); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    width: "100%",
                    minHeight: 44,
                    padding: "0 14px",
                    border: "none",
                    background: isSel ? "var(--ftp-brand-tint)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: isSel ? 500 : 400,
                    color: "var(--ftp-text)",
                  }}
                >
                  <span>{district.name}</span>
                  <span style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{state.name}</span>
                </button>
              );
            })}
            {ACTIVE_DISTRICTS.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} aria-hidden="true" /> No active districts available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Comparison content ─────────────────────────────────────
function CompareContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultA = ACTIVE_DISTRICTS[0]?.district.slug ?? "mandya";
  const defaultB = ACTIVE_DISTRICTS[1]?.district.slug ?? "mysuru";

  const slugA = searchParams.get("a") ?? defaultA;
  const slugB = searchParams.get("b") ?? defaultB;

  const stateA = ACTIVE_DISTRICTS.find((x) => x.district.slug === slugA)?.state.slug ?? "karnataka";
  const stateB = ACTIVE_DISTRICTS.find((x) => x.district.slug === slugB)?.state.slug ?? "karnataka";

  const { data: overviewA, isLoading: loA } = useOverview(slugA, stateA);
  const { data: overviewB, isLoading: loB } = useOverview(slugB, stateB);
  const { data: budgetA } = useBudget(slugA, stateA);
  const { data: budgetB } = useBudget(slugB, stateB);
  const { data: weatherA } = useWeather(slugA, stateA);
  const { data: weatherB } = useWeather(slugB, stateB);

  const dA = overviewA?.data;
  const dB = overviewB?.data;

  const budEntriesA = budgetA?.data?.entries ?? [];
  const budEntriesB = budgetB?.data?.entries ?? [];
  const latYrA = budEntriesA[0]?.fiscalYear;
  const latYrB = budEntriesB[0]?.fiscalYear;
  const totalBudA = budEntriesA.filter((e) => e.fiscalYear === latYrA).reduce((s, e) => s + e.allocated, 0);
  const totalSpentA = budEntriesA.filter((e) => e.fiscalYear === latYrA).reduce((s, e) => s + e.spent, 0);
  const totalBudB = budEntriesB.filter((e) => e.fiscalYear === latYrB).reduce((s, e) => s + e.allocated, 0);
  const totalSpentB = budEntriesB.filter((e) => e.fiscalYear === latYrB).reduce((s, e) => s + e.spent, 0);

  const weatherReadA = weatherA?.data?.[0];
  const weatherReadB = weatherB?.data?.[0];

  function setA(slug: string) {
    const url = new URLSearchParams({ a: slug, b: slugB });
    router.replace(`/${locale}/compare?${url.toString()}`);
  }
  function setB(slug: string) {
    const url = new URLSearchParams({ a: slugA, b: slug });
    router.replace(`/${locale}/compare?${url.toString()}`);
  }

  const isLoading = loA || loB;

  // Honest period label for the budget rows: one FY if both match, else both.
  const fyLabel = latYrA && latYrB && latYrA !== latYrB ? `FY ${latYrA} vs FY ${latYrB}` : latYrA || latYrB ? `FY ${latYrA ?? latYrB}` : null;

  return (
    <main id="main-content" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      {/* Page-scoped layout rules (tokens only). The row grid narrows its
          centre label on phones so two numbers still fit at 375 px. */}
      <style>{`
        .ftp-compare-pickers { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
        .ftp-compare-row {
          display: grid;
          grid-template-columns: 1fr minmax(96px, auto) 1fr;
          gap: 8px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--ftp-border);
        }
        .ftp-compare-label { font-size: 11px; line-height: 16px; color: var(--ftp-text-2); text-align: center; min-width: 120px; padding: 0 8px; }
        .ftp-compare-body { padding: 0 24px; }
        @media (max-width: 640px) {
          .ftp-compare-pickers { grid-template-columns: 1fr; gap: 8px; }
          .ftp-compare-pickers > div { align-items: flex-start !important; }
          .ftp-compare-label { min-width: 0; padding: 0 4px; }
          .ftp-compare-body { padding: 0 16px; }
        }
      `}</style>

      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <div style={{ maxWidth: 900 }}>
          <PageHeader
            icon={GitCompare}
            title="District Comparison"
            description="Compare key metrics side-by-side for any two active districts"
            backHref={`/${locale}`}
            backLabel="Back to home"
          />

          {/* Selectors */}
          <Card padding={20} style={{ marginBottom: 24 }}>
            <div className="ftp-compare-pickers">
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", minWidth: 0 }}>
                <span className="ftp-label">District A</span>
                <DistrictSelector value={slugA} onChange={setA} label="District A" />
              </div>
              <div style={{ fontSize: 13, color: "var(--ftp-text-2)", textAlign: "center" }}>vs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", minWidth: 0 }}>
                <span className="ftp-label">District B</span>
                <DistrictSelector value={slugB} onChange={setB} label="District B" alignRight />
              </div>
            </div>
          </Card>

          {isLoading && <LoadingShell rows={6} />}

          {!isLoading && dA && dB && (
            <Card padding={0} style={{ overflow: "hidden" }}>
              {/* Column headers */}
              <div className="ftp-compare-body" style={{ background: "var(--ftp-surface-2)", borderBottom: "1px solid var(--ftp-border)" }}>
                <div className="ftp-compare-row" style={{ borderBottom: "none", padding: "14px 0" }}>
                  <div style={{ textAlign: "right", minWidth: 0 }}>
                    <div className="ftp-title">{dA.name}</div>
                    {dA.nameLocal && <div style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dA.nameLocal}</div>}
                  </div>
                  <div className="ftp-compare-label" aria-hidden="true" />
                  <div style={{ minWidth: 0 }}>
                    <div className="ftp-title">{dB.name}</div>
                    {dB.nameLocal && <div style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dB.nameLocal}</div>}
                  </div>
                </div>
              </div>

              <div className="ftp-compare-body">
                {/* Demographics */}
                <GroupLabel>Demographics</GroupLabel>
                <MetricRow label="Population" valA={dA.population?.toLocaleString("en-IN")} valB={dB.population?.toLocaleString("en-IN")} />
                <MetricRow label="Area (sq km)" valA={dA.area?.toLocaleString("en-IN")} valB={dB.area?.toLocaleString("en-IN")} />
                <MetricRow label="Density (per sq km)" valA={dA.density} valB={dB.density} />
                <MetricRow label="Literacy Rate (%)" valA={dA.literacy !== null ? `${dA.literacy}%` : null} valB={dB.literacy !== null ? `${dB.literacy}%` : null} />
                <MetricRow label="Sex Ratio (F per 1000 M)" valA={dA.sexRatio} valB={dB.sexRatio} />
                <MetricRow label="Taluks" valA={dA.talukCount ?? dA.taluks?.length} valB={dB.talukCount ?? dB.taluks?.length} />
                <MetricRow label="Villages" valA={dA.villageCount} valB={dB.villageCount} />

                {/* Infrastructure */}
                <GroupLabel>Infrastructure</GroupLabel>
                <MetricRow label="Active Projects" valA={dA._count?.infraProjects} valB={dB._count?.infraProjects} />
                <MetricRow label="Government Schemes" valA={dA._count?.schemes} valB={dB._count?.schemes} />
                <MetricRow label="Schools" valA={dA._count?.schools} valB={dB._count?.schools} />
                <MetricRow label="Police Stations" valA={dA._count?.policeStations} valB={dB._count?.policeStations} />

                {/* Finance */}
                {(totalBudA > 0 || totalBudB > 0) && (
                  <>
                    <GroupLabel>
                      Finance
                      {fyLabel && <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· {fyLabel}</span>}
                    </GroupLabel>
                    <MetricRow label="Total Budget (₹ Cr)" valA={totalBudA > 0 ? (totalBudA / 1e7).toFixed(0) : null} valB={totalBudB > 0 ? (totalBudB / 1e7).toFixed(0) : null} />
                    <MetricRow label="Spent (₹ Cr)" valA={totalSpentA > 0 ? (totalSpentA / 1e7).toFixed(0) : null} valB={totalSpentB > 0 ? (totalSpentB / 1e7).toFixed(0) : null} />
                    <MetricRow
                      label="Budget Utilisation (%)"
                      valA={totalBudA > 0 ? `${Math.round((totalSpentA / totalBudA) * 100)}%` : null}
                      valB={totalBudB > 0 ? `${Math.round((totalSpentB / totalBudB) * 100)}%` : null}
                    />
                  </>
                )}

                {/* Weather — each side carries the date its reading was taken */}
                {(weatherReadA || weatherReadB) && (
                  <>
                    <GroupLabel>Latest weather reading</GroupLabel>
                    <div className="ftp-compare-row">
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <FreshnessPill asOf={weatherReadA?.recordedAt} />
                      </div>
                      <div className="ftp-compare-label">Recorded</div>
                      <div style={{ display: "flex" }}>
                        <FreshnessPill asOf={weatherReadB?.recordedAt} />
                      </div>
                    </div>
                    <MetricRow label="Temperature (°C)" valA={weatherReadA?.temperature} valB={weatherReadB?.temperature} higherIsBetter={false} />
                    <MetricRow label="Humidity (%)" valA={weatherReadA?.humidity} valB={weatherReadB?.humidity} higherIsBetter={false} />
                    <MetricRow label="Rainfall today (mm)" valA={weatherReadA?.rainfall} valB={weatherReadB?.rainfall} />
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="ftp-compare-body" style={{ paddingTop: 16, paddingBottom: 16, borderTop: "1px solid var(--ftp-border)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ftp-live)" }} aria-hidden="true" />
                  Better value
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ftp-danger)" }} aria-hidden="true" />
                  Lower value
                </span>
                <span style={{ fontSize: 11, color: "var(--ftp-text-2)", marginLeft: "auto" }}>
                  Data from ForThePeople.in · Updated automatically
                </span>
              </div>
            </Card>
          )}

          {/* Links to full dashboards */}
          {!isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 20 }}>
              {[
                { href: `/${locale}/${stateA}/${slugA}`, name: dA?.name ?? slugA },
                { href: `/${locale}/${stateB}/${slugB}`, name: dB?.name ?? slugB },
              ].map((l) => (
                <Card
                  key={l.href}
                  href={l.href}
                  padding={12}
                  style={{ textAlign: "center", minHeight: 44, fontSize: 13, fontWeight: 500, color: "var(--ftp-brand)" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    View {l.name} dashboard <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  return (
    <Suspense
      fallback={
        <div className="ftp-container" style={{ paddingTop: 40 }}>
          <LoadingShell rows={6} />
        </div>
      }
    >
      <CompareContent locale={locale} />
    </Suspense>
  );
}
