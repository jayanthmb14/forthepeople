/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — how recently news updated the tracked projects.
 * Design v3: one quiet line with a 6 px status dot (live = within a week,
 * warn = older). No tinted box, no emoji.
 */

import { Info } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";

const LINE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  marginBottom: 14, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)",
};

export default function DataFreshnessIndicator({ projects }: { projects: InfraProject[] }) {
  if (projects.length === 0) return null;
  const newsTimestamps = projects
    .map((p) => p.lastNewsAt ? new Date(p.lastNewsAt).getTime() : null)
    .filter((t): t is number => t != null);
  if (newsTimestamps.length === 0) {
    return (
      <div role="status" style={LINE}>
        <Info size={14} aria-hidden style={{ flexShrink: 0 }} />
        <span>Initial data — will be enriched as news articles appear</span>
      </div>
    );
  }
  const newestMs = Math.max(...newsTimestamps);
  const ageMs = Date.now() - newestMs;
  const ageDays = Math.floor(ageMs / 86_400_000);
  const ageHours = Math.floor(ageMs / 3_600_000);
  const isStale = ageDays > 7;
  const label = ageHours < 24
    ? `${Math.max(1, ageHours)} hour${ageHours === 1 ? "" : "s"} ago`
    : `${ageDays} day${ageDays === 1 ? "" : "s"} ago`;
  return (
    <div role="status" style={LINE}>
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: isStale ? "var(--ftp-warn)" : "var(--ftp-live)" }}
      />
      <span>
        {isStale
          ? <>Data last updated from news: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{label}</span></>
          : <>Data updated: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{label}</span></>}
      </span>
    </div>
  );
}
