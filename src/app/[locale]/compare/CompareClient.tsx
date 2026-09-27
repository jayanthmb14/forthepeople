/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Comparison (client part)
// URL: /en/compare?a=mandya&b=mysuru   (page.tsx adds the metadata)
//
// The question it answers: "How does my district compare with another?"
//
// Design v4.1 (indigo) inside <ModulePage>: SiteHeader band, a tinted
// picker card, the answer in one sentence (the population comparison),
// then the comparison table beside the pictures on laptop / PC (pictures
// first on phones and tablets): the two populations as bars (only when
// both districts report a population) and literacy / budget used as pairs
// of rings (only for the numbers both districts have). Group headings
// carry an emoji; links are hue-coloured.
//
// Every metric name in the table is a button: tapping it opens a
// DetailSheet that says in plain words what the number means, shows both
// values and the gap, says whether higher is better, and links to that
// module for each district. The "better / lower" colours are only used
// where a higher number really is better (literacy, share of budget used);
// counts that just follow a district's size (people, area, schools …) are
// not judged. They stay the semantic live / danger TEXT colours plus a
// 6 px dot in the legend (never a filled box). Data hooks and URL handling
// unchanged.
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
//
// Numbers: every row compares the raw numbers and shows them formatted in
// the reader's language (the old rows compared the formatted strings, so
// "18,05,769" read as 18). Text: "page_compare" messages; module names via
// useModuleText; district and state names are proper nouns.
// ═══════════════════════════════════════════════════════════
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GitCompare, Lock, ChevronDown, Info } from "lucide-react";
import { Card, FreshnessPill, LoadingShell, ModulePage, Pill, ToolbarButton } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList, RingStat } from "@/components/site/SiteVisuals";
import { INDIA_STATES } from "@/lib/constants/districts";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { useOverview, useBudget, useWeather } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText, usePlaceText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";

// ── Module → comparison group ──────────────────────────────
// The four groups this page compares. Each has an element id so a
// ?module= link can scroll to it.
type CompareGroup = "demographics" | "infrastructure" | "finance" | "weather";
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

type Num = number | null | undefined;
const isNum = (v: Num): v is number => typeof v === "number" && Number.isFinite(v);

// ── Metric row component ───────────────────────────────────
// Three columns: value A (right-aligned) · label · value B.
// When both values are numbers and the metric is judged ("higher" is
// better), the better one is shown in the "live" text colour and the
// other in the "danger" text colour. Unjudged metrics stay plain.
// The label is a button that opens the metric's explainer sheet.

/** Which group each metric belongs to (its sheet links to that module). */
type MetricKey =
  | "population" | "area" | "density" | "literacy" | "sexRatio" | "taluks" | "villages"
  | "projects" | "schemes" | "schools" | "police"
  | "budget" | "spent" | "utilisation"
  | "temperature" | "humidity" | "rainfall";

/** The module each metric's sheet links to, for each district ("overview" is the district's front page). */
const METRIC_MODULE: Record<MetricKey, string> = {
  population: "population", area: "overview", density: "population", literacy: "population", sexRatio: "population",
  taluks: "overview", villages: "overview",
  projects: "infrastructure", schemes: "schemes", schools: "schools", police: "police",
  budget: "finance", spent: "finance", utilisation: "finance",
  temperature: "weather", humidity: "weather", rainfall: "weather",
};

/** What the sheet needs to explain one metric. */
interface MetricInfo {
  metric: MetricKey;
  a: Num;
  b: Num;
  show: (n: number) => string;
  judged: boolean;
}

