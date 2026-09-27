/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  BadgeExplainer — "How badges & tiers work" (collapsible)
// ═══════════════════════════════════════════════════════════════════════
//
//  Used on /contributors and on each district's contributors page.
//
//  Design v3: a plain Card with a real <button> toggle, Lucide icons,
//  badge levels as Pills (no emoji). Tier names and prices are read from
//  TIER_CONFIG (the same config the checkout uses) so this list can never
//  disagree with what a supporter is actually charged.
//
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, Pill } from "@/components/district/ui";
import type { Tone } from "@/components/district/ui";
import { TIER_CONFIG, TIER_ORDER } from "@/lib/constants/razorpay-plans";

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

/** Badge levels and the continuous-support months that earn them. */
const BADGE_LEVELS = [
  { key: "bronze", label: "Bronze", rule: "3+ months of continuous support" },
  { key: "silver", label: "Silver", rule: "6+ months" },
  { key: "gold", label: "Gold", rule: "12+ months" },
  { key: "platinum", label: "Platinum", rule: "24+ months" },
];

export default function BadgeExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="badge-explainer-body"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          minHeight: 44,
          padding: "0 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ftp-text)",
          textAlign: "left",
        }}
      >
        <Info size={16} aria-hidden style={{ color: "var(--ftp-brand)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>How badges &amp; tiers work</span>
        {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
      </button>

      {open && (
        <div id="badge-explainer-body" style={{ padding: "0 16px 16px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          <p className="ftp-label" style={{ marginBottom: 6 }}>Contribution tiers</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {TIER_ORDER.map((key) => {
              const t = TIER_CONFIG[key];
              return (
                <li key={key}>
                  <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{t.name}</span> —{" "}
                  {t.isRecurring ? "" : "One-time from "}
                  <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>
                    ₹{(t.isRecurring ? t.amount : t.minAmount).toLocaleString("en-IN")}
                  </span>
                  {t.isRecurring ? "/month" : ""}
                  <span style={{ display: "block", fontSize: 11, lineHeight: "16px" }}>{t.description}</span>
                </li>
              );
            })}
          </ul>

          <p className="ftp-label" style={{ marginTop: 16, marginBottom: 6 }}>
            Badge levels (earned automatically by continuous support)
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {BADGE_LEVELS.map((b) => (
              <li key={b.key} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Pill tone={BADGE_TONE[b.key]}>{b.label}</Pill>
                <span>{b.rule}</span>
              </li>
            ))}
          </ul>

          <p style={{ marginTop: 12, fontSize: 11, lineHeight: "16px" }}>
            The longer you support, the higher your badge. Badges are shown next to your name on the leaderboard and contributor pages.
          </p>
        </div>
      )}
    </Card>
  );
}
