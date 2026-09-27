/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Buses & trains — Layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Which bus or train can I take, when, and for how much?"
//  The answer, in one sentence: "24 bus routes and 6 trains are listed
//  for Mandya. The lowest bus fare listed is ₹15."
//
//  Data: useTransport() → { buses, trains }. Only active bus routes are
//  shown. Rows carry no date, so the tiles say how often the source is
//  refreshed instead of a date.
//
//  Page: header → the answer → tiles → one picture (one bus per route,
//  coloured for the biggest operator) → "Where do you want to go?" search
//  with bus / train cards (tap → a sheet with the stops, timings, fare,
//  a map link and the operator's site) → charts (kinds of buses, trains
//  on each weekday) → AI insight → news, share (sources are in the layout's verification panel).
//
//  Text: page_transport (en/kn/hi). Day names, numbers and fares go
//  through useFormat(). Operator names, bus types, places and train names
//  are data and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Bus } from "lucide-react";
import { useTransport } from "@/hooks/useRealtimeData";
import type { BusRoute, TrainSchedule } from "@/hooks/useRealtimeData";
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
} from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { IconPictogram } from "@/components/district/page-kit";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { HueDonut, topWithOther } from "@/components/district/daily-services/BreakdownVisuals";
import { fitGrid, TapCard, SearchBox, MoreButton, ActionLink, SheetNote, SheetHeading, matches, mapsUrl, usePlaceName } from "@/components/services-1/kit";
import PageEnd from "@/components/services-1/PageEnd";
import { getModuleSources, getStateConfig } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

/** Day codes as stored in TrainSchedule.daysOfWeek, Monday first. */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A date on each weekday (1 Jan 2024 was a Monday), for Intl day names. */
const dayDate = (i: number) => new Date(Date.UTC(2024, 0, 1 + i, 6, 30));

/** Does this train run on day `i` (0 = Monday)? Accepts "Mon", "Monday" or "Daily". */
function runsOn(train: TrainSchedule, i: number): boolean {
  const code = DAYS[i].toLowerCase();
  return train.daysOfWeek.some((d) => /^daily$/i.test(d.trim()) || d.slice(0, 3).toLowerCase() === code);
}

/** Up to this many routes, the picture shows one bus per route. */
const ONE_BUS_EACH_MAX = 12;
/** Cards shown before "Show all". */
const FIRST_SHOWN = 24;

/** How the source's refresh frequency maps to a message key. */
const FREQ_KEY: Record<string, string> = {
  Monthly: "monthly",
  Weekly: "weekly",
  Daily: "daily",
  Annual: "annual",
  Quarterly: "quarterly",
  "When the source publishes": "onPublish",
};

/** The stops a route lists in `via` ("Maddur, Mandya" / "A - B - C"). */
function viaStops(via: string | null | undefined): string[] {
  if (!via) return [];
  return via
    .split(/\s*(?:,|;|\||→|->|\s-\s)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Route / train number tag in the page hue. */
function NumberTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="ftp-num"
      style={{ display: "inline-block", fontSize: 13, lineHeight: "20px", padding: "2px 10px", borderRadius: 999, background: "var(--hue-tint)", color: "var(--hue-deep)" }}
    >
      {children}
    </span>
  );
}

/** Small fact on a card ("Every 10 min", "₹30"). */
function Fact({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "18px", color: "var(--ftp-text)" }}>{children}</span>;
}

