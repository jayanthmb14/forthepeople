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
//  open, today ringed). Accents come from the page hue (slate for offices);
//  the open / lunch / closed pills keep their semantic live / warn colours.
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
"use client";
import { use, useState } from "react";
import { Building, Phone, Mail, Globe, MapPin, Search } from "lucide-react";
import { useOffices } from "@/hooks/useRealtimeData";
import type { GovOffice } from "@/hooks/useRealtimeData";
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
import { Explainer } from "@/components/district/visuals";
import AIInsightCard from "@/components/common/AIInsightCard";
import NoDataCard from "@/components/common/NoDataCard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";
import { ModulePage, ModuleSummary, ModuleSources, ModuleToolbar } from "@/components/district/daily-services/ModuleShell";
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

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/**
 * The office row as the API returns it. The shared GovOffice type in the
 * hook does not list the hour columns yet, but /api/data/offices sends
 * every column of the table, so we read them here as optional fields.
 */
type OfficeRow = GovOffice & Partial<Record<(typeof DAY_FIELDS)[number] | "lunchBreak", string | null>>;

/** "17:30" → minutes since midnight (1050). Returns null if not a time. */
function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** "17:30" → "5:30 PM" (for the sentence on the page). */
function to12h(hhmm: string): string {
  const mins = toMinutes(hhmm) ?? 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** [1,2,3,4,5] → "Mon–Fri"; a non-continuous list is joined with commas. */
function dayRangeLabel(days: readonly number[]): string {
  const continuous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (continuous && days.length > 2) return `${DAY_SHORT[days[0]]}–${DAY_SHORT[days[days.length - 1]]}`;
  return days.map((d) => DAY_SHORT[d]).join(", ");
}

/** The sentence form of OFFICE_HOURS, e.g. "Mon–Fri, 10:00 AM – 5:30 PM". */
const OFFICE_HOURS_LABEL = `${dayRangeLabel(OFFICE_HOURS.days)}, ${to12h(OFFICE_HOURS.open)} – ${to12h(OFFICE_HOURS.close)}`;

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
function WeekStrip({ openDays, today }: { openDays: readonly number[]; today: number }) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        role="img"
        aria-label={`Offices open ${dayRangeLabel(openDays)}. Today is ${DAY_SHORT[today]}.`}
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
                {DAY_SHORT[d]}
              </span>
            </span>
          );
        })}
      </div>
      <figcaption style={{ marginTop: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        Coloured days are open days. The ringed day is today (India time).
      </figcaption>
    </figure>
  );
}

function OfficesPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useOffices(district, state);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const offices: OfficeRow[] = (data?.data ?? []).filter((o) => o.active);
  const departments = Array.from(new Set(offices.map((o) => o.department)));
  const openNow = isOpenNow();
  const todayIST = nowInIST().day;
  const refresh = `Directory updates: ${getModuleSources("offices", state).frequency.toLowerCase()}`;

  const filtered = offices.filter((o) => {
    const matchesDept = filter === "all" || o.department === filter;
    const matchesSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.department.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <ModulePage>
      <PageHeader
        icon={Building}
        title="Government Offices"
        description="Directory of government offices: addresses, contacts and services"
        backHref={base}
        accent={getModuleAccent("offices")}
      />

      <ModuleSummary>
        A directory of government offices in this district: where each office is, which department it belongs to, who
        heads it, how to reach it, and which services it handles. Opening hours are shown in Indian Standard Time.
      </ModuleSummary>

      <AIInsightCard module="offices" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && offices.length === 0 && <NoDataCard module="offices" district={district} state={state} />}

      {!isLoading && offices.length > 0 && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="🏢" label="Offices" value={offices.length} sub={refresh} />
            <StatTile emoji="🗂️" label="Departments" value={departments.length} sub={refresh} />
            <StatTile emoji={openNow ? "🔓" : "🔒"} label="Status" value={openNow ? "Open now" : "Closed"} sub={`${OFFICE_HOURS_LABEL} IST`} />
          </StatStrip>

          {/* The picture: office hours in plain words plus a week strip.
              Both the words and the open/closed rule come from OFFICE_HOURS. */}
          <Card tinted padding={18} style={{ marginTop: 16 }}>
            <Explainer title="In simple words" emoji="🕙">
              <span suppressHydrationWarning>
                {openNow ? "Right now, offices are open." : "Right now, offices are closed."} They usually open{" "}
                <strong>{OFFICE_HOURS_LABEL}</strong>, India time.
                {offices.some((o) => officeStatus(o) !== null) ? " Some offices keep their own hours, shown on their cards." : ""}
              </span>
            </Explainer>
            <WeekStrip openDays={OFFICE_HOURS.days} today={todayIST} />
          </Card>

          <Section title="Office directory" emoji="📇">
            {/* Search + department filter. */}
            <label style={{ position: "relative", display: "block", marginBottom: 12 }}>
              <span className="sr-only">Search offices</span>
              <Search size={16} aria-hidden style={{ position: "absolute", left: 12, top: 14, color: "var(--hue)" }} />
              <input
                type="search"
                placeholder="Search offices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 44,
                  padding: "10px 14px 10px 36px",
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
                label="Department"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All", count: offices.length },
                  ...departments.map((d) => ({ value: d, label: d, count: offices.filter((o) => o.department === d).length })),
                ]}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState emoji="🔍" title="No offices match your search." body="Try a different name or department." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {filtered.map((o) => {
                  // Only offices whose row lists its own hours get a status pill.
                  const status = officeStatus(o);
                  return (
                  <Card key={o.id} as="article">
                    <h3 className="ftp-title">{o.name}</h3>
                    {o.nameLocal && <div lang="und" style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{o.nameLocal}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: "var(--hue-deep)" }}>{o.department}</span>
                      <Pill>{o.type}</Pill>
                    </div>

                    {status && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        <Pill tone={status.state === "open" ? "live" : status.state === "lunch" ? "warn" : "neutral"} dot>
                          <span suppressHydrationWarning>
                            {status.state === "open" ? "Open now" : status.state === "lunch" ? "Lunch break" : "Closed now"}
                          </span>
                        </Pill>
                        <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
                          Today <span className="ftp-num">{status.today ?? "closed"}</span>
                          {status.today && o.lunchBreak ? <>, lunch <span className="ftp-num">{o.lunchBreak}</span></> : null} (IST)
                        </span>
                      </div>
                    )}

                    {o.headName && (
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", marginTop: 8 }}>
                        Head: {o.headName}
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
                        {o.website && <ContactLink href={o.website} icon={Globe} external>Website</ContactLink>}
                      </div>
                    )}

                    {o.services.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div className="ftp-label" style={{ marginBottom: 4 }}>Services</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                          {o.services.slice(0, 4).map((s, i) => (
                            <Pill key={i} style={HUE_PILL}>
                              {s}
                            </Pill>
                          ))}
                          {o.services.length > 4 && (
                            <span style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>+{o.services.length - 4} more</span>
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
        moduleLabel="Government Offices"
        shareText={`Government offices in ${district}: ${offices.length} offices across ${departments.length} departments`}
      />
    </ModulePage>
  );
}

export default function OfficesPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Government Offices">
      <OfficesPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
