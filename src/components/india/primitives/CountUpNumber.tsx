"use client";

/**
 * CountUpNumber — animates a numeric value from 0 to its target on
 * first viewport entry. File 47 §4.6.3.
 *
 * Uses requestAnimationFrame (not setInterval) for smooth ticking.
 * Respects prefers-reduced-motion: reduce → falls back to instant render.
 * Fires once per page load — never re-animates.
 *
 * Defaults:
 *   duration: 800ms
 *   easing:   cubic-bezier(0.22, 1, 0.36, 1)  (ease-out)
 *
 * Where to USE: hero KPI strip, super-category mini-stats, module deep-dive
 * headline KPI, table-view headline column.
 *
 * Where NOT to use: grid card numbers, hover-revealed values, delta percentages,
 * "India in the world" rank numbers, tooltip numbers.
 */

import * as React from "react";
import { formatIndiaNumber, type FormatStyle } from "@/lib/india/format-number";

export interface CountUpNumberProps {
  target: number;
  formatFn?: (value: number) => string;
  decimals?: number;
  style?: FormatStyle;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
  /**
   * Inline style passthrough — useful for callers that want to style the
   * span (color, font, line-height) without wrapping in an extra element.
   */
  inlineStyle?: React.CSSProperties;
}

const EASE_OUT_CUBIC = (t: number): number => 1 - Math.pow(1 - t, 3);

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function CountUpNumber({
  target,
  formatFn,
  decimals,
  style,
  prefix,
  suffix,
  duration = 800,
  delay = 0,
  className,
  inlineStyle,
}: CountUpNumberProps) {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = React.useState<number>(reducedMotion ? target : 0);
  const elementRef = React.useRef<HTMLSpanElement | null>(null);
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setCurrent(target);
      return;
    }
    if (typeof window === "undefined") return;

    const node = elementRef.current;
    if (!node) return;

    let rafId: number | null = null;
    let initialCheckRafId: number | null = null;
    let observer: IntersectionObserver | null = null;
    let timeoutId: number | null = null;

    const startAnimation = () => {
      if (fired.current) return;
      fired.current = true;
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = EASE_OUT_CUBIC(t);
        setCurrent(target * eased);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const fire = () => {
      if (delay > 0) {
        timeoutId = window.setTimeout(startAnimation, delay);
      } else {
        startAnimation();
      }
      observer?.disconnect();
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fire();
          }
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);

    // IntersectionObserver only fires on threshold *crossings*. An element
    // that's already visible at observer-init time (e.g. hero KPI tiles
    // above the fold on initial page load) never crosses the threshold,
    // so it stays at 0 indefinitely. Manually check visibility one
    // animation frame after mount so layout has settled before we measure.
    initialCheckRafId = requestAnimationFrame(() => {
      if (fired.current) return;
      const rect = node.getBoundingClientRect();
      if (rect.height <= 0) return;
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      const visibleHeight =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (inViewport && visibleHeight >= rect.height * 0.3) {
        fire();
      }
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (initialCheckRafId !== null) cancelAnimationFrame(initialCheckRafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [target, duration, delay, reducedMotion]);

  const display = formatFn
    ? formatFn(current)
    : formatIndiaNumber(current, { decimals, style, prefix, suffix });

  return (
    <span ref={elementRef} className={className} style={inlineStyle}>
      {display}
    </span>
  );
}

export default CountUpNumber;
