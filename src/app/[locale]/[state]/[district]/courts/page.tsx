/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Courts — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Are cases in my district's courts being decided, or are
//  they piling up?"
//
//    PageHeader → Explainer (new, decided and waiting cases in one or two
//    sentences) → 4 StatTiles → ONE picture: "for every 10 new cases, N
//    were decided" plus the pile still waiting → court cards; tapping one
//    opens a DetailSheet (new / decided / waiting / average days, year by
//    year, source; "Check a case on eCourts") → "find your own case" steps
//    → charts (where cases wait; new vs decided each year) → sources.
//
//  Honesty:
//    • rows whose source says "estimated" are dropped (old fallback rows,
//      see scripts/purge-estimated-stats.ts);
//    • a High Court serves the whole state, so its figures are shown on
//      its own card and are NOT added into the district's totals.
//  Data: useCourts() (NJDG figures per court per year).
//  Words: src/dictionaries/<locale>/page_courts.json.
"use client";

import type React from "react";
import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { useCourts, type CourtStat } from "@/hooks/useRealtimeData";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  ProgressBar,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  SourcePill,
} from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, HowItWorks, Pictogram, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { RankBars } from "@/components/accountability/AccountabilityVisuals";
import {
  AccountabilityFooter,
  CardChip,
  CardList,
  ChartRow,
  SheetAction,
  SheetHeading,
  SheetNote,
  ShowAllButton,
  TapCard,
} from "@/components/accountability/AccountabilityKit";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

type CourtRow = CourtStat & { source?: string | null };

const NJDG = { label: "NJDG", href: "https://njdg.ecourts.gov.in" };
const ECOURTS = "https://services.ecourts.gov.in/";
const HIGH_COURT_RE = /high court/i;
/** Cards shown before "Show all". */
const FIRST_CARDS = 12;
/** Bars in "where cases are waiting". */
const MAX_BARS = 8;

