/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HeaderBar — the site-wide header (Design v3, CONCEPT §5 "Home")
// ═══════════════════════════════════════════════════════════════════════
//
//  Mounted once in src/app/[locale]/layout.tsx, so it shows on every page.
//
//    [32 px disclaimer line — DisclaimerLine, scrolls away]
//    ┌──────────────────────────────────────────────────────── 56 px, sticky ┐
//    │ [Users] ForThePeople.in [breadcrumb*] [search 40 px]  My district: X x │
//    │                           EN | Kannada  GitHub Star N  [Heart] Support │
//    └────────────────────────────────────────────────────────────────────────┘
//    * the breadcrumb (state ▸ district ▸ taluk) only appears on district pages.
//
//  Widths:
//    ≥ 1100 px  everything in one row.
//    768–1099   language, GitHub and "Vote on features" move into a menu.
//    ≤ 767      phone: wordmark + search (44 px) + menu (44 px). Everything
//               else, including "My district" and Support, is in the menu.
//
//  The header stays exactly 56 px tall because the district left rail and
//  the India page's sticky bars are positioned at `top: 56px`.
//
//  Search: typing filters every district in src/lib/constants/districts.
//  Live districts open their page; districts not live yet open the vote
//  page (/vote-district?d=slug). The input has id="ftp-district-search" so
//  the home page's "Find your district" button can focus it.
//
"use client";

import { useTranslations } from "next-intl";
import LanguageMenu from "@/components/common/LanguageMenu";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Github,
  Heart,
  MapPin,
  Menu,
  Search,
  Users,
  Vote,
  X,
} from "lucide-react";
import { INDIA_STATES, getState, getDistrict } from "@/lib/constants/districts";
import type { PlaceNames } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import DistrictBreadcrumb from "@/components/district/DistrictBreadcrumb";
import { useMyDistrict } from "@/hooks/useMyDistrict";
import { usePlaceText } from "@/i18n/client";
import { districtNameIn, placeName, placeSearchText } from "@/i18n/place-name";
import DisclaimerLine from "./DisclaimerLine";
import styles from "./chrome.module.css";

/** The id the home page's "Find your district" button focuses. */
export const DISTRICT_SEARCH_ID = "ftp-district-search";

const GITHUB_URL = "https://github.com/jayanthmb14/forthepeople";

// ── Flatten INDIA_STATES into one searchable list ──
type FlatDistrict = {
  slug: string;
  name: string;
  nameLocal: string;
  names?: PlaceNames;
  stateSlug: string;
  stateName: string;
  active: boolean;
  /** Every spelling (English, local script, names[*]) for search (docs/I18N.md §4). */
  search: string;
};

function flattenDistricts(): FlatDistrict[] {
  const out: FlatDistrict[] = [];
  for (const s of INDIA_STATES) {
    for (const d of s.districts) {
      out.push({
        slug: d.slug,
        name: d.name,
        nameLocal: d.nameLocal,
        names: d.names,
        stateSlug: s.slug,
        stateName: s.name,
        active: d.active,
        search: `${placeSearchText(d)} ${s.name.toLowerCase()} ${s.nameLocal.toLowerCase()}`,
      });
    }
  }
  return out;
}

/** Close a popover when the visitor clicks anywhere outside it. */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

/** "/en/karnataka/mandya" → "/kn/karnataka/mandya" */
// Locale switching lives in LanguageMenu (registry-driven).

export interface HeaderBarProps {
  locale: string;
  /** GitHub star count fetched on the server; null shows the label only. */
  githubStars?: number | null;
}

