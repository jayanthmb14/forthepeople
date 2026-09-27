/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one entry in a project's news timeline.
 * Design v3: a 1 px rail with a small flat dot in the update's tone, the
 * type as a kit Pill, Lucide icons for the facts row, dates in mono.
 */

"use client";

import { BarChart3, CheckCircle2, CornerDownRight, ExternalLink, IndianRupee, User } from "lucide-react";
import type { InfraUpdate } from "@/hooks/useRealtimeData";
import { Pill } from "@/components/district/ui";
import { TONE_SOLID, UPDATE_TYPE_LABEL, formatFullDate, formatINR, statusStyle, updateTone } from "./infra-utils";

/** One fact in the row under the headline: small icon + text. */
function FactItem({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Icon size={12} aria-hidden />
      {children}
    </span>
  );
}

export default function TimelineEntry({ u }: { u: InfraUpdate }) {
  const type = UPDATE_TYPE_LABEL[u.updateType] ?? u.updateType;
  const tone = updateTone(u.updateType);

  return (
    <div style={{ position: "relative", padding: "12px 0 12px 20px", borderLeft: "1px solid var(--ftp-border)", marginLeft: 4 }}>
      <span
        aria-hidden
        style={{
          position: "absolute", left: -4, top: 18, width: 7, height: 7, borderRadius: "50%",
          background: TONE_SOLID[tone],
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <span className="ftp-num" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{formatFullDate(u.date)}</span>
        <Pill tone={tone}>{type}</Pill>
        {u.verified && (
          <span
            title="Verified by the news-extraction AI verifier"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-live-text)" }}
          >
            <CheckCircle2 size={12} aria-hidden /> verified
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: 500, marginBottom: 4 }}>{u.headline}</div>
      {u.summary && u.summary !== u.headline && (
        <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 6 }}>{u.summary}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {u.personName && (
          <FactItem icon={User}>
            {u.personName}{u.personRole ? ` — ${u.personRole}` : ""}{u.personParty ? ` (${u.personParty})` : ""}
          </FactItem>
        )}
        {u.progressPct != null && (
          <FactItem icon={BarChart3}>
            <span className="ftp-num">{u.progressPct}%</span> complete
          </FactItem>
        )}
        {u.budgetChange != null && (
          <FactItem icon={IndianRupee}>
            <span className="ftp-num">{formatINR(u.budgetChange)}</span>
          </FactItem>
        )}
        {u.statusChange && <FactItem icon={CornerDownRight}>{statusStyle(u.statusChange).label}</FactItem>}
      </div>
      {u.newsUrl && u.newsUrl !== "admin-panel" && (
        <a
          href={u.newsUrl.startsWith("http") ? u.newsUrl : `https://${u.newsUrl}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}
        >
          {u.newsSource ?? "Source"}{u.newsTitle ? `: ${u.newsTitle.slice(0, 80)}${u.newsTitle.length > 80 ? "…" : ""}` : ""}
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
      {u.newsUrl === "admin-panel" && (
        <div style={{ marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-features)" }}>
          Source: Admin edit (manual update)
        </div>
      )}
    </div>
  );
}
