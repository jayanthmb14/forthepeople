/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  StateVoteList — "Vote for the next district" on a state page
//  (Design v3, CONCEPT-v3 §5 "State").
// ═══════════════════════════════════════════════════════════
//
//  Lists the most-requested districts of ONE state that are not live
//  yet, highest count first. Counts come from
//  GET /api/district-request?all=1 (the list the vote-district page
//  uses). Each row links to that district's preview page, which has the
//  vote button. When nobody has asked yet, one honest sentence says so.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Card, EmptyState, LoadingShell } from "@/components/district/ui";

interface DistrictRequestRow {
  stateName: string;
  districtName: string;
  requestCount: number;
}

interface Props {
  locale: string;
  stateSlug: string;
  stateName: string;
  /** Districts of this state that are NOT live yet: { name, slug }. */
  lockedDistricts: Array<{ name: string; slug: string }>;
  /** How many rows to show (default 8). */
  limit?: number;
}

export default function StateVoteList({ locale, stateSlug, stateName, lockedDistricts, limit = 8 }: Props) {
  const { data, isLoading } = useQuery<{ all: DistrictRequestRow[] }>({
    queryKey: ["district-requests", "all"],
    queryFn: () => fetch(`/api/district-request?all=1`).then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingShell rows={3} />;

  // Match request rows (stored by display name) to this state's locked districts.
  const bySlugName = new Map(lockedDistricts.map((d) => [d.name.toLowerCase(), d.slug]));
  const rows = (data?.all ?? [])
    .filter((r) => r.stateName.toLowerCase() === stateName.toLowerCase() && bySlugName.has(r.districtName.toLowerCase()))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, limit);

  if (rows.length === 0) {
    return (
      <EmptyState
        title={`No one has asked for a ${stateName} district yet.`}
        body="Open any district below that is not live and tap Vote — the most-requested districts go live first."
        action={
          <Link href={`/${locale}/vote-district`} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}>
            See requests from all states
          </Link>
        }
      />
    );
  }

  return (
    <Card padding={0}>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((r, i) => {
          const slug = bySlugName.get(r.districtName.toLowerCase());
          return (
            <li key={r.districtName} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
              <Link
                href={`/${locale}/${stateSlug}/${slug}`}
                className="ftp-rail-item"
                style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 48, padding: "0 16px", textDecoration: "none", color: "var(--ftp-text)" }}
              >
                <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)", width: 20 }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500 }}>{r.districtName}</span>
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{r.requestCount.toLocaleString("en-IN")}</span>{" "}
                  {r.requestCount === 1 ? "vote" : "votes"}
                </span>
                <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
              </Link>
            </li>
          );
        })}
      </ol>
      <div style={{ borderTop: "1px solid var(--ftp-border)", padding: "0 16px" }}>
        <Link href={`/${locale}/vote-district`} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          See requests from all states
        </Link>
      </div>
    </Card>
  );
}
