/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ExamStepper — date-driven milestone strip (no padlocks)
//   ✅ green — milestone date is in the past
//   🔵 blue  — upcoming, shows date + "in N days"
//   ⬜ grey  — date not announced ("TBA")
// Status pill colors the connector. No paywall feel.
// ═══════════════════════════════════════════════════════════
"use client";
import { ExternalLink } from "lucide-react";

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

const STEPS: Array<{ key: string; label: string }> = [
  { key: "notification", label: "Notification" },
  { key: "apply",        label: "Applications" },
  { key: "admitCard",    label: "Admit Card" },
  { key: "exam",         label: "Exam" },
  { key: "result",       label: "Result" },
];

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

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

const COLORS: Record<MilestoneState, { bg: string; border: string; dot: string; text: string }> = {
  done:     { bg: "#F0FDF4", border: "#86EFAC", dot: "#16A34A", text: "#166534" },
  upcoming: { bg: "#EFF6FF", border: "#BFDBFE", dot: "#2563EB", text: "#1E40AF" },
  tba:      { bg: "#F5F5F0", border: "#E8E8E4", dot: "#C0C0BA", text: "#9B9B9B" },
};

const STATUS_ACCENT: Record<string, string> = {
  upcoming:             "#2563EB",
  NOTIFICATION_OUT:     "#2563EB",
  open:                 "#16A34A",
  APPLICATIONS_OPEN:    "#16A34A",
  closed:               "#6B7280",
  APPLICATIONS_CLOSED:  "#6B7280",
  ADMIT_CARD_OUT:       "#D97706",
  EXAM_SCHEDULED:       "#DC2626",
  RESULT_PENDING:       "#D97706",
  results:              "#D97706",
  RESULT_OUT:           "#D97706",
  COMPLETED:            "#6B7280",
};

export default function ExamStepper(props: ExamStepperProps) {
  const { status, applyUrl } = props;
  const accent = STATUS_ACCENT[status] ?? "#2563EB";

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
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        overflowX: "auto",
        paddingBottom: 4,
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      {STEPS.map((step, idx) => {
        const date = milestoneDates[step.key];
        const s = stateFor(date);
        const c = COLORS[s];

        // Subtitle: dated ISO or "TBA"
        let subtitle = "";
        if (s === "done") subtitle = fmtDate(date);
        else if (s === "upcoming") {
          const days = date ? daysBetween(date) : null;
          subtitle = days != null && days >= 0
            ? `${fmtDate(date)} · in ${days} day${days !== 1 ? "s" : ""}`
            : fmtDate(date);
        } else {
          subtitle = "TBA";
        }

        const connectorColor = idx < STEPS.length - 1
          ? (s === "done" ? "#86EFAC" : s === "upcoming" ? accent : "#E8E8E4")
          : undefined;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "stretch", flex: "1 0 auto", minWidth: 120 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, flex: 1 }}>
              {/* Dot */}
              <div
                aria-label={`${step.label}: ${s === "tba" ? "date not announced" : s === "done" ? "completed" : "upcoming"}`}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: c.bg,
                  border: `2px solid ${c.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: c.dot,
                }}
              >
                {s === "done" ? "✓" : s === "upcoming" ? "●" : "·"}
              </div>
              {/* Label */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", marginTop: 6, textAlign: "center" }}>
                {step.label}
              </div>
              {/* Subtitle */}
              <div
                style={{
                  fontSize: 10,
                  color: c.text,
                  marginTop: 2,
                  textAlign: "center",
                  lineHeight: 1.3,
                  minHeight: 14,
                }}
              >
                {subtitle}
              </div>
              {/* Apply button sits under the Applications step when still open */}
              {step.key === "apply" && isApplicationsOpen && applyUrl && (
                <a
                  href={applyUrl.startsWith("http") ? applyUrl : `https://${applyUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 8,
                    padding: "4px 10px",
                    background: "#16A34A",
                    color: "#FFF",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Apply ↗
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
            {connectorColor && (
              <div
                style={{
                  flex: "0 0 18px",
                  height: 2,
                  background: connectorColor,
                  marginTop: 20,
                  alignSelf: "flex-start",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
