/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink, Lock } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";
import BadgeExplainer from "@/components/common/BadgeExplainer";
import ContributorGrowthChart from "@/components/common/ContributorGrowthChart";
import { getTotalActiveDistrictCount } from "@/lib/constants/districts";
import { useCountUp } from "@/lib/hooks/useCountUp";

// Session 14 v8.1 Phase G (Fix #12): count-up animation on the
// "The People Behind the Platform" hero stats. Mirrors the homepage
// StatsBar behavior — animates 0 → final on scroll-into-view.
function HeroStatNum({ target }: { target: number }) {
  const { value, ref } = useCountUp<HTMLSpanElement>(target);
  return <span ref={ref}>{value.toLocaleString("en-IN")}</span>;
}

const MODULES_PER_DISTRICT = 29;

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

function ContributorCard({ c, rank, showAmount }: { c: Contributor; rank?: number; showAmount?: boolean }) {
  const tierConf = TIER_CONFIG[c.tier];
  const badgeColors = c.badgeLevel ? BADGE_COLORS[c.badgeLevel] : null;
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1.5px solid ${badgeColors?.border ?? "#E8E8E4"}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {rank !== undefined && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: rank === 1 ? "#FEF3C7" : rank === 2 ? "#F1F5F9" : rank === 3 ? "#FED7AA" : "#F5F5F0",
          color: rank === 1 ? "#92400E" : rank === 2 ? "#475569" : rank === 3 ? "#9A3412" : "#6B6B6B",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {rank}
        </div>
      )}
      <div
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: badgeColors?.bg ?? "#F5F5F0",
          color: badgeColors?.text ?? "#6B6B6B",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, flexShrink: 0,
          border: badgeColors ? `2px solid ${badgeColors.border}` : "1px solid #E8E8E4",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{c.name}</span>
          {SocialIcon && normalizeSocialLink(c.socialLink) && (
            <a href={normalizeSocialLink(c.socialLink)!} target="_blank" rel="noopener noreferrer" style={{ color: "#6B6B6B", lineHeight: 0 }}>
              <SocialIcon size={14} />
            </a>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 1 }}>
          <span>{tierConf?.emoji ?? "💝"}</span>
          <span>{getContributorLabel(c.tier, c.districtName, c.stateName)}</span>
          {showAmount && c.amount && (
            <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
              ₹{c.amount.toLocaleString("en-IN")}
            </span>
          )}
          {c.monthsActive > 0 && <span style={{ color: "#9B9B9B" }}>· {c.monthsActive}mo</span>}
          {c.badgeLevel && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: badgeColors?.bg, color: badgeColors?.text, textTransform: "uppercase" }}>
              {c.badgeLevel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <main style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 600px) {
          .ftp-hero-stats { gap: 20px !important; }
          .ftp-hero-stats > div { flex: 1 1 45%; }
        }
      `}</style>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {/* Hero */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #EFF6FF 50%, #F0FDF4 100%)",
            borderRadius: 16,
            padding: "32px 24px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", marginBottom: 8, letterSpacing: "-0.5px" }}>
            The People Behind the Platform
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B6B", maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Every name here keeps government data free for 780+ districts.
            No corporate funding. No ads. Just citizens backing citizens.
          </p>
          <div className="ftp-hero-stats" style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
                <HeroStatNum target={totalContributors} />
              </div>
              <div style={{ fontSize: 11, color: "#9B9B9B" }}>Total Supporters</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#16A34A", fontFamily: "var(--font-mono, monospace)" }}>
                <HeroStatNum target={activeSubscribers} />
              </div>
              <div style={{ fontSize: 11, color: "#9B9B9B" }}>Active Monthly</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#D97706", fontFamily: "var(--font-mono, monospace)" }}>
                <HeroStatNum target={districtsSponsored} />
              </div>
              <div style={{ fontSize: 11, color: "#9B9B9B" }}>Districts Sponsored</div>
            </div>
          </div>
          <Link
            href={`/${locale}/support`}
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "10px 24px",
              background: "#2563EB",
              color: "#fff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Join the Movement — from ₹99/mo →
          </Link>
        </div>

        {/* WHY IT MATTERS */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", letterSpacing: "0.04em" }}>💡 WHY IT MATTERS</span>
          </div>
          <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
            ForThePeople.in tracks{" "}
            <strong>
              {(activeDistrictCount * MODULES_PER_DISTRICT).toLocaleString("en-IN")}+ data points
            </strong>{" "}
            across{" "}
            <strong>
              {activeDistrictCount} active district{activeDistrictCount === 1 ? "" : "s"}
            </strong>
            , refreshed every 5–30 minutes from official government portals. Each ₹99/month
            contribution keeps one district&apos;s <strong>{MODULES_PER_DISTRICT} dashboards</strong>{" "}
            free — covering crop prices, dam levels, school data, police stats, weather,
            and {MODULES_PER_DISTRICT - 5} more modules — for every citizen in that district.{" "}
            <strong>Zero ads. Zero paywalls. 100% citizen-funded.</strong>
          </p>
        </div>

        <BadgeExplainer />

        {/* Filter buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: filter === f.key ? "1.5px solid #2563EB" : "1px solid #E8E8E4",
                background: filter === f.key ? "#EFF6FF" : "#FFFFFF",
                color: filter === f.key ? "#2563EB" : "#6B6B6B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              🏆 Top Contributors by Tenure
            </h2>
            {loadingLb ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B" }}>Loading...</div>
            ) : filteredLeaders.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9B9B9B" }}>No active subscribers yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                {filteredLeaders.map((c, i) => {
                  const topBorder = i === 0 ? "#FEF3C7" : i === 1 ? "#F1F5F9" : i === 2 ? "#FED7AA" : null;
                  const isLongest = c.id === longestId;
                  const isNew = isRecentlyJoined(c.createdAt);
                  return (
                    <div
                      key={c.id}
                      style={{
                        position: "relative",
                        borderLeft: topBorder ? `4px solid ${topBorder}` : undefined,
                        borderRadius: 12,
                        paddingLeft: topBorder ? 0 : undefined,
                      }}
                    >
                      <ContributorCard c={c} rank={i + 1} />
                      {(isNew || isLongest) && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 8,
                            display: "flex",
                            gap: 4,
                            pointerEvents: "none",
                          }}
                        >
                          {isNew && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 999,
                                background: "#FEE2E2",
                                color: "#B91C1C",
                                letterSpacing: "0.04em",
                              }}
                            >
                              🔥 NEW
                            </span>
                          )}
                          {isLongest && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 999,
                                background: "#FEF3C7",
                                color: "#92400E",
                                letterSpacing: "0.04em",
                              }}
                            >
                              ⭐ LONGEST
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Most Supported Districts */}
        {filter === "all" && (rankings.length > 0 || awaitingLaunch.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              🏆 Most Supported Districts
            </h2>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 20px" }}>
              {rankings.map((r, i) => (
                <div key={r.districtSlug} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < rankings.length - 1 ? "1px solid #F5F5F0" : undefined }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                    {i < 3 ? MEDAL[i] : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/${locale}/${r.stateSlug}/${r.districtSlug}/contributors`}
                      style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", textDecoration: "none" }}
                    >
                      {r.districtName}, {r.stateName}
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", whiteSpace: "nowrap" }}>
                    {r.count} contributor{r.count !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
                    ₹{r.monthlyTotal.toLocaleString("en-IN")}/mo
                  </div>
                </div>
              ))}

              {awaitingLaunch.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E8E4" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={12} /> Awaiting Launch:
                  </div>
                  {awaitingLaunch.map((r) => (
                    <div key={r.districtSlug} style={{ fontSize: 13, color: "#9B9B9B", padding: "4px 0 4px 28px" }}>
                      🔒 {r.districtName}, {r.stateName} — {r.count} sponsor{r.count !== 1 ? "s" : ""} waiting
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Subscribers */}
        {showSubscribers && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                🙏 Active Subscribers
              </h2>
              <span style={{ fontSize: 12, color: "#9B9B9B" }}>
                {filter === "all" ? subscribersTotal.toLocaleString("en-IN") : filteredSubscribers.length.toLocaleString("en-IN")} total
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, marginBottom: 32 }}>
              {filteredSubscribers.map((c) => <ContributorCard key={c.id} c={c} />)}
            </div>
          </>
        )}

        {/* One-Time Contributors */}
        {showOneTime && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                💝 One-Time Contributors
              </h2>
              <span style={{ fontSize: 12, color: "#9B9B9B" }}>
                {oneTimeTotal.toLocaleString("en-IN")} total
              </span>
            </div>
            {loadingAll ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B" }}>Loading...</div>
            ) : filteredOneTimers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9B9B9B" }}>No contributions yet. Be the first!</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, marginBottom: 16 }}>
                {filteredOneTimers.map((c) => <ContributorCard key={c.id} c={c} showAmount />)}
              </div>
            )}
          </>
        )}

        {/* Load more */}
        {canLoadMore && !loadingAll && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "10px 24px",
                background: "#FFFFFF",
                border: "1.5px solid #BFDBFE",
                color: "#2563EB",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Load more ({PAGE_SIZE} more) →
            </button>
            <div style={{ marginTop: 6, fontSize: 11, color: "#9B9B9B" }}>
              Showing {(subscribers.length + oneTimers.length).toLocaleString("en-IN")} of {(subscribersTotal + oneTimeTotal).toLocaleString("en-IN")}
            </div>
          </div>
        )}

        {/* Growth trend (stat card or chart) */}
        <ContributorGrowthChart />

        {/* Bottom CTA */}
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 14,
            padding: "28px 24px",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            Every district needs a champion. Will you be one?
          </div>
          <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16, lineHeight: 1.6 }}>
            ₹99/mo — that&apos;s all it takes to keep an entire district&apos;s data free for every citizen.
          </div>
          <Link
            href={`/${locale}/support`}
            style={{
              display: "inline-block",
              padding: "10px 28px",
              background: "#2563EB",
              color: "#fff",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Become a Champion →
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href={`/${locale}`} style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none" }}>
            ← Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
