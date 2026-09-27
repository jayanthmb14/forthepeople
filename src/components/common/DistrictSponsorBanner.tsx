/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  DistrictSponsorBanner — "Backed by" block at the end of the district
//  overview (Design v3, CONCEPT-v3 §5 step 4).
// ═══════════════════════════════════════════════════════════
//
//  Three quiet rows — All India · <State> · <District> — each listing the
//  people who support that level with a monthly contribution. When a row
//  is empty it shows a plain link inviting the first supporter.
//
//  v2 scrolled these rows sideways like a ticker. Design v3 allows no
//  decorative motion, so rows now simply wrap and show the first few
//  names, with "View all" linking to the contributors page.
//
//  Data: the same /api/data/contributors request as before (recurring
//  supporters only). Prices come from TIER_CONFIG, never typed by hand.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, HandHeart, Instagram, Linkedin, Twitter } from "lucide-react";
import { getContributorLabel } from "@/lib/contributor-label";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { normalizeSocialLink } from "@/lib/social-link";
import { Card } from "@/components/district/ui";

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

/** How many names to show per row before "View all". */
const MAX_PER_ROW = 8;

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** One supporter: initials circle + name (+ social icon when linked). */
function Chip({ s }: { s: Sponsor }) {
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
  const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = getContributorLabel(s.tier, s.districtName, s.stateName);
  const title = `${s.name} · ${label}${s.monthsActive ? ` · ${s.monthsActive}mo` : ""}${s.message ? `\n"${s.message}"` : ""}`;
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
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} style={style}>
      {inner}
    </a>
  ) : (
    <span title={title} style={style}>{inner}</span>
  );
}

/** One level (India / state / district): label on the left, names wrapping on the right. */
function Row({
  label,
  sponsors,
  emptyCta,
  viewAllHref,
}: {
  label: string;
  sponsors: Sponsor[];
  emptyCta: { text: string; href: string };
  viewAllHref: string;
}) {
  const shown = sponsors.slice(0, MAX_PER_ROW);
  const more = sponsors.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", padding: "6px 0" }}>
      <span className="ftp-label" style={{ width: 120, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0 }}>
        {sponsors.length === 0 ? (
          <Link href={emptyCta.href} style={{ fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none", minHeight: 32, display: "inline-flex", alignItems: "center" }}>
            {emptyCta.text}
          </Link>
        ) : (
          <>
            {shown.map((s) => (
              <Chip key={s.id} s={s} />
            ))}
            {more > 0 && (
              <Link href={viewAllHref} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 32, display: "inline-flex", alignItems: "center" }}>
                +<span className="ftp-num">{more}</span>&nbsp;more
              </Link>
            )}
          </>
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
    <Card as="section" aria-labelledby="ftp-backed-by" className="ftp-supported-by-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <h2 id="ftp-backed-by" className="ftp-title">Backed by</h2>
        <Link href={viewAllHref} style={{ fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          View all
        </Link>
      </div>

      <Row
        label="All India"
        sponsors={indiaLine}
        viewAllHref={viewAllHref}
        emptyCta={{ text: `Be the first — ${inr(TIER_CONFIG.patron.amount)}/mo`, href: `/${locale}/support?tier=patron` }}
      />
      <Row
        label={sName}
        sponsors={stateLine}
        viewAllHref={viewAllHref}
        emptyCta={{ text: `Sponsor ${sName} — ${inr(TIER_CONFIG.state.amount)}/mo`, href: `/${locale}/support?tier=state&state=${state}` }}
      />
      <Row
        label={dName}
        sponsors={districtLine}
        viewAllHref={viewAllHref}
        emptyCta={{ text: `Champion ${dName} — ${inr(TIER_CONFIG.district.amount)}/mo`, href: supportHref }}
      />

      {/* Sponsor call to action — a quiet link, not a banner. */}
      <div
        style={{
          marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ftp-border)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}
      >
        <Link
          href={supportHref}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, fontWeight: 500, color: "var(--ftp-support)", textDecoration: "none" }}
        >
          <HandHeart size={16} aria-hidden />
          Sponsor {dName} — {inr(TIER_CONFIG.district.amount)}/mo
        </Link>
        <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          or: {sName} {inr(TIER_CONFIG.state.amount)}/mo · All India {inr(TIER_CONFIG.patron.amount)}/mo
        </span>
      </div>
    </Card>
  );
}
