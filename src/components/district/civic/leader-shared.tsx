/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Small shared pieces of the Leadership page: the level (tier) names and
// small line icons (v5: no emoji), the "how we checked" line, the plain-words role description, and
// the avatar. Text comes from the "page_leadership" namespace.
"use client";

import { useState } from "react";
import Image from "next/image";
import type { useTranslations } from "next-intl";
import { Building, Building2, Landmark, Map as MapIcon, Scale, Users, Vote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Leader } from "@/hooks/useRealtimeData";
import { getRoleDescriptionId, getRoleDescriptionIdForText } from "@/lib/constants/role-descriptions";
import { scriptLang } from "@/lib/utils/script-lang";

export type T = ReturnType<typeof useTranslations>;

/** One small line icon per level of government (drawn in the page hue); 6 = the courts (src/lib/civic/leader-level.ts). */
export const TIER_ICON: Record<number, LucideIcon> = { 1: Landmark, 2: MapIcon, 3: Building2, 4: Vote, 5: Building, 6: Scale };

/**
 * Top-to-bottom order for the "who is above whom" picture and the lists:
 * country → state → the MP and MLAs you vote for → district officers →
 * city and departments, then the courts (listed apart). Unknown levels
 * follow in number order.
 */
export const LEVEL_ORDER = [1, 2, 4, 3, 5, 6];
export function orderTiers(tiers: number[]): number[] {
  const known = LEVEL_ORDER.filter((t) => tiers.includes(t));
  const rest = tiers.filter((t) => !LEVEL_ORDER.includes(t)).sort((a, b) => a - b);
  return [...known, ...rest];
}

export interface TierMeta {
  label: string;
  /** Short name for the picture ("Country", "State", …). */
  short: string;
  icon: LucideIcon;
  hint: string;
}
export function tierMeta(tier: number, t: T): TierMeta {
  if (TIER_ICON[tier]) {
    return {
      label: t(`tiers.${tier}.label`),
      short: t(`tiers.${tier}.short`),
      icon: TIER_ICON[tier],
      hint: t(`tiers.${tier}.hint`),
    };
  }
  return { label: t("tiers.other.label", { n: tier }), short: t("tiers.other.short", { n: tier }), icon: Users, hint: "" };
}

/** Where a leader's record came from, and when it was last checked. */
export function leaderProvenance(
  l: { source?: string | null; lastVerifiedAt?: string | null },
  t: T,
  fmtDate: (iso: string) => string,
): string {
  let date: string | null = null;
  if (l.lastVerifiedAt && !Number.isNaN(new Date(l.lastVerifiedAt).getTime())) date = fmtDate(l.lastVerifiedAt);
  const src = (l.source ?? "").toLowerCase();
  if (src.startsWith("http")) return date ? t("provenance.newsVerified", { date }) : t("provenance.news");
  if (src.includes("manual-research")) return date ? t("provenance.researchVerified", { date }) : t("provenance.research");
  if (src.includes("seed") || src === "manual" || !src) {
    return date ? t("provenance.seedVerified", { date }) : t("provenance.seed");
  }
  return date ? t("provenance.verified", { date }) : t("provenance.pending");
}

/** "What this person does", in plain words. A description stored on the
 *  record wins; when it is the standard text for the role, its translation
 *  is shown instead. */
export function roleDescription(l: Leader, t: T): string {
  const stored = l.roleDescription?.trim() || null;
  const roleId = stored ? getRoleDescriptionIdForText(stored) : getRoleDescriptionId(l.role);
  return roleId && t.has(`roles.${roleId}`) ? t(`roles.${roleId}`) : stored ?? t("roleFallback");
}

/** The role in the reader's language when the record has it (ಜಿಲ್ಲಾಧಿಕಾರಿ on /kn/). */
export function roleText(l: Leader, locale: string, roleLocal?: string | null): { text: string; lang?: string } {
  const local = roleLocal ?? l.roleLocal;
  if (local && scriptLang(local) === locale) return { text: local, lang: scriptLang(local) };
  return { text: l.role };
}

/** Placeholder rows are stored as "[To be updated]" and shown in italics. */
export function isPlaceholderName(name: string): boolean {
  return name.trim().startsWith("[");
}

/** Photo when we have one; otherwise the person's initials on a disc in the page hue. */
export function LeaderAvatar({ name, photoUrl, size = 56 }: { name: string; photoUrl?: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = isPlaceholderName(name)
    ? "?"
    : name
        .replace(/[^\p{L}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
  const ring: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden",
    border: "2px solid color-mix(in srgb, var(--hue) 28%, #fff)",
  };
  if (photoUrl && !imgError) {
    return (
      <span style={{ ...ring, display: "block" }}>
        <Image
          src={photoUrl}
          alt=""
          width={size}
          height={size}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      style={{
        ...ring,
        background: "var(--hue-tint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--ftp-font-display)",
        fontSize: Math.round(size * 0.34),
        fontWeight: 650,
        color: "var(--hue-deep)",
      }}
    >
      {initials}
    </span>
  );
}
