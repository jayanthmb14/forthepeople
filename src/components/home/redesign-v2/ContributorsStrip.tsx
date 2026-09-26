/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 15 v9 Phase H (Fixes #10, #11, #12) — three categorized
 * supporter sections with threshold-based marquee.
 *
 * Layout:
 *   🇮🇳 India Patrons    (founder + all-india)   marquee speed 120s
 *   🏛️ State Champions   (state)                  marquee speed 80s
 *   ⌂  District Sponsors (district + one-time)   marquee speed 50s
 *
 * If a category has ≤ STATIC_THRESHOLD pills, it renders as a static
 * wrap list (no animation). If more, it falls back to a horizontally-
 * scrolling marquee at the per-category speed. Reduced-motion freezes
 * everything into a wrapped list.
 *
 * Pill format is natural language: "Name — Karnataka", "Name — Mandya",
 * "Name — 🇮🇳 India". Full state/district names from the existing
 * Supporter FK relations (sponsoredState / sponsoredDistrict), surfaced
 * by the v5 /api/payment/contributors endpoint.
 *
 * Pills are clickable when contributor.socialLink exists.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Linkedin, Github, Instagram, Twitter, Globe } from "lucide-react";
import { STATE_FULL_NAMES } from "@/lib/data/district-meta";

interface ContributorItem {
  displayName: string;
  tierLabel: string;
  tier: string | null;
  message: string | null;
  timeAgo: string;
  socialLink?: string | null;
  socialPlatform?: string | null;
  districtName?: string | null;
  stateName?: string | null;
  isRecurring?: boolean;
  subscriptionStatus?: string | null;
}

type SupTier = "founder" | "all-india" | "state" | "district" | "one-time";

const STATIC_THRESHOLD = 6;

function classifyTier(c: ContributorItem): SupTier {
  const label = `${c.tierLabel ?? ""} ${c.tier ?? ""}`.toLowerCase();
  if (label.includes("found")) return "founder";
  if (label.includes("all-india") || label.includes("patron")) return "all-india";
  if (label.includes("state")) return "state";
  if (label.includes("district") || label.includes("monthly")) return "district";
  return "one-time";
}

function safeExternalLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  return null;
}

function badgeFor(c: ContributorItem, tier: SupTier): string {
  // Session 16 v10 Phase I (Fix #10): founder also reads "🇮🇳 India" so
  // the visual hierarchy stays consistent with the All-India tier above.
  if (tier === "founder") return "🇮🇳 India";
  if (tier === "all-india") return "🇮🇳 India";
  if (tier === "state") {
    if (c.stateName) return c.stateName;
    const upper = (c.stateName ?? "").toUpperCase();
    return STATE_FULL_NAMES[upper] ?? "";
  }
  if (tier === "district") return c.districtName ?? "";
  return "";
}

// Session 16 v10 Phase I (Fix #10b): only count active subscriptions in the
// homepage strip. One-time supporters appear only on /contributors.
// Founders are kept (they're treated as patrons regardless of cadence).
function isActiveSubscriber(c: ContributorItem, tier: SupTier): boolean {
  if (tier === "founder") return true;
  return c.isRecurring === true && c.subscriptionStatus === "active";
}

// Session M1 Phase G: surface a small platform icon on linked pills so
// users can see at-a-glance whether the supporter has a LinkedIn/GitHub/
// Instagram/Twitter/website. Falls back to Globe for unknown platforms.
function getSocialIcon(platform: string | null | undefined) {
  switch ((platform || "").toLowerCase()) {
    case "linkedin": return Linkedin;
    case "github":   return Github;
    case "instagram": return Instagram;
    case "twitter":
    case "x":         return Twitter;
    case "website":
    default:          return Globe;
  }
}

