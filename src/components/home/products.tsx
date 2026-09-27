/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ForThePeople apps — the product list and their small SVG marks
// ═══════════════════════════════════════════════════════════════════════
//
//  Used by the header's product switcher (hover or click the logo), the
//  phone menu and the footer's "coming soon" row, so the three apps always
//  look the same:
//
//    ForThePeople.in        district data              (this site)
//    ForThePeople Connect   report local problems      coming soon
//    ForThePeople Jobs      government jobs and exams  coming soon
//
//  The marks are hand-drawn inline SVG (no emoji, no image files). Colours
//  come from the module hue classes (.ftp-hue-blue / -violet / -amber in
//  globals.css) through CSS, so there is no hex here.
//
//  Connect is civic-issue reporting (a separate future app); Jobs is a
//  future app too — today jobs live in each district's "Exams & jobs"
//  dashboard. Neither is built, so both are labelled "Coming soon" and are
//  not links.
//
//  No "use client" on purpose: the footer (a server component) reads
//  PRODUCTS and draws ProductMark on the server; the header's menus
//  (client components) import the same file into the browser bundle.
//

import Link from "next/link";
import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import styles from "./chrome.module.css";

export type ProductKey = "data" | "connect" | "jobs";

export interface Product {
  key: ProductKey;
  /** Brand name — never translated. */
  name: string;
  /** Module hue class for the mark (identity only). */
  hue: string;
  /** This site, or not open yet. */
  status: "current" | "soon";
}

export const PRODUCTS: readonly Product[] = [
  { key: "data", name: "ForThePeople.in", hue: "ftp-hue-blue", status: "current" },
  { key: "connect", name: "ForThePeople Connect", hue: "ftp-hue-violet", status: "soon" },
  { key: "jobs", name: "ForThePeople Jobs", hue: "ftp-hue-amber", status: "soon" },
];

// ── The marks: 28 × 28, a pastel tile with one simple picture ──────────

function Tile({ children }: { children: React.ReactNode }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={styles.markStopA} />
          <stop offset="1" className={styles.markStopB} />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill={`url(#g${id})`} />
      {children}
    </>
  );
}

/** District data: two bars and a map pin. */
function DataMark() {
  return (
    <Tile>
      <rect x="5.5" y="15.5" width="3.4" height="7" rx="1.3" className={styles.markSoft} />
      <rect x="10.4" y="11.5" width="3.4" height="11" rx="1.3" className={styles.markInk} />
      <path d="M19.6 5.8c-2.9 0-5.1 2.3-5.1 5.1 0 3.7 5.1 9.8 5.1 9.8s5.1-6.1 5.1-9.8c0-2.8-2.3-5.1-5.1-5.1z" className={styles.markDeep} />
      <circle cx="19.6" cy="10.9" r="1.9" className={styles.markPaper} />
    </Tile>
  );
}

/** Connect: a speech bubble with an exclamation mark ("something is wrong here"). */
function ConnectMark() {
  return (
    <Tile>
      <path
        d="M7.2 7.5h13.6a2.2 2.2 0 0 1 2.2 2.2v7.4a2.2 2.2 0 0 1-2.2 2.2h-6.6l-4.3 3.4v-3.4H7.2A2.2 2.2 0 0 1 5 17.1V9.7a2.2 2.2 0 0 1 2.2-2.2z"
        className={styles.markInk}
      />
      <rect x="13" y="9.6" width="2" height="5" rx="1" className={styles.markPaper} />
      <circle cx="14" cy="16.6" r="1.15" className={styles.markPaper} />
    </Tile>
  );
}

/** Jobs: a briefcase. */
function JobsMark() {
  return (
    <Tile>
      <path d="M11.2 9.2V7.9a1.9 1.9 0 0 1 1.9-1.9h1.8a1.9 1.9 0 0 1 1.9 1.9v1.3" className={styles.markLine} strokeWidth="1.8" />
      <rect x="5.2" y="9.2" width="17.6" height="12.6" rx="2.6" className={styles.markInk} />
      <rect x="5.2" y="13.9" width="17.6" height="1.6" className={styles.markDeep} />
      <rect x="12.4" y="12.6" width="3.2" height="4.2" rx="0.9" className={styles.markPaper} />
    </Tile>
  );
}

const MARKS: Record<ProductKey, () => React.ReactElement> = { data: DataMark, connect: ConnectMark, jobs: JobsMark };

/** One product's mark, in its hue. Decorative (the name is always written next to it). */
export function ProductMark({ product, size = 28 }: { product: Product; size?: number }) {
  const Mark = MARKS[product.key];
  return (
    <span className={`${product.hue} ${styles.mark}`} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 28 28" focusable="false">
        <Mark />
      </svg>
    </span>
  );
}

/**
 * The three apps as a list: this site is a link home, the others are
 * labelled "Coming soon". Arrow keys move between rows (see onKeyDown in
 * the parent); the "soon" rows are focusable but do nothing, so keyboard
 * and screen-reader users hear them too.
 */
export function ProductList({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("header");
  const locale = useLocale();
  return (
    <ul className={styles.productList}>
      {PRODUCTS.map((p) => {
        const body = (
          <>
            <ProductMark product={p} />
            <span className={styles.productText}>
              <span className={styles.productName} translate="no" lang="en">
                {p.name}
              </span>
              <span className={styles.productHint}>{t(`products.${p.key}Hint`)}</span>
            </span>
            {p.status === "current" ? (
              <span className={styles.productHere}>
                <Check size={14} aria-hidden />
                {t("here")}
              </span>
            ) : (
              <span className={styles.productSoon}>{t("products.soon")}</span>
            )}
          </>
        );
        return (
          <li key={p.key}>
            {p.status === "current" ? (
              <Link href={`/${locale}`} className={`${p.hue} ${styles.productRow}`} aria-current="true" onClick={onNavigate} data-menu-item>
                {body}
              </Link>
            ) : (
              <button type="button" className={`${p.hue} ${styles.productRow} ${styles.productRowSoon}`} aria-disabled="true" data-menu-item>
                {body}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
