/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  RTI replies tracker — docs/LAYOUT.md page recipe
// ═══════════════════════════════════════════════════════════════════════
//  The question: "Do government offices in my district answer RTI letters,
//  and do they answer on time?"
//
//    PageHeader → Explainer (sent, answered, waiting; how many offices were
//    slower than the 30-day limit) → 4 StatTiles → ONE picture: 10 letters
//    lit for the ones still waiting, beside the average reply time racing
//    the 30-day limit → "Ask the government" link → office cards; tapping
//    one opens a DetailSheet (sent / answered / waiting / reply days, month
//    by month, source; "Ask this office") → charts (reply time against the
//    limit; where letters wait) → sources.
//
//  Data: useRTI(). Rows are stored per department per MONTH, so each
//  department's months are added together (sent and answered are summed;
//  "waiting" is a running count, so the newest month's figure is used) and
//  the months covered are named instead of claiming a whole year. Rows
//  whose source says "estimated" (old fallback rows) are dropped.
//  Words: src/dictionaries/<locale>/page_rti.json.
"use client";

import type React from "react";
import { use, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import { useRTI, type RtiStat } from "@/hooks/useRealtimeData";
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
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { RankBars, officeEmoji } from "@/components/accountability/AccountabilityVisuals";
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

/** Section 7(1) of the RTI Act, 2005: a reply is due within 30 days. */
const LEGAL_REPLY_DAYS = 30;
/** Bars in each chart. */
const MAX_BARS = 6;
/** Cards shown before "Show all". */
const FIRST_CARDS = 12;

/** The row as the API sends it: the month, the source, and a possibly missing average. */
type RtiRow = Omit<RtiStat, "avgDays"> & { month?: number | null; avgDays: number | null; source?: string | null };

/** One department's figures for the newest year on file. */
interface DeptTotals {
  dept: string;
  filed: number;
  disposed: number;
  pending: number;
  avgDays: number | null;
}

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Average days, weighted by the number of answered letters when we can. */
function weightedDays(rows: Array<{ avgDays: number | null; disposed: number }>): number | null {
  const withDays = rows.filter((r) => r.avgDays != null);
  if (withDays.length === 0) return null;
  const weight = withDays.reduce((s, r) => s + Math.max(0, r.disposed), 0);
  return weight > 0
    ? withDays.reduce((s, r) => s + (r.avgDays ?? 0) * Math.max(0, r.disposed), 0) / weight
    : withDays.reduce((s, r) => s + (r.avgDays ?? 0), 0) / withDays.length;
}

/** Adds one department's month rows together (see the header comment). */
function totalsByDepartment(rows: RtiRow[]): DeptTotals[] {
  const byDept = new Map<string, RtiRow[]>();
  for (const r of rows) byDept.set(r.department, [...(byDept.get(r.department) ?? []), r]);
  return [...byDept.entries()].map(([dept, list]) => {
    const newest = [...list].sort((a, b) => (b.month ?? 0) - (a.month ?? 0))[0];
    return {
      dept,
      filed: list.reduce((s, r) => s + r.filed, 0),
      disposed: list.reduce((s, r) => s + r.disposed, 0),
      pending: newest.pending,
      avgDays: weightedDays(list),
    };
  });
}

function RTIPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_rti");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useRTI(district, state);
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const num = (n: number) => f.number(n);
  const days = (n: number) => f.number(n, { maximumFractionDigits: 0 });
  const monthName = (year: number, month: number, style: "long" | "short" = "long") =>
    f.date(Date.UTC(year, month - 1, 15), { month: style, timeZone: "UTC" });

  const stats = ((data?.data?.stats ?? []) as RtiRow[]).filter((r) => !/estimated/i.test(r.source ?? ""));
  const lastUpdated = data?.meta?.lastUpdated ?? null;
  const recentYear = stats.length > 0 ? Math.max(...stats.map((s) => s.year)) : 0;
  const latestRows = stats.filter((s) => s.year === recentYear);
  const depts = totalsByDepartment(latestRows);

  // The months the newest year covers: "2024", "January 2024" or "January to March 2024".
  const months = [...new Set(latestRows.map((r) => r.month).filter((m): m is number => typeof m === "number" && m >= 1 && m <= 12))].sort(
    (a, b) => a - b,
  );
  const period =
    months.length === 0 || months.length === 12
      ? String(recentYear)
      : months.length === 1
        ? t("oneMonth", { month: monthName(recentYear, months[0]), year: String(recentYear) })
        : t("monthRange", { from: monthName(recentYear, months[0]), to: monthName(recentYear, months[months.length - 1]), year: String(recentYear) });

  const filed = depts.reduce((s, r) => s + r.filed, 0);
  const disposed = depts.reduce((s, r) => s + r.disposed, 0);
  const pending = depts.reduce((s, r) => s + r.pending, 0);
  const waitingShare = filed + pending > 0 ? pending / (filed + pending) : null;
  const overallDays = weightedDays(depts);
  const withDays = depts.filter((d): d is DeptTotals & { avgDays: number } => d.avgDays != null && d.avgDays > 0);
  const overLimit = withDays.filter((d) => d.avgDays > LEGAL_REPLY_DAYS).length;

  const cards = [...depts].sort((a, b) => b.pending - a.pending || b.filed - a.filed);
  const shownCards = showAll ? cards : cards.slice(0, FIRST_CARDS);
  const slowest = [...withDays].sort((a, b) => b.avgDays - a.avgDays).slice(0, MAX_BARS);
  const waitingBars = depts.filter((d) => d.pending > 0).sort((a, b) => b.pending - a.pending).slice(0, MAX_BARS);

  const openDept = open ? depts.find((d) => d.dept === open) ?? null : null;
  const openMonths = open
    ? stats.filter((r) => r.department === open).sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0))
    : [];
  const openSource = openMonths.find((r) => r.source)?.source ?? null;

  const askLink = (
    <Link
      href={`${base}/file-rti`}
      className="ftp-btn-primary"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: "1px solid var(--hue)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      <span className="ftp-emoji" aria-hidden>
        📜
      </span>
      {t("fileRti")}
    </Link>
  );

  return (
    <ModulePage>
      <PageHeader
        icon={ClipboardList}
        title={mt.label("rti")}
        description={mt.description("rti")}
        backHref={base}
        freshness={lastUpdated ? { asOf: lastUpdated } : undefined}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && stats.length === 0 && (
        <EmptyState emoji="🏛️" title={t("emptyTitle", { district: districtName })} body={t("emptyBody")} action={askLink} />
      )}

      {!isLoading && stats.length > 0 && (
        <>
          <Explainer emoji="📨">
            {t.rich("explain", { period, district: districtName, filed: num(filed), disposed: num(disposed), pending: num(pending), b: bold })}
            {withDays.length > 0 && (
              <>
                {" "}
                {overLimit > 0
                  ? t.rich("explainSlow", { over: overLimit, n: withDays.length, b: bold })
                  : t("explainOnTime", { n: withDays.length })}
              </>
            )}
          </Explainer>

          <StatStrip>
            <StatTile emoji="📨" label={t("tileFiled")} value={num(filed)} sub={period} />
            <StatTile emoji="✅" label={t("tileDisposed")} value={num(disposed)} sub={period} />
            <StatTile emoji="⏳" label={t("tilePending")} value={num(pending)} sub={period} />
            {overallDays !== null && (
              <StatTile emoji="⏱️" label={t("tileDays")} value={days(overallDays)} unit={t("daysUnit")} sub={t("tileDaysSub")} />
            )}
          </StatStrip>

          {/* ONE picture: letters still waiting, and the reply time racing the 30-day limit. */}
          {waitingShare !== null && (
            <div className={overallDays !== null ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <h2 className="ftp-display" style={{ margin: "0 0 12px", fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("pictureTitle")}
                </h2>
                <Pictogram filled={waitingShare * 10} emoji="✉️" label={t("picto", { n: num(Math.round(waitingShare * 10)), period })} />
              </Card>
              {overallDays !== null && (
                <Card padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                  <span className="ftp-emoji" aria-hidden style={{ fontSize: 34 }}>
                    {overallDays > LEGAL_REPLY_DAYS ? "🐢" : "🐇"}
                  </span>
                  <p className="ftp-label">{t("raceLabel")}</p>
                  <div
                    className="ftp-bignum"
                    style={{ fontSize: 36, lineHeight: 1.05, color: overallDays > LEGAL_REPLY_DAYS ? "var(--ftp-danger)" : "var(--hue-deep)" }}
                  >
                    {t("daysValue", { days: days(overallDays) })}
                  </div>
                  <ProgressBar pct={(overallDays / LEGAL_REPLY_DAYS) * 100} tone={overallDays > LEGAL_REPLY_DAYS ? "danger" : "brand"} height={10} />
                  <p className="ftp-body" style={{ fontSize: 14, lineHeight: 1.5 }}>
                    {overallDays > LEGAL_REPLY_DAYS ? t("raceSlow") : t("raceOk")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* The pair: ask a question yourself. */}
          <Card tinted style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>{t("ctaBody")}</p>
            {askLink}
          </Card>

          <AIInsightCard module="rti" district={district} />

          {/* Every office as a card; tap for everything about it. */}
          <Section title={t("officesTitle", { period })} emoji="🏢">
            <p className="ftp-body" style={{ margin: "-6px 0 12px", color: "var(--ftp-text-2)" }}>
              {t("officesHint")}
            </p>
            <CardList label={t("officesTitle", { period })}>
              {shownCards.map((d) => (
                <TapCard
                  key={d.dept}
                  emoji={officeEmoji(d.dept)}
                  title={d.dept}
                  titleLang="en"
                  sub={t("cardWaiting", { n: d.pending, count: num(d.pending) })}
                  onOpen={() => setOpen(d.dept)}
                >
                  <CardChip emoji="✅">{t("cardAnswered", { answered: num(d.disposed), sent: num(d.filed) })}</CardChip>
                  {d.avgDays != null && (
                    <CardChip emoji={d.avgDays > LEGAL_REPLY_DAYS ? "🐢" : "⏱️"} tone={d.avgDays > LEGAL_REPLY_DAYS ? "danger" : "live"}>
                      {t("daysValue", { days: days(d.avgDays) })}
                    </CardChip>
                  )}
                </TapCard>
              ))}
            </CardList>
            {cards.length > FIRST_CARDS && <ShowAllButton expanded={showAll} total={cards.length} onToggle={() => setShowAll((x) => !x)} />}
          </Section>

          {(slowest.length > 1 || waitingBars.length > 1) && (
            <ChartRow>
              {slowest.length > 1 && (
                <ChartCard
                  title={t("daysTitle", { period })}
                  emoji="⏱️"
                  units={withDays.length > MAX_BARS ? t("daysUnitsTop", { n: MAX_BARS }) : t("daysUnits")}
                  simple={
                    overLimit > 0
                      ? t.rich("daysSimpleOver", { over: overLimit, n: withDays.length, b: bold })
                      : t.rich("daysSimpleAll", { n: withDays.length, b: bold })
                  }
                  asOf={lastUpdated}
                  asOfPeriod={period}
                  table={slowest.map((d) => ({ label: d.dept, value: t("daysValue", { days: days(d.avgDays) }) }))}
                >
                  <RankBars
                    ariaLabel={t("daysAria")}
                    marker={{ value: LEGAL_REPLY_DAYS, label: t("daysMarker") }}
                    items={slowest.map((d) => ({
                      key: d.dept,
                      label: d.dept,
                      value: d.avgDays,
                      display: t("daysValue", { days: days(d.avgDays) }),
                      emoji: officeEmoji(d.dept),
                      alert: d.avgDays > LEGAL_REPLY_DAYS,
                    }))}
                  />
                </ChartCard>
              )}
              {waitingBars.length > 1 && (
                <ChartCard
                  title={t("waitingTitle", { period })}
                  emoji="⏳"
                  units={t("waitingUnits")}
                  simple={t.rich("waitingSimple", { dept: waitingBars[0].dept, count: num(waitingBars[0].pending), b: bold })}
                  asOf={lastUpdated}
                  asOfPeriod={period}
                  table={waitingBars.map((d) => ({ label: d.dept, value: num(d.pending) }))}
                >
                  <RankBars
                    ariaLabel={t("waitingAria")}
                    items={waitingBars.map((d) => ({
                      key: d.dept,
                      label: d.dept,
                      value: d.pending,
                      display: num(d.pending),
                      emoji: officeEmoji(d.dept),
                    }))}
                  />
                </ChartCard>
              )}
            </ChartRow>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <AccountabilityFooter moduleSlug="rti" locale={locale} state={state} district={district} sourceUrls={{ "RTI Online Portal": "https://rtionline.gov.in" }} />
      </div>

      {/* Everything about one office. */}
      <DetailSheet
        open={openDept !== null}
        onClose={() => setOpen(null)}
        title={openDept?.dept ?? ""}
        titleLang="en"
        subtitle={period}
        emoji={openDept ? officeEmoji(openDept.dept) : "🏢"}
        hueClassName={hueClass("rti")}
        footer={
          <SheetAction href={`${base}/file-rti`} emoji="📜">
            {t("askOffice")}
          </SheetAction>
        }
      >
        {openDept && (
          <>
            <DetailList
              rows={[
                { emoji: "📨", label: t("tileFiled"), value: num(openDept.filed) },
                { emoji: "✅", label: t("tileDisposed"), value: num(openDept.disposed) },
                { emoji: "⏳", label: t("tilePending"), value: num(openDept.pending) },
                {
                  emoji: "⏱️",
                  label: t("tileDays"),
                  value:
                    openDept.avgDays != null ? (
                      <span style={{ color: openDept.avgDays > LEGAL_REPLY_DAYS ? "var(--ftp-danger)" : undefined, fontWeight: 600 }}>
                        {t("daysValue", { days: days(openDept.avgDays) })}
                      </span>
                    ) : null,
                },
              ]}
            />
            <SheetNote emoji="⚖️">{t("sheetLimit")}</SheetNote>
            {openMonths.length > 1 && (
              <>
                <SheetHeading emoji="📆">{t("sheetMonths")}</SheetHeading>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {openMonths.map((r) => (
                    <li key={r.id} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: "20px", flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--hue-deep)", minWidth: 84 }}>
                        {r.month ? `${monthName(r.year, r.month, "short")} ${r.year}` : r.year}
                      </strong>
                      <span>
                        {t("monthRow", { filed: num(r.filed), disposed: num(r.disposed), pending: num(r.pending) })}
                        {r.avgDays != null && ` · ${t("daysValue", { days: days(r.avgDays) })}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {openSource && (
              <div>
                <SourcePill label={openSource} />
              </div>
            )}
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function RTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("rti")}>
      <RTIPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
