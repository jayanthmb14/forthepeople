/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";

interface StateSponsor {
  id: string;
  name: string;
  tier: string;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtName: string | null;
  stateName: string | null;
  monthsActive: number;
  isRecurring: boolean;
}

interface Props {
  locale: string;
  stateSlug: string;
  stateName: string;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

const CHIPS_PER_LINE = 15;

function Chip({ s }: { s: StateSponsor }) {
  const badgeColors = s.badgeLevel ? BADGE_COLORS[s.badgeLevel] : null;
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
  const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(s.tier, s.districtName, s.stateName);
  const title = `${s.name} · ${label}${s.monthsActive ? ` · ${s.monthsActive}mo` : ""}`;

  const inner = (
    <>
      <div
        style={{
          width: 22, height: 22, borderRadius: "50%",
          background: badgeColors?.bg ?? "#FEF3C7",
          color: badgeColors?.text ?? "#92400E",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          border: badgeColors ? `1.5px solid ${badgeColors.border}` : undefined,
        }}
      >
        {initials}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap" }}>{s.name}</span>
      {SocialIcon && <SocialIcon size={11} color="#6B6B6B" />}
    </>
  );

  return (
    <div
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        background: "#FFFFFF",
        border: "1px solid #FDE68A",
        borderRadius: 999,
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      {normalizeSocialLink(s.socialLink) ? (
        <a href={normalizeSocialLink(s.socialLink)!} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit" }}>
          {inner}
        </a>
      ) : (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{inner}</div>
      )}
    </div>
  );
}

function Line({
  icon,
  label,
  sponsors,
  viewAllHref,
  emptyCta,
}: {
  icon: string;
  label: string;
  sponsors: StateSponsor[];
  viewAllHref: string;
  emptyCta?: { text: string; href: string };
}) {
  const visible = sponsors.slice(0, CHIPS_PER_LINE);
  const hiddenCount = sponsors.length - visible.length;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", flexShrink: 0, width: 130, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{icon}</span>
        <span>{label}:</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          flex: 1,
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}
      >
        {visible.length > 0
          ? visible.map((s) => <Chip key={s.id} s={s} />)
          : emptyCta && (
              <Link
                href={emptyCta.href}
                style={{ fontSize: 11, color: "#92400E", textDecoration: "none", fontStyle: "italic", whiteSpace: "nowrap", padding: "4px 0" }}
              >
                {emptyCta.text}
              </Link>
            )}
        {hiddenCount > 0 && (
          <Link
            href={viewAllHref}
            style={{
              display: "inline-flex", alignItems: "center", padding: "5px 10px",
              background: "rgba(255,255,255,0.6)", border: "1px dashed #FDE68A",
              borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#92400E",
              textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, scrollSnapAlign: "start",
            }}
          >
            +{hiddenCount} more
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StateSponsorSection({ locale, stateSlug, stateName }: Props) {
  const { data } = useQuery<{ contributors: StateSponsor[]; total: number }>({
    queryKey: ["state-sponsors", stateSlug],
    queryFn: () => fetch(`/api/data/contributors?type=state-page&state=${stateSlug}&limit=60`).then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 180_000,
  });

  const all = data?.contributors ?? [];
  const indiaLine = all.filter((s) => s.tier === "founder" || s.tier === "patron");
  const stateLine = all.filter((s) => s.tier === "state");

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: "1px solid #FDE68A",
        borderRadius: 14,
        padding: "16px 20px",
        marginTop: 24,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.06em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <span>🏆</span><span>Supported By</span>
        </div>
        <Link href={`/${locale}/contributors`} style={{ fontSize: 11, color: "#92400E", textDecoration: "none", fontWeight: 600 }}>
          View all →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Line
          icon="👑"
          label="India"
          sponsors={indiaLine}
          viewAllHref={`/${locale}/contributors`}
          emptyCta={{ text: "Be the first → ₹9,999/mo", href: `/${locale}/support?tier=patron` }}
        />
        <Line
          icon="🇮🇳"
          label={`${stateName} Champions`}
          sponsors={stateLine}
          viewAllHref={`/${locale}/contributors`}
          emptyCta={{ text: `Be the first ${stateName} Champion → ₹999/mo`, href: `/${locale}/support?tier=state&state=${stateSlug}` }}
        />
      </div>

      <Link
        href={`/${locale}/support?tier=state&state=${stateSlug}`}
        style={{
          display: "inline-block",
          marginTop: 14,
          padding: "9px 18px",
          background: "#7C3AED",
          color: "#fff",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ❤️ Sponsor {stateName} — ₹999/mo →
      </Link>
    </div>
  );
}
