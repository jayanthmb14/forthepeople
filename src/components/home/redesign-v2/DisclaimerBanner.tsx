/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 11 redesign — drop-in replacement for src/components/layout/DisclaimerBar.tsx.
 *
 * Differences from the legacy banner:
 *   - sessionStorage (per-session) instead of localStorage (permanent dismiss)
 *   - left-border accent + amber-50/600/900 palette per spec
 *   - prefers-reduced-motion guard on the slide-in
 *
 * Wire-up to [locale]/layout.tsx is deferred to Phase 2.12 of Session 11.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ftp_disclaimer_v2";

export default function DisclaimerBanner() {
  // Render only after we know the dismiss state to avoid an SSR/CSR mismatch flash.
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pathname = usePathname();

  // /[locale]/india has its own session-aware IndiaLegalDisclaimer that
  // carries the same NDSAP text below the header — suppress this site-wide
  // copy on /india* routes to avoid two stacked amber banners.
  const isIndiaRoute = /^\/[^/]+\/india(\/|$)/.test(pathname ?? "");

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(!dismissed);
    } catch {
      // Private mode / sandbox — show by default.
      setVisible(true);
    }
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      try {
        setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!hydrated || !visible || isIndiaRoute) return null;

  return (
    <div
      role="region"
      aria-label="Site disclaimer"
      className="ftp-disclaimer-banner"
      style={{
        background: "#FFFBEB",
        borderLeft: "4px solid #EAB308",
        borderBottom: "1px solid #FDE68A",
        padding: "8px 16px",
        fontSize: 12,
        color: "#713F12",
        display: "flex",
        alignItems: "center",
        gap: 10,
        lineHeight: 1.5,
        animation: reducedMotion ? "none" : "ftp-disclaimer-slide-in 250ms ease-out",
      }}
    >
      <style>{`
        @keyframes ftp-disclaimer-slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .ftp-disclaimer-icon {
          color: #CA8A04;
          animation: ftp-disclaimer-pulse 3s ease-in-out infinite;
        }
        @keyframes ftp-disclaimer-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-disclaimer-icon { animation: none; }
        }
      `}</style>

      <span aria-hidden="true" className="ftp-disclaimer-icon" style={{ flexShrink: 0, fontSize: 14 }}>⚠</span>
      <span style={{ flex: 1 }}>
        <strong>ForThePeople.in is NOT an official government website.</strong>{" "}
        Data aggregated from official portals (NDSAP), accredited research
        institutions, and verified public sources. Always verify at the
        original source.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss disclaimer for this session"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "#A16207",
          // Mobile-revert: bumped to 36×36 hit target — was 20×16 which
          // failed the iOS 44×44 standard for tap targets.
          width: 36,
          height: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          flexShrink: 0,
          borderRadius: 8,
        }}
      >
        ✕
      </button>
    </div>
  );
}
