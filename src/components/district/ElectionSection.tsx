/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  ElectionSection — the election calendar (Elections page)
// ═══════════════════════════════════════════════════════════════════════
//  Every election that concerns the district's voters (national rows plus
//  the state's own rows, from /api/data/election-events), as tappable
//  cards in a grid. Each card carries a status from how far away its date
//  is:
//    date < today      → "Completed"
//    ≤ 14 days         → "Voting in N days"   (danger)
//    ≤ 6 months        → "Coming soon"        (warn)
//    ≤ 2 years         → "Upcoming"           (brand)
//    otherwise / none  → "Scheduled"
//  Tapping a card opens a DetailSheet with every date we hold (polling,
//  phases, results, last held, next expected), who runs it, seats, the
//  note, and a link to the official notice.
//
//  Also exports the helpers the Leadership page and the overview banner
//  use: findActiveElection (polling within 30 days, either side) and
//  findNextElection (the nearest one still ahead).
//
//  Text: "page_elections" namespace (`calendar.*`). The election's label,
//  body and note are reference data and are shown as stored.
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, ExternalLink, Search } from "lucide-react";
import { Pill, Section, SourcePill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { useFormat } from "@/i18n/client";
import { hueClass } from "@/lib/design/hues";

interface PollingPhase {
  phase: number;
  date: string;
}
export interface ElectionEvent {
  id: string;
  type: string;
  label: string;
  state: string | null;
  district: string | null;
  lastHeld: string | null;
  pollingDate: string | null;
  pollingPhases: PollingPhase[] | null;
  resultDate: string | null;
  nextExpected: string | null;
  termYears: number;
  totalSeats: number | null;
  body: string;
  note: string | null;
  source: string | null;
  isActive: boolean;
}

/** Emoji for the kind of election (one per card). */
export const ELECTION_TYPE_EMOJI: Record<string, string> = {
  LOK_SABHA: "🏛️",
  STATE_ASSEMBLY: "🏢",
  MUNICIPAL: "🏙️",
  PANCHAYAT: "🏡",
};

/** Where a voter checks their name and booth (Election Commission of India). */
export const ELECTORAL_SEARCH_URL = "https://electoralsearch.eci.gov.in/";

type Translator = ReturnType<typeof useTranslations>;

function validDate(iso: string | null | undefined): iso is string {
  return Boolean(iso) && !Number.isNaN(new Date(iso as string).getTime());
}

/** Whole days from today to the date (negative = past). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!validDate(iso)) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

interface Urgency {
  tone: Tone;
  label: string;
}
function urgency(daysAway: number | null, t: Translator): Urgency {
  if (daysAway != null && daysAway < 0) return { tone: "neutral", label: t("calendar.completed") };
  if (daysAway == null) return { tone: "neutral", label: t("calendar.scheduled") };
  if (daysAway <= 14) return { tone: "danger", label: t("calendar.votingIn", { n: daysAway }) };
  if (daysAway <= 180) return { tone: "warn", label: t("calendar.approaching") };
  if (daysAway <= 730) return { tone: "brand", label: t("calendar.upcoming") };
  return { tone: "neutral", label: t("calendar.scheduled") };
}

/** The translated kind of election ("Lok Sabha", "State assembly"), or the stored code. */
export function electionTypeLabel(type: string, t: Translator): string {
  const k = type.toLowerCase().replace(/[^a-z]/g, "");
  return t.has(`calendar.types.${k}`) ? t(`calendar.types.${k}`) : type;
}

function ElectionCard({ e, onOpen }: { e: ElectionEvent; onOpen: (e: ElectionEvent) => void }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  const target = e.pollingDate ?? e.nextExpected;
  const days = daysUntil(target);
  const u = urgency(days, t);
  const past = days != null && days < 0;
  const line = e.pollingDate
    ? t("calendar.pollingOn", { date: f.date(e.pollingDate, { day: "numeric", month: "short", year: "numeric" }) })
    : e.nextExpected
      ? t("calendar.expectedAbout", { date: f.date(e.nextExpected, { month: "long", year: "numeric" }) })
      : e.lastHeld
        ? t("calendar.lastHeldOn", { date: f.date(e.lastHeld, { month: "long", year: "numeric" }) })
        : null;
  return (
    <button
      type="button"
      onClick={() => onOpen(e)}
      className="ftp-card-link"
      aria-haspopup="dialog"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 8,
        width: "100%",
        minHeight: 44,
        padding: 16,
        textAlign: "left",
        font: "inherit",
        color: "var(--ftp-text)",
        cursor: "pointer",
        background: past ? "var(--ftp-surface)" : "linear-gradient(135deg, color-mix(in srgb, var(--hue) 7%, #fff) 0%, #fff 70%)",
        border: past ? "1px solid var(--ftp-border)" : "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
          {ELECTION_TYPE_EMOJI[e.type] ?? "🗳️"}
        </span>
        <Pill tone={u.tone}>{u.label}</Pill>
      </span>
      <span className="ftp-title" style={{ fontWeight: 650, fontSize: 16 }}>
        {e.label}
      </span>
      {line && (
        <span className="ftp-num" style={{ fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <span aria-hidden>📅 </span>
          {line}
        </span>
      )}
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
        <span>{e.totalSeats ? t("calendar.seats", { body: e.body, n: e.totalSeats }) : e.body}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 600, color: "var(--hue-deep)", flexShrink: 0 }}>
          {t("calendar.details")}
          <ChevronRight size={14} aria-hidden />
        </span>
      </span>
    </button>
  );
}

function ElectionSheet({ e, onClose }: { e: ElectionEvent | null; onClose: () => void }) {
  const t = useTranslations("page_elections");
  const f = useFormat();
  if (!e) return null;
  const full = (iso: string | null) => (validDate(iso) ? f.date(iso, { day: "numeric", month: "long", year: "numeric" }) : null);
  const monthYear = (iso: string | null) => (validDate(iso) ? f.date(iso, { month: "long", year: "numeric" }) : null);
  const target = e.pollingDate ?? e.nextExpected;
  const days = daysUntil(target);
  const u = urgency(days, t);
  const live = days != null && days >= 0 && days <= 14;
  const phases = e.pollingPhases && e.pollingPhases.length > 1 ? e.pollingPhases : null;
  const officialNotice = e.source && /^https?:\/\//.test(e.source) ? e.source : null;
  const btn: React.CSSProperties = {
    flex: "1 1 160px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  };
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={e.label}
      subtitle={u.label}
      emoji={ELECTION_TYPE_EMOJI[e.type] ?? "🗳️"}
      hueClassName={hueClass("elections")}
      footer={
        <>
          <a
            href={ELECTORAL_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btn, background: "var(--hue)", color: "#fff", border: "1px solid var(--hue)" }}
          >
            <Search size={18} aria-hidden />
            {t("calendar.checkName")}
          </a>
          {officialNotice && (
            <a
              href={officialNotice}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btn, background: "var(--ftp-surface)", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}
            >
              <ExternalLink size={18} aria-hidden />
              {t("calendar.officialNotice")}
            </a>
          )}
        </>
      }
    >
      <DetailList
        rows={[
          { emoji: "🗳️", label: t("calendar.type"), value: electionTypeLabel(e.type, t) },
          { emoji: "🏛️", label: t("calendar.runBy"), value: e.body },
          { emoji: "🪑", label: t("calendar.seatsLabel"), value: e.totalSeats ? f.number(e.totalSeats) : null },
          {
            emoji: "📅",
            label: t("calendar.polling"),
            value: e.pollingDate ? (
              <span className="ftp-num">
                {full(e.pollingDate)}
                {days != null && days >= 0 && (
                  <span style={{ color: "var(--ftp-text-2)" }}> ({days === 0 ? t("calendar.today") : t("calendar.daysAway", { n: days })})</span>
                )}
              </span>
            ) : null,
          },
          {
            emoji: "🔢",
            label: t("calendar.phases"),
            value: phases ? (
              <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                {phases.map((p) => (
                  <li key={p.phase} className="ftp-num">
                    {t("calendar.phaseOn", { n: p.phase, date: full(p.date) ?? "—" })}
                  </li>
                ))}
              </ol>
            ) : null,
          },
          { emoji: "📊", label: t("calendar.results"), value: full(e.resultDate) },
          { emoji: "⏮️", label: t("calendar.lastHeld"), value: monthYear(e.lastHeld) },
          {
            emoji: "⏭️",
            label: t("calendar.nextExpected"),
            value: !e.pollingDate && e.nextExpected ? t("calendar.about", { date: monthYear(e.nextExpected) ?? "—" }) : null,
          },
          { emoji: "⏳", label: t("calendar.term"), value: e.termYears ? t("calendar.termYears", { n: e.termYears }) : null },
          { emoji: "📝", label: t("calendar.note"), value: e.note },
        ]}
      />
      {!e.pollingDate && e.nextExpected && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("calendar.expectedHint")}</p>
      )}
      {live && (
        <p role="note" style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <span aria-hidden>⚠️ </span>
          {t("calendar.liveNote")}
        </p>
      )}
    </DetailSheet>
  );
}

