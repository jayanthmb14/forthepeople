/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — where the facts come from (v5).
 * One quiet line that is always visible ("From news reports and
 * government press releases, each linked to its source"), with the full
 * notice one tap away in a <details>. The "not an official website" line
 * lives once in the district's verification panel, not here.
 */

"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DisclaimerBanner() {
  const t = useTranslations("page_infrastructure");
  return (
    <details role="note" style={{ margin: "16px 0 0" }}>
      <summary
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 32,
          cursor: "pointer",
          fontSize: 13,
          lineHeight: "20px",
          color: "var(--ftp-text-2)",
        }}
      >
        <Info size={15} aria-hidden style={{ color: "var(--hue-deep)", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{t("noticeShort")}</span>
        <span style={{ fontSize: 12, color: "var(--hue-deep)", fontWeight: 600 }}>{t("noticeMore")}</span>
      </summary>
      <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", marginTop: 8 }}>
        {t.rich("notice", { b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{c}</span> })}
      </p>
    </details>
  );
}
