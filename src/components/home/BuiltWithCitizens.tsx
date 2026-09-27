/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  BuiltWithCitizens — supporters + what citizens voted for (home page)
// ═══════════════════════════════════════════════════════════════════════
//
//    Built with citizens
//    ┌ Backed by 42 citizens ───────────────┐ ┌ Top voted features ───────┐
//    │ [India · Asha R] [Karnataka · Vikram] │ │ [128] Water tanker alerts │
//    │ [Mandya · Priya] [Anonymous ×6] …     │ │ [ 97] Ration shop stock   │
//    │ View all & how to join →              │ │ [ 64] Bus timings         │
//    └───────────────────────────────────────┘ │ Share an idea · View all →│
//                                              └───────────────────────────┘
//
//  Supporters: GET /api/payment/contributors?limit=200 (unchanged rules
//  from the v2 ContributorsStrip):
//    - "Backed by N" counts everyone, one-time supporters included.
//    - Pills show ACTIVE monthly supporters only (plus the founder), in
//      the order India → state → district, each prefixed with its place.
//    - Everyone who chose not to show their name is grouped into one
//      "Anonymous ×N" pill instead of N identical pills.
//    - A pill links out only when the supporter gave a safe http(s) link.
//
//  Features: GET /api/features — the top 3 by votes, vote counts in mono.
//  "Share an idea" opens the existing SuggestionForm (POST /api/suggestions).
//
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Lightbulb } from "lucide-react";
import { Card, Section } from "@/components/district/ui";
import SuggestionForm from "@/components/features/SuggestionForm";
import { STATE_FULL_NAMES } from "@/lib/data/district-meta";
import styles from "./home.module.css";

// ── Supporters ──

interface ContributorItem {
  displayName: string;
  tierLabel: string;
  tier: string | null;
  socialLink?: string | null;
  socialPlatform?: string | null;
  districtName?: string | null;
  stateName?: string | null;
  isRecurring?: boolean;
  subscriptionStatus?: string | null;
}

type SupTier = "founder" | "all-india" | "state" | "district" | "one-time";

const TIER_ORDER: Record<SupTier, number> = { founder: 0, "all-india": 1, state: 2, district: 3, "one-time": 4 };

/** How many named pills to show before "+N more". */
const MAX_PILLS = 30;

function classifyTier(c: ContributorItem): SupTier {
  const label = `${c.tierLabel ?? ""} ${c.tier ?? ""}`.toLowerCase();
  if (label.includes("found")) return "founder";
  if (label.includes("all-india") || label.includes("patron")) return "all-india";
  if (label.includes("state")) return "state";
  if (label.includes("district") || label.includes("monthly")) return "district";
  return "one-time";
}

/** Only http(s) links (or an @handle → Instagram) are ever rendered. */
function safeExternalLink(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  return null;
}

/** The place a supporter backs: "India", a state or a district. */
function placeFor(c: ContributorItem, tier: SupTier): string {
  if (tier === "founder" || tier === "all-india") return "India";
  if (tier === "state") return c.stateName || STATE_FULL_NAMES[(c.stateName ?? "").toUpperCase()] || "";
  if (tier === "district") return c.districtName ?? "";
  return "";
}

/** Homepage pills show active subscribers only; founders always. */
function isActiveSubscriber(c: ContributorItem, tier: SupTier): boolean {
  if (tier === "founder") return true;
  return c.isRecurring === true && c.subscriptionStatus === "active";
}

