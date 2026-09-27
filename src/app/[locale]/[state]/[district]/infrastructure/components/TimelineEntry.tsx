/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one entry in a project's news timeline.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

"use client";

import { ExternalLink } from "lucide-react";
import type { InfraUpdate } from "@/hooks/useRealtimeData";
import { UPDATE_TYPE_LABEL, formatFullDate, formatINR, statusStyle } from "./infra-utils";

// ═══════════════════════════════════════════════════════════
// Timeline + lazy analysis
// ═══════════════════════════════════════════════════════════

export default function TimelineEntry({ u }: { u: InfraUpdate }) {
  const type = UPDATE_TYPE_LABEL[u.updateType] ?? u.updateType;
  const accent = u.updateType.startsWith("BUDGET") ? "#D97706"
    : u.updateType === "DELAY" || u.updateType === "STALL" || u.updateType === "CANCELLATION" ? "#DC2626"
    : u.updateType === "COMPLETION" || u.updateType === "PHASE_COMPLETE" || u.updateType === "INAUGURATION" ? "#16A34A"
    : u.updateType === "CONTROVERSY" ? "#B45309"
    : u.updateType === "ADMIN_EDIT" ? "#7C3AED"
    : "#2563EB";

  return (
    <div style={{ position: "relative", padding: "12px 0 12px 22px", borderLeft: "2px solid #E8E8E4", marginLeft: 6 }}>
      <span
        style={{
          position: "absolute", left: -7, top: 16, width: 12, height: 12, borderRadius: "50%",
          background: accent, border: "2px solid #FFF", boxShadow: `0 0 0 2px ${accent}40`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{formatFullDate(u.date)}</span>
        <span
          style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            background: `${accent}15`, color: accent, textTransform: "uppercase",
          }}
        >
          {type}
        </span>
        {u.verified && <span title="Verified by the news-extraction AI verifier" style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>✓ verified</span>}
      </div>
      <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{u.headline}</div>
      {u.summary && u.summary !== u.headline && (
        <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6, lineHeight: 1.5 }}>{u.summary}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#6B7280" }}>
        {u.personName && (
          <span>👤 {u.personName}{u.personRole ? ` — ${u.personRole}` : ""}{u.personParty ? ` (${u.personParty})` : ""}</span>
        )}
        {u.progressPct != null && <span>📊 {u.progressPct}% complete</span>}
        {u.budgetChange != null && <span>💰 {formatINR(u.budgetChange)}</span>}
        {u.statusChange && <span>↪ {statusStyle(u.statusChange).label}</span>}
      </div>
      {u.newsUrl && u.newsUrl !== "admin-panel" && (
        <a
          href={u.newsUrl.startsWith("http") ? u.newsUrl : `https://${u.newsUrl}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: "#2563EB", textDecoration: "none" }}
        >
          {u.newsSource ?? "Source"}{u.newsTitle ? ` · ${u.newsTitle.slice(0, 80)}${u.newsTitle.length > 80 ? "…" : ""}` : ""}
          <ExternalLink size={10} />
        </a>
      )}
      {u.newsUrl === "admin-panel" && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#7C3AED", fontStyle: "italic" }}>
          Source: Admin edit (manual update)
        </div>
      )}
    </div>
  );
}
