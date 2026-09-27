/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /contributors — "The people behind the platform"
// ═══════════════════════════════════════════════════════════════════════
//
//  Design v4 "Rang" (pink, the contributors hue):
//    • SiteHeader band, then emoji StatTiles. While a count is still
//      loading its tile shows "—", never a fake 0.
//    • The picture: one symbol per live district, lit when that district
//      has at least one monthly district champion (from the same
//      district-rankings request as the list below).
//    • Filter Chips, Sections with emoji, contributor Cards with a rank
//      circle in the hue; New / Longest are Pills inside the card.
//    • "Modules per district" and district counts come from
//      getPlatformFacts() instead of a typed 29.
//  All queries, filters and pagination behave exactly as before.
//
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Github, Heart, Instagram, Linkedin, Lock, Twitter } from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";
import BadgeExplainer, { BADGE_TONE } from "@/components/common/BadgeExplainer";
import ContributorGrowthChart from "@/components/common/ContributorGrowthChart";
import { getTotalActiveDistrictCount } from "@/lib/constants/districts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { Card, Chips, EmptyState, LoadingShell, Pill, Section, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";

const { modulesPerDistrict: MODULES_PER_DISTRICT, totalIndiaDistricts: TOTAL_INDIA_DISTRICTS } = getPlatformFacts();

/** Above this many live districts the picture switches from "one symbol each" to "out of 10". */
const MAX_SYMBOLS = 40;

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
  { key: "state", label: "State champions" },
  { key: "district", label: "District champions" },
  { key: "founder", label: "Founders" },
  { key: "one-time", label: "One-time" },
] as const;

