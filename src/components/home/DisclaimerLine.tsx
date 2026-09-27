/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DisclaimerLine — the 32 px "not a government website" line (CONCEPT §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  Sits directly above the sticky header on every page (except /india,
//  which has its own IndiaLegalDisclaimer with the same NDSAP text).
//
//  Behaviour:
//    - Shown on first load (the server renders it, so nobody misses it).
//    - The × hides it and remembers that for 7 days in localStorage
//      (key `ftp.disclaimerDismissedAt`, value = ISO time of the click).
//    - After 7 days it comes back once, so returning visitors are reminded.
//
//  We read localStorage through useSyncExternalStore: on the server (and
//  during hydration) the snapshot says "not dismissed", then React swaps
//  in the real browser value. That keeps server and client HTML identical.
//
"use client";

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
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);

  // /[locale]/india carries its own legal disclaimer — avoid two lines.
  const isIndiaRoute = /^\/[^/]+\/india(\/|$)/.test(pathname ?? "");
  if (dismissed || isIndiaRoute) return null;

  return (
    <div role="region" aria-label="Site disclaimer" className={styles.disclaimer}>
      <div className={`ftp-container ${styles.disclaimerRow}`}>
        <Info size={14} aria-hidden className={styles.disclaimerIcon} />
        <p className={styles.disclaimerText} style={{ margin: 0 }}>
          ForThePeople.in is not an official government website: data is
          aggregated from official portals (NDSAP), accredited research
          institutions and verified public sources, so always verify at the
          original source.{" "}
          <Link href={`/${locale}/disclaimer`}>Read the disclaimer</Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className={styles.disclaimerClose}
          aria-label="Hide this notice for 7 days"
          title="Hide for 7 days"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
