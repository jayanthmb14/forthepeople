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

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Lightbulb } from "lucide-react";
import { Card, Section } from "@/components/district/ui";
import SuggestionForm from "@/components/features/SuggestionForm";
import { STATE_FULL_NAMES } from "@/lib/data/district-meta";
import { INDIA_STATES } from "@/lib/constants/districts";
import { usePlaceText } from "@/i18n/client";
import { placeName } from "@/i18n/place-name";
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

/** The place a supporter backs (English, as stored): "India", a state or a district. */
function placeFor(c: ContributorItem, tier: SupTier): string {
  if (tier === "founder" || tier === "all-india") return "India";
  if (tier === "state") return c.stateName || STATE_FULL_NAMES[(c.stateName ?? "").toUpperCase()] || "";
  if (tier === "district") return c.districtName ?? "";
  return "";
}

/** A registry district matched by its English name, for its name in the page language. */
function districtByName(name: string) {
  const key = name.trim().toLowerCase();
  for (const s of INDIA_STATES) {
    const d = s.districts.find((x) => x.name.toLowerCase() === key);
    if (d) return d;
  }
  return undefined;
}

/** Homepage pills show active subscribers only; founders always. */
function isActiveSubscriber(c: ContributorItem, tier: SupTier): boolean {
  if (tier === "founder") return true;
  return c.isRecurring === true && c.subscriptionStatus === "active";
}

function SupporterPill({ c }: { c: ContributorItem }) {
  const locale = useLocale();
  const tb = useTranslations("breadcrumb");
  const tp = useTranslations("page_home");
  const places = usePlaceText();
  const tier = classifyTier(c);
  const raw = placeFor(c, tier);
  // The place in the page language: भारत / कर्नाटक / मंड्या on /hi.
  const reg = tier === "district" && raw ? districtByName(raw) : undefined;
  const place =
    tier === "founder" || tier === "all-india"
      ? tb("india")
      : tier === "state"
        ? places.state(raw, raw)
        : reg
          ? placeName(reg, locale)
          : raw;
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
        title={c.socialPlatform ? tp("onPlatform", { name: c.displayName, platform: c.socialPlatform }) : c.displayName}
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
  const t = useTranslations("citizens");
  const tk = useTranslations("kit");
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
      <Section id="community" title={t("title")} emoji="🤝">
        <div className={styles.communityGrid}>
          {/* ── Supporters ── */}
          <Card as="section" aria-labelledby="home-supporters" className={`${styles.communityMain} ftp-hue-pink`} tinted>
            <h3 id="home-supporters" className="ftp-title">
              {contributors === null ? (
                t("loadingSupporters")
              ) : total === 0 ? (
                t("beFirst")
              ) : (
                <>
                  {t.rich("backedBy", { n: total, num: (c) => <span className="ftp-num">{c}</span> })}
                </>
              )}
            </h3>
            <p className={styles.communityNote}>{t("noCorporate")}</p>
            {(named.length > 0 || anonymousCount > 0) && (
              <div className={styles.supList}>
                {named.slice(0, MAX_PILLS).map(({ c }, i) => (
                  <SupporterPill key={`${c.displayName}-${i}`} c={c} />
                ))}
                {anonymousCount > 0 && (
                  <span className={styles.supPill} title={t("anonymousTitle")}>
                    {t("anonymous")} <span className="ftp-num">×{anonymousCount}</span>
                  </span>
                )}
                {named.length > MAX_PILLS && (
                  <Link href={`/${locale}/contributors`} className={styles.supPill}>
                    {t("more", { n: named.length - MAX_PILLS })}
                  </Link>
                )}
              </div>
            )}
            <div className={styles.communityLinks}>
              <Link href={`/${locale}/contributors`} className={styles.inlineLink}>
                {t("viewAll")}
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link href={`/${locale}/support?tier=district`} className={styles.inlineLink}>
                {t("sponsor")}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </Card>

          {/* ── What citizens voted for ── */}
          <Card as="section" aria-labelledby="home-top-features" className={`${styles.communitySide} ftp-hue-violet`} tinted>
            <h3 id="home-top-features" className="ftp-title">
              {t("topVoted")}
            </h3>
            <p className={styles.communityNote}>
              {features === null ? (
                tk("loading")
              ) : (
                <>
                  {t("votesIdeas", { votes: totalVotes, ideas: (features ?? []).length })}
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
                      <span className={`ftp-num ${styles.voteCount}`} aria-label={t("votesAria", { n: f.votes })}>
                        {f.votes.toLocaleString("en-IN")}
                      </span>
                      <span className={styles.voteTitle}>{f.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              features !== null && <p className={styles.communityNote}>{t("noIdeas")}</p>
            )}

            {shared ? (
              <p className={styles.communityNote} role="status">
                {t("thanks")}
              </p>
            ) : shareOpen ? (
              <div className={styles.shareForm}>
                <div className={styles.shareHead}>
                  <span className="ftp-title">{t("shareYourIdea")}</span>
                  <button type="button" className={styles.button} onClick={() => setShareOpen(false)}>
                    {t("cancel")}
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
                  {t("shareIdea")}
                </button>
              )}
              <Link href={`/${locale}/features`} className={styles.inlineLink}>
                {t("viewFeatures")}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
