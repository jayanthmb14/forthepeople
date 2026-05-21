"use client";

/**
 * ScrollProgressBar — sticky 5px top bar that fills with a solid
 * peacock blue as the user scrolls.
 *
 * The per-section gradient + clip-path paint reveal was reverted in
 * Step 5 alongside the v4 super-category redesign sweep. Restoring
 * the painted-gradient version is a 1-file change once all 10 bands
 * are finalised. For now the bar is a single solid color whose width
 * tracks scroll progress 0% → 100%.
 */

import * as React from "react";

const FILL_COLOR = "#185FA5"; // peacock blue (matches existing macro accent)

export function ScrollProgressBar() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      const scrollableRange =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollableRange > 0
          ? Math.min(
              100,
              Math.max(0, (window.scrollY / scrollableRange) * 100),
            )
          : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        `${progress.toFixed(2)}%`,
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.removeProperty("--scroll-progress");
    };
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        // Stacks below the global sticky header (56px) and the sticky
        // breadcrumb (~36px). z-index sits one below the breadcrumb's so
        // the bar tucks under it.
        top: "100px",
        width: "100%",
        height: "5px",
        background: "rgba(0,0,0,0.04)",
        zIndex: 39,
        overflow: "hidden",
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
          background: FILL_COLOR,
          backgroundImage: "none",
          transition: "width 80ms linear",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default ScrollProgressBar;
