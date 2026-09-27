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
//  Design v5.1 ("Warm Calm"): each strip is a row of small cards the
//  visitor can swipe / scroll sideways (no auto-scrolling marquee). Every
//  card wears its supporter's plan colour — rose, blue, teal, violet or
//  gold, the same as the plan cards above (tier-look.ts) — with a round
//  initials avatar, the plan in a small coloured tag, and month badges as
//  tiny bronze / silver / gold / platinum medals. A colour key sits on top.
//  No emoji. Data fetching (React Query keys, refetch timings, caps) is
//  unchanged — SupportCheckout invalidates these same query keys after a
//  payment.
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
import { SectionHeader } from "@/components/district/ui";
import { tierLabel } from "@/components/site/tier-label";
import { useFormat } from "@/i18n/client";
import SupporterAvatar from "./SupporterAvatar";
import { publicName } from "./public-name";
import { tierHueClass, tierKeyFromWallLabel, tierKeyOf, type TierKey } from "./tier-look";
import look from "./look.module.css";
import wall from "./wall.module.css";

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
  districtName?: string | null;
  stateName?: string | null;
  message?: string | null;
}

/** The colour key, in plan order. */
const LEGEND: TierKey[] = ["custom", "district", "state", "patron", "founder"];

/** English tier label from /api/payment/contributors → message key (emoji dropped). */
const WALL_TIER_KEYS: Array<[string, string]> = [
  ["Chai Supporter", "wallTier_chai"],
  ["District Supporter", "wallTier_district"],
  ["State Supporter", "wallTier_state"],
  ["All-India Patron", "wallTier_patron"],
  ["Founding Builder", "wallTier_founder"],
];

/** Horizontal strip that scrolls sideways on its own (never the page). */
function Strip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ul aria-label={label} className={wall.strip}>
      {children}
    </ul>
  );
}

/** One wall card in its plan colour (gold for the Founding Builder). */
function WallCard({ tier, children }: { tier: TierKey; children: React.ReactNode }) {
  return (
    <li className={`${wall.card} ${tierHueClass(tier)} ${look.metal}`} data-tier={tier}>
      {children}
    </li>
  );
}

/** "Bronze" with a tiny bronze medal before it. */
function Medal({ level }: { level: string }) {
  const t = useTranslations("page_support");
  const key = `badge_${level}`;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span aria-hidden className={`${look.medal} ${look.metal}`} data-level={level} />
      {t.has(key) ? t(key) : level}
    </span>
  );
}

/** Which colour is which plan. */
function ColourKey() {
  const t = useTranslations("page_support");
  return (
    <ul className={wall.legend} aria-label={t("wallKey")}>
      {LEGEND.map((k) => (
        <li key={k} className={`${wall.legendItem} ${tierHueClass(k)} ${look.metal}`} data-tier={k}>
          <span aria-hidden className={wall.legendDot} />
          {t(`tier_${k}_name`)}
        </li>
      ))}
    </ul>
  );
}