function MetricRow({
  metric,
  a,
  b,
  show,
  judged = false,
  onExplain,
}: {
  metric: MetricKey;
  a: Num;
  b: Num;
  /** How a number is written on screen (locale grouping, % sign …). */
  show: (n: number) => string;
  /** True when a higher number really is better (literacy, budget used). */
  judged?: boolean;
  onExplain: (info: MetricInfo) => void;
}) {
  const t = useTranslations("page_compare");
  const bothNum = isNum(a) && isNum(b);
  const label = t(`m_${metric}`);

  let colorA = "var(--ftp-text)";
  let colorB = "var(--ftp-text)";
  if (judged && bothNum && a !== b) {
    const aWins = a > b;
    colorA = aWins ? "var(--ftp-live-text)" : "var(--ftp-danger)";
    colorB = aWins ? "var(--ftp-danger)" : "var(--ftp-live-text)";
  }

  const notAvailable = (
    <span aria-label={t("naAria")} style={{ color: "var(--ftp-text-2)", fontSize: 13, fontFamily: "var(--ftp-font-sans)", fontWeight: 400 }}>
      {t("na")}
    </span>
  );

  return (
    <div className="ftp-compare-row">
      <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: colorA, textAlign: "right" }}>
        {isNum(a) ? show(a) : notAvailable}
      </div>
      <button
        type="button"
        className="ftp-compare-label ftp-compare-explain"
        onClick={() => onExplain({ metric, a, b, show, judged })}
        aria-haspopup="dialog"
        aria-label={t("explainAria", { metric: label })}
      >
        <span>{label}</span>
        <Info size={12} aria-hidden style={{ flexShrink: 0, color: "var(--hue)" }} />
      </button>
      <div className="ftp-num" style={{ fontSize: 16, lineHeight: "22px", color: colorB }}>
        {isNum(b) ? show(b) : notAvailable}
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
  const t = useTranslations("page_compare");
  return (
    <h2
      id={groupId(group)}
      className="ftp-display"
      style={{ margin: 0, padding: "18px 0 6px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", scrollMarginTop: 96, fontSize: 16, lineHeight: 1.4, fontWeight: 650, color: "var(--hue-deep)" }}
    >
      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 28, height: 28, fontSize: 15, borderRadius: 9 }}>
        {GROUP_EMOJI[group]}
      </span>
      {children}
      {fromLabel && <Pill tone="brand">{t("fromModule", { module: fromLabel })}</Pill>}
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
  const t = useTranslations("page_compare");
  const place = usePlaceText();
  const [open, setOpen] = useState(false);
  const selected = ACTIVE_DISTRICTS.find((x) => x.district.slug === value);

  return (
    <div style={{ position: "relative", maxWidth: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("selectAria", { side: label, name: selected?.district.name ?? t("select") })}
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
        <span>{selected?.district.name ?? t("select")}</span>
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
                  <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{place.state(state.slug, state.name)}</span>
                </button>
              );
            })}
            {ACTIVE_DISTRICTS.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} aria-hidden="true" /> {t("noDistricts")}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** A district name with its side's colour swatch (A or B), as in the table header. */
function SideLabel({ color, name }: { color: string; name: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      {name}
    </span>
  );
}

/** The one-sentence answer: how the two populations compare. */
function PopulationSentence({ a, b }: { a: { name: string; population: number }; b: { name: string; population: number } }) {
  const t = useTranslations("page_compare");
  const { number } = useFormat();
  const bold = (c: React.ReactNode) => <strong>{c}</strong>;
  const [big, small] = a.population >= b.population ? [a, b] : [b, a];
  const ratio = small.population > 0 ? big.population / small.population : null;
  const sameSize = ratio !== null && ratio < 1.05;
  return (
    <Explainer emoji="👥">
      {sameSize
        ? t.rich("popSame", { nameA: a.name, nameB: b.name, popA: number(a.population), popB: number(b.population), b: bold })
        : ratio !== null
          ? t.rich("popRatio", {
              big: big.name,
              small: small.name,
              ratio: number(ratio, { maximumFractionDigits: 1 }),
              popBig: number(big.population),
              popSmall: number(small.population),
              b: bold,
            })
          : t.rich("popOne", { big: big.name, popBig: number(big.population), b: bold })}
    </Explainer>
  );
}

/**
 * Picture 1: both populations as bars on one scale. Uses exactly the
 * numbers in the Demographics rows below.
 */
function PopulationPicture({ a, b }: { a: { name: string; population: number }; b: { name: string; population: number } }) {
  const t = useTranslations("page_compare");
  const { number } = useFormat();
  return (
    <ChartCard
      title={t("popTitle")}
      emoji="👥"
      units={t("popUnits")}
      table={[
        { label: a.name, value: number(a.population) },
        { label: b.name, value: number(b.population) },
      ]}
    >
      <div role="group" aria-label={t("popAria")}>
        <BarList
          height={14}
          rows={[
            { key: "a", label: <strong>{a.name}</strong>, value: a.population, display: t("people", { n: number(a.population) }), color: SIDE_COLOR.a },
            { key: "b", label: <strong>{b.name}</strong>, value: b.population, display: t("people", { n: number(b.population) }), color: SIDE_COLOR.b },
          ]}
        />
      </div>
    </ChartCard>
  );
}

