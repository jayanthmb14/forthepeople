/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Transport — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useTransport() → { buses, trains }. Only active bus routes are
//  shown. Rows carry no timestamp, so the tiles state how often the
//  source is refreshed (from getModuleSources) instead of a date.
//
//  Pictures (built only from the routes on this page):
//    1. one bus per listed route (or ten, scaled, when there are many),
//       coloured for the routes run by the biggest operator;
//    2. a ring of the kinds of buses (Ordinary, AC, Electric …), drawn
//       when the routes use two or more kinds;
//    3. in the Trains tab, how many listed trains run on each day of the
//       week, drawn when two or more trains are listed.
//  With no bus routes the bus pictures are not drawn.
//
//  Text: every sentence comes from the "page_transport" messages; day
//  names, numbers and fares go through useFormat(). Operator names, bus
//  types, places and train names are data and stay as published.
"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Bus, Clock, MapPin, Timer } from "lucide-react";
import { useTransport } from "@/hooks/useRealtimeData";
import type { TrainSchedule } from "@/hooks/useRealtimeData";
import {
  PageHeader,
  Section,
  Card,
  Chips,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { ModulePage, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { HueDonut, topWithOther } from "@/components/district/daily-services/BreakdownVisuals";
import { useDistrictName } from "@/components/district/daily-services/district-name";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { useFormat, useModuleText } from "@/i18n/client";

/** Day codes as stored in TrainSchedule.daysOfWeek, Monday first. */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A date on each weekday (1 Jan 2024 was a Monday), for Intl day names. */
const dayDate = (i: number) => new Date(Date.UTC(2024, 0, 1 + i, 6, 30));

/** Does this train run on day `i` (0 = Monday)? Accepts "Mon" or "Monday". */
function runsOn(train: TrainSchedule, i: number): boolean {
  const code = DAYS[i].toLowerCase();
  return train.daysOfWeek.some((d) => d.slice(0, 3).toLowerCase() === code);
}

/** Up to this many routes, the picture shows one bus per route. */
const ONE_BUS_EACH_MAX = 12;

/** How the source's refresh frequency maps to a message key. */
const FREQ_KEY: Record<string, string> = {
  Monthly: "monthly",
  Weekly: "weekly",
  Daily: "daily",
  Annual: "annual",
  Quarterly: "quarterly",
  "When the source publishes": "onPublish",
};

/** Route / train number tag in the page hue (tint, not a filled block). */
function NumberTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="ftp-num"
      style={{
        fontSize: 12,
        lineHeight: "18px",
        padding: "1px 8px",
        borderRadius: 999,
        background: "var(--hue-tint)",
        color: "var(--hue-deep)",
      }}
    >
      {children}
    </span>
  );
}

/** A small meta line item (icon + text) under a route. */
function Meta({ icon: Icon, children }: { icon?: typeof Clock; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text)" }}>
      {Icon && <Icon size={12} aria-hidden style={{ color: "var(--hue)" }} />}
      {children}
    </span>
  );
}

/** Emoji chip on the left of a route card. */
function RouteChip({ emoji }: { emoji: string }) {
  return (
    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 12 }}>
      {emoji}
    </span>
  );
}

/**
 * DayColumns — seven columns, one per weekday, each as tall as the number
 * of listed trains that run that day. The biggest day is the full height.
 */