/** Translated display name, tier label and time for one API row. */
function useWallText() {
  const t = useTranslations("page_support");
  const { date } = useFormat();
  return {
    // Anonymous, placeholders and contact details (a phone number or e-mail
    // stored as a name) are never shown: "Anonymous" / "Supporter" instead.
    name: (n: string) => publicName(n) ?? (n === "Anonymous" ? t("anonymous") : t("supporter")),
    hidden: (n: string) => publicName(n) === null,
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
  // The wall label is chosen by amount on the server ("District Supporter"
  // from ₹99, … "Founding Builder" from ₹50,000); its colour follows it.
  const tier = tierKeyFromWallLabel(item.tierLabel);
  const hidden = w.hidden(item.displayName);
  const name = w.name(item.displayName);
  return (
    <WallCard tier={tier}>
      <div className={wall.head}>
        <SupporterAvatar name={name} tier={tier} size={40} anonymous={hidden} />
        <div className={wall.who}>
          <span className={wall.name} title={name}>{name}</span>
          <span className={wall.tag}>{w.tier(item.tierLabel)}</span>
        </div>
      </div>
      {item.message && (
        <p className={wall.msg}>
          &ldquo;{item.message.slice(0, 60)}{item.message.length > 60 ? "…" : ""}&rdquo;
        </p>
      )}
      <p className={wall.meta}>{w.time(item.timeAgo)}</p>
    </WallCard>
  );
}

function SubscriberCard({ item }: { item: SubscriberItem }) {
  const t = useTranslations("page_support");
  const ts = useTranslations("page_site");
  const w = useWallText();
  const safeLink = normalizeSocialLink(item.socialLink);
  // Even when platform is missing we still render the ExternalLink icon as
  // long as we have a usable URL — keeps bare-domain entries clickable.
  const SocialIcon =
    (item.socialPlatform ? SOCIAL_ICONS[item.socialPlatform] : null) ?? (safeLink ? ExternalLink : null);
  const tier = tierKeyOf(item.tier);
  const hidden = w.hidden(item.name);
  const name = w.name(item.name);
  return (
    <WallCard tier={tier}>
      <div className={wall.head}>
        <SupporterAvatar name={name} tier={tier} size={40} anonymous={hidden} />
        <div className={wall.who}>
          <span className={wall.nameRow}>
            <span className={wall.name} title={name}>{name}</span>
            {SocialIcon && safeLink && (
              <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                title={safeLink}
                aria-label={t("wallProfile", { name })}
                className={wall.social}
              >
                <SocialIcon size={13} aria-hidden />
              </a>
            )}
          </span>
          {/* "Mandya Champion", "Karnataka Champion", "India Patron" … (place names as stored) */}
          <span className={wall.tag}>{tierLabel(ts, item.tier, item.districtName, item.stateName)}</span>
        </div>
      </div>
      {item.message && !hidden && (
        <p className={wall.msg}>
          &ldquo;{item.message.slice(0, 60)}{item.message.length > 60 ? "…" : ""}&rdquo;
        </p>
      )}
      {(item.badgeLevel || item.monthsActive > 0) && (
        <p className={wall.meta}>
          {item.badgeLevel && <Medal level={item.badgeLevel} />}
          {item.badgeLevel && item.monthsActive > 0 && <span aria-hidden className={wall.metaDot} />}
          {item.monthsActive > 0 && <span>{t("wallMonths", { n: item.monthsActive })}</span>}
        </p>
      )}
    </WallCard>
  );
}

/** Flat placeholder card while the list loads (no shimmer gradient). */
function SkeletonCard() {
  return <div aria-hidden className={`ftp-skeleton ${wall.skeleton}`} />;
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
  const subscribers = (subData?.subscribers ?? []).slice(0, 30);
  const subscribersTotal = subData?.subscribersTotal ?? subscribers.length;
  // /api/payment/contributors lists EVERY active supporter, monthly ones
  // too, and its ₹ total adds one month of each subscription to the one-time
  // gifts (checked against the database, 27 Sep 2026). So: when the monthly
  // strip is shown above, this strip keeps only the one-time gifts (no one
  // twice), and it shows a COUNT, never that mixed ₹ total. The count is the
  // API's own total for the rows this strip lists (`oneTimeCount` when split
  // out, else `count`); the list itself holds at most 50 rows.
  const splitOut = subscribers.length > 0;
  const contributors = (splitOut ? allContributors.filter((c) => !c.isRecurring) : allContributors).slice(0, 50);
  const listTotal = data ? (splitOut ? data.oneTimeCount : data.count) : undefined;
  const haveAll = typeof listTotal === "number";
  const moreThanShown = typeof listTotal === "number" && listTotal > contributors.length;

  return (
    <div>
      {(subscribers.length > 0 || contributors.length > 0) && <ColourKey />}

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
              {!isLoading && haveAll && contributors.length > 0 && (
                <span className="ftp-num" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
                  {t("wallCount", { n: listTotal, shown: number(listTotal) })}
                </span>
              )}
              {moreThanShown && (
                <Link href={`/${locale}/contributors?filter=one-time`} style={TEXT_LINK}>
                  {t("wallViewAll")}
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
      </section>
    </div>
  );
}
