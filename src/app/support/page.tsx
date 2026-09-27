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
//  emoji, emoji StatTiles and Sections, and two pictures:
//    • "Cost at scale": the monthly running cost for one district, one
//      state and all of India as bars on one scale (the April 2026
//      estimate), replacing three look-alike cards;
//    • "Where your money goes": 10 coins lit for the biggest share, beside
//      the same percentages as bars.
//
//  The money flow lives entirely in <SupportCheckout /> (a client
//  component). This page only decides WHERE each checkout sits and what
//  tier data it receives — the props passed to SupportCheckout are the same
//  as before the redesign (the tier `label` stays English because it is
//  also the Razorpay description), so Razorpay behaviour is unchanged.
//
//  Text: "page_support" messages. The bio, cost rows and help items are
//  admin-written content and are shown as stored.
//
//  Server → client rule: kit components are client components, so this
//  file never passes a Lucide icon *component* as a prop to them
//  (functions cannot cross that boundary). SiteHeader is not a client
//  component, so it may take one.
//
//  Served at /<locale>/support through src/app/[locale]/support/page.tsx.
//
import { Suspense, Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, ExternalLink, HeartHandshake } from "lucide-react";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import ContributorCountBanner from "@/components/support/ContributorCountBanner";
import FeedbackModal from "@/components/common/FeedbackModal";
import { Card, Pill, ProgressBar, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList } from "@/components/site/SiteVisuals";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import SupporterQuotes from "@/components/support/SupporterQuotes";
import styles from "./support.module.css";
import { prisma } from "@/lib/db";
import { SUPPORT_DEFAULTS, type CostBreakdownItem, type HelpItem, type SupportPageContent } from "@/lib/support-defaults";
import { intlLocale } from "@/i18n/languages";
import { languageAlternates } from "@/i18n/seo";

export const revalidate = 60; // content rarely changes; 60s cache is enough

/** Render markdown-lite: **bold** → <strong>, blank lines → new paragraph. */
function renderBioText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text)", margin: i === 0 ? 0 : "12px 0 0" }}>
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

type Props = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const t = await getTranslations({ locale, namespace: "page_support" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { total: FACTS.totalIndiaDistricts }),
    alternates: languageAlternates("/support", locale),
    openGraph: { url: `${BASE_URL}/${locale}/support` },
  };
}

// Projected running costs at each scale (April 2026 estimate — see the
// "The scale" block below). Whole rupees and US dollars a month; the year
// figure is what the estimate states.
const SCALE_COSTS: { key: "district" | "state" | "india"; emoji: string; monthly: number; yearly: number; usd: number }[] = [
  { key: "district", emoji: "🏘️", monthly: 500, yearly: 6_000, usd: 6 },
  { key: "state", emoji: "🗺️", monthly: 7_000, yearly: 84_000, usd: 85 },
  { key: "india", emoji: "🌏", monthly: 96_000, yearly: 11_50_000, usd: 1_175 },
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

/** Shared style for the small quiet text links on this page. */
const QUIET_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 600,
  color: "var(--hue-deep)",
  textDecoration: "none",
};