/** Seven day chips; the days the train runs are filled. */
function DayChips({ days, labels, ariaLabel }: { days: number[]; labels: string[]; ariaLabel: string }) {
  return (
    <span role="img" aria-label={ariaLabel} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {DAYS.map((d, i) => {
        const runs = days.includes(i);
        return (
          <span
            key={d}
            aria-hidden
            style={{
              fontSize: 12,
              lineHeight: "22px",
              minWidth: 26,
              padding: "0 4px",
              textAlign: "center",
              borderRadius: 8,
              background: runs ? "var(--hue)" : "var(--ftp-surface-2)",
              color: runs ? "#fff" : "var(--ftp-text-2)",
              fontWeight: runs ? 700 : 400,
              opacity: runs ? 1 : 0.6,
            }}
          >
            {labels[i]}
          </span>
        );
      })}
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

/** The route as a line of stops, top to bottom: start, the listed stops, the end. */
function RouteLine({ stops }: { stops: string[] }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {stops.map((s, i) => {
        const first = i === 0;
        const last = i === stops.length - 1;
        return (
          <li key={`${s}-${i}`} style={{ display: "flex", gap: 12, alignItems: "stretch", minHeight: 36 }}>
            <span aria-hidden style={{ position: "relative", width: 18, flexShrink: 0, display: "flex", justifyContent: "center" }}>
              {!first && <span style={{ position: "absolute", top: 0, height: "50%", width: 4, background: "var(--hue-pop)" }} />}
              {!last && <span style={{ position: "absolute", bottom: 0, height: "50%", width: 4, background: "var(--hue-pop)" }} />}
              <span
                style={{
                  position: "relative",
                  alignSelf: "center",
                  width: first || last ? 18 : 12,
                  height: first || last ? 18 : 12,
                  borderRadius: "50%",
                  background: first || last ? "var(--hue)" : "#fff",
                  border: "3px solid var(--hue)",
                  boxSizing: "border-box",
                }}
              />
            </span>
            <span
              style={{
                alignSelf: "center",
                padding: "6px 0",
                fontSize: first || last ? 15 : 14,
                fontWeight: first || last ? 650 : 500,
                color: "var(--ftp-text)",
                overflowWrap: "anywhere",
              }}
            >
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type Mode = "bus" | "train";
type Open = { kind: "bus"; row: BusRoute } | { kind: "train"; row: TrainSchedule } | null;

function TransportPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_transport");
  const f = useFormat();
  const mt = useModuleText();
  const place = usePlaceName();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useTransport(district, state);

  const [mode, setMode] = useState<Mode | null>(null);
  const [operator, setOperator] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(FIRST_SHOWN);
  const [open, setOpen] = useState<Open>(null);

  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const bNum = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;
  const rupees = (n: number) => f.number(n, { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  const buses = (data?.data?.buses ?? []).filter((r) => r.active);
  const trains = data?.data?.trains ?? [];
  // Show buses first when there are any; the visitor can switch.
  const tab: Mode = mode ?? (buses.length > 0 ? "bus" : "train");

  const operators = Array.from(new Set(buses.map((r) => r.operator)));
  const freqRaw = getModuleSources("transport", state).frequency;
  const freqKey = FREQ_KEY[freqRaw];
  const refresh = t("refresh", { freq: freqKey ? t(`freq.${freqKey}`) : freqRaw.toLowerCase() });

  const listFormat = new Intl.ListFormat(f.intl, { type: "conjunction" });
  const dayShort = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "short" }));
  const dayNarrow = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "narrow" }));
  const dayLong = DAYS.map((_, i) => f.date(dayDate(i), { weekday: "long" }));
  const trainDays = (tr: TrainSchedule) => DAYS.map((_, i) => i).filter((i) => runsOn(tr, i));
  const daysText = (tr: TrainSchedule) => {
    const d = trainDays(tr);
    return d.length === 7 ? t("train.everyDay") : listFormat.format(d.map((i) => dayLong[i]));
  };

  // Fares that are listed (for the tile and the answer).
  const fares = buses.map((r) => r.fare ?? 0).filter((n) => n > 0);
  const minFare = fares.length > 0 ? Math.min(...fares) : null;
  const maxFare = fares.length > 0 ? Math.max(...fares) : null;

  // Picture: which operator runs the most of the listed routes.
  const routesByOperator = operators.map((op) => ({ op, count: buses.filter((r) => r.operator === op).length })).sort((a, c) => c.count - a.count);
  const topOperator = routesByOperator[0] ?? null;
  const oneEach = buses.length <= ONE_BUS_EACH_MAX;
  const busesTotal = oneEach ? buses.length : 10;
  const busesLit = topOperator ? (oneEach ? topOperator.count : (topOperator.count / buses.length) * 10) : 0;

  // Chart: kinds of buses (bus types are data, shown as published).
  const typeCounts = new Map<string, number>();
  buses.forEach((r) => {
    const type = r.busType?.trim();
    if (type) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  });
  const typeItems = topWithOther(
    Array.from(typeCounts, ([type, value]) => ({ key: type, label: type, value })),
    4,
    t("types.other"),
  );
  const typedTotal = typeItems.reduce((s, i) => s + i.value, 0);
  const topType = typeItems[0];

  // Chart: listed trains that run on each weekday.
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

  // The lists, after the search and the operator filter.
  const busList = buses
    .filter((r) => operator === "all" || r.operator === operator)
    .filter((r) => matches(query, r.origin, r.destination, r.via, r.routeNumber, r.operator));
  const trainList = trains.filter((tr) => matches(query, tr.trainName, tr.trainNumber, tr.origin, tr.destination, tr.stationName));
  const listed = tab === "bus" ? busList : trainList;
  const shownCount = Math.min(limit, listed.length);

  // The state transport corporation's site, only for its own routes.
  const sc = getStateConfig(state);
  const corpNames = (sc?.stateTransportName ?? "").split("/").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const corpSite = (op: string) =>
    sc?.stateTransportUrl && corpNames.some((n) => op.toLowerCase().includes(n)) ? sc.stateTransportUrl : null;

  const openBus = open?.kind === "bus" ? open.row : null;
  const openTrain = open?.kind === "train" ? open.row : null;

  return (
    <ModulePage>
      <PageHeader icon={Bus} title={mt.label("transport")} description={t("description")} backHref={base} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && buses.length === 0 && trains.length === 0 && <NoDataCard module="transport" district={district} state={state} />}

      {!isLoading && (buses.length > 0 || trains.length > 0) && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer>
            {t.rich("answer.main", {
              buses: buses.length,
              busesN: f.number(buses.length),
              trains: trains.length,
              trainsN: f.number(trains.length),
              district: districtName,
              b: bNum,
            })}{" "}
            {minFare !== null && t.rich("answer.fare", { fare: rupees(minFare), b: bNum })}
          </Explainer>

          {/* 2. Big numbers. */}
          <StatStrip>
            <StatTile label={t("tiles.buses")} value={f.number(buses.length)} sub={refresh} />
            <StatTile label={t("tiles.trains")} value={f.number(trains.length)} sub={refresh} />
            {operators.length > 0 && <StatTile label={t("tiles.operators")} value={f.number(operators.length)} sub={refresh} />}
            {minFare !== null && maxFare !== null && (
              <StatTile
                label={t("tiles.fare")}
                value={rupees(minFare)}
                sub={minFare === maxFare ? refresh : t("tiles.fareSub", { max: rupees(maxFare) })}
                countUp={false}
              />
            )}
          </StatStrip>

          {/* 3. One picture: one bus per route, coloured for the biggest operator. */}
          {topOperator && (
            <Card tinted padding={18} style={{ marginTop: 16 }}>
              <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                {t("picture.title")}
              </p>
              <IconPictogram
                icon={Bus}
                filled={busesLit}
                total={busesTotal}
                label={
                  operators.length === 1
                    ? t("picture.busesOne", { op: topOperator.op })
                    : oneEach
                      ? t("picture.busesEach", { count: topOperator.count, n: f.number(topOperator.count), op: topOperator.op })
                      : t("picture.busesScaled", { n: f.number(Math.round(busesLit)), op: topOperator.op })
                }
              />
            </Card>
          )}

          {/* 4. Find a bus or train; tap a card for the stops, times and fare. */}
          <Section title={t("list.title")}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
              <SearchBox
                id="transport-search"
                label={t("list.searchLabel")}
                placeholder={t("list.searchPlaceholder")}
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setLimit(FIRST_SHOWN);
                }}
              />
              <Chips
                label={t("list.modeAria")}
                value={tab}
                onChange={(v) => {
                  setMode(v as Mode);
                  setLimit(FIRST_SHOWN);
                }}
                items={[
                  { value: "bus", label: t("list.buses"), count: busList.length },
                  { value: "train", label: t("list.trains"), count: trainList.length },
                ]}
              />
            </div>
            {tab === "bus" && operators.length > 1 && (
              <div style={{ marginBottom: 12 }}>
                <Chips
                  label={t("list.operatorAria")}
                  value={operator}
                  onChange={(v) => {
                    setOperator(v);
                    setLimit(FIRST_SHOWN);
                  }}
                  items={[{ value: "all", label: t("list.all") }, ...operators.map((op) => ({ value: op, label: op }))]}
                />
              </div>
            )}

            {listed.length === 0 ? (
              <EmptyState
                title={query ? t("list.noMatch", { query }) : tab === "bus" ? t("list.emptyBuses") : t("list.emptyTrains")}
                body={query ? t("list.noMatchBody") : undefined}
              />
            ) : (
              <>
                <div className="ftp-grid">
                  {tab === "bus" &&
                    busList.slice(0, limit).map((r) => (
                      <TapCard
                        key={r.id}
                        title={t("route", { from: r.origin, to: r.destination })}
                        titleLang={place(r.origin).lang}
                        subtitle={r.via ? t("bus.via", { via: r.via }) : r.operator}
                        aside={r.routeNumber ? <NumberTag>{r.routeNumber}</NumberTag> : undefined}
                        hint={t("list.open")}
                        onOpen={() => setOpen({ kind: "bus", row: r })}
                      >
                        <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
                          {r.departureTime && (
                            <Fact>
                              <span className="ftp-num">{t("bus.leaves", { time: r.departureTime })}</span>
                            </Fact>
                          )}
                          {r.frequency && <Fact>{busEvery(r.frequency)}</Fact>}
                          {r.duration && <Fact>{busDuration(r.duration)}</Fact>}
                          {r.fare ? (
                            <Fact>
                              <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>
                                {rupees(r.fare)}
                              </span>
                            </Fact>
                          ) : null}
                        </span>
                      </TapCard>
                    ))}
                  {tab === "train" &&
                    trainList.slice(0, limit).map((tr) => (
                      <TapCard
                        key={tr.id}
                        title={tr.trainName}
                        subtitle={t("route", { from: tr.origin, to: tr.destination })}
                        aside={<NumberTag>{tr.trainNumber}</NumberTag>}
                        hint={t("list.open")}
                        onOpen={() => setOpen({ kind: "train", row: tr })}
                      >
                        <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
                            {t("train.station", { name: tr.stationName })}
                            {(tr.arrivalTime || tr.departureTime) && (
                              <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>
                                {" · "}
                                {[tr.arrivalTime && t("train.arr", { time: tr.arrivalTime }), tr.departureTime && t("train.dep", { time: tr.departureTime })]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </span>
                          {trainDays(tr).length > 0 && (
                            <DayChips days={trainDays(tr)} labels={dayNarrow} ariaLabel={t("train.runsOn", { days: daysText(tr) })} />
                          )}
                        </span>
                      </TapCard>
                    ))}
                </div>
                <MoreButton shown={shownCount} total={listed.length} label={t("list.showAll", { n: f.number(listed.length) })} onClick={() => setLimit(listed.length)} />
              </>
            )}
          </Section>

          {/* 5. Charts, two to a row on wide screens. */}
          {((typeItems.length >= 2 && topType) || (trains.length >= 2 && dayMax > 0)) && (
            <div style={fitGrid(340, 28)}>
              {typeItems.length >= 2 && topType && (
                <ChartCard
                  title={t("types.title")}
                  units={t("types.units")}
                  simple={t.rich("types.simple", { type: topType.label, count: f.number(topType.value), total: f.number(typedTotal), b })}
                  table={typeItems.map((i) => ({ label: i.label, value: f.number(i.value) }))}
                >
                  <HueDonut
                    items={typeItems}
                    centerValue={f.number(typedTotal)}
                    centerLabel={t("types.center", { count: typedTotal })}
                    ariaLabel={t("types.aria", { list: listFormat.format(typeItems.map((i) => `${i.label} ${f.number(i.value)}`)) })}
                  />
                </ChartCard>
              )}
              {trains.length >= 2 && dayMax > 0 && (
                <ChartCard
                  title={t("days.title")}
                  units={t("days.units")}
                  simple={
                    dayMax === dayMin
                      ? t("days.simpleSame", { n: f.number(dayMax), count: dayMax })
                      : t.rich("days.simple", { most: dayLong[mostDay], max: f.number(dayMax), least: dayLong[leastDay], min: f.number(dayMin), b })
                  }
                  table={DAYS.map((_, i) => ({ label: dayLong[i], value: f.number(dayCounts[i]) }))}
                >
                  <DayColumns
                    counts={dayCounts}
                    labels={dayShort}
                    ariaLabel={t("days.aria", { list: listFormat.format(DAYS.map((_, i) => `${dayShort[i]} ${f.number(dayCounts[i])}`)) })}
                  />
                </ChartCard>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="transport" district={district} />
          </div>
        </>
      )}

      <PageEnd
        ns="page_transport"
        module="transport"
        locale={locale}
        state={state}
        district={district}
        shareText={t("end.share", { district: districtName, buses: buses.length, trains: trains.length })}
      />

      {/* Bus sheet: stops, timings, fare. */}
      <DetailSheet
        open={openBus !== null}
        onClose={() => setOpen(null)}
        hueClassName={hueClass("transport")}
        title={openBus ? t("route", { from: openBus.origin, to: openBus.destination }) : ""}
        titleLang={openBus ? place(openBus.origin).lang : undefined}
        subtitle={openBus ? (openBus.routeNumber ? t("sheet.busNumber", { n: openBus.routeNumber, op: openBus.operator }) : openBus.operator) : undefined}
        footer={
          openBus ? (
            <>
              <ActionLink href={mapsUrl(`${openBus.origin}, ${districtName}`)} primary newTab>
                {t("sheet.map", { place: openBus.origin })}
              </ActionLink>
              {corpSite(openBus.operator) && (
                <ActionLink href={corpSite(openBus.operator) as string} newTab>
                  {t("sheet.operatorSite", { op: openBus.operator })}
                </ActionLink>
              )}
            </>
          ) : undefined
        }
      >
        {openBus && (
          <>
            <SheetNote>
              {openBus.departureTime
                ? t.rich("sheet.busLeaves", { from: openBus.origin, to: openBus.destination, time: openBus.departureTime, b })
                : openBus.frequency
                  ? t.rich("sheet.busEvery", { from: openBus.origin, to: openBus.destination, every: busEvery(openBus.frequency), b })
                  : t.rich("sheet.busGoes", { from: openBus.origin, to: openBus.destination, b })}
            </SheetNote>
            <SheetHeading>{viaStops(openBus.via).length > 0 ? t("sheet.stops") : t("sheet.ends")}</SheetHeading>
            <RouteLine stops={[openBus.origin, ...viaStops(openBus.via), openBus.destination]} />
            <DetailList
              rows={[
                { label: t("sheet.number"), value: openBus.routeNumber },
                { label: t("sheet.operator"), value: openBus.operator },
                { label: t("sheet.busType"), value: openBus.busType },
                { label: t("sheet.leavesAt"), value: openBus.departureTime ? <span className="ftp-num">{openBus.departureTime}</span> : null },
                { label: t("sheet.howOften"), value: openBus.frequency ? busEvery(openBus.frequency) : null },
                { label: t("sheet.journey"), value: openBus.duration ? busDuration(openBus.duration) : null },
                { label: t("sheet.fare"), value: openBus.fare ? rupees(openBus.fare) : null },
              ]}
            />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("sheet.checkNote")}</p>
          </>
        )}
      </DetailSheet>

      {/* Train sheet: station, times, days. */}
      <DetailSheet
        open={openTrain !== null}
        onClose={() => setOpen(null)}
        hueClassName={hueClass("transport")}
        title={openTrain?.trainName ?? ""}
        subtitle={openTrain ? t("sheet.trainNumber", { n: openTrain.trainNumber }) : undefined}
        footer={
          openTrain ? (
            <>
              <ActionLink href="https://enquiry.indianrail.gov.in/mntes/" primary newTab>
                {t("sheet.ntes")}
              </ActionLink>
              <ActionLink href={mapsUrl(`${openTrain.stationName} railway station`)} newTab>
                {t("sheet.map", { place: openTrain.stationName })}
              </ActionLink>
            </>
          ) : undefined
        }
      >
        {openTrain && (
          <>
            <SheetNote>
              {t.rich("sheet.trainStops", { station: openTrain.stationName, days: daysText(openTrain), count: trainDays(openTrain).length, b })}
            </SheetNote>
            <SheetHeading>{t("sheet.ends")}</SheetHeading>
            <RouteLine stops={[openTrain.origin, openTrain.stationName, openTrain.destination].filter((s, i, a) => a.indexOf(s) === i)} />
            {trainDays(openTrain).length > 0 && (
              <DayChips days={trainDays(openTrain)} labels={dayShort} ariaLabel={t("train.runsOn", { days: daysText(openTrain) })} />
            )}
            <DetailList
              rows={[
                { label: t("sheet.number"), value: openTrain.trainNumber },
                { label: t("sheet.fromTo"), value: t("route", { from: openTrain.origin, to: openTrain.destination }) },
                { label: t("sheet.station"), value: openTrain.stationName },
                { label: t("sheet.arrives"), value: openTrain.arrivalTime ? <span className="ftp-num">{openTrain.arrivalTime}</span> : null },
                { label: t("sheet.leaves"), value: openTrain.departureTime ? <span className="ftp-num">{openTrain.departureTime}</span> : null },
                { label: t("sheet.days"), value: trainDays(openTrain).length > 0 ? daysText(openTrain) : null },
              ]}
            />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("sheet.checkNote")}</p>
          </>
        )}
      </DetailSheet>
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
