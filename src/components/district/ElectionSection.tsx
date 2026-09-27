/**
 * ForThePeople.in — Election section for the leadership page.
 *
 * Renders all elections relevant to the district's state (national +
 * state-level rows). Each card carries a status Pill based on how far away
 * the polling (or next expected) date is:
 *   date < today      → neutral  "Completed"
 *   ≤ 14 days         → danger   "Voting in N days"
 *   ≤ 6 months        → warn     "Approaching"
 *   ≤ 2 years         → brand    "Upcoming"
 *   otherwise / none  → neutral  "Scheduled"
 *
 * Design v4 "Rang": an emoji Section, Cards whose icons and accents read
 * the page hue (--hue …; the leadership page wraps this in the elections
 * hue), an emoji chip per election kind, upcoming elections on a tinted
 * Card, dates / days / seats as tabular figures, multi-phase polling as a
 * DataTable. No pulsing glow on imminent elections. Data fetching and the
 * date maths are unchanged.
 *
 * Language: interface text comes from the "page_leadership" namespace
 * (`elections.*`); dates go through useFormat(). The election's own label,
 * body and note are reference data and are shown as stored.
 *
 * Includes a footer disclaimer clarifying that ForThePeople.in is not
 * affiliated with the ECI or any political party.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AlertTriangle, BarChart3, CalendarDays, Landmark } from "lucide-react";
import { Card, DataTable, Pill, Section, SourcePill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

interface PollingPhase { phase: number; date: string }
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
const TYPE_EMOJI: Record<string, string> = { LOK_SABHA: "🏛️", STATE_ASSEMBLY: "🏢" };

type Translator = ReturnType<typeof useTranslations>;

/** Status label + Pill tone for an election, from days until its date. */
interface Urgency { tone: Tone; label: string }
function urgencyTone(daysAway: number | null, isPast: boolean, t: Translator): Urgency {
  if (isPast) return { tone: "neutral", label: t("elections.completed") };
  if (daysAway == null) return { tone: "neutral", label: t("elections.scheduled") };
  if (daysAway <= 14) return { tone: "danger", label: t("elections.votingIn", { n: daysAway }) };
  if (daysAway <= 180) return { tone: "warn", label: t("elections.approaching") };
  if (daysAway <= 730) return { tone: "brand", label: t("elections.upcoming") };
  return { tone: "neutral", label: t("elections.scheduled") };
}

function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

/** One line of the card: 14 px icon + label + value (value may contain mono spans). */
function Row({ icon: Icon, label, children }: { icon: typeof CalendarDays; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
      <Icon size={14} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 3 }} />
      <span>
        <span style={{ color: "var(--ftp-text-2)" }}>{label}: </span>
        {children}
      </span>
    </div>
  );
}

