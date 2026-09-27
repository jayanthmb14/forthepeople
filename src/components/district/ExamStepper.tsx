/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ExamStepper — an exam's six dates, with a "Today" marker
// ═══════════════════════════════════════════════════════════
//   Notification → Applications open → Last date → Admit card → Exam → Result
//
// Two looks (v5, page hue, no emoji):
//   compact  a row of six dots with a "Today" mark on the line where today
//            falls, and the same meaning in one visible sentence under it
//            ("3 of 6 steps done. Next: Exam on 12 Oct"). Fits a 280 px card.
//   full     a vertical list for the detail sheet: each step with a small
//            line icon, its date (or "Not announced yet") and "Done" /
//            "Today" / "In 12 days", and a "Today" row between what has
//            happened and what is next.
//
// Dates are the boards' dates as stored (never guessed); days are counted
// in India time. Text: page_exams.stepper; dates via useFormat().
// ═══════════════════════════════════════════════════════════
"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Award, CalendarClock, Check, FileText, MapPin, Megaphone, PenLine, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFormat } from "@/i18n/client";
import { examSteps, type ExamDates, type ExamStep, type ExamStepKey } from "@/components/community/examTimeline";

/** A small line icon per step (full list only). */
const STEP_ICON: Record<ExamStepKey, LucideIcon> = {
  notification: Megaphone,
  applyOpen: PenLine,
  lastDate: CalendarClock,
  admitCard: Ticket,
  exam: FileText,
  result: Award,
};

interface ExamStepperProps extends ExamDates {
  /** Milliseconds "now" (one value per page, see useNow). */
  now: number;
  variant?: "compact" | "full";
  /** Show "In 12 days" beside future dates (full list). Off for dates that are not confirmed. */
  relative?: boolean;
}

/** Index after which the "Today" marker sits (−1 = before the first step), or null with no dates. */
function todaySlot(steps: ExamStep[]): number | null {
  if (steps.every((s) => s.state === "tba")) return null;
  let lastDone = -1;
  steps.forEach((s, i) => {
    if (s.state === "done") lastDone = i;
  });
  return lastDone;
}

const DOT: Record<ExamStep["state"], React.CSSProperties> = {
  done: { background: "var(--hue)", border: "2px solid var(--hue)", color: "#fff" },
  next: { background: "#fff", border: "3px solid var(--hue)", color: "var(--hue-deep)", boxShadow: "0 0 0 4px color-mix(in srgb, var(--hue) 18%, transparent)" },
  later: { background: "#fff", border: "2px solid var(--hue-pop)", color: "var(--hue-deep)" },
  tba: { background: "var(--ftp-surface-2)", border: "2px dashed var(--ftp-border-strong)", color: "var(--ftp-text-2)" },
};