/** The calendar: tappable election cards + their detail sheet + the ECI disclaimer. */
export default function ElectionSection({ events }: { events: ElectionEvent[] }) {
  const t = useTranslations("page_elections");
  const [open, setOpen] = useState<ElectionEvent | null>(null);
  const close = useCallback(() => setOpen(null), []);
  if (events.length === 0) return null;
  return (
    <Section title={t("calendar.title")} emoji="🗓️" action={<SourcePill label="ECI" href="https://eci.gov.in" />}>
      <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
        {events.map((e) => (
          <ElectionCard key={e.id} e={e} onOpen={setOpen} />
        ))}
      </div>
      <p
        role="note"
        className="ftp-prose"
        style={{
          background: "color-mix(in srgb, var(--hue-tint) 70%, #fff)",
          border: "1px solid color-mix(in srgb, var(--hue) 14%, var(--ftp-border))",
          borderRadius: "var(--ftp-radius-tile)",
          padding: 14,
          margin: "16px 0 0",
          fontSize: 12,
          lineHeight: "18px",
          color: "var(--ftp-text-2)",
        }}
      >
        {t.rich("calendar.disclaimer", {
          link: (c) => (
            <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
              {c}
            </a>
          ),
        })}
      </p>
      <ElectionSheet e={open} onClose={close} />
    </Section>
  );
}

