/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Money-group list pieces (schemes, projects, tenders, industries)
// ═══════════════════════════════════════════════════════════════════════
//  TapCard      a whole card that is one big button: tapping it opens the
//               item's DetailSheet (docs/LAYOUT.md, recipe step 5). It
//               lifts 2 px on hover like a link card, has a visible focus
//               ring, and is never shorter than 44 px.
//  CardHead     the emoji chip + title (+ local-script name) row at the
//               top of a TapCard.
//  HueTag       a small pill in the module hue ("All India", "MSE").
//  SheetHighlight  the big "what you get" box at the top of a sheet.
//  SheetSection    a small heading + content block inside a sheet.
//  sourceParts  splits a stored source ("Publication | https://…") into a
//               name and a link.
//  Every word comes from the page (already translated); these pieces add
//  none of their own except the "details" hint passed in by the caller.
"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { scriptLang } from "@/lib/utils/script-lang";

export function TapCard({
  onOpen,
  ariaLabel,
  more,
  dimmed,
  children,
}: {
  onOpen: () => void;
  /** Screen-reader name for the button ("PM-KISAN, show details"). */
  ariaLabel: string;
  /** The "Tap for details" hint at the bottom of the card. */
  more?: string;
  /** Show the card faded (a closed tender, a cancelled project). */
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      className="ftp-card-link ftp-tapcard"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 10,
        width: "100%",
        minWidth: 0,
        minHeight: 44,
        padding: 16,
        textAlign: "start",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        opacity: dimmed ? 0.72 : 1,
      }}
    >
      {children}
      {more && (
        <span
          aria-hidden
          style={{
            marginTop: "auto",
            paddingTop: 8,
            borderTop: "1px solid color-mix(in srgb, var(--hue) 16%, var(--ftp-border))",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
            fontSize: 13,
            lineHeight: "20px",
            fontWeight: 600,
            color: "var(--hue-deep)",
          }}
        >
          {more}
          <ChevronRight size={16} aria-hidden />
        </span>
      )}
    </button>
  );
}

/** Emoji chip + title row for the top of a TapCard. */
export function CardHead({
  emoji,
  title,
  titleLocal,
  side,
}: {
  emoji: string;
  title: React.ReactNode;
  titleLocal?: string | null;
  /** Something small on the right (a status pill). */
  side?: React.ReactNode;
}) {
  return (
    <span style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
      <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 21, borderRadius: 12 }}>
        {emoji}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="ftp-title" style={{ display: "block", fontWeight: 600, overflowWrap: "anywhere" }}>
          {title}
        </span>
        {titleLocal && (
          <span lang={scriptLang(titleLocal)} style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>
            {titleLocal}
          </span>
        )}
      </span>
      {side && <span style={{ flexShrink: 0 }}>{side}</span>}
    </span>
  );
}

/** A small pill in the module hue. `outline` = white with a hue border. */
export function HueTag({ children, outline, emoji }: { children: React.ReactNode; outline?: boolean; emoji?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        minHeight: 24,
        padding: "2px 9px",
        borderRadius: "var(--ftp-radius-pill)",
        background: outline ? "var(--ftp-surface)" : "var(--hue-tint)",
        border: `1px solid ${outline ? "color-mix(in srgb, var(--hue) 35%, var(--ftp-border))" : "transparent"}`,
        color: "var(--hue-deep)",
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        maxWidth: "100%",
      }}
    >
      {emoji && (
        <span className="ftp-emoji" aria-hidden>
          {emoji}
        </span>
      )}
      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</span>
    </span>
  );
}

/** A wrapping row of HueTags. */
export function TagRow({ children }: { children: React.ReactNode }) {
  return <span style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 }}>{children}</span>;
}

/** The big answer at the top of a DetailSheet ("You get ₹6,000"). */
export function SheetHighlight({ emoji, label, children, lang }: { emoji: string; label: string; children: React.ReactNode; lang?: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "14px 16px",
        borderRadius: 16,
        background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)",
        border: "1px solid color-mix(in srgb, var(--hue) 25%, var(--ftp-border))",
      }}
    >
      <span className="ftp-emoji" aria-hidden style={{ fontSize: 28, lineHeight: 1 }}>
        {emoji}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: "var(--hue-deep)" }}>{label}</p>
        <p lang={lang} className="ftp-display" style={{ margin: "4px 0 0", fontSize: 18, lineHeight: 1.35, fontWeight: 650, color: "var(--ftp-text)" }}>
          {children}
        </p>
      </div>
    </div>
  );
}

/** A titled block inside a DetailSheet. */
export function SheetSection({ emoji, title, children }: { emoji?: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ minWidth: 0 }}>
      <h3 style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8, fontSize: 14, lineHeight: "20px", fontWeight: 700, color: "var(--ftp-text)" }}>
        {emoji && (
          <span className="ftp-emoji" aria-hidden>
            {emoji}
          </span>
        )}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** A 44 px link button for the sheet footer (Apply, Call, Open source). */
export function SheetLink({
  href,
  children,
  primary,
  external = true,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  external?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={primary ? "ftp-btn ftp-btn-primary" : "ftp-btn ftp-btn-secondary"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        flex: primary ? "1 1 180px" : "0 1 auto",
        borderRadius: 12,
        // Primary colours come from .ftp-btn-primary (the page hue, darker on hover).
        ...(primary
          ? { borderWidth: 1, borderStyle: "solid", color: "#fff" }
          : { border: "1px solid var(--ftp-border)", background: "var(--ftp-surface)", color: "var(--ftp-text)" }),
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {icon}
      {children}
    </a>
  );
}

/** Make a stored URL safe to link: adds https:// when missing, rejects anything that is not http(s). */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s) ? `https://${s}` : null;
  if (!withProto) return null;
  try {
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** The host name of a URL without "www." ("pmkisan.gov.in"). */
export function hostOf(url: string | null | undefined): string | null {
  const u = safeUrl(url);
  if (!u) return null;
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * A stored source like "PMAY Urban Official | https://pmay-urban.gov.in/"
 * or "https://…" or "Maharashtra Govt" → { name, url }.
 */
export function sourceParts(raw: string | null | undefined): { name: string | null; url: string | null } {
  if (!raw) return { name: null, url: null };
  const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
  let name: string | null = null;
  let url: string | null = null;
  for (const p of parts) {
    const u = /^https?:\/\//i.test(p) ? safeUrl(p) : null;
    if (u && !url) url = u;
    else if (!name) name = p;
  }
  if (!name && url) name = hostOf(url);
  return { name, url };
}
