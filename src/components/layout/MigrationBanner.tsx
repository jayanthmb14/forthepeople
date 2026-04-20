/**
 * ForThePeople.in — Site-wide announcement (modal or banner).
 *
 * Reads the singleton SiteAnnouncement row from /api/site-announcement.
 * Admins edit it from /en/admin?tab=announcement. When the DB says
 * `enabled: false` (or the row is past its auto-hide date), this component
 * returns null and adds no UI.
 *
 * Two display modes:
 *  • "modal"  — blocking splash on first load; user must click CTA to enter.
 *  • "banner" — thin dismissible strip at the top of every page.
 *
 * Acknowledgement per browser via localStorage[storageKey]. Changing the
 * storageKey in admin (e.g. bumping ..._v1 → ..._v2) forces every returning
 * visitor to see the announcement again — useful for multi-phase incidents.
 */

"use client";
import { useEffect, useState } from "react";

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

// ── Static fallback for the migration window ──────────────────────────────
// Used when the DB is unreachable or the SiteAnnouncement row is disabled.
// Purpose: communicate with users even if Neon itself is down during the
// very migration we're warning them about. Auto-retires on the hardcoded
// date below so it can't linger past the migration window.
const STATIC_FALLBACK_HIDE_AFTER_ISO = "2026-04-25T18:30:00Z"; // 2026-04-26 00:00 IST
const STATIC_FALLBACK: Announcement = {
  enabled: true,
  variant: "critical",
  displayMode: "modal",
  title: "Temporary service notice — infrastructure migration",
  bodyMd:
`We're moving ForThePeople.in's database and cache to a new hosting setup between now and 25 April 2026. During this window you may notice some pages behaving a little differently than usual.

None of this affects your data or any payment or contribution you've made. It's purely behind-the-scenes infrastructure work — the kind we'd rather tell you about than pretend isn't happening.`,
  bullets: [
    "Some dashboards showing outdated or incomplete numbers",
    "Brief errors or blank sections on a few pages",
    "Slightly slower load times while caches rebuild",
  ],
  highlightText: "Normal service resumes from 26 April 2026.",
  footerNote: "If something looks seriously wrong, please report it via the feedback link in the footer — it helps us prioritise the post-migration cleanup.",
  ctaButtonText: "I understand — continue to site",
  storageKey: "ftp_site_announcement_v1",
  autoHideAfter: STATIC_FALLBACK_HIDE_AFTER_ISO,
};

const VARIANT_STYLE: Record<string, { header: string; ring: string; badge: string }> = {
  critical: { header: "#991B1B", ring: "#FECACA", badge: "🚧" },
  warning:  { header: "#B45309", ring: "#FED7AA", badge: "⚠️" },
  info:     { header: "#1D4ED8", ring: "#BFDBFE", badge: "ℹ️" },
};

function useResolvedAnnouncement(): Announcement | null {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let candidate: Announcement | null = null;
      try {
        const res = await fetch("/api/site-announcement", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as Partial<Announcement>;
          if (data.enabled && (!data.autoHideAfter || new Date(data.autoHideAfter).getTime() > Date.now())) {
            candidate = data as Announcement;
          }
        }
      } catch {
        /* fall through to static fallback below */
      }
      if (cancelled) return;
      // No DB-driven announcement → use the static migration-window fallback,
      // unless its own hardcoded auto-hide date has passed.
      if (!candidate && Date.now() < new Date(STATIC_FALLBACK_HIDE_AFTER_ISO).getTime()) {
        candidate = STATIC_FALLBACK;
      }
      // Skip showing anything if the visitor has already acknowledged this
      // storageKey in a prior session. Doing this here (instead of in a
      // follow-up effect that sets an "acknowledged" state) avoids the
      // cascading-render anti-pattern flagged by react-hooks/set-state-in-effect.
      if (candidate && typeof window !== "undefined" && window.localStorage.getItem(candidate.storageKey)) {
        candidate = null;
      }
      setAnn(candidate);
      setResolved(true);
    })();
    return () => { cancelled = true; };
  }, []);

  return resolved ? ann : null;
}

export default function MigrationBanner() {
  const ann = useResolvedAnnouncement();
  const [acknowledged, setAcknowledged] = useState(false);

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
    return (
      <div
        role="alert"
        style={{
          background: style.header,
          borderBottom: `1px solid ${style.ring}`,
          color: "#FEF2F2",
          padding: "10px 16px",
          fontSize: 13,
          lineHeight: 1.55,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ flexShrink: 0, fontSize: 16 }} aria-hidden>{style.badge}</span>
        <span style={{ flex: 1 }}>
          <strong>{ann.title}.</strong>{" "}
          {paragraphs[0]}
          {ann.highlightText ? ` — ${ann.highlightText}` : ""}
        </span>
        <button
          onClick={acknowledge}
          aria-label="Dismiss notice"
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(254, 242, 242, 0.4)",
            color: "#FEF2F2",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  // ── Modal mode: centered splash ───────────────────────────────────────
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
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#FFFFFF",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
          border: `1px solid ${style.ring}`,
        }}
      >
        <div style={{ background: style.header, color: "#FEF2F2", padding: "14px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }} aria-hidden>{style.badge}</span>
          <strong id="site-announcement-title" style={{ fontSize: 15, letterSpacing: "0.02em" }}>{ann.title}</strong>
        </div>

        <div style={{ padding: "20px 22px 8px", fontSize: 14, color: "#0F172A", lineHeight: 1.65 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? "0 0 12px" : "12px 0" }}>{p}</p>
          ))}
          {ann.bullets.length > 0 && (
            <ul style={{ margin: "0 0 14px", paddingLeft: 20, color: "#334155" }}>
              {ann.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
          {ann.highlightText && (
            <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, color: "#166534", fontSize: 13, margin: "0 0 4px" }}>
              ✅ {ann.highlightText}
            </div>
          )}
          {ann.footerNote && (
            <p style={{ margin: "14px 0 0", fontSize: 12, color: "#64748B" }}>{ann.footerNote}</p>
          )}
        </div>

        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={acknowledge}
            style={{
              background: "#0F172A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {ann.ctaButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
