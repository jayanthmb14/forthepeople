/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  SiteHeader — the Design v4 band for pages that are not district modules
//  (state, taluk, village, about, support, compare, vote, legal pages …)
// ═══════════════════════════════════════════════════════════════════════
//
//  Same look as the kit's PageHeader (a gradient band in the page hue, a
//  big emoji tile, a faint watermark icon, white type), with two changes:
//
//    • the emoji is passed in, and there is no module group chip —
//      PageHeader reads the module from the URL, and these pages have none
//      (on /en/about it would wrongly say "Civic duty");
//    • no hooks and no "use client", so a server page can pass a Lucide
//      icon component as `icon` (a client component could not receive it).
//
//  Colour comes from whatever hue class wraps the page (`ftp-hue-<name>`).
//
//     ← Back link
//   ┌───────────────────────────────────────────────────────────────┐
//   │ [emoji]  (chip)                                   ⟋ watermark │
//   │          Title  local-script name                             │
//   │          One line of description                              │
//   │          [children: pills, links]                             │
//   └───────────────────────────────────────────────────────────────┘

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function SiteHeader({
  emoji,
  title,
  titleLocal,
  description,
  chip,
  icon: Icon,
  backHref,
  backLabel = "Back to ForThePeople.in",
  children,
}: {
  /** One emoji for the tile beside the title. */
  emoji: string;
  /** The page's one <h1>. */
  title: React.ReactNode;
  /** Local-script name, shown beside the title (never machine-translated). */
  titleLocal?: string | null;
  /** One or two plain sentences under the title. */
  description?: React.ReactNode;
  /** Small sentence-case chip above the title ("Union territory"). */
  chip?: string;
  /** Faint watermark icon in the corner. */
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  /** Pills or links in a row under the description. */
  children?: React.ReactNode;
}) {
  return (
    <header style={{ marginBottom: 24 }}>
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 32,
            fontSize: 13,
            lineHeight: "20px",
            color: "var(--ftp-text-2)",
            textDecoration: "none",
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={14} aria-hidden />
          {backLabel}
        </Link>
      )}
      <div
        className="ftp-rise"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 22,
          padding: "clamp(18px, 3vw, 28px)",
          background:
            "radial-gradient(420px 220px at 88% 0%, rgba(255,255,255,0.22), transparent 70%), linear-gradient(135deg, var(--hue) 0%, var(--hue-deep) 100%)",
          color: "#fff",
          boxShadow: "0 22px 44px -26px color-mix(in srgb, var(--hue) 85%, transparent)",
        }}
      >
        {Icon && (
          <Icon
            aria-hidden
            size={200}
            strokeWidth={1.25}
            style={{ position: "absolute", right: -28, bottom: -52, opacity: 0.13, transform: "rotate(-12deg)", color: "#fff" }}
          />
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div
            aria-hidden
            className="ftp-pop"
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              ["--i" as string]: 2,
            }}
          >
            <span className="ftp-emoji" style={{ fontSize: 32 }}>
              {emoji}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {chip && (
              <span
                style={{
                  display: "inline-block",
                  margin: "0 0 8px",
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  fontSize: 12,
                  lineHeight: "18px",
                  fontWeight: 600,
                }}
              >
                {chip}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <h1
                className="ftp-display"
                style={{ fontSize: "clamp(26px, 3.4vw, 34px)", lineHeight: 1.1, fontWeight: 700, color: "#fff", margin: 0 }}
              >
                {title}
              </h1>
              {titleLocal && (
                <span lang="und" style={{ fontSize: "clamp(18px, 2.2vw, 22px)", lineHeight: 1.2, fontWeight: 500, opacity: 0.85 }}>
                  {titleLocal}
                </span>
              )}
            </div>
            {description && (
              <p style={{ fontSize: 14, lineHeight: "21px", margin: "6px 0 0", opacity: 0.92, maxWidth: 680 }}>{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