function SupporterPill({ contributor }: { contributor: ContributorItem }) {
  const tier = classifyTier(contributor);
  const link = safeExternalLink(contributor.socialLink);
  const badge = badgeFor(contributor, tier);
  const className = `ftp-sup-pill ftp-sup-${tier}${link ? " ftp-sup-link" : ""}`;
  const PlatformIcon = link ? getSocialIcon(contributor.socialPlatform) : null;

  const inner = (
    <>
      <span className="ftp-sup-name">{contributor.displayName}</span>
      {badge && <span className="ftp-sup-badge-text">— {badge}</span>}
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ftp-sup-pill-clickable`}
        title={contributor.socialPlatform ? `${contributor.displayName} on ${contributor.socialPlatform}` : contributor.displayName}
      >
        {inner}
        {PlatformIcon && (
          <PlatformIcon
            size={11}
            className="ftp-sup-platform-icon"
            aria-hidden="true"
          />
        )}
        <span className="ftp-sup-link-icon" aria-hidden="true">↗</span>
      </a>
    );
  }
  return <span className={className}>{inner}</span>;
}

function CategorySection({
  title,
  supporters,
  marqueeSpeed,
  accent,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  supporters: ContributorItem[];
  marqueeSpeed: string;
  accent: "india" | "state" | "district";
  ctaHref?: string;
  ctaLabel?: string;
}) {
  if (supporters.length === 0) return null;
  const isStatic = supporters.length <= STATIC_THRESHOLD;
  // Session 19.4 Phase E: trailing "Be the next sponsor" CTA fills the empty
  // tail of the static list. Only renders for the static layout — adding it to
  // the marquee duplicate-track would render twice and look broken.
  const cta =
    ctaHref && ctaLabel ? (
      <a href={ctaHref} className="ftp-sup-pill ftp-sup-pill-cta">
        {ctaLabel}
      </a>
    ) : null;
  return (
    <div className={`ftp-supporter-category ftp-cat-${accent}`}>
      <div className="ftp-supporter-category-header">
        <span className="ftp-supporter-category-title">{title}</span>
        <span className="ftp-supporter-category-count">{supporters.length}</span>
      </div>

      {isStatic ? (
        <div className="ftp-supporter-static-list">
          {supporters.map((s, i) => (
            <SupporterPill key={i} contributor={s} />
          ))}
          {cta}
        </div>
      ) : (
        <div className="ftp-supporter-marquee-viewport">
          <div
            className="ftp-supporter-marquee-track"
            style={{ animationDuration: marqueeSpeed }}
          >
            {supporters.map((s, i) => (
              <SupporterPill key={`a-${i}`} contributor={s} />
            ))}
            {supporters.map((s, i) => (
              <SupporterPill key={`b-${i}`} contributor={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface ContributorsStripProps {
  locale: string;
  /** Session 18 v12 Phase I: when rendered inside CommunitySection's 50% column,
   *  use a denser layout — smaller H2, "View all" inline with header (no bottom CTA),
   *  reduced spacing so the section fits next to VoteFeaturesCTA. */
  compact?: boolean;
}

export default function ContributorsStrip({ locale, compact = false }: ContributorsStripProps) {
  const [contributors, setContributors] = useState<ContributorItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/payment/contributors?limit=200");
        if (!res.ok) {
          if (!cancelled) setContributors([]);
          return;
        }
        const data = (await res.json()) as { contributors?: ContributorItem[] };
        if (cancelled) return;
        setContributors(data.contributors ?? []);
      } catch {
        if (!cancelled) setContributors([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const buckets = (() => {
    if (!contributors) return null;
    const allIndia: ContributorItem[] = [];
    const states: ContributorItem[] = [];
    const districts: ContributorItem[] = [];
    for (const c of contributors) {
      const t = classifyTier(c);
      // Phase I Fix #10b: subscribers only on the homepage strip.
      if (!isActiveSubscriber(c, t)) continue;
      if (t === "founder" || t === "all-india") allIndia.push(c);
      else if (t === "state") states.push(c);
      else if (t === "district") districts.push(c);
      // one-time tier intentionally dropped from the strip (visible on /contributors).
    }
    return { allIndia, states, districts };
  })();

  // "Backed by N citizens" still reflects the full count (one-timers included),
  // since Jayanth's spec only restricted what's *displayed in the categories*.
  const total = contributors?.length ?? 0;

  return (
    <section
      aria-labelledby="supporters-heading"
      className="ftp-section-wrap ftp-supporters-wrap"
      style={{ borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        .ftp-supporters-header {
          margin-bottom: 24px;
        }
        /* Session 17 v11 Phase G (Fix #7): gradient h2 + motto pill */
        .ftp-supporters-h2 {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #1E40AF 0%, #5B21B6 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
          display: inline-block;
        }
        /* Session 19.3 Phase D: opt the trophy emoji out of the gradient
           text-clip so it renders in full colour, not as transparent text. */
        .ftp-supporters-trophy {
          background: none;
          -webkit-text-fill-color: initial;
          color: initial;
          margin-right: 8px;
          font-weight: normal;
        }
        .ftp-supporters-sub {
          font-size: 13px;
          color: #6B7280;
          margin: 0 0 8px;
        }
        .ftp-supporters-motto {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FEF3C7;
          color: #92400E;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        /* Session 17 v11 Phase G (Fix #7): subtle gradient container + per-category accent bar */
        .ftp-supporters-categories {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: linear-gradient(135deg, #FAFAF8 0%, #F4F3FE 100%);
          border: 1px solid #E5E7EB;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .ftp-supporter-category {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 14px 18px;
          position: relative;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .ftp-supporter-category::before {
          content: "";
          position: absolute;
          left: 0; top: 14px; bottom: 14px;
          width: 3px;
          background: var(--cat-accent, #2563EB);
          border-radius: 0 2px 2px 0;
        }
        .ftp-supporter-category:hover {
          border-color: var(--cat-accent, #2563EB);
          box-shadow: 0 4px 12px var(--cat-shadow, rgba(37, 99, 235, 0.06));
        }
        /* Session 19 v13 Phase H: tier color audit (saffron / indigo / teal) */
        .ftp-cat-india    { --cat-accent: var(--ftp-color-tier-india);    --cat-shadow: rgba(251, 146, 60, 0.10); }
        .ftp-cat-state    { --cat-accent: var(--ftp-color-tier-state);    --cat-shadow: rgba(79, 70, 229, 0.10); }
        .ftp-cat-district { --cat-accent: var(--ftp-color-tier-district); --cat-shadow: rgba(13, 148, 136, 0.10); }
        .ftp-supporter-category-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #1A1A1A;
        }
        .ftp-supporter-category-title { display: inline-flex; align-items: center; gap: 6px; }
        .ftp-supporter-category-count {
          background: #F3F4F6;
          color: #6B7280;
          font-size: 11px;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 10px;
          font-variant-numeric: tabular-nums;
        }

        /* Static list — wraps naturally */
        .ftp-supporter-static-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Marquee — single-line scroll */
        .ftp-supporter-marquee-viewport {
          overflow: hidden;
          position: relative;
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .ftp-supporter-marquee-track {
          display: inline-flex;
          gap: 8px;
          white-space: nowrap;
          animation-name: ftp-supporters-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          padding: 4px 0;
        }
        .ftp-supporter-marquee-track:hover { animation-play-state: paused; }

        .ftp-supporters-cta {
          display: inline-block;
          font-size: 13px;
          color: #2563EB;
          font-weight: 500;
          text-decoration: none;
        }
        .ftp-supporters-cta:hover { text-decoration: underline; }

        /* Session 18 v12 Phase I: compact mode (used by CommunitySection) */
        .ftp-supporters-header-compact {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .ftp-supporters-h2-compact {
          font-size: 18px;
          margin-bottom: 0;
        }
        .ftp-supporters-cta-inline {
          font-size: 12px;
          color: #2563EB;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .ftp-supporters-cta-inline:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Session M1 Phase G: small platform icon (LinkedIn/GitHub/Instagram/
           Twitter/Globe) sits between name and the ↗ external-link arrow. */
        .ftp-sup-platform-icon {
          margin-left: 4px;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .ftp-sup-pill-clickable:hover .ftp-sup-platform-icon { opacity: 1; }

        /* Pills */
        .ftp-sup-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 0.5px solid;
          flex-shrink: 0;
          text-decoration: none;
          color: inherit;
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        /* Session 19.4 Phase E: trailing "Be the next sponsor" CTA pill —
           dashed border + tier-accent colour signals "open slot, click to fill". */
        .ftp-sup-pill-cta {
          background: transparent;
          border: 1px dashed var(--cat-accent, #2563EB);
          color: var(--cat-accent, #2563EB);
          font-style: italic;
          font-weight: 500;
          cursor: pointer;
        }
        .ftp-sup-pill-cta:hover {
          background: var(--cat-shadow, rgba(37, 99, 235, 0.08));
          border-style: solid;
          transform: translateY(-1px);
        }
        /* Session 18 v12 Phase H (Fix #8): visible link cue + clearer hover */
        .ftp-sup-link,
        .ftp-sup-pill-clickable { cursor: pointer; }
        .ftp-sup-link:hover,
        .ftp-sup-pill-clickable:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
          border-width: 1.5px;
        }
        .ftp-sup-link-icon {
          font-size: 9px;
          opacity: 0.55;
          margin-left: 2px;
          transition: opacity 150ms ease, transform 150ms ease;
          flex-shrink: 0;
        }
        .ftp-sup-pill-clickable:hover .ftp-sup-link-icon {
          opacity: 1;
          transform: translate(2px, -2px);
        }
        .ftp-sup-name { font-weight: 600; white-space: nowrap; }
        .ftp-sup-badge-text {
          font-size: 11px;
          font-weight: 400;
          opacity: 0.85;
          white-space: nowrap;
        }

        /* Session 19 v13 Phase H: supporter tier color audit.
           - India tier  → SAFFRON (was yellow that conflicted with NEW-yellow)
           - State tier  → INDIGO  (was features-purple — broke discipline)
           - District tier → TEAL  (was live-green — broke discipline) */
        .ftp-sup-founder,
        .ftp-sup-all-india {
          background: var(--ftp-color-tier-india-bg);
          color: #9A3412;
          border-color: var(--ftp-color-tier-india-border);
        }
        .ftp-sup-state {
          background: var(--ftp-color-tier-state-bg);
          color: #312E81;
          border-color: var(--ftp-color-tier-state-border);
        }
        .ftp-sup-district {
          background: var(--ftp-color-tier-district-bg);
          color: #134E4A;
          border-color: var(--ftp-color-tier-district-border);
        }
        .ftp-sup-one-time { background: #F3F4F6; color: #4B5563; border-color: #E5E7EB; }

        @keyframes ftp-supporters-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        /* Session 16 v10 Phase L (Fix #13): tighten on mobile */
        @media (max-width: 767px) {
          .ftp-supporters-categories {
            padding: 14px;
            gap: 12px;
          }
          .ftp-supporter-category { padding: 12px; }
          .ftp-supporters-h2 { font-size: 18px; }
          .ftp-supporter-marquee-track {
            animation: none;
            flex-wrap: wrap;
            white-space: normal;
          }
          .ftp-supporter-marquee-viewport {
            -webkit-mask-image: none;
            mask-image: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-supporter-marquee-track {
            animation: none;
            flex-wrap: wrap;
            white-space: normal;
          }
          .ftp-supporter-marquee-viewport { -webkit-mask-image: none; mask-image: none; }
          .ftp-sup-link:hover,
          .ftp-sup-pill-clickable:hover { transform: none; box-shadow: none; }
          .ftp-sup-link-icon { transition: none; }
          .ftp-sup-pill-clickable:hover .ftp-sup-link-icon { transform: none; }
        }
      `}</style>

      <div className="ftp-section-inner">
        {compact ? (
          <div className="ftp-supporters-header-compact">
            <h2 id="supporters-heading" className="ftp-supporters-h2 ftp-supporters-h2-compact">
              {contributors === null ? (
                "Loading supporters…"
              ) : total === 0 ? (
                "Be the first to back us"
              ) : (
                <>
                  <span className="ftp-supporters-trophy" aria-hidden="true">🏆</span>
                  Backed by {total} citizen{total === 1 ? "" : "s"}
                </>
              )}
            </h2>
            <Link href={`/${locale}/contributors`} className="ftp-supporters-cta-inline">
              View all &amp; how to join →
            </Link>
          </div>
        ) : (
          <div className="ftp-supporters-header">
            <h2 id="supporters-heading" className="ftp-supporters-h2">
              {contributors === null ? (
                "Loading supporters…"
              ) : total === 0 ? (
                "Be the first to back us"
              ) : (
                <>
                  <span className="ftp-supporters-trophy" aria-hidden="true">🏆</span>
                  Backed by {total} citizen{total === 1 ? "" : "s"}
                </>
              )}
            </h2>
            <p className="ftp-supporters-sub">
              No corporate funding. No ads. Just citizens backing citizens.
            </p>
            <div className="ftp-supporters-motto">
              <span aria-hidden="true">✨</span>
              100% citizen-funded · Open source · Forever free
            </div>
          </div>
        )}

        {buckets && total > 0 && (
          <div className="ftp-supporters-categories">
            <CategorySection
              title="🇮🇳 India Patrons"
              supporters={buckets.allIndia}
              marqueeSpeed="120s"
              accent="india"
              ctaHref={`/${locale}/support?tier=patron`}
              ctaLabel="+ Become an India Patron →"
            />
            <CategorySection
              title="🏛️ State Champions"
              supporters={buckets.states}
              marqueeSpeed="80s"
              accent="state"
              ctaHref={`/${locale}/support?tier=state`}
              ctaLabel="+ Sponsor a state →"
            />
            <CategorySection
              title="⌂ District Sponsors"
              supporters={buckets.districts}
              marqueeSpeed="50s"
              accent="district"
              ctaHref={`/${locale}/support?tier=district`}
              ctaLabel="+ Be the next sponsor →"
            />
          </div>
        )}

        {!compact && (
          <Link href={`/${locale}/contributors`} className="ftp-supporters-cta">
            View all supporters &amp; how to join →
          </Link>
        )}
      </div>
    </section>
  );
}
