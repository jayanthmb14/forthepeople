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
 * hue), upcoming elections on a tinted Card, dates / days / seats as
 * tabular figures, multi-phase polling as a DataTable. No pulsing glow on
 * imminent elections. Data fetching and the date maths are unchanged.
 *
 * Includes a footer disclaimer clarifying that ForThePeople.in is not
 * affiliated with the ECI or any political party (text unchanged).
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, CalendarDays, Landmark, Vote } from "lucide-react";
import { Card, DataTable, Pill, Section, SourcePill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

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

/** Status label + Pill tone for an election, from days until its date. */
interface Urgency { tone: Tone; label: string }
function urgencyTone(daysAway: number | null, isPast: boolean): Urgency {
  if (isPast) return { tone: "neutral", label: "Completed" };
  if (daysAway == null) return { tone: "neutral", label: "Scheduled" };
  if (daysAway <= 14) return { tone: "danger", label: `Voting in ${daysAway} day${daysAway === 1 ? "" : "s"}` };
  if (daysAway <= 180) return { tone: "warn", label: "Approaching" };
  if (daysAway <= 730) return { tone: "brand", label: "Upcoming" };
  return { tone: "neutral", label: "Scheduled" };
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function formatMonthYear(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

/** One line of the card: 14 px icon + label + value (value may contain mono spans). */
function Row({ icon: Icon, label, children }: { icon: typeof Vote; label: string; children: React.ReactNode }) {
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
  const target = e.pollingDate ?? e.nextExpected;
  const days = daysFromToday(target);
  const isPast = days != null && days < 0;
  const tone = urgencyTone(days, isPast);
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
      <div>
        <Pill tone={tone.tone}>{tone.label}</Pill>
      </div>
      <h3 className="ftp-title" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
        <Vote size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0 }} />
        {e.label}
      </h3>

      {e.pollingDate && (
        <Row icon={CalendarDays} label="Polling">
          <span className="ftp-num">{formatFullDate(e.pollingDate)}</span>
          {days != null && !isPast ? (
            <span style={{ color: "var(--ftp-text-2)" }}>
              {" ("}
              {days === 0 ? "today" : <><span className="ftp-num">{days}</span> day{days === 1 ? "" : "s"} away</>}
              {")"}
            </span>
          ) : null}
        </Row>
      )}

      {phases && (
        <DataTable
          dense
          caption={`${e.label} polling phases`}
          columns={[
            { key: "phase", label: "Phase", numeric: true, width: 80 },
            { key: "date", label: "Polling date", numeric: true },
          ]}
          rows={phases.map((p) => ({ phase: p.phase, date: formatFullDate(p.date) }))}
        />
      )}

      {e.resultDate && (
        <Row icon={BarChart3} label="Results">
          <span className="ftp-num">{formatFullDate(e.resultDate)}</span>
        </Row>
      )}
      {e.lastHeld && !e.pollingDate && (
        <Row icon={CalendarDays} label="Last held">
          <span className="ftp-num">{formatMonthYear(e.lastHeld)}</span>
        </Row>
      )}
      {e.nextExpected && !e.pollingDate && (
        <Row icon={CalendarDays} label="Next expected">
          <span className="ftp-num">~{formatMonthYear(e.nextExpected)}</span>
          {days != null ? (
            <span style={{ color: "var(--ftp-text-2)" }}>
              {" "}(<span className="ftp-num">{Math.abs(Math.round(days / 30))}</span> months away)
            </span>
          ) : null}
        </Row>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>
        <Landmark size={12} aria-hidden style={{ flexShrink: 0, color: "var(--hue)" }} />
        <span>
          {e.body}
          {e.totalSeats ? <>, <span className="ftp-num">{e.totalSeats}</span> seats</> : ""}
        </span>
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
          <span>During the election period, leadership data may change rapidly. Party affiliations and positions shown are as last reported.</span>
        </div>
      )}
    </Card>
  );
}

export default function ElectionSection({ stateSlug }: { stateSlug: string }) {
  const { data, isLoading } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/election-events?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
  if (isLoading || !data?.data?.length) return null;
  const events = data.data;
  return (
    <div style={{ marginTop: 32, marginBottom: 24 }}>
      <Section title="Elections" emoji="🗳️" action={<SourcePill label="ECI" href="https://eci.gov.in" />}>
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
          Election dates and schedules are sourced from the Election Commission of India (eci.gov.in).
          ForThePeople.in is an independent citizen transparency platform and is not affiliated with,
          endorsed by, or acting on behalf of the Election Commission of India or any political party.
          This is not an official election information portal. For official election information, visit{" "}
          <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)" }}>eci.gov.in</a>{" "}
          or contact your local District Election Officer.
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
