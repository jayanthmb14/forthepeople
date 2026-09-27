/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one project card (status, people, budget, dates,
 * progress, latest news). Design v3: kit Card + Pill + ProgressBar, Lucide
 * icons instead of emoji, token colours only. Semantic colour appears as
 * text (warn / danger / live) or a dot — never as a tinted box. All the
 * honesty lines (news-derived status, single source, "as of" dates) stay.
 */

"use client";

import { useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, IndianRupee, Newspaper, Scale,
} from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { Card, Pill, ProgressBar } from "@/components/district/ui";
import {
  statusStyle, CategoryIcon, normalizeCategory, normalizeStatus, isDelayed, isCancelled,
  hasCourtMention, formatFullDate, formatINR, formatMonthYear, relativeTime, truncate,
} from "./infra-utils";
import PeopleRow from "./PeopleRow";
import TimelineModal from "./TimelineModal";

/** 11 px secondary line used for the small honesty notes on the card. */
const NOTE: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" };
/** Row of icon + text (budget, dates, latest news). */
const ICON_ROW: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 6 };

export default function ProjectCard({ p }: { p: InfraProject }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle(p.status);
  const normalCategory = normalizeCategory(p.category);
  const updates = p.updates ?? [];
  const latest = updates[0];
  const progress = p.progressPct ?? 0;
  const hasBudgetOverrun = p.costOverrun != null && p.costOverrun !== 0;
  const verifiedCount = p.verificationCount ?? 0;
  const lastTs = p.lastNewsAt ?? null;
  const sourceLabel = lastTs ? "News" : "Seed data";
  const showDelayIcon = isDelayed(p) && normalizeStatus(p.status) !== "COMPLETED";

  return (
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header: name + short description + category·agency line + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ftp-title" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <CategoryIcon category={p.category} size={16} />
            <span>{p.name}</span>
          </h3>
          {p.description && (
            <div
              className="ftp-body"
              style={{
                color: "var(--ftp-text-2)", marginBottom: 6,
                display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                overflow: "hidden", textOverflow: "ellipsis",
              }}
              title={p.description}
            >
              {truncate(p.description, 100)}
            </div>
          )}
          <div className="ftp-label">
            {normalCategory}
            {p.executingAgency && <> · {p.executingAgency}</>}
            {p.scope && p.scope !== "DISTRICT" && <> · {p.scope}</>}
          </div>
        </div>
        <Pill tone={ss.tone} dot icon={showDelayIcon ? AlertTriangle : undefined}>
          {ss.label}
        </Pill>
      </div>

      {/* Sub-judice / court-order badge. Detected from project text or
          timeline updates mentioning court / tribunal / stay-order /
          writ-petition. Stays neutral — only flags that the matter is
          before a court so we don't appear to take sides. */}
      {hasCourtMention(p) && (
        <div style={{ marginBottom: 8 }}>
          <Pill
            tone="warn"
            icon={Scale}
            title="This project is referenced in court proceedings. ForThePeople.in reports the fact, not a judgment on the matter."
          >
            Subject to court proceedings
          </Pill>
        </div>
      )}

      {/* Per-card mini disclaimer for status classifications derived from news.
          Shown for STALLED / CANCELLED / DELAYED (with executing-agency
          contact line) and for COMPLETED (with completion-source date).
          Other statuses stay clean. */}
      {(() => {
        const s = normalizeStatus(p.status);
        if (s === "COMPLETED") {
          const completionUpdate = (p.updates ?? []).find((u) => u.updateType === "COMPLETION" || u.updateType === "INAUGURATION" || u.updateType === "PHASE_COMPLETE");
          const completionDate = p.completionDate ?? completionUpdate?.date ?? p.lastNewsAt ?? null;
          if (!completionDate) return null;
          return (
            <div style={{ ...NOTE, color: "var(--ftp-live-text)", marginBottom: 6 }}>
              Completion reported in news media on <span className="ftp-num">{formatFullDate(completionDate)}</span>.
            </div>
          );
        }
        if (!["STALLED", "CANCELLED", "DELAYED"].includes(s)) return null;
        return (
          <div style={{ ...NOTE, marginBottom: 6 }}>
            Status derived from news reports.
            {p.executingAgency ? <> Contact <span style={{ color: "var(--ftp-text)" }}>{p.executingAgency}</span> for official status.</> : null}
          </div>
        );
      })()}

      {/* People — compact, no Awaiting placeholders per field */}
      <PeopleRow p={p} />

      {/* Budget — always rendered so every card has the same rows */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ ...ICON_ROW, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
          <IndianRupee size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 3 }} />
          {(p.originalBudget != null || p.budget != null) ? (
            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <span className="ftp-num">{formatINR(p.originalBudget ?? p.budget)}</span>
              {p.revisedBudget != null && p.revisedBudget !== p.originalBudget && (
                <>
                  <span style={{ color: "var(--ftp-text-2)" }}>→</span>
                  <span className="ftp-num">{formatINR(p.revisedBudget)}</span>
                </>
              )}
              {hasBudgetOverrun && p.costOverrun != null && (
                <span className="ftp-num" style={{ fontSize: 11, color: p.costOverrun > 0 ? "var(--ftp-warn)" : "var(--ftp-live-text)" }}>
                  ({p.costOverrun > 0 ? "+" : ""}{formatINR(Math.abs(p.costOverrun))}
                  {p.costOverrunPct != null ? ` / ${p.costOverrun > 0 ? "+" : ""}${p.costOverrunPct.toFixed(0)}%` : ""})
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: "var(--ftp-text-2)" }}>Budget not disclosed</span>
          )}
        </div>
        {(p.originalBudget != null || p.budget != null) && (
          <div style={{ ...NOTE, marginTop: 2, paddingLeft: 20 }}>
            As reported in news media
          </div>
        )}
      </div>

      {/* Timeline dates — always rendered.
          Falls back through the project's lifecycle: construction start
          → tender → approval → announcement. Label changes to match the
          most advanced milestone reached so "Not started" projects show
          their proposed/announced date instead of a dash. */}
      <div style={{ ...ICON_ROW, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
        <CalendarDays size={14} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
        <span>
          {(() => {
            const started = p.actualStartDate ?? p.startDate ?? null;
            const fallbackLabel =
              p.tenderDate ? "Tender issued"
              : p.approvedDate ? "Approved"
              : p.announcedDate ? "Announced"
              : null;
            const fallbackDate =
              p.tenderDate ?? p.approvedDate ?? p.announcedDate ?? null;
            const anchorLabel = started ? "Started" : fallbackLabel;
            const anchorDate = started ?? fallbackDate;
            const haveAnything =
              anchorDate || p.originalEndDate || p.expectedEnd || p.revisedEndDate ||
              (isCancelled(p) && p.cancelledDate);
            if (!haveAnything) {
              return <>Timeline not announced</>;
            }
            return (
              <>
                {anchorLabel ?? "Not started"}
                {anchorDate ? <>: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{formatMonthYear(anchorDate)}</span></> : ""}
                {(p.originalEndDate ?? p.expectedEnd) && (
                  <> · Expected: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{formatMonthYear(p.originalEndDate ?? p.expectedEnd)}</span></>
                )}
                {p.revisedEndDate && (
                  <> · <span style={{ color: "var(--ftp-warn)" }}>Revised: <span className="ftp-num">{formatMonthYear(p.revisedEndDate)}</span>{p.delayMonths ? ` (+${p.delayMonths}mo)` : ""}</span></>
                )}
                {isCancelled(p) && p.cancelledDate && (
                  <> · <span style={{ color: "var(--ftp-danger)" }}>Cancelled: <span className="ftp-num">{formatMonthYear(p.cancelledDate)}</span></span></>
                )}
              </>
            );
          })()}
        </span>
      </div>

      {/* Progress — always shown for non-cancelled projects.
          0% reads as "Not started" instead of an empty silent bar.
          Freshness line below the bar makes it clear when the
          percentage was last reflected in news. Without it, a stale
          seed-data figure could be misread as a current measurement. */}
      {!isCancelled(p) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 4 }}>
            <span>Progress</span>
            <span className="ftp-num" style={{ color: progress > 0 ? "var(--ftp-text)" : "var(--ftp-text-2)" }}>
              {progress > 0 ? `${progress}%` : "Not started"}
            </span>
          </div>
          <ProgressBar pct={progress} tone="brand" />
          {progress > 0 && (
            <div style={{ ...NOTE, marginTop: 4 }}>
              {lastTs
                ? <>Progress as of <span className="ftp-num">{formatFullDate(lastTs)}</span></>
                : <>Progress approximate · Last verified: <span className="ftp-num">{formatFullDate(p.lastVerifiedAt)}</span></>
              }
            </div>
          )}
        </div>
      )}

      {/* Single-source / not-yet-verified warning — shown for every
          card with verificationCount <= 1. Keeps wording consistent
          regardless of district or whether the row is seed or news. */}
      {verifiedCount <= 1 && (
        <div style={{ ...NOTE, ...ICON_ROW, gap: 4, color: verifiedCount === 0 ? "var(--ftp-text-2)" : "var(--ftp-warn)", marginBottom: 8 }}>
          {verifiedCount === 0 ? (
            "Not yet cross-verified by news sources"
          ) : (
            <>
              <AlertTriangle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
              Single source — awaiting additional verification
            </>
          )}
        </div>
      )}

      {/* Cancellation reason — danger text, no tinted box */}
      {isCancelled(p) && p.cancellationReason && (
        <div className="ftp-body" style={{ color: "var(--ftp-text)", marginBottom: 6 }}>
          <span style={{ fontWeight: 500, color: "var(--ftp-danger)" }}>Cancellation reason:</span> {p.cancellationReason}
        </div>
      )}

      {/* Latest news — always rendered for layout consistency. When the
          only updates are from seed/manual/admin-edit, show a quiet
          placeholder instead of the internal ref; real news will replace
          it automatically on the next news-cron run. */}
      {(() => {
        const isRealNews = latest && !["admin-panel", "seed-data", "manual-research", "ai-enrichment"].includes(latest.newsUrl);
        return (
          <div style={{ ...ICON_ROW, alignItems: "center", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", marginBottom: 8, minWidth: 0 }}>
            <Newspaper size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
            {isRealNews && latest ? (
              <a
                href={latest.newsUrl.startsWith("http") ? latest.newsUrl : `https://${latest.newsUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--ftp-text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
                title={latest.headline}
              >
                {truncate(latest.headline, 60)}
                {latest.newsSource && <span style={{ color: "var(--ftp-text-2)" }}> — {latest.newsSource}, {formatFullDate(latest.date)}</span>}
              </a>
            ) : (
              <span style={{ color: "var(--ftp-text-2)" }}>
                No news coverage yet — updates as articles are published
              </span>
            )}
          </div>
        );
      })()}

      {/* Footer: Last updated · Source · View Timeline (N) */}
      <div
        style={{
          marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--ftp-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, flexWrap: "wrap", ...NOTE,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          Last updated: {lastTs ? relativeTime(lastTs) : "—"} · Source: {sourceLabel}
          {verifiedCount > 0 && (
            <>
              {" · "}
              <CheckCircle2 size={12} aria-label="Verified sources" style={{ color: "var(--ftp-live-text)" }} />
              <span className="ftp-num">{verifiedCount}</span>
            </>
          )}
        </span>
        {/* ftp-chip = 32 px tall on desktop, 44 px tap target on phones. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ftp-chip"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: 0,
            background: "none", border: "none", color: "var(--ftp-brand)",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}
          aria-haspopup="dialog"
        >
          View Timeline{updates.length > 0 ? ` (${updates.length})` : ""}
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>

      {open && <TimelineModal p={p} onClose={() => setOpen(false)} />}
    </Card>
  );
}
