/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one project card (status, people, budget, dates, progress, latest news).
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

"use client";

import { useState } from "react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import {
  statusStyle, categoryIcon, normalizeCategory, normalizeStatus, isDelayed, isCancelled,
  hasCourtMention, formatFullDate, formatINR, formatMonthYear, relativeTime, truncate,
} from "./infra-utils";
import PeopleRow from "./PeopleRow";
import TimelineModal from "./TimelineModal";

export default function ProjectCard({ p }: { p: InfraProject }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle(p.status);
  const Icon = categoryIcon(p.category);
  const normalCategory = normalizeCategory(p.category);
  const updates = p.updates ?? [];
  const latest = updates[0];
  const progress = p.progressPct ?? 0;
  const hasBudgetOverrun = p.costOverrun != null && p.costOverrun !== 0;
  const verifiedCount = p.verificationCount ?? 0;
  const lastTs = p.lastNewsAt ?? null;
  const sourceLabel = lastTs ? "News" : "Seed data";

  return (
    <div
      style={{
        background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14,
        padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        display: "flex", flexDirection: "column", gap: 0,
      }}
    >
      {/* Header: name + short description + category·agency line + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Icon size={17} style={{ color: "#2563EB", flexShrink: 0 }} />
            <span>{p.name}</span>
          </div>
          {p.description && (
            <div
              style={{
                fontSize: 13, color: "#6B6B6B", lineHeight: 1.45, marginBottom: 6,
                display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                overflow: "hidden", textOverflow: "ellipsis",
              }}
              title={p.description}
            >
              {truncate(p.description, 100)}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#9B9B9B", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
            {normalCategory}
            {p.executingAgency && <> · {p.executingAgency}</>}
            {p.scope && p.scope !== "DISTRICT" && <> · {p.scope}</>}
          </div>
        </div>
        <span
          style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
            whiteSpace: "nowrap",
          }}
        >
          {ss.label}{isDelayed(p) && normalizeStatus(p.status) !== "COMPLETED" ? " ⚠" : ""}
        </span>
      </div>

      {/* Sub-judice / court-order badge. Detected from project text or
          timeline updates mentioning court / tribunal / stay-order /
          writ-petition. Stays neutral — only flags that the matter is
          before a court so we don't appear to take sides. */}
      {hasCourtMention(p) && (
        <div
          style={{
            display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6,
            padding: "3px 10px", marginBottom: 8, borderRadius: 20,
            background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
            fontSize: 11, fontWeight: 600,
          }}
          title="This project is referenced in court proceedings. ForThePeople.in reports the fact, not a judgment on the matter."
        >
          ⚖️ Subject to court proceedings
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
            <div style={{ fontSize: 11, color: "#16A34A", fontStyle: "italic", marginBottom: 6, lineHeight: 1.4 }}>
              Completion reported in news media on {formatFullDate(completionDate)}.
            </div>
          );
        }
        if (!["STALLED", "CANCELLED", "DELAYED"].includes(s)) return null;
        return (
          <div style={{ fontSize: 11, color: "#9B9B9B", fontStyle: "italic", marginBottom: 6, lineHeight: 1.4 }}>
            Status derived from news reports.
            {p.executingAgency ? <> Contact <span style={{ color: "#6B7280" }}>{p.executingAgency}</span> for official status.</> : null}
          </div>
        );
      })()}

      {/* People — compact, no Awaiting placeholders per field */}
      <PeopleRow p={p} />

      {/* Budget — always rendered so every card has the same rows */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "#1A1A1A", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          {(p.originalBudget != null || p.budget != null) ? (
            <>
              <span>💰 <strong>{formatINR(p.originalBudget ?? p.budget)}</strong></span>
              {p.revisedBudget != null && p.revisedBudget !== p.originalBudget && (
                <>
                  <span style={{ color: "#9B9B9B" }}>→</span>
                  <strong>{formatINR(p.revisedBudget)}</strong>
                </>
              )}
              {hasBudgetOverrun && p.costOverrun != null && (
                <span style={{ fontSize: 11, color: p.costOverrun > 0 ? "#B45309" : "#16A34A" }}>
                  ({p.costOverrun > 0 ? "+" : ""}{formatINR(Math.abs(p.costOverrun))}
                  {p.costOverrunPct != null ? ` / ${p.costOverrun > 0 ? "+" : ""}${p.costOverrunPct.toFixed(0)}%` : ""})
                </span>
              )}
            </>
          ) : (
            <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>💰 Budget not disclosed</span>
          )}
        </div>
        {(p.originalBudget != null || p.budget != null) && (
          <div style={{ fontSize: 10, color: "#9B9B9B", fontStyle: "italic", marginTop: 2 }}>
            As reported in news media
          </div>
        )}
      </div>

      {/* Timeline dates — always rendered.
          Falls back through the project's lifecycle: construction start
          → tender → approval → announcement. Label changes to match the
          most advanced milestone reached so "Not started" projects show
          their proposed/announced date instead of a dash. */}
      <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6 }}>
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
            return <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>📅 Timeline not announced</span>;
          }
          return (
            <>
              📅 {anchorLabel ?? "Not started"}
              {anchorDate ? <>: <strong>{formatMonthYear(anchorDate)}</strong></> : ""}
              {(p.originalEndDate ?? p.expectedEnd) && (
                <> · Expected: <strong>{formatMonthYear(p.originalEndDate ?? p.expectedEnd)}</strong></>
              )}
              {p.revisedEndDate && (
                <> · <span style={{ color: "#B45309" }}>Revised: {formatMonthYear(p.revisedEndDate)}{p.delayMonths ? ` (+${p.delayMonths}mo)` : ""}</span></>
              )}
              {isCancelled(p) && p.cancelledDate && (
                <> · <span style={{ color: "#B91C1C" }}>Cancelled: {formatMonthYear(p.cancelledDate)}</span></>
              )}
            </>
          );
        })()}
      </div>

      {/* Progress — always shown for non-cancelled projects.
          0% reads as "Not started" instead of an empty silent bar.
          Freshness line below the bar makes it clear when the
          percentage was last reflected in news. Without it, a stale
          seed-data figure could be misread as a current measurement. */}
      {!isCancelled(p) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6B7280", marginBottom: 3 }}>
            <span>Progress</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: progress > 0 ? "#1A1A1A" : "#9CA3AF" }}>
              {progress > 0 ? `${progress}%` : "Not started"}
            </span>
          </div>
          <div style={{ height: 6, background: "#F0F0EC", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(0.5, Math.min(100, progress))}%`, height: "100%",
                // A sliver of colour at 0% so the bar never looks broken.
                background: progress >= 75 ? "#16A34A"
                  : progress >= 40 ? "#D97706"
                  : progress > 0 ? "#2563EB"
                  : "#D1D5DB",
                transition: "width 500ms ease",
              }}
            />
          </div>
          {progress > 0 && (
            <div style={{ fontSize: 10, color: "#9B9B9B", fontStyle: "italic", marginTop: 3 }}>
              {lastTs
                ? <>Progress as of {formatFullDate(lastTs)}</>
                : <>Progress approximate · Last verified: {formatFullDate(p.lastVerifiedAt)}</>
              }
            </div>
          )}
        </div>
      )}

      {/* Single-source / not-yet-verified warning — shown for every
          card with verificationCount <= 1. Keeps wording consistent
          regardless of district or whether the row is seed or news. */}
      {verifiedCount <= 1 && (
        <div style={{ fontSize: 10, color: verifiedCount === 0 ? "#9B9B9B" : "#B45309", fontStyle: "italic", marginBottom: 8, lineHeight: 1.4 }}>
          {verifiedCount === 0
            ? "Not yet cross-verified by news sources"
            : "⚠ Single source — awaiting additional verification"}
        </div>
      )}

      {/* Cancellation reason */}
      {isCancelled(p) && p.cancellationReason && (
        <div style={{ fontSize: 12, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
          <strong>Cancellation reason:</strong> {p.cancellationReason}
        </div>
      )}

      {/* Latest news — always rendered for layout consistency. When the
          only updates are from seed/manual/admin-edit, show an italic
          placeholder instead of the internal ref; real news will replace
          it automatically on the next news-cron run. */}
      {(() => {
        const isRealNews = latest && !["admin-panel", "seed-data", "manual-research", "ai-enrichment"].includes(latest.newsUrl);
        return (
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isRealNews && latest ? (
              <a
                href={latest.newsUrl.startsWith("http") ? latest.newsUrl : `https://${latest.newsUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#374151", textDecoration: "none" }}
                title={latest.headline}
              >
                📰 {truncate(latest.headline, 60)}
                {latest.newsSource && <span style={{ color: "#9B9B9B" }}> — {latest.newsSource}, {formatFullDate(latest.date)}</span>}
              </a>
            ) : (
              <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                📰 No news coverage yet — updates as articles are published
              </span>
            )}
          </div>
        );
      })()}

      {/* Footer: Last updated · Source · View Timeline (N) → */}
      <div
        style={{
          marginTop: "auto", paddingTop: 8, borderTop: "1px solid #F0F0EC",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, flexWrap: "wrap", fontSize: 11, color: "#9CA3AF",
        }}
      >
        <span>
          Last updated: {lastTs ? relativeTime(lastTs) : "—"} · Source: {sourceLabel}
          {verifiedCount > 0 && <> · ✅ {verifiedCount}</>}
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 0",
            background: "none", border: "none", color: "#2563EB",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
          aria-haspopup="dialog"
        >
          View Timeline{updates.length > 0 ? ` (${updates.length})` : ""} →
        </button>
      </div>

      {open && <TimelineModal p={p} onClose={() => setOpen(false)} />}
    </div>
  );
}
