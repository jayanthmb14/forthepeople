/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  BadgeExplainer — "How badges and tiers work"
// ═══════════════════════════════════════════════════════════════════════
//
//  Used on /contributors and on each district's contributors page.
//
//  Design v4.1: the badge ladder is a picture that is always visible
//  (🥉 3 months → 🥈 6 → 🥇 12 → 💎 24, the kit's HowItWorks steps), so a
//  child can see how a badge is earned without opening anything. The five
//  contribution tiers (emoji, name, price, one line) sit behind one
//  "Show the tiers and prices" button. Tier names and prices are read from
//  TIER_CONFIG (the same config the checkout uses) so this list can never
//  disagree with what a supporter is actually charged; the tier names and
//  one-liners are the translated ones from "page_support".
//  Text: "page_site.badges" messages. Colour: the surrounding page hue.
//
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { HowItWorks } from "@/components/district/visuals";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";
import { getPlatformFacts } from "@/lib/platform-facts";
import { useFormat } from "@/i18n/client";

/**
 * Badge level → Pill tone. Shared with the contributor lists so a badge
 * looks the same everywhere. (The v2 hex set lives in lib/badge-level.ts
 * as BADGE_COLORS and is no longer used by v3 pages.)
 */
export const BADGE_TONE: Record<string, Tone> = {
  bronze: "warn",
  silver: "neutral",
  gold: "warn",
  platinum: "features",
};

/** Badge levels, the months of continuous support that earn them, and their emoji. */
const BADGE_LEVELS: { key: string; months: number; emoji: string }[] = [
  { key: "bronze", months: 3, emoji: "🥉" },
  { key: "silver", months: 6, emoji: "🥈" },
  { key: "gold", months: 12, emoji: "🥇" },
  { key: "platinum", months: 24, emoji: "💎" },
];

const { totalIndiaDistricts, modulesPerDistrict } = getPlatformFacts();

export default function BadgeExplainer() {
  const t = useTranslations("page_site");
  const ts = useTranslations("page_support");
  const { number } = useFormat();
  const [open, setOpen] = useState(false);
  const inr = (n: number) => `₹${number(n)}`;
  // Values for the patron tier's sentence (the support page passes the same).
  const tierValues = { districts: number(totalIndiaDistricts), dashboards: number(totalIndiaDistricts * modulesPerDistrict) };
  const tierText = (key: string, part: "name" | "desc", fallback: string) =>
    ts.has(`tier_${key}_${part}`) ? ts(`tier_${key}_${part}`, tierValues) : fallback;

  return (
    <Card padding={18} style={{ marginBottom: 24 }}>
      <h2 className="ftp-display" style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10, fontSize: 18, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
          🏅
        </span>
        {t("badges.title")}
      </h2>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 14, margin: "0 0 14px" }}>{t("badges.simple")}</p>

      {/* The ladder: always visible. */}
      <HowItWorks
        title={t("badges.ladderTitle")}
        steps={BADGE_LEVELS.map((b) => ({
          emoji: b.emoji,
          title: t(`badges.level_${b.key}`),
          body: t("badges.months", { n: b.months }),
        }))}
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="badge-explainer-tiers"
        className="ftp-btn ftp-btn-secondary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          marginTop: 14,
          padding: "0 14px",
          background: "var(--ftp-surface)",
          border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
          borderRadius: "var(--ftp-radius-tile)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--hue-deep)",
        }}
      >
        <span className="ftp-emoji" aria-hidden>💳</span>
        {open ? t("badges.hideTiers") : t("badges.showTiers")}
        {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
      </button>

      {open && (
        <ul
          id="badge-explainer-tiers"
          className="ftp-grid"
          style={{ listStyle: "none", margin: "12px 0 0", padding: 0, gap: 10, ["--ftp-grid-min" as string]: "220px" } as React.CSSProperties}
        >
          {TIER_ORDER.map((key) => {
            const tier = TIER_CONFIG[key];
            return (
              <li
                key={key}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: 12,
                  borderRadius: 14,
                  background: "var(--hue-tint)",
                  border: "1px solid color-mix(in srgb, var(--hue) 20%, transparent)",
                }}
              >
                <span className="ftp-emoji" aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>{tier.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, lineHeight: 1.4, fontWeight: 650, color: "var(--hue-deep)" }}>
                    {tierText(key, "name", tier.name)}
                  </span>
                  <span className="ftp-num" style={{ display: "block", fontSize: 13, lineHeight: 1.45, color: "var(--ftp-text)" }}>
                    {tier.isRecurring ? t("badges.perMonth", { amount: inr(tier.amount) }) : t("badges.oneTimeFrom", { amount: inr(tier.minAmount) })}
                  </span>
                  <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 2 }}>
                    {tierText(key, "desc", tier.description)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
