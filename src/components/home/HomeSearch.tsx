/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  HomeSearch — the full-width "find your district" box in the home hero
// ═══════════════════════════════════════════════════════════════════════
//
//  Type → a list opens under the box: live districts first (open the
//  district), then districts that are not live yet (open the vote page).
//  Old and everyday names work ("Mysore", "Bangalore", "Gurgaon"); the
//  matching lives in district-search.ts. Enter opens the first result,
//  ↓ moves into the list, Escape closes it.
//
//  The input has id="ftp-home-search" so "Choose your district from the
//  list" (after location is refused) can focus it.
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

export default function HomeSearch() {
  const t = useTranslations("home");
  const th = useTranslations("header");
  const locale = useLocale();
  const place = usePlaceText();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const index = buildDistrictIndex((slug, name) => place.state(slug, name));
  const results = searchDistricts(index, query, { live: 6, notLive: 6 });
  const count = results.live.length + results.notLive.length;
  const showList = open && query.trim().length > 0;

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
    const first = results.live[0] ?? results.notLive[0];
    if (!first) return;
    setOpen(false);
    router.push(districtHref(locale, first.district));
  }

  return (
    <div ref={wrap} className={styles.search}>
      <form role="search" onSubmit={submit}>
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
