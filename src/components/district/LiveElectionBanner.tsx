/**
 * ForThePeople.in — Overview-page election alert.
 *
 * Renders a notice only when the district's state has an active
 * ElectionEvent with polling within 30 days. Otherwise renders nothing
 * (no shell), so quiet states stay calm.
 *
 * Design v3: a linked kit Card (no red fill, no shadow). The urgency is
 * carried by a "danger" Pill with the days left and a Lucide Vote icon.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { Vote } from "lucide-react";
import type { ElectionEvent } from "@/components/district/ElectionSection";
import { Card, Pill } from "@/components/district/ui";

function daysFromToday(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function LiveElectionBanner({
  stateSlug, leadershipHref,
}: {
  stateSlug: string;
  leadershipHref: string;
}) {
  const { data } = useQuery<{ data: ElectionEvent[] }>({
    queryKey: ["elections", stateSlug],
    queryFn: () => fetch(`/api/data/election-events?state=${stateSlug}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const events = data?.data ?? [];
  const live = events.find((e) => {
    const d = daysFromToday(e.pollingDate);
    return d != null && d >= 0 && d <= 30 && e.state === stateSlug;
  });
  if (!live || !live.pollingDate) return null;

  const days = daysFromToday(live.pollingDate)!;
  const phaseSummary = live.pollingPhases && live.pollingPhases.length > 1
    ? live.pollingPhases.map((p) => `Phase ${p.phase}: ${formatDay(p.date)}`).join(", ")
    : `Polling on ${formatDay(live.pollingDate)}`;

  return (
    <Card href={leadershipHref} padding={14} aria-label={`${live.label}: ${phaseSummary}`}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Vote size={16} aria-hidden style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="ftp-title" style={{ fontSize: 13, lineHeight: "20px" }}>
              {live.label} — {phaseSummary}
            </span>
            {days <= 14 && (
              <Pill tone="danger">
                {days === 0 ? "Today" : <><span className="ftp-num">{days}</span>&nbsp;day{days === 1 ? "" : "s"} away</>}
              </Pill>
            )}
          </div>
          {live.resultDate && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>
              Results: {formatDay(live.resultDate)} · Check the leadership page for details
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
