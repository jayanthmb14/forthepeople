/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Dams & rivers — layout v4.1 (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "How much water is in our dams, and when do the canals
//  get water?"
//  The answer, in one line: "Together, Mandya's 2 dams hold about 78% of
//  the water they can store. KRS is the fullest at 85%."
//
//    PageHeader → Explainer → 4 StatTiles → picture: one big tank for all
//    dams together + dams more than half full → one tank card per dam
//    (tap → DamSheet: tank, sentence, storage trend, every figure, source)
//    → canal release cards (coming up first) → AI insight → charts
//    (water in / out · storage over time, all dams) → news → Share.
//
//  Honesty: the date of the newest reading sits right above the big
//  numbers. Older than the dams max age (3 days,
//  src/lib/constants/dataset-collection.ts) it turns amber — "N days old;
//  we could not find newer data" — the big percentages turn grey, and the
//  simple-words line says so. Sources and "report a mistake" are in the
//  layout's verification panel.
//
//  Data: useWater() → { dams (newest 20 readings), canals (newest 20) }
//  and /api/data/dam-history (every stored reading, for the trends).
//  Readings come from the state water resources department; storage is in
//  TMC ft as that portal publishes it. Every word comes from "page_water";
//  numbers and dates through useFormat(). Dam and canal names are data:
//  the local-script name leads when it is in the reader's language.
"use client";

import { use, useMemo, useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Droplet, Equal, TrendingDown, TrendingUp, Waves } from "lucide-react";
import { useWater } from "@/hooks/useRealtimeData";
import type { CanalRelease, DamReading } from "@/hooks/useRealtimeData";
import { useDistrictData } from "@/hooks/useDistrictData";
import { useFormat, useModuleText } from "@/i18n/client";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  StatStrip,
  StatTile,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer, WaterTank, CHART_AXIS, chartTooltipStyle } from "@/components/district/visuals";
import { IconPictogram, PageActions, ReadingAge, ageInDays, isOlderThan, useClientNow } from "@/components/district/page-kit";
import { maxAgeHoursOf } from "@/lib/constants/dataset-collection";
import AIInsightCard from "@/components/common/AIInsightCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { FlowBars, FLOW_IN_FILL, FLOW_OUT_FILL } from "@/components/water/WaterVisuals";
import { HUE_SHADES, namePair, useDistrictName } from "@/components/land-water/visuals";
import { fitGrid, Chip, Sparkline, TapCard, TapHint } from "@/components/land-water/cards";
import { DamSheet, flowState } from "@/components/land-water/DamSheet";
import { getStateConfig } from "@/lib/constants/state-config";
import { getDamConfig } from "@/lib/constants/dam-config";

const INDIA_WRIS = { label: "India-WRIS", href: "https://indiawris.gov.in" };
/** Dam readings older than this are not current (src/lib/constants/dataset-collection.ts). */
const MAX_AGE_HOURS = maxAgeHoursOf("dams") ?? 72;

/** Bold runs inside translated sentences (<b>…</b> in the messages). */
const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

