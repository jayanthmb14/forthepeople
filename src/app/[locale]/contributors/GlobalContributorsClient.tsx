/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /contributors — "The People Behind the Platform"
// ═══════════════════════════════════════════════════════════════════════
//
//  Design v3 (2026-09-27):
//    • Header + StatStrip instead of the gradient hero; numbers are shown
//      as they are (the old count-up animation is gone).
//    • Filter buttons are kit Chips; lists are Cards; ranks are mono
//      numbers (no medal emoji); NEW / LONGEST are Pills inside the card.
//    • "Modules per district" and district counts come from
//      getPlatformFacts() instead of a typed 29.
//  All queries, filters and pagination behave exactly as before.
//
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink, Github, Instagram, Linkedin, Lock, Twitter } from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";
import BadgeExplainer, { BADGE_TONE } from "@/components/common/BadgeExplainer";
import ContributorGrowthChart from "@/components/common/ContributorGrowthChart";
import { getTotalActiveDistrictCount } from "@/lib/constants/districts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { Card, Chips, EmptyState, LoadingShell, Pill, SectionHeader, StatStrip, StatTile } from "@/components/district/ui";

const { modulesPerDistrict: MODULES_PER_DISTRICT, totalIndiaDistricts: TOTAL_INDIA_DISTRICTS } = getPlatformFacts();

interface Contributor {
  id: string;
  name: string;
  amount: number | null;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  message: string | null;
  createdAt: string;
  districtName?: string | null;
  stateName?: string | null;
}

interface DistrictRanking {
  districtName: string;
  districtSlug: string;
  stateName: string;
  stateSlug: string;
  active: boolean;
  count: number;
  monthlyTotal: number;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "patron", label: "Patrons" },
  { key: "state", label: "State Champions" },
  { key: "district", label: "District Champions" },
  { key: "founder", label: "Founders" },
  { key: "one-time", label: "One-Time" },
] as const;

/** 24 px circle with a mono rank number (replaces the medal emoji). */
function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className="ftp-num"
      aria-label={`Rank ${rank}`}
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: rank <= 3 ? "var(--ftp-brand-tint)" : "var(--ftp-surface-2)",
        color: rank <= 3 ? "var(--ftp-brand-deep)" : "var(--ftp-text-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        flexShrink: 0,
      }}
    >
      {rank}
    </span>
  );
}

