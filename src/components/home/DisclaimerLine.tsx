/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DisclaimerLine — the slim "not a government website" line
// ═══════════════════════════════════════════════════════════════════════
//
//  Sits directly above the sticky header on every page (except /india,
//  which has its own IndiaLegalDisclaimer).
//
//    ⓘ Independent, not a government website. Data from government portals
//      (NDSAP), research institutions and other reputed sources — each
//      figure shows its source and date.  Read the disclaimer        ×
//
//  The sources sentence is the ONE wording used site-wide (hero, footer,
//  here). On phones the line keeps only the first sentence and a "More"
//  link, so it stays one short line; the hero and the footer carry the
//  sources sentence there.
//
//  Behaviour:
//    - Shown on first load (the server renders it, so nobody misses it).
//    - × hides it and remembers that for 7 days in localStorage
//      (key `ftp.disclaimerDismissedAt`, value = ISO time of the click).
//    - After 7 days it comes back once, so returning visitors are reminded.
//
//  localStorage is read through useSyncExternalStore: the server (and
//  hydration) see "not dismissed", then React swaps in the browser value,
//  so server and client HTML match.
//
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Info, X } from "lucide-react";
import styles from "./chrome.module.css";

const STORAGE_KEY = "ftp.disclaimerDismissedAt";
const HIDE_FOR_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── A tiny store around one localStorage key ──
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when the visitor dismissed the line less than 7 days ago. */
function readDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const at = new Date(raw).getTime();
    return Number.isFinite(at) && Date.now() - at < HIDE_FOR_MS;
  } catch {
    return false; // storage blocked (private mode) — just show it
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* storage blocked — it will simply show again next visit */
  }
  listeners.forEach((l) => l());
}

export default function DisclaimerLine({ locale }: { locale: string }) {
  const t = useTranslations("disclaimer");
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  // /[locale]/india carries its own legal disclaimer — avoid two lines.
  const isIndiaRoute = /^\/[^/]+\/india(\/|$)/.test(pathname ?? "");
  if (dismissed || isIndiaRoute) return null;

  return (
    <div role="region" aria-label={t("region")} className={styles.disclaimer}>
      <div className={`ftp-container ${styles.disclaimerRow}`}>
        <Info size={14} aria-hidden className={styles.disclaimerIcon} />
        <p className={styles.disclaimerText}>
          {t("short")} <span className={styles.disclaimerSources}>{t("sources")}</span>
          <Link href={`/${locale}/disclaimer`} className={styles.disclaimerLinkLong}>
            {t("read")}
          </Link>
          <Link href={`/${locale}/disclaimer`} className={styles.disclaimerLinkShort} aria-label={t("readFull")}>
            {t("more")}
          </Link>
        </p>
        <button type="button" onClick={dismiss} className={styles.disclaimerClose} aria-label={t("hideAria")} title={t("hide")}>
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
