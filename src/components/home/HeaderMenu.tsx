/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeaderMenu — the header's "Menu" on phones and tablets (< 1024 px)
// ═══════════════════════════════════════════════════════════════════════
//
//  From 1024 px the header shows "Vote on features", GitHub and Support in
//  the row itself. Below that there is no room, so they move here. The
//  language button always stays in the row.
//
//    Phone (< 640 px)                 Tablet (640–1023 px)
//    ForThePeople apps                Vote on features
//      ForThePeople.in ✓              GitHub ★ 312
//      Connect · Jobs  (coming soon)  Support
//    Vote on features
//    GitHub ★ 312
//    Support
//
//  (Tablets reach the apps from the ▾ next to the logo.)
//
"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Github, Heart, Lightbulb, Menu, Star, X } from "lucide-react";
import { useFormat } from "@/i18n/client";
import { ProductList } from "./products";
import { focusFirstItem, onMenuKeyDown, usePopover } from "./use-popover";
import styles from "./chrome.module.css";

export const GITHUB_URL = "https://github.com/jayanthmb14/forthepeople";

export default function HeaderMenu({ githubStars }: { githubStars: number | null }) {
  const t = useTranslations("header");
  const locale = useLocale();
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);
  usePopover(open, close, wrap, button);

  return (
    <div ref={wrap} className={styles.menuWrap}>
      <button
        ref={button}
        type="button"
        className={styles.menuBtn}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("menuAria")}
        onClick={() => setOpen((x) => !x)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            focusFirstItem(panel.current);
          }
        }}
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>
      {open && (
        <div ref={panel} id={panelId} className={styles.menuPanel} role="group" aria-label={t("menuAria")} onKeyDown={onMenuKeyDown}>
          <div className={styles.menuApps}>
            <p className={styles.menuTitle}>{t("products.title")}</p>
            <ProductList onNavigate={close} />
          </div>
          <ul className={styles.menuLinks}>
            <li>
              <Link href={`/${locale}/features`} className={styles.menuLink} onClick={close} data-menu-item>
                <span className={`ftp-hue-yellow ${styles.menuIcon}`} aria-hidden>
                  <Lightbulb size={17} />
                </span>
                {t("voteFeatures")}
              </Link>
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.menuLink} onClick={close} data-menu-item>
                <span className={`ftp-hue-slate ${styles.menuIcon}`} aria-hidden>
                  <Github size={17} />
                </span>
                {t("github")}
                {githubStars !== null && (
                  <>
                    <span className={styles.menuStars} aria-hidden>
                      <Star size={13} className={styles.star} />
                      <span className="ftp-num">{fmt.number(githubStars)}</span>
                    </span>
                    <span className="sr-only">{t("stars", { n: githubStars })}</span>
                  </>
                )}
              </a>
            </li>
            <li>
              <Link href={`/${locale}/support`} className={`${styles.menuLink} ${styles.menuSupport}`} onClick={close} data-menu-item>
                <span className={`ftp-hue-rose ${styles.menuIcon}`} aria-hidden>
                  <Heart size={17} />
                </span>
                {t("support")}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
