/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  StateVoteList — "Vote for the next district" on a state page
//  (Design v4 "Rang").
// ═══════════════════════════════════════════════════════════
//
//  Lists the most-requested districts of ONE state that are not live
//  yet, highest count first. Counts come from
//  GET /api/district-request?all=1 (the list the vote-district page
//  uses). Each row links to that district's preview page, which has the
//  vote button. When nobody has asked yet, one honest sentence says so.
//
//  v4: each row carries a bar in the page hue, sized against the
//  most-requested district, so the ranking reads at a glance. The state
//  page wraps this list in the vote colour (.ftp-hue-yellow).

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Card, EmptyState, LoadingShell, ProgressBar } from "@/components/district/ui";
import { usePlaceText } from "@/i18n/client";

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

const ALL_STATES_LINK: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--hue-deep)",
  textDecoration: "none",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
};

export default function StateVoteList({ locale, stateSlug, stateName, lockedDistricts, limit = 8 }: Props) {
  const t = useTranslations("page_state");
  const place = usePlaceText();
  const { data, isLoading } = useQuery<{ all: DistrictRequestRow[] }>({
    queryKey: ["district-requests", "all"],
    queryFn: () => fetch(`/api/district-request?all=1`).then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingShell rows={3} />;

  // `stateName` is the English registry name (the request rows store it that
  // way); the reader sees the translated one.
  const shownState = place.state(stateSlug, stateName);

  // Match request rows (stored by display name) to this state's locked districts.
  const bySlugName = new Map(lockedDistricts.map((d) => [d.name.toLowerCase(), d.slug]));
  const rows = (data?.all ?? [])
    .filter((r) => r.stateName.toLowerCase() === stateName.toLowerCase() && bySlugName.has(r.districtName.toLowerCase()))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, limit);

  if (rows.length === 0) {
    return (
      <EmptyState
        emoji="🗳️"
        title={t("voteEmptyTitle", { state: shownState })}
        body={t("voteEmptyBody")}
        action={
          <Link href={`/${locale}/vote-district`} style={ALL_STATES_LINK}>
            {t("voteAllStates")}
          </Link>
        }
      />
    );
  }

  const top = rows[0].requestCount;

  return (
    <Card padding={0}>
      <ol aria-label={t("voteListAria", { state: shownState })} style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((r, i) => {
          const slug = bySlugName.get(r.districtName.toLowerCase());
          return (
            <li key={r.districtName} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
              <Link
                href={`/${locale}/${stateSlug}/${slug}`}
                className="ftp-rail-item"
                style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56, padding: "8px 16px", textDecoration: "none", color: "var(--ftp-text)" }}
              >
                <span
                  className="ftp-num"
                  aria-hidden
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    // Deep hue behind white digits: the light yellow hue is too pale for white text.
                    background: i === 0 ? "var(--hue-deep)" : "var(--hue-tint)",
                    color: i === 0 ? "#fff" : "var(--hue-deep)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>{r.districtName}</span>
                  {/* The bar repeats the count beside it, so screen readers skip it. */}
                  <span aria-hidden style={{ display: "block", marginTop: 4 }}>
                    <ProgressBar value={r.requestCount} max={top} height={6} />
                  </span>
                </span>
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
                  {t.rich("votes", {
                    n: r.requestCount,
                    num: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>{c}</span>,
                  })}
                </span>
                <ChevronRight size={16} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
              </Link>
            </li>
          );
        })}
      </ol>
      <div style={{ borderTop: "1px solid var(--ftp-border)", padding: "0 16px" }}>
        <Link href={`/${locale}/vote-district`} style={ALL_STATES_LINK}>
          {t("voteAllStates")}
        </Link>
      </div>
    </Card>
  );
}