/**
 * Picture 2: literacy and budget used as pairs of rings, A in the page hue
 * and B in its lighter partner. A pair is drawn only when both districts
 * have that number.
 */
function RingsPicture({
  nameA,
  nameB,
  literacy,
  budget,
  budgetPeriod,
}: {
  nameA: string;
  nameB: string;
  literacy: { a: number; b: number } | null;
  budget: { a: number; b: number } | null;
  budgetPeriod: string | null;
}) {
  const t = useTranslations("page_compare");
  const { number } = useFormat();
  const pct = (n: number) => number(n, { maximumFractionDigits: 1 });
  const bold = (c: React.ReactNode) => <strong>{c}</strong>;

  const sentence = (pair: { a: number; b: number }, same: string, diff: string) =>
    pair.a === pair.b
      ? t(same, { pct: pct(pair.a) })
      : t.rich(diff, {
          name: pair.a > pair.b ? nameA : nameB,
          hi: pct(Math.max(pair.a, pair.b)),
          lo: pct(Math.min(pair.a, pair.b)),
          b: bold,
        });

  const rings: Array<{ key: string; pctValue: number; label: string; color: string }> = [];
  if (literacy) {
    rings.push({ key: "litA", pctValue: literacy.a, label: t("ringLiteracy", { name: nameA }), color: SIDE_COLOR.a });
    rings.push({ key: "litB", pctValue: literacy.b, label: t("ringLiteracy", { name: nameB }), color: SIDE_COLOR.b });
  }
  if (budget) {
    rings.push({ key: "budA", pctValue: budget.a, label: t("ringBudget", { name: nameA }), color: SIDE_COLOR.a });
    rings.push({ key: "budB", pctValue: budget.b, label: t("ringBudget", { name: nameB }), color: SIDE_COLOR.b });
  }

  return (
    <ChartCard
      title={t("ringsTitle")}
      emoji="🎯"
      units={t("ringsUnits")}
      simple={
        <>
          {literacy && sentence(literacy, "ringsLiteracySame", "ringsLiteracy")}
          {literacy && budget && " "}
          {budget && sentence(budget, "ringsBudgetSame", "ringsBudget")}
        </>
      }
      asOfPeriod={budget && budgetPeriod ? budgetPeriod : undefined}
      table={rings.map((r) => ({ label: r.label, value: `${pct(r.pctValue)}%` }))}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, justifyItems: "center" }}>
        {rings.map((r, i) => (
          <RingStat
            key={r.key}
            index={i}
            pct={r.pctValue}
            value={`${pct(r.pctValue)}%`}
            caption={r.label}
            label={t("ringAria", { label: r.label, pct: pct(r.pctValue) })}
            color={r.color}
            size={104}
          />
        ))}
      </div>
    </ChartCard>
  );
}

