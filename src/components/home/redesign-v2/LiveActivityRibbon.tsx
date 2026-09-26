/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 13 v8 Phase E (Fix #4) — StatsBar dashboard-style redesign
 * (filename retained as LiveActivityRibbon.tsx for import-path stability;
 * the export is still `StatsBar`).
 *
 * 5-tile dashboard grid with vertical dividers, hover states, count-up:
 *   [Districts live] | [Dashboards/district] | [Data points] | [Coming] | [Last updated]
 *
 * Bigger numbers, real visual presence — not a thin one-line strip.
 * Drops the LIVE pill prefix entirely (last-updated tile carries that signal).
 *
 * Stats are passed in as props (server-fetched in [locale]/page.tsx)
 * to avoid a client roundtrip on first paint. Defaults come from
 * src/lib/platform-facts.ts so a missing prop can never print a stale
 * hand-typed number (issue #36).
 *
 * Audit 2026-09: the "Last refresh" tile now uses the shared timeAgoLabel
 * (real "Xh ago" / "Xd ago", never "Live"); the green dot appears only for
 * records under 30 minutes old. Cadence captions that promised
 * "every 5–30 min" were replaced with what actually happens.
 */

"use client";

import { useCountUp } from "@/lib/hooks/useCountUp";
import { timeAgoLabel, type TimeAgoResult } from "@/lib/utils/timeAgo";
import { getPlatformFacts } from "@/lib/platform-facts";

const FACTS = getPlatformFacts();

// Session 18 v12 Phase C (Fix #2): recency tier drives the green/blue/gray
// dot indicator on the 5th StatsBar tile.
//   fresh  — under 30 min (timeAgoLabel.isLive)
//   recent — under 3 h
//   stale  — older, or unknown
type RecencyTier = "fresh" | "recent" | "stale";

function recencyTier(updated: TimeAgoResult, mostRecentAt: string | null | undefined): RecencyTier {
  if (updated.isLive) return "fresh";
  if (!mostRecentAt) return "stale";
  const ts = new Date(mostRecentAt).getTime();
  if (!Number.isFinite(ts)) return "stale";
  const ageMin = (Date.now() - ts) / 60_000;
  return ageMin < 180 ? "recent" : "stale";
}

export interface StatsBarProps {
  /** All optional — sensible defaults render if page.tsx hasn't wired props yet. */
  activeDistricts?: number;
  dashboardsPerDistrict?: number;
  totalDataPoints?: number;
  comingDistricts?: number;
  mostRecentAt?: string | null;
}

function StatTile({
  target,
  label,
  refresh,
}: {
  target: number;
  label: string;
  refresh: string;
}) {
  const { value, ref } = useCountUp<HTMLDivElement>(target);
  return (
    <div className="ftp-stat-tile">
      <div className="ftp-stat-num" ref={ref}>
        {value.toLocaleString("en-IN")}
      </div>
      <div className="ftp-stat-label">{label}</div>
      <div className="ftp-stat-refresh">{refresh}</div>
    </div>
  );
}

export default function StatsBar({
  activeDistricts = FACTS.activeDistricts,
  dashboardsPerDistrict = FACTS.modulesPerDistrict,
  totalDataPoints = 0,
  comingDistricts = FACTS.comingDistricts,
  mostRecentAt,
}: StatsBarProps) {
  // Real "Xm / Xh / Xd ago" label, or "—" when the timestamp is unknown.
  const updated = timeAgoLabel(mostRecentAt ?? null);
  const updatedDisplay = updated.label;
  const tier = recencyTier(updated, mostRecentAt ?? null);

  return (
    <div className="ftp-stats-bar" role="status" aria-live="polite">
      <style>{`
        /* Session 16 v10 Phase D (Fix #3): outlined tile cards with gaps (replaces solid grid) */
        .ftp-stats-bar {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          background: transparent;
          border: none;
          padding: 0 24px;
          max-width: 1200px;
          margin: 0 auto 24px;
        }
        .ftp-stat-tile {
          padding: 22px 24px;
          text-align: center;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 150ms ease, transform 150ms ease, box-shadow 200ms ease;
        }
        .ftp-stat-tile:hover {
          border-color: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
        }
        .ftp-stat-num {
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
          color: #2563EB;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        /* Session 18 v12 Phase C: 5th-tile timestamp + dot wrap */
        .ftp-stat-num-text-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }
        .ftp-stat-num-text {
          font-size: 18px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .ftp-stat-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ftp-stat-dot-fresh {
          background: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.20);
          animation: ftp-stat-pulse 2s ease-in-out infinite;
        }
        .ftp-stat-dot-recent {
          background: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }
        .ftp-stat-dot-stale {
          background: #6B7280;
        }
        .ftp-stat-tile-fresh  .ftp-stat-num-text { color: #047857; }
        .ftp-stat-tile-recent .ftp-stat-num-text { color: #2563EB; }
        .ftp-stat-tile-stale  .ftp-stat-num-text { color: #4B5563; }
        @keyframes ftp-stat-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(0.85); opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-stat-dot-fresh { animation: none; }
        }
        .ftp-stat-label {
          font-size: 11px;
          color: #4B5563;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-weight: 500;
        }
        /* Session 17 v11 Phase E (Fix #5): per-metric refresh frequency caption */
        .ftp-stat-refresh {
          font-size: 9px;
          color: #9B9B9B;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-top: 2px;
          font-style: italic;
        }
        @media (max-width: 767px) {
          .ftp-stats-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            padding: 0 16px;
            margin-bottom: 16px;
          }
          .ftp-stat-tile { padding: 14px 16px; }
          .ftp-stat-num { font-size: 22px; }
          /* Mobile-revert: removed the .ftp-stat-tile:last-child grid-column
             rule that forced the Last Refresh tile to span both columns —
             the user wants a clean 2x2 with Last Refresh in the row-2-right
             slot (replacing the hidden Districts Coming tile). */
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-stat-tile { transition: none; }
          .ftp-stat-tile:hover { transform: none; }
        }
      `}</style>

      <StatTile
        target={activeDistricts}
        label="Districts live"
        refresh="launched so far"
      />
      <StatTile
        target={dashboardsPerDistrict}
        label="Dashboards / district"
        refresh="in every district"
      />
      <StatTile
        target={totalDataPoints}
        label="Data points tracked"
        refresh="source-linked records"
      />
      <StatTile
        target={comingDistricts}
        label="Districts coming"
        refresh={`of ${FACTS.totalIndiaDistricts} in India`}
      />

      {/* Session 18 v12 Phase C: dynamic Xm-ago + recency dot indicator. */}
      <div className={`ftp-stat-tile ftp-stat-tile-updated ftp-stat-tile-${tier}`}>
        <div className="ftp-stat-num-text-wrap">
          <span className={`ftp-stat-dot ftp-stat-dot-${tier}`} aria-hidden="true" />
          <span className="ftp-stat-num-text">{updatedDisplay}</span>
        </div>
        <div className="ftp-stat-label">Refreshed</div>
        <div className="ftp-stat-refresh">newest record</div>
      </div>
    </div>
  );
}
