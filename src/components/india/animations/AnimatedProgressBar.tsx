/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Horizontal bar that fills from 0% to a target percentage when it
 * enters the viewport. Used in state leaderboards and anywhere a
 * value-vs-max bar wants a smooth reveal. Respects reduced-motion.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface Props {
  /** 0–100. */
  pct: number;
  /** Bar fill colour. */
  color: string;
  /** Track (background) colour. */
  trackColor?: string;
  /** Bar height in px. */
  height?: number;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
}

export default function AnimatedProgressBar({
  pct,
  color,
  trackColor = "#F1F5F9",
  height = 6,
  duration = 700,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState<number>(reduced ? pct : 0);

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(pct);
      return;
    }
    if (typeof window === "undefined" || !ref.current) return;
    if (!("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(pct);
      return;
    }
    const node = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Run on next frame so the transition kicks in
            requestAnimationFrame(() => setShown(pct));
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [pct, reduced]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        height,
        background: trackColor,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, shown))}%`,
          height: "100%",
          background: color,
          transition: reduced
            ? "none"
            : `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: shown < pct ? "width" : "auto",
        }}
      />
    </div>
  );
}
