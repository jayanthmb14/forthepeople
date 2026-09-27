/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one project card (status, people, budget, dates,
 * progress, latest news). Design v4: kit Card + Pill + ProgressBar, the
 * category emoji in a chip of the module hue, a hue progress bar and a
 * hue "View timeline" link. Semantic colour (warn / danger / live) stays
 * as text or a dot for status. Facts sit side by side as small items
 * instead of "·"-joined strings. All the honesty lines (news-derived
 * status, single source, "as of" dates) stay, in the reader's language
 * (page_infrastructure); project names and news text stay as published.
 */

"use client";

import { useState } from "react";
import {
  AlertTriangle, CalendarDays, CheckCircle2, IndianRupee, Newspaper, Scale,
} from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { Card, Pill, ProgressBar } from "@/components/district/ui";
import {
  statusStyle, categoryEmoji, normalizeStatus, isDelayed, isCancelled,
  hasCourtMention, truncate,
} from "./infra-utils";
import { useInfraText } from "./infra-i18n";
import PeopleRow from "./PeopleRow";
import TimelineModal from "./TimelineModal";

/** 11 px secondary line used for the small honesty notes on the card. */
const NOTE: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" };
/** Row of icon + text (budget, dates, latest news). */
const ICON_ROW: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 6 };
/** Facts that sit side by side and wrap (dates, footer). */
const FACTS: React.CSSProperties = { display: "inline-flex", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 2 };

const numText = (c: React.ReactNode) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span>;
const numPlain = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;
const agencyText = (c: React.ReactNode) => <span style={{ color: "var(--ftp-text)" }}>{c}</span>;

