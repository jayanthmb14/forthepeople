/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Courts — docs/LAYOUT.md page recipe, v5.1 "Warm Calm"
// ═══════════════════════════════════════════════════════════════════════
//  The question: "How many cases are waiting in my district's courts, how
//  long have they waited, and are the courts keeping up?"
//
//    PageHeader (read date, 3-day stale notice) → Explainer (waiting now,
//    how old, did the pile grow last year) → unusual-jump notes → 4
//    StatTiles → two pictures: the age ribbon (fresh teal → old rose) and
//    a balance (came in vs decided) → charts (new vs decided per year;
//    how long last year's decisions took) → court cards (+ the state's
//    High Court on its own) → "Checked two ways" → find your own case →
//    AI insight → Share / Compare.
//
//  Data: /api/data/court-pendency — the NJDG snapshot written twice a day
//  by /api/cron/scrape-courts (src/lib/courts/*). When the snapshot is
//  missing, this year's CourtStat rows from the same collector. The old
//  hand-seeded CourtStat rows (no source, round numbers) are never shown.
//  Honesty:
//    • every figure is NJDG's own; the page adds units together and works
//      out shares ("4 in 10"), nothing else;
//    • a High Court serves the whole state: its own card, never added;
//    • parts that failed NJDG's cross-checks are not shown (see
//      src/lib/courts/snapshot.ts), and the page says which checks passed.
//  Words: src/dictionaries/<locale>/page_courts.json.
"use client";

