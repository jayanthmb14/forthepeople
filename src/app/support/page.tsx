/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /support — Design v3 "Civic Ledger"
// ═══════════════════════════════════════════════════════════════════════
//
//  This is a SERVER component. It reads the admin-editable bio / cost /
//  help content from the DB (falls back to SUPPORT_DEFAULTS) and lays the
//  page out with the v3 kit (Card, Pill, StatTile, Section, ProgressBar).
//
//  The money flow lives entirely in <SupportCheckout /> (a client
//  component). This page only decides WHERE each checkout sits and what
//  tier data it receives — the props passed to SupportCheckout are the same
//  as before the redesign, so Razorpay behaviour is unchanged.
//
//  Server → client rule: kit components are client components, so this
//  file never passes a Lucide icon *component* as a prop (functions cannot
//  cross that boundary). Icons are rendered here as JSX children instead.
//
import { Suspense, Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bug,
  FileText,
  Github,
  Globe,
  HeartHandshake,
  Share2,
  Star,
} from "lucide-react";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import ContributorCountBanner from "@/components/support/ContributorCountBanner";
import FeedbackModal from "@/components/common/FeedbackModal";
import { Card, Pill, ProgressBar, Section, StatStrip, StatTile } from "@/components/district/ui";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import SupporterQuotes from "@/components/support/SupporterQuotes";
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
              <strong key={j} style={{ fontWeight: 500 }}>
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
  { label: "1 District", monthly: "₹500/month", yearly: "₹6,000/year", usd: "~$6/month" },
  { label: "1 State (avg 31 districts)", monthly: "₹7,000/month", yearly: "₹84,000/year", usd: "~$85/month" },
  { label: `All India (${FACTS.totalIndiaDistricts} districts)`, monthly: "₹96,000/month", yearly: "₹11.5 lakh/year", usd: "~$1,175/month" },
];

const INSTAGRAM_URL = "https://www.instagram.com/forthepeople_in/";

/**
 * The help items are admin-editable and store an emoji in `icon`. v3 has no
 * emoji in chrome, so we ignore that field and pick a Lucide icon from the
 * link itself. Anything unrecognised gets a neutral hand-shake icon.
 */
function helpIconFor(item: HelpItem): React.ReactNode {
  const url = item.url.toLowerCase();
  const label = item.label.toLowerCase();
  if (label.includes("star")) return <Star size={18} aria-hidden />;
  if (url.includes("github.com")) return <Github size={18} aria-hidden />;
  if (url.includes("twitter.com") || url.includes("x.com") || label.includes("share")) return <Share2 size={18} aria-hidden />;
  if (url.includes("/feedback")) return <FileText size={18} aria-hidden />;
  return <HeartHandshake size={18} aria-hidden />;
}

/**
 * Some tier copy in razorpay-plans.ts ends with an emoji (e.g. "… free ☕").
 * v3 has no emoji in chrome, so pictographs are stripped before rendering.
 * (The RegExp is built from a string so the ES2017 TypeScript target
 * accepts the \p{…} property escape.)
 */
const EMOJI_RE = new RegExp("[\\p{Extended_Pictographic}\\u{1F1E6}-\\u{1F1FF}\\u{FE0F}\\u{200D}]", "gu");
function withoutEmoji(text: string): string {
  return text.replace(EMOJI_RE, "").replace(/\s{2,}/g, " ").trim();
}

/** Short line under a tier's name: how the price works for that tier. */
function tierPriceNote(isRecurring: boolean, isCustom: boolean): string {
  if (isRecurring) return "Monthly · cancel anytime";
  if (isCustom) return "Any amount helps";
  return "One-time · edit amount below";
}

/** Shared style for the small quiet text links on this page. */
const QUIET_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 500,
  color: "var(--ftp-brand)",
  textDecoration: "none",
};

