/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// One supporter's name as a small chip: a round initials avatar in their
// plan's colour (rose, blue, teal, violet — tier-look.ts), the name, a social
// icon when they shared a link, and a small label ("Founding Builder",
// "All-India Patron"). The Founding Builder's chip is soft gold with a gold
// ring. Used by the "Supported by" block on district pages and by the
// All-India supporters line. When the row carries no tier, the avatar stays
// a quiet grey (as before).

import { useTranslations } from "next-intl";
import { ExternalLink, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { normalizeSocialLink } from "@/lib/social-link";
import SupporterAvatar from "./SupporterAvatar";
import { publicName } from "./public-name";
import { initialsOf, supporterTierKey, tierHueClass, type TierKey } from "./tier-look";
import look from "./look.module.css";

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

export interface ChipSupporter {
  id: string;
  name: string;
  socialLink?: string | null;
  socialPlatform?: string | null;
  /** Stored tier ("district", "patron", …) — colours the avatar when present. */
  tier?: string | null;
  /** One-time amount (null for monthly), so big one-time gifts get their level's colour. */
  amount?: number | null;
}

export default function SupporterChip({
  s,
  tag,
  founder,
  profileLabel,
}: {
  s: ChipSupporter;
  /** Small label after the name ("Founding Builder", "All-India Patron"). */
  tag?: string;
  /** Soft gold styling for the Founding Builder. */
  founder?: boolean;
  /** Screen-reader text for the profile link ("Asha's profile"). Ignored when the name is masked. */
  profileLabel?: string;
}) {
  const t = useTranslations("page_support");
  // Never show a phone number or e-mail stored as a name (see public-name.ts).
  const shown = publicName(s.name);
  const name = shown ?? (s.name === "Anonymous" ? t("anonymous") : t("supporter"));
  const href = normalizeSocialLink(s.socialLink ?? null);
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : href ? ExternalLink : null;
  const tierKey: TierKey | null = founder
    ? "founder"
    : s.tier
      ? supporterTierKey({ id: s.id, name: s.name, tier: s.tier, amount: s.amount ?? null })
      : null;

  const avatar = tierKey ? (
    <SupporterAvatar name={name} tier={tierKey} size={26} anonymous={!shown} />
  ) : (
    <span
      aria-hidden
      className="ftp-num"
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "var(--ftp-surface-2)",
        color: "var(--ftp-text-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        flexShrink: 0,
      }}
    >
      {shown ? initialsOf(name) : ""}
    </span>
  );

  const inner = (
    <>
      {avatar}
      <span style={{ fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: founder ? 650 : 500 }}>{name}</span>
      {tag && (
        <span
          style={{
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: tierKey ? 600 : 400,
            color: founder ? "var(--sup-gold-deep)" : tierKey ? "var(--hue-deep)" : "var(--ftp-text-2)",
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      )}
      {SocialIcon && href && <SocialIcon size={12} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    // A link gets a full 44 px touch target; a plain name can be smaller.
    minHeight: href ? 44 : 36,
    maxWidth: "100%",
    padding: "4px 12px 4px 5px",
    borderRadius: "var(--ftp-radius-pill)",
    border: founder
      ? "1px solid color-mix(in srgb, var(--sup-gold) 50%, var(--ftp-border))"
      : tierKey
        ? "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))"
        : "1px solid var(--ftp-border)",
    background: founder
      ? "linear-gradient(90deg, var(--sup-gold-tint) 0%, var(--ftp-surface) 100%)"
      : tierKey
        ? "linear-gradient(90deg, color-mix(in srgb, var(--hue-tint) 80%, var(--ftp-surface)) 0%, var(--ftp-surface) 100%)"
        : "var(--ftp-surface)",
    textDecoration: "none",
    color: "inherit",
    flexWrap: "wrap",
  };

  return (
    <li
      style={{ listStyle: "none", maxWidth: "100%" }}
      className={tierKey ? `${tierHueClass(tierKey)} ${look.metal}` : undefined}
    >
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={shown ? profileLabel : t("wallProfile", { name })} style={style}>
          {inner}
        </a>
      ) : (
        <span style={style}>{inner}</span>
      )}
    </li>
  );
}