import type React from "react";
import { use, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  Car,
  CheckCircle2,
  Gavel,
  Globe,
  Hourglass,
  House,
  Inbox,
  Info,
  Landmark,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ModulePage, PageHeader, StatStrip, StatTile, Section, Card, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import { ChartCard, ChartGradients, Explainer, HowItWorks, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { CalmNote, ListCard } from "@/components/district/calm-parts";
import { OTHER_SHADE } from "@/components/money/visuals";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { CardChip, CardList, ChartRow, SheetAction, SheetHeading, SheetNote } from "@/components/accountability/AccountabilityKit";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { istYear, summarise, type CourtUnitSnapshot } from "@/lib/courts/snapshot";
import { NJDG_DISTRICT_BASE, njdgUnitsFor, njdgUnitUrl } from "@/lib/courts/sources";
import { useCourtPendency } from "./_parts/data";
import { AgeRibbon, AgeRibbonBar, ChecksList, TookBars } from "./_parts/Pictures";
import { BalanceScale, CourthouseMark, CourtsLoading, HourglassMark } from "./_parts/CourtArt";
import styles from "./courts.module.css";

const ECOURTS = "https://services.ecourts.gov.in/";
/** NJDG refreshes daily; older than this and the header says how old. */
const MAX_AGE_DAYS = 3;
/** "Far above the usual": last month's new cases vs last year's monthly average. */
const UNUSUAL_MONTH = 3;
/** "Far more": this year so far vs the whole of last year. */
const UNUSUAL_YEAR = 1.5;
const HIGH_COURT = "__high-court";

/** A small line icon for an NJDG unit, from words in its (English) name. */
const UNIT_ICON: Array<[RegExp, LucideIcon]> = [
  [/high court/i, Landmark],
  [/motor accident|mact/i, Car],
  [/small causes/i, House],
  [/cmm|magistrate|sessions/i, Gavel],
  [/civil/i, ScrollText],
  [/commercial/i, Briefcase],
];
const unitIcon = (name: string): LucideIcon => UNIT_ICON.find(([re]) => re.test(name))?.[1] ?? Scale;

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

function CourtsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_courts");
  const ta = useTranslations("page_accountability");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const { data, isLoading, error } = useCourtPendency(district, state);
  const [open, setOpen] = useState<string | null>(null);
  // Stable, so the sheet's focus handling does not re-run on every render.
  const closeSheet = useCallback(() => setOpen(null), []);
  const num = (n: number) => f.number(n);

  const payload = data?.data;
  const snap = payload?.snapshot ?? null;
  const summary = useMemo(() => (snap ? summarise(snap.units, snap.fetchedAt) : null), [snap]);
  const rows = payload?.rows ?? [];
  const units = snap?.units ?? [];
  const hc = snap?.highCourt ?? null;

  // Where a citizen checks these figures on NJDG.
  const mapped = njdgUnitsFor(district);
  const njdgHref = mapped.length > 0 ? njdgUnitUrl(mapped[0]) : NJDG_DISTRICT_BASE;
  const source = { label: t("sourceName"), href: njdgHref };

  // Fallback (no snapshot): this year's CourtStat rows from the collector.
  const fbYear = rows.length > 0 ? Math.max(...rows.map((r) => r.year)) : null;
  const fbRows = rows.filter((r) => r.year === fbYear);
  const fbRead = fbRows.map((r) => r.readOn).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;

  const asOf = snap?.fetchedAt ?? fbRead ?? undefined;
  const loaded = !isLoading && !error && payload !== undefined;

  // Plain-words figures.
  const pending = summary?.pending.total ?? 0;
  const recentTenths = summary?.age && pending > 0 ? Math.round((summary.age[0] / pending) * 10) : null;
  const lastYear = summary?.lastFullYear ?? null;
  const thisYear = summary?.thisYear ?? null;
  const usualMonth = lastYear ? lastYear.instituted / 12 : null;
  const unusualMonth =
    summary?.lastMonth.instituted != null && usualMonth && usualMonth > 0 && summary.lastMonth.instituted > UNUSUAL_MONTH * usualMonth;
  const unusualYear = thisYear && lastYear && lastYear.instituted > 0 && thisYear.instituted > UNUSUAL_YEAR * lastYear.instituted;
  const yearWord = (y: number) => String(y);
  const nowYear = snap ? istYear(snap.fetchedAt) : null;

  const trend = (summary?.years ?? []).map((y) => ({
    label: y.year === nowYear ? t("yearSoFar", { year: yearWord(y.year) }) : yearWord(y.year),
    filed: y.instituted,
    disposed: y.disposed,
  }));

  const pace = lastYear ? (lastYear.disposed - lastYear.instituted) / Math.max(lastYear.instituted, 1) : 0;
  const paceKey = Math.abs(pace) < 0.02 ? "Even" : pace > 0 ? "Down" : "Up";

  const openUnit = open === HIGH_COURT ? hc : units.find((u) => u.name === open) ?? null;

  const howSteps = [
    { icon: Globe, title: t("find1"), body: t("find1Body") },
    { icon: Search, title: t("find2"), body: t("find2Body") },
    { icon: CalendarClock, title: t("find3"), body: t("find3Body") },
  ];

  const readDate = (iso: string) => f.date(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const readTime = (iso: string) => f.time(iso, { hour: "numeric", minute: "2-digit" });

  return (
    <ModulePage>
      <PageHeader
        icon={Scale}
        title={mt.label("courts")}
        description={mt.description("courts")}
        freshness={asOf ? { asOf, maxAgeDays: MAX_AGE_DAYS } : undefined}
        source={source}
      />

      {isLoading && (
        <>
          <CourtsLoading label={t("loading")} />
          <LoadingShell rows={3} />
        </>
      )}
      {error && <ErrorBlock />}

      {/* Nothing to show: say why, and where to look now. */}
      {loaded && !summary && fbRows.length === 0 && (
        <EmptyState
          icon={Scale}
          title={payload?.covered ? t("notReadTitle", { district: districtName }) : t("notCoveredTitle", { district: districtName })}
          body={payload?.covered ? t("notReadBody") : t("notCoveredBody")}
          action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SheetAction href={njdgHref} external>
                {t("openNjdg")}
              </SheetAction>
              <SheetAction href={ECOURTS} quiet external>
                {t("checkCase")}
              </SheetAction>
            </div>
          }
        />
      )}

      {/* Fallback: only this year's totals (the snapshot will be back after the next check). */}
      {loaded && !summary && fbRows.length > 0 && fbYear !== null && (
        <>
          <CalmNote tone="quiet" icon={Info} style={{ marginBottom: 16 }}>
            {t("fallbackNote")} {fbRead && t("fallbackRead", { date: f.date(fbRead, { day: "numeric", month: "long", year: "numeric" }) })}
          </CalmNote>
          <StatStrip>
            <StatTile icon={Hourglass} label={t("tileWaiting")} value={num(fbRows.reduce((s, r) => s + r.pending, 0))} />
            <StatTile icon={Inbox} label={t("tileNewSoFar", { year: yearWord(fbYear) })} value={num(fbRows.reduce((s, r) => s + r.filed, 0))} />
            <StatTile icon={CheckCircle2} label={t("tileDecidedSoFar", { year: yearWord(fbYear) })} value={num(fbRows.reduce((s, r) => s + r.disposed, 0))} />
          </StatStrip>
        </>
      )}

      {loaded && summary && snap && (
        <>
          <Explainer icon={Scale}>
            {t.rich("explainWaiting", { pending: num(pending), district: districtName, b: bold })}
            {recentTenths !== null && summary.olderThan10 !== null && (
              <> {t.rich("explainAge", { n: num(recentTenths), over10: num(summary.olderThan10), b: bold })}</>
            )}
            {lastYear && (
              <>
                {" "}
                {t.rich(`explainYear${paceKey}`, {
                  year: yearWord(lastYear.year),
                  disposed: num(lastYear.disposed),
                  filed: num(lastYear.instituted),
                  b: bold,
                })}
              </>
            )}
          </Explainer>

          {(unusualMonth || unusualYear || snap.missing.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {unusualMonth && lastYear && usualMonth && (
                <CalmNote tone="warn" icon={AlertTriangle}>
                  {t("unusualMonth", {
                    count: num(summary.lastMonth.instituted ?? 0),
                    usual: num(Math.round(usualMonth)),
                    year: yearWord(lastYear.year),
                  })}
                </CalmNote>
              )}
              {unusualYear && thisYear && lastYear && (
                <CalmNote tone="warn" icon={AlertTriangle}>
                  {t("unusualYear", { count: num(thisYear.instituted), year: yearWord(lastYear.year), last: num(lastYear.instituted) })}
                </CalmNote>
              )}
              {snap.missing.length > 0 && (
                <CalmNote tone="quiet" icon={Info}>
                  {t("missingNote", { courts: snap.missing.join(", ") })}
                </CalmNote>
              )}
            </div>
          )}

          <StatStrip>
            <StatTile
              icon={Hourglass}
              label={t("tileWaiting")}
              value={num(pending)}
              sub={t("tileWaitingSub", { civil: num(summary.pending.civil), criminal: num(summary.pending.criminal) })}
            />
            {summary.olderThan5 !== null && (
              <StatTile
                icon={CalendarClock}
                label={t("tileOld")}
                value={num(summary.olderThan5)}
                sub={t("tileOldSub", { pct: num(Math.round((summary.olderThan5 / Math.max(pending, 1)) * 100)) })}
              />
            )}
            {lastYear && (
              <StatTile
                icon={CheckCircle2}
                label={t("tileDecidedYear", { year: yearWord(lastYear.year) })}
                value={num(lastYear.disposed)}
                sub={t("tileDecidedYearSub", { filed: num(lastYear.instituted) })}
              />
            )}
            {summary.lastMonth.disposed !== null && (
              <StatTile
                icon={Inbox}
                label={t("tileLastMonth")}
                value={num(summary.lastMonth.disposed)}
                sub={summary.lastMonth.instituted !== null ? t("tileLastMonthSub", { filed: num(summary.lastMonth.instituted) }) : undefined}
              />
            )}
          </StatStrip>

          {/* Two pictures: how old the waiting cases are; is the pile growing. */}
          {(summary.age || lastYear) && (
            <div className={summary.age && lastYear ? styles.pair : undefined} style={summary.age && lastYear ? undefined : { marginTop: 16 }}>
              {summary.age && (
                <Card padding={18}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
                    <HourglassMark />
                    <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 700 }}>{t("ageTitle")}</h2>
                  </div>
                  <p className="ftp-body" style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ftp-text-2)" }}>
                    {t("ageLead")}
                  </p>
                  <AgeRibbon bands={summary.age} />
                  {summary.ageLong && (
                    <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: "21px" }}>
                      {summary.ageLong.over20 > 0
                        ? t.rich("ageLong", { over20: num(summary.ageLong.over20), over30: num(summary.ageLong.over30), b: bold })
                        : t("ageLongNone")}
                    </p>
                  )}
                </Card>
              )}
              {lastYear && (
                <Card padding={18} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 700 }}>{t("scaleTitle")}</h2>
                  <BalanceScale
                    filed={lastYear.instituted}
                    disposed={lastYear.disposed}
                    inLabel={t("scaleIn")}
                    outLabel={t("scaleOut")}
                    inValue={num(lastYear.instituted)}
                    outValue={num(lastYear.disposed)}
                    ariaLabel={t("scaleAria", { year: yearWord(lastYear.year), filed: num(lastYear.instituted), disposed: num(lastYear.disposed) })}
                  />
                  <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", fontWeight: 600 }}>
                    {t(`scale${paceKey}`, { year: yearWord(lastYear.year) })}
                  </p>
                  {summary.perTenLastYear !== null && (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "21px" }}>
                      {t.rich("scalePerTen", { n: f.number(summary.perTenLastYear, { maximumFractionDigits: 1 }), b: bold })}
                    </p>
                  )}
                  {summary.yearsToClear !== null && (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>
                      {t.rich("scaleClear", {
                        year: yearWord(lastYear.year),
                        years: f.number(summary.yearsToClear, { maximumFractionDigits: 1 }),
                        b: bold,
                      })}
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}

          {(trend.length > 1 || summary.decided) && (
            <div style={{ marginTop: 16 }}>
              <ChartRow>
                {trend.length > 1 && (
                  <ChartCard
                    title={t("yearsTitle")}
                    units={t("yearsUnits")}
                    simple={
                      lastYear
                        ? t.rich("yearsSimple", { year: yearWord(lastYear.year), disposed: num(lastYear.disposed), filed: num(lastYear.instituted), b: bold })
                        : undefined
                    }
                    legend={[
                      { label: t("legendFiled"), swatch: OTHER_SHADE },
                      { label: t("legendDisposed"), swatch: "var(--hue)" },
                    ]}
                    source={source}
                    asOf={snap.fetchedAt}
                    table={trend.map((r) => ({ label: r.label, value: t("yearsTableValue", { filed: num(r.filed), disposed: num(r.disposed) }) }))}
                  >
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={3}>
                        <ChartGradients />
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                        <XAxis dataKey="label" tick={CHART_AXIS} interval="preserveStartEnd" />
                        <YAxis tick={CHART_AXIS} tickFormatter={(v) => f.number(Number(v), { notation: "compact" })} width={52} />
                        <Tooltip formatter={(v, name) => [num(Number(v)), name]} contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} />
                        <Bar dataKey="filed" name={t("legendFiled")} fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="disposed" name={t("legendDisposed")} fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {summary.decided && (
                  <ChartCard
                    title={t("tookTitle")}
                    units={t("tookUnits", { year: yearWord(summary.decided.year) })}
                    simple={t.rich("tookSimple", {
                      total: num(summary.decided.total),
                      year: yearWord(summary.decided.year),
                      fast: num(summary.decided.took[0]),
                      pct: num(Math.round((summary.decided.took[0] / Math.max(summary.decided.total, 1)) * 100)),
                      b: bold,
                    })}
                    source={source}
                    asOfPeriod={yearWord(summary.decided.year)}
                  >
                    <TookBars took={summary.decided.took} year={summary.decided.year} />
                  </ChartCard>
                )}
              </ChartRow>
            </div>
          )}

          {/* The courts: every NJDG unit of the district, then the High Court. */}
          <Section title={t("courtsTitle")}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "-6px 0 12px" }}>
              <CourthouseMark size={38} />
              <p className="ftp-body" style={{ margin: 0, color: "var(--ftp-text-2)" }}>
                {units.length === 1 ? t("courtsOneHint", { district: districtName }) : t("courtsHint")}
              </p>
            </div>
            <CardList label={t("courtsTitle")}>
              {units.map((u) => (
                <UnitCard key={u.name} unit={u} lastYear={lastYear?.year ?? null} hint={ta("seeDetails")} onOpen={() => setOpen(u.name)} />
              ))}
            </CardList>
            {hc && (
              <div className="ftp-hue-indigo" style={{ marginTop: 18 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, lineHeight: "22px", fontWeight: 700 }}>{t("highCourtTitle")}</h3>
                <p style={{ margin: "0 0 10px", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("highCourtHint")}</p>
                <CardList label={t("highCourtTitle")}>
                  <UnitCard unit={hc} lastYear={null} hint={ta("seeDetails")} onOpen={() => setOpen(HIGH_COURT)} />
                </CardList>
              </div>
            )}
          </Section>

          {/* Checked two ways, with the exact read time. */}
          <Card padding={18} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10 }}>
                <ShieldCheck size={17} />
              </span>
              <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 700 }}>{t("checksTitle")}</h2>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("checksLead")}</p>
            <ChecksList checks={summary.checks} decidedYear={summary.decided?.year ?? lastYear?.year ?? null} />
            <p suppressHydrationWarning style={{ margin: "14px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
              {t("readOn", { date: readDate(snap.fetchedAt), time: readTime(snap.fetchedAt) })}
              {snap.highCourtFetchedAt && Math.abs(Date.parse(snap.highCourtFetchedAt) - Date.parse(snap.fetchedAt)) > 30 * 60_000 && (
                <> {t("readOnHighCourt", { date: readDate(snap.highCourtFetchedAt), time: readTime(snap.highCourtFetchedAt) })}</>
              )}
            </p>
          </Card>
        </>
      )}

      {/* Find your own case on eCourts. */}
      {loaded && (
        <Section title={t("findTitle")}>
          <Card padding={18}>
            <HowItWorks steps={howSteps} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <SheetAction href={ECOURTS} external>
                {t("checkCase")}
              </SheetAction>
            </div>
          </Card>
        </Section>
      )}

      <div style={{ marginTop: 28 }}>
        <AIInsightCard module="courts" district={district} />
      </div>

      <MoneyToolbar shareTitle={mt.label("courts")} compareHref={`/${locale}/compare?module=courts&a=${district}`} />

      {/* Everything about one court. */}
      <DetailSheet
        open={openUnit !== null}
        onClose={closeSheet}
        title={openUnit?.name ?? ""}
        titleLang="en"
        icon={openUnit ? unitIcon(openUnit.name) : Scale}
        subtitle={openUnit ? (openUnit.kind === "high-court" ? t("sheetSubHigh") : t("sheetSubDistrict")) : undefined}
        hueClassName={hueClass("courts")}
        footer={
          openUnit ? (
            <>
              <SheetAction href={openUnit.url} external>
                {t("sheetOpen")}
              </SheetAction>
              <SheetAction href={ECOURTS} quiet external>
                {t("checkCase")}
              </SheetAction>
            </>
          ) : undefined
        }
      >
        {openUnit && <UnitDetails unit={openUnit} nowYear={nowYear} />}
      </DetailSheet>
    </ModulePage>
  );
}

