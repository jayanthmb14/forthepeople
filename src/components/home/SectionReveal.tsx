/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// SectionReveal — a quick fade-up (180 ms) for the home page's sections the
// first time each one scrolls into view. Sections marked `data-reveal` are
// ALWAYS visible: nothing waits hidden for this script. A section already
// on screen when the page opens is left alone (no flicker); off under
// "reduce motion" (and the CSS turns the animation off as well). The
// animation itself is `.home [data-reveal="in"]` in home.module.css.
"use client";

import { useEffect } from "react";

export default function SectionReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const first = !seen.has(e.target);
          seen.add(e.target);
          if (!e.isIntersecting) continue;
          // On screen at the first look: already seen, nothing to animate.
          if (!first) (e.target as HTMLElement).dataset.reveal = "in";
          io.unobserve(e.target);
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
