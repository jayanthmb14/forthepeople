/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /support — Design v5 "calm": simple on purpose
// ═══════════════════════════════════════════════════════════════════════
//
//  The owner asked for a simple support page: what support does, the plans,
//  how to subscribe, and the supporters. So, top to bottom:
//    1. Title + one line: what your money pays for.
//    2. The five plans as simple cards (price, what you get, the checkout).
//    3. "How to subscribe" in 3 numbered steps.
//    4. Supporters: the All-India line (Founding Builder first), the wall,
//       a link to everyone.
//    5. Two closed disclosures, one tap away: "Where the money goes" (the
//       admin-written percentages) and "Why this exists" (the admin-written
//       founder bio — only when it passes bio-check.ts).
//    6. One line of other ways to help.
//
//  Removed in v5: the crimson header band, the ₹3.30/day, ₹96K and "₹12 lakh
//  a year" tiles and essays, the cost-at-scale and coin charts, the "Most
//  popular" and "Royal Contributor" sales lines, the supporter-count banner
//  and quotes (the wall already shows both), the repeated closing checkout,
//  and the "International supporters … we'll arrange another way" note
//  (the project takes no foreign money; the owner decides any wording).
//
//  The money flow lives entirely in <SupportCheckout /> and is unchanged: it
//  gets exactly the same tier props as before (the English tier `label` is
//  also the Razorpay description), and `?tier=&state=&district=` still opens
//  the right form.
//
//  Look (v5.2 "White Calm" refresh, 28 Sep 2026): white cards with light
//  1 px borders on the page, and two slightly darker rounded BANDS (the
//  plans, the supporters) so their white cards stand out. Each plan keeps
//  its colour only as a 2 px rule on top, its chip, its price and its
//  drawn picture (TierArt): one-time rose, District blue, State teal,
//  All-India violet, Founding Builder gold (tier-look.ts). Plan cards lift
//  on hover; the plan whose checkout is open (or linked as #plan-<key>) is
//  outlined in its colour. The checkout sits in its own inset card. Blocks
//  rise in quickly (180 ms, none under reduced motion).

import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronDown, ExternalLink, MousePointerClick, PenLine, ShieldCheck } from "lucide-react";
import SupportCheckout from "@/components/support/SupportCheckout";
import ContributorWallClient from "@/components/support/ContributorWallClient";
import NationalSupporters from "@/components/support/NationalSupporters";
import TierArt from "@/components/support/TierArt";
import { tierHueClass, tierKeyOf, type TierKey } from "@/components/support/tier-look";
import look from "@/components/support/look.module.css";
import FeedbackModal from "@/components/common/FeedbackModal";
import { ModulePage } from "@/components/district/ui";
import PlainPageHeader from "@/components/site/PlainPageHeader";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import { bioIssues } from "@/components/support/bio-check";
import styles from "./support.module.css";
import { prisma } from "@/lib/db";
import { SUPPORT_DEFAULTS, type CostBreakdownItem, type HelpItem, type SupportPageContent } from "@/lib/support-defaults";
import { NUMBER_LOCALE } from "@/i18n/languages";
import { languageAlternates } from "@/i18n/seo";

export const revalidate = 60; // content rarely changes; 60s cache is enough

/** Render markdown-lite: **bold** → <strong>, blank lines → new paragraph. */
function renderBioText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text)", margin: i === 0 ? 0 : "12px 0 0" }}>
        {parts.map((seg, j) =>
          seg.startsWith("**") && seg.endsWith("**") ? (
            <strong key={j} style={{ fontWeight: 600 }}>
              {seg.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{seg}</span>
          ),
        )}
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
  const nf = new Intl.NumberFormat(NUMBER_LOCALE);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { amount: `₹${nf.format(TIER_CONFIG.district.amount)}` }),
    alternates: languageAlternates("/support", locale),
    openGraph: { url: `${BASE_URL}/${locale}/support` },
  };
}

/** A closed-by-default section: one tap to open. */
function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className={styles.disclosure}>
      <summary className={styles.summary}>
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden className={styles.chevron} />
      </summary>
      <div className={styles.disclosureBody}>{children}</div>
    </details>
  );
}

