/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  StateSponsorSection — "Backed by" block on a state page (Design v3).
//  Two quiet rows (All India · <State> champions) of supporter names,
//  wrapping instead of side-scrolling, plus one sponsor link. Same
//  /api/data/contributors request as v2; prices come from TIER_CONFIG.
// ═══════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, HandHeart, Instagram, Linkedin, Twitter } from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { normalizeSocialLink } from "@/lib/social-link";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { Card } from "@/components/district/ui";

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

/** Names shown per row before "+N more". */
const CHIPS_PER_LINE = 15;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Chip({ s }: { s: StateSponsor }) {
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
  const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(s.tier, s.districtName, s.stateName);
  const title = `${s.name} · ${label}${s.monthsActive ? ` · ${s.monthsActive}mo` : ""}`;
  const href = normalizeSocialLink(s.socialLink);

  const inner = (
    <>
      <span
        aria-hidden
        className="ftp-num"
        style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "var(--ftp-surface-2)", color: "var(--ftp-text-2)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", whiteSpace: "nowrap" }}>{s.name}</span>
      {SocialIcon && <SocialIcon size={11} aria-hidden style={{ color: "var(--ftp-text-2)" }} />}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32,
    padding: "0 10px 0 4px", borderRadius: "var(--ftp-radius-pill)",
    border: "1px solid var(--ftp-border)", background: "var(--ftp-surface)",
    textDecoration: "none", color: "inherit",
  };

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} style={style}>{inner}</a>
  ) : (
    <span title={title} style={style}>{inner}</span>
  );
}

function Line({
  label,
  sponsors,
  viewAllHref,
  emptyCta,
}: {
  label: string;
  sponsors: StateSponsor[];
  viewAllHref: string;
  emptyCta?: { text: string; href: string };
}) {
  const visible = sponsors.slice(0, CHIPS_PER_LINE);
  const hiddenCount = sponsors.length - visible.length;

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", padding: "6px 0" }}>
      <span className="ftp-label" style={{ width: 150, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
        {visible.length > 0
          ? visible.map((s) => <Chip key={s.id} s={s} />)
          : emptyCta && (
              <Link href={emptyCta.href} style={{ fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none", minHeight: 32, display: "inline-flex", alignItems: "center" }}>
                {emptyCta.text}
              </Link>
            )}
        {hiddenCount > 0 && (
          <Link href={viewAllHref} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 32, display: "inline-flex", alignItems: "center" }}>
            +<span className="ftp-num">{hiddenCount}</span>&nbsp;more
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
  const supportHref = `/${locale}/support?tier=state&state=${stateSlug}`;

  return (
    <Card as="section" aria-labelledby="ftp-state-backed-by">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <h2 id="ftp-state-backed-by" className="ftp-title">Backed by</h2>
        <Link href={`/${locale}/contributors`} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          View all
        </Link>
      </div>

      <Line
        label="All India"
        sponsors={indiaLine}
        viewAllHref={`/${locale}/contributors`}
        emptyCta={{ text: `Be the first — ${inr(TIER_CONFIG.patron.amount)}/mo`, href: `/${locale}/support?tier=patron` }}
      />
      <Line
        label={`${stateName} champions`}
        sponsors={stateLine}
        viewAllHref={`/${locale}/contributors`}
        emptyCta={{ text: `Be the first ${stateName} Champion — ${inr(TIER_CONFIG.state.amount)}/mo`, href: supportHref }}
      />

      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ftp-border)" }}>
        <Link
          href={supportHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, fontWeight: 500, color: "var(--ftp-support)", textDecoration: "none" }}
        >
          <HandHeart size={16} aria-hidden />
          Sponsor {stateName} — {inr(TIER_CONFIG.state.amount)}/mo
        </Link>
      </div>
    </Card>
  );
}
