/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// TenderCard — one tender in the district tender list (Design v4).
//
//   [AUTHORITY] [Category]  Taluk, District
//   Title (two lines max)
//   ₹ value (hue-deep)  [MSE-reserved] [Startup-eligible] [Status]
//   Deadline pill (dot colour = urgency)  published  corrigenda  flags
//
// v4: the authority code, MSE and startup tags are chips in the module hue
// (--hue-tint / --hue-deep); status and deadline keep their semantic
// tones. No coloured stripe, no pulsing. The card lifts 2 px on hover
// because it is a link (.ftp-card-link).
"use client";

import Link from "next/link";
import type React from "react";
import { Flag, MapPin } from "lucide-react";
import { Pill, type Tone } from "@/components/district/ui";
import { formatInr } from "@/lib/tenders/format";
import { ageInDays } from "@/lib/utils/timeAgo";
import CountdownTimer from "./CountdownTimer";

export type TenderCardData = {
  id: string;
  title: string;
  authority: { name: string; shortCode: string; authorityType: string };
  category: { name: string; slug: string } | null;
  locationDistrict: string;
  locationTaluk: string | null;
  estimatedValueInr: string | null; // serialised BigInt
  status: string;
  bidSubmissionEnd: string; // ISO
  publishedAt: string;
  mseReserved: boolean;
  startupExempt: boolean;
  redFlags: { flagType: string; factualStatement: string }[];
  _count: { corrigenda: number; documents: number };
};

/** Tender status → citizen label + pill tone. Exported for the detail page. */
export const STATUS_STYLE: Record<string, { tone: Tone; label: string }> = {
  OPEN_FOR_BIDS:       { tone: "live",     label: "Open" },
  PUBLISHED:           { tone: "brand",    label: "Published" },
  BID_CLOSED:          { tone: "neutral",  label: "Closed" },
  UNDER_EVALUATION:    { tone: "warn",     label: "Under evaluation" },
  AWARDED:             { tone: "live",     label: "Awarded" },
  CANCELLED:           { tone: "danger",   label: "Cancelled" },
  RETENDERED:          { tone: "features", label: "Re-tendered" },
  COMPLETED:           { tone: "live",     label: "Completed" },
  NO_BID:              { tone: "neutral",  label: "No bid received" },
};

/**
 * Deadline urgency — computed client-side from bidSubmissionEnd.
 *   >7d  : green   (ample time)
 *   2–7d : amber   (approaching)
 *   <48h : red     (urgent)
 *   past : grey, dimmed (closed)
 * Rendered as the dot colour of the deadline Pill, plus an aria label.
 */
function deadlineUrgency(deadlineIso: string): {
  tone: Tone;
  dimmed: boolean;
  ariaLabel: string;
} {
  const msLeft = new Date(deadlineIso).getTime() - Date.now();
  const daysLeft = msLeft / 86400_000;
  if (msLeft <= 0) {
    return { tone: "neutral", dimmed: true, ariaLabel: "Deadline has passed" };
  }
  if (daysLeft < 2) {
    return { tone: "danger", dimmed: false, ariaLabel: `Deadline in ${Math.max(1, Math.round(daysLeft * 24))} hours (urgent)` };
  }
  if (daysLeft < 7) {
    return { tone: "warn", dimmed: false, ariaLabel: `Deadline in ${Math.ceil(daysLeft)} days (approaching)` };
  }
  return { tone: "live", dimmed: false, ariaLabel: `Deadline in ${Math.ceil(daysLeft)} days (ample time)` };
}

/** A small tag in the module hue (authority code, MSE, startup). */
function HueTag({ children, outline }: { children: React.ReactNode; outline?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 8px",
        borderRadius: "var(--ftp-radius-pill)",
        background: outline ? "var(--ftp-surface)" : "var(--hue-tint)",
        border: `1px solid ${outline ? "color-mix(in srgb, var(--hue) 35%, var(--ftp-border))" : "transparent"}`,
        color: "var(--hue-deep)",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function TenderCard({ tender, districtSlug, stateSlug, locale }: { tender: TenderCardData; districtSlug: string; stateSlug: string; locale: string }) {
  const status = STATUS_STYLE[tender.status] ?? { tone: "neutral" as Tone, label: tender.status };
  const flagCount = tender.redFlags.length;
  // Whole days since the tender was published (shared helper, IST-safe).
  const publishedDaysAgo = Math.floor(ageInDays(tender.publishedAt) ?? 0);
  const urgency = deadlineUrgency(tender.bidSubmissionEnd);
  const href = `/${locale}/${stateSlug}/${districtSlug}/tenders/${tender.id}`;

  return (
    <Link
      href={href}
      aria-label={`${tender.title}. ${urgency.ariaLabel}`}
      className="ftp-card-link"
      style={{
        display: "block",
        border: "1px solid var(--ftp-border)",
        background: "var(--ftp-surface)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: 16,
        textDecoration: "none",
        color: "inherit",
        opacity: urgency.dimmed ? 0.65 : 1,
        minWidth: 0,
      }}
    >
      {/* Line 1: dept + category + location */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <HueTag>{tender.authority.shortCode}</HueTag>
        {tender.category && <Pill>{tender.category.name}</Pill>}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          <MapPin size={12} aria-hidden style={{ color: "var(--hue)" }} />
          {tender.locationTaluk ? `${tender.locationTaluk}, ` : ""}{tender.locationDistrict}
        </span>
      </div>

      {/* Line 2: title */}
      <h3
        className="ftp-title"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {tender.title}
      </h3>

      {/* Line 3: value + MSE/Startup chips + status */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <span className="ftp-num ftp-display" style={{ fontSize: 17, color: "var(--hue-deep)" }}>{formatInr(tender.estimatedValueInr)}</span>
        {tender.mseReserved && <HueTag>MSE-reserved</HueTag>}
        {tender.startupExempt && <HueTag outline>Startup-eligible</HueTag>}
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>

      {/* Line 4: deadline + timing + corrigendum + flag counts */}
      <div style={{ display: "flex", columnGap: 12, rowGap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        <Pill tone={urgency.tone} dot>
          Closes in <CountdownTimer deadline={tender.bidSubmissionEnd} compact />
        </Pill>
        <span suppressHydrationWarning>
          Published <span className="ftp-num">{publishedDaysAgo}d</span> ago
        </span>
        {tender._count.corrigenda > 0 && (
          <span style={{ color: "var(--ftp-warn)" }}>
            <span className="ftp-num">{tender._count.corrigenda}</span> corrigendum{tender._count.corrigenda > 1 ? "a" : ""}
          </span>
        )}
        {flagCount > 0 && (
          <span style={{ color: "var(--ftp-danger)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Flag size={12} aria-hidden /> <span className="ftp-num">{flagCount}</span> flag{flagCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
