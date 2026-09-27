/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PlainPageHeader — the calm (v5) header for site pages
// ═══════════════════════════════════════════════════════════════════════
//
//     ← Back to ForThePeople.in
//     Title                                   (one <h1>, page type)
//     One or two plain sentences.
//     [children: a row of small links or chips]
//
//  No coloured band, no emoji, no watermark: the owner asked for a calm,
//  minimal look where the content starts straight away. Used by /support,
//  /prices and /contributors. Server-safe (no "use client"); its only hook
//  is next-intl's useTranslations, which works on the server and client.

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

export default function PlainPageHeader({
  title,
  description,
  backHref,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("page_site");
  return (
    <header style={{ margin: "8px 0 24px" }}>
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 44,
            fontSize: 14,
            lineHeight: "20px",
            color: "var(--ftp-text-2)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} aria-hidden />
          {t("backHome")}
        </Link>
      )}
      <h1 className="ftp-h1" style={{ margin: "4px 0 0" }}>
        {title}
      </h1>
      {description && (
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ftp-text-2)", margin: "8px 0 0", maxWidth: "68ch" }}>{description}</p>
      )}
      {children && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 16 }}>{children}</div>}
    </header>
  );
}
