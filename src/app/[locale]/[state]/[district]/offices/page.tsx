/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Govt offices near you — "Where is the office, is it open now, and how
//  do I reach it?"  (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//
//  The answer: "Mandya has 42 Govt offices in 12 departments. It is Monday
//  11:20 am in India: most offices are usually open now."
//
//  Order: PageHeader → Explainer → 4 tiles → the picture (a week strip of
//  the usual open days, today ringed) → search + department chips → one
//  card per office. Tapping a card opens a DetailSheet: open / closed now,
//  the week's hours, address, tap-to-call phone, email, website, head of
//  office, services handled, the step-by-step certificate guides that send
//  you to an office like this, and Call / Directions / Website buttons →
//  link to How to get certificates → charts → AI insight → news → sources.
//
//  Hours, honestly:
//    • An office that lists its own hours (mondayHours … sundayHours,
//      lunchBreak, e.g. "10:00-17:30") gets an exact Open now / Lunch
//      break / Closed now from those hours.
//    • Otherwise the page only says what is USUAL for the state's offices
//      (StateConfig.officeHours, set only from an official order: Karnataka
//      10:00–17:30 with the 2nd and 4th Saturdays off; Maharashtra 9:45–18:15,
//      five days) and asks people to call first. A state with no checked
//      hours gets no "usually open" claim at all, only "call first" (Sept
//      2026 audit: one 10:00–17:30 constant was shown for every state).
//      Every rule is evaluated in India time, wherever the visitor is.
//    • No "updated" date: GovOffice.updatedAt moves on any bulk edit, so it
//      is not a check date (Sept 2026 audit).
//    • The clock comes from useNow() (0 on the server), so nothing
//      time-based is drawn until the browser knows the time.
//
//  Deep link: ?q=<words> fills the search (the certificates page links
//  here with the office a guide names). Every word is in page_offices
//  (en / kn / hi); office names, departments, addresses and services are
//  data and stay as published.
"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building, Building2, Car, Droplets, Gavel, Globe, GraduationCap, HandHeart, HardHat, Hospital, House, Landmark, Layers, Lock,
  LockOpen, Mail, Map as MapIcon, MapPin, NotebookPen, Phone, ShieldCheck, Sprout, TreePine, Wheat, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleNews from "@/components/district/ModuleNews";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import { useOffices, useServices } from "@/hooks/useRealtimeData";
import type { GovOffice, ServiceGuide } from "@/hooks/useRealtimeData";
import { useDistrictName, useFormat, useModuleText } from "@/i18n/client";
import { Card, Chips, EmptyState, ErrorBlock, LoadingShell, ModulePage, PageHeader, Pill, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { BarList, ProgressRing } from "@/components/district/daily-services/HueCharts";
import { getStateConfig } from "@/lib/constants/state-config";
import {
  ActionLink,
  LinkCard,
  MetaLine,
  SearchBox,
  SheetBlock,
  SheetNote,
  SheetSmall,
  TagList,
  TapCard,
  dataLang,
  extUrl,
  hostOf,
  mapsUrl,
  phoneList,
  searchRows,
  searchWords,
  telHref,
  useNow,
} from "@/components/services-2/kit";

// ─────────────────────────────────────────────────────────────────────
//  Hours (all times IST, 24-hour "HH:MM")
// ─────────────────────────────────────────────────────────────────────

/**
 * What is USUAL for the state's Govt offices — used only for offices that
 * do not list their own hours, and always shown as "usually", with "call
 * first". From StateConfig.officeHours; null when the state's hours are not
 * checked. days: 0 = Sunday … 6 = Saturday; `someDays` = open on some of
 * these days only (Karnataka: not the 2nd and 4th Saturdays).
 */
type UsualHours = { days: readonly number[]; someDays: readonly number[]; open: string; close: string };

/** The per-day hour fields an office row may carry, by day number (0 = Sunday). */
const DAY_FIELDS = ["sundayHours", "mondayHours", "tuesdayHours", "wednesdayHours", "thursdayHours", "fridayHours", "saturdayHours"] as const;

/** Mon … Sun, the order people read a week in. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** How many departments the bar list names. */
const TOP_DEPARTMENTS = 6;

/** The API sends every column of the table; the shared type lists fewer. */
type OfficeRow = GovOffice &
  Partial<Record<(typeof DAY_FIELDS)[number] | "lunchBreak" | "holidays" | "notes" | "updatedAt", string | null>> & {
    latitude?: number | null;
    longitude?: number | null;
  };

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** "17:30" → 1050 minutes since midnight, or null. */
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Short weekday name in the reader's language (0 = Sunday). 1 Jan 2023 was a Sunday. */
function weekdayName(day: number, intl: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat(intl, { weekday: style, timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + day)));
}

