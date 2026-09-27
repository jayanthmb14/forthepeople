"use client";

/**
 * CountUpNumber — shows a number and counts it up from 0 once, the first
 * time it scrolls into view. File 47 §4.6.3.
 *
 * Server HTML (and the first client render) always carries the real
 * value, so the number is right before JavaScript runs, for crawlers and
 * for anyone with scripts off. (It used to render "0" until the count-up
 * fired.) The count-up only starts after mount, when the element becomes
 * visible; prefers-reduced-motion skips it entirely. Screen readers get
 * the final value only.
 *
 * Numbers are formatted in the page language (Indian digit grouping).
 */

import * as React from "react";
import { useFormat } from "@/i18n/client";
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

/** Same magnitude rule as formatIndiaNumber, fixed from the final value so digits do not jump while counting. */
function autoDecimals(n: number): number {
  const abs = Math.abs(n);
  if (abs < 10) return 2;
  if (abs < 100) return 1;
  return 0;
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
  const { intl } = useFormat();
  // null = show the final value (SSR, before the animation, after it ends).
  const [frame, setFrame] = React.useState<number | null>(null);
  const elementRef = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof window === "undefined" || target === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number | null = null;
    let timeoutId: number | null = null;
    let started = false;

    const run = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        if (t < 1) {
          setFrame(target * EASE_OUT_CUBIC(t));
          rafId = requestAnimationFrame(tick);
        } else {
          setFrame(null);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        observer.disconnect();
        if (delay > 0) timeoutId = window.setTimeout(run, delay);
        else run();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [target, duration, delay]);

  const fixedDecimals = decimals ?? (style === undefined || style === "auto" ? autoDecimals(target) : undefined);
  const format = (v: number) =>
    formatFn ? formatFn(v) : formatIndiaNumber(v, { decimals: fixedDecimals, style, prefix, suffix, locale: intl });
  const finalText = format(target);

  return (
    <span ref={elementRef} className={className} style={inlineStyle}>
      <span aria-hidden={frame !== null ? true : undefined}>{frame !== null ? format(frame) : finalText}</span>
      {frame !== null ? <span className="sr-only">{finalText}</span> : null}
    </span>
  );
}

export default CountUpNumber;
