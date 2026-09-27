/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Government Offices — Design v4 "Rang" module page (docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//
//  Data: useOffices() → the district office directory (active rows only).
//  Search box + department Chips filter the list on the client.
//
//  v4 look: emoji StatTiles, then the picture — an "In simple words" line
//  and a week strip (Mon … Sun, lit on the days OFFICE_HOURS says offices
//  open, today ringed) — then two charts: offices per department (bars)
//  and how many offices list a phone, an email and a website (rings).
//  Accents come from the page hue (slate for offices); the open / lunch /
//  closed pills keep their semantic live / warn colours.
//
//  "Open now" (2026-09-27 fix): the old rule used 09:00–18:00 in the
//  VISITOR'S BROWSER time zone while the page said "10:00 AM – 5:30 PM".
//  Now:
//    • The default hours live in ONE constant, OFFICE_HOURS, which drives
//      both the text shown on the page and the open/closed rule.
//    • The rule is always evaluated in Indian Standard Time, wherever the
//      visitor is (see nowInIST).
//    • When an office row carries its own hours (mondayHours … sundayHours
//      and lunchBreak, e.g. "10:00-17:30"), its card shows its own
//      open / closed / lunch status from those hours.
//
//  Text: every word comes from the "page_offices" messages; day names and
//  times are formatted by Intl in the reader's language. Office names,
//  departments, addresses and services are data and stay as published.
"use client";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Building, Phone, Mail, Globe, MapPin, Search } from "lucide-react";
import { useOffices } from "@/hooks/useRealtimeData";
import type { GovOffice } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import {
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
import { ChartCard, Explainer } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
import { BarList, ProgressRing } from "@/components/district/daily-services/HueCharts";
import { useDistrictName } from "@/components/district/daily-services/useDistrictName";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";

// ─────────────────────────────────────────────────────────────────────
//  Office hours (all times are IST, 24-hour "HH:MM")
// ─────────────────────────────────────────────────────────────────────

/**
 * Default hours for district government offices. Change them HERE and both
 * the sentence on the page and the "Open now" rule follow.
 * days: 0 = Sunday … 6 = Saturday.
 */
const OFFICE_HOURS = { days: [1, 2, 3, 4, 5], open: "10:00", close: "17:30" } as const;

/** The per-day hour fields an office row may carry, indexed by day number (0 = Sunday). */
const DAY_FIELDS = [
  "sundayHours",
  "mondayHours",
  "tuesdayHours",
  "wednesdayHours",
  "thursdayHours",
  "fridayHours",
  "saturdayHours",
] as const;

/** How many departments the bar list names before the rest are left out. */
const TOP_DEPARTMENTS = 6;

/**
 * The office row as the API returns it. The shared GovOffice type in the
 * hook does not list the hour columns yet, but /api/data/offices sends
 * every column of the table, so we read them here as optional fields.
 */
type OfficeRow = GovOffice & Partial<Record<(typeof DAY_FIELDS)[number] | "lunchBreak", string | null>>;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

/** "17:30" → minutes since midnight (1050). Returns null if not a time. */
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Short weekday name in the reader's language (0 = Sunday). 1 Jan 2023 was a Sunday. */
function weekdayName(day: number, intl: string): string {
  return new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + day)));
}

/** "17:30" → "5:30 pm" / "ಸಂಜೆ 5:30", in the reader's language. */
function clockLabel(hhmm: string, intl: string): string {
  const mins = toMinutes(hhmm) ?? 0;
  return new Intl.DateTimeFormat(intl, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1, Math.floor(mins / 60), mins % 60)),
  );
}

/**
 * Current weekday and minute-of-day in Indian Standard Time.
 * IST is a fixed UTC+05:30 with no daylight saving, so shifting the UTC
 * clock by 330 minutes gives the IST wall clock whatever the browser's
 * own time zone is.
 */
function nowInIST(now: Date = new Date()): { day: number; minutes: number } {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return { day: ist.getUTCDay(), minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes() };
}

/** Parse "10:00-17:30" (hyphen or en dash, spaces allowed) → [open, close] minutes. */
function parseRange(value: string | null | undefined): [number, number] | null {
  if (!value) return null;
  const m = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/.exec(value);
  if (!m) return null;
  const open = toMinutes(m[1]);
  const close = toMinutes(m[2]);
  return open !== null && close !== null ? [open, close] : null;
}

/** Default rule: open on OFFICE_HOURS.days between open and close, in IST. */
function isOpenNow(now: Date = new Date()): boolean {
  const { day, minutes } = nowInIST(now);
  const open = toMinutes(OFFICE_HOURS.open) ?? 0;
  const close = toMinutes(OFFICE_HOURS.close) ?? 0;
  return (OFFICE_HOURS.days as readonly number[]).includes(day) && minutes >= open && minutes < close;
}

