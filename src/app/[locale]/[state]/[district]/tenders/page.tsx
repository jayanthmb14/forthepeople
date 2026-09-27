/**
 * ForThePeople.in — Module 30 (Tenders)
 * District tender transparency dashboard.
 * Data from 6 Karnataka government procurement portals — every tender carries
 * a source URL and timestamp. No editorialising; only factual red-flag labels.
 *
 * Design v4 "Rang" module template (docs/DESIGN-SYSTEM.md):
 *   PageHeader → compact disclaimer → StatStrip of emoji tiles → the picture
 *   (explainer + pictogram of MSE-reserved tenders) → "when open tenders
 *   close" ChartCard → status chips → filters → guide links → tender cards
 *   (or an honest EmptyState) → pagination → full legal disclaimer →
 *   sources + Share/Compare.
 * Data hooks, filters, red-flag logic and legal text are unchanged. The
 * picture and the chart read only the numbers the stats API already sends.
 */

"use client";

import type React from "react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Gavel, AlertTriangle, BookOpen, ShieldCheck, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  Toolbar,
  ToolbarButton,
  AsOfText,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import TenderCard, { type TenderCardData } from "@/components/tenders/TenderCard";
import TenderLockedState from "@/components/tenders/TenderLockedState";
import { formatInr } from "@/lib/tenders/format";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

interface AccessResponse {
  tendersActive: boolean;
  districtName: string;
  districtSlug: string;
  stateName: string;
  stateSlug: string;
}

type ListResponse = { tenders: TenderCardData[]; total: number; page: number; pageSize: number; districtName: string };
type StatsResponse = {
  districtName: string;
  /** Newest `lastCheckedAt` of this district's tender rows (ISO), sent by the stats API. */
  lastCheckedAt?: string | null;
  live: { count: number; totalValueInr: string; mseReservedCount: number; startupExemptCount: number; redFlaggedCount: number };
  deadlineHistogram: { bucket: string; count: number }[];
  awarded90d: { count: number; totalValueInr: string };
  topAuthorities: { authority: { name: string; shortCode: string }; count: number }[];
  categoryDistribution: { category: { name: string; slug: string } | null; count: number }[];
};

type Tab = "LIVE" | "CLOSING_SOON" | "AWARDED" | "ARCHIVE";

const VALUE_PRESETS = [
  { label: "Any", min: null, max: null },
  { label: "SME (₹1L–₹5Cr)", min: 100_000, max: 50_000_000 },
  { label: "Mid (₹5Cr–₹50Cr)", min: 50_000_000, max: 500_000_000 },
  { label: "Large (₹50Cr+)", min: 500_000_000, max: null },
];

/** Status tabs, shown as filter chips (the active chip fills with the module hue). */
const TABS: Array<{ value: Tab; label: string }> = [
  { value: "LIVE", label: "Live" },
  { value: "CLOSING_SOON", label: "Closing in 48h" },
  { value: "AWARDED", label: "Recently awarded" },
  { value: "ARCHIVE", label: "Archive" },
];

/** Plain words for the deadline buckets the stats API returns. */
const BUCKET_LABEL: Record<string, string> = {
  "<48h": "Within 2 days",
  "2-7d": "2 to 7 days",
  "7-14d": "7 to 14 days",
  ">14d": "After 14 days",
};

