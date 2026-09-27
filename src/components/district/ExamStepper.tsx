/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ExamStepper — date-driven milestone strip (no padlocks)
//   done     — milestone date is in the past   → green check (live tone)
//   upcoming — shows the date, "in N days" below → dot in the page hue
//   tba      — date not announced ("TBA")      → grey dot (neutral)
// The exam's status picks the colour of the connector line after the
// next upcoming step. Design v4: the page hue for "coming up", semantic
// tones for done / warning, tabular dates.
//
// i18n: step names, "TBA", the countdown and the Apply button come from
// page_exams.stepper; dates go through useFormat() (the page language).
// ═══════════════════════════════════════════════════════════
"use client";
import { useTranslations } from "next-intl";
import { Check, Circle, ExternalLink } from "lucide-react";
import { useFormat } from "@/i18n/client";

interface ExamStepperProps {
  status: string;
  announcedDate?: string | null;
  notificationDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  admitCardDate?: string | null;
  examDate?: string | null;
  resultDate?: string | null;
  applyUrl?: string | null;
}

type MilestoneState = "done" | "upcoming" | "tba";

/** Milestones in order; each label is page_exams.stepper.<key>. */
const STEPS = ["notification", "apply", "admitCard", "exam", "result"] as const;

function daysBetween(future: string): number | null {
  try {
    const diff = new Date(future).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
  } catch {
    return null;
  }
}

function stateFor(date: string | null | undefined): MilestoneState {
  if (!date) return "tba";
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return "tba";
  return t <= Date.now() ? "done" : "upcoming";
}

// Marker colours per milestone state (all design tokens).
const COLORS: Record<MilestoneState, { bg: string; border: string; icon: string; text: string; line: string }> = {
  done:     { bg: "var(--ftp-live-tint)",  border: "var(--ftp-live)",          icon: "var(--ftp-live-text)", text: "var(--ftp-live-text)", line: "var(--ftp-live)" },
  upcoming: { bg: "var(--hue-tint)",       border: "var(--hue)",               icon: "var(--hue)",           text: "var(--hue-deep)",      line: "var(--hue)" },
  tba:      { bg: "var(--ftp-surface-2)",  border: "var(--ftp-border)",        icon: "var(--ftp-border-strong)", text: "var(--ftp-text-2)", line: "var(--ftp-border)" },
};

// Exam status → connector colour for the upcoming leg.
const STATUS_ACCENT: Record<string, string> = {
  upcoming:             "var(--hue)",
  NOTIFICATION_OUT:     "var(--hue)",
  open:                 "var(--ftp-live)",
  APPLICATIONS_OPEN:    "var(--ftp-live)",
  closed:               "var(--ftp-border-strong)",
  APPLICATIONS_CLOSED:  "var(--ftp-border-strong)",
  ADMIT_CARD_OUT:       "var(--ftp-warn)",
  EXAM_SCHEDULED:       "var(--ftp-danger)",
  RESULT_PENDING:       "var(--ftp-warn)",
  results:              "var(--ftp-warn)",
  RESULT_OUT:           "var(--ftp-warn)",
  COMPLETED:            "var(--ftp-border-strong)",
};

export default function ExamStepper(props: ExamStepperProps) {
  const { status, applyUrl } = props;
  const t = useTranslations("page_exams.stepper");
  const f = useFormat();
  const fmtDate = (d: string | null | undefined): string => {
    if (!d || Number.isNaN(new Date(d).getTime())) return "";
    return f.date(d, { day: "numeric", month: "short", year: "numeric" });
  };
  const accent = STATUS_ACCENT[status] ?? "var(--hue)";

  const milestoneDates: Record<string, string | null | undefined> = {
    notification: props.notificationDate ?? props.announcedDate ?? null,
    apply:        props.startDate ?? null,
    admitCard:    props.admitCardDate ?? null,
    exam:         props.examDate ?? null,
    result:       props.resultDate ?? null,
  };

  const isApplicationsOpen =
    status === "open" || status === "APPLICATIONS_OPEN" || status === "NOTIFICATION_OUT";

  return (
    // Scrolls sideways INSIDE its own box on narrow phones, so the page
    // itself never scrolls horizontally.
    <ol
      aria-label={t("aria")}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        overflowX: "auto",
        paddingBottom: 4,
        margin: 0,
        paddingLeft: 0,
        listStyle: "none",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      {STEPS.map((step, idx) => {
        const date = milestoneDates[step];
        const stepLabel = t(step);
        const s = stateFor(date);
        const c = COLORS[s];

        // Subtitle: the date (or "TBA"); upcoming steps add "in N days" below.
        let subtitle = "";
        let countdown = "";
        if (s === "done") subtitle = fmtDate(date);
        else if (s === "upcoming") {
          const days = date ? daysBetween(date) : null;
          subtitle = fmtDate(date);
          if (days != null && days >= 0) countdown = t("inDays", { n: days });
        } else {
          subtitle = t("tba");
        }

        const connectorColor = idx < STEPS.length - 1
          ? (s === "done" ? c.line : s === "upcoming" ? accent : c.line)
          : undefined;

        return (
          <li key={step} style={{ display: "flex", alignItems: "stretch", flex: "1 0 auto", minWidth: 120 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flex: 1 }}>
              {/* Marker */}
              <div
                role="img"
                aria-label={t(s === "tba" ? "tbaAria" : s === "done" ? "done" : "upcoming", { step: stepLabel })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: c.icon,
                }}
              >
                {s === "done" ? (
                  <Check size={14} aria-hidden />
                ) : (
                  <Circle size={s === "upcoming" ? 8 : 6} fill="currentColor" aria-hidden />
                )}
              </div>
              {/* Label */}
              <div style={{ fontSize: 11, lineHeight: "16px", fontWeight: 500, color: "var(--ftp-text)", marginTop: 6, textAlign: "center" }}>
                {stepLabel}
              </div>
              {/* Date / TBA */}
              <div
                className="ftp-num"
                style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: c.text,
                  marginTop: 2,
                  textAlign: "center",
                  lineHeight: "14px",
                  minHeight: 14,
                }}
              >
                {subtitle}
              </div>
              {countdown && (
                <div className="ftp-num" style={{ fontSize: 10, lineHeight: "14px", fontWeight: 600, color: c.text, textAlign: "center" }}>
                  {countdown}
                </div>
              )}
              {/* Apply button sits under the Applications step when still open */}
              {step === "apply" && isApplicationsOpen && applyUrl && (
                <a
                  href={applyUrl.startsWith("http") ? applyUrl : `https://${applyUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 8,
                    minHeight: 32,
                    padding: "0 12px",
                    background: "var(--hue)",
                    color: "#fff",
                    borderRadius: "var(--ftp-radius-tile)",
                    fontSize: 12,
                    fontWeight: 500,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("applyButton")}
                  <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </div>
            {connectorColor && (
              <div
                aria-hidden
                style={{
                  flex: "0 0 18px",
                  height: 2,
                  background: connectorColor,
                  marginTop: 13,
                  alignSelf: "flex-start",
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