/**
 * Status of ONE office from its own hours, or null when the row carries no
 * hours at all (the card then shows nothing and the page-level sentence
 * applies). A day with no hours listed counts as closed that day.
 */
function officeStatus(o: OfficeRow, now: Date = new Date()): { state: "open" | "lunch" | "closed"; today: string | null } | null {
  const hasOwnHours = DAY_FIELDS.some((f) => !!o[f]);
  if (!hasOwnHours) return null;
  const { day, minutes } = nowInIST(now);
  const todayText = o[DAY_FIELDS[day]] ?? null;
  const range = parseRange(todayText);
  if (!range || minutes < range[0] || minutes >= range[1]) return { state: "closed", today: todayText };
  const lunch = parseRange(o.lunchBreak);
  if (lunch && minutes >= lunch[0] && minutes < lunch[1]) return { state: "lunch", today: todayText };
  return { state: "open", today: todayText };
}

/** One emoji per department, from keywords in its free-text name; 🏛️ otherwise. */
function deptEmoji(department: string): string {
  const d = department.toLowerCase();
  if (/police/.test(d)) return "👮";
  if (/health|hospital|medical/.test(d)) return "🏥";
  if (/educat|school|public instruction/.test(d)) return "🎓";
  if (/agri|horti|farm|seri|animal|veterin|fisher/.test(d)) return "🌾";
  if (/water|irrigation|jal/.test(d)) return "💧";
  if (/power|electric|energy/.test(d)) return "⚡";
  if (/transport|rto|motor/.test(d)) return "🚗";
  if (/forest/.test(d)) return "🌳";
  if (/court|legal|judici|law/.test(d)) return "⚖️";
  if (/panchayat|rural/.test(d)) return "🏘️";
  if (/municipal|urban|city|corporation/.test(d)) return "🏙️";
  if (/revenue|tahsil|taluk|land|survey/.test(d)) return "🗺️";
  if (/registr|stamp/.test(d)) return "📝";
  if (/treasury|finance|bank|tax/.test(d)) return "🏦";
  if (/food|civil supplies|ration/.test(d)) return "🍚";
  if (/women|child|welfare|social/.test(d)) return "🤝";
  if (/labour|labor|employ/.test(d)) return "👷";
  if (/post/.test(d)) return "📮";
  return "🏛️";
}

/** Contact link (tel / mailto / website) with a 32 px tap height. */
function ContactLink({ href, icon: Icon, children, external }: { href: string; icon: typeof Phone; children: React.ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, fontSize: 13, fontWeight: 500, color: "var(--hue-deep)", textDecoration: "none" }}
    >
      <Icon size={12} aria-hidden style={{ color: "var(--hue)" }} /> {children}
    </a>
  );
}

/** Pill colours taken from the page hue instead of the neutral grey. */
const HUE_PILL: React.CSSProperties = { background: "var(--hue-tint)", color: "var(--hue-deep)" };

/** Mon … Sun, the order people read a week in. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * WeekStrip — seven day tiles, lit (hue) on the days OFFICE_HOURS says
 * offices open and grey on the others, with today ringed. The same
 * constant drives the sentence and the "Open now" rule, so the picture
 * can never disagree with them.
 */
