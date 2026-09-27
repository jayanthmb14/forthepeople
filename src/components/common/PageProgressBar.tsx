/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 12 v7 Phase P — NProgress-style top-of-viewport progress bar.
 *
 * Slim 2 px bar in the brand colour (var(--ftp-brand)) at the very top of
 * the viewport, fixed position, that animates 0 → ~80% on Next.js client
 * navigation start and snaps to 100% (then fades) when the new route's
 * children render. Design v3: token colour, no glow shadow.
 *
 * Implementation:
 *   - Listens for `<a>` clicks on same-origin internal links and starts
 *     the bar.
 *   - usePathname() tells us when navigation completes (the new route's
 *     pathname matches the in-flight href) — bar snaps to 100% + fades.
 *   - Safety net: if a navigation hasn't completed in 8s, the bar resets
 *     so it can't get stuck visible after a failed nav.
 *   - prefers-reduced-motion: bar still appears (it tells you something is
 *     loading) but the width/opacity transitions are switched off by the
 *     small <style> block in the markup below.
 *
 * No third-party dependency (no `nprogress` package). One small client
 * component mounted once in [locale]/layout.tsx.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const STUCK_RESET_MS = 8000;
const FADE_AFTER_COMPLETE_MS = 220;

export default function PageProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const inFlightHrefRef = useRef<string | null>(null);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTrickle() {
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
  }
  function clearStuck() {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
  }
  function clearFade() {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function start(href: string) {
    inFlightHrefRef.current = href;
    setVisible(true);
    setProgress(8);
    clearTrickle();
    clearStuck();
    clearFade();
    // Trickle 8 → ~80 over a few seconds; never reach 100 until complete.
    trickleTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 80) return p;
        const remaining = 80 - p;
        return Math.min(80, p + Math.max(0.5, remaining * 0.08));
      });
    }, 200);
    stuckTimerRef.current = setTimeout(() => {
      // Failed nav safety: snap to 0, hide.
      reset();
    }, STUCK_RESET_MS);
  }

  function complete() {
    clearTrickle();
    clearStuck();
    setProgress(100);
    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      inFlightHrefRef.current = null;
    }, FADE_AFTER_COMPLETE_MS);
  }

  function reset() {
    clearTrickle();
    clearStuck();
    clearFade();
    setVisible(false);
    setProgress(0);
    inFlightHrefRef.current = null;
  }

  // Click handler — starts the bar on internal-link clicks.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Skip modified clicks (new tab, save link, etc.) and non-primary buttons.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      // Skip explicit external / target=_blank / download / mailto / tel.
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      // Resolve to absolute and ensure same-origin.
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Skip same-page navigations (pathname + search identical).
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        )
          return;
        start(url.pathname + url.search);
      } catch {
        // Malformed href — ignore.
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // start() is module-stable in this component (closure over refs/setters,
    // never re-derived) so omitting it from deps doesn't risk staleness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pathname changes, the new route has rendered → complete the bar.
  useEffect(() => {
    if (inFlightHrefRef.current) {
      complete();
    }
    // We intentionally only react to pathname changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      clearTrickle();
      clearStuck();
      clearFade();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="ftp-progress"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      {/* Reduced motion: keep the bar, drop the animation. */}
      <style>{`@media (prefers-reduced-motion: reduce) { .ftp-progress, .ftp-progress > div { transition: none !important; } }`}</style>
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--ftp-brand)",
          transition: "width 180ms ease-out",
        }}
      />
    </div>
  );
}