/** 26 px circle with the rank number; the top three are filled with the hue. */
function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className="ftp-num"
      aria-label={`Rank ${rank}`}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: rank <= 3 ? "var(--hue)" : "var(--hue-tint)",
        color: rank <= 3 ? "#fff" : "var(--hue-deep)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
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
  /** Extra Pills shown after the name (e.g. New, Longest). */
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
        className="ftp-display"
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "var(--hue-tint)",
          color: "var(--hue-deep)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 650,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="ftp-title" style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, overflowWrap: "anywhere" }}>{c.name}</span>
          {SocialIcon && safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.name}'s profile`}
              style={{ color: "var(--hue)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28 }}
            >
              <SocialIcon size={14} aria-hidden />
            </a>
          )}
          {extra}
        </div>
        <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          <span>{getContributorLabel(c.tier, c.districtName, c.stateName)}</span>
          {showAmount && c.amount && (
            <span className="ftp-num" style={{ color: "var(--hue-deep)" }}>₹{c.amount.toLocaleString("en-IN")}</span>
          )}
          {c.monthsActive > 0 && (
            <span>
              <span className="ftp-num">{c.monthsActive}</span> {c.monthsActive === 1 ? "month" : "months"}
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

  // The picture: live districts with at least one monthly district champion.
  const championed = rankings.filter((r) => r.active && r.count > 0).length;
  const oneEach = activeDistrictCount <= MAX_SYMBOLS;
  const pictoFilled = oneEach ? championed : activeDistrictCount > 0 ? (championed / activeDistrictCount) * 10 : 0;

  // Longest-tenure contributor (for the Longest pill) — computed from the leaderboard top.
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
    gap: 6,
    minHeight: 44,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    fontFamily: "inherit",
  };
  const PRIMARY_LINK: React.CSSProperties = {
    ...TEXT_LINK,
    padding: "0 20px",
    border: "1px solid var(--hue)",
    color: "#fff",
    borderRadius: "var(--ftp-radius-tile)",
  };

  return (
    <main className="ftp-hue-pink" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div className="ftp-container" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 860 }}>
          {/* ── Header ─────────────────────────────────────────────── */}
          <SiteHeader
            emoji="💖"
            icon={Heart}
            title="The people behind the platform"
            description={
              <>
                Every name here keeps government data free for {TOTAL_INDIA_DISTRICTS}+ districts.
                No corporate funding. No ads. Just citizens backing citizens.
              </>
            }
            backHref={`/${locale}`}
          >
            <Link href={`/${locale}/support`} className="ftp-btn" style={{ ...TEXT_LINK, padding: "0 18px", background: "#fff", color: "var(--hue-deep)", borderRadius: "var(--ftp-radius-tile)" }}>
              <span className="ftp-emoji" aria-hidden>🤝</span>
              Join the movement, from ₹99 a month
            </Link>
          </SiteHeader>

          <StatStrip cols={3}>
            <StatTile emoji="🙌" label="Total supporters" value={loadingAll ? "—" : totalContributors.toLocaleString("en-IN")} />
            <StatTile emoji="🔁" label="Active monthly" value={loadingAll ? "—" : activeSubscribers.toLocaleString("en-IN")} />
            <StatTile emoji="🏙️" label="Districts sponsored" value={rankingsData ? districtsSponsored.toLocaleString("en-IN") : "—"} />
          </StatStrip>

          {/* ── The picture — from the district-rankings request ─────── */}
          {rankingsData && activeDistrictCount > 0 && (
            <Card tinted padding={18} style={{ marginTop: 16 }}>
              <Explainer title="In simple words" emoji="🤝">
                {championed === 0 ? (
                  <>
                    None of the <strong>{activeDistrictCount}</strong> live districts has a monthly district champion yet. You could be
                    the first.
                  </>
                ) : (
                  <>
                    <strong>{championed}</strong> of the <strong>{activeDistrictCount}</strong> live districts{" "}
                    {championed === 1 ? "has" : "have"} at least one monthly district champion keeping its data free.
                  </>
                )}
              </Explainer>
              <Pictogram
                filled={pictoFilled}
                total={oneEach ? activeDistrictCount : 10}
                emoji="🏙️"
                label={
                  oneEach
                    ? `${championed} of ${activeDistrictCount} live districts have a district champion.`
                    : `About ${Math.round(pictoFilled)} of every 10 live districts have a district champion.`
                }
              />
            </Card>
          )}

          {/* ── Why it matters ─────────────────────────────────────── */}
          <Section title="Why it matters" emoji="💡">
            <Card tinted padding={20}>
              <p className="ftp-body" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)" }}>
                ForThePeople.in tracks{" "}
                <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                  <span className="ftp-num">{(activeDistrictCount * MODULES_PER_DISTRICT).toLocaleString("en-IN")}</span>+ data points
                </span>{" "}
                across{" "}
                <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                  <span className="ftp-num">{activeDistrictCount}</span> active district{activeDistrictCount === 1 ? "" : "s"}
                </span>
                , refreshed every 5–30 minutes from official government portals. Each ₹99/month
                contribution keeps one district&apos;s{" "}
                <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                  <span className="ftp-num">{MODULES_PER_DISTRICT}</span> dashboards
                </span>{" "}
                free — covering crop prices, dam levels, school data, police stats, weather,
                and {MODULES_PER_DISTRICT - 5} more modules — for every citizen in that district.{" "}
                <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>Zero ads. Zero paywalls. 100% citizen-funded.</span>
              </p>
            </Card>
          </Section>

          <div style={{ marginTop: 24 }}>
            <BadgeExplainer />
          </div>

          {/* ── Filters ────────────────────────────────────────────── */}
          <div style={{ margin: "8px 0" }}>
            <Chips
              label="Filter contributors"
              items={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
              value={filter}
              onChange={setFilter}
            />
          </div>

          {/* ── Leaderboard ────────────────────────────────────────── */}
          {showLeaderboard && (
            <Section title="Top contributors by tenure" emoji="🏆">
              {loadingLb ? (
                <LoadingShell rows={3} />
              ) : filteredLeaders.length === 0 ? (
                <EmptyState emoji="🌱" title="No active subscribers yet." />
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
                            {isNew && <Pill tone="brand">New</Pill>}
                            {isLongest && <Pill tone="warn">Longest</Pill>}
                          </>
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          {/* ── Most supported districts ───────────────────────────── */}
          {filter === "all" && (rankings.length > 0 || awaitingLaunch.length > 0) && (
            <Section title="Most supported districts" emoji="🏙️">
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
                        style={{ flex: "1 1 160px", minWidth: 0, minHeight: 44, display: "inline-flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: "var(--ftp-text)", textDecoration: "none" }}
                      >
                        {r.districtName}, {r.stateName}
                      </Link>
                      <span style={{ fontSize: 13, color: "var(--ftp-text-2)", whiteSpace: "nowrap" }}>
                        <span className="ftp-num">{r.count}</span> contributor{r.count !== 1 ? "s" : ""}
                      </span>
                      <span className="ftp-num" style={{ fontSize: 14, color: "var(--hue-deep)", whiteSpace: "nowrap" }}>
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
                            {r.districtName}, {r.stateName}: <span className="ftp-num">{r.count}</span> sponsor{r.count !== 1 ? "s" : ""} waiting
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </Section>
          )}

          {/* ── Active subscribers ─────────────────────────────────── */}
          {showSubscribers && (
            <Section
              title="Active subscribers"
              emoji="🔁"
              action={
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  <span className="ftp-num">
                    {filter === "all" ? subscribersTotal.toLocaleString("en-IN") : filteredSubscribers.length.toLocaleString("en-IN")}
                  </span>{" "}
                  total
                </span>
              }
            >
              <ul style={LIST_GRID}>
                {filteredSubscribers.map((c) => <ContributorCard key={c.id} c={c} />)}
              </ul>
            </Section>
          )}

          {/* ── One-time contributors ──────────────────────────────── */}
          {showOneTime && (
            <Section
              title="One-time contributors"
              emoji="🎁"
              action={
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  <span className="ftp-num">{oneTimeTotal.toLocaleString("en-IN")}</span> total
                </span>
              }
            >
              {loadingAll ? (
                <LoadingShell rows={3} />
              ) : filteredOneTimers.length === 0 ? (
                <EmptyState emoji="🎁" title="No contributions yet. Be the first!" />
              ) : (
                <ul style={LIST_GRID}>
                  {filteredOneTimers.map((c) => <ContributorCard key={c.id} c={c} showAmount />)}
                </ul>
              )}
            </Section>
          )}

          {/* ── Load more ──────────────────────────────────────────── */}
          {canLoadMore && !loadingAll && (
            <div style={{ textAlign: "center", margin: "24px 0 32px" }}>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="ftp-btn ftp-btn-secondary"
                style={{
                  ...TEXT_LINK,
                  padding: "0 20px",
                  background: "var(--ftp-surface)",
                  border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                  color: "var(--hue-deep)",
                  borderRadius: "var(--ftp-radius-tile)",
                  cursor: "pointer",
                }}
              >
                Load <span className="ftp-num">{PAGE_SIZE}</span> more
              </button>
              <p style={{ marginTop: 6, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
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
          <Card tinted padding={24} style={{ textAlign: "center", marginTop: 8 }}>
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 36, display: "block", marginBottom: 6 }}>🏅</span>
            <h2 className="ftp-h2">Every district needs a champion. Will you be one?</h2>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "8px 0 16px" }}>
              ₹99/mo — that&apos;s all it takes to keep an entire district&apos;s data free for every citizen.
            </p>
            <Link href={`/${locale}/support`} className="ftp-btn ftp-btn-primary" style={PRIMARY_LINK}>
              Become a champion
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
