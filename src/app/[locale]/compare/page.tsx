/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Comparison Page
// URL: /en/compare?a=mandya&b=mysuru
// ═══════════════════════════════════════════════════════════
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare, Lock, ChevronDown } from "lucide-react";
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
function MetricRow({
  label,
  valA,
  valB,
  higherIsBetter = true,
  mono = false,
}: {
  label: string;
  valA: string | number | null | undefined;
  valB: string | number | null | undefined;
  higherIsBetter?: boolean;
  mono?: boolean;
}) {
  const na = valA === null || valA === undefined || valA === "";
  const nb = valB === null || valB === undefined || valB === "";
  const numA = !na && typeof valA !== "string" ? valA as number : parseFloat(String(valA));
  const numB = !nb && typeof valB !== "string" ? valB as number : parseFloat(String(valB));
  const bothNum = !na && !nb && !isNaN(numA) && !isNaN(numB);

  let colorA = "#1A1A1A";
  let colorB = "#1A1A1A";
  if (bothNum && numA !== numB) {
    const aWins = higherIsBetter ? numA > numB : numA < numB;
    colorA = aWins ? "#16A34A" : "#DC2626";
    colorB = aWins ? "#DC2626" : "#16A34A";
  }

  const fontStyle = mono ? { fontFamily: "var(--font-mono)" } : {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F5F5F0" }}>
      <div style={{ ...fontStyle, fontSize: 15, fontWeight: 600, color: colorA, textAlign: "right" }}>
        {na ? <span style={{ color: "#9B9B9B", fontSize: 13 }}>N/A</span> : String(valA)}
      </div>
      <div style={{ fontSize: 11, color: "#9B9B9B", textAlign: "center", minWidth: 120, padding: "0 8px" }}>
        {label}
      </div>
      <div style={{ ...fontStyle, fontSize: 15, fontWeight: 600, color: colorB }}>
        {nb ? <span style={{ color: "#9B9B9B", fontSize: 13 }}>N/A</span> : String(valB)}
      </div>
    </div>
  );
}

