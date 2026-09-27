/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// One supporter's name as a small, calm chip: initials, the name, a social
// icon when they shared a link, and — for the Founding Builder — a soft gold
// "Founding Builder" tag. Used by the "Supported by" block on district pages
// and by the All-India supporters line.

import { Award, ExternalLink, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { normalizeSocialLink } from "@/lib/social-link";

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
  /** Screen-reader text for the profile link ("Open Asha's profile"). */
  profileLabel?: string;
}) {
  const href = normalizeSocialLink(s.socialLink ?? null);
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : href ? ExternalLink : null;
  const initials = s.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = (
    <>
      <span
        aria-hidden
        className="ftp-num"
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: founder ? "var(--hue-tint)" : "var(--ftp-surface-2)",
          color: founder ? "var(--hue-deep)" : "var(--ftp-text-2)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          flexShrink: 0,
        }}
      >
        {founder ? <Award size={13} /> : initials}
      </span>
      <span style={{ fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: founder ? 600 : 500 }}>{s.name}</span>
      {tag && (
        <span style={{ fontSize: 12, lineHeight: "16px", color: founder ? "var(--hue-deep)" : "var(--ftp-text-2)", whiteSpace: "nowrap" }}>{tag}</span>
      )}
      {SocialIcon && href && <SocialIcon size={12} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    maxWidth: "100%",
    padding: "4px 12px 4px 6px",
    borderRadius: "var(--ftp-radius-pill)",
    border: founder ? "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))" : "1px solid var(--ftp-border)",
    background: founder ? "color-mix(in srgb, var(--hue-tint) 70%, var(--ftp-surface))" : "var(--ftp-surface)",
    textDecoration: "none",
    color: "inherit",
    flexWrap: "wrap",
  };

  return (
    <li style={{ listStyle: "none", maxWidth: "100%" }} className={founder ? "ftp-hue-yellow" : undefined}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={profileLabel} style={style}>
          {inner}
        </a>
      ) : (
        <span style={style}>{inner}</span>
      )}
    </li>
  );
}
