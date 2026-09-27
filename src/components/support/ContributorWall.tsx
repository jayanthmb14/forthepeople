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
//  Design v5 (calm): each strip is a row of small plain Cards the visitor
//  can swipe / scroll sideways (no auto-scrolling marquee). No emoji: the
//  headings are plain h3s under the page's "Our supporters" heading, and
//  the tier label is text only. Data fetching (React Query keys, refetch
//  timings, caps) is unchanged — SupportCheckout invalidates these same
//  query keys after a payment.
//
//  Languages: headings and counts come from "page_support". The payments
//  API sends English tier labels ("☕ Chai Supporter") and relative times
//  ("This week", "September 2026"); both are mapped to translated text
//  here (the emoji is dropped), and anything unknown is shown as sent.
//  Names are shown as entered.
//
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import type { ContributorsResponse, ContributorItem } from "@/app/api/payment/contributors/route";
import { normalizeSocialLink } from "@/lib/social-link";
import { Card, Pill, SectionHeader } from "@/components/district/ui";
import { useFormat } from "@/i18n/client";

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

/** English tier label from /api/payment/contributors → message key (emoji dropped). */
const WALL_TIER_KEYS: Array<[string, string]> = [
  ["Chai Supporter", "wallTier_chai"],
  ["District Supporter", "wallTier_district"],
  ["State Supporter", "wallTier_state"],
  ["All-India Patron", "wallTier_patron"],
  ["Founding Builder", "wallTier_founder"],
];

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

/** Translated display name, tier label and time for one API row. */
function useWallText() {
  const t = useTranslations("page_support");
  const { date } = useFormat();
  return {
    name: (n: string) => (n === "Anonymous" ? t("anonymous") : n === "Supporter" ? t("supporter") : n),
    tier: (label: string) => {
      const hit = WALL_TIER_KEYS.find(([en]) => label.endsWith(en));
      // Unknown label: show it as sent, minus any leading emoji.
      if (!hit) return label.replace(/^[^\p{L}\p{N}]+/u, "");
      return t(hit[1]);
    },
    time: (s: string) => {
      if (s === "Today") return t("wallToday");
      if (s === "This week") return t("wallThisWeek");
      if (s === "This month") return t("wallThisMonth");
      // "September 2026" → the month and year in the reader's language.
      const parsed = new Date(`1 ${s}`);
      return Number.isNaN(parsed.getTime()) ? s : date(parsed, { month: "long", year: "numeric" });
    },
  };
}

function ContributorCard({ item }: { item: ContributorItem }) {
  const w = useWallText();
  return (
    <Card as="li" padding={12} style={{ width: 170, minWidth: 170, flexShrink: 0, listStyle: "none", scrollSnapAlign: "start" }}>
      <p className="ftp-title" style={{ ...ELLIPSIS, fontSize: 14, lineHeight: 1.45, fontWeight: 600 }}>{w.name(item.displayName)}</p>
      <div style={{ margin: "4px 0 6px", maxWidth: "100%", overflow: "hidden" }}>
        <Pill tone="support" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{w.tier(item.tierLabel)}</Pill>
      </div>
      {item.message && (
        <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", margin: "0 0 4px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          &ldquo;{item.message.slice(0, 30)}{item.message.length > 30 ? "…" : ""}&rdquo;
        </p>
      )}
      <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", margin: 0 }}>{w.time(item.timeAgo)}</p>
    </Card>
  );
}

function SubscriberCard({ item }: { item: SubscriberItem }) {
  const t = useTranslations("page_support");
  const safeLink = normalizeSocialLink(item.socialLink);
  // Even when platform is missing we still render the ExternalLink icon as
  // long as we have a usable URL — keeps bare-domain entries clickable.
  const SocialIcon =
    (item.socialPlatform ? SOCIAL_ICONS[item.socialPlatform] : null) ?? (safeLink ? ExternalLink : null);
  const badgeKey = item.badgeLevel ? `badge_${item.badgeLevel}` : null;
  return (
    <Card as="li" padding={12} style={{ width: 170, minWidth: 170, flexShrink: 0, listStyle: "none", scrollSnapAlign: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span className="ftp-title" style={{ ...ELLIPSIS, fontSize: 14, lineHeight: 1.45, fontWeight: 600, flex: 1 }}>{item.name}</span>
        {SocialIcon && safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            title={safeLink}
            aria-label={t("wallProfile", { name: item.name })}
            style={{ color: "var(--ftp-text-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flexShrink: 0 }}
          >
            <SocialIcon size={12} aria-hidden />
          </a>
        )}
      </div>
      {item.badgeLevel && (
        <div style={{ marginTop: 4 }}>
          <Pill tone="neutral">{badgeKey && t.has(badgeKey) ? t(badgeKey) : item.badgeLevel}</Pill>
        </div>
      )}
      {item.monthsActive > 0 && (
        <p className="ftp-num" style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", margin: "4px 0 0" }}>
          {t("wallMonths", { n: item.monthsActive })}
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
      style={{ width: 170, minWidth: 170, height: 88, borderRadius: "var(--ftp-radius-card)", flexShrink: 0 }}
    />
  );
}

const TEXT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--ftp-brand)",
  textDecoration: "none",
};

export default function ContributorWall() {
  const t = useTranslations("page_support");
  const locale = useLocale();
  const { number } = useFormat();
  const num = (c: React.ReactNode) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span>;

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
            as="h3"
            title={
              <>
                {t("wallActive")}
                {subscribersTotal > subscribers.length && (
                  <span className="ftp-num" style={{ fontSize: 14, color: "var(--ftp-text-2)", fontWeight: 400 }}>
                    {" "}{t("wallActiveTotal", { n: number(subscribersTotal) })}
                  </span>
                )}
              </>
            }
            action={
              <Link href={`/${locale}/contributors`} style={TEXT_LINK}>
                {t("wallViewAll")}
              </Link>
            }
          />
          <Strip label={t("wallActive")}>
            {subscribers.map((item) => (
              <SubscriberCard key={item.id} item={item} />
            ))}
          </Strip>
        </section>
      )}

      {/* ── One-time contributions ── */}
      <section>
        <SectionHeader
          as="h3"
          title={subscribers.length > 0 ? t("wallOneTime") : t("wallContributions")}
          action={
            <>
              {!isLoading && data && data.count > 0 && (
                <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  {t.rich("wallRaised", { amount: `₹${number(data.totalRupees)}`, count: data.count, num })}
                </span>
              )}
              {oneTimeTotal > 50 && (
                <Link href={`/${locale}/contributors?filter=one-time`} style={TEXT_LINK}>
                  <span className="ftp-num">{t("wallViewAllN", { n: number(oneTimeTotal) })}</span>
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
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ftp-text-2)" }}>
            <span style={{ display: "block", fontWeight: 600, color: "var(--ftp-text)" }}>{t("wallEmptyTitle")}</span>
            {t("wallEmptyBody")}
          </p>
        ) : (
          <Strip label={subscribers.length > 0 ? t("wallOneTime") : t("wallContributions")}>
            {contributors.map((item, i) => (
              <ContributorCard key={`${item.displayName}-${i}`} item={item} />
            ))}
          </Strip>
        )}
        {/* (The "₹X from N supporters" total sits in the heading row; the
            old summary line under the strip repeated it word for word.) */}
      </section>
    </div>
  );
}
