/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Local Industries — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  One page, four views chosen by district (unchanged from v2):
//    sugar    → sugar factories + crushing seasons + farmer arrears (Mandya …)
//    tech     → IT parks + startup ecosystem (Bengaluru Urban)
//    heritage → heritage / tourism sites + manufacturing (Mysuru)
//    general  → any other district, from the LocalIndustry table
//  Each view fetches its own data (same hooks as before) and reports two
//  things up to the page through `onData`: the newest `updatedAt` (for the
//  FreshnessPill in the header) and the rows for the CSV download.
//  Presentation: PageHeader → emoji StatStrip → the picture (an explainer
//  in plain words, plus a factory pictogram or a ChartCard built from the
//  rows the view already has) → a second picture that tells another part
//  of the story (cane crushed per factory, companies per park, a count row
//  of sites, or the biggest employers) → Sections of Cards / DataTable →
//  SourcesFooter → Toolbar. Colours come from the module hue (--hue…).
//  Words live in "page_industries"; names, descriptions and figures from
//  the database stay as published, and a card shows its own source when
//  the row names one.
"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Cpu, Factory, Landmark, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFactories, useLocalIndustries } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  DataTable,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcesFooter,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat, useModuleText } from "@/i18n/client";
import { IconCountRow, TopBarList } from "@/components/money/visuals";
import { useMoney, useSourceText } from "@/components/money/useMoney";
import MoneyToolbar, { NotOfficialNote, downloadCsv } from "@/components/money/MoneyToolbar";

interface LocalIndustry {
  id: string;
  name: string;
  category?: string | null;
  location?: string | null;
  type?: string | null;
  phone?: string | null;
  source?: string | null;
  details?: Record<string, string | number | null | undefined> | null;
  updatedAt?: string | null;
}

/** One CSV row. */
type CsvRow = Record<string, string | number | null | undefined>;
/** What each view reports to the page: freshness date + CSV rows. */
type ViewData = { asOf: string | null; rows: CsvRow[] };

const CRORE = 10_000_000;

/** The newest `updatedAt` among rows (the API sends it with every row). */
function latestUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
  }
  return best;
}

/** "completed" → "Completed" (status words arrive in lower case). */
function sentenceCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** Cut long names for a chart axis; the tooltip keeps the full name. */
function shortName(s: string, max = 22): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/** "IT Park" → "itpark" (message key for a glossary word). */
const glossKey = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

/** A number from a details field ("800000", 800000), or null. */
function numeric(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/,/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** One emoji per kind of industry, from words in its category / type. */
function industryEmoji(p: { category?: string | null; type?: string | null }): string {
  const c = `${p.category ?? ""} ${p.type ?? ""}`.toLowerCase();
  if (/\bit\b|it park|tech|software|gcc/.test(c)) return "💻";
  if (/pharma|biotech|health/.test(c)) return "🧪";
  if (/financ|bank|exchange/.test(c)) return "🏦";
  if (/market|commercial|retail|trade/.test(c)) return "🛍️";
  if (/handicraft|silk|craft|textile|weav/.test(c)) return "🧵";
  if (/heritage|touris|palace|temple|fort/.test(c)) return "🏛️";
  if (/port|logistic/.test(c)) return "⚓";
  if (/auto|vehicle/.test(c)) return "🚗";
  if (/sugar/.test(c)) return "🍬";
  if (/manufactur|industr|factory|engineering/.test(c)) return "🏭";
  if (/startup/.test(c)) return "🚀";
  return "🏢";
}

// ── Small building blocks shared by the views ─────────────

/** 40 px emoji chip at the top of each card, in the module hue. */
function CardIcon({ emoji }: { emoji: string }) {
  return (
    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, borderRadius: 12, fontSize: 21 }}>
      {emoji}
    </span>
  );
}

/** A label + number pair inside a card ("Area" over "120 acres"). */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="ftp-label">{label}</div>
      <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--hue-deep)" }}>{value}</div>
    </div>
  );
}

