/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — data transparency notice at the top of the page.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

"use client";

import { Info } from "lucide-react";

// ═══════════════════════════════════════════════════════════
// Disclaimer banner
// ═══════════════════════════════════════════════════════════

export default function DisclaimerBanner() {
  return (
    <div
      role="note"
      style={{
        background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706",
        borderRadius: 12, padding: "12px 16px", marginBottom: 20,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}
    >
      <Info size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.55 }}>
        <strong style={{ fontWeight: 700 }}>Data Transparency Notice:</strong>{" "}
        Infrastructure project data on this page is aggregated from publicly available news
        articles and government press releases. ForThePeople.in does not independently
        verify construction progress or budget figures. Each data point is linked to its
        source article. For official project status, contact the executing agency directly.
        This is not an official government tracker.
      </div>
    </div>
  );
}
