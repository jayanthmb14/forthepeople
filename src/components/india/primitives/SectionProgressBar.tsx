"use client";

/**
 * SectionProgressBar — sticky 6px bar at the top of the viewport
 * (just below IndiaBreadcrumb at top:56) that shows scroll progress
 * across the 10 super-categories as 10 equal-width segments.
 *
 * v3 (Step 15): unified sequential boundary model. A single
 * `boundaries[]` array (length 11) defines the scrollY range for each
 * segment N as [boundaries[N], boundaries[N+1]]. Segment N's progress
 * is `clamp((scrollY - boundaries[N]) / (boundaries[N+1] - boundaries[N]))`.
 * No overlap, no gap: segment N reaches exactly 1.0 at the same scrollY
 * where segment N+1 starts increasing from 0.
 *
 *   boundaries[0]  = 0                       (segment 0 starts at top of page)
 *   boundaries[1]  = top of section 02       (know-india) in document coords
 *   boundaries[2]  = top of section 03       …
 *   …
 *   boundaries[9]  = top of section 10       (culture)
 *   boundaries[10] = scrollMax = scrollHeight − innerHeight
 *
 * Performance contract:
 *  - Boundaries are cached in closure scope and re-measured ONLY on
 *    resize (debounced 150ms via window resize OR ResizeObserver on
 *    document.body for content-height changes after font/image settle).
 *  - Inside the rAF loop we do pure math against cached boundaries —
 *    zero DOM reads, zero getBoundingClientRect calls. This is what
 *    gives us 60fps under heavy scroll on low-end devices.
 *  - Segment fill is `transform: scaleX(--seg-progress)` on a
 *    pseudo-fill element, so writes are GPU-composited with no
 *    layout/paint cost.
 *
 * prefers-reduced-motion: globals.css disables the (already absent)
 * transition. The transform jumps update on every frame regardless.
 */

import * as React from "react";
import {
  SECTION_ACCENT_LIGHT_COLORS,
  SECTION_SLUGS_IN_ORDER,
} from "@/lib/india/section-accents";

/** Inverse of TINT_BY_SC in /[locale]/india/page.tsx — maps the
 *  data-tint-id attribute back to a super-category slug. */
const TINT_TO_SLUG: Record<string, string> = {
  macro: "macro-snapshot",
  know: "know-india",
  living: "living-standards",
  wildlife: "wildlife-forests",
  agriculture: "agriculture-livestock",
  natural: "natural-resources-energy",
  infra: "infrastructure",
  governance: "governance",
  innovation: "innovation",
  culture: "culture",
};

/**
 * Style + behaviour for one segment.
 * Each segment has a transparent host span and an absolutely-positioned
 * fill child that scales horizontally based on `--seg-progress` (0..1).
 */
const segmentHostStyle: React.CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  background: "transparent",
};

const segmentFillStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "var(--seg-color, transparent)",
  transformOrigin: "left center",
  transform: "scaleX(var(--seg-progress, 0))",
  willChange: "transform",
  pointerEvents: "none",
};

