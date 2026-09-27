/**
 * ForThePeople.in — Site-wide announcement (modal or banner).
 *
 * Reads the singleton SiteAnnouncement row from /api/site-announcement.
 * Admins edit it from /en/admin?tab=announcement. The admin toggle is
 * the SOLE source of truth — when the DB says `enabled: false`, no row
 * exists, or the API errors, this component renders nothing.
 *
 * Two display modes:
 *  • "modal"  — blocking splash on first load; user must click CTA to enter.
 *  • "banner" — thin dismissible strip at the top of every page.
 *
 * Acknowledgement per browser via localStorage[storageKey]. Changing the
 * storageKey in admin (e.g. bumping ..._v1 → ..._v2) forces every returning
 * visitor to see the announcement again — useful for multi-phase incidents.
 *
 * Filename is historical ("MigrationBanner"); behaviour is now generic
 * site-announcement. Export name preserved for stable import path.
 */

"use client";
import { useEffect, useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Announcement = {
  enabled: boolean;
  variant: "critical" | "warning" | "info";
  displayMode: "modal" | "banner";
  title: string;
  bodyMd: string;
  bullets: string[];
  highlightText: string | null;
  footerNote: string | null;
  ctaButtonText: string;
  storageKey: string;
  autoHideAfter: string | null;
};

// Design v3: each variant maps to a token pair (tinted background + dark
// text) and a Lucide icon. No hex colours, no emoji, no shadows.
const VARIANT_STYLE: Record<string, { text: string; tint: string; Icon: LucideIcon }> = {
  critical: { text: "var(--ftp-danger)", tint: "var(--ftp-danger-tint)", Icon: AlertOctagon },
  warning:  { text: "var(--ftp-warn)",   tint: "var(--ftp-warn-tint)",   Icon: AlertTriangle },
  info:     { text: "var(--ftp-brand-deep)", tint: "var(--ftp-brand-tint)", Icon: Info },
};

/**
 * Resolve the announcement to show from the public API. Returns null while
 * loading, or when the API says no announcement should render. The admin
 * toggle is the only path to a non-null value here — there is no fallback.
 */
function useResolvedAnnouncement(): Announcement | null {
  const [ann, setAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/site-announcement", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Announcement>;
        if (!data.enabled) return;
        if (data.autoHideAfter && new Date(data.autoHideAfter).getTime() <= Date.now()) return;
        setAnn(data as Announcement);
      } catch {
        // Network or DB error — fail closed (no banner) rather than show stale copy.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return ann;
}

export default function MigrationBanner() {
  const ann = useResolvedAnnouncement();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!ann) return;
    if (localStorage.getItem(ann.storageKey)) setAcknowledged(true);
  }, [ann]);

  // Body scroll lock only while a modal is actively blocking
  useEffect(() => {
    if (!ann || ann.displayMode !== "modal" || acknowledged) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [ann, acknowledged]);

  if (!ann || acknowledged) return null;

  function acknowledge() {
    if (!ann) return;
    localStorage.setItem(ann.storageKey, new Date().toISOString());
    setAcknowledged(true);
  }

  const style = VARIANT_STYLE[ann.variant] ?? VARIANT_STYLE.critical;
  const paragraphs = ann.bodyMd.split(/\n\n+/).filter(Boolean);

  // ── Banner mode: thin dismissible strip ───────────────────────────────
  if (ann.displayMode === "banner") {
    const BannerIcon = style.Icon;
    return (
      <div
        role="alert"
        style={{
          background: style.tint,
          borderBottom: "1px solid var(--ftp-border)",
          color: "var(--ftp-text)",
          fontSize: 13,
          lineHeight: "20px",
        }}
      >
        <div
          className="ftp-container"
          style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, paddingTop: 6, paddingBottom: 6 }}
        >
          <BannerIcon size={16} aria-hidden style={{ flexShrink: 0, color: style.text }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 500 }}>{ann.title}.</span>{" "}
            {paragraphs[0]}
            {ann.highlightText ? ` — ${ann.highlightText}` : ""}
          </span>
          <button
            onClick={acknowledge}
            aria-label="Dismiss notice"
            title="Dismiss"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: 0,
              borderRadius: "var(--ftp-radius-tile)",
              color: "var(--ftp-text-2)",
              cursor: "pointer",
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  // ── Modal mode: centered splash ───────────────────────────────────────
  const ModalIcon = style.Icon;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-announcement-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        // Dim the page with the text colour at 60 % (a token, not a hex).
        background: "color-mix(in srgb, var(--ftp-text) 60%, transparent)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: "var(--ftp-surface)",
          borderRadius: "var(--ftp-radius-card)",
          border: "1px solid var(--ftp-border-strong)",
        }}
      >
        <div
          style={{
            background: style.tint,
            color: style.text,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid var(--ftp-border)",
          }}
        >
          <ModalIcon size={20} aria-hidden style={{ flexShrink: 0 }} />
          <h2 id="site-announcement-title" className="ftp-title" style={{ color: "var(--ftp-text)" }}>
            {ann.title}
          </h2>
        </div>
        <div style={{ padding: "20px 20px 8px", fontSize: 14, color: "var(--ftp-text)", lineHeight: "22px" }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? "0 0 12px" : "12px 0" }}>{p}</p>
          ))}
          {ann.bullets.length > 0 && (
            <ul style={{ margin: "0 0 14px", paddingLeft: 20, color: "var(--ftp-text-2)" }}>
              {ann.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
          {ann.highlightText && (
            <p
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                background: "var(--ftp-live-tint)",
                borderRadius: "var(--ftp-radius-tile)",
                color: "var(--ftp-live-text)",
                fontSize: 13,
                lineHeight: "20px",
                margin: "0 0 4px",
              }}
            >
              <CheckCircle2 size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
              {ann.highlightText}
            </p>
          )}
          {ann.footerNote && (
            <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{ann.footerNote}</p>
          )}
        </div>
        <div style={{ padding: "12px 20px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={acknowledge}
            style={{
              minHeight: 44,
              background: "var(--ftp-brand)",
              color: "var(--ftp-surface)",
              border: "1px solid var(--ftp-brand)",
              borderRadius: "var(--ftp-radius-tile)",
              padding: "0 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {ann.ctaButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
