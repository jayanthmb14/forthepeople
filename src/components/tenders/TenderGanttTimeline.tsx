"use client";

// Horizontal Gantt-style tender lifecycle timeline.
// Past events: filled dot. Current event: larger filled dot. Future: outlined.
//
// Design v3: colours are tokens (no hex), dates are mono, and there is no
// pulsing or glow — the "current" step is simply the bigger dot and the
// bold-ish (500) label in the list below.

import { useMemo } from "react";
import { Card } from "@/components/district/ui";

export type TimelineEvent = {
  at: string;
  type: string;
  label: string;
  status: "past" | "current" | "future";
};

/** Event type → dot colour (v3 tokens and the shared accent ramps). */
const COLORS: Record<string, string> = {
  PUBLISHED: "var(--ftp-brand)",
  PRE_BID: "var(--ftp-features)",
  CORRIGENDUM: "var(--ftp-warn)",
  CLOSING: "var(--ftp-danger)",
  OPENING_TECH: "var(--accent-teal-700)",
  OPENING_FIN: "var(--accent-teal-700)",
  AWARD: "var(--ftp-live)",
  CONTRACT: "var(--ftp-live-text)",
  COMPLETION: "var(--ftp-live-text)",
};
const DEFAULT_COLOR = "var(--ftp-text-2)";

/** "12 Sep 2026" in IST. */
function dateIST(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export default function TenderGanttTimeline({ events }: { events: TimelineEvent[] }) {
  const { earliest, spanMs } = useMemo(() => {
    if (events.length === 0) return { earliest: 0, spanMs: 1 };
    const ts = events.map((e) => new Date(e.at).getTime());
    const e = Math.min(...ts);
    const l = Math.max(...ts);
    return { earliest: e, spanMs: Math.max(1, l - e) };
  }, [events]);

  if (events.length === 0) {
    return (
      <Card>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>No timeline events yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="ftp-title" style={{ marginBottom: 12 }}>Timeline</div>
      {/* The bar: every event placed by date between the first and last one. */}
      <div aria-hidden style={{ position: "relative", height: 40, margin: "0 8px 16px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, background: "var(--ftp-surface-2)", borderRadius: "var(--ftp-radius-pill)" }} />
        {events.map((e, i) => {
          const pos = ((new Date(e.at).getTime() - earliest) / spanMs) * 100;
          const colour = COLORS[e.type] ?? DEFAULT_COLOR;
          const isPast = e.status === "past" || e.status === "current";
          const size = e.status === "current" ? 18 : 14;
          return (
            <div
              key={i}
              title={`${e.label} — ${new Date(e.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`}
              style={{
                position: "absolute",
                left: `calc(${pos}% - ${size / 2}px)`,
                top: 20 - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: isPast ? colour : "var(--ftp-surface)",
                border: `2px solid ${colour}`,
                cursor: "help",
              }}
            />
          );
        })}
      </div>
      {/* The list: the same events as readable rows (this is what screen readers get). */}
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {events.map((e, i) => (
          <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
            <span aria-hidden style={{ width: 8, height: 8, marginTop: 6, borderRadius: "50%", background: COLORS[e.type] ?? DEFAULT_COLOR, flexShrink: 0, opacity: e.status === "future" ? 0.4 : 1 }} />
            <span className="ftp-num" style={{ width: 104, flexShrink: 0, color: "var(--ftp-text-2)", fontWeight: 400 }}>
              {dateIST(e.at)}
            </span>
            <span style={{ fontWeight: e.status === "current" ? 500 : 400 }}>
              {e.label}
              {e.status === "current" && <span className="sr-only"> (current step)</span>}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
