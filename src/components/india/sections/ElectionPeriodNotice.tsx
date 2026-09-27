/**
 * ElectionPeriodNotice — amber notice shown on /[locale]/india/category/governance
 * during the Model Code of Conduct (MCC) period.
 *
 * Driven by NEXT_PUBLIC_ELECTION_MODE: 'on' | 'pending' | 'off'.
 * Returns null when 'off' (no notice rendered). Text from
 * "page_india-category" (election.*).
 */

import * as React from "react";
import { useTranslations } from "next-intl";

export interface ElectionPeriodNoticeProps {
  className?: string;
}

export function ElectionPeriodNotice({ className }: ElectionPeriodNoticeProps) {
  const t = useTranslations("page_india-category");
  const mode = process.env.NEXT_PUBLIC_ELECTION_MODE;
  if (mode !== "on" && mode !== "pending") {
    return null;
  }

  return (
    <div
      className={className}
      role="note"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        background: "#FAEEDA",
        borderInlineStart: "3px solid #BA7517",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: "1rem",
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 22 }}>
        🗳️
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#633806", marginBottom: 4 }}>
          {mode === "on" ? t("election.onTitle") : t("election.pendingTitle")}
        </div>
        <p style={{ fontSize: 13, color: "#854F0B", margin: 0, lineHeight: 1.55 }}>
          {mode === "on" ? t("election.onBody") : t("election.pendingBody")}
        </p>
      </div>
    </div>
  );
}

export default ElectionPeriodNotice;
