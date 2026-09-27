/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Legal page building blocks — Design v4 (Disclaimer, Privacy Policy)
// ═══════════════════════════════════════════════════════════════════════
//  The clauses really are a numbered sequence, so each heading carries its
//  number in a small hue chip. Body text is 15/24 in text-2; links are the
//  page hue, bold and underlined so they read as links on a grey (slate)
//  page. Server-safe: no "use client"; the only hooks are next-intl's
//  useTranslations / useLocale, which work on both sides.
//
//  Languages: headings, navigation and buttons are translated. The long
//  legal body text stays in English for every language (the English text is
//  the binding one): pages wrap that text in <LegalBody>, which tags it
//  lang="en" on non-English pages, and <LegalEnglishNote> says so once near
//  the top of the page.

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/** One numbered clause: a heading with its number chip, then the body. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        className="ftp-display"
        style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, lineHeight: 1.4, fontWeight: 650, color: "var(--ftp-text)", margin: "0 0 10px" }}
      >
        <span
          className="ftp-icon-chip ftp-num"
          aria-hidden
          style={{ width: 30, height: 30, borderRadius: 10, fontSize: 13, color: "var(--hue-deep)" }}
        >
          {n}
        </span>
        <span>
          <span className="sr-only">{n}. </span>
          {title}
        </span>
      </h2>
      {children}
    </section>
  );
}

/**
 * Wraps English-only legal text. On a non-English page it carries
 * lang="en" so screen readers read it with an English voice.
 */
export function LegalBody({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  return <div lang={locale === "en" ? undefined : "en"}>{children}</div>;
}

/**
 * "The official version of the legal text on this page is in English."
 * Shown only on non-English pages, in the page hue, once near the top.
 */
export function LegalEnglishNote() {
  const locale = useLocale();
  const t = useTranslations("page_site");
  if (locale === "en") return null;
  return (
    <p
      role="note"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        margin: "0 0 28px",
        padding: "12px 14px",
        borderRadius: "var(--ftp-radius-card)",
        background: "var(--hue-tint)",
        border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
        fontSize: 14,
        lineHeight: 1.7,
        color: "var(--ftp-text)",
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 18 }}>🔤</span>
      <span>{t("legalEnglishNote")}</span>
    </p>
  );
}

/** Link style inside legal text. */
export const LEGAL_LINK: React.CSSProperties = {
  color: "var(--hue)",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

/** "See also" row at the bottom of a legal page: pill links, no separators. */
export function LegalSeeAlso({ links }: { links: Array<{ href: string; label: string; emoji?: string }> }) {
  const t = useTranslations("page_site");
  return (
    <nav
      aria-label={t("seeAlso")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        borderTop: "1px solid var(--ftp-border)",
        paddingTop: 16,
        marginTop: 32,
        fontSize: 13,
        color: "var(--ftp-text-2)",
      }}
    >
      <span>{t("seeAlso")}</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="ftp-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 36,
            padding: "0 12px",
            borderRadius: "var(--ftp-radius-pill)",
            border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
            background: "var(--ftp-surface)",
            color: "var(--hue-deep)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {l.emoji && <span className="ftp-emoji" aria-hidden>{l.emoji}</span>}
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