/** One court (NJDG unit) as a card. */
function UnitCard({ unit, lastYear, hint, onOpen }: { unit: CourtUnitSnapshot; lastYear: number | null; hint: string; onOpen: () => void }) {
  const t = useTranslations("page_courts");
  const f = useFormat();
  const flow = lastYear !== null ? unit.years.find((y) => y.year === lastYear) : null;
  const soFar = unit.kind === "high-court" ? unit.years[unit.years.length - 1] ?? null : null;
  const over10 = unit.age ? unit.age[4] : null;
  return (
    <ListCard
      icon={unitIcon(unit.name)}
      title={unit.name}
      titleLang="en"
      sub={t("cardWaiting", { n: unit.pending.total, count: f.number(unit.pending.total) })}
      hint={hint}
      onOpen={onOpen}
    >
      {unit.kind === "high-court" && <CardChip>{t("cardHighCourt")}</CardChip>}
      {over10 !== null && over10 > 0 && <CardChip tone="warn">{t("cardOld", { count: f.number(over10) })}</CardChip>}
      {flow && flow.instituted > 0 && (
        <CardChip tone={flow.disposed >= flow.instituted ? "live" : "warn"}>
          {t("cardPace", { n: f.number((flow.disposed / flow.instituted) * 10, { maximumFractionDigits: 1 }), year: String(flow.year) })}
        </CardChip>
      )}
      {soFar && <CardChip>{t("cardSoFar", { year: String(soFar.year), filed: f.number(soFar.instituted), disposed: f.number(soFar.disposed) })}</CardChip>}
    </ListCard>
  );
}

