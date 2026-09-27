/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — legal notice at the bottom of the page.
 * v5: one quiet line that opens (a <details>), so the notice is one tap
 * away and does not add a long block to every visit. The legal copy is
 * unchanged. The summary is translated; the legal paragraphs are
 * English-only on purpose (their keys exist only in the English
 * messages), and other languages get a one-line note that the English
 * text is the official version.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
const PARA: React.CSSProperties = { color: "var(--ftp-text-2)", marginTop: 12 };
const hl = (c: React.ReactNode) => <span style={{ color: "var(--ftp-text)" }}>{c}</span>;

export default function LegalFooter() {
  const t = useTranslations("page_infrastructure");
  const locale = useLocale();
  return (
    <details role="note" style={{ marginTop: 24, borderTop: "1px solid var(--ftp-border)", paddingTop: 12 }}>
      <summary style={{ cursor: "pointer", minHeight: 32, display: "flex", alignItems: "center", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontWeight: 600 }}>
        {t("v5.legalSummary")}
      </summary>
      <div style={{ marginTop: 8 }}>
        {locale !== "en" && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 10 }}>
            {t("legal.englishOnly")}
          </p>
        )}
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }} lang="en">
          {t.rich("legal.p1", { hl })}
        </p>
        <p className="ftp-body" style={PARA} lang="en">{t("legal.p2")}</p>
        <p className="ftp-body" style={PARA} lang="en">{t("legal.p3")}</p>
        <p className="ftp-body" style={PARA} lang="en">{t("legal.p4")}</p>
        <p className="ftp-body" style={PARA} lang="en">{t.rich("legal.p5", { hl })}</p>
        <p className="ftp-body" style={PARA} lang="en">{t("legal.p6")}</p>
      </div>
    </details>
  );
}
