/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — how recently news updated the tracked projects.
 * One quiet line with a 6 px status dot (live = within a week, warn =
 * older). The time is "5 hours ago" / "12 Sep" in the reader's language.
 */

"use client";

import { Info } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { ageInDays } from "@/lib/utils/timeAgo";
import { useInfraText } from "./infra-i18n";

const LINE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  marginBottom: 14, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)",
};

const when = (c: React.ReactNode) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span>;

export default function DataFreshnessIndicator({ projects }: { projects: InfraProject[] }) {
  const { t, ago } = useInfraText();
  if (projects.length === 0) return null;
  const newest = projects
    .map((p) => p.lastNewsAt)
    .filter((d): d is string => !!d && !Number.isNaN(new Date(d).getTime()))
    .reduce<string | null>((best, d) => (!best || new Date(d).getTime() > new Date(best).getTime() ? d : best), null);
  if (!newest) {
    return (
      <div role="status" style={LINE}>
        <Info size={14} aria-hidden style={{ flexShrink: 0 }} />
        <span>{t("freshness.initial")}</span>
      </div>
    );
  }
  const isStale = (ageInDays(newest) ?? 0) > 7;
  return (
    <div role="status" style={LINE}>
      <span
        aria-hidden
        style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: isStale ? "var(--ftp-warn)" : "var(--ftp-live)" }}
      />
      <span suppressHydrationWarning>
        {t.rich(isStale ? "freshness.stale" : "freshness.fresh", { when: ago(newest), b: when })}
      </span>
    </div>
  );
}
