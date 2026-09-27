/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — legal notice at the bottom of the page.
 * A plain Card with body text; the legal copy is unchanged. The heading is
 * translated; the legal paragraphs are English-only on purpose (their keys
 * exist only in the English messages), and other languages get a one-line
 * note that the English text is the official version.
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/district/ui";

const STRONG: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };
const PARA: React.CSSProperties = { color: "var(--ftp-text-2)", marginTop: 12 };
const hl = (c: React.ReactNode) => <span style={{ color: "var(--ftp-text)" }}>{c}</span>;

export default function LegalFooter() {
  const t = useTranslations("page_infrastructure");
  const locale = useLocale();
  return (
    <div role="note" style={{ marginTop: 32 }}>
      <Card>
        <p className="ftp-body" style={{ ...STRONG, marginBottom: 6 }}>
          <span className="ftp-emoji" aria-hidden>⚖️ </span>
          {t("legal.heading")}
        </p>
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
      </Card>
    </div>
  );
}