function ElectionCard({ e }: { e: ElectionEvent }) {
  const t = useTranslations("page_leadership");
  const f = useFormat();
  const fullDate = (iso: string | null) => {
    if (!iso || Number.isNaN(new Date(iso).getTime())) return "—";
    return f.date(iso, { day: "2-digit", month: "short", year: "numeric" });
  };
  const monthYear = (iso: string | null) => {
    if (!iso || Number.isNaN(new Date(iso).getTime())) return "—";
    return f.date(iso, { month: "short", year: "numeric" });
  };
  const target = e.pollingDate ?? e.nextExpected;
  const days = daysFromToday(target);
  const isPast = days != null && days < 0;
  const tone = urgencyTone(days, isPast, t);
  const isLive = !isPast && days != null && days <= 14;
  const phases = e.pollingPhases && e.pollingPhases.length > 1 ? e.pollingPhases : null;

  return (
    <Card
      as="article"
      // Upcoming elections get the soft hue wash; completed ones stay plain.
      tinted={!isPast}
      // A multi-phase election needs room for its table, so it spans the full row.
      style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: phases ? "1 / -1" : undefined }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
          {TYPE_EMOJI[e.type] ?? "🗳️"}
        </span>
        <Pill tone={tone.tone}>{tone.label}</Pill>
      </div>
      <h3 className="ftp-title" style={{ fontWeight: 600 }}>
        {e.label}
      </h3>

      {e.pollingDate && (
        <Row icon={CalendarDays} label={t("elections.polling")}>
          <span className="ftp-num">{fullDate(e.pollingDate)}</span>
          {days != null && !isPast ? (
            <span style={{ color: "var(--ftp-text-2)" }}>
              {" ("}
              {days === 0 ? t("elections.today") : t("elections.daysAway", { n: days })}
              {")"}
            </span>
          ) : null}
        </Row>
      )}

      {phases && (
        <DataTable
          dense
          caption={t("elections.phasesCaption", { label: e.label })}
          columns={[
            { key: "phase", label: t("elections.phase"), numeric: true, width: 80 },
            { key: "date", label: t("elections.pollingDate"), numeric: true },
          ]}
          rows={phases.map((p) => ({ phase: f.number(p.phase), date: fullDate(p.date) }))}
        />
      )}

      {e.resultDate && (
        <Row icon={BarChart3} label={t("elections.results")}>
          <span className="ftp-num">{fullDate(e.resultDate)}</span>
        </Row>
      )}
      {e.lastHeld && !e.pollingDate && (
        <Row icon={CalendarDays} label={t("elections.lastHeld")}>
          <span className="ftp-num">{monthYear(e.lastHeld)}</span>
        </Row>
      )}
      {e.nextExpected && !e.pollingDate && (
        <Row icon={CalendarDays} label={t("elections.nextExpected")}>
          <span className="ftp-num">{t("elections.about", { date: monthYear(e.nextExpected) })}</span>
          {days != null ? (
            <span style={{ color: "var(--ftp-text-2)" }}>
              {" ("}
              {t("elections.monthsAway", { n: Math.abs(Math.round(days / 30)) })}
              {")"}
            </span>
          ) : null}
        </Row>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>
        <Landmark size={12} aria-hidden style={{ flexShrink: 0, color: "var(--hue)" }} />
        <span>{e.totalSeats ? t("elections.seats", { body: e.body, n: e.totalSeats }) : e.body}</span>
      </div>
      {e.note && (
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>{e.note}</p>
      )}
      {isLive && (
        <div
          role="note"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            marginTop: 6,
            paddingTop: 8,
            borderTop: "1px solid var(--ftp-border)",
            fontSize: 11,
            lineHeight: "16px",
            color: "var(--ftp-text)",
          }}
        >
          <AlertTriangle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: "var(--ftp-danger)" }} />
          <span>{t("elections.liveNote")}</span>
        </div>
      )}
    </Card>
  );
}

export default function ElectionSection({ stateSlug }: { stateSlug: string }) {
  const t = useTranslations("page_leadership");
  const { data, isLoading } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/election-events?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  if (isLoading || !data?.data?.length) return null;
  const events = data.data;
  return (
    <div style={{ marginTop: 32, marginBottom: 24 }}>
      <Section title={t("elections.title")} emoji="🗳️" action={<SourcePill label="ECI" href="https://eci.gov.in" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12 }}>
          {events.map((e) => <ElectionCard key={e.id} e={e} />)}
        </div>
        <p
          role="note"
          style={{
            background: "color-mix(in srgb, var(--hue-tint) 70%, #fff)",
            border: "1px solid color-mix(in srgb, var(--hue) 14%, var(--ftp-border))",
            borderRadius: "var(--ftp-radius-tile)",
            padding: 14,
            margin: "16px 0 0",
            fontSize: 11,
            lineHeight: "18px",
            color: "var(--ftp-text-2)",
          }}
        >
          {t.rich("elections.disclaimer", {
            link: (c) => (
              <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>
                {c}
              </a>
            ),
          })}
        </p>
      </Section>
    </div>
  );
}

// Helper used by the leadership page to detect an election period for
// disclaimer rendering. Returns the nearest election within 30 days
// (past or future) or null.
export function findActiveElection(events: ElectionEvent[] | undefined): ElectionEvent | null {
  if (!events) return null;
  const today = Date.now();
  const candidates = events.filter((e) => {
    const t = e.pollingDate ? new Date(e.pollingDate).getTime() : null;
    if (t == null) return false;
    return Math.abs(t - today) <= 30 * 86_400_000;
  });
  candidates.sort((a, b) => Math.abs(new Date(a.pollingDate!).getTime() - today) - Math.abs(new Date(b.pollingDate!).getTime() - today));
  return candidates[0] ?? null;
}
