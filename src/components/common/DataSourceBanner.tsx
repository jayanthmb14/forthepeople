/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  DataSourceBanner — "where this data comes from" line (Design v3)
// ═══════════════════════════════════════════════════════════
//
//  Used by ~30 module pages, so the PROPS CONTRACT IS UNCHANGED:
//    moduleName       (kept for callers; not shown)
//    sources          list of source names → one SourcePill each
//    lastUpdated      ISO timestamp → kit FreshnessPill ("Updated 2h ago",
//                     "As of 12 Sep"); nothing when missing
//    updateFrequency  plain text, e.g. "Daily"
//    isLive           kept for callers. It no longer paints a "LIVE"
//                     badge by itself: the FreshnessPill only says the
//                     data is live when `lastUpdated` is under 30 minutes
//                     old (honesty rule, CONCEPT-v3 §2.5).
//
//  Look: a quiet row on the page background — no left stripe, no tint.

import { Info } from "lucide-react";
import { FreshnessPill, SourcePill } from "@/components/district/ui";

interface DataSourceBannerProps {
  moduleName: string;
  sources: string[];
  lastUpdated?: string | null;
  updateFrequency: string;
  isLive?: boolean;
}

export default function DataSourceBanner({ sources, lastUpdated, updateFrequency }: DataSourceBannerProps) {
  return (
    <div
      role="note"
      aria-label="Data sources"
      style={{
        padding: "10px 0",
        marginBottom: 16,
        borderBottom: "1px solid var(--ftp-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Info size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
        <span className="ftp-label">Source</span>
        {sources.map((s) => (
          <SourcePill key={s} label={s} />
        ))}
        {lastUpdated && <FreshnessPill asOf={lastUpdated} />}
        <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
          Update frequency: {updateFrequency}
        </span>
      </div>
      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: "6px 0 0" }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government portals under India&apos;s Open Data Policy (NDSAP).
      </p>
    </div>
  );
}
