/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ModulePageFooter — the end of every Accountability module page
// ═══════════════════════════════════════════════════════════════════════
//
//  Design v3 ("Civic Ledger", CONCEPT-v3 §5 "Module page") says every
//  module page ends the same way:
//
//    1. SourcesFooter  — the list of official sources (from getModuleSources)
//    2. the "not an official government website" line (legal text, kept
//       word for word from the old DataSourceBanner)
//    3. Toolbar        — Share + Compare with another district (+ CSV when
//       the page passes one in through `actions`)
//
//  Used only by the police, courts, rti, file-rti, gram-panchayat,
//  update-log, data-sources and tenders pages. Everything here is built
//  from the shared kit in src/components/district/ui.tsx, so it has no
//  colours or sizes of its own.
"use client";

import { useState } from "react";
import { Share2, GitCompare, Check } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton, type SourceEntry } from "@/components/district/ui";
import { getModuleSources } from "@/lib/constants/state-config";

export default function ModulePageFooter({
  moduleSlug,
  locale,
  state,
  district,
  extraSources = [],
  actions,
  showCompare = true,
}: {
  /** Module slug, e.g. "courts". Picks the source list and the compare link. */
  moduleSlug: string;
  locale: string;
  state: string;
  district: string;
  /** Extra source lines (with links) added after the registry ones. */
  extraSources?: SourceEntry[];
  /** Extra toolbar buttons, e.g. a CSV download. */
  actions?: React.ReactNode;
  /** Hide the Compare button on pages where comparing makes no sense. */
  showCompare?: boolean;
}) {
  // Registry sources (names only) + how often each one refreshes.
  const info = getModuleSources(moduleSlug, state);
  const sources: SourceEntry[] = [
    ...info.sources.map((name) => ({ name, frequency: info.frequency })),
    ...extraSources,
  ];

  // "Share" uses the phone's share sheet when there is one, otherwise it
  // copies the page link and says so for two seconds.
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visitor closed the share sheet, or the clipboard is blocked.
      // Nothing to do — the address bar still has the link.
    }
  }

  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;

  return (
    <>
      <SourcesFooter sources={sources} />
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 12 }}>
        ForThePeople.in is NOT an official government website. Data aggregated from publicly available government
        portals under India&apos;s Open Data Policy (NDSAP).
      </p>
      <Toolbar>
        {actions}
        <ToolbarButton icon={copied ? Check : Share2} onClick={share} ariaLabel="Share this page">
          {copied ? "Link copied" : "Share"}
        </ToolbarButton>
        {showCompare && (
          <ToolbarButton icon={GitCompare} href={compareHref}>
            Compare with another district
          </ToolbarButton>
        )}
      </Toolbar>
    </>
  );
}