export default async function SupportPage({ params }: Props) {
  const locale = (await params).locale ?? "en";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_support" });
  const nf = new Intl.NumberFormat(intlLocale(locale));
  const fmt = (n: number) => nf.format(n);
  const inr = (n: number) => `₹${fmt(n)}`;
  const usd = (n: number) => `$${fmt(n)}`;
  const b = (c: React.ReactNode) => <strong style={{ fontWeight: 700 }}>{c}</strong>;

  const { activeDistricts, activeStates, modulesPerDistrict, totalIndiaDistricts } = FACTS;
  const content = await loadSupportContent();
  // "N districts × M modules" — derived from the registries, never typed by hand.
  const totalModulesAtScale = totalIndiaDistricts * modulesPerDistrict;
  // Values for the patron tier's text (same numbers razorpay-plans.ts uses).
  const tierValues = { districts: fmt(totalIndiaDistricts), dashboards: fmt(totalModulesAtScale) };
  const tierText = (key: string, part: "name" | "desc" | "hook", fallback: string) =>
    t.has(`tier_${key}_${part}`) ? t(`tier_${key}_${part}`, tierValues) : fallback;
  // The picture: the biggest slice of "Where your money goes".
  const biggestCost = [...content.costBreakdown].filter((c) => c.pct > 0).sort((a, b2) => b2.pct - a.pct)[0] ?? null;
  // Cost-at-scale picture: how many times one district's cost all of India is.
  const scaleTimes = Math.round(SCALE_COSTS[2].monthly / SCALE_COSTS[0].monthly);

  return (
    <main className="ftp-hue-rose" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div className="ftp-container" style={{ paddingTop: 24 }}>
        {/* ── Page header ─────────────────────────────────────────────── */}
        <SiteHeader
          emoji="💝"
          icon={HeartHandshake}
          chip={t("chip")}
          title={t("title")}
          description={t.rich("description", { total: fmt(totalIndiaDistricts), b })}
          backHref={`/${locale}`}
        />
        <div style={{ maxWidth: 480, marginBottom: 16 }}>
          <StatTile
            emoji="🪙"
            label={t("targetLabel")}
            value="₹3.30"
            unit={t("targetUnit")}
            countUp={false}
            sub={t("targetSub", { total: fmt(totalIndiaDistricts), active: activeDistricts })}
          />
        </div>

        {/* ── International note ─────────────────────────────────────── */}
        <Card padding={16} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            🌍
          </span>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, lineHeight: 1.6 }}>
            {t.rich("intlNote", {
              link: (c) => (
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}>
                  {c}
                </a>
              ),
            })}
          </p>
        </Card>

        {/* ── Contributor count (link to the leaderboard) ────────────── */}
        <ContributorCountBanner />

        {/* ── Tier cards ─────────────────────────────────────────────── */}
        <Section title={t("tiersTitle")} id="tiers" emoji="🎯">
          <div className={styles.tierGrid}>
            {TIER_ORDER.map((key) => {
              const tier = TIER_CONFIG[key];
              const isCustom = key === "custom";
              const shownName = tierText(key, "name", tier.name);
              return (
                <Card
                  key={key}
                  as="article"
                  tinted={Boolean(tier.featured)}
                  padding={16}
                  aria-label={shownName}
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
                    {tier.featured && <Pill tone="support">{t("pillPopular")}</Pill>}
                    <Pill tone="neutral">{tier.isRecurring ? t("pillMonthly") : t("pillOneTime")}</Pill>
                  </div>
                  <h3 className="ftp-display" style={{ margin: 0, fontSize: 17, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)" }}>
                    {shownName}
                  </h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span className="ftp-bignum" style={{ fontSize: 30, lineHeight: "34px", color: "var(--hue-deep)" }}>
                      {inr(tier.amount)}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>
                      {tier.isRecurring ? t("perMonth") : isCustom ? t("suggested") : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", margin: 0 }}>
                    {tier.isRecurring ? t("noteMonthly") : isCustom ? t("noteCustom") : t("noteOneTime")}
                  </p>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{tierText(key, "desc", tier.description)}</p>
                  <p className="ftp-body" style={{ color: "var(--hue-deep)", fontStyle: "italic" }}>{tierText(key, "hook", tier.hookLine)}</p>
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
          <Link href={`/${locale}/contributors`} style={QUIET_LINK}>
            {t("leaderboardLink")}
          </Link>
        </div>

        {/* ── Supporter quotes (renders nothing when there are none) ─── */}
        <SupporterQuotes />

        {/* ── Personal message (bio, admin-written) ──────────────────── */}
        <Section title={t("bioTitle")} emoji="👋">
          <Card padding={24}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.photoUrl}
                alt={t("photoAlt", { name: content.bioName })}
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
              <div lang={locale === "en" ? undefined : "en"} style={{ flex: 1, minWidth: 220 }}>
                <h3 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>{content.bioName}</h3>
                <p className="ftp-body" style={{ color: "var(--hue-deep)", marginBottom: 16 }}>{content.bioSubtitle}</p>
                {renderBioText(content.bioText)}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── The scale ──────────────────────────────────────────────── */}
        <Section title={t("scaleTitle")} emoji="📈">
          <Card padding={24}>
            <p className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>{t("scaleHeadline")}</p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              {t.rich("scaleMath", {
                districts: fmt(totalIndiaDistricts),
                modules: modulesPerDistrict,
                total: fmt(totalModulesAtScale),
                n: (c) => <span className="ftp-num">{c}</span>,
                hl: (c) => <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{c}</span>,
              })}
            </p>
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
              {t.rich("scaleBody", {
                active: activeDistricts,
                states: activeStates,
                total: fmt(totalIndiaDistricts),
                b: (c) => <span style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{c}</span>,
              })}
            </p>
            <div style={{ marginTop: 16 }}>
              <StatStrip cols={4}>
                <StatTile emoji="🖥️" label={t("tileServer")} value={t("tileServerValue")} sub={t("tileServerSub")} />
                <StatTile emoji="🧩" label={t("tileModules")} value={fmt(totalModulesAtScale)} sub={t("tileModulesSub", { n: fmt(totalIndiaDistricts) })} />
                <StatTile emoji="⚡" label={t("tileRefresh")} value="5" unit={t("tileRefreshUnit")} />
                <StatTile emoji="🆓" label={t("tileCitizens")} value="₹0" />
              </StatStrip>
            </div>
          </Card>
        </Section>

        {/* ── Cost at scale — picture 1: the three scales on one bar scale ── */}
        <Section title={t("costScaleTitle")} emoji="🪜">
          <ChartCard
            title={t("costScaleChart")}
            emoji="💸"
            units={t("costScaleUnits")}
            simple={t.rich("costScaleSimple", { times: fmt(scaleTimes), b: (c) => <strong>{c}</strong> })}
            source={{ label: t("costScaleSource") }}
            table={SCALE_COSTS.map((c) => ({
              label: t(`scale_${c.key}`, { n: fmt(totalIndiaDistricts) }),
              value: `${t("perMonthAmount", { amount: inr(c.monthly) })}; ${t("yearUsd", { year: inr(c.yearly), usd: usd(c.usd) })}`,
            }))}
          >
            <BarList
              height={14}
              rows={SCALE_COSTS.map((c) => ({
                key: c.key,
                emoji: c.emoji,
                label: (
                  <>
                    <span style={{ fontWeight: 600 }}>{t(`scale_${c.key}`, { n: fmt(totalIndiaDistricts) })}</span>
                    <span className="ftp-num" style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                      {t("yearUsd", { year: inr(c.yearly), usd: usd(c.usd) })}
                    </span>
                  </>
                ),
                value: c.monthly,
                display: t("perMonthAmount", { amount: inr(c.monthly) }),
              }))}
            />
          </ChartCard>
        </Section>

        {/* ── Where your money goes — picture 2 ──────────────────────── */}
        <Section title={t("moneyTitle")} emoji="🧾">
          <div className={biggestCost ? "ftp-picture-row" : undefined}>
            {/* 10 coins, lit for the biggest slice below. */}
            {biggestCost && (
              <Card tinted padding={18}>
                <Explainer emoji="🪙">
                  {t.rich("moneySimple", {
                    n: Math.round(biggestCost.pct / 10),
                    label: biggestCost.label,
                    b: (c) => <strong>{c}</strong>,
                  })}
                </Explainer>
                <Pictogram
                  filled={biggestCost.pct / 10}
                  emoji="💰"
                  label={t("moneyPicto", { n: Math.round(biggestCost.pct / 10), label: biggestCost.label })}
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

        {/* ── Other ways to help (admin-written items) ───────────────── */}
        <Section title={t("helpTitle")} emoji="🙌">
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
                <span className="ftp-title" style={{ display: "block", fontWeight: 600 }}>{t("reportTitle")}</span>
                <span className="ftp-body" style={{ display: "block", color: "var(--ftp-text-2)" }}>
                  {t("reportBody")} <FeedbackModal label={t("reportLink")} />
                </span>
              </span>
            </Card>
          </div>
        </Section>

        {/* ── Closing call to action ─────────────────────────────────── */}
        <Card tinted padding={24} style={{ marginTop: 32, textAlign: "center" }}>
          <span className="ftp-emoji" aria-hidden style={{ display: "block", fontSize: 36, marginBottom: 6 }}>🪙</span>
          <h2 className="ftp-h2">{t("ctaTitle", { amount: inr(TIER_CONFIG.custom.amount) })}</h2>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", maxWidth: 560, margin: "8px auto 20px" }}>
            {t("ctaBody", { n: Math.max(0, modulesPerDistrict - 3) })}
          </p>
          <div style={{ display: "inline-block", width: "100%", maxWidth: 280, textAlign: "start" }}>
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
      </div>
    </main>
  );
}
