/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeHero — the page's one H1, one sentence and two buttons
// ═══════════════════════════════════════════════════════════════════════
//
//    Your district. Your data. Your right.            ← H1 36/40, weight 600
//    Free, source-linked government data for 10 districts across 7 states.
//    [ Explore all of India → ]  [ Find your district ]
//
//  The coverage sentence comes from getCoveragePhrase() (derived from the
//  district registry), so no count is ever typed by hand.
//
//  "Find your district" does not navigate: it scrolls to the top and puts
//  the cursor in the header's district search (id="ftp-district-search").
//
"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { DISTRICT_SEARCH_ID } from "./HeaderBar";
import styles from "./home.module.css";

export interface HomeHeroProps {
  locale: string;
  /** e.g. "10 districts across 7 states" — computed on the server. */
  coveragePhrase: string;
}

function focusDistrictSearch() {
  const input = document.getElementById(DISTRICT_SEARCH_ID) as HTMLInputElement | null;
  if (!input) return;
  window.scrollTo({ top: 0, behavior: "auto" });
  input.focus();
}

export default function HomeHero({ locale, coveragePhrase }: HomeHeroProps) {
  return (
    <div className={styles.hero}>
      <h1 className="ftp-h1">Your district. Your data. Your right.</h1>
      <p className={styles.heroLead}>
        Free, source-linked government data for {coveragePhrase}.
      </p>
      <div className={styles.heroActions}>
        <Link href={`/${locale}/india`} className={`${styles.button} ${styles.buttonPrimary}`}>
          Explore all of India
          <ArrowRight size={16} aria-hidden />
        </Link>
        <button type="button" onClick={focusDistrictSearch} className={styles.button}>
          <Search size={16} aria-hidden />
          Find your district
        </button>
      </div>
    </div>
  );
}