/** Minutes since midnight → "5:30 pm" / "ಸಂಜೆ 5:30", in the reader's language. */
function clockOf(mins: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1, Math.floor(mins / 60), mins % 60)),
  );
}

/** Weekday and minute of the day in India time. IST is UTC+05:30 all year. */
function inIST(ms: number): { day: number; minutes: number } {
  const ist = new Date(ms + 330 * 60_000);
  return { day: ist.getUTCDay(), minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes() };
}

/** "10:00-17:30" (hyphen or dash, spaces allowed) → [open, close] minutes. */
function parseRange(value: string | null | undefined): [number, number] | null {
  const m = /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/.exec(value ?? "");
  if (!m) return null;
  const a = toMinutes(m[1]);
  const b = toMinutes(m[2]);
  return a !== null && b !== null ? [a, b] : null;
}

type Usual = "open" | "closed" | "someSat" | "sunday" | "closedDay";

/** What is usual right now (for offices with no hours of their own). */
function usualNow(ms: number, hours: UsualHours): Usual {
  const { day, minutes } = inIST(ms);
  if (day === 0) return "sunday";
  if (hours.someDays.includes(day)) return "someSat";
  if (!hours.days.includes(day)) return "closedDay";
  const open = toMinutes(hours.open) ?? 0;
  const close = toMinutes(hours.close) ?? 0;
  return minutes >= open && minutes < close ? "open" : "closed";
}

function hasOwnHours(o: OfficeRow): boolean {
  return DAY_FIELDS.some((f) => !!o[f]);
}

/** One office's status from its own hours, or null when it lists none. A day with no hours counts as closed. */
function ownStatus(o: OfficeRow, ms: number): { state: "open" | "lunch" | "closed"; today: [number, number] | null } | null {
  if (!hasOwnHours(o)) return null;
  const { day, minutes } = inIST(ms);
  const range = parseRange(o[DAY_FIELDS[day]]);
  if (!range || minutes < range[0] || minutes >= range[1]) return { state: "closed", today: range };
  const lunch = parseRange(o.lunchBreak);
  if (lunch && minutes >= lunch[0] && minutes < lunch[1]) return { state: "lunch", today: range };
  return { state: "open", today: range };
}

/** One small line icon per department, from keywords in its free-text name (v5: no emoji). */
function deptIcon(department: string): LucideIcon {
  const d = department.toLowerCase();
  if (/police/.test(d)) return ShieldCheck;
  if (/health|hospital|medical/.test(d)) return Hospital;
  if (/educat|school|public instruction/.test(d)) return GraduationCap;
  if (/agri|horti|farm|seri|animal|veterin|fisher/.test(d)) return Sprout;
  if (/water|irrigation|jal/.test(d)) return Droplets;
  if (/power|electric|energy/.test(d)) return Zap;
  if (/transport|rto|motor/.test(d)) return Car;
  if (/forest/.test(d)) return TreePine;
  if (/court|legal|judici|law/.test(d)) return Gavel;
  if (/panchayat|rural/.test(d)) return House;
  if (/municipal|urban|city|corporation/.test(d)) return Building2;
  if (/revenue|tahsil|taluk|land|survey/.test(d)) return MapIcon;
  if (/registr|stamp/.test(d)) return NotebookPen;
  if (/treasury|finance|bank|tax/.test(d)) return Landmark;
  if (/food|civil supplies|ration/.test(d)) return Wheat;
  if (/women|child|welfare|social/.test(d)) return HandHeart;
  if (/labour|labor|employ/.test(d)) return HardHat;
  if (/post/.test(d)) return Mail;
  return Building;
}

/**
 * Certificate guides that send you to an office like this one. A guide's
 * office ("Tahsildar Office / Nadakacheri") is split into alternatives;
 * a guide matches when every telling word (4+ letters) of one alternative
 * appears in this office's name, type or department. District and state
 * names are not telling words.
 */