function SupporterPill({ c }: { c: ContributorItem }) {
  const tier = classifyTier(c);
  const place = placeFor(c, tier);
  const link = safeExternalLink(c.socialLink);
  const inner = (
    <>
      {place && <span className={styles.supPlace}>{place} ·</span>}
      <span>{c.displayName}</span>
      {link && <ExternalLink size={11} aria-hidden />}
    </>
  );
  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.supPill} ${styles.supPillLink}`}
        title={c.socialPlatform ? `${c.displayName} on ${c.socialPlatform}` : c.displayName}
      >
        {inner}
      </a>
    );
  }
  return <span className={styles.supPill}>{inner}</span>;
}

// ── Features ──

interface FeatureRow {
  id: string;
  title: string;
  votes: number;
}

export default function BuiltWithCitizens({ locale }: { locale: string }) {
  const [contributors, setContributors] = useState<ContributorItem[] | null>(null);
  const [features, setFeatures] = useState<FeatureRow[] | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shared, setShared] = useState(false);

  // Both lists load once on mount; failures become empty lists.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/payment/contributors?limit=200")
      .then((r) => (r.ok ? r.json() : { contributors: [] }))
      .then((d: { contributors?: ContributorItem[] }) => {
        if (!cancelled) setContributors(d.contributors ?? []);
      })
      .catch(() => {
        if (!cancelled) setContributors([]);
      });
    fetch("/api/features")
      .then((r) => (r.ok ? r.json() : { features: [] }))
      .then((d: { features?: FeatureRow[] }) => {
        if (!cancelled) setFeatures(d.features ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Named active supporters (India → state → district) + one anonymous count.
  const shown = (contributors ?? [])
    .map((c) => ({ c, tier: classifyTier(c) }))
    .filter(({ c, tier }) => isActiveSubscriber(c, tier))
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  const named = shown.filter(({ c }) => c.displayName.trim().toLowerCase() !== "anonymous");
  const anonymousCount = shown.length - named.length;
  const total = contributors?.length ?? 0;

  const totalVotes = (features ?? []).reduce((s, f) => s + (f.votes ?? 0), 0);
  const top3 = (features ?? []).slice(0, 3);

  return (
    <div className="ftp-container">
      <Section id="community" title="Built with citizens" emoji="🤝">
        <div className={styles.communityGrid}>
          {/* ── Supporters ── */}
          <Card as="section" aria-labelledby="home-supporters" className={`${styles.communityMain} ftp-hue-pink`} tinted>
            <h3 id="home-supporters" className="ftp-title">
              {contributors === null ? (
                "Loading supporters…"
              ) : total === 0 ? (
                "Be the first to back this project"
              ) : (
                <>
                  Backed by <span className="ftp-num">{total.toLocaleString("en-IN")}</span>{" "}
                  {total === 1 ? "citizen" : "citizens"}
                </>
              )}
            </h3>
            <p className={styles.communityNote}>No corporate funding. No ads. Citizens backing citizens.</p>
            {(named.length > 0 || anonymousCount > 0) && (
              <div className={styles.supList}>
                {named.slice(0, MAX_PILLS).map(({ c }, i) => (
                  <SupporterPill key={`${c.displayName}-${i}`} c={c} />
                ))}
                {anonymousCount > 0 && (
                  <span className={styles.supPill} title="Supporters who chose not to show their name">
                    Anonymous <span className="ftp-num">×{anonymousCount}</span>
                  </span>
                )}
                {named.length > MAX_PILLS && (
                  <Link href={`/${locale}/contributors`} className={styles.supPill}>
                    + <span className="ftp-num">{named.length - MAX_PILLS}</span> more
                  </Link>
                )}
              </div>
            )}
            <div className={styles.communityLinks}>
              <Link href={`/${locale}/contributors`} className={styles.inlineLink}>
                View all and how to join
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link href={`/${locale}/support?tier=district`} className={styles.inlineLink}>
                Sponsor a district
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </Card>

          {/* ── What citizens voted for ── */}
          <Card as="section" aria-labelledby="home-top-features" className={`${styles.communitySide} ftp-hue-violet`} tinted>
            <h3 id="home-top-features" className="ftp-title">
              Top voted features
            </h3>
            <p className={styles.communityNote}>
              {features === null ? (
                "Loading…"
              ) : (
                <>
                  <span className="ftp-num">{totalVotes.toLocaleString("en-IN")}</span> {totalVotes === 1 ? "vote" : "votes"} ·{" "}
                  <span className="ftp-num">{(features ?? []).length.toLocaleString("en-IN")}</span>{" "}
                  {(features ?? []).length === 1 ? "idea" : "ideas"}
                </>
              )}
            </p>
            {top3.length > 0 ? (
              <ol className={styles.voteList}>
                {top3.map((f, i) => (
                  <li key={f.id}>
                    <Link href={`/${locale}/features`} className={styles.voteRow}>
                      <span className={`${styles.voteMedal} ftp-emoji`} aria-hidden>
                        {["🥇", "🥈", "🥉"][i] ?? "⭐"}
                      </span>
                      <span className={`ftp-num ${styles.voteCount}`} aria-label={`${f.votes} votes`}>
                        {f.votes.toLocaleString("en-IN")}
                      </span>
                      <span className={styles.voteTitle}>{f.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              features !== null && <p className={styles.communityNote}>No ideas yet. Be the first.</p>
            )}

            {shared ? (
              <p className={styles.communityNote} role="status">
                Thanks. Your idea has been received.
              </p>
            ) : shareOpen ? (
              <div className={styles.shareForm}>
                <div className={styles.shareHead}>
                  <span className="ftp-title">Share your idea</span>
                  <button type="button" className={styles.button} onClick={() => setShareOpen(false)}>
                    Cancel
                  </button>
                </div>
                <SuggestionForm
                  onSuccess={() => {
                    setShared(true);
                    setShareOpen(false);
                  }}
                />
              </div>
            ) : null}

            <div className={styles.communityLinks}>
              {!shareOpen && !shared && (
                <button type="button" className={styles.button} onClick={() => setShareOpen(true)} aria-expanded={false}>
                  <Lightbulb size={16} aria-hidden />
                  Share an idea
                </button>
              )}
              <Link href={`/${locale}/features`} className={styles.inlineLink}>
                View all features
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
