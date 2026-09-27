/**
 * ForThePeople.in — Module 30 (Tenders)
 * District tender transparency dashboard.
 * Data from 6 Karnataka government procurement portals — every tender carries
 * a source URL and timestamp. No editorialising; only factual red-flag labels.
 *
 * Design v4 "Rang" module template (docs/DESIGN-SYSTEM.md):
 *   PageHeader → compact disclaimer → StatStrip of emoji tiles → the picture
 *   (explainer + pictogram of MSE-reserved tenders) → "what kind of work"
 *   ring + "who is buying" list → "when open tenders close" ChartCard →
 *   status chips → filters → guide links → tender cards (or an honest
 *   EmptyState) → pagination → full legal disclaimer → sources + Share/Compare.
 * Data hooks, filters, red-flag logic and legal text are unchanged. The
 * pictures and the chart read only the numbers the stats API already sends
 * (open tenders only). Words live in "page_tenders"; tender titles,
 * authorities and category names stay as the portals published them.
 */

"use client";

import type React from "react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
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
import { ShareDonut, TopBarList, type DonutSlice } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import { useModuleText } from "@/i18n/client";
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

/** Value filter presets; the label key is page_tenders.filters.value.<key>. */
const VALUE_PRESETS = [
  { key: "any", min: null, max: null },
  { key: "sme", min: 100_000, max: 50_000_000 },
  { key: "mid", min: 50_000_000, max: 500_000_000 },
  { key: "large", min: 500_000_000, max: null },
];

/** Status tabs, shown as filter chips (the active chip fills with the module hue). */
const TABS: Tab[] = ["LIVE", "CLOSING_SOON", "AWARDED", "ARCHIVE"];

/** Deadline buckets the stats API returns → message keys. */
const BUCKET_KEY: Record<string, string> = {
  "<48h": "within2d",
  "2-7d": "d2to7",
  "7-14d": "d7to14",
  ">14d": "after14",
};

const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