export default function ExamStepper({ now, variant = "compact", relative = true, ...dates }: ExamStepperProps) {
  const t = useTranslations("page_exams.stepper");
  const f = useFormat();
  const steps = examSteps(dates, now);
  const slot = todaySlot(steps);
  const fmt = (d: string) => f.date(d, { day: "numeric", month: "short", year: "numeric" });
  const doneCount = steps.filter((s) => s.state === "done").length;
  const next = steps.find((s) => s.state === "next");

  const summary =
    slot === null
      ? t("summaryNone")
      : next && next.date
        ? t("summaryNext", { done: doneCount, total: steps.length, step: t(next.key), date: fmt(next.date) })
        : t("summaryAllDone", { done: doneCount, total: steps.length });

  if (variant === "full") {
    const rows: Array<{ kind: "step"; step: ExamStep } | { kind: "today" }> = [];
    if (slot === -1) rows.push({ kind: "today" });
    steps.forEach((s, i) => {
      rows.push({ kind: "step", step: s });
      if (slot === i) rows.push({ kind: "today" });
    });
    return (
      <ol aria-label={t("aria")} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
        {rows.map((row, i) => {
          const last = i === rows.length - 1;
          if (row.kind === "today") {
            return (
              <li key="today" style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <span aria-hidden style={{ width: 36, display: "inline-flex", justifyContent: "center", flexShrink: 0, color: "var(--hue-deep)" }}>
                  <MapPin size={18} />
                </span>
                <span
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    lineHeight: "18px",
                    fontWeight: 700,
                    color: "var(--hue-deep)",
                  }}
                >
                  <span suppressHydrationWarning>{t("todayRow", { date: fmt(new Date(now).toISOString()) })}</span>
                  <span aria-hidden style={{ flex: 1, height: 0, borderTop: "2px dashed color-mix(in srgb, var(--hue) 45%, transparent)" }} />
                </span>
              </li>
            );
          }
          const s = row.step;
          const whenText =
            s.state === "done"
              ? t("done")
              : s.state === "tba"
                ? t("tba")
                : relative
                  ? t("when", { n: s.days ?? 0 })
                  : "";
          return (
            <li key={s.key} style={{ display: "flex", gap: 10, position: "relative", paddingBottom: last ? 0 : 10 }}>
              {!last && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 17,
                    top: 36,
                    bottom: 0,
                    width: 2,
                    background: s.state === "done" ? "var(--hue)" : "var(--ftp-border)",
                  }}
                />
              )}
              <span
                aria-hidden
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  flexShrink: 0,
                  ...DOT[s.state],
                  ...(s.state === "done" ? { background: "var(--hue-tint)", color: "var(--hue-deep)" } : {}),
                }}
              >
                {React.createElement(STEP_ICON[s.key], { size: 16, style: { opacity: s.state === "tba" ? 0.55 : 1 } })}
                {s.state === "done" && (
                  <span
                    style={{
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "var(--hue)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </span>
              <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 650, color: s.state === "tba" ? "var(--ftp-text-2)" : "var(--ftp-text)" }}>
                  {t(s.key)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)" }}>
                  {s.date && <span className="ftp-num" suppressHydrationWarning>{fmt(s.date)}</span>}
                  <span
                    suppressHydrationWarning
                    style={{
                      fontWeight: s.state === "next" ? 700 : 500,
                      color: s.state === "next" ? "var(--hue-deep)" : undefined,
                    }}
                  >
                    {whenText}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // Compact: dots + lines, a "Today" mark, and the same meaning as a sentence.
  const segment = (after: number, key: string, grow = true) => {
    const isToday = slot === after;
    const doneLine = after >= 0 && after < steps.length - 1 && steps[after].state === "done" && steps[after + 1].state === "done";
    return (
      <div key={key} aria-hidden style={{ position: "relative", flex: grow ? "1 1 0" : "0 0 28px", minWidth: grow ? 8 : 28, height: 22, display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%", height: 3, borderRadius: 3, background: doneLine ? "var(--hue)" : "color-mix(in srgb, var(--hue-pop) 55%, var(--ftp-border))" }} />
        {isToday && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: -3,
              bottom: -3,
              width: 3,
              marginLeft: -1.5,
              borderRadius: 3,
              background: "var(--hue-deep)",
            }}
          />
        )}
        {isToday && (
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 24,
              transform: "translateX(-50%)",
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 700,
              color: "var(--hue-deep)",
              whiteSpace: "nowrap",
            }}
          >
            {t("today")}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{ paddingTop: 4, paddingBottom: 2 }}>
    <div role="img" aria-label={summary} style={{ paddingBottom: slot === null ? 0 : 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {slot === -1 && segment(-1, "lead", false)}
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div aria-hidden style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  ...DOT[s.state],
                }}
              >
                {s.state === "done" && <Check size={12} strokeWidth={3} />}
              </span>
            </div>
            {i < steps.length - 1 && segment(i, `seg-${s.key}`)}
          </React.Fragment>
        ))}
        {slot === steps.length - 1 && segment(steps.length - 1, "tail", false)}
      </div>
    </div>
    <p aria-hidden style={{ margin: "6px 0 0", fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }} suppressHydrationWarning>
      {summary}
    </p>
    </div>
  );
}
