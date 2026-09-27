/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — how recently news updated the tracked projects.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

import type { InfraProject } from "@/hooks/useRealtimeData";

export default function DataFreshnessIndicator({ projects }: { projects: InfraProject[] }) {
  if (projects.length === 0) return null;
  const newsTimestamps = projects
    .map((p) => p.lastNewsAt ? new Date(p.lastNewsAt).getTime() : null)
    .filter((t): t is number => t != null);
  if (newsTimestamps.length === 0) {
    return (
      <div
        role="status"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", marginBottom: 14, borderRadius: 8,
          background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF",
          fontSize: 12, lineHeight: 1.4,
        }}
      >
        <span>ℹ</span>
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
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", marginBottom: 14, borderRadius: 8,
        background: isStale ? "#FFFBEB" : "#F0FDF4",
        border: `1px solid ${isStale ? "#FDE68A" : "#86EFAC"}`,
        color: isStale ? "#92400E" : "#15803D",
        fontSize: 12, lineHeight: 1.4,
      }}
    >
      <span>{isStale ? "⚠" : "✅"}</span>
      <span>
        {isStale
          ? <>Data last updated from news: <strong>{label}</strong></>
          : <>Data updated: <strong>{label}</strong></>}
      </span>
    </div>
  );
}
