/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// CountUp — a number that counts up once, the first time it scrolls into
// view (about 1 s, easing out). The server HTML and screen readers always
// get the real value; the moving digits are aria-hidden. Off under
// prefers-reduced-motion. Indian digit grouping (12,34,567).
"use client";

import { useEffect, useRef, useState } from "react";
import { NUMBER_LOCALE } from "@/i18n/languages";

export default function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);
  const fmt = (n: number) => n.toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1000);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(p >= 1 ? null : value * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  const factor = Math.pow(10, decimals);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{fmt(shown === null ? value : Math.round(shown * factor) / factor)}</span>
      <span className="sr-only">{fmt(value)}</span>
    </span>
  );
}