/** "Source: telangana.gov.in" under a card, when the row names its source. */
function RowSource({ source }: { source?: string | null }) {
  const t = useTranslations("page_industries");
  if (!source) return null;
  return (
    <div style={{ marginTop: 10, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
      {t("rowSource", { source })}
    </div>
  );
}

/** Responsive card grid that never forces horizontal scroll on a 375 px phone. */
function CardList({ min = 300, children }: { min?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap: 12 }}>
      {children}
    </div>
  );
}

/**
 * A horizontal bar chart in the module hue, inside a ChartCard.
 * Rows are { name (full), label (axis), value }.
 */
function HueBarChart({
  rows,
  valueName,
  format,
}: {
  rows: Array<{ name: string; label: string; value: number }>;
  valueName: string;
  format: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 40 + 40)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, bottom: 8, left: 0 }}>
        <ChartGradients />
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
        <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => format(Number(v))} />
        <YAxis type="category" dataKey="label" tick={CHART_AXIS} width={150} interval={0} />
        <Tooltip
          formatter={(v) => [format(Number(v)), valueName]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "var(--hue-tint)" }}
        />
        <Bar dataKey="value" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={valueName} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Translated glossary word (category, factory type, season status), else the text as published. */
function useGloss() {
  const t = useTranslations("page_industries");
  const f = useFormat();
  return (group: "cat" | "factoryType" | "seasonStatus", raw: string | null | undefined, fallback?: (s: string) => string) => {
    if (!raw) return "";
    const key = `${group}.${glossKey(raw)}`;
    if (f.locale !== "en" && t.has(key)) return t(key);
    return fallback ? fallback(raw) : raw;
  };
}

const b = (c: React.ReactNode) => <strong>{c}</strong>;
const num = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

// ── District-specific metadata ────────────────────────────
type Mode = "sugar" | "tech" | "heritage" | "general";
function getIndustryMeta(district: string): { key: string; icon: LucideIcon; mode: Mode } {
  if (district === "bengaluru-urban") return { key: "tech", icon: Cpu, mode: "tech" };
  if (district === "mysuru") return { key: "heritage", icon: Landmark, mode: "heritage" };
  if (district === "hyderabad") return { key: "hyderabad", icon: Cpu, mode: "general" };
  // Karnataka sugar belt districts (Mandya, etc.)
  const sugarDistricts = ["mandya", "mysuru-rural", "chamarajanagar", "kodagu"];
  if (sugarDistricts.includes(district)) return { key: "sugar", icon: Factory, mode: "sugar" };
  // Default: generic industries view using LocalIndustries data
  return { key: "general", icon: Factory, mode: "general" };
}

