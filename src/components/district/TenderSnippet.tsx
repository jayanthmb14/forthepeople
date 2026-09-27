/**
 * ForThePeople.in — Compact tenders snippet for the district overview.
 *
 * Design v3: a kit Card with a title row ("Govt. tenders" + View all),
 * a status Pill, and a body that depends on the status:
 *
 * Status states (derived by /api/tenders/[district]/stats):
 *   LIVE      — green pill, counts, next deadline
 *   STALE     — amber pill, counts, "refresh pending"
 *   LOCKED    — grey pill, "Coming soon" + Support link
 *   NO_DATA   — grey pill, short "just activated" placeholder
 *
 * "Updated …" uses the kit FreshnessPill, so it never claims to be
 * live unless the last check really was under 30 minutes ago.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock, Clock } from "lucide-react";
import { Card, FreshnessPill, Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";

type Status = "LIVE" | "STALE" | "LOCKED" | "NO_DATA";

interface StatsResponse {
  districtName: string;
  tendersActive: boolean;
  snippetStatus: Status;
  lastCheckedAt: string | null;
  nextDeadline: { id: string; title: string; bidSubmissionEnd: string; daysLeft: number } | null;
  closing48hCount: number;
  closing7dCount: number;
  live: { count: number };
}

/** Status → Pill tone + label. "Updating" instead of "LIVE" — honesty rule. */
const STATUS_BADGE: Record<Status, { label: string; tone: Tone }> = {
  LIVE:    { label: "Tracking",        tone: "live" },
  STALE:   { label: "Refresh pending", tone: "warn" },
  LOCKED:  { label: "Locked",          tone: "neutral" },
  NO_DATA: { label: "No data yet",     tone: "neutral" },
};

export default function TenderSnippet({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale, state, district, base,
}: {
  locale: string; state: string; district: string; base: string;
}) {
  const { data } = useQuery<StatsResponse>({
    queryKey: ["district", district, "tenders", "snippet"],
    queryFn: () => fetch(`/api/tenders/${district}/stats`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  if (!data) return null;
  const status = data.snippetStatus;
  const badge = STATUS_BADGE[status];

  return (
    <Card as="section" aria-label="Government tenders" className="ftp-hue-indigo" tinted>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>📑</span>
          <h3 className="ftp-title ftp-display" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>Govt. tenders</h3>
          <Pill tone={badge.tone} title={`Tenders data status: ${badge.label}`}>{badge.label}</Pill>
        </span>
        <Link href={`${base}/tenders`} style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          View all
        </Link>
      </div>

      {status === "LOCKED" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Lock size={14} aria-hidden style={{ color: "var(--ftp-text-2)", marginTop: 3 }} />
          <div className="ftp-body" style={{ flex: 1 }}>
            Coming soon for <span style={{ fontWeight: 500 }}>{data.districtName}</span>.{" "}
            <Link href="/support" style={{ color: "var(--ftp-brand)", textDecoration: "none" }}>
              Support us to prioritise your district
            </Link>
          </div>
        </div>
      )}

      {status === "NO_DATA" && (
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
          Tender tracking just activated. First data sync in progress.
        </p>
      )}

      {(status === "LIVE" || status === "STALE") && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span className="ftp-num" style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text)" }}>
              {data.live.count.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>open tender{data.live.count === 1 ? "" : "s"}</span>
            {data.closing48hCount > 0 && (
              <span style={{ fontSize: 13, color: "var(--ftp-danger)" }}>
                · <span className="ftp-num">{data.closing48hCount}</span> closing in 48h
              </span>
            )}
          </div>

          {data.nextDeadline && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
              <Clock size={12} aria-hidden style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Next deadline: <span style={{ color: "var(--ftp-text)" }}>{data.nextDeadline.title}</span>
              </span>
              <span className="ftp-num" style={{ color: data.nextDeadline.daysLeft <= 2 ? "var(--ftp-danger)" : "var(--ftp-text)", flexShrink: 0 }}>
                {data.nextDeadline.daysLeft === 0 ? "today" : `${data.nextDeadline.daysLeft}d`}
              </span>
            </div>
          )}

          {data.lastCheckedAt ? (
            <FreshnessPill asOf={data.lastCheckedAt} thresholdHours={24} />
          ) : (
            <span style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>Not checked yet</span>
          )}
        </>
      )}
    </Card>
  );
}
