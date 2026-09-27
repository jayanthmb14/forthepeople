/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /support — Design v4 "Rang" (rose, the support colour)
// ═══════════════════════════════════════════════════════════════════════
//
//  This is a SERVER component. It reads the admin-editable bio / cost /
//  help content from the DB (falls back to SUPPORT_DEFAULTS) and lays the
//  page out with the v4 kit: a SiteHeader band, tier cards with the tier's
//  emoji, emoji StatTiles and Sections, and one picture — 10 coins lit for
//  the biggest share of "Where your money goes" (the same percentages as
//  the bars under it).
//
//  The money flow lives entirely in <SupportCheckout /> (a client
//  component). This page only decides WHERE each checkout sits and what
//  tier data it receives — the props passed to SupportCheckout are the same
//  as before the redesign, so Razorpay behaviour is unchanged.
//
//  Server → client rule: kit components are client components, so this
//  file never passes a Lucide icon *component* as a prop to them
//  (functions cannot cross that boundary). SiteHeader is not a client
//  component, so it may take one.
//
import { Suspense, Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ChevronRight, ExternalLink, HeartHandshake } from "lucide-react";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import ContributorCountBanner from "@/components/support/ContributorCountBanner";
import FeedbackModal from "@/components/common/FeedbackModal";
import { Card, Pill, ProgressBar, Section, StatStrip, StatTile } from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import SupporterQuotes from "@/components/support/SupporterQuotes";
import styles from "./support.module.css";
import { prisma } from "@/lib/db";
import { SUPPORT_DEFAULTS, type CostBreakdownItem, type HelpItem, type SupportPageContent } from "@/lib/support-defaults";

export const revalidate = 60; // content rarely changes; 60s cache is enough

/** Render markdown-lite: **bold** → <strong>, blank lines → new paragraph. */
function renderBioText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text)", margin: i === 0 ? 0 : "12px 0 0" }}>
        {parts.map((seg, j) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            return (
              <strong key={j} style={{ fontWeight: 600 }}>
                {seg.slice(2, -2)}
              </strong>
            );
          }
          return <Fragment key={j}>{seg}</Fragment>;
        })}
      </p>
    );
  });
}

async function loadSupportContent(): Promise<SupportPageContent> {
  try {
    const row = await prisma.supportPageConfig.findUnique({ where: { id: "support-page-config" } });
    if (!row) return SUPPORT_DEFAULTS;
    const cost = Array.isArray(row.costBreakdown) ? (row.costBreakdown as unknown as CostBreakdownItem[]) : SUPPORT_DEFAULTS.costBreakdown;
    const help = Array.isArray(row.helpItems) ? (row.helpItems as unknown as HelpItem[]) : SUPPORT_DEFAULTS.helpItems;
    return {
      bioName: row.bioName || SUPPORT_DEFAULTS.bioName,
      bioSubtitle: row.bioSubtitle || SUPPORT_DEFAULTS.bioSubtitle,
      bioText: row.bioText || SUPPORT_DEFAULTS.bioText,
      photoUrl: row.photoUrl || SUPPORT_DEFAULTS.photoUrl,
      costBreakdown: cost.length ? cost : SUPPORT_DEFAULTS.costBreakdown,
      helpItems: help.length ? help : SUPPORT_DEFAULTS.helpItems,
    };
  } catch (err) {
    console.warn("[support] loadSupportContent fell back to defaults:", err);
    return SUPPORT_DEFAULTS;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";
const FACTS = getPlatformFacts();

export const metadata: Metadata = {
  title: "Support ForThePeople.in — ₹3.30/day serves one district",
  description: `Help keep India's citizen transparency platform running. ₹12 lakh/year to serve ${FACTS.totalIndiaDistricts}+ districts. Every rupee keeps government data free and accessible.`,
  alternates: { canonical: `${BASE_URL}/en/support` },
};

// Projected running costs at each scale (April 2026 estimate — see the
// "The scale" block below). Plain strings on purpose: they are prose, not data.
const SCALE_COSTS = [
  { emoji: "🏘️", label: "1 District", monthly: "₹500/month", yearly: "₹6,000/year", usd: "~$6/month" },
  { emoji: "🗺️", label: "1 State (avg 31 districts)", monthly: "₹7,000/month", yearly: "₹84,000/year", usd: "~$85/month" },
  { emoji: "🌏", label: `All India (${FACTS.totalIndiaDistricts} districts)`, monthly: "₹96,000/month", yearly: "₹11.5 lakh/year", usd: "~$1,175/month" },
];

const INSTAGRAM_URL = "https://www.instagram.com/forthepeople_in/";

/**
 * The help items are admin-editable and may store an emoji in `icon`. v4
 * shows it when it is a short emoji; otherwise it picks one from the link
 * itself. Anything unrecognised gets a hand-shake.
 */
function helpEmojiFor(item: HelpItem): string {
  const own = (item.icon ?? "").trim();
  if (own && own.length <= 8 && !/[A-Za-z0-9]/.test(own)) return own;
  const url = item.url.toLowerCase();
  const label = item.label.toLowerCase();
  if (label.includes("star")) return "⭐";
  if (url.includes("github.com")) return "💻";
  if (url.includes("twitter.com") || url.includes("x.com") || label.includes("share")) return "📣";
  if (url.includes("/feedback")) return "📝";
  return "🤝";
}

/**
 * Some tier copy in razorpay-plans.ts ends with an emoji (e.g. a coffee cup).
 * The tier card already shows the tier's emoji in its chip, and v4 allows
 * one emoji per element, so pictographs are stripped from the copy.
 * (The RegExp is built from a string so the ES2017 TypeScript target
 * accepts the \p{…} property escape.)
 */
const EMOJI_RE = new RegExp("[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\u{FE0F}\\u{200D}]", "gu");
function withoutEmoji(text: string): string {
  return text.replace(EMOJI_RE, "").replace(/\s{2,}/g, " ").trim();
}

/** Short line under a tier's name: how the price works for that tier. */
function tierPriceNote(isRecurring: boolean, isCustom: boolean): string {
  if (isRecurring) return "Monthly, cancel anytime";
  if (isCustom) return "Any amount helps";
  return "One-time, edit the amount below";
}

/** Shared style for the small quiet text links on this page. */
const QUIET_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--hue-deep)",
  textDecoration: "none",
};