/** An emoji for a court, from words in its (English) name. */
const COURT_EMOJI: Array<[RegExp, string]> = [
  [/high court/i, "🏛️"],
  [/family/i, "👪"],
  [/pocso|child/i, "🧒"],
  [/consumer/i, "🛒"],
  [/motor|mact|accident/i, "🚗"],
  [/labou?r|industrial/i, "👷"],
  [/commercial/i, "💼"],
  [/small causes/i, "🏠"],
  [/magistrate|jmfc|cjm|criminal/i, "🧑‍⚖️"],
  [/civil|munsif/i, "📜"],
];
const courtEmoji = (name: string) => COURT_EMOJI.find(([re]) => re.test(name))?.[1] ?? "⚖️";

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function CourtsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_courts");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useCourts(district, state);
  const [open, setOpen] = useState<string | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpen(null), []);
  const [showAll, setShowAll] = useState(false);
  const num = (n: number) => f.number(n);

  // Real rows only (see header).
  const stats = ((data?.data ?? []) as CourtRow[]).filter((r) => !/estimated/i.test(r.source ?? ""));
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const year = String(recentYear);
  const latest = stats.filter((s) => s.year === recentYear);
  // District totals leave the High Court out, unless it is all we have.
  const local = latest.filter((c) => !HIGH_COURT_RE.test(c.courtName));
  const counted = local.length > 0 ? local : latest;
  const hasHighCourt = local.length > 0 && local.length < latest.length;

  const filed = counted.reduce((s, c) => s + (c.filed ?? 0), 0);
  const disposed = counted.reduce((s, c) => s + (c.disposed ?? 0), 0);
  const pending = counted.reduce((s, c) => s + (c.pending ?? 0), 0);
  const withDays = counted.filter((c) => c.avgDays != null);
  const avgDays = withDays.length > 0 ? withDays.reduce((s, c) => s + (c.avgDays ?? 0), 0) / withDays.length : null;
  // For every 10 new cases, how many were decided (can be more than 10).
  const perTen = filed > 0 ? (disposed / filed) * 10 : null;
  // Years to clear the pile at this year's pace, if nothing new came in.
  const yearsToClear = disposed > 0 && pending > 0 ? pending / disposed : null;

  // Cards: every court in the newest year, most cases waiting first.
  const cards = [...latest].sort((a, b) => (b.pending ?? 0) - (a.pending ?? 0));
  const shownCards = showAll ? cards : cards.slice(0, FIRST_CARDS);
  const openRows = open ? stats.filter((s) => s.courtName === open).sort((a, b) => b.year - a.year) : [];
  const openLatest = openRows.find((r) => r.year === recentYear) ?? openRows[0] ?? null;

  // Charts.
  const waitingBars = counted
    .filter((c) => (c.pending ?? 0) > 0)
    .sort((a, b) => (b.pending ?? 0) - (a.pending ?? 0))
    .slice(0, MAX_BARS);
  const years = [...new Set(stats.map((s) => s.year))].sort((a, b) => a - b);
  const byYear = years.map((y) => {
    const rows = stats.filter((s) => s.year === y && (local.length === 0 || !HIGH_COURT_RE.test(s.courtName)));
    return {
      year: String(y),
      filed: rows.reduce((s, c) => s + (c.filed ?? 0), 0),
      disposed: rows.reduce((s, c) => s + (c.disposed ?? 0), 0),
    };
  });

  const howSteps = [
    { emoji: "🌐", title: t("find1"), body: t("find1Body") },
    { emoji: "🔢", title: t("find2"), body: t("find2Body") },
    { emoji: "📅", title: t("find3"), body: t("find3Body") },
  ];

  const keepUpTone = (share: number): "live" | "warn" | "danger" => (share >= 1 ? "live" : share >= 0.7 ? "warn" : "danger");

  return (
    <ModulePage>
      <PageHeader
        icon={Scale}
        title={mt.label("courts")}
        description={mt.description("courts")}
        backHref={base}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
        source={NJDG}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState
          emoji="⚖️"
          title={t("emptyTitle", { district: districtName })}
          body={t("emptyBody")}
          action={
            <SheetAction href={ECOURTS} emoji="🌐" external>
              {t("checkCase")}
            </SheetAction>
          }
        />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <Explainer emoji="⚖️">
            {t.rich("explain", { year, district: districtName, filed: num(filed), disposed: num(disposed), pending: num(pending), b: bold })}
            {perTen !== null && <> {t.rich("explainPace", { n: num(Math.round(perTen)), b: bold })}</>}
            {hasHighCourt && <> {t("explainHighCourt")}</>}
          </Explainer>

          <StatStrip>
            <StatTile emoji="📥" label={t("tileFiled")} value={num(filed)} sub={t("yearSub", { year })} />
            <StatTile emoji="✅" label={t("tileDisposed")} value={num(disposed)} sub={t("yearSub", { year })} />
            <StatTile emoji="⏳" label={t("tilePending")} value={num(pending)} sub={t("yearSub", { year })} />
            {avgDays !== null && (
              <StatTile emoji="📅" label={t("tileAvg")} value={num(Math.round(avgDays))} unit={t("daysUnit")} sub={t("yearSub", { year })} />
            )}
          </StatStrip>

          {/* ONE picture: new cases vs decided, and the pile still waiting. */}
          {perTen !== null && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <h2 className="ftp-display" style={{ margin: "0 0 12px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("pictureTitle", { year })}
                </h2>
                <Pictogram
                  filled={Math.min(10, perTen)}
                  emoji="📁"
                  label={perTen >= 10 ? t("pictoAll", { year }) : t("picto", { n: num(Math.round(perTen)), year })}
                />
              </Card>
              <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
                <span className="ftp-emoji" aria-hidden style={{ fontSize: 34 }}>
                  🗄️
                </span>
                <p className="ftp-label">{t("pileLabel")}</p>
                <div className="ftp-bignum" style={{ fontSize: 36, lineHeight: 1.05, color: "var(--hue-deep)" }}>
                  {num(pending)}
                </div>
                {yearsToClear !== null && (
                  <p className="ftp-body" style={{ fontSize: 14, lineHeight: 1.55 }}>
                    {t.rich("pileYears", { years: f.number(yearsToClear, { maximumFractionDigits: 1 }), b: bold })}
                  </p>
                )}
              </Card>
            </div>
          )}

          <AIInsightCard module="courts" district={district} />

          {/* Every court as a card; tap for everything about it. */}
          <Section title={t("courtsTitle", { year })} emoji="🏛️">
            <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)" }}>
              {t("courtsHint")}
            </p>
            <CardList label={t("courtsTitle", { year })}>
              {shownCards.map((c) => {
                const share = (c.filed ?? 0) > 0 ? (c.disposed ?? 0) / (c.filed ?? 1) : null;
                const isHigh = HIGH_COURT_RE.test(c.courtName);
                return (
                  <TapCard
                    key={c.id}
                    emoji={courtEmoji(c.courtName)}
                    title={c.courtName}
                    titleLang="en"
                    sub={t("cardWaiting", { n: c.pending ?? 0, count: num(c.pending ?? 0) })}
                    onOpen={() => setOpen(c.courtName)}
                  >
                    {share !== null && (
                      <CardChip emoji={share >= 1 ? "✅" : "⏳"} tone={keepUpTone(share)}>
                        {t("cardPace", { n: num(Math.round(share * 10)) })}
                      </CardChip>
                    )}
                    {c.avgDays != null && <CardChip emoji="📅">{t("cardDays", { days: num(Math.round(c.avgDays)) })}</CardChip>}
                    {isHigh && hasHighCourt && <CardChip emoji="🏛️">{t("cardHighCourt")}</CardChip>}
                  </TapCard>
                );
              })}
            </CardList>
            {cards.length > FIRST_CARDS && <ShowAllButton expanded={showAll} total={cards.length} onToggle={() => setShowAll((x) => !x)} />}
          </Section>

          {/* Find your own case on eCourts. */}
          <Section title={t("findTitle")} emoji="🔎">
            <Card tinted padding={18}>
              <HowItWorks steps={howSteps} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <SheetAction href={ECOURTS} emoji="🌐" external>
                  {t("checkCase")}
                </SheetAction>
              </div>
            </Card>
          </Section>

          {(waitingBars.length > 1 || byYear.length > 1) && (
            <ChartRow>
              {waitingBars.length > 1 && (
                <ChartCard
                  title={t("waitingTitle", { year })}
                  emoji="⏳"
                  units={t("waitingUnits")}
                  simple={t.rich("waitingSimple", { court: waitingBars[0].courtName, count: num(waitingBars[0].pending ?? 0), b: bold })}
                  source={NJDG}
                  asOfPeriod={year}
                  table={waitingBars.map((c) => ({ label: c.courtName, value: num(c.pending ?? 0) }))}
                >
                  <RankBars
                    ariaLabel={t("waitingAria")}
                    items={waitingBars.map((c) => ({
                      key: c.id,
                      label: c.courtName,
                      value: c.pending ?? 0,
                      display: num(c.pending ?? 0),
                      emoji: courtEmoji(c.courtName),
                    }))}
                  />
                </ChartCard>
              )}
              {byYear.length > 1 && (
                <ChartCard
                  title={t("yearsTitle")}
                  emoji="📊"
                  units={t("yearsUnits")}
                  simple={t.rich("yearsSimple", {
                    year: byYear[byYear.length - 1].year,
                    filed: num(byYear[byYear.length - 1].filed),
                    disposed: num(byYear[byYear.length - 1].disposed),
                    b: bold,
                  })}
                  legend={[
                    { label: t("legendFiled"), swatch: "#D8D5CB" },
                    { label: t("legendDisposed"), swatch: "var(--hue)" },
                  ]}
                  source={NJDG}
                  asOf={lastUpdated}
                  table={byYear.map((r) => ({ label: r.year, value: t("yearsTableValue", { filed: num(r.filed), disposed: num(r.disposed) }) }))}
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={byYear} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={4}>
                      <ChartGradients />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                      <XAxis dataKey="year" tick={CHART_AXIS} />
                      <YAxis tick={CHART_AXIS} tickFormatter={(v) => num(Number(v))} width={56} />
                      <Tooltip formatter={(v, name) => [num(Number(v)), name]} contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} />
                      <Bar dataKey="filed" name={t("legendFiled")} fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="disposed" name={t("legendDisposed")} fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </ChartRow>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <AccountabilityFooter
          moduleSlug="courts"
          locale={locale}
          state={state}
          district={district}
          sourceUrls={{ "NJDG (National Judicial Data Grid)": "https://njdg.ecourts.gov.in" }}
        />
      </div>

      {/* Everything about one court. */}
      <DetailSheet
        open={openLatest !== null}
        onClose={closeSheet}
        title={openLatest?.courtName ?? ""}
        titleLang="en"
        subtitle={openLatest ? t("sheetSub", { year: String(openLatest.year) }) : undefined}
        emoji={openLatest ? courtEmoji(openLatest.courtName) : "⚖️"}
        hueClassName={hueClass("courts")}
        footer={
          <>
            <SheetAction href={ECOURTS} emoji="🌐" external>
              {t("checkCase")}
            </SheetAction>
            <SheetAction href={NJDG.href} emoji="📊" quiet external>
              {t("openNjdg")}
            </SheetAction>
          </>
        }
      >
        {openLatest && (
          <>
            {(openLatest.filed ?? 0) > 0 && (
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.5 }}>
                  {t.rich("sheetPace", {
                    n: num(Math.round(((openLatest.disposed ?? 0) / (openLatest.filed ?? 1)) * 10)),
                    b: bold,
                  })}
                </p>
                <ProgressBar
                  pct={Math.min(100, ((openLatest.disposed ?? 0) / (openLatest.filed ?? 1)) * 100)}
                  tone={keepUpTone((openLatest.disposed ?? 0) / (openLatest.filed ?? 1)) === "danger" ? "danger" : "brand"}
                  height={10}
                />
              </div>
            )}
            <DetailList
              rows={[
                { emoji: "📥", label: t("tileFiled"), value: num(openLatest.filed ?? 0) },
                { emoji: "✅", label: t("tileDisposed"), value: num(openLatest.disposed ?? 0) },
                { emoji: "⏳", label: t("tilePending"), value: num(openLatest.pending ?? 0) },
                {
                  emoji: "📅",
                  label: t("tileAvg"),
                  value: openLatest.avgDays != null ? t("cardDays", { days: num(Math.round(openLatest.avgDays)) }) : null,
                },
              ]}
            />
            {HIGH_COURT_RE.test(openLatest.courtName) && hasHighCourt && <SheetNote emoji="🏛️">{t("sheetHighCourt")}</SheetNote>}
            {openRows.length > 1 && (
              <>
                <SheetHeading emoji="📆">{t("sheetYears")}</SheetHeading>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {openRows.map((r) => (
                    <li key={r.id} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: "20px" }}>
                      <strong className="ftp-num" style={{ color: "var(--hue-deep)", minWidth: 44 }}>
                        {r.year}
                      </strong>
                      <span>{t("yearRow", { filed: num(r.filed ?? 0), disposed: num(r.disposed ?? 0), pending: num(r.pending ?? 0) })}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div>
              <SourcePill label={openLatest.source || NJDG.label} href={NJDG.href} />
            </div>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function CourtsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("courts")}>
      <CourtsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