function DayColumns({ counts, labels, ariaLabel }: { counts: number[]; labels: string[]; ariaLabel: string }) {
  const f = useFormat();
  const max = Math.max(...counts);
  const BAR = 110;
  return (
    <div role="img" aria-label={ariaLabel} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8, alignItems: "end" }}>
      {counts.map((n, i) => (
        <div key={DAYS[i]} aria-hidden style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span className="ftp-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--hue-deep)" }}>
            {f.number(n)}
          </span>
          <div style={{ width: "100%", maxWidth: 40, height: BAR, display: "flex", alignItems: "flex-end" }}>
            <div
              className="ftp-grow-y"
              style={{
                width: "100%",
                height: Math.max(4, max > 0 ? (n / max) * BAR : 0),
                borderRadius: "10px 10px 4px 4px",
                background: n === max ? "linear-gradient(180deg, var(--hue), var(--hue-deep))" : "linear-gradient(180deg, var(--hue-pop), var(--hue))",
                ["--i" as string]: i,
              }}
            />
          </div>
          <span style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ftp-text-2)" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function TransportPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_transport");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useTransport(district, state);
  const [tab, setTab] = useState<"bus" | "train">("bus");
  const [busFilter, setBusFilter] = useState("all");

  const buses = (data?.data?.buses ?? []).filter((b) => b.active);
  const trains = data?.data?.trains ?? [];

  const operators = Array.from(new Set(buses.map((b) => b.operator)));
  const filteredBuses = busFilter === "all" ? buses : buses.filter((b) => b.operator === busFilter);
  const freqRaw = getModuleSources("transport", state).frequency;
  const freqKey = FREQ_KEY[freqRaw];
  const refresh = t("refresh", { freq: freqKey ? t(`freq.${freqKey}`) : freqRaw.toLowerCase() });

  const listFormat = new Intl.ListFormat(f.intl, { type: "conjunction" });
  const dayShort = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "short" }));
  const dayNarrow = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "narrow" }));
  const dayLong = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "long" }));

  // Picture 1: which operator runs the most of the listed routes.
  const routesByOperator = operators
    .map((op) => ({ op, count: buses.filter((b) => b.operator === op).length }))
    .sort((a, b) => b.count - a.count);
  const topOperator = routesByOperator[0] ?? null;
  const oneEach = buses.length <= ONE_BUS_EACH_MAX;
  const busesTotal = oneEach ? buses.length : 10;
  const busesLit = topOperator ? (oneEach ? topOperator.count : (topOperator.count / buses.length) * 10) : 0;
  const busesLabel = !topOperator
    ? ""
    : operators.length === 1
      ? t("picture.busesOne", { op: topOperator.op })
      : oneEach
        ? t("picture.busesEach", { count: topOperator.count, op: topOperator.op })
        : t("picture.busesScaled", { n: Math.round(busesLit), op: topOperator.op });

  // Picture 2: kinds of buses (bus types are data, shown as published).
  const typeCounts = new Map<string, number>();
  buses.forEach((b) => {
    const type = b.busType?.trim();
    if (type) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  });
  const typeItems = topWithOther(
    Array.from(typeCounts, ([type, value]) => ({ key: type, label: type, value })),
    4,
    t("types.other"),
  );
  const typedTotal = typeItems.reduce((s, i) => s + i.value, 0);
  const topType = typeItems[0];

  // Picture 3: listed trains that run on each weekday.
  const dayCounts = DAYS.map((_, i) => trains.filter((tr) => runsOn(tr, i)).length);
  const dayMax = Math.max(0, ...dayCounts);
  const dayMin = Math.min(...dayCounts);
  const mostDay = dayCounts.indexOf(dayMax);
  const leastDay = dayCounts.indexOf(dayMin);

  /** "30 min" / "Every 30 min" → "Every 30 min" in the page language; anything else as published. */
  const busEvery = (freq: string) => {
    const m = /^(?:every\s+)?(\d+)\s*(?:min|mins|minutes)\.?$/i.exec(freq.trim());
    if (m) return t("bus.everyMin", { n: f.number(Number(m[1])) });
    return /^every\s/i.test(freq) ? freq : t("bus.every", { freq });
  };
  /** "6 hours" / "45 min" → localised; anything else as published. */
  const busDuration = (d: string) => {
    const h = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\.?$/i.exec(d.trim());
    if (h) return t("bus.hours", { n: f.number(Number(h[1])) });
    const m = /^(\d+)\s*(?:min|mins|minutes)\.?$/i.exec(d.trim());
    if (m) return t("bus.minutes", { n: f.number(Number(m[1])) });
    return d;
  };

  const listStyle = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: 8 };
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  return (
    <ModulePage>
      <PageHeader
        icon={Bus}
        title={t("title")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("transport")}
      />

      <AIInsightCard module="transport" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && buses.length === 0 && trains.length === 0 && (
        <NoDataCard module="transport" district={district} state={state} />
      )}

      {!isLoading && (buses.length > 0 || trains.length > 0) && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🚌" label={t("tiles.buses")} value={f.number(buses.length)} sub={refresh} />
            <StatTile emoji="🚆" label={t("tiles.trains")} value={f.number(trains.length)} sub={refresh} />
            <StatTile emoji="🏢" label={t("tiles.operators")} value={f.number(operators.length)} sub={refresh} />
          </StatStrip>

          {/* Picture 1: coloured buses are routes run by the biggest operator. */}
          {topOperator && (
            <Card tinted padding={18} style={{ marginTop: 16 }}>
              <Explainer emoji="🚏">
                {operators.length === 1
                  ? t.rich("picture.simpleOne", { n: f.number(buses.length), count: buses.length, op: topOperator.op, b: bNum })
                  : t.rich("picture.simpleMany", {
                      op: topOperator.op,
                      count: f.number(topOperator.count),
                      total: f.number(buses.length),
                      b: bNum,
                    })}
              </Explainer>
              <Pictogram filled={busesLit} total={busesTotal} emoji="🚌" label={busesLabel} />
            </Card>
          )}

          {/* Picture 2: kinds of buses, when there are two or more kinds. */}
          {typeItems.length >= 2 && topType && (
            <div style={{ marginTop: 24 }}>
              <ChartCard
                title={t("types.title")}
                emoji="🚍"
                units={t("types.units")}
                simple={t.rich("types.simple", {
                  type: topType.label,
                  count: f.number(topType.value),
                  total: f.number(typedTotal),
                  b,
                })}
                table={typeItems.map((i) => ({ label: i.label, value: f.number(i.value) }))}
              >
                <HueDonut
                  items={typeItems}
                  centerValue={f.number(typedTotal)}
                  centerLabel={t("types.center", { count: typedTotal })}
                  ariaLabel={t("types.aria", { list: listFormat.format(typeItems.map((i) => `${i.label} ${f.number(i.value)}`)) })}
                />
              </ChartCard>
            </div>
          )}

          <Section title={t("timetables")} emoji="🕒">
            {/* Bus / train switch. */}
            <Chips
              label={t("modeAria")}
              value={tab}
              onChange={(v) => setTab(v as "bus" | "train")}
              items={[
                { value: "bus", label: t("buses"), count: buses.length },
                { value: "train", label: t("trains"), count: trains.length },
              ]}
            />

            {tab === "bus" && (
              <div style={{ marginTop: 12 }}>
                {operators.length > 1 && (
                  <div style={{ marginBottom: 12 }}>
                    <Chips
                      label={t("operatorAria")}
                      value={busFilter}
                      onChange={setBusFilter}
                      items={[{ value: "all", label: t("all") }, ...operators.map((op) => ({ value: op, label: op }))]}
                    />
                  </div>
                )}
                {filteredBuses.length === 0 ? (
                  <EmptyState emoji="🚌" title={t("emptyBuses")} />
                ) : (
                  <ul style={listStyle}>
                    {filteredBuses.map((bus) => (
                      <Card key={bus.id} as="li" padding={14}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <RouteChip emoji="🚌" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              {bus.routeNumber && <NumberTag>{bus.routeNumber}</NumberTag>}
                              <span className="ftp-title">
                                {bus.origin} → {bus.destination}
                              </span>
                            </div>
                            {bus.via && <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("bus.via", { via: bus.via })}</div>}
                          </div>
                          <div style={{ textAlign: "end", flexShrink: 0, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                            <div>{bus.operator}</div>
                            <div>{bus.busType}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", paddingInlineStart: 48 }}>
                          {bus.departureTime && (
                            <Meta icon={Clock}>
                              <span className="ftp-num">{bus.departureTime}</span>
                            </Meta>
                          )}
                          {bus.frequency && <Meta>{busEvery(bus.frequency)}</Meta>}
                          {bus.duration && <Meta icon={Timer}>{busDuration(bus.duration)}</Meta>}
                          {bus.fare ? (
                            <Meta>
                              <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                                {f.number(bus.fare, { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                              </span>
                            </Meta>
                          ) : null}
                        </div>
                      </Card>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "train" && (
              <div style={{ marginTop: 12 }}>
                {trains.length === 0 ? (
                  <EmptyState emoji="🚆" title={t("emptyTrains")} />
                ) : (
                  <>
                    {/* Picture 3: trains on each day, with two or more trains. */}
                    {trains.length >= 2 && dayMax > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <ChartCard
                          title={t("days.title")}
                          emoji="📅"
                          units={t("days.units")}
                          simple={
                            dayMax === dayMin
                              ? t("days.simpleSame", { n: f.number(dayMax), count: dayMax })
                              : t.rich("days.simple", {
                                  most: dayLong[mostDay],
                                  max: f.number(dayMax),
                                  least: dayLong[leastDay],
                                  min: f.number(dayMin),
                                  b,
                                })
                          }
                          table={DAYS.map((d, i) => ({ label: dayLong[i], value: f.number(dayCounts[i]) }))}
                        >
                          <DayColumns
                            counts={dayCounts}
                            labels={dayShort}
                            ariaLabel={t("days.aria", { list: listFormat.format(DAYS.map((_, i) => `${dayShort[i]} ${f.number(dayCounts[i])}`)) })}
                          />
                        </ChartCard>
                      </div>
                    )}
                    <ul style={listStyle}>
                      {trains.map((tr) => {
                        const runDays = DAYS.map((_, i) => i).filter((i) => runsOn(tr, i));
                        return (
                          <Card key={tr.id} as="li" padding={14}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <RouteChip emoji="🚆" />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                  <NumberTag>{tr.trainNumber}</NumberTag>
                                  <span className="ftp-title">{tr.trainName}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)", marginTop: 2 }}>
                                  <MapPin size={12} aria-hidden />
                                  {tr.origin} → {tr.destination}
                                </div>
                                <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{t("train.station", { name: tr.stationName })}</div>
                              </div>
                              <div className="ftp-num" style={{ textAlign: "end", flexShrink: 0, fontSize: 13, lineHeight: 1.55 }}>
                                {tr.arrivalTime && <div>{t("train.arr", { time: tr.arrivalTime })}</div>}
                                {tr.departureTime && <div>{t("train.dep", { time: tr.departureTime })}</div>}
                              </div>
                            </div>
                            {runDays.length > 0 && (
                              <div
                                role="img"
                                aria-label={t("train.runsOn", { days: listFormat.format(runDays.map((i) => dayLong[i])) })}
                                style={{ display: "flex", gap: 4, marginTop: 8, paddingInlineStart: 48 }}
                              >
                                {DAYS.map((d, i) => {
                                  const runs = runDays.includes(i);
                                  return (
                                    <span
                                      key={d}
                                      aria-hidden
                                      style={{
                                        fontSize: 11,
                                        lineHeight: "20px",
                                        minWidth: 22,
                                        padding: "0 3px",
                                        textAlign: "center",
                                        borderRadius: 7,
                                        background: runs ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                                        color: runs ? "var(--hue-deep)" : "var(--ftp-text-2)",
                                        fontWeight: runs ? 700 : 400,
                                        opacity: runs ? 1 : 0.6,
                                      }}
                                    >
                                      {dayNarrow[i]}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}
          </Section>
        </>
      )}

      <ModuleSources module="transport" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="transport" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="transport"
        moduleLabel={mt.label("transport")}
        shareText={t("share", { district: districtName, buses: buses.length, trains: trains.length })}
      />
    </ModulePage>
  );
}

export default function TransportPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("transport")}>
      <TransportPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