function WeekStrip({
  openDays,
  today,
  dayName,
  ariaLabel,
  caption,
}: {
  openDays: readonly number[];
  today: number;
  dayName: (d: number) => string;
  ariaLabel: string;
  caption: string;
}) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={ariaLabel}
        style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, maxWidth: 460 }}
      >
        {WEEK_ORDER.map((d, i) => {
          const open = openDays.includes(d);
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
                background: open ? "var(--hue-tint)" : "var(--ftp-surface-2)",
                border: isToday ? "2px solid var(--hue-deep)" : "2px solid transparent",
                ["--i" as string]: i,
              }}
            >
              <span className="ftp-emoji" style={{ fontSize: 20, filter: open ? "none" : "grayscale(1)", opacity: open ? 1 : 0.35 }}>
                🏢
              </span>
              <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: open ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
                {dayName(d)}
              </span>
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
  const { data, isLoading, error } = useOffices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const n = (v: number) => f.number(v);
  const dayName = (d: number) => weekdayName(d, f.intl);

  // "Mon–Fri" for a continuous run, otherwise a list ("Mon, Wed and Fri").
  const days = OFFICE_HOURS.days as readonly number[];
  const continuous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const daysLabel =
    continuous && days.length > 2
      ? t("dayRange", { from: dayName(days[0]), to: dayName(days[days.length - 1]) })
      : new Intl.ListFormat(f.intl, { style: "short", type: "conjunction" }).format(days.map(dayName));
  const hoursValues = { days: daysLabel, open: clockLabel(OFFICE_HOURS.open, f.intl), close: clockLabel(OFFICE_HOURS.close, f.intl) };

  const offices: OfficeRow[] = (data?.data ?? []).filter((o) => o.active);
  const openNow = isOpenNow();
  const todayIST = nowInIST().day;
  const freq = getModuleSources("offices", state).frequency;
  const refresh = t.has(`refresh.${freq}`) ? t(`refresh.${freq}`) : t("refresh.other", { freq });

  // Offices per department, biggest first (also the chip order).
  const deptCounts = Object.entries(
    offices.reduce<Record<string, number>>((acc, o) => {
      acc[o.department] = (acc[o.department] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  // Ways to reach an office: how many list each one.
  const reach = [
    { key: "phone", emoji: "📞", label: t("reach.phone"), count: offices.filter((o) => Boolean(o.phone)).length },
    { key: "email", emoji: "✉️", label: t("reach.email"), count: offices.filter((o) => Boolean(o.email)).length },
    { key: "website", emoji: "🌐", label: t("reach.website"), count: offices.filter((o) => Boolean(o.website)).length },
  ];
  const anyReach = reach.some((r) => r.count > 0);

  const filtered = offices.filter((o) => {
    const matchesDept = filter === "all" || o.department === filter;
    const q = search.toLowerCase();
    const matchesSearch = !search || o.name.toLowerCase().includes(q) || o.department.toLowerCase().includes(q) || (o.nameLocal ?? "").includes(search);
    return matchesDept && matchesSearch;
  });

  return (
    <ModulePage>
      <PageHeader
        icon={Building}
        title={mt.label("offices")}
        description={t("description")}
        backHref={base}
        accent={getModuleAccent("offices")}
      />

      <ModuleSummary>{t("summary", { district: districtName })}</ModuleSummary>

      <AIInsightCard module="offices" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && offices.length === 0 && <NoDataCard module="offices" district={district} state={state} />}

      {!isLoading && offices.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏢" label={t("tiles.offices")} value={n(offices.length)} sub={refresh} />
            <StatTile emoji="🗂️" label={t("tiles.departments")} value={n(deptCounts.length)} sub={refresh} />
            <StatTile
              emoji={openNow ? "🔓" : "🔒"}
              label={t("tiles.status")}
              value={openNow ? t("tiles.open") : t("tiles.closed")}
              sub={t("hoursIst", hoursValues)}
              countUp={false}
            />
          </StatStrip>

          {/* The picture: office hours in plain words plus a week strip.
              Both the words and the open/closed rule come from OFFICE_HOURS. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer emoji="🕙">
              <span suppressHydrationWarning>
                {t.rich(openNow ? "explainerOpen" : "explainerClosed", { hours: t("hours", hoursValues), b: bold })}
                {offices.some((o) => officeStatus(o) !== null) ? <> {t("ownHours")}</> : null}
              </span>
            </Explainer>
            <WeekStrip
              openDays={OFFICE_HOURS.days}
              today={todayIST}
              dayName={dayName}
              ariaLabel={t("week.aria", { days: daysLabel, today: dayName(todayIST) })}
              caption={t("week.caption")}
            />
          </Card>

          {/* Two charts: where the offices are (by department) and how you
              can reach them. Each hides itself when it has nothing to say. */}
          {(deptCounts.length > 1 || anyReach) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, marginTop: 24 }}>
              {deptCounts.length > 1 && (
                <ChartCard
                  title={t("dept.title")}
                  emoji="🗂️"
                  units={t("dept.units")}
                  simple={t.rich("dept.simple", { dept: deptCounts[0][0], n: n(deptCounts[0][1]), total: n(offices.length), b: bold })}
                  table={deptCounts.map(([d, c]) => ({ label: d, value: n(c) }))}
                >
                  <BarList
                    items={deptCounts.slice(0, TOP_DEPARTMENTS).map(([d, c]) => ({
                      key: d,
                      label: d,
                      lang: scriptLang(d),
                      value: c,
                      display: n(c),
                      emoji: deptEmoji(d),
                    }))}
                  />
                </ChartCard>
              )}
              {anyReach && (
                <ChartCard
                  title={t("reach.title")}
                  emoji="☎️"
                  units={t("reach.units")}
                  simple={
                    reach[0].count > 0
                      ? t.rich("reach.simple", { n: n(reach[0].count), total: n(offices.length), b: bold })
                      : t("reach.simpleNoPhone", { total: n(offices.length) })
                  }
                  table={reach.map((r) => ({ label: r.label, value: t("reach.count", { n: n(r.count), total: n(offices.length) }) }))}
                >
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    {reach.map((r, i) => (
                      <li key={r.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", minWidth: 0 }}>
                        <ProgressRing
                          pct={(r.count / offices.length) * 100}
                          size={76}
                          i={i}
                          label={t("reach.ringAria", { what: r.label, n: n(r.count), total: n(offices.length) })}
                        >
                          <span className="ftp-emoji" style={{ fontSize: 24 }}>{r.emoji}</span>
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
          )}

          <Section title={t("list.title")} emoji="📇">
            {/* Search + department filter. */}
            <label style={{ position: "relative", display: "block", marginBottom: 12 }}>
              <span className="sr-only">{t("list.searchLabel")}</span>
              <Search size={16} aria-hidden style={{ position: "absolute", insetInlineStart: 12, top: 14, color: "var(--hue)" }} />
              <input
                type="search"
                placeholder={t("list.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "10px 14px",
                  paddingInlineStart: 36,
                  borderRadius: "var(--ftp-radius-tile)",
                  border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
                  background: "var(--ftp-surface)",
                  color: "var(--ftp-text)",
                  fontFamily: "var(--ftp-font-sans)",
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div style={{ marginBottom: 12 }}>
              <Chips
                label={t("list.chipsLabel")}
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: t("list.all"), count: offices.length },
                  ...deptCounts.map(([d, c]) => ({ value: d, label: d, count: c })),
                ]}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState emoji="🔍" title={t("list.noMatch")} body={t("list.noMatchBody")} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
                {filtered.map((o) => {
                  // Only offices whose row lists its own hours get a status pill.
                  const status = officeStatus(o);
                  return (
                    <Card key={o.id} as="article">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                          {deptEmoji(o.department)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <h3 className="ftp-title">{o.name}</h3>
                          {o.nameLocal && (
                            <div lang={scriptLang(o.nameLocal)} style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
                              {o.nameLocal}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--hue-deep)" }}>{o.department}</span>
                        <Pill>{o.type}</Pill>
                      </div>

                      {status && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                          <Pill tone={status.state === "open" ? "live" : status.state === "lunch" ? "warn" : "neutral"} dot>
                            <span suppressHydrationWarning>
                              {status.state === "open" ? t("list.openNow") : status.state === "lunch" ? t("list.lunch") : t("list.closedNow")}
                            </span>
                          </Pill>
                          <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
                            {!status.today
                              ? t("list.todayClosed")
                              : o.lunchBreak
                                ? t("list.todayLunch", { hours: status.today, lunch: o.lunchBreak })
                                : t("list.today", { hours: status.today })}
                          </span>
                        </div>
                      )}

                      {o.headName && (
                        <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", marginTop: 8 }}>
                          {t("list.head", { name: o.headName })}
                          {o.headDesignation && <span style={{ color: "var(--ftp-text-2)" }}> ({o.headDesignation})</span>}
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                        <MapPin size={12} aria-hidden style={{ flexShrink: 0, marginTop: 4, color: "var(--hue)" }} />
                        <span>{o.address}</span>
                      </div>

                      {(o.phone || o.email || o.website) && (
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                          {o.phone && <ContactLink href={`tel:${o.phone}`} icon={Phone}><span className="ftp-num">{o.phone}</span></ContactLink>}
                          {o.email && <ContactLink href={`mailto:${o.email}`} icon={Mail}>{o.email.split("@")[0]}</ContactLink>}
                          {o.website && <ContactLink href={o.website} icon={Globe} external>{t("list.website")}</ContactLink>}
                        </div>
                      )}

                      {o.services.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div className="ftp-label" style={{ marginBottom: 4 }}>{t("list.services")}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                            {o.services.slice(0, 4).map((s, i) => (
                              <Pill key={i} style={HUE_PILL}>
                                {s}
                              </Pill>
                            ))}
                            {o.services.length > 4 && (
                              <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{t("list.more", { n: n(o.services.length - 4) })}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}

      <ModuleSources module="offices" state={state} />
      <ModuleNews district={district} state={state} locale={locale} module="offices" />
      <ModuleToolbar
        locale={locale}
        district={district}
        moduleSlug="offices"
        moduleLabel={mt.label("offices")}
        shareText={t("share", { district: districtName, offices: offices.length, departments: deptCounts.length })}
      />
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
