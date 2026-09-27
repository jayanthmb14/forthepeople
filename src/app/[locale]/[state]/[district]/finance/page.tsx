/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Budget — "Where does the money go?"
// ═══════════════════════════════════════════════════════════════════════
//  The answer in one line: "Out of every ₹100 given to Mandya in FY
//  2024-25, about ₹82 was spent."
//  Page recipe (docs/LAYOUT.md):
//    ModulePage → PageHeader → Explainer → 4 StatTiles (total, spent,
//    utilisation, lapsed) → the picture (10 coin icons + a dial) →
//    departments as cards (year chips, "money lapsed" chip); tapping a card
//    opens a DetailSheet with that department's full numbers, notes and
//    source → charts two or three to a row (how each ₹100 is shared, where
//    the money went, revenue each month) → one AI insight → Download /
//    Share / Compare → news. v5: no emoji; sources, "not an official
//    website" and the stale-data note come from the district shell.
//  Data: useBudget, useRevenue. Amounts are
//  stored in whole rupees and formatted at render (useMoney). Every total
//  carries the fiscal year and an "As of" date from when the rows were
//  fetched. Words live in "page_finance".
"use client";

import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Coins, ExternalLink, Hourglass, Percent, PiggyBank, Receipt, Wallet } from "lucide-react";
import { useBudget, useRevenue, type BudgetAllocation } from "@/hooks/useRealtimeData";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Chips,
  LoadingShell,
  ProgressBar,
  EmptyState,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import { ChartCard, ChartGradients, Explainer, Gauge, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { IconPictogram } from "@/components/district/calm-parts";
import { hueClass } from "@/lib/design/hues";
import ModuleNews from "@/components/district/ModuleNews";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { OTHER_SHADE, ShareDonut, type DonutSlice } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import MoneyToolbar, { downloadCsv } from "@/components/money/MoneyToolbar";
import { CardHead, SheetHighlight, SheetLink, TapCard, safeUrl } from "@/components/money/TapCard";
import knDict from "@/dictionaries/kn.json";

/** 1 crore = 10 million rupees. Amounts in the database are in rupees. */
const CRORE = 10_000_000;
const LAKH = 100_000;

/** The main source, shown in the page header and on the charts. */
const PFMS = { label: "PFMS", href: "https://pfms.nic.in" };

/** An allocation row as the API sends it (the hook type plus the fields it leaves out). */
type AllocationRow = BudgetAllocation & {
  source?: string | null;
  sourceUrl?: string | null;
  remarks?: string | null;
  quarter?: number | null;
  fetchedAt?: string | null;
};

/** The newest timestamp in a list of rows (rows carry `fetchedAt` from the API). */
function latestFetchedAt(rows: Array<{ fetchedAt?: string | null }>): string | null {
  let best: string | null = null;
  for (const r of rows) {
    if (r.fetchedAt && (!best || r.fetchedAt > best)) best = r.fetchedAt;
  }
  return best;
}

const b = (c: React.ReactNode) => <strong>{c}</strong>;

function FinancePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_finance");
  const mt = useModuleText();
  const f = useFormat();
  const m = useMoney();
  const districtName = useDistrictName(state, district);
  const { data: budgetData, isLoading: bLoading } = useBudget(district, state);
  const { data: revenueData, isLoading: rLoading } = useRevenue(district, state);
  const [pickedYear, setPickedYear] = useState<string | null>(null);
  const [show, setShow] = useState<"all" | "lapsed">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  // Stable, so the open sheet does not re-run its focus effect on every render.
  const closeSheet = useCallback(() => setOpenId(null), []);

  const entries = budgetData?.data?.entries ?? [];
  const allocations = (budgetData?.data?.allocations ?? []) as AllocationRow[];
  const collections = revenueData?.data?.collections ?? [];

  const latestYear = entries.length > 0 ? entries[0].fiscalYear : allocations[0]?.fiscalYear ?? null;
  const latestEntries = entries.filter((e) => e.fiscalYear === latestYear);
  const latestAllocations = allocations.filter((a) => a.fiscalYear === latestYear);
  // Totals come from the sector rows; a district with only department rows uses those.
  const totalsFrom = latestEntries.length > 0 ? latestEntries : latestAllocations;
  const totalAllocated = totalsFrom.reduce((s, e) => s + e.allocated, 0);
  const totalSpent = totalsFrom.reduce((s, e) => s + e.spent, 0);
  const totalLapsed = latestAllocations.reduce((s, a) => s + a.lapsed, 0);

  // When did we last fetch these rows? Shown as "As of …" beside the totals.
  const asOf = latestFetchedAt([...(entries as Array<{ fetchedAt?: string | null }>), ...allocations]);
  const revenueAsOf = latestFetchedAt(collections as Array<{ fetchedAt?: string | null }>);

  const budgetChart = latestEntries.map((e) => ({
    // Full name for the tooltip; a shorter one for the axis.
    sectorFull: e.sector,
    sector: e.sector.length > 22 ? e.sector.slice(0, 21) + "…" : e.sector,
    allocated: Math.round(e.allocated / CRORE),
    spent: Math.round(e.spent / CRORE),
  }));

  // "How each ₹100 is shared": the five biggest sectors, the rest as "Other".
  const bySize = [...latestEntries].sort((a, c) => c.allocated - a.allocated);
  const shareSlices: DonutSlice[] = bySize.slice(0, 5).map((e) => ({
    key: e.sector,
    label: e.sector,
    value: e.allocated,
    display: m.short(e.allocated, 0),
  }));
  const restAllocated = bySize.slice(5).reduce((s, e) => s + e.allocated, 0);
  if (restAllocated > 0) {
    shareSlices.push({ key: "__other", label: t("share.other", { n: bySize.length - 5 }), value: restAllocated, display: m.short(restAllocated, 0), other: true });
  }
  const topShare = bySize[0] && totalAllocated > 0 ? Math.round((bySize[0].allocated / totalAllocated) * 100) : 0;

  // Month names come from Intl in the reader's language ("Sep", "ಸೆಪ್ಟೆಂ").
  const monthName = (month: number) => f.date(new Date(Date.UTC(2024, month - 1, 15)), { month: "short" });
  const revChart = collections
    .slice(0, 12)
    .map((c) => ({
      label: monthName(c.month),
      amount: Math.round(c.amount / LAKH),
      target: c.target ? Math.round(c.target / LAKH) : 0,
    }))
    .reverse();

  // Department cards: one financial year at a time, newest first.
  const years = Array.from(new Set(allocations.map((a) => a.fiscalYear)));
  const year = pickedYear && years.includes(pickedYear) ? pickedYear : years[0] ?? null;
  const yearRows = allocations.filter((a) => a.fiscalYear === year).sort((a, c) => c.allocated - a.allocated);
  const lapsedCount = yearRows.filter((a) => a.lapsed > 0).length;
  const deptRows = show === "lapsed" ? yearRows.filter((a) => a.lapsed > 0) : yearRows;
  const open = openId ? allocations.find((a) => a.id === openId) ?? null : null;

  // Local-script title: the module name in the state's language (Kannada only
  // for now). PageHeader hides it when it is already the title.
  const title = mt.label("finance");
  const titleLocal = state === "karnataka" ? knDict.moduleNames.finance : undefined;
  const fyLabel = latestYear ? t("fy", { year: latestYear }) : undefined;
  const pctSpent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const hasBudget = entries.length > 0 || allocations.length > 0;

  const onCsv = () =>
    downloadCsv(
      `${district}-budget-allocations.csv`,
      allocations.map((a) => ({
        fiscal_year: a.fiscalYear,
        department: a.department,
        allocated_cr: (a.allocated / CRORE).toFixed(2),
        spent_cr: (a.spent / CRORE).toFixed(2),
        lapsed_cr: (a.lapsed / CRORE).toFixed(2),
      })),
    );

  return (
    <ModulePage>
      <PageHeader
        icon={PiggyBank}
        title={title}
        titleLocal={titleLocal}
        description={t("description")}
        freshness={asOf ? { asOf } : undefined}
        source={PFMS}
      />

      {bLoading && <LoadingShell rows={4} />}

      {!bLoading && !hasBudget && <EmptyState title={t("empty.title")} body={t("empty.body")} />}

      {!bLoading && hasBudget && (
        <>
          {/* 1. The answer in one sentence. */}
          {totalAllocated > 0 && latestYear && (
            <Explainer>
              {totalSpent > 0
                ? t.rich("explainer", { district: districtName, year: latestYear, pct: pctSpent, b })
                : t.rich("explainerAllocOnly", { district: districtName, year: latestYear, amount: m.short(totalAllocated, 0), b })}
              {allocations.length > 0 && <> {t("explainerTap")}</>}
            </Explainer>
          )}

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile icon={Wallet} label={t("tiles.total")} value={m.num(Math.round(totalAllocated / CRORE))} unit={t("tiles.unitCr")} sub={fyLabel} asOf={asOf} />
            <StatTile
              icon={Receipt}
              label={t("tiles.spent")}
              value={totalSpent === 0 && totalAllocated > 0 ? t("tiles.dataPending") : m.num(Math.round(totalSpent / CRORE))}
              unit={totalSpent === 0 && totalAllocated > 0 ? undefined : t("tiles.unitCr")}
              sub={fyLabel}
              asOf={asOf}
            />
            <StatTile
              icon={Percent}
              label={t("tiles.utilisation")}
              value={totalAllocated > 0 ? (totalSpent === 0 ? t("tiles.pending") : m.num(pctSpent)) : "—"}
              unit={totalAllocated > 0 && totalSpent > 0 ? "%" : undefined}
              sub={fyLabel}
              asOf={asOf}
            />
            <StatTile
              icon={Hourglass}
              label={t("tiles.lapsed")}
              value={totalSpent === 0 && totalLapsed === 0 ? "—" : m.num(totalLapsed / CRORE, 1)}
              unit={totalSpent === 0 && totalLapsed === 0 ? undefined : t("tiles.unitCr")}
              sub={t("tiles.lapsedSub")}
              asOf={asOf}
            />
          </StatStrip>

          {/* 3. The picture: 10 coin icons, one per ₹10 of every ₹100, lit
              for what was spent; plus a dial. Same numbers as the tiles. */}
          {totalAllocated > 0 && totalSpent > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card padding={18} style={{ display: "flex", alignItems: "center" }}>
                <IconPictogram
                  filled={(totalSpent / totalAllocated) * 10}
                  icon={Coins}
                  label={t("pictogram", { n: Math.round((totalSpent / totalAllocated) * 10) })}
                />
              </Card>
              <Card padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge value={(totalSpent / totalAllocated) * 100} label={t("gauge.label")} caption={t("gauge.caption", { year: latestYear ?? "" })} />
              </Card>
            </div>
          )}

          {/* 4. Departments as cards; tap one for all its numbers. */}
          <Section title={t("depts.title")}>
            {allocations.length === 0 ? (
              <EmptyState title={t("depts.empty")} />
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {years.length > 1 && (
                    <Chips
                      label={t("depts.yearAria")}
                      value={year ?? ""}
                      onChange={(v) => setPickedYear(v)}
                      items={years.map((y) => ({ value: y, label: t("fy", { year: y }), count: allocations.filter((a) => a.fiscalYear === y).length }))}
                    />
                  )}
                  {lapsedCount > 0 && (
                    <Chips
                      label={t("depts.showAria")}
                      value={show}
                      onChange={(v) => setShow(v as "all" | "lapsed")}
                      items={[
                        { value: "all", label: t("depts.all"), count: yearRows.length },
                        { value: "lapsed", label: t("depts.lapsedOnly"), count: lapsedCount },
                      ]}
                    />
                  )}
                </div>
                {deptRows.length === 0 ? (
                  <EmptyState title={t("depts.noMatch")} />
                ) : (
                  <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
                    {deptRows.map((a) => (
                      <DeptCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </Section>
        </>
      )}

      {/* 5. Charts, two or three to a row on wide screens. */}
      {((!bLoading && (shareSlices.length >= 2 || budgetChart.length > 0)) || (!rLoading && revChart.length > 0)) && (
        <div className="ftp-grid" style={{ marginTop: 28, alignItems: "start", ["--ftp-grid-min" as string]: "360px" } as React.CSSProperties}>
          {/* How each ₹100 is shared between sectors. Needs two sectors. */}
          {shareSlices.length >= 2 && totalAllocated > 0 && (
            <ChartCard
              title={t("share.title", { year: latestYear ?? "" })}
              units={t("share.units")}
              simple={t.rich("share.simple", { sector: bySize[0].sector, n: topShare, b })}
              source={PFMS}
              asOf={asOf}
              table={shareSlices.map((s) => ({ label: s.label, value: `${s.display} (${m.pct(s.value / totalAllocated)})` }))}
            >
              <ShareDonut
                slices={shareSlices}
                centerValue={m.short(totalAllocated, 0)}
                centerLabel={t("share.center")}
                ariaLabel={t("share.aria", {
                  year: latestYear ?? "",
                  list: shareSlices.map((s) => `${s.label} ${m.pct(s.value / totalAllocated)}`).join(", "),
                })}
                formatPct={(p) => m.pct(p)}
              />
            </ChartCard>
          )}

          {/* Where the money went, sector by sector. */}
          {budgetChart.length > 0 && (
            <ChartCard
              title={t("sectors.title", { year: latestYear ?? "" })}
              units={t("sectors.units")}
              simple={(() => {
                const top = [...budgetChart].sort((a, c) => c.allocated - a.allocated)[0];
                return top ? t.rich("sectors.simple", { sector: top.sectorFull, given: m.crore(top.allocated), spent: m.crore(top.spent), b }) : null;
              })()}
              legend={[
                { label: t("sectors.legendGiven"), swatch: OTHER_SHADE },
                { label: t("sectors.legendSpent"), swatch: "var(--hue)" },
              ]}
              source={PFMS}
              asOf={asOf}
              table={budgetChart.map((r) => ({ label: r.sectorFull, value: t("sectors.row", { spent: m.crore(r.spent), given: m.crore(r.allocated) }) }))}
            >
              {/* 44 px per sector so every sector gets a readable label. */}
              <ResponsiveContainer width="100%" height={Math.max(200, budgetChart.length * 44 + 40)}>
                <BarChart data={budgetChart} margin={{ top: 5, right: 16, bottom: 8, left: 0 }} layout="vertical" barGap={3}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" horizontal={false} />
                  <XAxis type="number" tick={CHART_AXIS} tickFormatter={(v) => m.crore(Number(v))} />
                  <YAxis type="category" dataKey="sector" tick={CHART_AXIS} width={120} interval={0} />
                  <Tooltip
                    formatter={(v, name) => [m.crore(Number(v)), name]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.sectorFull ?? ""}
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "var(--hue-tint)" }}
                  />
                  <Bar dataKey="allocated" fill="url(#ftpMutedFill)" radius={[0, 6, 6, 0]} name={t("sectors.given")} />
                  <Bar dataKey="spent" fill="url(#ftpHueFillH)" radius={[0, 6, 6, 0]} name={t("sectors.spent")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Revenue collected each month. */}
          {!rLoading && revChart.length > 0 && (
            <ChartCard
              title={t("revenue.title")}
              units={t("revenue.units")}
              legend={[
                { label: t("revenue.collected"), swatch: "var(--hue)" },
                { label: t("revenue.target"), swatch: OTHER_SHADE },
              ]}
              asOf={revenueAsOf}
              table={revChart.map((r) => ({
                label: r.label,
                value: r.target ? t("revenue.rowWithTarget", { amount: m.lakh(r.amount), target: m.lakh(r.target) }) : m.lakh(r.amount),
              }))}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                  <XAxis dataKey="label" tick={CHART_AXIS} />
                  <YAxis tick={CHART_AXIS} tickFormatter={(v) => m.num(Number(v))} width={44} />
                  <Tooltip formatter={(v, name) => [m.lakh(Number(v)), name]} contentStyle={chartTooltipStyle} cursor={{ fill: "var(--hue-tint)" }} />
                  <Bar dataKey="amount" fill="url(#ftpHueFill)" radius={[6, 6, 0, 0]} name={t("revenue.collected")} />
                  <Bar dataKey="target" fill="url(#ftpMutedFill)" radius={[6, 6, 0, 0]} name={t("revenue.target")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* One AI insight (it hides itself when there is none). */}
      <div style={{ marginTop: 24 }}>
        <AIInsightCard module="budget" district={district} />
      </div>

      <MoneyToolbar shareTitle={title} onCsv={onCsv} csvDisabled={allocations.length === 0} compareHref={`/${locale}/compare?module=finance&a=${district}`} />

      <ModuleNews district={district} state={state} locale={locale} module="budget" />

      <DetailSheet
        open={!!open}
        onClose={closeSheet}
        title={open?.department ?? ""}
        subtitle={open ? t("fy", { year: open.fiscalYear }) : undefined}
        hueClassName={hueClass("finance")}
        footer={
          open && safeUrl(open.sourceUrl) ? (
            <SheetLink href={safeUrl(open.sourceUrl)!} icon={<ExternalLink size={16} aria-hidden />}>
              {t("sheet.openSource")}
            </SheetLink>
          ) : undefined
        }
      >
        {open && <DeptSheet a={open} />}
      </DetailSheet>
    </ModulePage>
  );
}

/** One department: given, spent, a bar, and lapsed money in red. */
function DeptCard({ a, onOpen }: { a: AllocationRow; onOpen: () => void }) {
  const t = useTranslations("page_finance");
  const m = useMoney();
  return (
    <TapCard onOpen={onOpen} ariaLabel={t("depts.cardAria", { name: a.department })} more={t("depts.more")}>
      <CardHead title={a.department} titleLocal={a.departmentLocal} />
      <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <span>
          <span className="ftp-label" style={{ display: "block" }}>{t("depts.given")}</span>
          <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>{m.short(a.allocated, 1)}</span>
        </span>
        <span>
          <span className="ftp-label" style={{ display: "block" }}>{t("depts.spent")}</span>
          <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: "var(--ftp-text)" }}>
            {a.spent > 0 ? m.short(a.spent, 1) : "—"}
          </span>
        </span>
      </span>
      {a.spent > 0 && a.allocated > 0 ? (
        <ProgressBar value={a.spent} max={a.allocated} label={t("depts.spent")} />
      ) : (
        <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("depts.notSpentYet")}</span>
      )}
      {a.lapsed > 0 && (
        <span className="ftp-num" style={{ fontSize: 14, fontWeight: 650, color: "var(--ftp-warn)" }}>
          {t("depts.lapsed", { amount: m.short(a.lapsed, 1) })}
        </span>
      )}
    </TapCard>
  );
}

/** Everything about one department's money for one year. */
function DeptSheet({ a }: { a: AllocationRow }) {
  const t = useTranslations("page_finance");
  const f = useFormat();
  const m = useMoney();
  const used = a.allocated > 0 && a.spent > 0 ? Math.round((a.spent / a.allocated) * 100) : null;
  const url = safeUrl(a.sourceUrl);
  return (
    <>
      <SheetHighlight label={t("sheet.storyLabel")}>
        {a.spent > 0
          ? t("sheet.story", { dept: a.department, given: m.short(a.allocated, 2), year: a.fiscalYear, spent: m.short(a.spent, 2) })
          : t("sheet.storyNoSpend", { dept: a.department, given: m.short(a.allocated, 2), year: a.fiscalYear })}
      </SheetHighlight>
      {used !== null && <ProgressBar pct={used} label={t("sheet.used")} height={10} />}
      <DetailList
        rows={[
          { label: t("sheet.fy"), value: a.fiscalYear },
          { label: t("sheet.category"), value: a.category || null },
          { label: t("sheet.scheme"), value: a.scheme || null },
          { label: t("sheet.allocated"), value: m.short(a.allocated, 2) },
          { label: t("sheet.released"), value: a.released > 0 ? m.short(a.released, 2) : null },
          { label: t("sheet.spent"), value: a.spent > 0 ? m.short(a.spent, 2) : null },
          {
            label: t("sheet.lapsed"),
            value: a.lapsed > 0 ? <span style={{ color: "var(--ftp-warn)", fontWeight: 600 }}>{m.short(a.lapsed, 2)}</span> : null,
          },
          { label: t("sheet.period"), value: a.quarter ? t("sheet.quarter", { n: a.quarter }) : null },
          { label: t("sheet.remarks"), value: a.remarks || null, lang: "en" },
          {
            label: t("sheet.source"),
            value: a.source ? (
              url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                  {a.source}
                </a>
              ) : (
                a.source
              )
            ) : null,
          },
          { label: t("sheet.asOf"), value: a.fetchedAt ? f.date(a.fetchedAt, { day: "numeric", month: "short", year: "numeric" }) : null },
        ]}
      />
    </>
  );
}

export default function FinancePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("finance")}>
      <FinancePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