/** The detail sheet's body for one court. */
function UnitDetails({ unit, nowYear }: { unit: CourtUnitSnapshot; nowYear: number | null }) {
  const t = useTranslations("page_courts");
  const f = useFormat();
  const num = (n: number | null | undefined) => (n === null || n === undefined ? null : f.number(n));
  const thisYear = nowYear !== null ? unit.years.find((y) => y.year === nowYear) : undefined;
  const lastYear = nowYear !== null ? unit.years.find((y) => y.year === nowYear - 1) : undefined;
  const ageLabels = [t("age0"), t("age1"), t("age2"), t("age3"), t("age4")];
  const ariaFor = (bands: number[]) =>
    t("ageAria", { list: bands.map((n, i) => t("ageAriaItem", { label: ageLabels[i], count: f.number(n) })).join(", ") });
  return (
    <>
      <DetailList
        rows={[
          { icon: Hourglass, label: t("sheetWaiting"), value: num(unit.pending.total) },
          { label: t("civil"), value: num(unit.pending.civil) },
          { label: t("criminal"), value: num(unit.pending.criminal) },
          { icon: Inbox, label: t("sheetNewLastMonth"), value: num(unit.lastMonth.instituted?.total) },
          { icon: CheckCircle2, label: t("sheetDecidedLastMonth"), value: num(unit.lastMonth.disposed?.total) },
          ...(lastYear
            ? [
                { label: t("sheetNewYear", { year: String(lastYear.year) }), value: num(lastYear.instituted) },
                { label: t("sheetDecidedYear", { year: String(lastYear.year) }), value: num(lastYear.disposed) },
              ]
            : []),
          ...(thisYear
            ? [
                { label: t("tileNewSoFar", { year: String(thisYear.year) }), value: num(thisYear.instituted) },
                { label: t("tileDecidedSoFar", { year: String(thisYear.year) }), value: num(thisYear.disposed) },
              ]
            : []),
        ]}
      />
      {unit.age && (
        <>
          <SheetHeading>{t("sheetAge")}</SheetHeading>
          <AgeRibbon bands={unit.age} />
        </>
      )}
      {unit.ageSplit && (
        <>
          <SheetHeading>{t("sheetSplit")}</SheetHeading>
          {(["civil", "criminal"] as const).map((k) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: "18px" }}>
                <strong>{t(k)}</strong> · <span style={{ color: "var(--ftp-text-2)" }}>{t(k === "civil" ? "civilHint" : "criminalHint")}</span>
              </p>
              <AgeRibbonBar bands={unit.ageSplit![k]} thin ariaLabel={`${t(k)}: ${ariaFor(unit.ageSplit![k])}`} />
            </div>
          ))}
        </>
      )}
      {unit.kind === "high-court" && <SheetNote>{t("sheetHighCourtNote")}</SheetNote>}
    </>
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