function ContributorCard({
  c,
  rank,
  showAmount,
  extra,
}: {
  c: Contributor;
  rank?: number;
  showAmount?: boolean;
  /** Extra Pills shown after the name (e.g. NEW, LONGEST). */
  extra?: React.ReactNode;
}) {
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const safeLink = normalizeSocialLink(c.socialLink);
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card as="li" padding={14} style={{ display: "flex", alignItems: "center", gap: 10, listStyle: "none" }}>
      {rank !== undefined && <RankBadge rank={rank} />}
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--ftp-surface-2)",
          color: "var(--ftp-text-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="ftp-title" style={{ fontSize: 14, lineHeight: "20px", overflowWrap: "anywhere" }}>{c.name}</span>
          {SocialIcon && safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.name}'s profile`}
              style={{ color: "var(--ftp-text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}
            >
              <SocialIcon size={14} aria-hidden />
            </a>
          )}
          {extra}
        </div>
        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <span>{getContributorLabel(c.tier, c.districtName, c.stateName)}</span>
          {showAmount && c.amount && (
            <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>₹{c.amount.toLocaleString("en-IN")}</span>
          )}
          {c.monthsActive > 0 && (
            <span>
              · <span className="ftp-num">{c.monthsActive}</span>mo
            </span>
          )}
          {c.badgeLevel && (
            <Pill tone={BADGE_TONE[c.badgeLevel] ?? "neutral"} style={{ height: 20, textTransform: "capitalize" }}>
              {c.badgeLevel}
            </Pill>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Grid of contributor cards (one column on phones). */
const LIST_GRID: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
  gap: 10,
};

export default function GlobalContributorsClient({ locale }: { locale: string }) {
  const initialFilter = typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("filter") ?? "all")
    : "all";
  const validFilter = FILTERS.find((f) => f.key === initialFilter) ? initialFilter : "all";
  const [filter, setFilter] = useState(validFilter);

  const PAGE_SIZE = 50;
  const [page, setPage] = useState(1);

  // Reset pagination when filter changes
  const prevFilter = useRef(filter);
  if (prevFilter.current !== filter) {
    prevFilter.current = filter;
    if (page !== 1) setPage(1);
  }

  const { data: leaderboard, isLoading: loadingLb } = useQuery<{ contributors: Contributor[] }>({
    queryKey: ["contributors-leaderboard"],
    queryFn: () => fetch("/api/data/contributors?type=leaderboard&limit=10").then((r) => r.json()),
    staleTime: 120_000,
  });

  const limit = PAGE_SIZE * page;
  const { data: allData, isLoading: loadingAll } = useQuery<{
    subscribers: Contributor[];
    oneTime: Contributor[];
    subscribersTotal?: number;
    oneTimeTotal?: number;
  }>({
    queryKey: ["contributors-all-global", limit],
    queryFn: () => fetch(`/api/data/contributors?limit=${limit}`).then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: rankingsData } = useQuery<{ rankings: DistrictRanking[]; awaitingLaunch: DistrictRanking[] }>({
    queryKey: ["district-rankings"],
    queryFn: () => fetch("/api/data/contributors?type=district-rankings").then((r) => r.json()),
    staleTime: 120_000,
  });

  const leaders = leaderboard?.contributors ?? [];
  const subscribers = allData?.subscribers ?? [];
  const oneTimers = allData?.oneTime ?? [];
  const subscribersTotal = allData?.subscribersTotal ?? subscribers.length;
  const oneTimeTotal = allData?.oneTimeTotal ?? oneTimers.length;
  const rankings = rankingsData?.rankings ?? [];
  const awaitingLaunch = rankingsData?.awaitingLaunch ?? [];

  // Hero stats
  const totalContributors = subscribersTotal + oneTimeTotal;
  const activeSubscribers = subscribersTotal;
  const districtsSponsored = rankings.length;
  const activeDistrictCount = getTotalActiveDistrictCount();

  // Longest-tenure contributor (for ⭐ badge) — computed from the leaderboard top.
  const longestId = leaders[0]?.id ?? null;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isRecentlyJoined = (createdAt: string) => {
    const t = Date.parse(createdAt);
    return !Number.isNaN(t) && Date.now() - t < SEVEN_DAYS;
  };

  // Apply filter
  const filteredLeaders = useMemo(() => {
    if (filter === "all" || filter === "one-time") return leaders;
    return leaders.filter((c) => c.tier === filter);
  }, [leaders, filter]);

  const filteredSubscribers = useMemo(() => {
    if (filter === "all" || filter === "one-time") return subscribers;
    return subscribers.filter((c) => c.tier === filter);
  }, [subscribers, filter]);

  const filteredOneTimers = useMemo(() => {
    if (filter === "one-time" || filter === "all") return oneTimers;
    return [];
  }, [oneTimers, filter]);

  const canLoadMore =
    filter === "one-time"
      ? oneTimers.length < oneTimeTotal
      : filter === "all"
        ? subscribers.length < subscribersTotal || oneTimers.length < oneTimeTotal
        : subscribers.length < subscribersTotal && filteredSubscribers.length >= 0;

  const showLeaderboard = filter === "all" || (filter !== "one-time" && filteredLeaders.length > 0);
  const showSubscribers = filter !== "one-time" && filteredSubscribers.length > 0;
  const showOneTime = filter === "all" || filter === "one-time";

  const TEXT_LINK: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
  };
  const PRIMARY_LINK: React.CSSProperties = {
    ...TEXT_LINK,
    padding: "0 20px",
    background: "var(--ftp-brand)",
    color: "var(--ftp-surface)",
    borderRadius: "var(--ftp-radius-tile)",
  };

  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div className="ftp-container" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 860 }}>
          {/* ── Header ─────────────────────────────────────────────── */}
          <header style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 24, marginBottom: 24 }}>
            <h1 className="ftp-h1">The People Behind the Platform</h1>
            <p style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", maxWidth: 560, margin: "12px 0 20px" }}>
              Every name here keeps government data free for {TOTAL_INDIA_DISTRICTS}+ districts.
              No corporate funding. No ads. Just citizens backing citizens.
            </p>
            <StatStrip cols={3}>
              <StatTile label="Total supporters" value={totalContributors.toLocaleString("en-IN")} />
              <StatTile label="Active monthly" value={activeSubscribers.toLocaleString("en-IN")} />
              <StatTile label="Districts sponsored" value={districtsSponsored.toLocaleString("en-IN")} />
            </StatStrip>
            <div style={{ marginTop: 16 }}>
              <Link href={`/${locale}/support`} style={PRIMARY_LINK}>
                Join the Movement — from ₹99/mo <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </header>

          {/* ── Why it matters ─────────────────────────────────────── */}
          <Card padding={20} style={{ marginBottom: 24 }}>
            <p className="ftp-label" style={{ color: "var(--ftp-brand)", marginBottom: 8 }}>Why it matters</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
              ForThePeople.in tracks{" "}
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
                <span className="ftp-num">{(activeDistrictCount * MODULES_PER_DISTRICT).toLocaleString("en-IN")}</span>+ data points
              </span>{" "}
              across{" "}
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
                <span className="ftp-num">{activeDistrictCount}</span> active district{activeDistrictCount === 1 ? "" : "s"}
              </span>
              , refreshed every 5–30 minutes from official government portals. Each ₹99/month
              contribution keeps one district&apos;s{" "}
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
                <span className="ftp-num">{MODULES_PER_DISTRICT}</span> dashboards
              </span>{" "}
              free — covering crop prices, dam levels, school data, police stats, weather,
              and {MODULES_PER_DISTRICT - 5} more modules — for every citizen in that district.{" "}
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>Zero ads. Zero paywalls. 100% citizen-funded.</span>
            </p>
          </Card>

          <BadgeExplainer />

          {/* ── Filters ────────────────────────────────────────────── */}
          <div style={{ marginBottom: 8 }}>
            <Chips
              label="Filter contributors"
              items={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {/* ── Leaderboard ────────────────────────────────────────── */}
          {showLeaderboard && (
            <section>
              <SectionHeader title="Top contributors by tenure" />
              {loadingLb ? (
                <LoadingShell rows={3} />
              ) : filteredLeaders.length === 0 ? (
                <EmptyState title="No active subscribers yet." />
              ) : (
                <ul style={{ ...LIST_GRID, gridTemplateColumns: "1fr" }}>
                  {filteredLeaders.map((c, i) => {
                    const isLongest = c.id === longestId;
                    const isNew = isRecentlyJoined(c.createdAt);
                    return (
                      <ContributorCard
                        key={c.id}
                        c={c}
                        rank={i + 1}
                        extra={
                          <>
                            {isNew && <Pill tone="brand">NEW</Pill>}
                            {isLongest && <Pill tone="warn">LONGEST</Pill>}
                          </>
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {/* ── Most supported districts ───────────────────────────── */}
          {filter === "all" && (rankings.length > 0 || awaitingLaunch.length > 0) && (
            <section>
              <SectionHeader title="Most supported districts" />
              <Card padding={16}>
                <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {rankings.map((r, i) => (
                    <li
                      key={r.districtSlug}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "6px 0",
                        borderBottom: i < rankings.length - 1 ? "1px solid var(--ftp-border)" : undefined,
                      }}
                    >
                      <RankBadge rank={i + 1} />
                      <Link
                        href={`/${locale}/${r.stateSlug}/${r.districtSlug}/contributors`}
                        style={{ flex: "1 1 160px", minWidth: 0, minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 500, color: "var(--ftp-text)", textDecoration: "none" }}
                      >
                        {r.districtName}, {r.stateName}
                      </Link>
                      <span style={{ fontSize: 13, color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
                        <span className="ftp-num">{r.count}</span> contributor{r.count !== 1 ? "s" : ""}
                      </span>
                      <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text)", whiteSpace: "nowrap" }}>
                        ₹{r.monthlyTotal.toLocaleString("en-IN")}/mo
                      </span>
                    </li>
                  ))}
                </ol>

                {awaitingLaunch.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ftp-border)" }}>
                    <p className="ftp-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Lock size={12} aria-hidden /> Awaiting launch
                    </p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {awaitingLaunch.map((r) => (
                        <li key={r.districtSlug} className="ftp-body" style={{ color: "var(--ftp-text-2)", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                          <Lock size={12} aria-hidden style={{ flexShrink: 0 }} />
                          <span>
                            {r.districtName}, {r.stateName} — <span className="ftp-num">{r.count}</span> sponsor{r.count !== 1 ? "s" : ""} waiting
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* ── Active subscribers ─────────────────────────────────── */}
          {showSubscribers && (
            <section>
              <SectionHeader
                title="Active subscribers"
                action={
                  <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                    <span className="ftp-num">
                      {filter === "all" ? subscribersTotal.toLocaleString("en-IN") : filteredSubscribers.length.toLocaleString("en-IN")}
                    </span>{" "}
                    total
                  </span>
                }
              />
              <ul style={LIST_GRID}>
                {filteredSubscribers.map((c) => <ContributorCard key={c.id} c={c} />)}
              </ul>
            </section>
          )}

          {/* ── One-time contributors ──────────────────────────────── */}
          {showOneTime && (
            <section>
              <SectionHeader
                title="One-time contributors"
                action={
                  <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                    <span className="ftp-num">{oneTimeTotal.toLocaleString("en-IN")}</span> total
                  </span>
                }
              />
              {loadingAll ? (
                <LoadingShell rows={3} />
              ) : filteredOneTimers.length === 0 ? (
                <EmptyState title="No contributions yet. Be the first!" />
              ) : (
                <ul style={LIST_GRID}>
                  {filteredOneTimers.map((c) => <ContributorCard key={c.id} c={c} showAmount />)}
                </ul>
              )}
            </section>
          )}

          {/* ── Load more ──────────────────────────────────────────── */}
          {canLoadMore && !loadingAll && (
            <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="ftp-btn-secondary"
                style={{
                  ...TEXT_LINK,
                  padding: "0 20px",
                  background: "var(--ftp-surface)",
                  border: "1px solid var(--ftp-border)",
                  color: "var(--ftp-text)",
                  borderRadius: "var(--ftp-radius-tile)",
                  cursor: "pointer",
                }}
              >
                Load more (<span className="ftp-num">{PAGE_SIZE}</span> more) <ArrowRight size={14} aria-hidden />
              </button>
              <p style={{ marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                Showing <span className="ftp-num">{(subscribers.length + oneTimers.length).toLocaleString("en-IN")}</span> of{" "}
                <span className="ftp-num">{(subscribersTotal + oneTimeTotal).toLocaleString("en-IN")}</span>
              </p>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            {/* Growth trend (stat line or chart) */}
            <ContributorGrowthChart />
          </div>

          {/* ── Closing call to action ─────────────────────────────── */}
          <Card padding={24} style={{ textAlign: "center", marginTop: 8 }}>
            <h2 className="ftp-h2">Every district needs a champion. Will you be one?</h2>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "8px 0 16px" }}>
              ₹99/mo — that&apos;s all it takes to keep an entire district&apos;s data free for every citizen.
            </p>
            <Link href={`/${locale}/support`} style={PRIMARY_LINK}>
              Become a Champion <ArrowRight size={14} aria-hidden />
            </Link>
          </Card>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href={`/${locale}`} style={{ ...TEXT_LINK, color: "var(--ftp-text-2)", fontWeight: 400 }}>
              <ArrowLeft size={14} aria-hidden /> Back to ForThePeople.in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
