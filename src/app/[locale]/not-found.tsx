/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// 404 inside a language (/kn/…): same page as app/not-found.tsx, but it
// renders inside the locale layout, so the header, footer and text follow
// the reader's language.
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function LocaleNotFound() {
  const t = useTranslations("errors");
  const locale = useLocale();
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div className="ftp-pop ftp-emoji" aria-hidden style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
        🧭
      </div>
      <p className="ftp-bignum" style={{ margin: 0, fontSize: 64, lineHeight: 1, color: "#D2CFC4" }}>
        404
      </p>
      <h1 className="ftp-display" style={{ margin: "12px 0 8px", fontSize: 30, lineHeight: 1.2, fontWeight: 700, color: "var(--ftp-text)", textWrap: "balance" }}>
        {t("notFoundTitle")}
      </h1>
      <p style={{ margin: "0 0 28px", fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", maxWidth: 440 }}>{t("notFoundBody")}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/${locale}`} className="ftp-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", color: "#FFF", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
          <span aria-hidden>🏠</span> {t("home")}
        </Link>
        <Link href={`/${locale}/vote-district`} style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", background: "#fff", color: "var(--ftp-text)", border: "1px solid var(--ftp-border-strong)", borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
          <span aria-hidden>🗳️</span> {t("vote")}
        </Link>
      </div>
    </div>
  );
}