export function SectionProgressBar() {
  const segmentRefs = React.useRef<Array<HTMLSpanElement | null>>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    type SectionEntry = { slug: string; el: HTMLElement };
    let sections: SectionEntry[] = [];
    let rafId: number | null = null;
    let lastProgress: number[] = [];

    // Sequential boundary array. Length = N + 1 where N = segment count.
    // Populated by buildBoundaries() on init + resize/content-resize.
    let boundaries: number[] = [];

    const collectSections = () => {
      const all = Array.from(
        document.querySelectorAll<HTMLElement>("[data-tint-id]"),
      );
      const found: SectionEntry[] = [];
      for (const el of all) {
        const tintId = el.getAttribute("data-tint-id") ?? "";
        const slug = TINT_TO_SLUG[tintId];
        if (!slug) continue; // skip 'hero' and any unknown tint
        found.push({ slug, el });
      }
      // Document-order, matching SECTION_SLUGS_IN_ORDER.
      found.sort((a, b) => {
        const r = a.el.compareDocumentPosition(b.el);
        return r & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
      sections = found;
      // Reset cache so the next compute() forces an update.
      lastProgress = new Array(SECTION_SLUGS_IN_ORDER.length).fill(-1);
    };

    /**
     * Build the boundaries[] array from cached section element refs.
     * boundaries[0] = 0 (segment 0 starts at top of page).
     * boundaries[i] for i ∈ [1, N-1] = sectionTop[i] − viewportH / 2.
     * boundaries[N] = scrollMax (segment N-1 fully fills at page bottom).
     *
     * Step 22 — viewport-center anchor: each interior boundary fires
     * when the next section's top crosses viewport center. This both
     *   (a) lets the bar's color match the dominant on-screen card
     *       (Step 21's bottom-anchor only fired the next segment after
     *       the user had already moved through ~half of the next
     *       section, leaving the bar one section behind), AND
     *   (b) gives segment 9 a real span instead of zero, so Section 10
     *       (pink) gradually fills as the user scrolls into it rather
     *       than snapping to 1.0 at page bottom.
     *
     * Segment 0 still owns "pre-content + Section 01" (the long
     * segment, spanning page top → Section 02's centerline anchor).
     * Segments 1..8 each fill across roughly one section's distance.
     * Segment 9 fills from Section 10's centerline anchor through
     * scrollMax.
     *
     * Short-page handling preserved from Step 15: any boundary that
     * exceeds scrollMax is clamped, and zero-span segments snap to
     * 1.0 inside compute() once scrollY ≥ start. viewportH is re-read
     * on every buildBoundaries() invocation, which the existing
     * scheduleRemeasure path triggers on window resize.
     *
     * Short-page handling preserved from Step 15: any boundary that
     * would exceed scrollMax is clamped to scrollMax, and segments
     * with zero span snap to 1.0 inside compute() once scrollY ≥ start.
     * Guarantees every segment reaches 1.0 at page bottom regardless
     * of layout.
     *
     * Only invoked on init + resize. NEVER from inside the rAF loop.
     * window.innerHeight is read here (cheap, on resize only — never
     * per scroll frame).
     */
    const buildBoundaries = () => {
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const N = SECTION_SLUGS_IN_ORDER.length;

      // Collect tops for each section in document coords. One
      // getBoundingClientRect per section, on resize only — never
      // inside the rAF loop.
      const tops: number[] = new Array(N);
      for (let i = 0; i < N; i++) {
        const slug = SECTION_SLUGS_IN_ORDER[i];
        const entry = sections.find((s) => s.slug === slug);
        if (entry) {
          tops[i] = entry.el.getBoundingClientRect().top + scrollY;
        } else {
          tops[i] = i > 0 ? tops[i - 1] : 0;
        }
      }

      const halfViewport = viewportH / 2;
      const next: number[] = new Array(N + 1);
      next[0] = 0;
      for (let i = 1; i < N; i++) {
        // boundary[i] = top of Section (i+1) shifted earlier by half a
        // viewport, so the boundary fires when the next section's top
        // crosses the viewport's vertical center. This puts the bar's
        // color in sync with the dominant on-screen card and gives
        // segment 9 a real span (instead of zero-span snap at bottom).
        next[i] = tops[i] - halfViewport;
      }

      const scrollMax = Math.max(0, document.documentElement.scrollHeight - viewportH);
      next[N] = scrollMax;

      // Step 15 invariant — preserved verbatim:
      // Clamp interior boundaries to scrollMax so every boundary is a
      // scrollY position the user can actually reach. Then enforce
      // monotonic non-decreasing order. Any segment that ends up with
      // start === end has zero span and is handled in compute().
      for (let i = 1; i <= N; i++) {
        if (next[i] > scrollMax) next[i] = scrollMax;
        if (next[i] < next[i - 1]) next[i] = next[i - 1];
      }

      boundaries = next;
    };

    /**
     * Inner loop — pure math, zero DOM reads. For each segment N,
     * progress = (scrollY − boundaries[N]) ÷ (boundaries[N+1] − boundaries[N]).
     * Zero-span segments (collapsed by the short-page clamp) snap to
     * 1.0 once scrollY reaches their start position.
     */
    const compute = () => {
      const N = SECTION_SLUGS_IN_ORDER.length;
      if (boundaries.length < N + 1) return;
      const scrollY = window.scrollY;

      for (let i = 0; i < N; i++) {
        const start = boundaries[i];
        const end = boundaries[i + 1];
        const span = end - start;
        let progress: number;
        if (span > 0) {
          progress = Math.min(1, Math.max(0, (scrollY - start) / span));
        } else {
          // Collapsed segment (short-page edge case): treat as a step
          // function — empty until scrollY reaches start, full after.
          progress = scrollY >= start ? 1 : 0;
        }
        if (progress === lastProgress[i]) continue;
        lastProgress[i] = progress;
        const segEl = segmentRefs.current[i];
        if (segEl) {
          segEl.style.setProperty("--seg-progress", String(progress));
        }
      }
    };

    const tick = () => {
      rafId = window.requestAnimationFrame(() => {
        compute();
        rafId = null;
      });
    };

    const onScroll = () => {
      if (rafId === null) tick();
    };

    let resizeTimer: number | null = null;
    const scheduleRemeasure = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        collectSections();
        buildBoundaries();
        tick();
        resizeTimer = null;
      }, 150);
    };

    collectSections();
    buildBoundaries();
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleRemeasure);

    // ResizeObserver catches content-height changes that don't fire a
    // window resize: fonts settling, lazy images loading, below-the-fold
    // hydration. Debounced through the same scheduleRemeasure path.
    let bodyResizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      bodyResizeObserver = new ResizeObserver(() => {
        scheduleRemeasure();
      });
      bodyResizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleRemeasure);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      if (bodyResizeObserver) bodyResizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Section scroll progress"
      aria-valuemin={0}
      aria-valuemax={SECTION_SLUGS_IN_ORDER.length}
      style={{
        position: "sticky",
        // Butts directly against the bottom of IndiaBreadcrumb.
        // IndiaBreadcrumb is sticky at top:41px and renders at ~36px tall
        // (8px+8px padding + 13px font + 0.5px border + flex baseline gap),
        // so its bottom sits at ~77px. Earlier value 100px left a visible
        // ~23px transparent gap between the breadcrumb and this bar.
        // Phase C 2026-05-20: gap closed.
        top: "77px",
        width: "100%",
        // Phase 2026-05-21: 4px→6px + track 0.025→0.10 so the bar reads as
        // a visible grey hairline at rest. The per-segment scaleX paint-in
        // is only perceptible if the surface it paints onto is itself
        // visible — a 4px bar on a 2.5%-opacity track was imperceptible.
        height: "6px",
        zIndex: 39,
        display: "flex",
        gap: "1px",
        pointerEvents: "none",
        background: "rgba(0,0,0,0.10)",
      }}
    >
      {SECTION_SLUGS_IN_ORDER.map((slug, i) => {
        const color = SECTION_ACCENT_LIGHT_COLORS[slug] ?? "#A0A0A0";
        const cssVars = {
          "--seg-color": color,
          "--seg-progress": "0",
        } as React.CSSProperties;
        return (
          <span
            key={slug}
            ref={(el) => {
              segmentRefs.current[i] = el;
            }}
            data-section-progress-segment
            style={{ ...segmentHostStyle, ...cssVars }}
          >
            <span aria-hidden style={segmentFillStyle} />
          </span>
        );
      })}
    </div>
  );
}

export default SectionProgressBar;
