/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  StateSponsorSection — "Backed by" block on a state page (Design v4).
//  Two rows (All India, <State> champions) of supporter names, wrapping
//  instead of side-scrolling, plus one sponsor link. Same
//  /api/data/contributors request as before; prices come from TIER_CONFIG.
//  Colours come from the page hue — the state page wraps this block in
//  the support colour (.ftp-hue-rose).
//  Text: "page_state" messages; supporter badges from "page_site.tier";
//  supporter names are shown as entered.
// ═══════════════════════════════════════════════════════════

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import { normalizeSocialLink } from "@/lib/social-link";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { Card } from "@/components/district/ui";
import { useFormat, usePlaceText } from "@/i18n/client";
import { tierLabel } from "@/components/site/tier-label";

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
  /** English registry name (used in the support link and as the fallback). */
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

const HUE_LINK: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--hue-deep)",
  textDecoration: "none",
  minHeight: 32,
  display: "inline-flex",
  alignItems: "center",
};

function Chip({ s }: { s: StateSponsor }) {
  const t = useTranslations("page_state");
  const ts = useTranslations("page_site");
  const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
  const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = tierLabel(ts, s.tier, s.districtName, s.stateName);
  const title = s.monthsActive
    ? t("sponsorTitleMonths", { name: s.name, label, months: s.monthsActive })
    : t("sponsorTitle", { name: s.name, label });
  const href = normalizeSocialLink(s.socialLink);

  const inner = (
    <>
      <span
        aria-hidden
        className="ftp-num"
        style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "var(--hue-tint)", color: "var(--hue-deep)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", whiteSpace: "nowrap" }}>{s.name}</span>
      {SocialIcon && <SocialIcon size={11} aria-hidden style={{ color: "var(--hue)" }} />}
    </>
  );

  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32,
    padding: "0 10px 0 4px", borderRadius: "var(--ftp-radius-pill)",
    border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))", background: "var(--ftp-surface)",
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
  emoji,
  sponsors,
  viewAllHref,
  emptyCta,
}: {
  label: string;
  emoji: string;
  sponsors: StateSponsor[];
  viewAllHref: string;
  emptyCta?: { text: string; href: string };
}) {
  const t = useTranslations("page_state");
  const visible = sponsors.slice(0, CHIPS_PER_LINE);
  const hiddenCount = sponsors.length - visible.length;

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", padding: "6px 0" }}>
      <span className="ftp-label" style={{ minWidth: 150, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span className="ftp-emoji" aria-hidden>{emoji}</span>
        {label}
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
        {visible.length > 0
          ? visible.map((s) => <Chip key={s.id} s={s} />)
          : emptyCta && (
              <Link href={emptyCta.href} style={{ ...HUE_LINK, fontWeight: 500, color: "var(--ftp-text-2)" }}>
                {emptyCta.text}
              </Link>
            )}
        {hiddenCount > 0 && (
          <Link href={viewAllHref} style={HUE_LINK}>
            <span className="ftp-num">{t("more", { n: hiddenCount })}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StateSponsorSection({ locale, stateSlug, stateName }: Props) {
  const t = useTranslations("page_state");
  const { number } = useFormat();
  const place = usePlaceText();
  const shownState = place.state(stateSlug, stateName);
  const inr = (n: number) => `₹${number(n)}`;
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
    <Card as="section" tinted aria-labelledby="ftp-state-backed-by">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            💖
          </span>
          <h2 id="ftp-state-backed-by" className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
            {t("backedBy")}
          </h2>
        </div>
        <Link href={`/${locale}/contributors`} style={{ ...HUE_LINK, minHeight: 44 }}>
          {t("viewAll")}
        </Link>
      </div>

      <Line
        label={t("allIndia")}
        emoji="🇮🇳"
        sponsors={indiaLine}
        viewAllHref={`/${locale}/contributors`}
        emptyCta={{ text: t("beFirstPatron", { amount: inr(TIER_CONFIG.patron.amount) }), href: `/${locale}/support?tier=patron` }}
      />
      <Line
        label={t("stateChampions", { state: shownState })}
        emoji="🏅"
        sponsors={stateLine}
        viewAllHref={`/${locale}/contributors`}
        emptyCta={{ text: t("beFirstState", { state: shownState, amount: inr(TIER_CONFIG.state.amount) }), href: supportHref }}
      />

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))" }}>
        <Link
          href={supportHref}
          className="ftp-btn ftp-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 40,
            padding: "0 16px",
            borderRadius: "var(--ftp-radius-tile)",
            border: "1px solid var(--hue)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <span className="ftp-emoji" aria-hidden>🤝</span>
          {t("sponsorState", { state: shownState, amount: inr(TIER_CONFIG.state.amount) })}
        </Link>
      </div>
    </Card>
  );
}
