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
// Design v4 "Rang": SiteHeader band in indigo, a tinted picker card, a
// picture of the two populations (bars + one plain sentence, only when
// both districts report a population), group headings with an emoji, and
// hue-coloured links. The "better / lower" comparison colours stay the
// semantic live / danger TEXT colours plus a 6 px dot in the legend
// (never a filled box). Data hooks and URL handling unchanged.
//
// ?module=<slug> (2026-09-27): every module page's Toolbar links here as
// /<locale>/compare?module=<slug>&a=<district>. When `module` names a
// district module:
//   • if this page has a matching group (see MODULE_TO_GROUP) we scroll
//     to it once the numbers load and tag it "From <module>";
//   • if not, a one-line note says so, and the two "View …" links at the
//     bottom open that module's page for each district.
// Changing a district keeps the module parameter. When only `a` is given,
// B defaults to the first other active district (never A against itself).
// ═══════════════════════════════════════════════════════════
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, use, useEffect, useRef, useState } from "react";
import { GitCompare, Lock, ChevronDown } from "lucide-react";
import { Card, FreshnessPill, LoadingShell, Pill } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { INDIA_STATES } from "@/lib/constants/districts";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { useOverview, useBudget, useWeather } from "@/hooks/useRealtimeData";

// ── Module → comparison group ──────────────────────────────
// The four groups this page compares. Each has an element id so a
// ?module= link can scroll to it.
type CompareGroup = "demographics" | "infrastructure" | "finance" | "weather";
const GROUP_TITLES: Record<CompareGroup, string> = {
  demographics: "Demographics",
  infrastructure: "Infrastructure",
  finance: "Finance",
  weather: "Latest weather reading",
};
const GROUP_EMOJI: Record<CompareGroup, string> = {
  demographics: "👥",
  infrastructure: "🏗️",
  finance: "💰",
  weather: "🌦️",
};
/** Which group answers a module's question. Modules not listed have no group here yet. */
const MODULE_TO_GROUP: Record<string, CompareGroup> = {
  overview: "demographics",
  population: "demographics",
  "gram-panchayat": "demographics",
  map: "demographics",
  infrastructure: "infrastructure",
  schemes: "infrastructure",
  schools: "infrastructure",
  police: "infrastructure",
  finance: "finance",
  weather: "weather",
};
const groupId = (g: CompareGroup) => `compare-${g}`;

/** Colour of district A and district B wherever the two are drawn side by side. */
const SIDE_COLOR = { a: "var(--hue)", b: "var(--hue-pop)" } as const;

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
  /** Kept for older call sites — every value uses tabular figures anyway. */
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
      <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: colorA, textAlign: "right" }}>
        {na ? notAvailable : String(valA)}
      </div>
      <div className="ftp-compare-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: colorB }}>
        {nb ? notAvailable : String(valB)}
      </div>
    </div>
  );
}

/**
 * Group heading inside the comparison card: an emoji chip and the title.
 * @prop group      Gives the heading its scroll-target id and emoji.
 * @prop fromLabel  When set (the visitor came from that module), shows a "From …" Pill.
 */
function GroupLabel({ children, group, fromLabel }: { children: React.ReactNode; group: CompareGroup; fromLabel?: string | null }) {
  return (
    <h2
      id={groupId(group)}
      className="ftp-display"
      style={{ margin: 0, padding: "18px 0 6px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", scrollMarginTop: 96, fontSize: 16, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)" }}
    >
      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 28, height: 28, fontSize: 15, borderRadius: 9 }}>
        {GROUP_EMOJI[group]}
      </span>
      {children}
      {fromLabel && <Pill tone="brand">From {fromLabel}</Pill>}
    </h2>
  );
}

// ── District selector dropdown ─────────────────────────────
function DistrictSelector({
  value,
  onChange,
  label,
  alignRight = false,
  swatch,
}: {
  value: string;
  onChange: (slug: string) => void;
  label: string;
  /** Open the menu towards the left (for the right-hand selector). */
  alignRight?: boolean;
  /** The side's colour, shown as a dot so A and B match the picture below. */
  swatch: string;
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
          gap: 10,
          minHeight: 48,
          maxWidth: "100%",
          padding: "0 14px",
          background: "var(--ftp-surface)",
          border: "1px solid color-mix(in srgb, var(--hue) 40%, var(--ftp-border))",
          borderRadius: 12,
          cursor: "pointer",
          fontFamily: "var(--ftp-font-display)",
          fontWeight: 650,
          fontSize: 17,
          color: "var(--hue-deep)",
          textAlign: "left",
          boxShadow: "var(--ftp-shadow-1)",
        }}
      >
        <span aria-hidden style={{ width: 12, height: 12, borderRadius: 4, background: swatch, flexShrink: 0 }} />
        <span>{selected?.district.name ?? "Select district"}</span>
        <ChevronDown size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
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
              boxShadow: "var(--ftp-shadow-2)",
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
                    background: isSel ? "var(--hue-tint)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: isSel ? 600 : 400,
                    color: isSel ? "var(--hue-deep)" : "var(--ftp-text)",
                  }}
                >
                  <span>{district.name}</span>
                  <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{state.name}</span>
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