/**
 * A page section. `band` puts it on the slightly darker rounded surface
 * that groups white cards; otherwise it sits straight on the page.
 */
function Band({
  id,
  title,
  note,
  band = false,
  delay = 0,
  children,
}: {
  id: string;
  title: string;
  note?: React.ReactNode;
  band?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`${band ? styles.band : styles.plain} ${styles.rise}`}
      style={{ ["--d" as string]: delay } as React.CSSProperties}
    >
      <div className={styles.bandHead}>
        <h2 id={`${id}-title`} className={`ftp-h2 ${styles.bandTitle}`}>
          {title}
        </h2>
        {note}
      </div>
      {children}
    </section>
  );
}

/** Each "where the money goes" bar gets its own soft colour. */
const COST_HUES = ["ftp-hue-blue", "ftp-hue-teal", "ftp-hue-violet", "ftp-hue-rose", "ftp-hue-yellow", "ftp-hue-sky"];

const TEXT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  minHeight: 44,
  fontSize: 14,
  lineHeight: 1.45,
  fontWeight: 600,
  color: "var(--ftp-brand)",
  textDecoration: "none",
};

export default async function SupportPage({ params }: Props) {
  const locale = (await params).locale ?? "en";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_support" });
  const nf = new Intl.NumberFormat(NUMBER_LOCALE);
  const inr = (n: number) => `₹${nf.format(n)}`;

  const content = await loadSupportContent();
  // The admin-written bio is shown only when it is safe (bio-check.ts).
  const issues = bioIssues(content.bioText, FACTS);
  if (issues.length > 0) {
    console.warn(`[support] founder bio hidden until it is rewritten in the admin panel: ${issues.join("; ")}`);
  }
  const showBio = issues.length === 0;
  const costRows = content.costBreakdown.filter((c) => c.pct > 0);
  const tierValues = { districts: nf.format(FACTS.totalIndiaDistricts), dashboards: nf.format(FACTS.totalIndiaDistricts * FACTS.modulesPerDistrict) };

  // Three steps, three soft colours (rose → blue → gold), one small icon each.
  const steps = [
    { title: t("how1Title"), body: t("how1Body"), icon: MousePointerClick, hue: "ftp-hue-rose" },
    { title: t("how2Title"), body: t("how2Body"), icon: PenLine, hue: "ftp-hue-blue" },
    { title: t("how3Title"), body: t("how3Body"), icon: ShieldCheck, hue: "ftp-hue-yellow" },
  ];
  // The hero shows three of the plan pictures, overlapping (laptop and up).
  const heroArt: TierKey[] = ["custom", "district", "founder"];

  return (
    <main className={`ftp-hue-blue ${look.metal} ${styles.page}`}>
      <ModulePage>
        {/* ── 1. What support does ─────────────────────────────────── */}
        <div className={`${styles.hero} ${styles.rise}`}>
          <PlainPageHeader title={t("title")} description={t("lead")} backHref={`/${locale}`} />
          <div className={styles.heroArt} aria-hidden>
            {heroArt.map((k, i) => (
              <span key={k} className={`${tierHueClass(k)} ${styles.heroArtItem}`} style={{ ["--i" as string]: i } as React.CSSProperties}>
                <TierArt tier={k} size={i === 1 ? 84 : 68} />
              </span>
            ))}
          </div>
        </div>

        {/* ── 2. The plans ─────────────────────────────────────────── */}
        <Band id="tiers" title={t("tiersTitle")} band delay={1}>
          <div className={styles.tierGrid}>
            {TIER_ORDER.map((key) => {
              const tier = TIER_CONFIG[key];
              const isCustom = key === "custom";
              const plan = tierKeyOf(key);
              const name = t.has(`tier_${key}_name`) ? t(`tier_${key}_name`) : tier.name;
              const desc = t.has(`tier_${key}_desc`) ? t(`tier_${key}_desc`, tierValues) : tier.description;
              return (
                <article key={key} id={`plan-${key}`} aria-label={name} className={`${styles.tierCard} ${tierHueClass(plan)}`} data-tier={plan}>
                  <div className={styles.tierHead}>
                    <TierArt tier={plan} size={64} />
                    <span className={styles.planChip}>{tier.isRecurring ? t("pillMonthly") : t("pillOneTime")}</span>
                  </div>
                  <h3 className={styles.tierName}>{name}</h3>
                  <p className={styles.price}>
                    <span className={`ftp-num ${styles.priceNum}`}>{inr(tier.amount)}</span>
                    <span className={styles.priceUnit}>
                      {tier.isRecurring ? t("priceMonthly") : t("priceOnce", { min: inr(tier.minAmount) })}
                    </span>
                  </p>
                  <p className={styles.tierDesc}>{desc}</p>
                  {tier.isRecurring && <p className={styles.tierNote}>{t("noteMonthly")}</p>}
                  <div className={styles.tierAction}>
                    {/* Same height as the amount row + button, so nothing jumps when it loads. */}
                    <Suspense fallback={<div aria-hidden className={`ftp-skeleton ${styles.actionSkeleton}`} />}>
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
                </article>
              );
            })}
          </div>
        </Band>

        {/* ── 3. How to subscribe ──────────────────────────────────── */}
        <Band id="how" title={t("howTitle")} delay={2}>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={i} className={`${styles.step} ${s.hue}`}>
                <span aria-hidden className={styles.stepBadge}>
                  <s.icon size={20} />
                  <span className={`ftp-num ${styles.stepNum}`}>{i + 1}</span>
                </span>
                <span style={{ minWidth: 0 }}>
                  <span className={styles.stepTitle}>{s.title}</span>
                  <span className={styles.stepBody}>{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className={styles.howNote}>
            {t.rich("howNote", {
              link: (c) => (
                <a href="mailto:support@forthepeople.in" style={{ color: "var(--ftp-brand)", fontWeight: 600, textDecoration: "none" }}>
                  {c}
                </a>
              ),
            })}
          </p>
        </Band>

        {/* ── 4. Supporters ────────────────────────────────────────── */}
        <Band id="supporters" title={t("supportersTitle")} band delay={3}>
          <NationalSupporters style={{ marginBottom: 8 }} />
          <ContributorWallClient />
          <Link href={`/${locale}/contributors`} style={TEXT_LINK}>
            {t("leaderboardLink")}
          </Link>
        </Band>

        {/* ── 5. One tap away: money and the founder's note ────────── */}
        <div className={styles.more}>
          {costRows.length > 0 && (
            <Disclosure title={t("moneyTitle")}>
              <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{t("moneyNote")}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {/* Admin-written labels, shown as stored. */}
                {costRows.map((item, i) => (
                  <li key={item.label} lang={locale === "en" ? undefined : "en"} className={COST_HUES[i % COST_HUES.length]}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, lineHeight: 1.5, color: "var(--ftp-text)" }}>
                      <span>{item.label}</span>
                      <span className="ftp-num">{item.pct}%</span>
                    </span>
                    <span aria-hidden style={{ display: "block", height: 6, borderRadius: 999, background: "var(--ftp-surface-2)", marginTop: 4, overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${Math.min(100, item.pct)}%`, background: "var(--hue)", borderRadius: 999 }} />
                    </span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}

          {showBio && (
            <Disclosure title={t("bioTitle")}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.photoUrl}
                  alt={t("photoAlt", { name: content.bioName })}
                  width={56}
                  height={56}
                  style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--ftp-border)", flexShrink: 0 }}
                />
                <div lang={locale === "en" ? undefined : "en"} style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{content.bioName}</p>
                  <p style={{ margin: "2px 0 12px", fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)" }}>{content.bioSubtitle}</p>
                  {renderBioText(content.bioText)}
                </div>
              </div>
            </Disclosure>
          )}
        </div>

        {/* ── 6. Other ways to help — one quiet line ───────────────── */}
        <nav aria-label={t("helpTitle")} className={styles.helpLine}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ftp-text-2)" }}>{t("helpTitle")}</span>
          {content.helpItems.map((item) => (
            <a
              key={item.label}
              href={item.url}
              title={item.desc}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              lang={locale === "en" ? undefined : "en"}
              style={TEXT_LINK}
            >
              {item.label}
              {item.external && <ExternalLink size={13} aria-hidden />}
            </a>
          ))}
          <FeedbackModal label={t("reportLink")} />
        </nav>
      </ModulePage>
    </main>
  );
}
