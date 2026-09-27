/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Power cuts — Layout v4.1 (docs/LAYOUT.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  The question: "Is the power off in my area now, or will it be soon?"
//  The answer, in one sentence: "Right now 2 power cuts are going on in
//  Mandya; 3 more are planned." — or "No power cut is going on …".
//
//  Data: the 30 newest outage notices (/api/data/power; notices taken
//  from news are left out by the API). Each row: area, kind (planned /
//  unplanned), reason, start, end, the notice's own length text, source,
//  active flag and when we added it. There is no household count in the
//  table, so the page never shows one.
//
//  Status is worked out against the clock, refreshed every minute:
//    coming up  start is in the future
//    on now     started, and the end is in the future (or no end yet,
//               still active and started less than 24 h ago)
//    over       the end has passed, or the notice is no longer active
//    unclear    no end time, still marked active, started over 24 h ago
//  Nothing says "Live": each card shows the notice's own times.
//
//  Page: header → the answer → 4 tiles → one picture (the week around
//  today, or bulbs when no notice is near today) → "Is my area affected?"
//  search + cards (tap → sheet) → charts → AI insight → sources, share.
//
//  Text: page_power (en/kn/hi). Area names, reasons and sources are data
//  and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { useDistrictData } from "@/hooks/useDistrictData";
import {
  ModulePage,
  PageHeader,
  Section,
  Card,
  Chips,
  Pill,
  StatTile,
  StatStrip,
  LoadingShell,
  ErrorBlock,
  EmptyState,
} from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { RankBars } from "@/components/district/daily-services/BreakdownVisuals";
import { TapCard, SearchBox, MoreButton, ActionLink, SheetNote, matches, useNow, usePlaceName } from "@/components/services-1/kit";
import PageEnd from "@/components/services-1/PageEnd";
import { getStateConfig } from "@/lib/constants/state-config";
import { hueClass } from "@/lib/design/hues";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";

/** One outage notice as the API returns it (the Prisma PowerOutage row). */
interface Outage {
  id: string;
  area: string;
  type?: string | null;
  reason?: string | null;
  startTime: string;
  endTime?: string | null;
  duration?: string | null;
  source?: string | null;
  active?: boolean;
  createdAt?: string | null;
}

type Status = "now" | "soon" | "over" | "unclear";
type Filter = "all" | Status;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Cards shown before "Show all". */
const FIRST_SHOWN = 24;
/** Up to this many notices, the bulb picture shows one bulb per notice. */
const ONE_BULB_EACH_MAX = 12;
/** Bars in each chart. */
const BARS_SHOWN = 5;

const STATUS_EMOJI: Record<Status, string> = { now: "🔌", soon: "🗓️", over: "💡", unclear: "❔" };
const STATUS_TONE: Record<Status, Tone> = { now: "warn", soon: "brand", over: "live", unclear: "neutral" };
const STATUS_ORDER: Record<Status, number> = { now: 0, soon: 1, unclear: 2, over: 3 };

/** Where this notice stands at `now` (see the header comment). `now` 0 = not known yet. */
function statusOf(o: Outage, now: number): Status {
  if (!now) return "unclear";
  const s = Date.parse(o.startTime);
  const e = o.endTime ? Date.parse(o.endTime) : NaN;
  if (s > now) return "soon";
  if (!Number.isNaN(e)) return e > now ? "now" : "over";
  if (o.active === false) return "over";
  return now - s < DAY ? "now" : "unclear";
}

/** Hours without power: from the start and end times, else from the notice's own text ("8 hours"). */
function hoursOf(o: Outage): number | null {
  if (o.endTime) {
    const h = (Date.parse(o.endTime) - Date.parse(o.startTime)) / HOUR;
    if (Number.isFinite(h) && h > 0) return h;
  }
  const text = (o.duration ?? "").trim();
  const h = /^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i.exec(text);
  if (h) return Number(h[1]);
  const m = /^(\d+)\s*(?:min|mins|minutes)\b/i.exec(text);
  if (m) return Number(m[1]) / 60;
  return null;
}

/** Planned / unplanned from the notice's own word, or null when it is something else. */
function kindOf(o: Outage): "planned" | "unplanned" | null {
  const k = (o.type ?? "").toLowerCase();
  if (/unplanned|unscheduled|emergency|breakdown/.test(k)) return "unplanned";
  if (/planned|scheduled|maintenance/.test(k)) return "planned";
  return null;
}

/** Day key in India time ("2026-09-27"), for grouping only — never shown. */
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
const dayKey = (ms: number) => DAY_KEY.format(new Date(ms));

function PowerPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_power");
  const f = useFormat();
  const mt = useModuleText();
  const place = usePlaceName();
  const districtName = useDistrictName(state, district);
  const base = `/${locale}/${state}/${district}`;
  const now = useNow();
  const { data, isLoading, error } = useDistrictData<Outage[]>("power", district, state);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(FIRST_SHOWN);
  const [openId, setOpenId] = useState<string | null>(null);

  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const hours = (h: number) => f.number(h, { maximumFractionDigits: 1 });
  const day = (iso: string) => f.date(iso, { day: "numeric", month: "short" });
  const dayYear = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const clock = (iso: string) => f.time(iso, { hour: "numeric", minute: "2-digit" });

  const outages = data?.data ?? [];
  const withStatus = outages.map((o) => ({ o, status: statusOf(o, now), h: hoursOf(o), kind: kindOf(o) }));
  const byStatus = (s: Status) => withStatus.filter((x) => x.status === s);
  const onNow = byStatus("now");
  const soon = byStatus("soon").sort((a, c) => Date.parse(a.o.startTime) - Date.parse(c.o.startTime));
  const over = byStatus("over");
  const unclear = byStatus("unclear");
  const lengths = withStatus.filter((x) => x.status === "over" && x.h !== null).map((x) => x.h as number);
  const avgHours = lengths.length > 0 ? lengths.reduce((s, h) => s + h, 0) / lengths.length : null;

  // Newest notice we hold — the "as of" for the header and tiles.
  const newest = outages.reduce<string | null>((m, o) => {
    const stamp = o.createdAt ?? o.startTime;
    return !m || stamp > m ? stamp : m;
  }, null);

  // "Is my area affected?" — the answer for what was typed.
  const q = query.trim();
  const hits = q ? withStatus.filter((x) => matches(q, x.o.area, x.o.reason)) : [];
  const hitNow = hits.find((x) => x.status === "now");
  const hitSoon = hits.filter((x) => x.status === "soon").sort((a, c) => Date.parse(a.o.startTime) - Date.parse(c.o.startTime))[0];
  const hitLast = hits.filter((x) => x.status === "over" || x.status === "unclear").sort((a, c) => c.o.startTime.localeCompare(a.o.startTime))[0];

  // The list: filter chip + search, on-now first, then coming up, then the rest.
  const listed = withStatus
    .filter((x) => filter === "all" || x.status === filter)
    .filter((x) => !q || matches(q, x.o.area, x.o.reason))
    .sort((a, c) => {
      const d = STATUS_ORDER[a.status] - STATUS_ORDER[c.status];
      if (d !== 0) return d;
      return a.status === "soon" ? a.o.startTime.localeCompare(c.o.startTime) : c.o.startTime.localeCompare(a.o.startTime);
    });
  const shown = listed.slice(0, limit);
  const open = withStatus.find((x) => x.o.id === openId) ?? null;

  // Picture: the week around today, when a notice falls in it; else bulbs.
  const weekDays = now ? Array.from({ length: 7 }, (_, i) => now + (i - 3) * DAY) : [];
  const perDay = new Map<string, number>();
  outages.forEach((o) => perDay.set(dayKey(Date.parse(o.startTime)), (perDay.get(dayKey(Date.parse(o.startTime))) ?? 0) + 1));
  const weekCounts = weekDays.map((ms) => perDay.get(dayKey(ms)) ?? 0);
  const showWeek = weekCounts.some((n) => n > 0);
  const ended = over.length;
  const oneEach = outages.length <= ONE_BULB_EACH_MAX;
  const bulbsTotal = oneEach ? outages.length : 10;
  const bulbsLit = oneEach ? ended : (ended / Math.max(1, outages.length)) * 10;

  // Charts: the longest cuts that are over, and the areas named most often.
  const longest = withStatus
    .filter((x) => x.status === "over" && (x.h ?? 0) > 0)
    .sort((a, c) => (c.h ?? 0) - (a.h ?? 0))
    .slice(0, BARS_SHOWN)
    .map((x) => ({ key: x.o.id, label: x.o.area, sub: dayYear(x.o.startTime), value: x.h ?? 0, display: t("hoursShort", { h: hours(x.h ?? 0) }) }));
  const areaCount = new Map<string, number>();
  outages.forEach((o) => areaCount.set(o.area, (areaCount.get(o.area) ?? 0) + 1));
  const repeated = Array.from(areaCount, ([area, n]) => ({ key: area, label: area, value: n }))
    .filter((a) => a.value >= 2)
    .sort((a, c) => c.value - a.value)
    .slice(0, BARS_SHOWN);

  const sc = getStateConfig(state);
  const discomUrl = sc?.discomPortalUrl ?? null;
  const discomName = sc?.discomName ?? t("sheet.discomFallback");

  /** "24 Mar, 9:00 am to 5:00 pm" / "from 24 Mar, 9:00 am". */
  const span = (o: Outage) => {
    if (!o.endTime) return t("span.from", { day: day(o.startTime), start: clock(o.startTime) });
    const sameDay = dayKey(Date.parse(o.startTime)) === dayKey(Date.parse(o.endTime));
    return sameDay
      ? t("span.sameDay", { day: day(o.startTime), start: clock(o.startTime), end: clock(o.endTime) })
      : t("span.twoDays", { day: day(o.startTime), start: clock(o.startTime), endDay: day(o.endTime), end: clock(o.endTime) });
  };

  return (
    <ModulePage>
      <PageHeader
        icon={Zap}
        title={mt.label("power")}
        description={t("description")}
        backHref={base}
        freshness={newest ? { asOf: newest } : undefined}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && outages.length === 0 && <NoDataCard module="power" district={district} state={state} />}

      {!isLoading && outages.length > 0 && (
        <>
          {/* 1. The answer in one sentence. */}
          <Explainer emoji={onNow.length > 0 ? "🔌" : "💡"}>
            {onNow.length > 0
              ? t.rich("answer.now", { count: onNow.length, n: f.number(onNow.length), district: districtName, b })
              : t.rich("answer.noneNow", { district: districtName, b })}{" "}
            {soon.length > 0
              ? t.rich("answer.next", { count: soon.length, n: f.number(soon.length), area: soon[0].o.area, day: day(soon[0].o.startTime), b })
              : newest
                ? t("answer.newest", { day: dayYear(newest) })
                : null}
          </Explainer>

          {/* 2. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile emoji="🔌" label={t("tiles.now")} value={f.number(onNow.length)} asOf={newest} />
            <StatTile emoji="🗓️" label={t("tiles.soon")} value={f.number(soon.length)} asOf={newest} />
            <StatTile
              emoji="✅"
              label={t("tiles.over")}
              value={f.number(over.length)}
              sub={t("tiles.overSub", { n: f.number(outages.length) })}
              asOf={newest}
            />
            <StatTile
              emoji="⏱️"
              label={t("tiles.avg")}
              value={avgHours !== null ? hours(avgHours) : "—"}
              unit={avgHours !== null ? t("tiles.hoursUnit") : undefined}
              sub={avgHours !== null ? undefined : t("tiles.avgNone")}
              asOf={newest}
            />
          </StatStrip>

          {/* 3. One picture. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            {showWeek ? (
              <figure style={{ margin: 0 }}>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("week.title")}
                </p>
                <ol
                  aria-label={t("week.aria")}
                  style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}
                >
                  {weekDays.map((ms, i) => {
                    const n = weekCounts[i];
                    const isToday = i === 3;
                    return (
                      <li
                        key={ms}
                        aria-label={t("week.dayAria", { day: f.date(ms, { weekday: "long", day: "numeric", month: "short" }), count: n, n: f.number(n) })}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 4,
                          padding: "8px 2px",
                          borderRadius: 12,
                          minWidth: 0,
                          background: isToday ? "var(--hue)" : n > 0 ? "var(--ftp-surface)" : "color-mix(in srgb, var(--hue-tint) 60%, #fff)",
                          color: isToday ? "#fff" : "var(--ftp-text)",
                          border: n > 0 && !isToday ? "1px solid color-mix(in srgb, var(--hue) 40%, var(--ftp-border))" : "1px solid transparent",
                        }}
                      >
                        <span aria-hidden style={{ fontSize: 11, lineHeight: "14px", fontWeight: 600, opacity: 0.85 }}>
                          {isToday ? t("week.today") : f.date(ms, { weekday: "short" })}
                        </span>
                        <span aria-hidden className="ftp-num" style={{ fontSize: 15, lineHeight: "18px" }}>
                          {f.date(ms, { day: "numeric" })}
                        </span>
                        <span aria-hidden className="ftp-emoji" style={{ fontSize: 18, lineHeight: "22px" }}>
                          {n > 0 ? "⚡" : "💡"}
                        </span>
                        <span aria-hidden className="ftp-num" style={{ fontSize: 12, lineHeight: "14px", minHeight: 14 }}>
                          {n > 0 ? f.number(n) : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <figcaption style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 10, fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
                  <span>
                    <span className="ftp-emoji" aria-hidden>⚡ </span>
                    {t("week.legendCut")}
                  </span>
                  <span>
                    <span className="ftp-emoji" aria-hidden>💡 </span>
                    {t("week.legendNone")}
                  </span>
                </figcaption>
              </figure>
            ) : (
              <>
                <p className="ftp-display" style={{ margin: "0 0 12px", fontSize: 17, lineHeight: 1.35, fontWeight: 650 }}>
                  {t("bulbs.title")}
                </p>
                <Pictogram
                  filled={bulbsLit}
                  total={bulbsTotal}
                  emoji="💡"
                  label={
                    oneEach
                      ? t("bulbs.each", { ended: f.number(ended), total: f.number(outages.length) })
                      : t("bulbs.scaled", { n: f.number(Math.round(bulbsLit)) })
                  }
                />
              </>
            )}
          </Card>

          {/* 4. "Is my area affected?" and every notice as a card. */}
          <Section title={t("list.title")} emoji="📍">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
              <SearchBox
                id="power-search"
                label={t("list.searchLabel")}
                placeholder={t("list.searchPlaceholder")}
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setLimit(FIRST_SHOWN);
                }}
              />
              <Chips
                label={t("list.filterAria")}
                value={filter}
                onChange={(v) => {
                  setFilter(v as Filter);
                  setLimit(FIRST_SHOWN);
                }}
                items={[
                  { value: "all", label: t("list.all"), count: outages.length },
                  ...(["now", "soon", "over", "unclear"] as Status[])
                    .filter((s) => withStatus.some((x) => x.status === s))
                    .map((s) => ({ value: s, label: t(`status.${s}`), count: byStatus(s).length })),
                ]}
              />
            </div>

            {/* The plain answer for the area typed. */}
            {q && (
              <div style={{ marginBottom: 14 }}>
                <SheetNote emoji={hitNow ? "🔌" : hitSoon ? "🗓️" : "💡"}>
                  {hitNow
                    ? t.rich("check.now", { area: hitNow.o.area, b })
                    : hitSoon
                      ? t.rich("check.soon", { area: hitSoon.o.area, when: span(hitSoon.o), b })
                      : hitLast
                        ? t.rich("check.lastOnly", { query: q, day: dayYear(hitLast.o.startTime), b })
                        : t.rich("check.none", { query: q, b })}
                </SheetNote>
              </div>
            )}

            {listed.length === 0 ? (
              !q && <EmptyState emoji="💡" title={t("list.emptyFilter")} />
            ) : (
              <>
                <div className="ftp-grid">
                  {shown.map(({ o, status, h, kind }) => (
                    <TapCard
                      key={o.id}
                      emoji={STATUS_EMOJI[status]}
                      title={o.area}
                      titleLang={place(o.area).lang}
                      subtitle={<span className="ftp-num" suppressHydrationWarning>{span(o)}</span>}
                      aside={<Pill tone={STATUS_TONE[status]} dot={status === "now"}>{t(`status.${status}`)}</Pill>}
                      hint={t("list.open")}
                      onOpen={() => setOpenId(o.id)}
                      tone={status === "now" ? "alert" : undefined}
                    >
                      <span style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
                        {kind && <span>{t(`kind.${kind}`)}</span>}
                        {h !== null && <span className="ftp-num">{t("card.length", { h: hours(h) })}</span>}
                        {o.reason && (
                          <span style={{ flexBasis: "100%", overflowWrap: "anywhere" }}>{t("card.reason", { reason: o.reason })}</span>
                        )}
                      </span>
                    </TapCard>
                  ))}
                </div>
                <MoreButton shown={shown.length} total={listed.length} label={t("list.showAll", { n: f.number(listed.length) })} onClick={() => setLimit(listed.length)} />
              </>
            )}
            {onNow.length === 0 && soon.length === 0 && !q && (
              <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("list.unannounced")}</p>
            )}
          </Section>

          {/* 5. Charts, two to a row on wide screens. */}
          {(longest.length >= 2 || (repeated.length >= 2)) && (
            <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "380px", marginTop: 28 }}>
              {longest.length >= 2 && (
                <ChartCard
                  title={t("longest.title")}
                  emoji="⏳"
                  units={t("longest.units")}
                  simple={t.rich("longest.simple", { area: longest[0].label, hours: hours(longest[0].value), b })}
                  asOf={newest}
                  table={longest.map((l) => ({ label: `${l.label}, ${l.sub}`, value: l.display }))}
                >
                  <RankBars items={longest} ariaLabel={t("longest.title")} />
                </ChartCard>
              )}
              {repeated.length >= 2 && (
                <ChartCard
                  title={t("repeat.title")}
                  emoji="🔁"
                  units={t("repeat.units")}
                  simple={t.rich("repeat.simple", { area: repeated[0].label, n: f.number(repeated[0].value), b })}
                  asOf={newest}
                  table={repeated.map((r) => ({ label: r.label, value: f.number(r.value) }))}
                >
                  <RankBars items={repeated} ariaLabel={t("repeat.title")} />
                </ChartCard>
              )}
            </div>
          )}

          {unclear.length > 0 && (
            <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>
              {t("unclearNote", { count: unclear.length, n: f.number(unclear.length) })}
            </p>
          )}

          <div style={{ marginTop: 24 }}>
            <AIInsightCard module="power" district={district} />
          </div>
        </>
      )}

      <PageEnd
        ns="page_power"
        module="power"
        locale={locale}
        state={state}
        district={district}
        shareText={
          outages.length > 0
            ? t("end.shareWithData", { district: districtName, now: onNow.length, soon: soon.length })
            : t("end.shareNoData", { district: districtName })
        }
      />

      {/* The sheet: everything about one notice. */}
      <DetailSheet
        open={open !== null}
        onClose={() => setOpenId(null)}
        hueClassName={hueClass("power")}
        emoji="⚡"
        title={open?.o.area ?? ""}
        titleLang={open ? place(open.o.area).lang : undefined}
        subtitle={open ? t(`status.${open.status}`) : undefined}
        footer={
          discomUrl ? (
            <ActionLink href={discomUrl} emoji="🔗" primary newTab>
              {t("sheet.discomSite", { discom: discomName })}
            </ActionLink>
          ) : undefined
        }
      >
        {open && (
          <>
            <SheetNote emoji={STATUS_EMOJI[open.status]}>
              {open.status === "now"
                ? open.o.endTime
                  ? t.rich("sheet.nowUntil", { end: `${day(open.o.endTime)}, ${clock(open.o.endTime)}`, b })
                  : t("sheet.nowNoEnd")
                : open.status === "soon"
                  ? t.rich("sheet.soon", { when: span(open.o), b })
                  : open.status === "over"
                    ? open.h !== null
                      ? t.rich("sheet.overFor", { h: hours(open.h), b })
                      : t("sheet.over")
                    : t("sheet.unclear")}
            </SheetNote>
            <DetailList
              rows={[
                { emoji: "🕘", label: t("sheet.from"), value: `${dayYear(open.o.startTime)}, ${clock(open.o.startTime)}` },
                { emoji: "🕔", label: t("sheet.to"), value: open.o.endTime ? `${dayYear(open.o.endTime)}, ${clock(open.o.endTime)}` : t("sheet.noEnd") },
                { emoji: "⏱️", label: t("sheet.length"), value: open.h !== null ? t("card.length", { h: hours(open.h) }) : null },
                { emoji: "🛠️", label: t("sheet.reason"), value: open.o.reason },
                { emoji: "🏷️", label: t("sheet.kind"), value: open.kind ? t(`kind.${open.kind}`) : open.o.type },
                { emoji: "📄", label: t("sheet.source"), value: open.o.source },
                { emoji: "🗓️", label: t("sheet.added"), value: open.o.createdAt ? dayYear(open.o.createdAt) : null },
              ]}
            />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>{t("sheet.note")}</p>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function PowerPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("power")}>
      <PowerPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
