/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { getContributorLabel } from "@/lib/contributor-label";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { normalizeSocialLink } from "@/lib/social-link";

interface Sponsor {
  id: string;
  name: string;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtName: string | null;
  stateName: string | null;
  monthsActive: number;
  message: string | null;
  isRecurring: boolean;
}

interface DistrictSponsorBannerProps {
  district: string;
  state: string;
  stateName?: string;
  districtName?: string;
  locale?: string;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

function Chip({ s }: { s: Sponsor }) {
  const badgeColors = s.badgeLevel ? BADGE_COLORS[s.badgeLevel] : null;
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
  const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(s.tier, s.districtName, s.stateName);

  const title = `${s.name} · ${label}${s.monthsActive ? ` · ${s.monthsActive}mo` : ""}${s.message ? `\n"${s.message}"` : ""}`;

  const inner = (
    <>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: badgeColors?.bg ?? "#E2E8F0",
          color: badgeColors?.text ?? "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
          border: badgeColors ? `1.5px solid ${badgeColors.border}` : "1.5px solid #CBD5E1",
        }}
      >
        {initials}
      </div>
      <span className="ftp-sponsor-chip-name" style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", whiteSpace: "nowrap" }}>
        {s.name}
      </span>
      {SocialIcon && <SocialIcon size={11} color="#64748B" />}
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
        border: "1px solid #E2E8F0",
        borderRadius: 999,
        flexShrink: 0,
      }}
    >
      {normalizeSocialLink(s.socialLink) ? (
        <a
          href={normalizeSocialLink(s.socialLink)!}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit" }}
        >
          {inner}
        </a>
      ) : (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{inner}</div>
      )}
    </div>
  );
}

function ScrollRow({
  icon,
  label,
  sponsors,
  speed,
  emptyCta,
  viewAllHref,
}: {
  icon: string;
  label: string;
  sponsors: Sponsor[];
  speed: number; // seconds for full cycle
  emptyCta?: { text: string; href: string };
  viewAllHref: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // Measure overflow on mount + resize; update shouldScroll flag so only
  // overflowing rows animate. We measure the single-pass width (before
  // duplicating for loop) vs the viewport width + 50px slack.
  useEffect(() => {
    function measure() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      // We measure the intrinsic content width of the single-copy track.
      // If duplicated, scrollWidth is 2x, so compare against clientWidth * 2.
      const track = trackRef.current;
      const contentWidth = track ? track.scrollWidth : viewport.scrollWidth;
      const effective = shouldScroll ? contentWidth / 2 : contentWidth;
      const overflows = effective > viewport.clientWidth + 50;
      if (overflows !== shouldScroll) setShouldScroll(overflows);
    }
    measure();
    const obs = new ResizeObserver(measure);
    if (viewportRef.current) obs.observe(viewportRef.current);
    return () => obs.disconnect();
  }, [sponsors.length, shouldScroll]);

  const displayItems = shouldScroll ? [...sponsors, ...sponsors] : sponsors;

  return (
    <div className="ftp-scroll-row" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, marginBottom: 6 }}>
      <div className="ftp-scroll-row-label" style={{ fontSize: 11, fontWeight: 700, color: "#475569", flexShrink: 0, width: 110, display: "flex", alignItems: "center", gap: 4 }}>
        <span>{icon}</span>
        <span>{label}:</span>
      </div>
      <div ref={viewportRef} style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
        {sponsors.length === 0 && emptyCta ? (
          <Link
            href={emptyCta.href}
            style={{ fontSize: 11, color: "#475569", textDecoration: "none", fontStyle: "italic", whiteSpace: "nowrap", padding: "4px 0" }}
          >
            {emptyCta.text}
          </Link>
        ) : (
          <div
            ref={trackRef}
            onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = "paused"; }}
            onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = "running"; }}
            style={{
              display: "flex",
              gap: 8,
              width: shouldScroll ? "max-content" : "100%",
              animation: shouldScroll ? `ftp-row-scroll ${speed}s linear infinite` : "none",
              willChange: shouldScroll ? "transform" : undefined,
            }}
          >
            {displayItems.map((s, i) => (
              <Chip key={`${s.id}-${i}`} s={s} />
            ))}
            {!shouldScroll && sponsors.length > 5 && (
              <Link
                href={viewAllHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 10px",
                  background: "#FFFFFF",
                  border: "1px dashed #CBD5E1",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#475569",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                View all →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DistrictSponsorBanner({
  district,
  state,
  stateName,
  districtName,
  locale = "en",
}: DistrictSponsorBannerProps) {
  const { data } = useQuery<{ contributors: Sponsor[] }>({
    queryKey: ["district-sponsors", district, state],
    queryFn: () =>
      fetch(`/api/data/contributors?district=${district}&state=${state}&limit=120`).then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const allSponsors = (data?.contributors ?? []).filter((c) => c.isRecurring);
  const indiaLine = allSponsors.filter((s) => s.tier === "founder" || s.tier === "patron");
  const stateLine = allSponsors.filter((s) => s.tier === "state");
  const districtLine = allSponsors.filter((s) => s.tier === "district");

  const dName = districtName ?? district;
  const sName = stateName ?? state;
  const viewAllHref = `/${locale}/${state}/${district}/contributors`;
  const supportHref = `/${locale}/support?tier=district&state=${state}&district=${district}`;

  return (
    <>
      <style>{`
        @keyframes ftp-row-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 600px) {
          .ftp-scroll-row { flex-wrap: wrap; gap: 6px !important; }
          .ftp-scroll-row-label { width: auto !important; }
          .ftp-sponsor-chip-name { font-size: 11px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-scroll-row [style*="ftp-row-scroll"] { animation: none !important; }
        }
      `}</style>

      <div
        className="ftp-supported-by-card"
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <span>🏆</span>
            <span>Supported By</span>
          </span>
          <Link
            href={viewAllHref}
            style={{ fontSize: 11, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
          >
            View all →
          </Link>
        </div>

        {/* 3 scrolling lines — slower at the top, faster at the bottom */}
        <ScrollRow
          icon="👑"
          label="India"
          sponsors={indiaLine}
          speed={120}
          viewAllHref={viewAllHref}
          emptyCta={{ text: "Be the first — ₹9,999/mo", href: `/${locale}/support?tier=patron` }}
        />
        <ScrollRow
          icon="🇮🇳"
          label={sName}
          sponsors={stateLine}
          speed={90}
          viewAllHref={viewAllHref}
          emptyCta={{ text: `Sponsor ${sName} — ₹999/mo`, href: `/${locale}/support?tier=state&state=${state}` }}
        />
        <ScrollRow
          icon="🏛️"
          label={dName}
          sponsors={districtLine}
          speed={60}
          viewAllHref={viewAllHref}
          emptyCta={{ text: `Champion ${dName} — ₹99/mo`, href: supportHref }}
        />

        {/* Sponsor CTA — inside the same card, separated by a subtle top border */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={supportHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              background: "#FFFFFF",
              border: "1px solid #FECACA",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#DC2626",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ❤️ Sponsor {dName} — ₹{TIER_CONFIG.district.amount.toLocaleString("en-IN")}/mo
          </Link>
          <span style={{ fontSize: 11, color: "#64748B" }}>
            or: {sName} ₹{TIER_CONFIG.state.amount.toLocaleString("en-IN")}/mo · All India ₹{TIER_CONFIG.patron.amount.toLocaleString("en-IN")}/mo
          </span>
        </div>
      </div>
    </>
  );
}
