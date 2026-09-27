/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  ContributorWall — the two supporter strips on /support
// ═══════════════════════════════════════════════════════════════════════
//
//  1. Active supporters (monthly subscribers, from /api/data/contributors)
//  2. One-time contributions (from /api/payment/contributors)
//
//  Design v3: the old auto-scrolling marquee is gone (no motion in chrome).
//  Each strip is now a row of small Cards the visitor can swipe / scroll
//  sideways. Tier emoji are replaced by a Pill with the tier name.
//  Data fetching (React Query keys, refetch timings, caps) is unchanged —
//  SupportCheckout invalidates these same query keys after a payment.
//
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import type { ContributorsResponse, ContributorItem } from "@/app/api/payment/contributors/route";
import { normalizeSocialLink } from "@/lib/social-link";
import { Card, EmptyState, Pill, SectionHeader } from "@/components/district/ui";

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

/** Shared style: one-line text that ends in "…" when too long. */
const ELLIPSIS: React.CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

/** Horizontal strip that scrolls sideways on its own (never the page). */
function Strip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ul
      aria-label={label}
      style={{ display: "flex", gap: 12, overflowX: "auto", margin: 0, padding: "0 0 8px", listStyle: "none", scrollSnapType: "x proximity" }}
    >
      {children}
    </ul>
  );
}

function ContributorCard({ item }: { item: ContributorItem }) {
  return (
    <Card as="li" padding={12} style={{ width: 160, minWidth: 160, flexShrink: 0, listStyle: "none", scrollSnapAlign: "start" }}>
      <p className="ftp-title" style={{ ...ELLIPSIS, fontSize: 13, lineHeight: "20px" }}>{item.displayName}</p>
      <div style={{ margin: "4px 0 6px", maxWidth: "100%", overflow: "hidden" }}>
        <Pill tone="support" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{item.tierLabel}</Pill>
      </div>
      {item.message && (
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "0 0 4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          &ldquo;{item.message.slice(0, 30)}{item.message.length > 30 ? "…" : ""}&rdquo;
        </p>
      )}
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>{item.timeAgo}</p>
    </Card>
  );
}

function SubscriberCard({ item }: { item: SubscriberItem }) {
  const safeLink = normalizeSocialLink(item.socialLink);
  // Even when platform is missing we still render the ExternalLink icon as
  // long as we have a usable URL — keeps bare-domain entries clickable.
  const SocialIcon =
    (item.socialPlatform ? SOCIAL_ICONS[item.socialPlatform] : null) ?? (safeLink ? ExternalLink : null);
  return (
    <Card as="li" padding={12} style={{ width: 160, minWidth: 160, flexShrink: 0, listStyle: "none", scrollSnapAlign: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span className="ftp-title" style={{ ...ELLIPSIS, fontSize: 13, lineHeight: "20px", flex: 1 }}>{item.name}</span>
        {SocialIcon && safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            title={safeLink}
            aria-label={`${item.name}'s profile`}
            style={{ color: "var(--ftp-brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flexShrink: 0 }}
          >
            <SocialIcon size={12} aria-hidden />
          </a>
        )}
      </div>
      {item.badgeLevel && (
        <div style={{ marginTop: 4 }}>
          <Pill tone="warn">{item.badgeLevel}</Pill>
        </div>
      )}
      {item.monthsActive > 0 && (
        <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "4px 0 0" }}>
          <span className="ftp-num">{item.monthsActive}</span>mo active
        </p>
      )}
    </Card>
  );
}

/** Flat placeholder card while the list loads (no shimmer gradient). */
function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="ftp-skeleton"
      style={{ width: 160, minWidth: 160, height: 88, borderRadius: "var(--ftp-radius-card)", flexShrink: 0 }}
    />
  );
}

const TEXT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ftp-brand)",
  textDecoration: "none",
};

export default function ContributorWall() {
  // Existing one-time contributors (from Contribution model)
  const { data, isLoading } = useQuery<ContributorsResponse>({
    queryKey: ["contributors"],
    queryFn: () => fetch("/api/payment/contributors").then((r) => r.json()),
    refetchInterval: 60_000,
    staleTime: 50_000,
  });

  // Active subscribers (from Supporter model) — capped at 30 for the wall
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

  return (
    <div>
      {/* ── Active supporters (monthly) ── */}
      {subscribers.length > 0 && (
        <section>
          <SectionHeader
            title={
              <>
                Active supporters
                {subscribersTotal > subscribers.length && (
                  <span style={{ fontSize: 13, color: "var(--ftp-text-2)", fontWeight: 400 }}>
                    {" "}· <span className="ftp-num">{subscribersTotal.toLocaleString("en-IN")}</span> total
                  </span>
                )}
              </>
            }
            action={
              <Link href="/en/contributors" style={TEXT_LINK}>
                View all <ArrowRight size={14} aria-hidden />
              </Link>
            }
          />
          <Strip label="Active supporters">
            {subscribers.map((item) => (
              <SubscriberCard key={item.id} item={item} />
            ))}
          </Strip>
        </section>
      )}

      {/* ── One-time contributions ── */}
      <section>
        <SectionHeader
          title={subscribers.length > 0 ? "One-time contributions" : "Contributions"}
          action={
            <>
              {!isLoading && data && data.count > 0 && (
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>₹{data.totalRupees.toLocaleString("en-IN")}</span>
                  {" "}from{" "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{data.count}</span>
                  {" "}supporter{data.count !== 1 ? "s" : ""}
                </span>
              )}
              {oneTimeTotal > 50 && (
                <Link href="/en/contributors?filter=one-time" style={TEXT_LINK}>
                  View all <span className="ftp-num">{oneTimeTotal.toLocaleString("en-IN")}</span> <ArrowRight size={14} aria-hidden />
                </Link>
              )}
            </>
          }
        />

        {isLoading ? (
          <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : contributors.length === 0 ? (
          <EmptyState title="Be the first to support ForThePeople.in!" body="Your name will appear here." />
        ) : (
          <Strip label="One-time contributions">
            {contributors.map((item, i) => (
              <ContributorCard key={`${item.displayName}-${i}`} item={item} />
            ))}
          </Strip>
        )}

        {/* Summary line */}
        {!isLoading && data && data.count > 0 && (
          <p className="ftp-body" style={{ textAlign: "center", marginTop: 12, color: "var(--ftp-text-2)" }}>
            <span className="ftp-num">₹{data.totalRupees.toLocaleString("en-IN")}</span> contributed by{" "}
            <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{data.count}</span> supporters — thank you!
          </p>
        )}
      </section>
    </div>
  );
}