/**
 * The picture: both populations as bars on one scale, plus one plain
 * sentence. Uses exactly the numbers in the Demographics rows below.
 */
function PopulationPicture({ a, b }: { a: { name: string; population: number }; b: { name: string; population: number } }) {
  const max = Math.max(a.population, b.population);
  const [big, small] = a.population >= b.population ? [a, b] : [b, a];
  const ratio = small.population > 0 ? big.population / small.population : null;
  const sameSize = ratio !== null && ratio < 1.05;
  const rows = [
    { ...a, color: SIDE_COLOR.a },
    { ...b, color: SIDE_COLOR.b },
  ];
  return (
    <Card tinted padding={18} style={{ marginBottom: 24 }}>
      <Explainer title="In simple words" emoji="👥">
        {sameSize ? (
          <>
            {a.name} and {b.name} have about the same number of people: <strong>{a.population.toLocaleString("en-IN")}</strong> and{" "}
            <strong>{b.population.toLocaleString("en-IN")}</strong>.
          </>
        ) : ratio !== null ? (
          <>
            {big.name} has about <strong>{ratio.toLocaleString("en-IN", { maximumFractionDigits: 1 })} times</strong> as many people as{" "}
            {small.name}: <strong>{big.population.toLocaleString("en-IN")}</strong> against <strong>{small.population.toLocaleString("en-IN")}</strong>.
          </>
        ) : (
          <>
            {big.name} has <strong>{big.population.toLocaleString("en-IN")}</strong> people.
          </>
        )}
      </Explainer>
      <ul aria-label="Population of the two districts" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <li key={r.name}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, lineHeight: "20px" }}>
              <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{r.name}</span>
              <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{r.population.toLocaleString("en-IN")} people</span>
            </div>
            <div aria-hidden style={{ marginTop: 6, height: 14, borderRadius: "var(--ftp-radius-pill)", background: "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface-2))", overflow: "hidden" }}>
              <div
                className="ftp-grow-x"
                style={{
                  width: `${max > 0 ? Math.max(2, Math.round((r.population / max) * 100)) : 0}%`,
                  height: "100%",
                  borderRadius: "var(--ftp-radius-pill)",
                  background: r.color,
                  ["--i" as string]: i,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ── Comparison content ─────────────────────────────────────
function CompareContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultA = ACTIVE_DISTRICTS[0]?.district.slug ?? "mandya";

  const slugA = searchParams.get("a") ?? defaultA;
  // B defaults to the first active district that is not A (a Toolbar link
  // only sends `a`, and comparing a district with itself says nothing).
  const defaultB = ACTIVE_DISTRICTS.find((x) => x.district.slug !== slugA)?.district.slug ?? "mysuru";
  const slugB = searchParams.get("b") ?? defaultB;

  // ?module=<slug> — accepted only when it is a real district module slug,
  // because it is also used to build links to that module's pages.
  const moduleParam = searchParams.get("module");
  const fromModule = SIDEBAR_MODULES.find((m) => m.slug === moduleParam) ?? null;
  const focusGroup: CompareGroup | null = fromModule ? MODULE_TO_GROUP[fromModule.slug] ?? null : null;

  const stateA = ACTIVE_DISTRICTS.find((x) => x.district.slug === slugA)?.state.slug ?? "karnataka";
  const stateB = ACTIVE_DISTRICTS.find((x) => x.district.slug === slugB)?.state.slug ?? "karnataka";

  const { data: overviewA, isLoading: loA } = useOverview(slugA, stateA);
  const { data: overviewB, isLoading: loB } = useOverview(slugB, stateB);
  const { data: budgetA, isLoading: lbA } = useBudget(slugA, stateA);
  const { data: budgetB, isLoading: lbB } = useBudget(slugB, stateB);
  const { data: weatherA, isLoading: lwA } = useWeather(slugA, stateA);
  const { data: weatherB, isLoading: lwB } = useWeather(slugB, stateB);

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

  /** Build the compare URL, keeping ?module= so the focus survives a district change. */
  function compareUrl(a: string, b: string) {
    const url = new URLSearchParams({ a, b });
    if (fromModule) url.set("module", fromModule.slug);
    return `/${locale}/compare?${url.toString()}`;
  }
  function setA(slug: string) {
    router.replace(compareUrl(slug, slugB));
  }
  function setB(slug: string) {
    router.replace(compareUrl(slugA, slug));
  }

  const isLoading = loA || loB;

  // Finance and weather groups only render when there is data, so the
  // focused group may be absent; the note above the table covers that case
  // (but only once that group's own data has finished loading).
  const focusGroupShown =
    !!focusGroup &&
    (focusGroup !== "finance" || totalBudA > 0 || totalBudB > 0) &&
    (focusGroup !== "weather" || !!(weatherReadA || weatherReadB));
  const focusGroupPending =
    (focusGroup === "finance" && (lbA || lbB)) || (focusGroup === "weather" && (lwA || lwB));

  // Scroll to the module's group once, as soon as both districts have
  // loaded AND the group itself is on the page (weather/finance arrive later).
  const scrolledFor = useRef<string | null>(null);
  const tableReady = !isLoading && !!dA && !!dB;
  useEffect(() => {
    if (!tableReady || !focusGroup || !focusGroupShown || scrolledFor.current === focusGroup) return;
    const el = document.getElementById(groupId(focusGroup));
    if (!el) return;
    scrolledFor.current = focusGroup;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [tableReady, focusGroup, focusGroupShown]);

  /** "From Weather & Rainfall" tag for the focused group only. */
  const fromFor = (g: CompareGroup) => (focusGroup === g && fromModule ? fromModule.label : null);

  // Honest period label for the budget rows: one FY if both match, else both.
  const fyLabel = latYrA && latYrB && latYrA !== latYrB ? `FY ${latYrA} vs FY ${latYrB}` : latYrA || latYrB ? `FY ${latYrA ?? latYrB}` : null;

  // The picture needs a population for both districts (same numbers as the table).
  const popA = typeof dA?.population === "number" && dA.population > 0 ? dA.population : null;
  const popB = typeof dB?.population === "number" && dB.population > 0 ? dB.population : null;

  return (
    <main id="main-content" className="ftp-hue-indigo" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
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
        .ftp-compare-label { font-size: 12px; line-height: 16px; color: var(--ftp-text-2); text-align: center; min-width: 120px; padding: 0 8px; }
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
          <SiteHeader
            emoji="⚖️"
            icon={GitCompare}
            title="District comparison"
            description="Compare key metrics side-by-side for any two active districts"
            backHref={`/${locale}`}
            backLabel="Back to home"
          />

          {/* Selectors */}
          <Card tinted padding={20} style={{ marginBottom: 24 }}>
            <div className="ftp-compare-pickers">
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", minWidth: 0 }}>
                <span className="ftp-label">District A</span>
                <DistrictSelector value={slugA} onChange={setA} label="District A" swatch={SIDE_COLOR.a} />
              </div>
              <div
                aria-hidden="true"
                className="ftp-display"
                style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", justifySelf: "center", background: "var(--hue)", color: "#fff", fontSize: 14, fontWeight: 700 }}
              >
                vs
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 0 }}>
                <span className="ftp-label">District B</span>
                <DistrictSelector value={slugB} onChange={setB} label="District B" alignRight swatch={SIDE_COLOR.b} />
              </div>
            </div>
          </Card>

          {/* Came from a module this page has no group for (or whose group
              has no data for these two districts): say so plainly. */}
          {fromModule && !isLoading && !focusGroupShown && !focusGroupPending && (
            <p role="note" className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>
              {focusGroup
                ? `No ${GROUP_TITLES[focusGroup].toLowerCase()} figures are available for both districts yet.`
                : `${fromModule.label} is not part of the side-by-side comparison yet. This page compares demographics, infrastructure, finance and weather.`}{" "}
              The links at the bottom open {fromModule.label} for each district.
            </p>
          )}

          {isLoading && <LoadingShell rows={6} />}

          {/* The picture — only when both districts report a population */}
          {!isLoading && dA && dB && popA !== null && popB !== null && (
            <PopulationPicture a={{ name: dA.name, population: popA }} b={{ name: dB.name, population: popB }} />
          )}

          {!isLoading && dA && dB && (
            <Card padding={0} style={{ overflow: "hidden" }}>
              {/* Column headers */}
              <div className="ftp-compare-body" style={{ background: "var(--hue-tint)", borderBottom: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))" }}>
                <div className="ftp-compare-row" style={{ borderBottom: "none", padding: "14px 0" }}>
                  <div style={{ textAlign: "right", minWidth: 0 }}>
                    <div className="ftp-display" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {dA.name}
                      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: SIDE_COLOR.a }} />
                    </div>
                    {dA.nameLocal && <div style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dA.nameLocal}</div>}
                  </div>
                  <div className="ftp-compare-label" aria-hidden="true" />
                  <div style={{ minWidth: 0 }}>
                    <div className="ftp-display" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 650, color: "var(--hue-deep)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: SIDE_COLOR.b }} />
                      {dB.name}
                    </div>
                    {dB.nameLocal && <div style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dB.nameLocal}</div>}
                  </div>
                </div>
              </div>

              <div className="ftp-compare-body">
                {/* Demographics */}
                <GroupLabel group="demographics" fromLabel={fromFor("demographics")}>{GROUP_TITLES.demographics}</GroupLabel>
                <MetricRow label="Population" valA={dA.population?.toLocaleString("en-IN")} valB={dB.population?.toLocaleString("en-IN")} />
                <MetricRow label="Area (sq km)" valA={dA.area?.toLocaleString("en-IN")} valB={dB.area?.toLocaleString("en-IN")} />
                <MetricRow label="Density (per sq km)" valA={dA.density} valB={dB.density} />
                <MetricRow label="Literacy rate (%)" valA={dA.literacy !== null ? `${dA.literacy}%` : null} valB={dB.literacy !== null ? `${dB.literacy}%` : null} />
                <MetricRow label="Sex ratio (F per 1000 M)" valA={dA.sexRatio} valB={dB.sexRatio} />
                <MetricRow label="Taluks" valA={dA.talukCount ?? dA.taluks?.length} valB={dB.talukCount ?? dB.taluks?.length} />
                <MetricRow label="Villages" valA={dA.villageCount} valB={dB.villageCount} />

                {/* Infrastructure */}
                <GroupLabel group="infrastructure" fromLabel={fromFor("infrastructure")}>{GROUP_TITLES.infrastructure}</GroupLabel>
                <MetricRow label="Active projects" valA={dA._count?.infraProjects} valB={dB._count?.infraProjects} />
                <MetricRow label="Government schemes" valA={dA._count?.schemes} valB={dB._count?.schemes} />
                <MetricRow label="Schools" valA={dA._count?.schools} valB={dB._count?.schools} />
                <MetricRow label="Police stations" valA={dA._count?.policeStations} valB={dB._count?.policeStations} />

                {/* Finance */}
                {(totalBudA > 0 || totalBudB > 0) && (
                  <>
                    <GroupLabel group="finance" fromLabel={fromFor("finance")}>
                      {GROUP_TITLES.finance}
                      {fyLabel && (
                        <span style={{ fontFamily: "var(--ftp-font-sans)", fontSize: 12, fontWeight: 500, color: "var(--ftp-text-2)" }}>({fyLabel})</span>
                      )}
                    </GroupLabel>
                    <MetricRow label="Total budget (₹ Cr)" valA={totalBudA > 0 ? (totalBudA / 1e7).toFixed(0) : null} valB={totalBudB > 0 ? (totalBudB / 1e7).toFixed(0) : null} />
                    <MetricRow label="Spent (₹ Cr)" valA={totalSpentA > 0 ? (totalSpentA / 1e7).toFixed(0) : null} valB={totalSpentB > 0 ? (totalSpentB / 1e7).toFixed(0) : null} />
                    <MetricRow
                      label="Budget utilisation (%)"
                      valA={totalBudA > 0 ? `${Math.round((totalSpentA / totalBudA) * 100)}%` : null}
                      valB={totalBudB > 0 ? `${Math.round((totalSpentB / totalBudB) * 100)}%` : null}
                    />
                  </>
                )}

                {/* Weather — each side carries the date its reading was taken */}
                {(weatherReadA || weatherReadB) && (
                  <>
                    <GroupLabel group="weather" fromLabel={fromFor("weather")}>{GROUP_TITLES.weather}</GroupLabel>
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
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ftp-live)" }} aria-hidden="true" />
                  Better value
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ftp-danger)" }} aria-hidden="true" />
                  Lower value
                </span>
                <span style={{ fontSize: 12, color: "var(--ftp-text-2)", marginLeft: "auto" }}>
                  Data from ForThePeople.in, updated automatically
                </span>
              </div>
            </Card>
          )}

          {/* Links to full dashboards */}
          {!isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 20 }}>
              {/* With ?module= these open that module's page; otherwise the district overview. */}
              {[
                { href: `/${locale}/${stateA}/${slugA}`, name: dA?.name ?? slugA },
                { href: `/${locale}/${stateB}/${slugB}`, name: dB?.name ?? slugB },
              ].map((l) => ({
                ...l,
                href: fromModule && fromModule.slug !== "overview" ? `${l.href}/${fromModule.slug}` : l.href,
              })).map((l) => (
                <Card
                  key={l.href}
                  href={l.href}
                  tinted
                  padding={12}
                  style={{ textAlign: "center", minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="ftp-emoji" aria-hidden>{fromModule && fromModule.slug !== "overview" ? fromModule.emoji : "📊"}</span>
                    {fromModule && fromModule.slug !== "overview" ? `View ${l.name} ${fromModule.label}` : `View ${l.name} dashboard`}
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
