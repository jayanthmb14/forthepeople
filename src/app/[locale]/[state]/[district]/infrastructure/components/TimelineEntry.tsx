/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one entry in a project's news timeline.
 * A 1 px rail with a small flat dot in the update's tone, the type as a
 * kit Pill, Lucide icons for the facts row, dates in the reader's
 * language. Headlines and summaries stay as the news source wrote them.
 */

"use client";

import { BarChart3, CheckCircle2, CornerDownRight, ExternalLink, IndianRupee, User } from "lucide-react";
import type { InfraUpdate } from "@/hooks/useRealtimeData";
import { Pill } from "@/components/district/ui";
import { TONE_SOLID, updateTone } from "./infra-utils";
import { useInfraText } from "./infra-i18n";

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
  const { t, fullDate, inr, updateType, status } = useInfraText();
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
        <span className="ftp-num" style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{fullDate(u.date)}</span>
        <Pill tone={tone}>{updateType(u.updateType)}</Pill>
        {u.verified && (
          <span
            title={t("timeline.verifiedHint")}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, lineHeight: "16px", color: "var(--ftp-live-text)" }}
          >
            <CheckCircle2 size={12} aria-hidden /> {t("timeline.verified")}
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
            {u.personName}{u.personRole ? `, ${u.personRole}` : ""}{u.personParty ? ` (${u.personParty})` : ""}
          </FactItem>
        )}
        {u.progressPct != null && (
          <FactItem icon={BarChart3}>
            {t("timeline.complete", { pct: u.progressPct })}
          </FactItem>
        )}
        {u.budgetChange != null && (
          <FactItem icon={IndianRupee}>
            <span className="ftp-num">{inr(u.budgetChange)}</span>
          </FactItem>
        )}
        {u.statusChange && <FactItem icon={CornerDownRight}>{status(u.statusChange)}</FactItem>}
      </div>
      {u.newsUrl && u.newsUrl !== "admin-panel" && (
        <a
          href={u.newsUrl.startsWith("http") ? u.newsUrl : `https://${u.newsUrl}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--hue-deep)", fontWeight: 600, textDecoration: "none" }}
        >
          {u.newsSource ?? t("timeline.source")}{u.newsTitle ? `: ${u.newsTitle.slice(0, 80)}${u.newsTitle.length > 80 ? "…" : ""}` : ""}
          <ExternalLink size={12} aria-hidden />
        </a>
      )}
      {u.newsUrl === "admin-panel" && (
        <div style={{ marginTop: 6, fontSize: 11, lineHeight: "16px", color: "var(--ftp-features)" }}>
          {t("timeline.adminEdit")}
        </div>
      )}
    </div>
  );
}