// ── District selector dropdown ─────────────────────────────
function DistrictSelector({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (slug: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = ACTIVE_DISTRICTS.find((x) => x.district.slug === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${selected?.district.name ?? "Select"}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "#EFF6FF",
          border: "2px solid #2563EB",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 16,
          color: "#1D4ED8",
        }}
      >
        <span>{selected?.district.name ?? "Select District"}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 240,
              maxHeight: 280,
              overflowY: "auto",
              background: "#FFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
              zIndex: 50,
            }}
          >
            {ACTIVE_DISTRICTS.map(({ state, district }) => (
              <button
                key={district.slug}
                onClick={() => { onChange(district.slug); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "9px 14px",
                  border: "none",
                  background: district.slug === value ? "#EFF6FF" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: district.slug === value ? 600 : 400,
                  color: "#1A1A1A",
                }}
              >
                <span>{district.name}</span>
                <span style={{ fontSize: 12, color: "#9B9B9B" }}>{state.name}</span>
              </button>
            ))}
            {ACTIVE_DISTRICTS.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: "#9B9B9B", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} /> No active districts available
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

  return (
    <main id="main-content" style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Back */}
      <Link href={`/${locale}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={13} aria-hidden="true" /> Back to home
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: "#EFF6FF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GitCompare size={22} style={{ color: "#2563EB" }} aria-hidden="true" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.4px" }}>District Comparison</h1>
          <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 2 }}>Compare key metrics side-by-side for any two active districts</p>
        </div>
      </div>

      {/* Selectors */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 16,
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>District A</span>
          <DistrictSelector value={slugA} onChange={setA} label="District A" />
        </div>
        <div style={{ fontSize: 22, color: "#9B9B9B", textAlign: "center" }}>vs</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>District B</span>
          <DistrictSelector value={slugB} onChange={setB} label="District B" />
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: 40, textAlign: "center", color: "#9B9B9B", fontSize: 14 }}>
          Loading comparison data…
        </div>
      )}

      {!isLoading && dA && dB && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 16, overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", background: "#F8FAFF", borderBottom: "2px solid #E8E8E4", padding: "14px 24px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1D4ED8" }}>{dA.name}</div>
              {dA.nameLocal && <div style={{ fontSize: 13, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{dA.nameLocal}</div>}
            </div>
            <div style={{ minWidth: 120 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1D4ED8" }}>{dB.name}</div>
              {dB.nameLocal && <div style={{ fontSize: 13, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{dB.nameLocal}</div>}
            </div>
          </div>

          <div style={{ padding: "0 24px" }}>
            {/* Demographics */}
            <div style={{ padding: "16px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Demographics</div>
            <MetricRow label="Population" valA={dA.population?.toLocaleString("en-IN")} valB={dB.population?.toLocaleString("en-IN")} />
            <MetricRow label="Area (sq km)" valA={dA.area?.toLocaleString("en-IN")} valB={dB.area?.toLocaleString("en-IN")} mono />
            <MetricRow label="Density (per sq km)" valA={dA.density} valB={dB.density} mono />
            <MetricRow label="Literacy Rate (%)" valA={dA.literacy !== null ? `${dA.literacy}%` : null} valB={dB.literacy !== null ? `${dB.literacy}%` : null} />
            <MetricRow label="Sex Ratio (F per 1000 M)" valA={dA.sexRatio} valB={dB.sexRatio} />
            <MetricRow label="Taluks" valA={dA.talukCount ?? dA.taluks?.length} valB={dB.talukCount ?? dB.taluks?.length} />
            <MetricRow label="Villages" valA={dA.villageCount} valB={dB.villageCount} />

            {/* Infrastructure */}
            <div style={{ padding: "16px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Infrastructure</div>
            <MetricRow label="Active Projects" valA={dA._count?.infraProjects} valB={dB._count?.infraProjects} />
            <MetricRow label="Government Schemes" valA={dA._count?.schemes} valB={dB._count?.schemes} />
            <MetricRow label="Schools" valA={dA._count?.schools} valB={dB._count?.schools} />
            <MetricRow label="Police Stations" valA={dA._count?.policeStations} valB={dB._count?.policeStations} />

            {/* Finance */}
            {(totalBudA > 0 || totalBudB > 0) && (
              <>
                <div style={{ padding: "16px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Finance</div>
                <MetricRow label="Total Budget (₹ Cr)" valA={totalBudA > 0 ? (totalBudA / 1e7).toFixed(0) : null} valB={totalBudB > 0 ? (totalBudB / 1e7).toFixed(0) : null} mono />
                <MetricRow label="Spent (₹ Cr)" valA={totalSpentA > 0 ? (totalSpentA / 1e7).toFixed(0) : null} valB={totalSpentB > 0 ? (totalSpentB / 1e7).toFixed(0) : null} mono />
                <MetricRow
                  label="Budget Utilisation (%)"
                  valA={totalBudA > 0 ? `${Math.round((totalSpentA / totalBudA) * 100)}%` : null}
                  valB={totalBudB > 0 ? `${Math.round((totalSpentB / totalBudB) * 100)}%` : null}
                />
              </>
            )}

            {/* Weather */}
            {(weatherReadA || weatherReadB) && (
              <>
                <div style={{ padding: "16px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Current Weather</div>
                <MetricRow label="Temperature (°C)" valA={weatherReadA?.temperature} valB={weatherReadB?.temperature} higherIsBetter={false} mono />
                <MetricRow label="Humidity (%)" valA={weatherReadA?.humidity} valB={weatherReadB?.humidity} higherIsBetter={false} mono />
                <MetricRow label="Rainfall today (mm)" valA={weatherReadA?.rainfall} valB={weatherReadB?.rainfall} mono />
              </>
            )}
          </div>

          {/* Legend */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #E8E8E4", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B6B6B" }}>
              <div style={{ width: 12, height: 12, background: "#16A34A", borderRadius: 3 }} aria-hidden="true" />
              Better value
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B6B6B" }}>
              <div style={{ width: 12, height: 12, background: "#DC2626", borderRadius: 3 }} aria-hidden="true" />
              Lower value
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginLeft: "auto" }}>
              Data from ForThePeople.in · Updated automatically
            </div>
          </div>
        </div>
      )}

      {/* Links to full dashboards */}
      {!isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
          <Link href={`/${locale}/${stateA}/${slugA}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#1D4ED8", textDecoration: "none" }}>
            View {dA?.name ?? slugA} Dashboard →
          </Link>
          <Link href={`/${locale}/${stateB}/${slugB}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#1D4ED8", textDecoration: "none" }}>
            View {dB?.name ?? slugB} Dashboard →
          </Link>
        </div>
      )}
    </main>
  );
}

export default function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#9B9B9B" }}>Loading comparison…</div>}>
      <CompareContent locale={locale} />
    </Suspense>
  );
}
