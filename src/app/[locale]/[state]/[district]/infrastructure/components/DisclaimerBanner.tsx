/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — data transparency notice at the top of the page.
 * Design v3: a plain Card; the only colour is the warn-coloured icon.
 */

"use client";

import { Info } from "lucide-react";
import { Card } from "@/components/district/ui";

export default function DisclaimerBanner() {
  return (
    <div role="note" style={{ marginBottom: 20 }}>
      <Card padding={14}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
            <span style={{ fontWeight: 500, color: "var(--ftp-text)" }}>Data Transparency Notice:</span>{" "}
            Infrastructure project data on this page is aggregated from publicly available news
            articles and government press releases. ForThePeople.in does not independently
            verify construction progress or budget figures. Each data point is linked to its
            source article. For official project status, contact the executing agency directly.
            This is not an official government tracker.
          </p>
        </div>
      </Card>
    </div>
  );
}
