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
//  page. Server-safe: no hooks, no "use client".

import Link from "next/link";

/** One numbered clause: a heading with its number chip, then the body. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        className="ftp-display"
        style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, lineHeight: "26px", fontWeight: 650, color: "var(--ftp-text)", margin: "0 0 10px" }}
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

/** Link style inside legal text. */
export const LEGAL_LINK: React.CSSProperties = {
  color: "var(--hue)",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: 2,
};

/** "See also" row at the bottom of a legal page: pill links, no separators. */
export function LegalSeeAlso({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <nav
      aria-label="See also"
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
      <span>See also</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="ftp-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 32,
            padding: "0 12px",
            borderRadius: "var(--ftp-radius-pill)",
            border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
            background: "var(--ftp-surface)",
            color: "var(--hue-deep)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
