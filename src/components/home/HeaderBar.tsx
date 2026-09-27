/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeaderBar — the site-wide header (Design v5 "calm")
// ═══════════════════════════════════════════════════════════════════════
//
//  Mounted once in src/app/[locale]/layout.tsx, so it shows on every page.
//
//    [disclaimer line — DisclaimerLine, scrolls away]
//    ┌──────────────────────────────────────────────────── 56 px, sticky ┐
//    │ [logo] ForThePeople.in  [Choose district ▾]   [Search…] [EN ▾] Support │
//    └────────────────────────────────────────────────────────────────────┘
//
//  One row on every page and every width:
//    - the district chip reads "Choose district" on most pages and the
//      district's name ("Mandya ▾", in the page language) on a district
//      page. It opens the district finder: search (old names work too),
//      "Use my location", the live districts, then every state.
//    - search opens the same finder, ready to type; on a district page it
//      also finds that district's dashboards.
//    - the language button is always in the row (never inside a menu).
//    - "Support" is a quiet text link (hidden on phones; the footer has it).
//
//  Nothing else lives here: no breadcrumb (district pages have their own
//  bar under the header), no GitHub star, no "Vote on features" (both
//  are in the footer).
//
//  The header stays exactly 56 px tall: the district left rail and the
//  India page's sticky bars are positioned at `top: 56px`.
//
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Heart, Search, Users } from "lucide-react";
import LanguageMenu from "@/components/common/LanguageMenu";
import { DetailSheet } from "@/components/district/DetailSheet";
import { getDistrict, getState } from "@/lib/constants/districts";
import { placeName } from "@/i18n/place-name";
import DisclaimerLine from "./DisclaimerLine";
import DistrictFinder from "./DistrictFinder";
import styles from "./chrome.module.css";

export interface HeaderBarProps {
  locale: string;
  /**
   * Kept so the layout's call still type-checks; the header no longer
   * shows a GitHub star count (GitHub moved to the footer).
   */
  githubStars?: number | null;
}

export default function HeaderBar({ locale }: HeaderBarProps) {
  const t = useTranslations("header");
  const pageLocale = useLocale();
  const pathname = usePathname() ?? "";

  // Which finder is open, and on which page it was opened. Following a
  // link changes the path, which closes it without an effect.
  const [finder, setFinder] = useState<{ mode: "district" | "search"; path: string } | null>(null);
  const open = finder !== null && finder.path === pathname;
  const close = () => setFinder(null);

  // Dark mode is not finished: clear any old preference so every page
  // renders with the light tokens (kept from the v2 header).
  useEffect(() => {
    try {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("ftp_theme");
      localStorage.removeItem("theme");
    } catch {
      /* ignore */
    }
  }, []);

  // District context from the URL: /[locale]/[state]/[district]/…
  const parts = pathname.split("/").filter(Boolean);
  const state = parts[1] ? getState(parts[1]) : undefined;
  const district = state && parts[2] ? getDistrict(state.slug, parts[2]) : undefined;
  const current = state && district ? { stateSlug: state.slug, districtSlug: district.slug } : null;
  const districtLabel = district ? placeName(district, pageLocale) : null;

  return (
    <>
      <DisclaimerLine locale={locale} />
      <header className={styles.header} role="banner">
        <div className={`ftp-container ${styles.headerRow}`}>
          <Link href={`/${locale}`} className={styles.wordmark} aria-label={t("home")} translate="no">
            <span className={styles.logoTile} aria-hidden>
              <Users size={17} strokeWidth={2.4} />
            </span>
            <span className={styles.wordmarkText}>
              ForThePeople<span className={styles.wordmarkSuffix}>.in</span>
            </span>
          </Link>

          <button
            type="button"
            className={`${styles.chip} ${districtLabel ? styles.chipActive : ""}`}
            aria-haspopup="dialog"
            aria-expanded={open && finder?.mode === "district"}
            aria-label={districtLabel ? t("districtChipAria", { name: districtLabel }) : t("chooseDistrict")}
            onClick={() => setFinder({ mode: "district", path: pathname })}
          >
            <span className={styles.chipText}>{districtLabel ?? t("chooseDistrict")}</span>
            <ChevronDown size={16} aria-hidden className={styles.chipCaret} />
          </button>

          <span className={styles.spacer} />

          <button
            type="button"
            className={styles.searchBtn}
            aria-haspopup="dialog"
            aria-expanded={open && finder?.mode === "search"}
            aria-label={t("searchHint")}
            onClick={() => setFinder({ mode: "search", path: pathname })}
          >
            <Search size={17} aria-hidden />
            <span className={styles.searchBtnText}>{t("searchHint")}</span>
          </button>

          <LanguageMenu />

          <Link href={`/${locale}/support`} className={styles.supportLink}>
            <Heart size={14} aria-hidden className={styles.supportHeart} />
            {t("support")}
          </Link>
        </div>
      </header>

      <DetailSheet
        open={open}
        onClose={close}
        title={finder?.mode === "search" ? t("searchTitle") : t("finderTitle")}
      >
        {open && finder && <DistrictFinder mode={finder.mode} current={current} onNavigate={close} />}
      </DetailSheet>
    </>
  );
}
