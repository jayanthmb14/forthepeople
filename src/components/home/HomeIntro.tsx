/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeIntro — a short branded loading moment, once per visit
// ═══════════════════════════════════════════════════════════════════════
//
//   ┌──────────────────────────────────────┐
//   │               [logo]                 │
//   │          ForThePeople.in             │
//   │  Your district. Your data. Your right.│
//   │           ━━━━━━━━━━━━░░░░            │
//   └──────────────────────────────────────┘
//
//  - At most 1.2 s: the logo pops in, a brand-blue line fills, the whole
//    card fades away. The page is already drawn underneath, so nothing
//    waits for it.
//  - Once per browser session, only on a full page load of the home page:
//    INTRO_SCRIPT (inline, runs before the first paint) decides, and marks
//    <html data-ftp-intro="play">. Without that mark the overlay is
//    display:none, so client-side navigation never replays it and a
//    browser without JavaScript never sees it.
//  - Skippable: any click, tap or key ends it at once.
//  - Off under prefers-reduced-motion (the script and the CSS both check).
//  - Decorative (aria-hidden): screen readers go straight to the page.
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import styles from "./home.module.css";

const ATTR = "data-ftp-intro";

/**
 * Inline script for the page (rendered by the server page, before the
 * overlay). Plays the intro only on the first home visit of the session
 * and clears the mark after 1.4 s even if the app's JavaScript never loads.
 */
export const INTRO_SCRIPT = `(function(){try{var d=document.documentElement;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("ftp-intro-seen"))return;sessionStorage.setItem("ftp-intro-seen","1");d.setAttribute("${ATTR}","play");setTimeout(function(){d.removeAttribute("${ATTR}")},1400)}catch(e){}})();`;

function stop() {
  document.documentElement.removeAttribute(ATTR);
}

export default function HomeIntro() {
  const t = useTranslations("intro");
  const tp = useTranslations("page_home");

  useEffect(() => {
    if (!document.documentElement.hasAttribute(ATTR)) return;
    const onKey = () => stop();
    window.addEventListener("keydown", onKey, { once: true });
    window.addEventListener("pointerdown", onKey, { once: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onKey);
    };
  }, []);

  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={styles.introCard}>
        <span className={styles.introMark}>
          <Users size={34} strokeWidth={2.3} />
        </span>
        <span className={styles.introName} translate="no">
          ForThePeople<span className={styles.introSuffix}>.in</span>
        </span>
        <span className={styles.introLine}>
          {t("line1")} {t("line2")} {t("line3")}
        </span>
        <span className={styles.introBar} />
        <span className={styles.introSkip}>{tp("intro.skip")}</span>
      </div>
    </div>
  );
}