export default function HeaderBar({ locale, githubStars = null }: HeaderBarProps) {
  const t = useTranslations("header");
  const tl = useTranslations("lang");
  const tk = useTranslations("kit");
  const place = usePlaceText();
  const router = useRouter();
  const pathname = usePathname();
  const my = useMyDistrict();
  const myHref = my.href(locale);
  const myName = my.district ? districtNameIn(locale, my.district) : "";

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(searchRef, () => setSearchOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  // Dark mode is not finished yet: clear any old preference so every page
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

  // Escape closes the search results and the menu.
  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen, menuOpen]);

  const allDistricts = useMemo(() => flattenDistricts(), []);

  // ── District context from the URL: /[locale]/[state]/[district]/[taluk?] ──
  const routeParts = useMemo(() => (pathname ?? "").split("/").filter(Boolean), [pathname]);
  const routeStateSlug = routeParts[1];
  const routeDistrictSlug = routeParts[2];
  const routeTalukSlug = routeParts[3];
  const routeStateData = routeStateSlug ? getState(routeStateSlug) : undefined;
  const routeDistrictData =
    routeStateSlug && routeDistrictSlug ? getDistrict(routeStateSlug, routeDistrictSlug) : undefined;
  const routeTalukData = routeTalukSlug
    ? routeDistrictData?.taluks.find((t) => t.slug === routeTalukSlug)
    : undefined;
  const isDistrictPage = !!(routeStateSlug && routeDistrictSlug && routeStateData && routeDistrictData);

  // Breadcrumb dropdown data: every state (live first), every district of
  // the current state (live first), and the taluks of the current district.
  const peerLiveStates = useMemo(() => {
    const decorated = INDIA_STATES.map((s) => ({
      slug: s.slug,
      name: s.name,
      nameLocal: s.nameLocal,
      isLive: s.districts.some((d) => d.active),
    }));
    decorated.sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
    return decorated;
  }, []);
  // The breadcrumb leads with `nameLocal` when its script matches the page;
  // handing it names[locale] (मंड्या on /hi) makes it follow Hindi too.
  const peerLiveDistricts = useMemo(() => {
    const decorated = (routeStateData?.districts ?? []).map((d) => ({
      slug: d.slug,
      name: d.name,
      nameLocal: d.names?.[locale] ?? d.nameLocal,
      isLive: d.active === true,
    }));
    decorated.sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
    return decorated;
  }, [routeStateData, locale]);
  // A short list; the React Compiler memoizes it (a manual useMemo here
  // could not be preserved once names[locale] was read).
  const taluksForBreadcrumb = (routeDistrictData?.taluks ?? []).map((t) => ({
    slug: t.slug,
    name: t.name,
    nameLocal: t.names?.[locale] ?? t.nameLocal,
  }));

  // ── Search results: up to 8 live + 12 not-yet-live matches ──
  // Matches every spelling: "Mandya", "ಮಂಡ್ಯ", "मंड्या", the state in
  // English, its own script, or the page language ("कर्नाटक").
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { live: [] as FlatDistrict[], locked: [] as FlatDistrict[] };
    const matches = allDistricts.filter(
      (d) => d.search.includes(q) || place.state(d.stateSlug, d.stateName).toLowerCase().includes(q),
    );
    return {
      live: matches.filter((d) => d.active).slice(0, 8),
      locked: matches.filter((d) => !d.active).slice(0, 12),
    };
  }, [search, allDistricts, place]);

  function districtHref(d: FlatDistrict): string {
    return d.active ? `/${locale}/${d.stateSlug}/${d.slug}` : `/${locale}/vote-district?d=${d.slug}`;
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first = filtered.live[0] ?? filtered.locked[0];
    if (!first) return;
    setSearchOpen(false);
    router.push(districtHref(first));
  }

  const closeMenu = () => setMenuOpen(false);

  // ── Small pieces reused in the row and in the menu ──
  const languageToggle = <LanguageMenu />;

  const starsText = githubStars !== null ? githubStars.toLocaleString("en-IN") : null;

  return (
    <>
      <DisclaimerLine locale={locale} />
      <header className={styles.header} role="banner">
        <div className={`ftp-container ${styles.headerRow}`}>
          {/* ── Wordmark ── */}
          <Link href={`/${locale}`} className={styles.wordmark} aria-label={t("home")} translate="no">
            <span className={styles.logoTile} aria-hidden>
              <Users size={17} strokeWidth={2.4} />
            </span>
            <span>
              ForThePeople<span className={styles.wordmarkSuffix}>.in</span>
            </span>
          </Link>

          {/* ── District breadcrumb (district pages, tablet and up) ── */}
          {isDistrictPage && routeStateData && routeDistrictData && (
            <div className={`${styles.desktopOnly} ${styles.breadcrumbSlot}`}>
              <DistrictBreadcrumb
                compact
                locale={locale}
                stateSlug={routeStateSlug!}
                stateName={routeStateData.name}
                districtSlug={routeDistrictSlug!}
                districtName={routeDistrictData.names?.[locale] ?? placeName({ name: routeDistrictData.name, nameLocal: routeDistrictData.nameLocal }, locale)}
                peerLiveStates={peerLiveStates}
                peerLiveDistricts={peerLiveDistricts}
                taluks={taluksForBreadcrumb}
                currentTalukSlug={routeTalukData?.slug}
                currentTalukName={routeTalukData ? (routeTalukData.names?.[locale] ?? placeName({ name: routeTalukData.name, nameLocal: routeTalukData.nameLocal }, locale)) : undefined}
                subdivisionLabel={getStateConfig(routeStateSlug ?? "")?.subDistrictUnit ?? "Sub-district"}
              />
            </div>
          )}

          {/* ── District search ── */}
          <div
            ref={searchRef}
            className={`${styles.searchShell} ${isDistrictPage ? styles.searchShellCompact : ""}`}
          >
            <form onSubmit={handleSearchSubmit} role="search" className={styles.searchForm}>
              <Search size={16} className={styles.searchIcon} aria-hidden />
              <input
                id={DISTRICT_SEARCH_ID}
                type="search"
                placeholder={t("search")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                aria-label={t("search")}
                autoComplete="off"
                className={styles.searchInput}
              />
            </form>
            {searchOpen && search.trim().length > 0 && (
              <div className={styles.searchResults} aria-label={t("searchResults")}>
                {filtered.live.length === 0 && filtered.locked.length === 0 ? (
                  <div className={styles.searchEmpty}>{t("noMatch")}</div>
                ) : (
                  <>
                    {filtered.live.length > 0 && (
                      <>
                        <div className={styles.searchGroupLabel}>
                          {t("liveGroup")} <span className="ftp-num">({filtered.live.length})</span>
                        </div>
                        {filtered.live.map((d) => (
                          <Link
                            key={`live-${d.stateSlug}-${d.slug}`}
                            href={districtHref(d)}
                            className={styles.searchRow}
                            onClick={() => setSearchOpen(false)}
                          >
                            <span className={styles.dotLive} aria-hidden />
                            <span>{placeName(d, locale)}</span>
                            <span className={styles.searchRowMeta}>{place.state(d.stateSlug, d.stateName)}</span>
                          </Link>
                        ))}
                      </>
                    )}
                    {filtered.locked.length > 0 && (
                      <>
                        <div className={styles.searchGroupLabel}>
                          {t("notLiveGroup")} <span className="ftp-num">({filtered.locked.length})</span>
                        </div>
                        {filtered.locked.map((d) => (
                          <Link
                            key={`locked-${d.stateSlug}-${d.slug}`}
                            href={districtHref(d)}
                            className={`${styles.searchRow} ${styles.searchRowMuted}`}
                            onClick={() => setSearchOpen(false)}
                          >
                            <span className={styles.dotLocked} aria-hidden />
                            <span>{placeName(d, locale)}</span>
                            <span className={styles.searchRowMeta}>{place.state(d.stateSlug, d.stateName)}</span>
                          </Link>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {!isDistrictPage && <div className={styles.spacer} />}

          {/* ── Right-hand actions ── */}
          <div className={styles.actions}>
            {/* My district pill (only once the visitor has located themselves) */}
            {my.district && myHref && (
              <span className={`${styles.myDistrict} ${styles.desktopOnly}`}>
                <Link href={myHref} className={styles.myDistrictLink} title={t("myDistrictTitle")}>
                  <MapPin size={14} aria-hidden />
                  {t("myDistrict", { name: myName })}
                </Link>
                <button
                  type="button"
                  className={styles.myDistrictForget}
                  onClick={my.forget}
                  aria-label={t("forget")}
                  title={t("forget")}
                >
                  <X size={14} aria-hidden />
                </button>
              </span>
            )}

            <span className={styles.wideOnly}>{languageToggle}</span>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btn} ${styles.wideOnly}`}
              aria-label={starsText ? `${t("github")}, ${t("stars", { n: starsText })}` : t("github")}
            >
              <Github size={16} aria-hidden />
              {starsText ? (
                <>
                  <span>{t("star")}</span>
                  <span className={styles.stars}>{starsText}</span>
                </>
              ) : (
                <span>{t("github")}</span>
              )}
            </a>

            <Link href={`/${locale}/features`} className={`${styles.btn} ${styles.btnQuiet} ${styles.wideOnly}`}>
              <Vote size={16} aria-hidden />
              {t("voteFeatures")}
            </Link>

            <Link href={`/${locale}/support`} className={`${styles.btn} ${styles.btnSupport} ${styles.desktopOnly}`}>
              <Heart size={16} aria-hidden className={styles.heart} />
              {t("support")}
            </Link>

            {/* Menu (tablet + phone) — holds everything hidden above. */}
            <div ref={menuRef} className={`${styles.menuWrap} ${styles.narrowOnly}`}>
              <button
                type="button"
                className={`${styles.btn} ${styles.iconBtn}`}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-controls="ftp-header-menu"
                aria-label={menuOpen ? tk("close") : t("menu")}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
              </button>
              {menuOpen && (
                <div id="ftp-header-menu" className={styles.menuPanel}>
                  {my.district && myHref && (
                    <>
                      <Link href={myHref} className={styles.menuItem} onClick={closeMenu}>
                        <MapPin size={16} aria-hidden />
                        {t("myDistrict", { name: myName })}
                      </Link>
                      <button
                        type="button"
                        className={styles.menuItem}
                        onClick={() => {
                          my.forget();
                          closeMenu();
                        }}
                      >
                        <X size={16} aria-hidden />
                        {t("forget")}
                      </button>
                      <div className={styles.menuDivider} />
                    </>
                  )}
                  <Link href={`/${locale}/support`} className={styles.menuItem} onClick={closeMenu}>
                    <Heart size={16} aria-hidden className={styles.heart} />
                    {t("support")}
                  </Link>
                  <Link href={`/${locale}/features`} className={styles.menuItem} onClick={closeMenu}>
                    <Vote size={16} aria-hidden />
                    {t("voteFeatures")}
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.menuItem}
                    onClick={closeMenu}
                  >
                    <Github size={16} aria-hidden />
                    {t("github")}
                    {starsText && <span className={`${styles.menuItemMeta} ftp-num`}>{t("stars", { n: starsText })}</span>}
                  </a>
                  <div className={styles.menuDivider} />
                  <div className={styles.menuLabel}>{tl("menuLabel")}</div>
                  <div style={{ padding: "4px 8px" }}>
                    <LanguageMenu />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
