"use client";

/**
 * Shared pieces for the ten super-category bands on /[locale]/india.
 *
 *   useBandVisible()  IntersectionObserver that flips `visible` once, the
 *                     first time the band scrolls into view.
 *   BandVisible       context carrying that flag to the numbers.
 *   BandNumber        a number that is always right in the server HTML and,
 *                     once the band is visible, counts up from 0 one time
 *                     (reduced motion: never). Formatted in the page
 *                     language; `render` wraps it in a translated message,
 *                     e.g. (n) => t("fmt.gw", { value: n }) → "460 GW".
 *   useBandText()     the translators the bands share: page_india
 *                     ("band.*" common words, per-band groups), the
 *                     translated module and super-category names.
 *   RowBar            a thin bar under a list row (top-5 lists), sized
 *                     against the biggest value in the list.
 *
 * Before Sep 2026 each band had its own copy of the count-up, which
 * rendered "0" in the server HTML until JavaScript ran.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import { INDIA_NS, indiaText } from "../i18n";

const BandVisible = React.createContext(false);

export function BandVisibleProvider({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return <BandVisible.Provider value={visible}>{children}</BandVisible.Provider>;
}

/** Ref for the band's <section> and whether it has been seen yet. */
export function useBandVisible(): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = React.useRef<HTMLElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A formatted number that counts up once. `decimals` is fixed so the width
 * does not jump while counting.
 */
export function BandNumber({
  value,
  decimals = 0,
  duration = 1200,
  render,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  /** Wrap the formatted number in a message, e.g. (n) => t("x", { value: n }). */
  render?: (formatted: string) => React.ReactNode;
}) {
  const visible = React.useContext(BandVisible);
  const { number } = useFormat();
  const [frame, setFrame] = React.useState<number | null>(null);
  const done = React.useRef(false);

  React.useEffect(() => {
    if (!visible || done.current || value === 0) return;
    done.current = true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      if (p < 1) {
        setFrame(value * easeOutCubic(p));
        raf = requestAnimationFrame(step);
      } else {
        setFrame(null);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, value, duration]);

  const fmt = (v: number) => number(v, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const finalText = fmt(value);
  const shown = frame !== null ? fmt(frame) : finalText;
  return (
    <>
      <span aria-hidden={frame !== null ? true : undefined}>{render ? render(shown) : shown}</span>
      {frame !== null ? <span className="sr-only">{render ? render(finalText) : finalText}</span> : null}
    </>
  );
}

/** Translators shared by every band. `group` is the band's key in page_india. */
export function useBandText(group: string) {
  const t = useTranslations(INDIA_NS);
  const ti = useTranslations("india");
  const tb = useTranslations(`${INDIA_NS}.${group}`);
  const x = indiaText(t, ti);
  return { t, tb, x };
}

/** A thin hue bar under a list row, `value / max` wide. */
export function RowBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(3, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span aria-hidden style={{ display: "block", height: 4, borderRadius: 999, background: "rgba(0,0,0,0.06)", marginTop: 3, overflow: "hidden" }}>
      <span className="ftp-grow-x" style={{ display: "block", width: `${pct}%`, height: "100%", borderRadius: 999, background: color }} />
    </span>
  );
}
