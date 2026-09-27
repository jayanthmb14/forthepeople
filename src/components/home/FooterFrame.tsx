/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  FooterFrame — full footer, or the slim line on district / India module
//  pages (v5.3)
// ═══════════════════════════════════════════════════════════════════════
//
//  Footer.tsx (a server component) draws the pieces; this client frame
//  picks the layout from the address (footer-mode.ts):
//
//    full   [brand + columns] [coming soon] [built by · Article 19(1)(a)]
//
//    slim   [▣] Built by Jayanth M B   About · Privacy · Disclaimer   [More ▴]
//           — one thin line at the end of the page. "More" opens the full
//           footer in place, under the line (a disclosure: aria-expanded +
//           aria-controls; while closed the part is inert, so Tab skips it).
//           Opening grows it smoothly and then scrolls it into view;
//           under prefers-reduced-motion both happen at once, without
//           animation. It closes again on the next page.
//
//  The line keeps its right end clear: the floating "Report a problem"
//  button sits in that corner (padding in chrome.module.css).
"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { isSlimFooterPath } from "./footer-mode";
import styles from "./chrome.module.css";

interface Props {
  /** Brand block, link columns and "Coming soon" — the body of the full footer. */
  main: ReactNode;
  /** The full footer's last line: built by · Article 19(1)(a). */
  bottom: ReactNode;
  /** The slim line's content before the toggle: logo mark, built by, About · Privacy · Disclaimer. */
  slimLine: ReactNode;
  /** The last line under the opened slim footer (Article 19(1)(a); "built by" is already in the line). */
  slimBottom: ReactNode;
  moreLabel: string;
  lessLabel: string;
}

/** Sticky header + district bar / India breadcrumb, with a little air. */
const STICKY_TOP = 120;
/** Matches the grid-template-rows transition in chrome.module.css. */
const OPEN_MS = 260;

export default function FooterFrame({ main, bottom, slimLine, slimBottom, moreLabel, lessLabel }: Props) {
  const pathname = usePathname() ?? "";
  // Open for one page only: a new address shows the slim line again.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreId = useId();

  if (!isSlimFooterPath(pathname)) {
    return (
      <footer role="contentinfo" className={styles.footer}>
        {main}
        {bottom}
      </footer>
    );
  }

  const open = openOn === pathname;

  function toggle() {
    if (open) {
      setOpenOn(null);
      return;
    }
    setOpenOn(pathname);
    // The footer opens below the line, usually below the fold: bring it up,
    // but never scroll the line itself under the sticky bars.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        const more = moreRef.current;
        const line = lineRef.current;
        if (!more || !line) return;
        const hidden = more.getBoundingClientRect().bottom - window.innerHeight;
        const room = line.getBoundingClientRect().top - STICKY_TOP;
        const by = Math.min(hidden + 16, room);
        if (by > 0) window.scrollBy({ top: by, behavior: reduce ? "auto" : "smooth" });
      },
      reduce ? 0 : OPEN_MS + 20,
    );
  }

  return (
    <footer role="contentinfo" className={`${styles.footer} ${styles.footerSlim}`} data-open={open ? "true" : undefined}>
      <div className="ftp-container">
        <div ref={lineRef} className={styles.slimLine}>
          {slimLine}
          <button
            type="button"
            className={styles.slimToggle}
            aria-expanded={open}
            aria-controls={moreId}
            onClick={toggle}
          >
            <span>{open ? lessLabel : moreLabel}</span>
            <ChevronUp size={15} aria-hidden className={styles.slimChevron} />
          </button>
        </div>
      </div>
      <div id={moreId} className={styles.slimMore} data-open={open ? "true" : undefined} inert={open ? undefined : true}>
        <div ref={moreRef} className={styles.slimMoreClip}>
          <div className={styles.slimMoreBody}>
            {main}
            {slimBottom}
          </div>
        </div>
      </div>
    </footer>
  );
}