/**
 * The nearest election within 30 days of today (either side), or null.
 * The Leadership page uses it to warn that party links may change.
 */
export function findActiveElection(events: ElectionEvent[] | undefined): ElectionEvent | null {
  if (!events) return null;
  const today = Date.now();
  const candidates = events.filter((e) => {
    if (!validDate(e.pollingDate)) return false;
    return Math.abs(new Date(e.pollingDate).getTime() - today) <= 30 * 86_400_000;
  });
  candidates.sort(
    (a, b) => Math.abs(new Date(a.pollingDate!).getTime() - today) - Math.abs(new Date(b.pollingDate!).getTime() - today),
  );
  return candidates[0] ?? null;
}

/**
 * The next election still ahead for this district's voters: national rows
 * and the state's statewide rows (or rows for this district). Exact polling
 * dates count first; otherwise the "next expected" month. Null when the
 * calendar has nothing ahead.
 */
export function findNextElection(
  events: ElectionEvent[] | undefined,
  stateSlug: string,
  districtSlug?: string,
): ElectionEvent | null {
  if (!events) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const ahead = events
    .filter((e) => (e.state === null || e.state === stateSlug) && (!e.district || !districtSlug || e.district === districtSlug))
    .map((e) => ({ e, at: validDate(e.pollingDate) ? new Date(e.pollingDate).getTime() : validDate(e.nextExpected) ? new Date(e.nextExpected).getTime() : NaN }))
    .filter((x) => Number.isFinite(x.at) && x.at >= startOfToday.getTime())
    .sort((a, b) => a.at - b.at);
  return ahead[0]?.e ?? null;
}