// ── Comparison content ─────────────────────────────────────
function CompareContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("page_compare");
  const mt = useModuleText();
  const { number } = useFormat();

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
  const fromModuleLabel = fromModule ? mt.label(fromModule.slug) : null;
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

  // The metric whose explainer sheet is open.
  const [explain, setExplain] = useState<MetricInfo | null>(null);

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
  const fromFor = (g: CompareGroup) => (focusGroup === g ? fromModuleLabel : null);

  // Honest period label for the budget rows: one FY if both match, else both.
  const fyLabel =
    latYrA && latYrB && latYrA !== latYrB
      ? t("fyTwo", { a: latYrA, b: latYrB })
      : latYrA || latYrB
        ? t("fyOne", { year: (latYrA ?? latYrB) as string })
        : null;

  // The pictures use the same numbers as the table.
  const popA = typeof dA?.population === "number" && dA.population > 0 ? dA.population : null;
  const popB = typeof dB?.population === "number" && dB.population > 0 ? dB.population : null;
  const litPair = isNum(dA?.literacy) && isNum(dB?.literacy) ? { a: dA!.literacy as number, b: dB!.literacy as number } : null;
  const usedA = totalBudA > 0 ? (totalSpentA / totalBudA) * 100 : null;
  const usedB = totalBudB > 0 ? (totalSpentB / totalBudB) * 100 : null;
  const budPair = usedA !== null && usedB !== null ? { a: usedA, b: usedB } : null;

  // How numbers are written in each row.
  const whole = (n: number) => number(n);
  const withPct = (n: number) => `${number(n, { maximumFractionDigits: 1 })}%`;
  const crore = (n: number) => number(Math.round(n / 1e7));
  const oneDp = (n: number) => number(n, { maximumFractionDigits: 1 });
  const cr = (n: number) => (n > 0 ? n : null);

  const showModuleLinks = fromModule && fromModule.slug !== "overview";
  // The table sits beside the pictures on laptop / PC only when there are pictures.
  const hasPictures = !isLoading && !!dA && !!dB && ((popA !== null && popB !== null) || !!litPair || !!budPair);

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
        .ftp-compare-label { font-size: 12px; line-height: 1.45; color: var(--ftp-text-2); text-align: center; min-width: 120px; padding: 0 8px; }
        .ftp-compare-explain {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          min-height: 44px; background: none; border: none; border-radius: 10px;
          font-family: inherit; cursor: pointer;
        }
        .ftp-compare-explain:hover { color: var(--hue-deep); background: var(--hue-tint); }
        .ftp-compare-body { padding: 0 24px; }
        .ftp-compare-main { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); align-items: start; }
        .ftp-compare-main:not(.has-pictures) .ftp-compare-table { max-width: 900px; }
        .ftp-compare-pictures { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
        @media (min-width: 1024px) {
          .ftp-compare-main.has-pictures { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); }
          .ftp-compare-table { order: 1; }
          .ftp-compare-pictures { order: 2; grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 640px) {
          .ftp-compare-pickers { grid-template-columns: 1fr; gap: 8px; }
          .ftp-compare-pickers > div:not(.ftp-compare-vs) { align-items: flex-start !important; }
          .ftp-compare-label { min-width: 0; padding: 0 4px; }
          .ftp-compare-body { padding: 0 16px; }
        }
      `}</style>

      <ModulePage>
          <SiteHeader
            emoji="⚖️"
            icon={GitCompare}
            title={t("title")}
            description={t("description")}
            backHref={`/${locale}`}
            backLabel={t("backHome")}
          />

          {/* Selectors */}
          <Card tinted padding={20} style={{ marginBottom: 24 }}>
            <div className="ftp-compare-pickers">
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", minWidth: 0 }}>
                <span className="ftp-label">{t("districtA")}</span>
                <DistrictSelector value={slugA} onChange={setA} label={t("districtA")} swatch={SIDE_COLOR.a} />
              </div>
              <div
                aria-hidden="true"
                className="ftp-display ftp-compare-vs"
                style={{ minWidth: 40, height: 40, padding: "0 8px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", justifySelf: "center", background: "var(--hue)", color: "#fff", fontSize: 14, lineHeight: 1, fontWeight: 700 }}
              >
                {t("vs")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 0 }}>
                <span className="ftp-label">{t("districtB")}</span>
                <DistrictSelector value={slugB} onChange={setB} label={t("districtB")} alignRight swatch={SIDE_COLOR.b} />
              </div>
            </div>
          </Card>

          {/* Came from a module this page has no group for (or whose group
              has no data for these two districts): say so plainly. */}
          {fromModule && fromModuleLabel && !isLoading && !focusGroupShown && !focusGroupPending && (
            <p role="note" className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>
              {focusGroup === "finance" || focusGroup === "weather"
                ? t(`noFigures_${focusGroup}`)
                : t("notInCompare", { module: fromModuleLabel })}{" "}
              {t("linksBelow", { module: fromModuleLabel })}
            </p>
          )}

          {isLoading && <LoadingShell rows={6} />}

          {/* The answer in one sentence */}
          {!isLoading && dA && dB && popA !== null && popB !== null && (
            <PopulationSentence a={{ name: dA.name, population: popA }} b={{ name: dB.name, population: popB }} />
          )}
          {!isLoading && dA && dB && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, margin: "0 0 12px" }}>{t("tapHint")}</p>
          )}

          <div className={`ftp-compare-main${hasPictures ? " has-pictures" : ""}`}>
          {/* The pictures — each only when both districts have its numbers */}
          {!isLoading && dA && dB && ((popA !== null && popB !== null) || litPair || budPair) && (
            <div className="ftp-compare-pictures">
              {popA !== null && popB !== null && (
                <PopulationPicture a={{ name: dA.name, population: popA }} b={{ name: dB.name, population: popB }} />
              )}
              {(litPair || budPair) && (
                <RingsPicture nameA={dA.name} nameB={dB.name} literacy={litPair} budget={budPair} budgetPeriod={fyLabel} />
              )}
            </div>
          )}

          {!isLoading && dA && dB && (
            <Card padding={0} className="ftp-compare-table" style={{ overflow: "hidden" }}>
              {/* Column headers */}
              <div className="ftp-compare-body" style={{ background: "var(--hue-tint)", borderBottom: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))" }}>
                <div className="ftp-compare-row" style={{ borderBottom: "none", padding: "14px 0" }}>
                  <div style={{ textAlign: "right", minWidth: 0 }}>
                    <div className="ftp-display" style={{ fontSize: 17, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {dA.name}
                      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: SIDE_COLOR.a }} />
                    </div>
                    {dA.nameLocal && <div lang={scriptLang(dA.nameLocal)} style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dA.nameLocal}</div>}
                  </div>
                  <div className="ftp-compare-label" aria-hidden="true" />
                  <div style={{ minWidth: 0 }}>
                    <div className="ftp-display" style={{ fontSize: 17, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: SIDE_COLOR.b }} />
                      {dB.name}
                    </div>
                    {dB.nameLocal && <div lang={scriptLang(dB.nameLocal)} style={{ fontSize: 13, color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{dB.nameLocal}</div>}
                  </div>
                </div>
              </div>

              <div className="ftp-compare-body">
                {/* Demographics */}
                <GroupLabel group="demographics" fromLabel={fromFor("demographics")}>{t("group_demographics")}</GroupLabel>
                <MetricRow metric="population" a={dA.population} b={dB.population} show={whole} onExplain={setExplain} />
                <MetricRow metric="area" a={dA.area} b={dB.area} show={whole} onExplain={setExplain} />
                <MetricRow metric="density" a={dA.density} b={dB.density} show={whole} onExplain={setExplain} />
                <MetricRow metric="literacy" a={dA.literacy} b={dB.literacy} show={withPct} judged onExplain={setExplain} />
                <MetricRow metric="sexRatio" a={dA.sexRatio} b={dB.sexRatio} show={whole} onExplain={setExplain} />
                <MetricRow metric="taluks" a={dA.talukCount ?? dA.taluks?.length} b={dB.talukCount ?? dB.taluks?.length} show={whole} onExplain={setExplain} />
                <MetricRow metric="villages" a={dA.villageCount} b={dB.villageCount} show={whole} onExplain={setExplain} />

                {/* Infrastructure */}
                <GroupLabel group="infrastructure" fromLabel={fromFor("infrastructure")}>{t("group_infrastructure")}</GroupLabel>
                <MetricRow metric="projects" a={dA._count?.infraProjects} b={dB._count?.infraProjects} show={whole} onExplain={setExplain} />
                <MetricRow metric="schemes" a={dA._count?.schemes} b={dB._count?.schemes} show={whole} onExplain={setExplain} />
                <MetricRow metric="schools" a={dA._count?.schools} b={dB._count?.schools} show={whole} onExplain={setExplain} />
                <MetricRow metric="police" a={dA._count?.policeStations} b={dB._count?.policeStations} show={whole} onExplain={setExplain} />

                {/* Finance */}
                {(totalBudA > 0 || totalBudB > 0) && (
                  <>
                    <GroupLabel group="finance" fromLabel={fromFor("finance")}>
                      {t("group_finance")}
                      {fyLabel && (
                        <span style={{ fontFamily: "var(--ftp-font-sans)", fontSize: 12, fontWeight: 500, color: "var(--ftp-text-2)" }}>({fyLabel})</span>
                      )}
                    </GroupLabel>
                    <MetricRow metric="budget" a={cr(totalBudA)} b={cr(totalBudB)} show={crore} onExplain={setExplain} />
                    <MetricRow metric="spent" a={cr(totalSpentA)} b={cr(totalSpentB)} show={crore} onExplain={setExplain} />
                    <MetricRow metric="utilisation" a={usedA} b={usedB} show={withPct} judged onExplain={setExplain} />
                  </>
                )}

                {/* Weather — each side carries the date its reading was taken */}
                {(weatherReadA || weatherReadB) && (
                  <>
                    <GroupLabel group="weather" fromLabel={fromFor("weather")}>{t("group_weather")}</GroupLabel>
                    <div className="ftp-compare-row">
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <FreshnessPill asOf={weatherReadA?.recordedAt} />
                      </div>
                      <div className="ftp-compare-label">{t("m_recorded")}</div>
                      <div style={{ display: "flex" }}>
                        <FreshnessPill asOf={weatherReadB?.recordedAt} />
                      </div>
                    </div>
                    <MetricRow metric="temperature" a={weatherReadA?.temperature} b={weatherReadB?.temperature} show={oneDp} onExplain={setExplain} />
                    <MetricRow metric="humidity" a={weatherReadA?.humidity} b={weatherReadB?.humidity} show={whole} onExplain={setExplain} />
                    <MetricRow metric="rainfall" a={weatherReadA?.rainfall} b={weatherReadB?.rainfall} show={oneDp} onExplain={setExplain} />
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="ftp-compare-body" style={{ paddingTop: 16, paddingBottom: 16, borderTop: "1px solid var(--ftp-border)", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ftp-live)" }} aria-hidden="true" />
                  {t("legendBetter")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ftp-text-2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ftp-danger)" }} aria-hidden="true" />
                  {t("legendLower")}
                </span>
                <span style={{ fontSize: 12, color: "var(--ftp-text-2)", marginLeft: "auto" }}>{t("legendNote")}</span>
              </div>
            </Card>
          )}
          </div>

          {/* Links to full dashboards */}
          {!isLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12, marginTop: 20 }}>
              {/* With ?module= these open that module's page; otherwise the district overview. */}
              {[
                { href: `/${locale}/${stateA}/${slugA}`, name: dA?.name ?? slugA },
                { href: `/${locale}/${stateB}/${slugB}`, name: dB?.name ?? slugB },
              ].map((l) => ({
                ...l,
                href: showModuleLinks ? `${l.href}/${fromModule.slug}` : l.href,
              })).map((l) => (
                <Card
                  key={l.href}
                  href={l.href}
                  tinted
                  padding={12}
                  style={{ textAlign: "center", minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="ftp-emoji" aria-hidden>{showModuleLinks ? fromModule.emoji : "📊"}</span>
                    {showModuleLinks && fromModuleLabel
                      ? t("openModule", { name: l.name, module: fromModuleLabel })
                      : t("openDashboard", { name: l.name })}
                  </span>
                </Card>
              ))}
            </div>
          )}
      </ModulePage>

      {/* The metric's explainer sheet */}
      {/* (links: "overview" is the district's front page, every other slug is a module page) */}
      <DetailSheet
        open={!!explain && !!dA && !!dB}
        onClose={() => setExplain(null)}
        hueClassName="ftp-hue-indigo"
        emoji="ℹ️"
        title={explain ? t(`m_${explain.metric}`) : ""}
        subtitle={explain ? t(`help_${explain.metric}`) : undefined}
        footer={
          explain && dA && dB ? (
            <>
              {[
                { state: stateA, slug: slugA, name: dA.name },
                { state: stateB, slug: slugB, name: dB.name },
              ].map((side) => {
                const mod = METRIC_MODULE[explain.metric];
                const href = `/${locale}/${side.state}/${side.slug}${mod === "overview" ? "" : `/${mod}`}`;
                return (
                  <ToolbarButton key={side.slug} href={href}>
                    {t("openModule", { module: mt.label(mod), name: side.name })}
                  </ToolbarButton>
                );
              })}
            </>
          ) : undefined
        }
      >
        {explain && dA && dB && (
          <>
            <DetailList
              rows={[
                {
                  label: <SideLabel color={SIDE_COLOR.a} name={dA.name} />,
                  value: isNum(explain.a) ? <span className="ftp-num">{explain.show(explain.a)}</span> : t("na"),
                },
                {
                  label: <SideLabel color={SIDE_COLOR.b} name={dB.name} />,
                  value: isNum(explain.b) ? <span className="ftp-num">{explain.show(explain.b)}</span> : t("na"),
                },
                {
                  emoji: "↔️",
                  label: t("sheetGap"),
                  value: isNum(explain.a) && isNum(explain.b) ? <span className="ftp-num">{explain.show(Math.abs(explain.a - explain.b))}</span> : null,
                },
              ]}
            />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ftp-text)" }}>
              <span className="ftp-emoji" aria-hidden>{explain.judged ? "⬆️ " : "⚖️ "}</span>
              {explain.judged ? t("sheetHigherBetter") : t("sheetNotJudged")}
            </p>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{t("legendNote")}</p>
          </>
        )}
      </DetailSheet>
    </main>
  );
}

export default function CompareClient({ locale }: { locale: string }) {
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
