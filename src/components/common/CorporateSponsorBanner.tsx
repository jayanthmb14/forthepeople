/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  CorporateSponsorBanner — "Sponsor this district" invitation for
//  businesses (shown on the contributors page). Design v3: a plain kit
//  Card with a title, one sentence and two quiet contact buttons
//  (email + Instagram). No gradient, no dashed border, no emoji.
// ═══════════════════════════════════════════════════════════

import { AtSign, Building2, Mail } from "lucide-react";
import { Card, ToolbarButton } from "@/components/district/ui";

interface Props {
  districtName: string;
  population?: number | null;
}

/** "18.1 lakh citizens" / "1.2 crore citizens" / "every citizen". */
function formatPop(pop: number | null | undefined): string {
  if (!pop || pop <= 0) return "every citizen";
  if (pop >= 10_000_000) return `${(pop / 10_000_000).toFixed(1)} crore citizens`;
  if (pop >= 100_000) return `${(pop / 100_000).toFixed(1)} lakh citizens`;
  return `${pop.toLocaleString("en-IN")} citizens`;
}

export default function CorporateSponsorBanner({ districtName, population }: Props) {
  const popText = formatPop(population);
  return (
    <Card as="section" padding={20} aria-labelledby="ftp-corporate-sponsor" style={{ marginBottom: 24 }}>
      <p className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Building2 size={14} aria-hidden />
        Sponsor this district
      </p>

      <h2 id="ftp-corporate-sponsor" className="ftp-title" style={{ marginBottom: 4 }}>
        Want to showcase your business to {districtName}&apos;s citizens?
      </h2>
      <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 14 }}>
        Display your brand banner on this page and support free government data for{" "}
        <span style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{popText}</span>.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <ToolbarButton icon={Mail} href="mailto:support@forthepeople.in?subject=Corporate%20Sponsorship%20Enquiry">
          support@forthepeople.in
        </ToolbarButton>
        <ToolbarButton icon={AtSign} href="https://www.instagram.com/forthepeople_in/" external>
          forthepeople_in
        </ToolbarButton>
      </div>

      <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
        Open to all Indian businesses — private, public, or startups.
        <br />
        Pricing discussed individually based on district reach and duration.
      </p>
    </Card>
  );
}