/** Today in India as "YYYY-MM-DD" (canal dates are calendar days). */
function todayIST(): string {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

function WaterPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_water");
  const f = useFormat();
  const mt = useModuleText();
  const base = `/${locale}/${state}/${district}`;
  const districtName = useDistrictName(state, district);
  const sc = getStateConfig(state);
  const portalName = sc?.waterPortalName ?? t("fallbackPortal");
  const portal = sc?.waterPortalUrl ? { name: sc.waterPortalName, href: sc.waterPortalUrl } : null;
  const { data, isLoading, error } = useWater(district, state);
  const { data: historyData } = useDistrictData<DamReading[]>("dam-history", district, state);
  const [openDam, setOpenDam] = useState<string | null>(null);
  const [today] = useState(todayIST);
  const now = useClientNow();

  const pct = (n: number, digits = 0) => f.number(n / 100, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits });
  const shortDay = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const fullDay = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });

  const dams = useMemo(() => data?.data?.dams ?? [], [data]);
  const canals = useMemo(() => data?.data?.canals ?? [], [data]);

  // Latest reading per dam (rows arrive newest first).
  const damList = useMemo(() => {
    const seen = new Map<string, DamReading>();
    for (const d of dams) if (!seen.has(d.damName)) seen.set(d.damName, d);
    return Array.from(seen.values());
  }, [dams]);

  // Every stored reading per dam, oldest → newest (history route; falls
  // back to the readings the water route sent).
  const historyOf = useMemo(() => {
    const rows = historyData?.data && historyData.data.length > 0 ? historyData.data : dams;
    const map = new Map<string, DamReading[]>();
    for (const r of rows) {
      const list = map.get(r.damName) ?? [];
      if (!list.some((x) => x.recordedAt === r.recordedAt)) list.push(r);
      map.set(r.damName, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    return map;
  }, [historyData, dams]);

  const shownName = (d: Pick<DamReading, "damName" | "damNameLocal">) => namePair(d.damName, d.damNameLocal, locale);
  const damConfig = getDamConfig(district);
  const riverOf = (d: DamReading) =>
    damConfig?.dams.find((c) => c.name === d.damName || (d.damNameLocal && c.nameLocal === d.damNameLocal))?.river ?? null;

  // Figures for the answer, tiles and picture — each dam's latest reading.
  const newestReading = damList.reduce<string | null>((best, d) => (!best || d.recordedAt > best ? d.recordedAt : best), null);
  const withCapacity = damList.filter((d) => d.maxStorage > 0);
  const storedAll = withCapacity.reduce((s, d) => s + d.storage, 0);
  const capacityAll = withCapacity.reduce((s, d) => s + d.maxStorage, 0);
  const combinedPct = capacityAll > 0 ? (storedAll / capacityAll) * 100 : null;
  const fillingUp = damList.filter((d) => flowState(d) === "filling").length;
  const overHalf = damList.filter((d) => d.storagePct > 50).length;
  const byLevel = [...damList].sort((a, b) => b.storagePct - a.storagePct);
  const fullest = byLevel[0];
  const lowest = byLevel[byLevel.length - 1];
  const headerSource = damList[0]?.source ? { label: damList[0].source, href: portal?.href } : INDIA_WRIS;
  // Old readings are not today's levels: the numbers turn grey and carry their date and age.
  const isOld = newestReading ? isOlderThan(newestReading, MAX_AGE_HOURS, now) : false;
  const oldDays = newestReading && isOld ? ageInDays(newestReading, now) : 0;

  // Canals: coming up first (soonest first), then past releases (newest first).
  const canalDay = (c: CanalRelease) => c.scheduledDate.slice(0, 10);
  const upcoming = canals.filter((c) => canalDay(c) >= today).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const past = canals.filter((c) => canalDay(c) < today);
  const canalCards = [...upcoming, ...past];

  const halfPicture =
    damList.length <= 12
      ? { filled: overHalf, total: damList.length, label: t("halfCount", { n: overHalf, total: damList.length }) }
      : { filled: (overHalf / damList.length) * 10, total: 10, label: t("halfAbout", { n: Math.round((overHalf / damList.length) * 10) }) };

  // Chart: water in and out of each dam (needs two dams and some flow).
  const showFlows = damList.length >= 2 && damList.some((d) => d.inflow > 0 || d.outflow > 0);
  const flowRows = [...damList]
    .sort((a, b) => Math.max(b.inflow, b.outflow) - Math.max(a.inflow, a.outflow))
    .map((d) => {
      const n = shownName(d);
      return { key: d.id, name: n.primary, nameLang: n.primaryLang, inflow: d.inflow, outflow: d.outflow };
    });

  // Chart: storage over time, every dam on one chart (one point per day).
  const trend = useMemo(() => {
    const byDay = new Map<string, Record<string, number | string>>();
    damList.forEach((d, i) => {
      for (const r of historyOf.get(d.damName) ?? []) {
        const day = r.recordedAt.slice(0, 10);
        const row = byDay.get(day) ?? { day };
        row[`d${i}`] = r.storagePct; // the day's last reading wins (list is oldest → newest)
        byDay.set(day, row);
      }
    });
    return Array.from(byDay.values()).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [damList, historyOf]);
  const showTrend = trend.length >= 2;
  const trendSimple = (() => {
    if (!showTrend || !fullest) return null;
    const idx = damList.indexOf(fullest);
    const points = trend.filter((r) => typeof r[`d${idx}`] === "number");
    if (points.length < 2) return null;
    const a = Math.round(points[0][`d${idx}`] as number);
    const b = Math.round(points[points.length - 1][`d${idx}`] as number);
    const values = {
      b: bold,
      dam: shownName(fullest).primary,
      from: shortDay(String(points[0].day)),
      to: shortDay(String(points[points.length - 1].day)),
      start: pct(a),
      end: pct(b),
    };
    return a === b ? t.rich("trendSame", values) : t.rich("trendChange", values);
  })();

  const opened = openDam ? damList.find((d) => d.damName === openDam) ?? null : null;

  const shareText =
    damList.length > 0
      ? t("share", {
          district: districtName,
          list: new Intl.ListFormat(f.intl, { style: "short", type: "unit" }).format(
            damList.slice(0, 3).map((d) => t("shareItem", { dam: shownName(d).primary, pct: pct(d.storagePct, 1) })),
          ),
        })
      : t("shareEmpty", { district: districtName });

  const hasAny = !isLoading && !error && (damList.length > 0 || canals.length > 0);

  return (
    <ModulePage>
      <PageHeader
        icon={Waves}
        title={mt.label("water")}
        description={t("description")}
        backHref={base}
        freshness={{ asOf: data?.meta?.lastUpdated }}
        source={headerSource}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && damList.length === 0 && canals.length === 0 && (
        <EmptyState title={t("emptyTitle", { district: districtName })} body={t("emptyBody", { portal: portalName })} />
      )}

      {hasAny && (
        <>
          {/* 1 · The answer in plain words. */}
          {fullest && (
            <Explainer>
              {damList.length >= 2 ? (
                <>
                  {combinedPct !== null && <>{t.rich("explainerTogether", { b: bold, n: damList.length, district: districtName, pct: pct(combinedPct) })} </>}
                  {t.rich("explainerRange", {
                    b: bold,
                    fullest: shownName(fullest).primary,
                    fullestPct: pct(fullest.storagePct),
                    lowest: shownName(lowest).primary,
                    lowestPct: pct(lowest.storagePct),
                  })}
                </>
              ) : (
                t.rich("explainerOne", { b: bold, dam: shownName(fullest).primary, pct: pct(fullest.storagePct), flow: flowState(fullest) })
              )}{" "}
              {isOld && newestReading ? <>{t.rich("explainerOld", { b: bold, date: fullDay(newestReading), n: oldDays })} </> : null}
              {t("tapHint")}
            </Explainer>
          )}
          {!fullest && canals.length > 0 && <Explainer>{t("explainerCanalsOnly", { n: upcoming.length })}</Explainer>}

          {/* 2 · The big numbers, with the date they were true right above them. */}
          {newestReading && (
            <div style={{ margin: "0 0 10px" }}>
              <ReadingAge at={newestReading} maxAgeHours={MAX_AGE_HOURS} withTime now={now} />
            </div>
          )}
          <StatStrip>
            {damList.length > 0 && <StatTile label={t("tileDams")} value={f.number(damList.length)} />}
            {combinedPct !== null && (
              <StatTile
                label={t("tileStored")}
                value={f.number(Math.round(combinedPct))}
                unit="%"
                sub={t("tileStoredSub", { stored: f.number(storedAll, { maximumFractionDigits: 1 }), capacity: f.number(capacityAll, { maximumFractionDigits: 1 }) })}
              />
            )}
            {damList.length > 0 && (
              <StatTile
                label={t("tileFilling")}
                value={`${f.number(fillingUp)}/${f.number(damList.length)}`}
                sub={t("tileFillingSub")}
                countUp={false}
              />
            )}
            {canals.length > 0 && (
              <StatTile label={t("tileCanals")} value={f.number(upcoming.length)} sub={t("tileCanalsSub", { n: canals.length })} />
            )}
          </StatStrip>

          {/* 3 · The picture: all dams together as one tank, and how many are more than half full. */}
          {damList.length >= 2 && combinedPct !== null && (
            <div className="ftp-picture-row" style={{ marginTop: 16 }}>
              <Card tinted padding={18} style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                <p className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650 }}>
                  {t("halfTitle")}
                </p>
                <IconPictogram icon={Droplet} filled={halfPicture.filled} total={halfPicture.total} label={halfPicture.label} />
              </Card>
              <Card tinted padding={18} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WaterTank pct={combinedPct} label={t("tankAll")} />
              </Card>
            </div>
          )}

          {/* 4 · One tank card per dam. Tap → everything about it. */}
          {damList.length > 0 && (
            <Section title={t("damsTitle")}>
              <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "280px" }}>
                {damList.map((dam) => {
                  const n = shownName(dam);
                  const st = flowState(dam);
                  const history = historyOf.get(dam.damName) ?? [];
                  return (
                    <li key={dam.id}>
                      <TapCard onClick={() => setOpenDam(dam.damName)} label={t("detailsFor", { name: n.primary })}>
                        <span style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <WaterTank pct={dam.storagePct} label={t("tankOne")} width={78} height={100} />
                          <span style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            <h3 lang={n.primaryLang} className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, overflowWrap: "anywhere" }}>
                              {n.primary}
                            </h3>
                            {n.secondary && (
                              <span lang={n.secondaryLang} style={{ fontSize: 13, lineHeight: "18px", color: "var(--hue-deep)" }}>
                                {n.secondary}
                              </span>
                            )}
                            <span className="ftp-bignum" style={{ fontSize: 28, lineHeight: "32px", color: isOlderThan(dam.recordedAt, MAX_AGE_HOURS, now) ? "var(--ftp-text-2)" : "var(--hue-deep)" }}>
                              {pct(dam.storagePct, 1)}
                            </span>
                            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{t("fullOfCapacity")}</span>
                          </span>
                        </span>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <Chip tone={st === "filling" ? "hue" : "quiet"}>
                            {st === "filling" ? <TrendingUp size={13} aria-hidden /> : st === "emptying" ? <TrendingDown size={13} aria-hidden /> : <Equal size={13} aria-hidden />}
                            {t(`flowState.${st}`)}
                          </Chip>
                          <Sparkline values={history.map((h) => h.storagePct)} width={96} height={28} />
                        </span>
                        <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
                          {t("cardFlow", { inflow: f.number(Math.round(dam.inflow)), outflow: f.number(Math.round(dam.outflow)) })}
                        </span>
                        <ReadingAge at={dam.recordedAt} maxAgeHours={MAX_AGE_HOURS} now={now} />
                        <TapHint>{t("details")}</TapHint>
                      </TapCard>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* Canal releases: everything on the card, coming up first. */}
          {canals.length > 0 && (
            <Section title={t("canalsTitle")}>
              <p style={{ margin: "-4px 0 14px", fontSize: 14, lineHeight: "21px", color: "var(--ftp-text-2)" }}>{t("canalsIntro")}</p>
              <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, ["--ftp-grid-min" as string]: "260px" }}>
                {canalCards.map((c) => {
                  const n = namePair(c.canalName, c.canalNameLocal, locale);
                  const day = canalDay(c);
                  const status = day > today ? "soon" : day === today ? "today" : "done";
                  return (
                    <Card key={c.id} as="li" tinted={status !== "done"} padding={16}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <h3 lang={n.primaryLang} className="ftp-display" style={{ margin: 0, fontSize: 16, lineHeight: "21px", fontWeight: 650, overflowWrap: "anywhere" }}>
                              {n.primary}
                            </h3>
                            {n.secondary && (
                              <div lang={n.secondaryLang} style={{ fontSize: 13, lineHeight: "18px", color: "var(--hue-deep)" }}>
                                {n.secondary}
                              </div>
                            )}
                          </div>
                        </div>
                        <Chip tone={status === "done" ? "quiet" : "strong"}>{t(`canalStatus.${status}`)}</Chip>
                      </div>
                      <dl style={{ margin: "12px 0 0", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 12px" }}>
                        <CanalFact label={t("canalDate")} value={fullDay(c.scheduledDate)} />
                        <CanalFact label={t("canalFlow")} value={t("cusecs", { n: f.number(Math.round(c.releaseCusecs)) })} />
                        {c.duration && <CanalFact label={t("canalDuration")} value={c.duration} />}
                        {c.targetArea && <CanalFact label={t("canalArea")} value={c.targetArea} />}
                      </dl>
                    </Card>
                  );
                })}
              </ul>
            </Section>
          )}

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="water" district={district} />
          </div>

          {/* Charts, each with its one-line takeaway. */}
          {(showFlows || showTrend) && (
            <div style={fitGrid(340, { marginTop: 8 })}>
              {showFlows && (
                <ChartCard
                  title={t("flowTitle")}
                  units={t("flowUnits")}
                  simple={t.rich("flowSimple", { b: bold, n: fillingUp, total: damList.length })}
                  legend={[
                    { label: t("flowInLegend"), swatch: FLOW_IN_FILL },
                    { label: t("flowOutLegend"), swatch: FLOW_OUT_FILL },
                  ]}
                  source={headerSource}
                  asOf={newestReading}
                  table={flowRows.map((r) => ({
                    label: r.name,
                    value: t("flowRow", { inflow: f.number(Math.round(r.inflow)), outflow: f.number(Math.round(r.outflow)) }),
                  }))}
                >
                  <FlowBars rows={flowRows} />
                </ChartCard>
              )}
              {showTrend && (
                <ChartCard
                  title={t("trendAllTitle")}
                  units={t("trendUnits")}
                  simple={trendSimple}
                  legend={damList.map((d, i) => ({ label: shownName(d).primary, swatch: HUE_SHADES[i % HUE_SHADES.length] }))}
                  source={headerSource}
                  asOf={newestReading}
                  table={trend.map((r) => ({
                    label: fullDay(String(r.day)),
                    value: damList
                      .map((d, i) => (typeof r[`d${i}`] === "number" ? `${shownName(d).primary} ${pct(r[`d${i}`] as number)}` : null))
                      .filter(Boolean)
                      .join(" · "),
                  }))}
                >
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={230}>
                      <LineChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ftp-surface-2)" vertical={false} />
                        <XAxis dataKey="day" tickFormatter={(v) => shortDay(String(v))} tick={CHART_AXIS} stroke="var(--ftp-border)" interval="preserveStartEnd" minTickGap={24} />
                        <YAxis tick={CHART_AXIS} stroke="var(--ftp-border)" width={44} domain={[0, 100]} tickFormatter={(v) => pct(Number(v))} />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(v, name) => [pct(Number(v), 1), name]}
                          labelFormatter={(v) => fullDay(String(v))}
                        />
                        {damList.map((d, i) => (
                          <Line
                            key={d.id}
                            type="monotone"
                            dataKey={`d${i}`}
                            name={shownName(d).primary}
                            stroke={HUE_SHADES[i % HUE_SHADES.length]}
                            strokeWidth={2.5}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="water" />

      <div style={{ marginTop: 28 }}>
        <PageActions locale={locale} district={district} moduleSlug="water" shareText={shareText} />
      </div>

      <DamSheet
        dam={opened}
        history={opened ? historyOf.get(opened.damName) ?? [] : []}
        locale={locale}
        river={opened ? riverOf(opened) : null}
        portal={portal}
        onClose={() => setOpenDam(null)}
      />
    </ModulePage>
  );
}

/** One label + value on a canal card. */
function CanalFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dt style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{label}</dt>
      <dd style={{ margin: "2px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)", overflowWrap: "anywhere" }}>{value}</dd>
    </div>
  );
}

export default function WaterPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("water")}>
      <WaterPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
