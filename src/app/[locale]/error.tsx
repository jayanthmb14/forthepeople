/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Error boundary inside a language: renders within the locale layout (no
// <html>/<body>), so the message follows the reader's language.
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  const tk = useTranslations("kit");
  const locale = useLocale();
  return (
    <div role="alert" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div className="ftp-pop ftp-emoji" aria-hidden style={{ fontSize: 64, lineHeight: 1, marginBottom: 12 }}>
        🛠️
      </div>
      <h1 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1.2, fontWeight: 700, color: "var(--ftp-text)", textWrap: "balance" }}>
        {t("errorTitle")}
      </h1>
      <p style={{ margin: "0 0 8px", fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", maxWidth: 440 }}>{t("errorBody")}</p>
      {error.digest && (
        <p className="ftp-num" style={{ margin: "0 0 20px", fontSize: 12, color: "var(--ftp-text-2)" }}>
          {t("errorId", { id: error.digest })}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" onClick={reset} className="ftp-btn-primary" style={{ height: 44, padding: "0 20px", color: "#FFF", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ftp-font-sans)" }}>
          {tk("tryAgain")}
        </button>
        <Link href={`/${locale}`} style={{ display: "inline-flex", alignItems: "center", height: 44, padding: "0 20px", background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border-strong)", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
