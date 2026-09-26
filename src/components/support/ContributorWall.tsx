/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import type { ContributorsResponse, ContributorItem } from "@/app/api/payment/contributors/route";
import { normalizeSocialLink } from "@/lib/social-link";

const TIER_EMOJI: Record<string, string> = {
  chai: "☕",
  supporter: "🙏",
  monthly: "🙏",
  district: "🏛️",
  state: "🇮🇳",
  patron: "🌟",
  custom: "💝",
  "Buy me a Chai": "☕",
  "Monthly Supporter": "🙏",
  "District Sponsor": "🏛️",
  "District Champion": "🏛️",
  "State Champion": "🇮🇳",
  "All-India Patron": "🌟",
};

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

interface SubscriberItem {
  id: string;
  name: string;
  tier: string;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
}

function ContributorCard({ item }: { item: ContributorItem }) {
  const emoji = (item.tier && TIER_EMOJI[item.tier]) || "💝";
  return (
    <div
      style={{
        width: 120, minWidth: 120, background: "#FFFFFF",
        border: "1px solid #E8E8E4", borderRadius: 12,
        padding: "14px 12px", flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.displayName}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", marginBottom: 4, letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.tierLabel}
      </div>
      {item.message && (
        <div style={{ fontSize: 10, color: "#6B6B6B", lineHeight: 1.4, marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          &ldquo;{item.message.slice(0, 30)}{item.message.length > 30 ? "…" : ""}&rdquo;
        </div>
      )}
      <div style={{ fontSize: 10, color: "#9B9B9B" }}>{item.timeAgo}</div>
    </div>
  );
}

function SubscriberCard({ item }: { item: SubscriberItem }) {
  const emoji = TIER_EMOJI[item.tier] || "🙏";
  const safeLink = normalizeSocialLink(item.socialLink);
  // Even when platform is missing we still render the ExternalLink icon as
  // long as we have a usable URL — keeps bare-domain entries clickable.
  const SocialIcon =
    (item.socialPlatform ? SOCIAL_ICONS[item.socialPlatform] : null) ?? (safeLink ? ExternalLink : null);
  return (
    <div
      style={{
        width: 130, minWidth: 130, background: "#FFFFFF",
        border: "1px solid #E8E8E4", borderRadius: 12,
        padding: "12px", flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        {item.badgeLevel && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: "#FEF3C7", color: "#92400E", textTransform: "uppercase" }}>
            {item.badgeLevel}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {item.name}
        </span>
        {SocialIcon && safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            title={safeLink}
            style={{ color: "#2563EB", lineHeight: 0, flexShrink: 0 }}
          >
            <SocialIcon size={12} />
          </a>
        )}
      </div>
      {item.monthsActive > 0 && (
        <div style={{ fontSize: 10, color: "#9B9B9B" }}>{item.monthsActive}mo active</div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ width: 120, minWidth: 120, background: "#F5F5F0", borderRadius: 12, padding: "14px 12px", flexShrink: 0 }}>
      {[22, 40, 14, 10].map((h, i) => (
        <div key={i} style={{ height: h, background: "#E8E8E4", borderRadius: 4, marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );
}

export default function ContributorWall() {
  // Existing one-time contributors (from Contribution model)
  const { data, isLoading } = useQuery<ContributorsResponse>({
    queryKey: ["contributors"],
    queryFn: () => fetch("/api/payment/contributors").then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime: 50_000,
  });

  // Active subscribers (from Supporter model) — capped at 30 for the scrolling wall
  const { data: subData } = useQuery<{ subscribers: SubscriberItem[]; subscribersTotal?: number }>({
    queryKey: ["contributors-wall-subs"],
    queryFn: () => fetch("/api/data/contributors?limit=30").then((r) => r.json()),
    staleTime: 120_000,
  });

  const allContributors = data?.contributors ?? [];
  const contributors = allContributors.slice(0, 50); // cap one-time at 50
  const oneTimeTotal = allContributors.length;
  const subscribers = (subData?.subscribers ?? []).slice(0, 30);
  const subscribersTotal = subData?.subscribersTotal ?? subscribers.length;
  const shouldScroll = contributors.length >= 4;
  const shouldScrollSubs = subscribers.length >= 4;

  return (
    <>
      <style>{`
        @keyframes wall-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .wall-track {
          animation: wall-scroll 180s linear infinite;
        }
        .wall-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{ marginTop: 48 }}>
        {/* ── Active Subscribers Ticker ── */}
        {subscribers.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.3px", margin: 0 }}>
                🙏 Active Supporters {subscribersTotal > subscribers.length && (
                  <span style={{ fontSize: 12, color: "#9B9B9B", fontWeight: 500 }}>
                    {" "}· {subscribersTotal.toLocaleString("en-IN")} total
                  </span>
                )}
              </h2>
              <Link href="/en/contributors" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <div style={{ background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 14, padding: "16px", overflow: "hidden" }}>
              <div style={{ overflow: "hidden" }}>
                <div
                  className={shouldScrollSubs ? "wall-track" : undefined}
                  style={{ display: "flex", gap: 12, width: shouldScrollSubs ? "max-content" : undefined }}
                >
                  {(shouldScrollSubs ? [...subscribers, ...subscribers] : subscribers).map((item, i) => (
                    <SubscriberCard key={`${item.id}-${i}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── One-Time Contributions ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.3px", margin: 0 }}>
            🎉 {subscribers.length > 0 ? "One-Time Contributions" : "Live Contributions"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isLoading && data && data.count > 0 && (
              <div style={{ fontSize: 12, color: "#6B6B6B" }}>
                <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
                  ₹{data.totalRupees.toLocaleString("en-IN")}
                </span>
                {" "}from{" "}
                <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{data.count}</span>
                {" "}supporter{data.count !== 1 ? "s" : ""}
              </div>
            )}
            {oneTimeTotal > 50 && (
              <Link href="/en/contributors?filter=one-time" style={{ fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
                View all {oneTimeTotal.toLocaleString("en-IN")} →
              </Link>
            )}
          </div>
        </div>

        <div style={{ background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 14, padding: "16px", overflow: "hidden", position: "relative" }}>
          {isLoading ? (
            <div style={{ display: "flex", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : contributors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💝</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>
                Be the first to support ForThePeople.in!
              </div>
              <div style={{ fontSize: 13, color: "#6B6B6B" }}>Your name will appear here.</div>
            </div>
          ) : (
            <div style={{ overflow: "hidden" }}>
              <div
                className={shouldScroll ? "wall-track" : undefined}
                style={{ display: "flex", gap: 12, width: shouldScroll ? "max-content" : undefined }}
              >
                {(shouldScroll ? [...contributors, ...contributors] : contributors).map((item, i) => (
                  <ContributorCard key={`${item.displayName}-${i}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary bar */}
        {!isLoading && data && data.count > 0 && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#6B6B6B" }}>
            ₹{data.totalRupees.toLocaleString("en-IN")} contributed by{" "}
            <strong style={{ color: "#1A1A1A" }}>{data.count}</strong> supporters — Thank you! 🙏
          </div>
        )}
      </div>
    </>
  );
}
