"use client";
import { CalendarDays } from "lucide-react";

// Horizontal Gantt-style tender lifecycle timeline.
// Past events: filled dot. Current event: larger filled dot. Future: outlined.
//
// Colours are tokens (no hex), dates are in the reader's language (IST),
// and there is no pulsing or glow — the "current" step is simply the
// bigger dot and the bolder label in the list below. Event names are
// translated by type (page_tenders.timeline.<TYPE>); the API's English
// label is the fallback for anything new.

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

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

export default function TenderGanttTimeline({ events }: { events: TimelineEvent[] }) {
  const t = useTranslations("page_tenders");
  const f = useFormat();
  const { earliest, spanMs } = useMemo(() => {
    if (events.length === 0) return { earliest: 0, spanMs: 1 };
    const ts = events.map((e) => new Date(e.at).getTime());
    const e = Math.min(...ts);
    const l = Math.max(...ts);
    return { earliest: e, spanMs: Math.max(1, l - e) };
  }, [events]);

  /** "Corrigendum #2" → "Corrigendum 2"; "Completed" vs "Expected completion" kept apart. */
  const labelOf = (e: TimelineEvent) => {
    if (e.type === "CORRIGENDUM") {
      const n = /#(\d+)/.exec(e.label)?.[1];
      return n ? t("timeline.corrigendumN", { n }) : t("timeline.CORRIGENDUM");
    }
    if (e.type === "COMPLETION") return e.label === "Completed" ? t("timeline.COMPLETED") : t("timeline.COMPLETION");
    return t.has(`timeline.${e.type}`) ? t(`timeline.${e.type}`) : e.label;
  };
  const dateOf = (iso: string) => f.date(iso, { day: "2-digit", month: "short", year: "numeric" });

  if (events.length === 0) {
    return (
      <Card>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("timeline.empty")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="ftp-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 28, height: 28, borderRadius: 9 }}><CalendarDays size={15} /></span>
        {t("timeline.title")}
      </div>
      {/* The bar: every event placed by date between the first and last one. */}
      <div aria-hidden style={{ position: "relative", height: 40, margin: "0 8px 16px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 4, background: "var(--hue-tint)", borderRadius: "var(--ftp-radius-pill)" }} />
        {events.map((e, i) => {
          const pos = ((new Date(e.at).getTime() - earliest) / spanMs) * 100;
          const colour = COLORS[e.type] ?? DEFAULT_COLOR;
          const isPast = e.status === "past" || e.status === "current";
          const size = e.status === "current" ? 18 : 14;
          return (
            <div
              key={i}
              title={t("timeline.dotHint", { label: labelOf(e), time: `${dateOf(e.at)}, ${f.time(e.at, { hour: "2-digit", minute: "2-digit" })}` })}
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
            <span className="ftp-num" style={{ minWidth: 104, flexShrink: 0, color: "var(--ftp-text-2)", fontWeight: 400 }}>
              {dateOf(e.at)}
            </span>
            <span style={{ fontWeight: e.status === "current" ? 600 : 400 }}>
              {labelOf(e)}
              {e.status === "current" && <span className="sr-only"> {t("timeline.current")}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