export default function ProjectCard({ p }: { p: InfraProject }) {
  const { t, m, category, status, scope, inr, monthYear, fullDate, ago } = useInfraText();
  const [open, setOpen] = useState(false);
  const ss = statusStyle(p.status);
  const updates = p.updates ?? [];
  const latest = updates[0];
  const progress = p.progressPct ?? 0;
  const hasBudgetOverrun = p.costOverrun != null && p.costOverrun !== 0;
  const verifiedCount = p.verificationCount ?? 0;
  const lastTs = p.lastNewsAt ?? null;
  const showDelayIcon = isDelayed(p) && normalizeStatus(p.status) !== "COMPLETED";

  return (
    <Card as="article" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header: name + short description + category / agency + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ftp-title" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, borderRadius: 10, fontSize: 17 }}>
              {categoryEmoji(p.category)}
            </span>
            <span style={{ minWidth: 0 }}>{p.name}</span>
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
          <div className="ftp-label" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            <span
              style={{
                padding: "1px 8px", borderRadius: "var(--ftp-radius-pill)",
                background: "var(--hue-tint)", color: "var(--hue-deep)",
              }}
            >
              {category(p.category)}
            </span>
            {p.executingAgency && <span>{p.executingAgency}</span>}
            {p.scope && p.scope !== "DISTRICT" && (
              <span style={{ padding: "1px 8px", borderRadius: "var(--ftp-radius-pill)", border: "1px solid var(--ftp-border)" }}>
                {scope(p.scope)}
              </span>
            )}
          </div>
        </div>
        <Pill tone={ss.tone} dot icon={showDelayIcon ? AlertTriangle : undefined}>
          {status(p.status)}
        </Pill>
      </div>

      {/* Sub-judice / court-order badge. Detected from project text or
          timeline updates mentioning court / tribunal / stay-order /
          writ-petition. Stays neutral — only flags that the matter is
          before a court so we don't appear to take sides. */}
      {hasCourtMention(p) && (
        <div style={{ marginBottom: 8 }}>
          <Pill tone="warn" icon={Scale} title={t("card.courtHint")}>
            {t("card.court")}
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
              {t.rich("card.completedOn", { date: fullDate(completionDate), n: numPlain })}
            </div>
          );
        }
        if (!["STALLED", "CANCELLED", "DELAYED"].includes(s)) return null;
        return (
          <div style={{ ...NOTE, marginBottom: 6 }}>
            {t("card.statusFromNews")}
            {p.executingAgency ? <> {t.rich("card.contactAgency", { agency: p.executingAgency, a: agencyText })}</> : null}
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
              <span className="ftp-num">{inr(p.originalBudget ?? p.budget)}</span>
              {p.revisedBudget != null && p.revisedBudget !== p.originalBudget && (
                <>
                  <span aria-hidden style={{ color: "var(--ftp-text-2)" }}>→</span>
                  <span className="sr-only">{t("card.revisedTo")}</span>
                  <span className="ftp-num">{inr(p.revisedBudget)}</span>
                </>
              )}
              {hasBudgetOverrun && p.costOverrun != null && (
                <span className="ftp-num" style={{ fontSize: 11, color: p.costOverrun > 0 ? "var(--ftp-warn)" : "var(--ftp-live-text)" }}>
                  ({p.costOverrun > 0 ? "+" : "−"}{inr(Math.abs(p.costOverrun))}
                  {p.costOverrunPct != null ? ` / ${p.costOverrun > 0 ? "+" : ""}${m.num(p.costOverrunPct)}%` : ""})
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: "var(--ftp-text-2)" }}>{t("card.budgetUnknown")}</span>
          )}
        </div>
        {(p.originalBudget != null || p.budget != null) && (
          <div style={{ ...NOTE, marginTop: 2, paddingLeft: 20 }}>
            {t("card.asReported")}
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
            const fallbackKey =
              p.tenderDate ? "tenderIssued"
              : p.approvedDate ? "approved"
              : p.announcedDate ? "announced"
              : null;
            const fallbackDate = p.tenderDate ?? p.approvedDate ?? p.announcedDate ?? null;
            const anchorKey = started ? "started" : fallbackKey;
            const anchorDate = started ?? fallbackDate;
            const expected = p.originalEndDate ?? p.expectedEnd;
            const haveAnything =
              anchorDate || expected || p.revisedEndDate || (isCancelled(p) && p.cancelledDate);
            if (!haveAnything) {
              return <>{t("card.noTimeline")}</>;
            }
            return (
              <span style={FACTS}>
                <span>
                  {anchorKey && anchorDate
                    ? t.rich(`card.date.${anchorKey}`, { date: monthYear(anchorDate), n: numText })
                    : t("card.notStarted")}
                </span>
                {expected && (
                  <span>{t.rich("card.date.expected", { date: monthYear(expected), n: numText })}</span>
                )}
                {p.revisedEndDate && (
                  <span style={{ color: "var(--ftp-warn)" }}>
                    {p.delayMonths
                      ? t.rich("card.date.revisedLate", { date: monthYear(p.revisedEndDate), months: p.delayMonths, n: numPlain })
                      : t.rich("card.date.revised", { date: monthYear(p.revisedEndDate), n: numPlain })}
                  </span>
                )}
                {isCancelled(p) && p.cancelledDate && (
                  <span style={{ color: "var(--ftp-danger)" }}>{t.rich("card.date.cancelled", { date: monthYear(p.cancelledDate), n: numPlain })}</span>
                )}
              </span>
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
            <span>{t("card.progress")}</span>
            <span className="ftp-num" style={{ color: progress > 0 ? "var(--ftp-text)" : "var(--ftp-text-2)" }}>
              {progress > 0 ? `${m.num(progress)}%` : t("card.notStarted")}
            </span>
          </div>
          <ProgressBar pct={progress} tone="brand" />
          {progress > 0 && (
            <div style={{ ...NOTE, marginTop: 4 }}>
              {lastTs
                ? t.rich("card.progressAsOf", { date: fullDate(lastTs), n: numPlain })
                : t.rich("card.progressApprox", { date: fullDate(p.lastVerifiedAt), n: numPlain })}
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
            t("card.notVerified")
          ) : (
            <>
              <AlertTriangle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
              {t("card.singleSource")}
            </>
          )}
        </div>
      )}

      {/* Cancellation reason — danger text, no tinted box */}
      {isCancelled(p) && p.cancellationReason && (
        <div className="ftp-body" style={{ color: "var(--ftp-text)", marginBottom: 6 }}>
          <span style={{ fontWeight: 500, color: "var(--ftp-danger)" }}>{t("card.cancelReason")}</span> {p.cancellationReason}
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
                {latest.newsSource && <span style={{ color: "var(--ftp-text-2)" }}> ({latest.newsSource}, {fullDate(latest.date)})</span>}
              </a>
            ) : (
              <span style={{ color: "var(--ftp-text-2)" }}>{t("card.noNews")}</span>
            )}
          </div>
        );
      })()}

      {/* Footer: last updated, source, verified count, and the timeline link */}
      <div
        style={{
          marginTop: "auto", paddingTop: 8, borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, flexWrap: "wrap", ...NOTE,
        }}
      >
        <span style={FACTS}>
          <span suppressHydrationWarning>{t("card.lastUpdated", { when: lastTs ? ago(lastTs) : "—" })}</span>
          <span>{t(lastTs ? "card.sourceNews" : "card.sourceSeed")}</span>
          {verifiedCount > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }} title={t("card.verifiedSources")}>
              <CheckCircle2 size={12} aria-hidden style={{ color: "var(--ftp-live-text)" }} />
              <span className="ftp-num">{m.num(verifiedCount)}</span>
              <span className="sr-only">{t("card.verifiedSources")}</span>
            </span>
          )}
        </span>
        {/* ftp-chip = 32 px tall on desktop, 44 px tap target on phones. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ftp-chip"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "0 12px",
            background: "var(--hue-tint)", border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
            borderRadius: "var(--ftp-radius-pill)", color: "var(--hue-deep)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ftp-font-sans)",
          }}
          aria-haspopup="dialog"
        >
          {updates.length > 0 ? t("card.viewTimelineN", { n: updates.length }) : t("card.viewTimeline")}
        </button>
      </div>

      {open && <TimelineModal p={p} onClose={() => setOpen(false)} />}
    </Card>
  );
}