export default async function SupportPage() {
  const { activeDistricts, activeStates, modulesPerDistrict, totalIndiaDistricts } = FACTS;
  const content = await loadSupportContent();
  // "N districts × M modules" — derived from the registries, never typed by hand.
  const totalModulesAtScale = totalIndiaDistricts * modulesPerDistrict;
  // The picture: the biggest slice of "Where your money goes".
  const biggestCost = [...content.costBreakdown].filter((c) => c.pct > 0).sort((a, b) => b.pct - a.pct)[0] ?? null;

  return (
    <main className="ftp-hue-rose" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div className="ftp-container" style={{ paddingTop: 24 }}>
        {/* ── Page header ─────────────────────────────────────────────── */}
        <SiteHeader
          emoji="💝"
          icon={HeartHandshake}
          chip="Support the platform"
          title="Bringing government data to every Indian citizen"
          description={
            <>
              ForThePeople.in makes government data accessible, visual, and free for all{" "}
              <strong style={{ fontWeight: 700 }}>
                <span className="ftp-num">{totalIndiaDistricts}</span>+ districts
              </strong>{" "}
              in India. No paywalls. No ads. Just public data for the public.
            </>
          }
          backHref="/en"
        />
        <div style={{ maxWidth: 480, marginBottom: 16 }}>
          <StatTile
            emoji="🪙"
            label="Target cost at full scale"
            value="₹3.30"
            unit="/ district / day"
            countUp={false}
            sub={`At ${totalIndiaDistricts} districts. Current cost per district is higher with ${activeDistricts} active district${activeDistricts === 1 ? "" : "s"}; it falls as we scale.`}
          />
        </div>

        {/* ── International note ─────────────────────────────────────── */}
        <Card padding={16} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            🌍
          </span>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, lineHeight: "21px" }}>
            International supporters: we currently accept payments within India only. If you&apos;d like to contribute
            from outside India, please DM us on Instagram{" "}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}>
              @forthepeople_in
            </a>{" "}
            and we&apos;ll arrange an alternative payment method.
          </p>
        </Card>

        {/* ── Contributor count (link to the leaderboard) ────────────── */}
        <ContributorCountBanner />

        {/* ── Tier cards ─────────────────────────────────────────────── */}
        <Section title="Choose your contribution" id="tiers" emoji="🎯">
          <div className={styles.tierGrid}>
            {TIER_ORDER.map((key) => {
              const tier = TIER_CONFIG[key];
              const isCustom = key === "custom";
              return (
                <Card
                  key={key}
                  as="article"
                  tinted={Boolean(tier.featured)}
                  padding={16}
                  aria-label={tier.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    // The featured tier gets the hue border and wash, the
                    // open-amount tier a dashed border.
                    borderColor: tier.featured ? "var(--hue)" : "var(--ftp-border)",
                    borderStyle: isCustom ? "dashed" : "solid",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 19, borderRadius: 11 }}>
                      {tier.emoji}
                    </span>
                    {tier.featured && <Pill tone="support">Most popular</Pill>}
                    <Pill tone="neutral">{tier.isRecurring ? "Monthly" : "One-time"}</Pill>
                  </div>
                  <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: "22px", fontWeight: 650, color: "var(--ftp-text)" }}>
                    {tier.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span className="ftp-bignum" style={{ fontSize: 30, lineHeight: "34px", color: "var(--hue-deep)" }}>
                      ₹{tier.amount.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                      {tier.isRecurring ? "/ month" : isCustom ? "suggested" : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                    {tierPriceNote(tier.isRecurring, isCustom)}
                  </p>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{withoutEmoji(tier.description)}</p>
                  <p className="ftp-body" style={{ color: "var(--hue-deep)", fontStyle: "italic" }}>{withoutEmoji(tier.hookLine)}</p>
                  <div style={{ marginTop: "auto", paddingTop: 8 }}>
                    <Suspense>
                      <SupportCheckout
                        tier={{
                          emoji: tier.emoji,
                          label: tier.name,
                          defaultAmount: tier.amount,
                          minAmount: tier.minAmount,
                          maxAmount: tier.maxAmount,
                          step: tier.step,
                          accent: tier.accent,
                          isMonthly: tier.isRecurring,
                          isCustom,
                          tierKey: key,
                          requiresDistrict: tier.requiresDistrict,
                          requiresState: tier.requiresState,
                          hookLine: tier.hookLine,
                        }}
                      />
                    </Suspense>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>

        {/* ── Supporters (subscribers + one-time) ────────────────────── */}
        <ContributorWallClient />
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <Link href="/en/contributors" style={QUIET_LINK}>
            View full contributor leaderboard
          </Link>
        </div>

        {/* ── Supporter quotes (renders nothing when there are none) ─── */}
        <SupporterQuotes />

        {/* ── Personal message (bio) ─────────────────────────────────── */}
        <Section title="Why this exists" emoji="👋">
          <Card padding={24}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.photoUrl}
                alt={`${content.bioName} — Founder, ForThePeople.in`}
                width={64}
                height={64}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--hue-tint)",
                  boxShadow: "0 0 0 1px color-mix(in srgb, var(--hue) 30%, transparent)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650 }}>{content.bioName}</h3>
                <p className="ftp-body" style={{ color: "var(--hue-deep)", marginBottom: 16 }}>{content.bioSubtitle}</p>
                {renderBioText(content.bioText)}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── The scale ──────────────────────────────────────────────── */}
        <Section title="The scale" emoji="📈">
          <Card padding={24}>
            <p className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650 }}>More than ₹12 lakh / year to serve all of India</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              <span className="ftp-num">{totalIndiaDistricts}</span> districts ×{" "}
              <span className="ftp-num">{modulesPerDistrict}</span> dashboards ={" "}
              <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>
                <span className="ftp-num">{totalModulesAtScale.toLocaleString("en-IN")}</span> data modules
              </span>{" "}
              — updated every 5–30 minutes from government portals.
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              This is the current annual cost as of April 2026, covering {activeDistricts} active district
              {activeDistricts === 1 ? "" : "s"} across {activeStates} state{activeStates === 1 ? "" : "s"}. As we expand to all{" "}
              {totalIndiaDistricts}+ districts, costs will grow significantly. Pricing for sponsorship tiers may be revised as the
              platform scales. <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>Early supporters lock in current rates.</span>
            </p>
            <div style={{ marginTop: 16 }}>
              <StatStrip cols={4}>
                <StatTile emoji="🖥️" label="Monthly server cost" value="₹96K" sub="All India, April 2026 estimate" />
                <StatTile emoji="🧩" label="Data modules" value={totalModulesAtScale.toLocaleString("en-IN")} sub={`At ${totalIndiaDistricts} districts`} />
                <StatTile emoji="⚡" label="Fastest refresh" value="5" unit="min" />
                <StatTile emoji="🆓" label="Cost to citizens" value="₹0" />
              </StatStrip>
            </div>
          </Card>
        </Section>

        {/* ── Cost at scale ──────────────────────────────────────────── */}
        <Section title="Cost at scale" emoji="🪜">
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
            Projected running cost at each scale, from the April 2026 estimate.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 230px), 1fr))", gap: 12 }}>
            {SCALE_COSTS.map((c) => (
              <Card key={c.label} tinted padding={20}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 16, borderRadius: 10 }}>
                    {c.emoji}
                  </span>
                  <p className="ftp-label">{c.label}</p>
                </div>
                <p className="ftp-bignum" style={{ fontSize: 24, lineHeight: "30px", color: "var(--hue-deep)", margin: "10px 0 0" }}>{c.monthly}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{c.yearly}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{c.usd}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Where your money goes ──────────────────────────────────── */}
        <Section title="Where your money goes" emoji="🧾">
          <div className={biggestCost ? "ftp-picture-row" : undefined}>
            {/* The picture: 10 coins, lit for the biggest slice below. */}
            {biggestCost && (
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🪙">
                  Out of every <strong>₹10</strong> you give, about <strong>₹{Math.round(biggestCost.pct / 10)}</strong> goes to the
                  biggest cost: <strong>{biggestCost.label}</strong>.
                </Explainer>
                <Pictogram
                  filled={biggestCost.pct / 10}
                  emoji="💰"
                  label={`About ${Math.round(biggestCost.pct / 10)} of every 10 rupees go to ${biggestCost.label}.`}
                />
              </Card>
            )}
            <Card padding={24} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* The admin-editable `color` per row is ignored: bars use the page hue. */}
              {content.costBreakdown.map((item) => (
                <ProgressBar key={item.label} label={item.label} pct={item.pct} />
              ))}
            </Card>
          </div>
        </Section>

        {/* ── Other ways to help ─────────────────────────────────────── */}
        <Section title="Other ways to help" emoji="🙌">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {content.helpItems.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="ftp-card-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 56,
                  padding: "10px 16px",
                  background: "var(--ftp-surface)",
                  border: "1px solid var(--ftp-border)",
                  borderRadius: "var(--ftp-radius-card)",
                  boxShadow: "var(--ftp-shadow-1)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                  {helpEmojiFor(item)}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ftp-title" style={{ display: "block", fontWeight: 600 }}>{item.label}</span>
                  <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)" }}>{item.desc}</span>
                </span>
                <span aria-hidden style={{ color: "var(--hue)", display: "flex", flexShrink: 0 }}>
                  {item.external ? <ExternalLink size={16} /> : <ChevronRight size={16} />}
                </span>
              </a>
            ))}
            <Card padding={16} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                🐞
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ftp-title" style={{ display: "block", fontWeight: 600 }}>Report data errors</span>
                <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)" }}>
                  Found wrong data? <FeedbackModal label="Use our feedback form" />
                </span>
              </span>
            </Card>
          </div>
        </Section>

        {/* ── Closing call to action ─────────────────────────────────── */}
        <Card tinted padding={24} style={{ marginTop: 32, textAlign: "center" }}>
          <span className="ftp-emoji" aria-hidden style={{ display: "block", fontSize: 36, marginBottom: 6 }}>🪙</span>
          <h2 className="ftp-h2">Even ₹50 helps.</h2>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", maxWidth: 560, margin: "8px auto 20px" }}>
            It pays for one day of collecting data for a district — weather updates, crop prices, dam levels, and{" "}
            {Math.max(0, modulesPerDistrict - 3)} more data streams. Free for every citizen in that district.
          </p>
          <div style={{ display: "inline-block", width: "100%", maxWidth: 280, textAlign: "left" }}>
            <Suspense>
              <SupportCheckout
                tier={{
                  emoji: TIER_CONFIG.custom.emoji,
                  label: TIER_CONFIG.custom.name,
                  defaultAmount: TIER_CONFIG.custom.amount,
                  minAmount: TIER_CONFIG.custom.minAmount,
                  maxAmount: TIER_CONFIG.custom.maxAmount,
                  step: TIER_CONFIG.custom.step,
                  accent: TIER_CONFIG.district.accent,
                  tierKey: "custom",
                  hookLine: TIER_CONFIG.custom.hookLine,
                }}
              />
            </Suspense>
          </div>
        </Card>

        {/* ── International reminder + back link ─────────────────────── */}
        <p className="ftp-body" style={{ textAlign: "center", color: "var(--ftp-text-2)", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="ftp-emoji" aria-hidden>🌍</span>
          International?
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ ...QUIET_LINK, minHeight: 0 }}>
            DM @forthepeople_in on Instagram
          </a>
        </p>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/en" style={{ ...QUIET_LINK, fontWeight: 400, color: "var(--ftp-text-2)" }}>
            <ArrowLeft size={14} aria-hidden /> Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
