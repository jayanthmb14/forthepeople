/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Tap water (Jal Jeevan Mission) — Layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Does my home have a tap, and is the water safe?"
//  The answer, in one sentence: "About 8 of every 10 homes in Mandya have
//  a tap at home: 3,50,000 of 4,20,000 homes in the 7 areas we track."
//
//  Data: useJJM() → one row per area (a village, or a taluk total in
//  some districts): homes, tap connections, coverage %, latest water test
//  and its own updatedAt. The newest updatedAt is the page's "as of".
//  useTaluks() only names the taluk an area belongs to.
//
//  Page, top to bottom:
//    header → the answer → 4 tiles → one picture (ten houses + a tank)
//    → "Find your area" cards (tap → a sheet with everything about that
//    area) → charts (water tests ring, areas still waiting) → AI insight
//    → news, share (sources are in the layout's verification panel).
//  Urban districts where JJM does not apply get the water-board note.
//
//  Text: every sentence comes from page_jjm (en/kn/hi). Area names and
//  test results are data and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck, CircleHelp, Clock, Droplets, House, type LucideIcon } from "lucide-react";
import { useJJM, useTaluks } from "@/hooks/useRealtimeData";
import type { JJMStatus } from "@/hooks/useRealtimeData";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
  Pill,
} from "@/components/district/ui";
import { ChartCard, Explainer, WaterTank } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/page-kit";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { getStateConfig } from "@/lib/constants/state-config";
import { HueDonut, OTHER_SHADE } from "@/components/district/daily-services/BreakdownVisuals";
import { fitGrid, TapCard, CardBar, SearchBox, MoreButton, ActionLink, SheetNote, matches, usePlaceName } from "@/components/services-1/kit";
import PageEnd from "@/components/services-1/PageEnd";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

const EJALSHAKTI = { label: "eJalShakti", href: "https://ejalshakti.gov.in" };

/** Cards shown before "Show all". */
const FIRST_SHOWN = 24;

/** Areas in the "still waiting" chart. */
const WAITING_SHOWN = 8;

type Quality = "safe" | "issue" | "other" | "untested";
type SortKey = "low" | "high" | "name";

/**
 * The latest water test of an area, read from the published result text
 * ("Safe", "Safe for drinking (treated)", "Requires treatment" …). A tested
 * area whose result is empty or unclear is "other", never guessed.
 */
function qualityOf(v: JJMStatus): Quality {
  if (!v.waterQualityTested) return "untested";
  const r = (v.waterQualityResult ?? "").toLowerCase();
  if (/unsafe|not safe|requires|contamin|fail|unfit|issue|problem/.test(r)) return "issue";
  if (/safe|potable/.test(r)) return "safe";
  return "other";
}

/** A small Lucide marker for the latest water test (the words say it too). */
const QUALITY_ICON: Record<Quality, LucideIcon> = { safe: CircleCheck, issue: CircleAlert, other: CircleHelp, untested: Clock };

/** Coverage → colour: every home green, half or more amber, below that red. */
function coverageColor(pct: number): string {
  return pct >= 100 ? "var(--ftp-live-text)" : pct >= 50 ? "var(--ftp-warn)" : "var(--ftp-danger)";
}

function JJMPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_jjm");
  const f = useFormat();
  const mt = useModuleText();
  const place = usePlaceName();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useJJM(district, state);
  const { data: talukData } = useTaluks(district, state);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("low");
  const [talukFilter, setTalukFilter] = useState("all");
  const [limit, setLimit] = useState(FIRST_SHOWN);
  const [openId, setOpenId] = useState<string | null>(null);

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits });
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const areas = data?.data ?? [];
  const totalHH = areas.reduce((s, v) => s + v.totalHouseholds, 0);
  const totalTaps = areas.reduce((s, v) => s + v.tapConnections, 0);
  const waiting = Math.max(0, totalHH - totalTaps);
  const coverage = totalHH > 0 ? (totalTaps / totalHH) * 100 : 0;
  const tested = areas.filter((v) => v.waterQualityTested).length;
  const testedPct = areas.length > 0 ? (tested / areas.length) * 100 : 0;
  const tenths = Math.round(Math.min(100, coverage) / 10);
  // Newest update across all areas (ISO strings sort correctly as text).
  const asOf = areas.reduce<string | null>((m, v) => (!m || v.updatedAt > m ? v.updatedAt : m), null);

  // Taluk names, for the card subtitle and the taluk filter.
  const talukName = new Map<string, { text: string; lang?: string }>();
  (talukData?.data ?? []).forEach((tk) => talukName.set(tk.id, place(tk.name, tk.nameLocal)));
  const taluksWithRows = Array.from(new Set(areas.map((v) => v.talukId).filter((id): id is string => Boolean(id && talukName.has(id)))));

  const unknownArea = t("list.unknownArea");
  const nameOf = (v: JJMStatus) => v.villageName ?? unknownArea;

  // Water tests: areas by their latest result.
  const qCount: Record<Quality, number> = { safe: 0, issue: 0, other: 0, untested: 0 };
  areas.forEach((v) => {
    qCount[qualityOf(v)] += 1;
  });
  const qualityItems = (["safe", "issue", "other", "untested"] as Quality[]).map((q) => ({
    key: q,
    label: t(`quality.${q}`),
    value: qCount[q],
    color: q === "safe" ? "var(--hue)" : q === "issue" ? "var(--ftp-warn)" : q === "other" ? "var(--hue-pop)" : OTHER_SHADE,
  }));
  const qValues = {
    safe: f.number(qCount.safe),
    issue: f.number(qCount.issue),
    other: f.number(qCount.other),
    untested: f.number(qCount.untested),
    tested: f.number(tested),
  };

  // Areas still waiting for taps: lowest coverage first, below 100 % only.
  const stillWaiting = [...areas]
    .filter((v) => v.coveragePct < 100 && v.totalHouseholds > 0)
    .sort((a, c) => a.coveragePct - c.coveragePct)
    .slice(0, WAITING_SHOWN);

  // The list: search, taluk filter, sort.
  const listed = areas
    .filter((v) => talukFilter === "all" || v.talukId === talukFilter)
    .filter((v) => matches(query, v.villageName, v.talukId ? talukName.get(v.talukId)?.text : null))
    .sort((a, c) =>
      sort === "name" ? nameOf(a).localeCompare(nameOf(c)) : sort === "high" ? c.coveragePct - a.coveragePct : a.coveragePct - c.coveragePct,
    );
  const shown = listed.slice(0, limit);
  const open = areas.find((v) => v.id === openId) ?? null;

  // Urban districts where JJM does not apply: point to the water board.
  const sc = getStateConfig(state);
  const urbanWaterBoard = sc && !sc.jjmApplicable && sc.waterBoard ? sc.waterBoard : null;

  return (
    <ModulePage>
      <PageHeader
        icon={Droplets}
        title={mt.label("jjm")}
        description={t("description")}
        backHref={base}
        freshness={asOf ? { asOf, thresholdHours: 24 * 7 } : undefined}
        source={EJALSHAKTI}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && areas.length === 0 &&
        (urbanWaterBoard ? (
          <Card tinted>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h2 className="ftp-title" style={{ fontWeight: 600 }}>{t("urban.title")}</h2>
            </div>
            <p className="ftp-body ftp-prose" style={{ margin: "0 0 8px" }}>
              {t("urban.body", { district: districtName, board: urbanWaterBoard })}
            </p>
            <p className="ftp-prose" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)", margin: 0 }}>
              {t("urban.contact", { board: urbanWaterBoard, body: sc?.municipalBody ?? t("urban.fallbackBody") })}
            </p>
          </Card>
        ) : (
          <NoDataCard module="jjm" district={district} state={state} isUrban={true} />
        ))}

      {!isLoading && areas.length > 0 && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer>
            {totalHH > 0
              ? t.rich("answer.main", {
                  tenths: f.number(tenths),
                  district: districtName,
                  taps: f.number(totalTaps),
                  homes: f.number(totalHH),
                  count: areas.length,
                  areas: f.number(areas.length),
                  b: bNum,
                })
              : t("answer.noHomes", { count: areas.length, areas: f.number(areas.length) })}{" "}
            {tested > 0 &&
              (qCount.issue > 0
                ? t("answer.someIssue", { issue: qCount.issue, issueN: qValues.issue })
                : qCount.safe === tested
                  ? t("answer.allSafe")
                  : t("answer.someSafe", { safeN: qValues.safe, testedN: qValues.tested }))}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile
              label={t("tiles.coverage")}
              value={f.number(coverage, { maximumFractionDigits: 1 })}
              unit="%"
              asOf={asOf}
            />
            <StatTile label={t("tiles.taps")} value={f.number(totalTaps)} sub={t("tiles.tapsSub", { homes: f.number(totalHH) })} asOf={asOf} />
            <StatTile label={t("tiles.waiting")} value={f.number(waiting)} sub={t("tiles.waitingSub")} asOf={asOf} />
            <StatTile
              label={t("tiles.tested")}
              value={f.number(testedPct, { maximumFractionDigits: 0 })}
              unit="%"
              sub={t("tiles.testedSub", { tested: qValues.tested, areas: f.number(areas.length) })}
              asOf={asOf}
            />
          </StatStrip>

          {/* 3. One picture: ten houses with the real share lit, and a tank
                filled to the same level. Only with homes on record. */}
          {totalHH > 0 && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("picture.title")}
                </p>
                <IconPictogram icon={House} filled={Math.min(100, coverage) / 10} label={t("picture.homes", { n: f.number(tenths) })} />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WaterTank pct={coverage} label={t("picture.tank")} />
              </Card>
            </div>
          )}

          {/* 4. Every area as a card; tap one for everything about it. */}
          <Section title={t("list.title")}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
              <SearchBox
                id="jjm-search"
                label={t("list.searchLabel")}
                placeholder={t("list.searchPlaceholder")}
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setLimit(FIRST_SHOWN);
                }}
              />
              <Chips
                label={t("list.sortAria")}
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                items={[
                  { value: "low", label: t("list.sortLow") },
                  { value: "high", label: t("list.sortHigh") },
                  { value: "name", label: t("list.sortName") },
                ]}
              />
            </div>
            {taluksWithRows.length >= 2 && (
              <div style={{ marginBottom: 12 }}>
                <Chips
                  label={t("list.talukAria")}
                  value={talukFilter}
                  onChange={(v) => {
                    setTalukFilter(v);
                    setLimit(FIRST_SHOWN);
                  }}
                  items={[
                    { value: "all", label: t("list.all"), count: areas.length },
                    ...taluksWithRows.map((id) => ({
                      value: id,
                      label: talukName.get(id)?.text ?? id,
                      count: areas.filter((v) => v.talukId === id).length,
                    })),
                  ]}
                />
              </div>
            )}
            {listed.length === 0 ? (
              <EmptyState title={t("list.noMatch", { query })} body={t("list.noMatchBody")} />
            ) : (
              <>
                <p aria-live="polite" style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ftp-text-2)" }}>
                  {t("list.count", { count: listed.length, n: f.number(listed.length) })}
                </p>
                <div className="ftp-grid">
                  {shown.map((v) => {
                    const q = qualityOf(v);
                    const tk = v.talukId ? talukName.get(v.talukId) : undefined;
                    const nm = nameOf(v);
                    return (
                      <TapCard
                        key={v.id}
                        title={nm}
                        titleLang={place(nm).lang}
                        subtitle={tk ? t("list.taluk", { taluk: tk.text }) : undefined}
                        aside={
                          <span className="ftp-bignum" style={{ fontSize: 22, lineHeight: 1, color: coverageColor(v.coveragePct) }}>
                            {pct(v.coveragePct)}
                          </span>
                        }
                        hint={t("list.open")}
                        onOpen={() => setOpenId(v.id)}
                      >
                        <CardBar
                          pct={v.coveragePct}
                          label={
                            <span className="ftp-num">
                              {t("list.tapsOfHomes", { taps: f.number(v.tapConnections), homes: f.number(v.totalHouseholds) })}
                            </span>
                          }
                        />
                        <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, color: "var(--ftp-text-2)" }}>
                          {(() => {
                            const QIcon = QUALITY_ICON[q];
                            return <QIcon size={14} aria-hidden style={{ color: q === "issue" ? "var(--ftp-warn)" : "var(--hue)" }} />;
                          })()}
                          {t(`quality.${q}`)}
                        </span>
                      </TapCard>
                    );
                  })}
                </div>
                <MoreButton
                  shown={shown.length}
                  total={listed.length}
                  label={t("list.showAll", { n: f.number(listed.length) })}
                  onClick={() => setLimit(listed.length)}
                />
              </>
            )}
          </Section>

          {/* 5. Charts, two to a row on wide screens. */}
          {(tested > 0 || stillWaiting.length >= 2) && (
            <div style={fitGrid(340, 28)}>
              {tested > 0 && (
                <ChartCard
                  title={t("quality.title")}
                  units={t("quality.units")}
                  simple={
                    qCount.issue > 0
                      ? t.rich("quality.simpleIssue", { ...qValues, b })
                      : qCount.safe === tested
                        ? t.rich("quality.simpleAllSafe", { ...qValues, b })
                        : t.rich("quality.simpleSome", { ...qValues, b })
                  }
                  source={EJALSHAKTI}
                  asOf={asOf}
                  table={qualityItems.filter((q) => q.value > 0).map((q) => ({ label: q.label, value: f.number(q.value) }))}
                >
                  <HueDonut
                    items={qualityItems}
                    centerValue={f.number(areas.length)}
                    centerLabel={t("quality.center", { count: areas.length })}
                    ariaLabel={t("quality.aria", qValues)}
                  />
                </ChartCard>
              )}
              {stillWaiting.length >= 2 && (
                <ChartCard
                  title={t("waiting.title")}
                  units={t("waiting.units")}
                  simple={t.rich("waiting.simple", { name: nameOf(stillWaiting[0]), pct: pct(stillWaiting[0].coveragePct), b })}
                  source={EJALSHAKTI}
                  asOf={asOf}
                  table={stillWaiting.map((v) => ({ label: nameOf(v), value: pct(v.coveragePct) }))}
                >
                  <ol aria-label={t("waiting.title")} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {stillWaiting.map((v) => (
                      <li key={v.id}>
                        <CardBar
                          pct={v.coveragePct}
                          color={coverageColor(v.coveragePct)}
                          label={
                            <>
                              <span lang={place(nameOf(v)).lang} style={{ color: "var(--ftp-text)", fontWeight: 600, minWidth: 0 }}>
                                {nameOf(v)}
                              </span>
                              <span className="ftp-num" style={{ color: coverageColor(v.coveragePct) }}>
                                {pct(v.coveragePct)}
                              </span>
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ol>
                </ChartCard>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="jjm" district={district} />
          </div>
        </>
      )}

      <PageEnd
        ns="page_jjm"
        module="jjm"
        locale={locale}
        state={state}
        district={district}
        shareText={
          areas.length > 0 && totalHH > 0
            ? t("end.shareWithData", { district: districtName, pct: pct(coverage, 1) })
            : t("end.shareNoData", { district: districtName })
        }
      />

      {/* The sheet: everything about one area. */}
      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        hueClassName={hueClass("jjm")}
        title={open ? nameOf(open) : ""}
        titleLang={open ? place(nameOf(open)).lang : undefined}
        subtitle={open?.talukId && talukName.get(open.talukId) ? t("list.taluk", { taluk: talukName.get(open.talukId)?.text ?? "" }) : undefined}
        footer={
          <ActionLink href={EJALSHAKTI.href} primary newTab>
            {t("sheet.source")}
          </ActionLink>
        }
      >
        {open && (
          <>
            <SheetNote>
              {open.coveragePct >= 100
                ? t.rich("sheet.full", { homes: f.number(open.totalHouseholds), b: bNum })
                : t.rich("sheet.some", {
                    taps: f.number(open.tapConnections),
                    homes: f.number(open.totalHouseholds),
                    waiting: f.number(Math.max(0, open.totalHouseholds - open.tapConnections)),
                    b: bNum,
                  })}
            </SheetNote>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WaterTank pct={open.coveragePct} label={t("picture.tank")} width={100} height={120} />
            </div>
            <DetailList
              rows={[
                { label: t("sheet.homes"), value: f.number(open.totalHouseholds) },
                { label: t("sheet.taps"), value: f.number(open.tapConnections) },
                { label: t("sheet.waiting"), value: f.number(Math.max(0, open.totalHouseholds - open.tapConnections)) },
                { label: t("sheet.coverage"), value: pct(open.coveragePct, 1) },
                {
                  label: t("sheet.test"),
                  value: open.waterQualityTested ? (
                    <>
                      <Pill tone={qualityOf(open) === "issue" ? "warn" : qualityOf(open) === "safe" ? "live" : "neutral"}>
                        {t(`quality.${qualityOf(open)}`)}
                      </Pill>
                      {open.waterQualityResult && (
                        <span style={{ display: "block", marginTop: 4, fontSize: 13, color: "var(--ftp-text-2)" }}>
                          {t("sheet.testAsPublished", { result: open.waterQualityResult })}
                        </span>
                      )}
                    </>
                  ) : (
                    t("quality.untested")
                  ),
                },
                { label: t("sheet.taluk"), value: open.talukId ? talukName.get(open.talukId)?.text : null },
                { label: t("sheet.updated"), value: f.date(open.updatedAt, { day: "numeric", month: "short", year: "numeric" }) },
                { label: t("sheet.sourceRow"), value: open.source },
              ]}
            />
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function JJMPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("jjm")}>
      <JJMPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
