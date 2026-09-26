/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function BadgeExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "#FAFAF8",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        marginBottom: 24,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#6B6B6B",
          textAlign: "left",
        }}
      >
        <span>ℹ️ How badges & tiers work</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", fontSize: 13, color: "#4B4B4B", lineHeight: 1.8 }}>
          <div style={{ fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>CONTRIBUTION TIERS:</div>
          <div>☕ <strong>Buy me a Chai</strong> — One-time from ₹50</div>
          <div>🏛️ <strong>District Champion</strong> — ₹200/month · Your name on the district page</div>
          <div>🇮🇳 <strong>State Champion</strong> — ₹999/month · Your name on all districts in a state</div>
          <div>🌟 <strong>All-India Patron</strong> — ₹10,000/month · Your name on every page</div>
          <div>👑 <strong>Founding Builder</strong> — ₹50,000/month · Gold card everywhere, listed first, permanent feature</div>

          <div style={{ fontWeight: 700, color: "#1A1A1A", marginTop: 16, marginBottom: 6 }}>BADGE LEVELS (earned automatically by continuous support):</div>
          <div>🥉 <strong>Bronze</strong> — 3+ months of continuous support</div>
          <div>🥈 <strong>Silver</strong> — 6+ months</div>
          <div>🥇 <strong>Gold</strong> — 12+ months</div>
          <div>💎 <strong>Platinum</strong> — 24+ months</div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#9B9B9B" }}>
            The longer you support, the higher your badge. Badges are shown next to your name on the leaderboard and contributor pages.
          </div>
        </div>
      )}
    </div>
  );
}
