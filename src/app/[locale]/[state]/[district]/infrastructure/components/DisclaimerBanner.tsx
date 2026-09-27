/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — the data notice near the top of the page.
 * v4.1: one short line that is always visible ("From news reports, not
 * an official tracker"), with the full notice one tap away in a
 * <details>, so the answer and the numbers stay on the first phone screen.
 */

"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DisclaimerBanner() {
  const t = useTranslations("page_infrastructure");
  return (
    <details
      role="note"
      style={{
        margin: "0 0 16px",
        padding: "10px 14px",
        borderRadius: "var(--ftp-radius-card)",
        border: "1px solid var(--ftp-border)",
        background: "var(--ftp-surface)",
      }}
    >
      <summary
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 32,
          cursor: "pointer",
          fontSize: 13,
          lineHeight: "20px",
          color: "var(--ftp-text)",
          fontWeight: 500,
        }}
      >
        <Info size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{t("noticeShort")}</span>
        <span style={{ fontSize: 12, color: "var(--hue-deep)", fontWeight: 600 }}>{t("noticeMore")}</span>
      </summary>
      <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
        {t.rich("notice", { b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{c}</span> })}
      </p>
    </details>
  );
}
