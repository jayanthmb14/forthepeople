/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeaderBar — the site-wide header (Design v5.1 "Warm Calm")
// ═══════════════════════════════════════════════════════════════════════
//
//  Mounted once in src/app/[locale]/layout.tsx, so it shows on every page.
//
//    [disclaimer line — DisclaimerLine, scrolls away]
//    ┌────────────────────────────────────────────────────── 56 px, sticky ┐
//    │[logo] ForThePeople.in ▾ [⌖ Choose district ▾]     [Search…] [EN ▾]  │
//    │                                    Vote on features  GitHub ★ 312  ♥ Support │
//    └─────────────────────────────────────────────────────────────────────┘
//    [status strip — StatusStrip: day, date, IST clock, market, freshness]
//
//  Full width: the logo sits in the left corner (20–24 px from the edge on
//  wide screens), the actions in the right corner — not a centred column.
//
//  By width:
//    ≥ 1280  everything in the row; search is a field.
//    1024+   search becomes an icon.
//    < 1024  "Vote on features", GitHub and Support move into "Menu".
//    < 768   the logo shows only its tile.
//    < 640   phones: the district chip doubles as search (it opens the same
//            finder with the search box focused); the apps list moves into
//            "Menu"; the language button always stays in the row.
//
//  The logo: click = home; hover (mouse) or the ▾ = the ForThePeople apps
//  menu (ProductSwitcher). The district chip reads "Choose district", or the
//  district's name on a district page, and opens DistrictFinder.
//
//  The header stays exactly 56 px tall: the district bar and the India
//  page's sticky bars are positioned at `top: 56px`.
//
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Github, Heart, Lightbulb, MapPin, Search, Star, Users } from "lucide-react";
import LanguageMenu from "@/components/common/LanguageMenu";
import { DetailSheet } from "@/components/district/DetailSheet";
import { getDistrict, getState } from "@/lib/constants/districts";
import { placeName } from "@/i18n/place-name";
import { useFormat } from "@/i18n/client";
import DisclaimerLine from "./DisclaimerLine";
import DistrictFinder from "./DistrictFinder";
import HeaderMenu, { GITHUB_URL } from "./HeaderMenu";
import ProductSwitcher from "./ProductSwitcher";
import StatusStrip from "./StatusStrip";
import styles from "./chrome.module.css";

export interface HeaderBarProps {
  locale: string;
  /** GitHub star count, fetched on the server once an hour; null = unknown (no number shown). */
  githubStars?: number | null;
}

export default function HeaderBar({ locale, githubStars = null }: HeaderBarProps) {
  const t = useTranslations("header");
  const pageLocale = useLocale();
  const fmt = useFormat();
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

  const logo = (
    <Link href={`/${locale}`} className={styles.wordmark} aria-label={t("home")} translate="no">
      <span className={styles.logoTile} aria-hidden>
        <Users size={17} strokeWidth={2.4} />
      </span>
      <span className={styles.wordmarkText}>
        ForThePeople<span className={styles.wordmarkSuffix}>.in</span>
      </span>
    </Link>
  );

  return (
    <>
      <DisclaimerLine locale={locale} />
      <header className={styles.header} role="banner">
        <div className={styles.headerRow}>
          <ProductSwitcher logo={logo} />

          <button
            type="button"
            className={`${styles.chip} ${districtLabel ? styles.chipActive : ""}`}
            aria-haspopup="dialog"
            aria-expanded={open && finder?.mode === "district"}
            aria-label={districtLabel ? t("districtChipAria", { name: districtLabel }) : t("chooseDistrict")}
            onClick={() => setFinder({ mode: "district", path: pathname })}
          >
            <MapPin size={16} aria-hidden className={styles.chipPin} />
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

          {/* From 1024 px: the extras sit in the row. Below: HeaderMenu. */}
          <Link href={`/${locale}/features`} className={styles.quietLink}>
            <Lightbulb size={15} aria-hidden className={styles.voteIcon} />
            {t("voteFeatures")}
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.githubLink}>
            <Github size={15} aria-hidden />
            <span className={styles.githubWord}>{t("github")}</span>
            {githubStars !== null && (
              <>
                <span className={styles.githubStars} aria-hidden>
                  <Star size={12} className={styles.star} />
                  <span className="ftp-num">{fmt.number(githubStars)}</span>
                </span>
                <span className="sr-only">{t("stars", { n: githubStars })}</span>
              </>
            )}
          </a>
          <Link href={`/${locale}/support`} className={styles.supportLink}>
            <Heart size={14} aria-hidden className={styles.supportHeart} />
            {t("support")}
          </Link>

          <HeaderMenu githubStars={githubStars} />
        </div>
      </header>
      <StatusStrip />

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