export default function TendersPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const [tab, setTab] = useState<Tab>("LIVE");
  const [valuePreset, setValuePreset] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [onlyMse, setOnlyMse] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Per-district lock check — reads from DB.tendersActive. When false we
  // render TenderLockedState instead of the dashboard. Cheap single-row
  // query; cached for 2 minutes by react-query so it won't fire per nav.
  const access = useQuery<AccessResponse>({
    queryKey: ["tenders-access", districtSlug],
    queryFn: () => fetch(`/api/tenders/${districtSlug}/access`).then((r) => r.json()),
    staleTime: 2 * 60_000,
  });

  const listQuery = useQuery<ListResponse>({
    queryKey: ["tenders-list", districtSlug, tab, valuePreset, category, onlyFlagged, onlyMse, search, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ status: tab, page: String(page), pageSize: String(pageSize) });
      const preset = VALUE_PRESETS[valuePreset];
      if (preset.min) qs.set("valueMin", String(preset.min));
      if (preset.max) qs.set("valueMax", String(preset.max));
      if (category) qs.set("category", category);
      if (onlyMse) qs.set("mseReserved", "true");
      if (search) qs.set("search", search);
      const res = await fetch(`/api/tenders/${districtSlug}?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
  const stats = useQuery<StatsResponse>({
    queryKey: ["tenders-stats", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const tenders = (listQuery.data?.tenders ?? []).filter((t) => (onlyFlagged ? t.redFlags.length > 0 : true));
  // Newest publish date in the current list — an honest "as of" for the page
  // (we show when the newest tender appeared, not a made-up refresh time).
  const newestPublished = (listQuery.data?.tenders ?? []).reduce<string | null>(
    (latest, t) => (!latest || new Date(t.publishedAt) > new Date(latest) ? t.publishedAt : latest),
    null,
  );
  const totalPages = listQuery.data ? Math.ceil(listQuery.data.total / pageSize) : 1;

  // Render the locked state whenever the flag resolves false. Until the
  // access query resolves we show nothing heavy — the dashboard shell
  // below its own loading states will handle the brief flash.
  if (access.data && access.data.tendersActive === false) {
    return (
      <ModuleErrorBoundary moduleName="TendersLocked">
        <TenderLockedState
          locale={locale}
          stateSlug={stateSlug}
          stateName={access.data.stateName ?? ""}
          districtSlug={districtSlug}
          districtName={access.data.districtName ?? ""}
        />
      </ModuleErrorBoundary>
    );
  }

  const tendersBase = `/${locale}/${stateSlug}/${districtSlug}/tenders`;
  const districtName = listQuery.data?.districtName ?? stats.data?.districtName ?? "";

  // ── The picture + chart, from the stats API only ──────────────────────
  const live = stats.data?.live;
  const liveCount = live?.count ?? 0;
  const statsAsOf = stats.data?.lastCheckedAt ?? null;
  const closing48 = stats.data?.deadlineHistogram.find((b) => b.bucket === "<48h")?.count ?? 0;
  const deadlineChart = (stats.data?.deadlineHistogram ?? []).map((b) => ({
    bucket: BUCKET_LABEL[b.bucket] ?? b.bucket,
    count: b.count,
  }));
  const closingInWeek = (stats.data?.deadlineHistogram ?? [])
    .filter((b) => b.bucket === "<48h" || b.bucket === "2-7d")
    .reduce((s, b) => s + b.count, 0);
  const mseOf10 = live && liveCount > 0 ? (live.mseReservedCount / liveCount) * 10 : 0;
  const liveValue = live ? formatInr(live.totalValueInr) : "—";

  return (
    <ModuleErrorBoundary moduleName="Tenders">
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={Gavel}
          title={`Government Tenders${districtName ? ` in ${districtName}` : ""}`}
          description="Live tenders from KPPP, CPPP, IREPS, defproc, BEL eProc, HAL TenderWizard. Factual red-flag indicators, plain-English summaries, apply guide."
          backHref={`/${locale}/${stateSlug}/${districtSlug}`}
          accent={getModuleAccent("tenders")}
          actions={
            newestPublished ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 24,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                <AsOfText asOf={newestPublished} prefix="Newest tender published" />
              </span>
            ) : undefined
          }
        />

        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Stats strip — counts come from the tender database for this district. */}
        {stats.data && (
          <StatStrip cols={3}>
            <StatTile emoji="📢" label="Live tenders" value={stats.data.live.count.toLocaleString("en-IN")} asOf={statsAsOf} />
            <StatTile emoji="💰" label="Total live value" value={formatInr(stats.data.live.totalValueInr)} />
            <StatTile emoji="⏰" label="Closing in 48h" value={String(closing48)} />
            <StatTile emoji="🏪" label="MSE-reserved" value={String(stats.data.live.mseReservedCount)} sub="Kept for micro and small firms" />
            <StatTile emoji="🚀" label="Startup-eligible" value={String(stats.data.live.startupExemptCount)} />
            <StatTile emoji="🚩" label="Flagged" value={String(stats.data.live.redFlaggedCount)} sub="Factual indicators, not allegations" />
          </StatStrip>
        )}

        {/* The picture: what is open right now, in one sentence, and how many
            of every 10 open tenders are kept for small businesses. Only when
            there are open tenders to talk about. */}
        {live && liveCount > 0 && (
          <div style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <Explainer emoji="📑">
                Right now <strong className="ftp-num">{liveCount.toLocaleString("en-IN")}</strong> government tender
                {liveCount === 1 ? " is" : "s are"} open for bids{districtName ? ` in ${districtName}` : ""}
                {liveValue !== "—" ? (
                  <>
                    , with a combined listed value of <strong className="ftp-num">{liveValue}</strong>
                  </>
                ) : null}
                . <strong className="ftp-num">{closing48.toLocaleString("en-IN")}</strong> of them close within two days.
              </Explainer>
              {liveCount >= 2 && (
                <Pictogram
                  filled={mseOf10}
                  emoji="🏪"
                  label={
                    live.mseReservedCount === 0
                      ? "None of the open tenders is reserved for micro and small businesses."
                      : `About ${Math.round(mseOf10)} of every 10 open tenders are reserved for micro and small businesses (MSE).`
                  }
                />
              )}
            </Card>
          </div>
        )}

        {/* When do the open tenders close? Four buckets from the stats API. */}
        {liveCount > 0 && deadlineChart.length > 1 && (
          <div style={{ marginTop: 24 }}>
            <ChartCard
              title="When open tenders close"
              emoji="⏳"
              units="Number of open tenders by time left to submit a bid"
              simple={
                <>
                  <span className="ftp-num">{closingInWeek.toLocaleString("en-IN")}</span> of{" "}
                  <span className="ftp-num">{liveCount.toLocaleString("en-IN")}</span> open tenders close within a week.
                </>
              }
              legend={[{ label: "Open tenders", swatch: "var(--hue)" }]}
              source={{ label: "Government procurement portals" }}
              asOf={statsAsOf}
              table={deadlineChart.map((r) => ({ label: r.bucket, value: r.count.toLocaleString("en-IN") }))}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deadlineChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                  <XAxis dataKey="bucket" tick={CHART_AXIS} interval={0} />
                  <YAxis tick={CHART_AXIS} allowDecimals={false} width={36} />
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString("en-IN"), "Open tenders"]}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--hue-tint)" }}
                  />
                  <Bar dataKey="count" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name="Open tenders" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        <Section title="Tenders" emoji="📑">
          {/* Status tabs as chips (32 px, 44 px on phones) */}
          <div style={{ marginBottom: 12 }}>
            <Chips
              label="Tender status"
              items={TABS}
              value={tab}
              onChange={(v) => { setTab(v as Tab); setPage(1); }}
            />
          </div>

          {/* Filter ribbon */}
          <Card tinted padding={12} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label htmlFor="tender-value" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>Value</label>
                <select id="tender-value" value={valuePreset} onChange={(e) => { setValuePreset(Number(e.target.value)); setPage(1); }} style={filterControl}>
                  {VALUE_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label htmlFor="tender-category" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>Category</label>
                <select id="tender-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={filterControl}>
                  <option value="">All</option>
                  {stats.data?.categoryDistribution.filter((c) => c.category).map((c) => (
                    <option key={c.category!.slug} value={c.category!.slug}>{c.category!.name} ({c.count})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={onlyMse} onChange={(e) => setOnlyMse(e.target.checked)} style={{ accentColor: "var(--hue)" }} /> MSE only
                </label>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} style={{ accentColor: "var(--hue)" }} /> Flagged only
                </label>
              </div>
              <div style={{ flex: "2 1 220px" }}>
                <label htmlFor="tender-search" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>Search</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} aria-hidden style={{ position: "absolute", left: 10, top: 14, color: "var(--hue)" }} />
                  <input
                    id="tender-search"
                    type="search"
                    placeholder="Search tender title..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ ...filterControl, paddingLeft: 32 }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Secondary nav — guides about tenders */}
          <Toolbar label="Tender guides">
            <ToolbarButton href={`${tendersBase}/apply-guide`} icon={ShieldCheck}>Apply guide</ToolbarButton>
            <ToolbarButton href={`${tendersBase}/transparency`} icon={AlertTriangle}>Transparency</ToolbarButton>
            <ToolbarButton href={`${tendersBase}/how-it-works`} icon={BookOpen}>How it works</ToolbarButton>
          </Toolbar>

          {/* Body */}
          <div style={{ marginTop: 16 }}>
            {listQuery.isLoading && <LoadingShell rows={3} />}
            {listQuery.error && <ErrorBlock message="Couldn't load tenders. Please try again in a moment." />}
            {!listQuery.isLoading && !listQuery.error && tenders.length === 0 && (
              <EmptyState
                emoji="🔍"
                title="No tenders match your filters."
                body={tab === "LIVE"
                  // Honest cadence: no tender cron is scheduled, so we do not promise a refresh interval.
                  ? "Try switching tabs or loosening filters. Tenders are added when the source portal publishes them; red-flag labels are recalculated when new tenders arrive."
                  : "Try the Live tab for current opportunities."}
              />
            )}
            {tenders.length > 0 && (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
                {tenders.map((t) => (
                  <TenderCard key={t.id} tender={t} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {listQuery.data && listQuery.data.total > pageSize && (
            <nav aria-label="Tender pages" style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
              <ToolbarButton icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</ToolbarButton>
              <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                Page <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{page}</span> of <span className="ftp-num">{totalPages}</span>
              </span>
              <ToolbarButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={14} aria-hidden />
              </ToolbarButton>
            </nav>
          )}
        </Section>

        <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        <ModulePageFooter moduleSlug="tenders" locale={locale} state={stateSlug} district={districtSlug} />
      </div>
    </ModuleErrorBoundary>
  );
}

// ── Local styles (tokens only) ──────────────────────────────────────────────

/** Select / text input in the filter ribbon — 44 px tall for easy tapping. */
const filterControl: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "0 10px",
  fontSize: 13,
  fontFamily: "var(--ftp-font-sans)",
  borderRadius: "var(--ftp-radius-tile)",
  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  boxSizing: "border-box",
};

/** Checkbox + label row, 44 px tall so the whole label is an easy target. */
const checkboxLabel: React.CSSProperties = {
  fontSize: 13,
  color: "var(--ftp-text)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  cursor: "pointer",
};