export default function TendersPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const tm = useTranslations("page_money");
  const mt = useModuleText();
  const m = useMoney();
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

  const tenders = (listQuery.data?.tenders ?? []).filter((x) => (onlyFlagged ? x.redFlags.length > 0 : true));
  // Newest publish date in the current list — an honest "as of" for the page
  // (we show when the newest tender appeared, not a made-up refresh time).
  const newestPublished = (listQuery.data?.tenders ?? []).reduce<string | null>(
    (latest, x) => (!latest || new Date(x.publishedAt) > new Date(latest) ? x.publishedAt : latest),
    null,
  );
  const totalPages = listQuery.data ? Math.ceil(listQuery.data.total / pageSize) : 1;

  // Render the locked state whenever the flag resolves false. Until the
  // access query resolves we show nothing heavy — the dashboard shell
  // below its own loading states will handle the brief flash.
  if (access.data && access.data.tendersActive === false) {
    return (
      <ModuleErrorBoundary moduleName={mt.label("tenders")}>
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

  // ── The pictures + chart, from the stats API only ─────────────────────
  const live = stats.data?.live;
  const liveCount = live?.count ?? 0;
  const statsAsOf = stats.data?.lastCheckedAt ?? null;
  const closing48 = stats.data?.deadlineHistogram.find((x) => x.bucket === "<48h")?.count ?? 0;
  const deadlineChart = (stats.data?.deadlineHistogram ?? []).map((x) => ({
    bucket: BUCKET_KEY[x.bucket] ? t(`buckets.${BUCKET_KEY[x.bucket]}`) : x.bucket,
    count: x.count,
  }));
  const closingInWeek = (stats.data?.deadlineHistogram ?? [])
    .filter((x) => x.bucket === "<48h" || x.bucket === "2-7d")
    .reduce((s, x) => s + x.count, 0);
  const mseOf10 = live && liveCount > 0 ? (live.mseReservedCount / liveCount) * 10 : 0;
  const liveValue = live ? m.short(live.totalValueInr) : "—";

  // What kind of work is open: the five biggest categories, the rest
  // (including tenders without a category) as "Other".
  const cats = (stats.data?.categoryDistribution ?? []).filter((x) => x.category && x.count > 0);
  const workSlices: DonutSlice[] = cats.slice(0, 5).map((x) => ({
    key: x.category!.slug,
    label: x.category!.name,
    value: x.count,
    display: m.num(x.count),
  }));
  const workRest = liveCount - workSlices.reduce((s, x) => s + x.value, 0);
  if (workRest > 0) workSlices.push({ key: "__other", label: tm("other"), value: workRest, display: m.num(workRest), other: true });
  // Who is buying: the government bodies with the most open tenders.
  const buyers = (stats.data?.topAuthorities ?? []).filter((x) => x.count > 0);

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={Gavel}
          title={districtName ? t("header.titleIn", { district: districtName }) : t("header.title")}
          description={t("header.description")}
          backHref={`/${locale}/${stateSlug}/${districtSlug}`}
          accent={getModuleAccent("tenders")}
          actions={
            newestPublished ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 24,
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                <AsOfText asOf={newestPublished} prefix={t("header.newest")} />
              </span>
            ) : undefined
          }
        />

        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Stats strip — counts come from the tender database for this district. */}
        {stats.data && (
          <StatStrip cols={3}>
            <StatTile emoji="📢" label={t("tiles.live")} value={m.num(stats.data.live.count)} asOf={statsAsOf} />
            <StatTile emoji="💰" label={t("tiles.value")} value={m.short(stats.data.live.totalValueInr)} />
            <StatTile emoji="⏰" label={t("tiles.closing48")} value={m.num(closing48)} />
            <StatTile emoji="🏪" label={t("tiles.mse")} value={m.num(stats.data.live.mseReservedCount)} sub={t("tiles.mseSub")} />
            <StatTile emoji="🚀" label={t("tiles.startup")} value={m.num(stats.data.live.startupExemptCount)} />
            <StatTile emoji="🚩" label={t("tiles.flagged")} value={m.num(stats.data.live.redFlaggedCount)} sub={t("tiles.flaggedSub")} />
          </StatStrip>
        )}

        {/* The picture: what is open right now, in one sentence, and how many
            of every 10 open tenders are kept for small businesses. Only when
            there are open tenders to talk about. */}
        {live && liveCount > 0 && (
          <div style={{ marginTop: 16 }}>
            <Card tinted padding={18}>
              <Explainer emoji="📑">
                {t.rich(
                  liveValue !== "—"
                    ? districtName ? "explainer.withValueIn" : "explainer.withValue"
                    : districtName ? "explainer.plainIn" : "explainer.plain",
                  { n: liveCount, district: districtName, value: liveValue, closing: closing48, num },
                )}
              </Explainer>
              {liveCount >= 2 && (
                <Pictogram
                  filled={mseOf10}
                  emoji="🏪"
                  label={live.mseReservedCount === 0 ? t("pictogramNone") : t("pictogram", { n: Math.round(mseOf10) })}
                />
              )}
            </Card>
          </div>
        )}

        {/* What kind of work is open, and who is buying — two new sides of
            the same open tenders. Each shows only when there is more than
            one thing to compare. */}
        {liveCount > 0 && (workSlices.length >= 2 || buyers.length >= 2) && (
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              alignItems: "start",
            }}
          >
            {workSlices.length >= 2 && (
              <ChartCard
                title={t("work.title")}
                emoji="🧰"
                units={t("work.units")}
                simple={t.rich("work.simple", { name: workSlices[0].label, n: workSlices[0].value, total: liveCount, b })}
                source={{ label: t("sourceLabel") }}
                asOf={statsAsOf}
                table={workSlices.map((x) => ({ label: x.label, value: `${x.display} (${m.pct(x.value / liveCount)})` }))}
              >
                <ShareDonut
                  slices={workSlices}
                  centerValue={m.num(liveCount)}
                  centerLabel={t("work.center")}
                  ariaLabel={t("work.aria", { list: workSlices.map((x) => `${x.label} ${x.display}`).join(", ") })}
                  formatPct={(p) => m.pct(p)}
                  size={160}
                />
              </ChartCard>
            )}
            {buyers.length >= 2 && (
              <ChartCard
                title={t("buyers.title")}
                emoji="🏛️"
                units={t("buyers.units")}
                simple={t.rich("buyers.simple", { name: buyers[0].authority.name, n: buyers[0].count, b })}
                source={{ label: t("sourceLabel") }}
                asOf={statsAsOf}
                table={buyers.map((x) => ({ label: x.authority.name, value: m.num(x.count) }))}
              >
                <TopBarList
                  rows={buyers.map((x) => ({
                    key: x.authority.shortCode + x.authority.name,
                    label: x.authority.name,
                    sub: x.authority.shortCode,
                    emoji: "🏛️",
                    value: x.count,
                    display: t("buyers.value", { n: x.count }),
                  }))}
                />
              </ChartCard>
            )}
          </div>
        )}

        {/* When do the open tenders close? Four buckets from the stats API. */}
        {liveCount > 0 && deadlineChart.length > 1 && (
          <div style={{ marginTop: 24 }}>
            <ChartCard
              title={t("deadline.title")}
              emoji="⏳"
              units={t("deadline.units")}
              simple={t.rich("deadline.simple", { week: closingInWeek, total: liveCount, num: (c) => <span className="ftp-num">{c}</span> })}
              legend={[{ label: t("deadline.legend"), swatch: "var(--hue)" }]}
              source={{ label: t("sourceLabel") }}
              asOf={statsAsOf}
              table={deadlineChart.map((r) => ({ label: r.bucket, value: m.num(r.count) }))}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deadlineChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                  <XAxis dataKey="bucket" tick={CHART_AXIS} interval={0} />
                  <YAxis tick={CHART_AXIS} allowDecimals={false} width={36} tickFormatter={(v) => m.num(Number(v))} />
                  <Tooltip
                    formatter={(v) => [m.num(Number(v)), t("deadline.legend")]}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--hue-tint)" }}
                  />
                  <Bar dataKey="count" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("deadline.legend")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        <Section title={t("list.title")} emoji="📑">
          {/* Status tabs as chips (32 px, 44 px on phones) */}
          <div style={{ marginBottom: 12 }}>
            <Chips
              label={t("list.statusAria")}
              items={TABS.map((x) => ({ value: x, label: t(`tabs.${x}`) }))}
              value={tab}
              onChange={(v) => { setTab(v as Tab); setPage(1); }}
            />
          </div>

          {/* Filter ribbon */}
          <Card tinted padding={12} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label htmlFor="tender-value" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>{t("filters.value")}</label>
                <select id="tender-value" value={valuePreset} onChange={(e) => { setValuePreset(Number(e.target.value)); setPage(1); }} style={filterControl}>
                  {VALUE_PRESETS.map((p, i) => <option key={p.key} value={i}>{t(`filters.values.${p.key}`)}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label htmlFor="tender-category" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>{t("filters.category")}</label>
                <select id="tender-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={filterControl}>
                  <option value="">{t("filters.all")}</option>
                  {stats.data?.categoryDistribution.filter((c) => c.category).map((c) => (
                    <option key={c.category!.slug} value={c.category!.slug}>{c.category!.name} ({m.num(c.count)})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={onlyMse} onChange={(e) => setOnlyMse(e.target.checked)} style={{ accentColor: "var(--hue)" }} /> {t("filters.mseOnly")}
                </label>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} style={{ accentColor: "var(--hue)" }} /> {t("filters.flaggedOnly")}
                </label>
              </div>
              <div style={{ flex: "2 1 220px" }}>
                <label htmlFor="tender-search" className="ftp-label" style={{ display: "block", marginBottom: 4 }}>{t("filters.search")}</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} aria-hidden style={{ position: "absolute", left: 10, top: 14, color: "var(--hue)" }} />
                  <input
                    id="tender-search"
                    type="search"
                    placeholder={t("filters.searchPlaceholder")}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ ...filterControl, paddingLeft: 32 }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Secondary nav — guides about tenders */}
          <Toolbar label={t("guides.label")}>
            <ToolbarButton href={`${tendersBase}/apply-guide`} icon={ShieldCheck}>{t("guides.apply")}</ToolbarButton>
            <ToolbarButton href={`${tendersBase}/transparency`} icon={AlertTriangle}>{t("guides.transparency")}</ToolbarButton>
            <ToolbarButton href={`${tendersBase}/how-it-works`} icon={BookOpen}>{t("guides.how")}</ToolbarButton>
          </Toolbar>

          {/* Body */}
          <div style={{ marginTop: 16 }}>
            {listQuery.isLoading && <LoadingShell rows={3} />}
            {listQuery.error && <ErrorBlock message={t("list.error")} />}
            {!listQuery.isLoading && !listQuery.error && tenders.length === 0 && (
              <EmptyState
                emoji="🔍"
                title={t("list.empty")}
                // Honest cadence: no tender cron is scheduled, so we do not promise a refresh interval.
                body={tab === "LIVE" ? t("list.emptyLive") : t("list.emptyOther")}
              />
            )}
            {tenders.length > 0 && (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
                {tenders.map((x) => (
                  <TenderCard key={x.id} tender={x} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {listQuery.data && listQuery.data.total > pageSize && (
            <nav aria-label={t("pages.aria")} style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
              <ToolbarButton icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t("pages.prev")}</ToolbarButton>
              <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                {t.rich("pages.of", {
                  page,
                  total: totalPages,
                  cur: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</span>,
                  all: (c) => <span className="ftp-num">{c}</span>,
                })}
              </span>
              <ToolbarButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("pages.next")} <ChevronRight size={14} aria-hidden />
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