function guidesFor(o: OfficeRow, guides: ServiceGuide[], placeWords: Set<string>): ServiceGuide[] {
  const hay = ` ${[o.name, o.type, o.department].join(" ").toLowerCase()} `;
  return guides.filter((g) =>
    g.office
      .split(/\/|\bor\b|,/i)
      .map((alt) => searchWords(alt).filter((w) => w.length >= 4 && !placeWords.has(w)))
      .some((words) => words.length > 0 && words.every((w) => hay.includes(w))),
  );
}

/**
 * WeekStrip — seven day tiles: lit on the usual open days, half-lit on
 * days only some offices open, grey on closed days, today ringed.
 */
function WeekStrip({ hours, today, dayName, ariaLabel, caption }: { hours: UsualHours; today: number | null; dayName: (d: number) => string; ariaLabel: string; caption: string }) {
  return (
    <figure style={{ margin: 0 }}>
      <div role="img" aria-label={ariaLabel} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, maxWidth: 520 }}>
        {WEEK_ORDER.map((d, i) => {
          const open = hours.days.includes(d);
          const some = hours.someDays.includes(d);
          const isToday = d === today;
          return (
            <span
              key={d}
              aria-hidden
              className="ftp-pop"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 0",
                borderRadius: 12,
                background: open ? "var(--hue-tint)" : some ? "color-mix(in srgb, var(--hue-tint) 50%, var(--ftp-surface-2))" : "var(--ftp-surface-2)",
                border: isToday ? "2px solid var(--hue-deep)" : "2px solid transparent",
                ["--i" as string]: i,
              }}
            >
              <Building2 size={18} aria-hidden style={{ color: open ? "var(--hue-deep)" : "var(--ftp-text-2)", opacity: open ? 1 : some ? 0.6 : 0.35 }} />
              <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: open ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>{dayName(d)}</span>
            </span>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{caption}</figcaption>
    </figure>
  );
}

function OfficesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const t = useTranslations("page_offices");
  const f = useFormat();
  const mt = useModuleText();
  const districtName = useDistrictName(state, district);
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useOffices(district, state);
  const { data: guideData } = useServices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const now = useNow();

  const n = (v: number) => f.number(v);
  const dayName = (d: number) => weekdayName(d, f.intl);
  const rangeText = (r: [number, number]) => t("range", { open: clockOf(r[0], f.intl), close: clockOf(r[1], f.intl) });
  // The state's usual office hours, only where an official order was checked.
  const usualCfg: UsualHours | null = getStateConfig(state, district)?.officeHours ?? null;
  const usualHours = usualCfg
    ? t("usualHours", {
        from: dayName(usualCfg.days[0]),
        to: dayName(usualCfg.days[usualCfg.days.length - 1]),
        hours: rangeText([toMinutes(usualCfg.open) ?? 0, toMinutes(usualCfg.close) ?? 0]),
      })
    : null;
  const someDays = usualCfg && usualCfg.someDays.length > 0 ? "yes" : "no";

  const offices: OfficeRow[] = ((data?.data ?? []) as OfficeRow[]).filter((o) => o.active);
  const guides: ServiceGuide[] = (guideData?.data ?? []).filter((g) => g.active);
  const placeWords = new Set([...searchWords(district.replace(/-/g, " ")), ...searchWords(state.replace(/-/g, " ")), ...searchWords(districtName)]);

  const usual = now > 0 && usualCfg ? usualNow(now, usualCfg) : null;
  const today = now > 0 ? inIST(now).day : null;

  // Offices per department, biggest first (also the chip order).
  const deptCounts = Object.entries(
    offices.reduce<Record<string, number>>((acc, o) => {
      acc[o.department] = (acc[o.department] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const withPhone = offices.filter((o) => phoneList(o.phone).length > 0).length;
  const reach: Array<{ key: string; icon: LucideIcon; label: string; count: number }> = [
    { key: "phone", icon: Phone, label: t("reach.phone"), count: withPhone },
    { key: "email", icon: Mail, label: t("reach.email"), count: offices.filter((o) => Boolean(o.email)).length },
    { key: "website", icon: Globe, label: t("reach.website"), count: offices.filter((o) => Boolean(extUrl(o.website))).length },
  ];

  const byDept = filter === "all" ? offices : offices.filter((o) => o.department === filter);
  const shown = searchRows(byDept, search, (o) => [o.name, o.nameLocal, o.department, o.type, o.address, ...o.services]);

  const open = offices.find((o) => o.id === openId) ?? null;
  const openStatus = open && now > 0 ? ownStatus(open, now) : null;
  const openPhones = open ? phoneList(open.phone) : [];
  const openSite = open ? extUrl(open.website) : null;
  const openGuides = open ? guidesFor(open, guides, placeWords) : [];

  /** The status pill for a card or sheet (own hours only). */
  const statusPill = (s: { state: "open" | "lunch" | "closed" }) => (
    <Pill tone={s.state === "open" ? "live" : s.state === "lunch" ? "warn" : "neutral"} dot>
      {s.state === "open" ? t("status.open") : s.state === "lunch" ? t("status.lunch") : t("status.closed")}
    </Pill>
  );

  const usualTile = !usualCfg
    ? t("tiles.callFirst")
    : usual === "open" ? t("tiles.usuallyOpen") : usual === "closed" ? t("tiles.usuallyClosed") : usual === "someSat" ? t("tiles.callFirst") : usual === "sunday" || usual === "closedDay" ? t("tiles.closed") : "—";
  const usualIcon = !usualCfg || usual === "someSat" ? Phone : usual === "open" ? LockOpen : Lock;

  return (
    <ModulePage>
      <PageHeader
        icon={Building}
        title={mt.label("offices")}
        description={t("description")}
      />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && offices.length === 0 && <NoDataCard module="offices" district={district} state={state} />}

      {!isLoading && !error && offices.length > 0 && (
        <>
          {/* 2. The answer in one sentence (the time part appears once the browser knows the time). */}
          <Explainer>
            {t.rich("answer", { district: districtName, offices: offices.length, departments: deptCounts.length, b: bold })}
            {usual && usualHours && now > 0 && (
              <>
                {" "}
                {t.rich(`now.${usual}`, { day: weekdayName(inIST(now).day, f.intl, "long"), time: clockOf(inIST(now).minutes, f.intl), hours: usualHours, b: bold })}
              </>
            )}
          </Explainer>

          {/* 3. Four big numbers. */}
          <StatStrip cols={4}>
            <StatTile icon={Building2} label={t("tiles.offices")} value={n(offices.length)} sub={t("tiles.officesSub")} />
            <StatTile icon={Layers} label={t("tiles.departments")} value={n(deptCounts.length)} sub={t("tiles.departmentsSub")} />
            <StatTile icon={Phone} label={t("tiles.phone")} value={n(withPhone)} sub={t("tiles.phoneSub", { total: n(offices.length) })} />
            <StatTile icon={usualIcon} label={t("tiles.now")} value={usualTile} sub={usualCfg ? t("tiles.nowSub") : t("tiles.nowSubNone")} countUp={false} />
          </StatStrip>

          {/* 4. The picture: the usual week, today ringed (only where the state's hours are checked). */}
          {usualCfg && usualHours && (
            <Card padding={18} style={{ marginTop: 16 }}>
              <p className="ftp-label" style={{ margin: "0 0 10px", color: "var(--hue-deep)" }}>
                {t("week.title")}
              </p>
              <WeekStrip
                hours={usualCfg}
                today={today}
                dayName={dayName}
                ariaLabel={t("week.aria", { hours: usualHours, some: someDays })}
                caption={t("week.caption", { hours: usualHours, some: someDays })}
              />
            </Card>
          )}

          {/* 5. Find an office; tap a card for everything. */}
          <Section title={t("list.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <SearchBox id="office-search" label={t("list.searchLabel")} placeholder={t("list.searchPlaceholder")} value={search} onChange={setSearch} />
              {deptCounts.length > 1 && (
                <Chips
                  label={t("list.chipsLabel")}
                  value={filter}
                  onChange={setFilter}
                  items={[{ value: "all", label: t("list.all"), count: offices.length }, ...deptCounts.map(([d, c]) => ({ value: d, label: d, count: c }))]}
                />
              )}
            </div>
            {shown.length === 0 ? (
              <EmptyState title={t("list.noMatch")} body={t("list.noMatchBody")} />
            ) : (
              <div className="ftp-grid">
                {shown.map((o) => {
                  const st = now > 0 ? ownStatus(o, now) : null;
                  const phones = phoneList(o.phone);
                  return (
                    <TapCard
                      key={o.id}
                      icon={deptIcon(o.department)}
                      title={o.name}
                      titleLang={dataLang(o.name, locale)}
                      subtitle={o.nameLocal ?? undefined}
                      subtitleLang={dataLang(o.nameLocal, locale)}
                      hint={t("list.hint")}
                      onOpen={() => setOpenId(o.id)}
                      aside={st ? statusPill(st) : undefined}
                    >
                      <MetaLine icon={Layers} lang={dataLang(o.department, locale)}>
                        {o.type && o.type !== o.department ? `${o.department} · ${o.type}` : o.department}
                      </MetaLine>
                      <MetaLine icon={MapPin} lang={dataLang(o.address, locale)} clamp={2}>
                        {o.address}
                      </MetaLine>
                      {phones.length > 0 && (
                        <MetaLine icon={Phone}>
                          <span className="ftp-num">{phones[0]}</span>
                        </MetaLine>
                      )}
                    </TapCard>
                  );
                })}
              </div>
            )}
          </Section>

          <div style={{ marginTop: 20 }}>
            <LinkCard href={`${base}/services`} icon={NotebookPen} title={t("toGuides.title")} body={t("toGuides.body")} />
          </div>

          {/* 6. Charts: where the offices are, and how you can reach them. */}
          {(deptCounts.length > 1 || reach.some((r) => r.count > 0)) && (
            <Section title={t("charts.title")}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "340px" }}>
                {deptCounts.length > 1 && (
                  <ChartCard
                    title={t("dept.title")}
                    units={t("dept.units")}
                    simple={t.rich("dept.simple", { dept: deptCounts[0][0], n: n(deptCounts[0][1]), total: n(offices.length), b: bold })}
                    table={deptCounts.map(([d, c]) => ({ label: d, value: n(c) }))}
                  >
                    <BarList
                      items={deptCounts.slice(0, TOP_DEPARTMENTS).map(([d, c]) => ({ key: d, label: d, lang: dataLang(d, locale), value: c, display: n(c) }))}
                    />
                  </ChartCard>
                )}
                {reach.some((r) => r.count > 0) && (
                  <ChartCard
                    title={t("reach.title")}
                    units={t("reach.units")}
                    simple={withPhone > 0 ? t.rich("reach.simple", { n: n(withPhone), total: n(offices.length), b: bold }) : t("reach.simpleNoPhone", { total: n(offices.length) })}
                    table={reach.map((r) => ({ label: r.label, value: t("reach.count", { n: n(r.count), total: n(offices.length) }) }))}
                  >
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                      {reach.map((r, i) => (
                        <li key={r.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", minWidth: 0 }}>
                          <ProgressRing pct={(r.count / offices.length) * 100} size={76} i={i} label={t("reach.ringAria", { what: r.label, n: n(r.count), total: n(offices.length) })}>
                            <r.icon size={22} aria-hidden style={{ color: "var(--hue-deep)" }} />
                          </ProgressRing>
                          <span style={{ fontSize: 13, lineHeight: "18px", fontWeight: 600, color: "var(--ftp-text)" }}>{r.label}</span>
                          <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)" }}>
                            {t("reach.count", { n: n(r.count), total: n(offices.length) })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </ChartCard>
                )}
              </div>
            </Section>
          )}

          <div style={{ marginTop: 20 }}>
            <AIInsightCard module="offices" district={district} />
          </div>
        </>
      )}

      <MoneyToolbar shareTitle={mt.label("offices")} compareHref={`/${locale}/compare?module=offices&a=${district}`} />

      <ModuleNews district={district} state={state} locale={locale} module="offices" />

      {/* Everything about one office. */}
      <DetailSheet
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ""}
        titleLang={open ? dataLang(open.name, locale) : undefined}
        subtitle={open?.nameLocal ? <span lang={dataLang(open.nameLocal, locale)}>{open.nameLocal}</span> : open?.department}
        footer={
          open && (
            <>
              {openPhones.length > 0 && (
                <ActionLink href={telHref(openPhones[0])} primary>
                  {t("sheet.call")}
                </ActionLink>
              )}
              <ActionLink href={mapsUrl(`${open.name}, ${open.address}`, open.latitude, open.longitude)} newTab primary={openPhones.length === 0}>
                {t("sheet.directions")}
              </ActionLink>
              {openSite && (
                <ActionLink href={openSite} newTab>
                  {t("sheet.website")}
                </ActionLink>
              )}
            </>
          )
        }
      >
        {open && (
          <>
            {/* Open or closed now, from the office's own hours when it lists them. */}
            {now > 0 && (
              <SheetNote>
                {openStatus
                  ? openStatus.today
                    ? t.rich(`sheet.own.${openStatus.state}`, { hours: rangeText(openStatus.today), b: bold })
                    : t.rich("sheet.own.closedToday", { b: bold })
                  : usualHours
                    ? t.rich("sheet.noHours", { hours: usualHours, b: bold })
                    : t("sheet.noHoursUnknown")}
              </SheetNote>
            )}

            <DetailList
              rows={[
                { label: t("sheet.department"), value: open.department, lang: dataLang(open.department, locale) },
                { label: t("sheet.type"), value: open.type && open.type !== open.department ? open.type : null, lang: dataLang(open.type, locale) },
                {
                  label: t("sheet.head"),
                  value: open.headName ? (open.headDesignation ? `${open.headName} (${open.headDesignation})` : open.headName) : null,
                  lang: dataLang(open.headName, locale),
                },
                { label: t("sheet.address"), value: open.address, lang: dataLang(open.address, locale) },
                {
                  label: t("sheet.phone"),
                  value:
                    openPhones.length > 0 ? (
                      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {openPhones.map((p) => (
                          <a key={p} href={telHref(p)} className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600, minHeight: 32, display: "inline-flex", alignItems: "center" }}>
                            {p}
                          </a>
                        ))}
                      </span>
                    ) : null,
                },
                {
                  label: t("sheet.email"),
                  value: open.email ? (
                    <a href={`mailto:${open.email}`} style={{ color: "var(--hue-deep)" }}>
                      {open.email}
                    </a>
                  ) : null,
                },
                {
                  label: t("sheet.website"),
                  value: openSite ? (
                    <a href={openSite} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
                      {hostOf(openSite)}
                    </a>
                  ) : null,
                },
                { label: t("sheet.holidays"), value: open.holidays, lang: dataLang(open.holidays, locale) },
                { label: t("sheet.notes"), value: open.notes, lang: dataLang(open.notes, locale) },
              ]}
            />

            {hasOwnHours(open) && (
              <SheetBlock title={t("sheet.hoursTitle")}>
                <DetailList
                  rows={[
                    ...WEEK_ORDER.map((d) => {
                      const r = parseRange(open[DAY_FIELDS[d]]);
                      return {
                        label: d === today ? <strong>{weekdayName(d, f.intl, "long")}</strong> : weekdayName(d, f.intl, "long"),
                        value: r ? rangeText(r) : open[DAY_FIELDS[d]] || t("sheet.closedDay"),
                      };
                    }),
                    ...(parseRange(open.lunchBreak) ? [{ label: t("sheet.lunch"), value: rangeText(parseRange(open.lunchBreak) as [number, number]) }] : []),
                  ]}
                />
                <SheetSmall>{t("sheet.ist")}</SheetSmall>
              </SheetBlock>
            )}

            {open.services.length > 0 && (
              <SheetBlock title={t("sheet.services")}>
                <TagList items={open.services} lang={dataLang(open.services[0], locale)} />
              </SheetBlock>
            )}

            {openGuides.length > 0 && (
              <SheetBlock title={t("sheet.guides")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {openGuides.slice(0, 6).map((g) => (
                    <ActionLink key={g.id} href={`${base}/services?open=${encodeURIComponent(g.id)}`} internal>
                      <span lang={dataLang(g.serviceName, locale)}>{g.serviceName}</span>
                    </ActionLink>
                  ))}
                </div>
              </SheetBlock>
            )}

            <SheetSmall>{t("sheet.callFirst")}</SheetSmall>
          </>
        )}
      </DetailSheet>
    </ModulePage>
  );
}

export default function OfficesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const mt = useModuleText();
  return (
    <ModuleErrorBoundary moduleName={mt.label("offices")}>
      <OfficesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
