/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { Suspense, Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import ContributorCountBanner from "@/components/support/ContributorCountBanner";
import FeedbackModal from "@/components/common/FeedbackModal";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getTotalActiveDistrictCount, getActiveStateCount } from "@/lib/constants/districts";
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
      <p key={i} style={{ fontSize: 14, color: "#1A1A1A", lineHeight: 1.8, margin: i === 0 ? 0 : "12px 0 0" }}>
        {parts.map((seg, j) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            return <strong key={j}>{seg.slice(2, -2)}</strong>;
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

export const metadata: Metadata = {
  title: "Support ForThePeople.in — ₹3.30/day serves one district",
  description: "Help keep India's citizen transparency platform running. ₹12 lakh/year to serve 780+ districts. Every rupee keeps government data free and accessible.",
  alternates: { canonical: `${BASE_URL}/en/support` },
};

const SCALE_COSTS = [
  { label: "1 District", monthly: "₹500/month", yearly: "₹6,000/year", usd: "~$6/month" },
  { label: "1 State (avg 31 districts)", monthly: "₹7,000/month", yearly: "₹84,000/year", usd: "~$85/month" },
  { label: "All India (780 districts)", monthly: "₹96,000/month", yearly: "₹11.5 lakh/year", usd: "~$1,175/month" },
];

export default async function SupportPage() {
  const activeDistricts = getTotalActiveDistrictCount();
  const activeStates = getActiveStateCount();
  const content = await loadSupportContent();
  return (
    <main style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>

      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #EFF6FF 0%, #FAFAF8 100%)",
          borderBottom: "1px solid #E8E8E4",
          padding: "52px 24px 44px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🇮🇳</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.6px", marginBottom: 12 }}>
            Bringing Government Data<br />to Every Indian Citizen
          </h1>
          <p style={{ fontSize: 16, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 24 }}>
            ForThePeople.in makes government data accessible, visual, and free
            for all <strong style={{ color: "#1A1A1A" }}>780+ districts</strong> in India.
            No paywalls. No ads. Just public data for the public.
          </p>
          <div
            style={{
              display: "inline-block",
              background: "#FFFFFF",
              border: "2px solid #BFDBFE",
              borderRadius: 14,
              padding: "16px 28px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-1px" }}>
              ₹3.30 / district / day
            </div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
              Target cost at full scale (780 districts)
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 6 }}>
              Current cost per district is higher with {activeDistricts} active district{activeDistricts === 1 ? "" : "s"}. As we scale to 780, per-district costs decrease significantly.
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 0" }}>

        {/* ── 1. International disclaimer (TOP) ── */}
        <div style={{
          background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10,
          padding: "12px 16px", fontSize: 13, color: "#1E40AF", lineHeight: 1.6, marginBottom: 32,
        }}>
          🌏 International supporters: We currently accept payments within India only.
          If you&apos;d like to contribute from outside India, please DM us on Instagram{" "}
          <a href="https://www.instagram.com/forthepeople_in/" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
            @forthepeople_in
          </a>{" "}
          and we&apos;ll arrange an alternative payment method.
        </div>

        {/* ── Contributor count banner (prominent CTA to leaderboard) ── */}
        <ContributorCountBanner />

        {/* ── 2. Tier cards ── */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          💳 Choose Your Contribution
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {TIER_ORDER.map((key) => {
            const tier = TIER_CONFIG[key];
            const isCustom = key === "custom";
            return (
              <div
                key={key}
                style={{
                  background: tier.featured ? tier.color : tier.color,
                  border: isCustom
                    ? `2px dashed ${tier.border}`
                    : `2px solid ${tier.featured ? tier.accent : tier.border}`,
                  borderRadius: 14,
                  padding: "24px 20px",
                  position: "relative",
                }}
              >
                {tier.featured && (
                  <div
                    style={{
                      position: "absolute", top: -10, left: "50%",
                      transform: "translateX(-50%)",
                      background: tier.accent, color: "#fff",
                      fontSize: 10, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 10,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 36, marginBottom: 10 }}>{tier.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 2 }}>
                  {tier.name}
                </div>
                <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 12 }}>
                  {tier.isRecurring ? `Monthly · ₹${tier.amount.toLocaleString("en-IN")}/mo` : isCustom ? "Any amount helps!" : "One-time · edit amount below"}
                </div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 6, lineHeight: 1.5 }}>
                  {tier.description}
                </div>
                <div style={{ fontSize: 11, color: "#9B9B9B", fontStyle: "italic", marginBottom: 14, lineHeight: 1.5 }}>
                  {tier.hookLine}
                </div>
                <Suspense><SupportCheckout
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
                /></Suspense>
              </div>
            );
          })}
        </div>

        {/* ── 3. Active supporters (scrolling) + one-time ── */}
        <ContributorWallClient />
        <div style={{ textAlign: "center", marginTop: 12, marginBottom: 24 }}>
          <Link href="/en/contributors" style={{ fontSize: 13, color: "#2563EB", fontWeight: 500, textDecoration: "none" }}>
            View full contributor leaderboard →
          </Link>
        </div>

        {/* ── 4. Supporter quotes ── */}
        <div style={{ marginTop: 40 }}>
          <SupporterQuotes />
        </div>

        {/* ── 5. Personal Message (bio) ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 40,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.photoUrl}
              alt={`${content.bioName} — Founder, ForThePeople.in`}
              width={72}
              height={72}
              className="profile-ring"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                objectFit: "cover", border: "3px solid #2563EB",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                {content.bioName}
                <span aria-hidden="true" style={{ fontSize: 13 }}>🇮🇳</span>
              </div>
              <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 16 }}>
                {content.bioSubtitle}
              </div>
              {renderBioText(content.bioText)}
            </div>
          </div>
        </div>

        {/* ── 6. Scale + Cost ── */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: "28px 32px",
            marginBottom: 40,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            The Scale
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            More than ₹12 lakh / year to serve all of India
          </div>
          <div style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 12 }}>
            780 districts × 29 dashboards = <strong style={{ color: "#1A1A1A" }}>22,620 live data modules</strong> —
            updated every 5–30 minutes from government portals.
          </div>
          <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 20 }}>
            This is the current annual cost as of April 2026, covering {activeDistricts} active district{activeDistricts === 1 ? "" : "s"} across {activeStates} state{activeStates === 1 ? "" : "s"}.
            As we expand to all 780+ districts, costs will grow significantly.
            Pricing for sponsorship tiers may be revised as the platform scales.{" "}
            <strong style={{ color: "#1A1A1A" }}>Early supporters lock in current rates.</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { value: "₹96K", label: "monthly server cost (all India)" },
              { value: "22,620", label: "live data modules" },
              { value: "5 min", label: "fastest refresh rate" },
              { value: "₹0", label: "cost to citizens" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          💰 Cost at Scale
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12, marginBottom: 40 }}>
          {SCALE_COSTS.map((c) => (
            <div key={c.label} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "20px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", letterSpacing: "-0.5px" }}>{c.monthly}</div>
              <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>{c.yearly}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B" }}>{c.usd}</div>
            </div>
          ))}
        </div>

        {/* ── 7. Where Your Money Goes ── */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          🔍 Where Your Money Goes
        </h2>
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "20px 24px", marginBottom: 40 }}>
          {content.costBreakdown.map((item) => (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "#1A1A1A" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: item.color }}>{item.pct}%</span>
              </div>
              <div style={{ background: "#F5F5F0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── 8. Other Ways to Help ── */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
          🤝 Other Ways to Help
        </h2>
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "20px 24px", marginBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {content.helpItems.map((item) => (
              <a key={item.label} href={item.url} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}
                className="support-help-item" style={{ display: "flex", alignItems: "flex-start", gap: 12, textDecoration: "none", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B" }}>{item.desc}</div>
                </div>
                <span aria-hidden="true" className="support-help-arrow" style={{ fontSize: 16, color: "#9B9B9B", flexShrink: 0, transition: "transform 150ms, color 150ms" }}>
                  {item.external ? "↗" : "→"}
                </span>
              </a>
            ))}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 10px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🐛</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Report data errors</div>
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>Found wrong data?{" "}<FeedbackModal label="Use our feedback form →" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)", border: "1px solid #BFDBFE", borderRadius: 16, padding: "28px 32px", textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Even ₹50 helps.</div>
          <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 20 }}>
            It pays for one day of collecting data for a district — weather updates, crop prices, dam levels,
            and 26 more data streams. Free for every citizen in that district.
          </p>
          <div style={{ display: "inline-block", minWidth: 220 }}>
            <Suspense><SupportCheckout tier={{
              emoji: "❤️",
              label: TIER_CONFIG.custom.name,
              defaultAmount: TIER_CONFIG.custom.amount,
              minAmount: TIER_CONFIG.custom.minAmount,
              maxAmount: TIER_CONFIG.custom.maxAmount,
              step: TIER_CONFIG.custom.step,
              accent: "#2563EB",
              tierKey: "custom",
              hookLine: TIER_CONFIG.custom.hookLine,
            }} /></Suspense>
          </div>
        </div>

        {/* ── Bottom international reminder ── */}
        <div style={{ background: "#FAFAF8", border: "0.5px solid #E8E8E4", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
          🌏 International?{" "}
          <a href="https://www.instagram.com/forthepeople_in/" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>
            DM @forthepeople_in on Instagram
          </a>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/en" style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none" }}>
            ← Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