export default async function SupportPage() {
  const { activeDistricts, activeStates, modulesPerDistrict, totalIndiaDistricts } = FACTS;
  const content = await loadSupportContent();
  // "N districts × M modules" — derived from the registries, never typed by hand.
  const totalModulesAtScale = totalIndiaDistricts * modulesPerDistrict;

  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div className="ftp-container" style={{ paddingTop: 40 }}>
        {/* ── Page header ─────────────────────────────────────────────── */}
        <header style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 24, marginBottom: 24 }}>
          <div>
            <div style={{ maxWidth: 720 }}>
              <Pill tone="support">
                <HeartHandshake size={12} aria-hidden />
                Support the platform
              </Pill>
              <h1 className="ftp-h1" style={{ marginTop: 12 }}>
                Bringing government data to every Indian citizen
              </h1>
              <p className="ftp-body" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", marginTop: 12 }}>
                ForThePeople.in makes government data accessible, visual, and free for all{" "}
                <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
                  <span className="ftp-num">{totalIndiaDistricts}</span>+ districts
                </span>{" "}
                in India. No paywalls. No ads. Just public data for the public.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 20, maxWidth: 480 }}>
            <StatTile
              label="Target cost at full scale"
              value="₹3.30"
              unit="/ district / day"
              sub={`At ${totalIndiaDistricts} districts. Current cost per district is higher with ${activeDistricts} active district${activeDistricts === 1 ? "" : "s"}; it falls as we scale.`}
            />
          </div>
        </header>

        {/* ── International note ─────────────────────────────────────── */}
        <Card padding={16} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <Globe size={18} aria-hidden style={{ color: "var(--ftp-brand)", flexShrink: 0, marginTop: 1 }} />
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
            International supporters: we currently accept payments within India only. If you&apos;d like to contribute
            from outside India, please DM us on Instagram{" "}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ftp-brand)", fontWeight: 500, textDecoration: "none" }}>
              @forthepeople_in
            </a>{" "}
            and we&apos;ll arrange an alternative payment method.
          </p>
        </Card>

        {/* ── Contributor count (link to the leaderboard) ────────────── */}
        <ContributorCountBanner />

        {/* ── Tier cards ─────────────────────────────────────────────── */}
        <Section title="Choose your contribution" id="tiers">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
              gap: 16,
            }}
          >
            {TIER_ORDER.map((key) => {
              const tier = TIER_CONFIG[key];
              const isCustom = key === "custom";
              return (
                <Card
                  key={key}
                  as="article"
                  padding={20}
                  aria-label={tier.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    // The featured tier gets a stronger border, the open-amount
                    // tier a dashed one — no fills, no colours.
                    borderColor: tier.featured ? "var(--ftp-brand)" : "var(--ftp-border)",
                    borderStyle: isCustom ? "dashed" : "solid",
                  }}
                >
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {tier.featured && <Pill tone="brand">Most popular</Pill>}
                    <Pill tone={tier.isRecurring ? "support" : "neutral"}>{tier.isRecurring ? "Monthly" : "One-time"}</Pill>
                  </div>
                  <h3 className="ftp-title">{tier.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span className="ftp-num" style={{ fontSize: 28, lineHeight: "32px", color: "var(--ftp-text)" }}>
                      ₹{tier.amount.toLocaleString("en-IN")}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
                      {tier.isRecurring ? "/ month" : isCustom ? "suggested" : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
                    {tierPriceNote(tier.isRecurring, isCustom)}
                  </p>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{withoutEmoji(tier.description)}</p>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontStyle: "italic" }}>{withoutEmoji(tier.hookLine)}</p>
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
            View full contributor leaderboard <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* ── Supporter quotes (renders nothing when there are none) ─── */}
        <SupporterQuotes />

        {/* ── Personal message (bio) ─────────────────────────────────── */}
        <Section title="Why this exists">
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
                  border: "1px solid var(--ftp-border)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 className="ftp-title">{content.bioName}</h3>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 16 }}>{content.bioSubtitle}</p>
                {renderBioText(content.bioText)}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── The scale ──────────────────────────────────────────────── */}
        <Section title="The scale">
          <Card padding={24}>
            <p className="ftp-title">More than ₹12 lakh / year to serve all of India</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              <span className="ftp-num">{totalIndiaDistricts}</span> districts ×{" "}
              <span className="ftp-num">{modulesPerDistrict}</span> dashboards ={" "}
              <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>
                <span className="ftp-num">{totalModulesAtScale.toLocaleString("en-IN")}</span> data modules
              </span>{" "}
              — updated every 5–30 minutes from government portals.
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              This is the current annual cost as of April 2026, covering {activeDistricts} active district
              {activeDistricts === 1 ? "" : "s"} across {activeStates} state{activeStates === 1 ? "" : "s"}. As we expand to all{" "}
              {totalIndiaDistricts}+ districts, costs will grow significantly. Pricing for sponsorship tiers may be revised as the
              platform scales. <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>Early supporters lock in current rates.</span>
            </p>
            <div style={{ marginTop: 16 }}>
              <StatStrip cols={4}>
                <StatTile label="Monthly server cost" value="₹96K" sub="All India · April 2026 estimate" />
                <StatTile label="Data modules" value={totalModulesAtScale.toLocaleString("en-IN")} sub={`At ${totalIndiaDistricts} districts`} />
                <StatTile label="Fastest refresh" value="5" unit="min" />
                <StatTile label="Cost to citizens" value="₹0" />
              </StatStrip>
            </div>
          </Card>
        </Section>

        {/* ── Cost at scale ──────────────────────────────────────────── */}
        <Section title="Cost at scale">
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 12 }}>
            Projected running cost at each scale, from the April 2026 estimate.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 230px), 1fr))", gap: 12 }}>
            {SCALE_COSTS.map((c) => (
              <Card key={c.label} padding={20}>
                <p className="ftp-label">{c.label}</p>
                <p className="ftp-num" style={{ fontSize: 22, lineHeight: "28px", color: "var(--ftp-text)", marginTop: 6 }}>{c.monthly}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{c.yearly}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{c.usd}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── Where your money goes ──────────────────────────────────── */}
        <Section title="Where your money goes">
          <Card padding={24} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* The admin-editable `color` per row is ignored: bars use the brand token. */}
            {content.costBreakdown.map((item) => (
              <ProgressBar key={item.label} label={item.label} pct={item.pct} />
            ))}
          </Card>
        </Section>

        {/* ── Other ways to help ─────────────────────────────────────── */}
        <Section title="Other ways to help">
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
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ color: "var(--ftp-brand)", display: "flex", flexShrink: 0 }}>{helpIconFor(item)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ftp-title" style={{ display: "block" }}>{item.label}</span>
                  <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)" }}>{item.desc}</span>
                </span>
                <span aria-hidden style={{ color: "var(--ftp-text-2)", display: "flex", flexShrink: 0 }}>
                  {item.external ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />}
                </span>
              </a>
            ))}
            <Card padding={16} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--ftp-brand)", display: "flex", flexShrink: 0 }}>
                <Bug size={18} aria-hidden />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ftp-title" style={{ display: "block" }}>Report data errors</span>
                <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)" }}>
                  Found wrong data? <FeedbackModal label="Use our feedback form →" />
                </span>
              </span>
            </Card>
          </div>
        </Section>

        {/* ── Closing call to action ─────────────────────────────────── */}
        <Card padding={24} style={{ marginTop: 32, textAlign: "center" }}>
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
          <Globe size={14} aria-hidden />
          International?
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ ...QUIET_LINK, minHeight: 0 }}>
            DM @forthepeople_in on Instagram
          </a>
        </p>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/en" style={{ ...QUIET_LINK, color: "var(--ftp-text-2)" }}>
            <ArrowLeft size={14} aria-hidden /> Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
