"use client";

/**
 * ScrollProgressBar — fixed 2px bar at the top of the viewport that
 * paints a 10-stop accent gradient from left to right as the user
 * scrolls the page.
 *
 * Scoped to /en/india and its sub-routes via mount point in
 * src/app/[locale]/india/layout.tsx — doesn't render on /en homepage
 * or district pages.
 *
 * Scroll progress is computed as scrollY / (scrollHeight - innerHeight)
 * and written to the --scroll-progress CSS variable on
 * document.documentElement. The inner fill div sets its width from
 * that variable, so the actual paint cost stays in the GPU compositor.
 * The scroll handler is rAF-throttled so we coalesce bursts of scroll
 * events into one update per frame.
 *
 * Restored from dead-code state on 2026-05-21 (Phase C of Session 1
 * Visual Fundamentals). Pre-restoration this file was the unused
 * solid-peacock-blue iteration from Phase 5; the original 10-stop
 * accent ramp was reverted in Phase 4.7 Step 5.
 */

import * as React from "react";

export function ScrollProgressBar() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId: number | null = null;
    let lastScroll = window.scrollY;

    const update = () => {
      const scrollableRange =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollableRange > 0
          ? Math.min(100, Math.max(0, (lastScroll / scrollableRange) * 100))
          : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        `${progress.toFixed(2)}%`,
      );
      rafId = null;
    };

    const onScroll = () => {
      lastScroll = window.scrollY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      document.documentElement.style.removeProperty("--scroll-progress");
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 9999,
        pointerEvents: "none",
        background: "transparent",
      }}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          height: "100%",
          width: "var(--scroll-progress, 0%)",
          background:
            "linear-gradient(90deg," +
            " var(--accent-blue-700) 0%," +
            " var(--accent-indigo-700) 11.1%," +
            " var(--accent-teal-700) 22.2%," +
            " var(--accent-forest-green-700) 33.3%," +
            " var(--accent-wheat-700) 44.4%," +
            " var(--accent-slate-700) 55.6%," +
            " var(--accent-amber-700) 66.7%," +
            " var(--accent-purple-700) 77.8%," +
            " var(--accent-coral-700) 88.9%," +
            " var(--accent-pink-700) 100%)",
          transition: "width 80ms linear",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default ScrollProgressBar;