// ── Sugar Factories (Mandya) ──────────────────────────────
function SugarView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const fmt = useFormat();
  const gloss = useGloss();
  const { data, isLoading, error } = useFactories(district, state);
  const factories = data?.data ?? [];
  const totalArrears = factories.reduce((s, f) => s + (f.seasonData[0]?.totalArrears ?? 0), 0);
  const totalFarmers = factories.reduce((s, f) => s + (f.seasonData[0]?.farmersCount ?? 0), 0);
  const asOf = latestUpdatedAt(factories as Array<{ updatedAt?: string | null }>);
  const latestSeason = factories.map((f) => f.seasonData[0]?.season).filter(Boolean).sort().pop();
  const source = { label: t("sourceLabel") };

  // The picture: one factory symbol per factory whose latest season has a
  // recorded arrears figure; lit when that figure is above zero.
  const withArrearsFigure = factories.filter((f) => f.seasonData[0]?.totalArrears != null);
  const owing = withArrearsFigure.filter((f) => (f.seasonData[0]?.totalArrears ?? 0) > 0);
  const pictoTotal = withArrearsFigure.length <= 12 ? withArrearsFigure.length : 10;
  const pictoFilled = withArrearsFigure.length <= 12
    ? owing.length
    : withArrearsFigure.length > 0 ? (owing.length / withArrearsFigure.length) * 10 : 0;
  // Chart rows: latest-season arrears per factory, largest first.
  const arrearsChart = owing
    .map((f) => ({ name: f.name, label: shortName(f.name), value: Number(((f.seasonData[0]?.totalArrears ?? 0) / CRORE).toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
  // Second picture: sugarcane crushed in each factory's latest season.
  const crushed = factories
    .map((f) => ({ f, season: f.seasonData[0]?.season, value: f.seasonData[0]?.totalCaneCrushed ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const tonnes = (n: number) => t("units.tonnes", { n: m.num(n) });

  useEffect(() => {
    if (!data) return;
    onData({
      asOf,
      rows: factories.flatMap((f) =>
        f.seasonData.map((s) => ({
          factory: f.name,
          location: f.location,
          season: s.season,
          cane_crushed_mt: s.totalCaneCrushed ?? "",
          recovery_pct: s.recoveryPct ?? "",
          frp_rate: s.frpRate ?? "",
          sap_rate: s.sapRate ?? "",
          arrears_cr: s.totalArrears ? (s.totalArrears / CRORE).toFixed(2) : "",
          farmers: s.farmersCount ?? "",
          status: s.status,
        }))
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={4} />;
  if (error) return <ErrorBlock />;
  if (factories.length === 0) {
    return <EmptyState emoji="🏭" title={t("sugar.empty.title")} body={t("sugar.empty.body")} />;
  }

  return (
    <>
      <StatStrip cols={3}>
        <StatTile emoji="🏭" label={t("sugar.tiles.factories")} value={m.num(factories.length)} asOf={asOf} />
        <StatTile
          emoji="💸"
          label={t("sugar.tiles.arrears")}
          value={totalArrears > 0 ? m.num(totalArrears / CRORE, 2) : "—"}
          unit={totalArrears > 0 ? t("units.crore") : undefined}
          sub={latestSeason ? t("sugar.tiles.arrearsSubSeason", { season: latestSeason }) : t("sugar.tiles.arrearsSub")}
          asOf={asOf}
        />
        <StatTile
          emoji="🌾"
          label={t("sugar.tiles.farmers")}
          value={totalFarmers ? m.num(totalFarmers) : "—"}
          sub={latestSeason ? t("season", { season: latestSeason }) : undefined}
          asOf={asOf}
        />
      </StatStrip>

      {/* The picture: who still owes farmers money. Needs at least two
          factories with a recorded arrears figure. */}
      {withArrearsFigure.length >= 2 && (
        <div style={{ marginTop: 16 }}>
          <Card tinted padding={18}>
            <Explainer>
              {totalArrears > 0
                ? t.rich("sugar.explainer", {
                    amount: m.crore(totalArrears / CRORE, 2),
                    owing: owing.length,
                    total: withArrearsFigure.length,
                    num,
                  })
                : t.rich("sugar.explainerNone", { total: withArrearsFigure.length, num })}
            </Explainer>
            <Pictogram
              total={pictoTotal}
              filled={pictoFilled}
              emoji="🏭"
              label={
                withArrearsFigure.length <= 12
                  ? t("sugar.pictogramCount", { owing: owing.length, total: withArrearsFigure.length })
                  : t("sugar.pictogramShare", { n: Math.round(pictoFilled) })
              }
            />
          </Card>
        </div>
      )}

      {arrearsChart.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("sugar.arrearsChart.title")}
            emoji="💸"
            units={t("sugar.arrearsChart.units")}
            simple={t.rich("sugar.arrearsChart.simple", { name: arrearsChart[0].name, amount: m.crore(arrearsChart[0].value, 2), b })}
            legend={[{ label: t("sugar.arrearsChart.legend"), swatch: "var(--hue)" }]}
            source={source}
            asOf={asOf}
            table={arrearsChart.map((r) => ({ label: r.name, value: m.crore(r.value, 2) }))}
          >
            <HueBarChart rows={arrearsChart} valueName={t("sugar.arrearsChart.legend")} format={(v) => m.crore(v)} />
          </ChartCard>
        </div>
      )}

      {/* Second picture: how much sugarcane each factory crushed in its
          latest season — the work side of the story, not the money owed. */}
      {crushed.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("sugar.crushed.title")}
            emoji="🚜"
            units={t("sugar.crushed.units")}
            simple={t.rich("sugar.crushed.simple", { name: crushed[0].f.name, amount: tonnes(crushed[0].value), b })}
            source={source}
            asOf={asOf}
            table={crushed.slice(0, 5).map((r) => ({ label: r.f.name, value: tonnes(r.value) }))}
          >
            <TopBarList
              rows={crushed.map((r) => ({
                key: r.f.id,
                label: r.f.name,
                sub: r.season ? t("season", { season: r.season }) : undefined,
                emoji: "🍬",
                value: r.value,
                display: tonnes(r.value),
              }))}
            />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏭" title={t("sugar.listTitle", { n: factories.length })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {factories.map((f) => {
            const latest = f.seasonData[0];
            return (
              <Card key={f.id} as="article">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CardIcon emoji="🏭" />
                      <div style={{ minWidth: 0 }}>
                        <h3 className="ftp-title">{f.name}</h3>
                        {f.nameLocal && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)" }}>{f.nameLocal}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
                        {f.location}{f.taluk && `, ${f.taluk}`}
                      </span>
                      <span>{gloss("factoryType", f.type)}</span>
                      {f.capacity && <span>{t.rich("sugar.capacity", { n: m.num(f.capacity), num: (c) => <span className="ftp-num">{c}</span> })}</span>}
                    </div>
                    {f.phone && (
                      <a href={`tel:${f.phone}`} className="ftp-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}>
                        <Phone size={14} aria-hidden /> <span className="ftp-num">{f.phone}</span>
                      </a>
                    )}
                  </div>
                  {latest && (
                    <div style={{ textAlign: "right" }}>
                      <div className="ftp-label">{t("season", { season: latest.season })}</div>
                      {latest.totalArrears != null && latest.totalArrears > 0 && (
                        <div className="ftp-num" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-danger)" }}>
                          {t("sugar.arrearsAmount", { amount: m.crore(latest.totalArrears / CRORE, 2) })}
                        </div>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Pill tone={latest.status.toLowerCase() === "completed" ? "live" : "warn"} dot>
                          {gloss("seasonStatus", latest.status, sentenceCase)}
                        </Pill>
                      </div>
                    </div>
                  )}
                </div>
                {f.seasonData.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="ftp-label" style={{ marginBottom: 8 }}>{t("sugar.table.title")}</div>
                    <DataTable
                      dense
                      caption={t("sugar.table.caption", { name: f.name })}
                      columns={[
                        { key: "season", label: t("sugar.table.season") },
                        { key: "cane", label: t("sugar.table.cane"), numeric: true },
                        { key: "rec", label: t("sugar.table.recovery"), numeric: true },
                        { key: "frp", label: t("sugar.table.frp"), numeric: true },
                        { key: "sap", label: t("sugar.table.sap"), numeric: true },
                        { key: "arrears", label: t("sugar.table.arrears"), numeric: true },
                        { key: "farmers", label: t("sugar.table.farmers"), numeric: true },
                      ]}
                      rows={f.seasonData.map((s) => ({
                        season: s.season,
                        cane: s.totalCaneCrushed ? m.num(s.totalCaneCrushed) : "—",
                        rec: s.recoveryPct ? `${fmt.number(s.recoveryPct, { maximumFractionDigits: 2 })}%` : "—",
                        frp: s.frpRate ? m.rupees(s.frpRate) : "—",
                        sap: s.sapRate ? m.rupees(s.sapRate) : "—",
                        // Unpaid arrears are the one number we colour: danger text.
                        arrears: (
                          <span style={{ color: (s.totalArrears ?? 0) > 0 ? "var(--ftp-danger)" : "var(--ftp-text)" }}>
                            {s.totalArrears ? m.crore(s.totalArrears / CRORE, 2) : "—"}
                          </span>
                        ),
                        farmers: s.farmersCount ? m.num(s.farmersCount) : "—",
                      }))}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}

// ── IT Parks (Bengaluru Urban) ────────────────────────────
function TechView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const itParks = industries.filter((i) => i.category === "IT Park");
  const startupStats = industries.find((i) => i.category === "Startup Ecosystem");
  const asOf = latestUpdatedAt(industries);
  const source = { label: t("sourceLabel") };

  // Chart rows: people working in each park that reports a number.
  const workforceChart = itParks
    .map((p) => ({ name: p.name, label: shortName(p.name), value: Number(p.details?.employees) }))
    .filter((r) => Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.value - a.value);
  const workforceTotal = workforceChart.reduce((s, r) => s + r.value, 0);
  // Second picture: how many companies each park hosts (parks that report it).
  const companies = itParks
    .map((p) => ({ p, value: numeric(p.details?.companies) }))
    .filter((r): r is { p: LocalIndustry; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value);

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: itParks.map((p) => ({
        name: p.name,
        location: p.location ?? "",
        area_acres: p.details?.area ?? "",
        companies: p.details?.companies ?? "",
        employees: p.details?.employees ?? "",
        built_up_msf: p.details?.builtUpArea ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Startup ecosystem figures (published estimates, NASSCOM / Inc42 2025) */}
      {startupStats && (
        <Section emoji="🚀" title={t("tech.startupTitle")}>
          <StatStrip cols={4}>
            <StatTile emoji="🚀" label={t("tech.startups")} value="13,000+" sub={t("tech.startupSource")} />
            <StatTile emoji="🦄" label={t("tech.unicorns")} value="50+" sub={t("tech.startupSource")} />
            <StatTile emoji="💵" label={t("tech.funding")} value="$45B+" sub={t("tech.startupSource")} />
            <StatTile emoji="💻" label={t("tech.workforce")} value="1.5M+" sub={t("tech.startupSource")} />
          </StatStrip>
        </Section>
      )}

      {/* The picture: how many people work in the listed IT parks, and in
          which ones. Only parks that report an employee count are counted. */}
      {workforceChart.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <Explainer>
            {t.rich("tech.explainer", { parks: workforceChart.length, people: m.num(workforceTotal), name: workforceChart[0].name, num, b })}
          </Explainer>
          <ChartCard
            title={t("tech.workforceChart.title")}
            emoji="👥"
            units={t("tech.workforceChart.units")}
            simple={t.rich("tech.workforceChart.simple", { name: workforceChart[0].name, n: m.num(workforceChart[0].value), b })}
            legend={[{ label: t("tech.workforceChart.legend"), swatch: "var(--hue)" }]}
            source={source}
            asOf={asOf}
            table={workforceChart.map((r) => ({ label: r.name, value: m.num(r.value) }))}
          >
            <HueBarChart rows={workforceChart} valueName={t("tech.workforceChart.legend")} format={(v) => m.num(v)} />
          </ChartCard>
        </div>
      )}

      {companies.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("tech.companies.title")}
            emoji="🏢"
            units={t("tech.companies.units")}
            simple={t.rich("tech.companies.simple", { name: companies[0].p.name, n: m.num(companies[0].value), b })}
            source={source}
            asOf={asOf}
            table={companies.slice(0, 5).map((r) => ({ label: r.p.name, value: t("tech.companies.value", { n: m.num(r.value) }) }))}
          >
            <TopBarList
              rows={companies.map((r) => ({
                key: r.p.id,
                label: r.p.name,
                sub: r.p.location ?? undefined,
                emoji: "💻",
                value: r.value,
                display: t("tech.companies.value", { n: m.num(r.value) }),
              }))}
            />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏢" title={t("tech.listTitle", { n: itParks.length })}>
        {itParks.length === 0 ? (
          <EmptyState emoji="🏢" title={t("tech.empty")} />
        ) : (
          <CardList min={320}>
            {itParks.map((p) => {
              const d = p.details ?? {};
              const employees = numeric(d.employees);
              return (
                <Card key={p.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CardIcon emoji="💻" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="ftp-title">{p.name}</h3>
                      {p.location && (
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />{p.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                    {d.area && <Fact label={t("facts.area")} value={t("facts.acres", { n: String(d.area) })} />}
                    {d.companies && <Fact label={t("facts.companies")} value={`${d.companies}+`} />}
                    {employees !== null && <Fact label={t("facts.employees")} value={t("facts.thousandPlus", { n: m.num(Math.round(employees / 1000)) })} />}
                    {d.builtUpArea && <Fact label={t("facts.builtUp")} value={t("facts.msf", { n: String(d.builtUpArea) })} />}
                  </div>
                  {d.keyTenants && (
                    <div className="ftp-body" style={{ marginTop: 10, color: "var(--ftp-text-2)" }}>
                      <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{t("facts.keyTenants")} </span>{d.keyTenants}
                    </div>
                  )}
                  <RowSource source={p.source} />
                </Card>
              );
            })}
          </CardList>
        )}
      </Section>
    </>
  );
}

// ── Heritage & Tourism (Mysuru) ───────────────────────────
function HeritageView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const gloss = useGloss();
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const heritage = industries.filter((i) => i.category === "Heritage" || i.category === "Tourism");
  const manufacturing = industries.filter((i) => i.category === "Manufacturing");
  const heritageOnly = heritage.filter((i) => i.category === "Heritage").length;
  const tourismOnly = heritage.length - heritageOnly;

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: [...heritage, ...manufacturing].map((p) => ({
        name: p.name,
        category: p.category ?? "",
        type: p.type ?? "",
        visitors_per_year: p.details?.visitorsPerYear ?? "",
        revenue: p.details?.revenue ?? "",
        employees: p.details?.employees ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;

  return (
    <>
      {/* Dasara figures — published estimates */}
      <Section emoji="🐘" title={t("heritage.dasaraTitle")}>
        <StatStrip cols={4}>
          <StatTile emoji="👥" label={t("heritage.footfall")} value="5M+" />
          <StatTile emoji="💰" label={t("heritage.budget")} value="₹50Cr" />
          <StatTile emoji="🏰" label={t("heritage.palaceVisitors")} value="6M+" />
          <StatTile emoji="🧹" label={t("heritage.cleanest")} value="#1" />
        </StatStrip>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
          {t("heritage.figuresNote")}
        </p>
      </Section>

      {/* The picture: what this page lists, counted from the rows — in words
          and as a row of three counts. */}
      {heritage.length + manufacturing.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Explainer>
            {t.rich("heritage.explainer", { sites: heritage.length, factories: manufacturing.length, num })}
          </Explainer>
          <IconCountRow
            label={t("heritage.countsAria")}
            items={[
              { key: "heritage", emoji: "🏛️", count: m.num(heritageOnly), label: t("heritage.countHeritage") },
              { key: "tourism", emoji: "🧳", count: m.num(tourismOnly), label: t("heritage.countTourism") },
              { key: "factories", emoji: "🏭", count: m.num(manufacturing.length), label: t("heritage.countFactories") },
            ].filter((it) => it.count !== "0")}
          />
        </div>
      )}

      {/* Heritage & Tourism Sites */}
      <Section emoji="🏛️" title={t("heritage.sitesTitle", { n: heritage.length })}>
        {heritage.length === 0 ? (
          <EmptyState emoji="🏛️" title={t("heritage.empty")} />
        ) : (
          <CardList>
            {heritage.map((p) => {
              const d = p.details ?? {};
              return (
                <Card key={p.id} as="article">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CardIcon emoji={p.category === "Tourism" ? "🧳" : "🏛️"} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="ftp-title">{p.name}</h3>
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>{gloss("cat", p.type)}</div>
                    </div>
                  </div>
                  {(d.visitorsPerYear || d.revenue || d.entryfee) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      {d.visitorsPerYear && <Fact label={t("facts.visitors")} value={d.visitorsPerYear} />}
                      {d.revenue && <Fact label={t("facts.revenue")} value={d.revenue} />}
                    </div>
                  )}
                  {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 10 }}>{d.description}</div>}
                  <RowSource source={p.source} />
                </Card>
              );
            })}
          </CardList>
        )}
      </Section>

      {/* Manufacturing */}
      {manufacturing.length > 0 && (
        <Section emoji="🏭" title={t("heritage.factoriesTitle")}>
          <CardList>
            {manufacturing.map((p) => {
              const d = p.details ?? {};
              return (
                <Card key={p.id} as="article">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <CardIcon emoji={industryEmoji(p)} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="ftp-title">{p.name}</h3>
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{gloss("cat", p.type)}</div>
                    </div>
                  </div>
                  {d.established && (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
                      {t.rich("facts.established", { year: String(d.established), num: (c) => <span className="ftp-num">{c}</span> })}
                    </div>
                  )}
                  {d.employees && (
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
                      {t.rich("facts.employeesLine", { n: String(d.employees), num: (c) => <span className="ftp-num">{c}</span> })}
                    </div>
                  )}
                  {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>{d.description}</div>}
                  <RowSource source={p.source} />
                </Card>
              );
            })}
          </CardList>
        </Section>
      )}
    </>
  );
}

// ── General Industries View (Hyderabad, etc.) ───────────
function GeneralView({ district, state, onData }: { district: string; state: string; onData: (d: ViewData) => void }) {
  const t = useTranslations("page_industries");
  const m = useMoney();
  const gloss = useGloss();
  const { data, isLoading, error } = useLocalIndustries(district, state);
  const industries = (data?.data ?? []) as LocalIndustry[];
  const asOf = latestUpdatedAt(industries);
  const source = { label: t("sourceLabel") };

  // Chart rows: how many listed industries fall in each category.
  const byCategory = new Map<string, number>();
  for (const p of industries) {
    const c = p.category?.trim() || "Other";
    byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
  }
  const categoryChart = [...byCategory.entries()]
    .map(([raw, value]) => {
      const name = gloss("cat", raw);
      return { name, label: shortName(name), value };
    })
    .sort((a, b) => b.value - a.value);
  // Second picture: the biggest employers (rows that report a number).
  const jobsOf = (p: LocalIndustry) => numeric(p.details?.employees) ?? numeric(p.details?.employmentEstimate);
  const employers = industries
    .map((p) => ({ p, value: jobsOf(p) }))
    .filter((r): r is { p: LocalIndustry; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value);

  useEffect(() => {
    if (!data) return;
    onData({
      asOf: latestUpdatedAt(industries),
      rows: industries.map((p) => ({
        name: p.name,
        category: p.category ?? "",
        type: p.type ?? "",
        location: p.location ?? "",
        employees: p.details?.employees ?? p.details?.employmentEstimate ?? "",
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <LoadingShell rows={5} />;
  if (error) return <ErrorBlock />;
  if (industries.length === 0) return <EmptyState emoji="🏭" title={t("general.empty")} />;

  return (
    <>
      {/* The picture: what kinds of industry this district has, counted
          from the listed rows. Only when there is more than one kind. */}
      {categoryChart.length >= 2 && (
        <div style={{ marginBottom: 8 }}>
          <Explainer>
            {t.rich("general.explainer", { total: industries.length, name: categoryChart[0].name, n: categoryChart[0].value, num, b })}
          </Explainer>
          <ChartCard
            title={t("general.chart.title")}
            emoji="📊"
            units={t("general.chart.units")}
            simple={t.rich("general.chart.simple", { n: categoryChart[0].value, total: industries.length, name: categoryChart[0].name, b })}
            legend={[{ label: t("general.chart.legend"), swatch: "var(--hue)" }]}
            source={source}
            asOf={asOf}
            table={categoryChart.map((r) => ({ label: r.name, value: m.num(r.value) }))}
          >
            <HueBarChart rows={categoryChart} valueName={t("general.chart.legend")} format={(v) => m.num(v)} />
          </ChartCard>
        </div>
      )}

      {/* Second picture: who gives the most jobs. */}
      {employers.length >= 2 && (
        <div style={{ marginTop: 24 }}>
          <ChartCard
            title={t("general.jobs.title")}
            emoji="👷"
            units={t("general.jobs.units")}
            simple={t.rich("general.jobs.simple", { name: employers[0].p.name, n: m.num(employers[0].value), b })}
            source={source}
            asOf={asOf}
            table={employers.slice(0, 5).map((r) => ({ label: r.p.name, value: m.num(r.value) }))}
          >
            <TopBarList
              rows={employers.map((r) => ({
                key: r.p.id,
                label: r.p.name,
                sub: gloss("cat", r.p.category) || undefined,
                emoji: industryEmoji(r.p),
                value: r.value,
                display: m.num(r.value),
              }))}
            />
          </ChartCard>
        </div>
      )}

      <Section emoji="🏢" title={t("general.listTitle", { n: industries.length })}>
        <CardList min={320}>
          {industries.map((p) => {
            const d = p.details ?? {};
            const employees = numeric(d.employees);
            const estimate = employees === null ? numeric(d.employmentEstimate) : null;
            return (
              <Card key={p.id} as="article">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CardIcon emoji={industryEmoji(p)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="ftp-title">{p.name}</h3>
                    {p.type && <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2 }}>{gloss("cat", p.type)}</div>}
                    {p.location && (
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />{p.location}
                      </div>
                    )}
                  </div>
                </div>
                {(employees !== null || estimate !== null) && (
                  <div style={{ marginTop: 12 }}>
                    <Fact
                      label={employees !== null ? t("facts.employees") : t("facts.jobsEstimate")}
                      value={(() => {
                        const n = (employees ?? estimate) as number;
                        return n >= 1000 ? t("facts.thousandPlus", { n: m.num(Math.round(n / 1000)) }) : m.num(n);
                      })()}
                    />
                  </div>
                )}
                {d.description && <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 10 }}>{d.description}</div>}
                <RowSource source={p.source} />
              </Card>
            );
          })}
        </CardList>
      </Section>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function IndustriesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_industries");
  const mt = useModuleText();
  const st = useSourceText();
  const base = `/${locale}/${state}/${district}`;
  const meta = getIndustryMeta(district);
  const Icon = meta.icon;
  const title = t(`meta.${meta.key}.title`);
  const src = getModuleSources("industries", state);
  // Filled in by whichever view is showing (see ViewData above).
  const [view, setView] = useState<ViewData>({ asOf: null, rows: [] });

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Icon}
        accent={getModuleAccent("industries")}
        title={meta.key === "sugar" || meta.key === "general" ? mt.label("industries") : title}
        description={t(`meta.${meta.key}.description`)}
        backHref={base}
        freshness={view.asOf ? { asOf: view.asOf } : undefined}
        source={{ label: t("sourceLabel") }}
      />
      <AIInsightCard module="industries" district={district} />
      {meta.mode === "sugar" && <SugarView district={district} state={state} onData={setView} />}
      {meta.mode === "tech" && <TechView district={district} state={state} onData={setView} />}
      {meta.mode === "heritage" && <HeritageView district={district} state={state} onData={setView} />}
      {meta.mode === "general" && <GeneralView district={district} state={state} onData={setView} />}

      <SourcesFooter sources={src.sources.map((name) => ({ name: st.name(name), frequency: st.freq(src.frequency) }))} />
      <NotOfficialNote />

      <MoneyToolbar
        shareTitle={title}
        onCsv={() => downloadCsv(`${district}-industries.csv`, view.rows)}
        csvDisabled={view.rows.length === 0}
        compareHref={`/${locale}/compare?module=industries&a=${district}`}
      />
    </div>
  );
}
