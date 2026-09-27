/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeSearch — the full-width "find your district" box in the home hero
// ═══════════════════════════════════════════════════════════════════════
//
//  Focus → the live districts are listed under the box (quick picks).
//  Type → the list narrows: live districts first (open the district), then
//  districts that are not live yet (open the vote page).
//  Old and everyday names work ("Mysore", "Bangalore", "Gurgaon"); the
//  matching lives in district-search.ts. Enter opens the first result,
//  ↓ moves into the list, Escape closes it.
//
//  The input has id="ftp-home-search" so "Choose your district from the
//  list" (after location is refused) can focus it. The hero's "Find your
//  district" button submits this form (form="ftp-home-search-form"): with
//  text it opens the first match, empty it opens the quick picks.
//
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { usePlaceText } from "@/i18n/client";
import { buildDistrictIndex, searchDistricts } from "./district-search";
import { DistrictResultList, districtHref, onListKeyDown } from "./DistrictFinder";
import styles from "./home.module.css";

export const HOME_SEARCH_ID = "ftp-home-search";
export const HOME_SEARCH_FORM_ID = "ftp-home-search-form";

export default function HomeSearch() {
  const t = useTranslations("home");
  const th = useTranslations("header");
  const tp = useTranslations("page_home");
  const locale = useLocale();
  const place = usePlaceText();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const index = buildDistrictIndex((slug, name) => place.state(slug, name));
  const typed = query.trim().length > 0;
  // Nothing typed yet: every live district, as quick picks.
  const results = typed
    ? searchDistricts(index, query, { live: 6, notLive: 6 })
    : { live: index.filter((d) => d.active).map((district) => ({ district, score: 1 })), notLive: [] };
  const count = results.live.length + results.notLive.length;
  const showList = open;

  // Close the list on a click or focus outside it, and on Escape.
  useEffect(() => {
    if (!showList) return;
    const outside = (e: Event) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        input.current?.focus();
      }
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [showList]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const first = typed ? (results.live[0] ?? results.notLive[0]) : null;
    if (!first) {
      setOpen(true);
      input.current?.focus();
      return;
    }
    setOpen(false);
    router.push(districtHref(locale, first.district));
  }

  return (
    <div ref={wrap} className={styles.search}>
      <form id={HOME_SEARCH_FORM_ID} role="search" onSubmit={submit}>
        <label htmlFor={HOME_SEARCH_ID} className="sr-only">
          {t("searchLabel")}
        </label>
        <div className={styles.searchField}>
          <Search size={20} aria-hidden className={styles.searchIcon} />
          <input
            ref={input}
            id={HOME_SEARCH_ID}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && showList) {
                e.preventDefault();
                wrap.current?.querySelector<HTMLElement>("[data-results] a[href]")?.focus();
              }
            }}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            enterKeyHint="go"
            aria-controls="ftp-home-results"
            className={styles.searchInput}
          />
        </div>
      </form>
      <p className="sr-only" aria-live="polite">
        {showList ? th("resultsCount", { n: count }) : ""}
      </p>
      {showList && (
        <div id="ftp-home-results" data-results className={styles.searchResults} onKeyDown={(e) => onListKeyDown(e, input.current)}>
          {!typed && <p className={styles.searchHint}>{tp("hero.quickPicks")}</p>}
          {count === 0 ? (
            <p className={styles.searchEmpty}>{t("searchNoMatch")}</p>
          ) : (
            <DistrictResultList live={results.live} notLive={results.notLive} onNavigate={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}
