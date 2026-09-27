/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  DistrictFinder — pick a district: search, "Use my location", lists
// ═══════════════════════════════════════════════════════════════════════
//
//  Lives inside the header's DetailSheet (a bottom sheet on phones and
//  tablets, a right-hand panel on laptops and PCs). The header's district
//  chip opens it in "district" mode, the search button in "search" mode;
//  both show the same body, the search mode just leads with typing.
//
//    [ Search: district or state, e.g. Mysore ]
//    [ Use my location ]                     → LocateResult, inline
//    Live districts      Mandya · Mysuru · …  (links)
//    India dashboard →
//    All states          Karnataka (3 live) ▸ every district; not-live
//                        ones go to the vote page
//
//  While typing: dashboards of the district you are on (when there is
//  one), then live districts, then districts that are not live yet.
//  Old names work (Bangalore, Mysore, Gurgaon…): src/components/home/
//  district-search.ts.
//
//  DistrictResultList is exported for the home-page search box.
//
"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Globe2, LocateFixed, Search } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { useModuleText, usePlaceText } from "@/i18n/client";
import { placeName, placeNamePair } from "@/i18n/place-name";
import { buildDistrictIndex, normaliseSearch, searchDistricts } from "./district-search";
import type { DistrictMatch, FinderDistrict } from "./district-search";
import LocateResult from "./LocateResult";
import { useLocate } from "./useLocate";
import s from "./finder.module.css";

/** Where a district result leads: its page when live, else its vote page. */
export function districtHref(locale: string, d: { slug: string; stateSlug: string; active: boolean }): string {
  return d.active ? `/${locale}/${d.stateSlug}/${d.slug}` : `/${locale}/vote-district?d=${d.slug}`;
}

/** Move focus between result links with the arrow keys. */
export function onListKeyDown(e: React.KeyboardEvent<HTMLElement>, input?: HTMLInputElement | null) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a[href]"));
  const i = links.indexOf(document.activeElement as HTMLElement);
  e.preventDefault();
  if (e.key === "ArrowDown") links[Math.min(links.length - 1, i + 1)]?.focus();
  else if (i <= 0) input?.focus();
  else links[i - 1]?.focus();
}

/** Grouped result rows: live districts, then not-live ones. */
export function DistrictResultList({
  live,
  notLive,
  onNavigate,
  currentSlug,
}: {
  live: DistrictMatch[];
  notLive: DistrictMatch[];
  onNavigate?: () => void;
  currentSlug?: string;
}) {
  const t = useTranslations("header");
  const locale = useLocale();
  const place = usePlaceText();
  const row = (m: DistrictMatch) => {
    const d = m.district;
    const pair = placeNamePair(d, locale);
    return (
      <li key={`${d.stateSlug}/${d.slug}`}>
        <Link
          href={districtHref(locale, d)}
          className={`${s.row} ${d.active ? "" : s.rowMuted}`}
          onClick={onNavigate}
          aria-current={d.slug === currentSlug ? "page" : undefined}
        >
          <span className={d.active ? s.dotLive : s.dotOff} aria-hidden />
          <span className={s.rowMain}>
            <span className={s.rowName}>
              <span lang={pair.primaryLang}>{pair.primary}</span>
              {pair.secondary && (
                <span className={s.rowLocal} lang={pair.secondaryLang}>
                  {pair.secondary}
                </span>
              )}
            </span>
            <span className={s.rowMeta}>
              {place.state(d.stateSlug, d.stateName)}
              {m.via ? ` · ${t("matchedAlias", { alias: m.via })}` : ""}
            </span>
          </span>
          {d.slug === currentSlug ? (
            <span className={s.tag}>{t("here")}</span>
          ) : d.active ? (
            <ChevronRight size={16} aria-hidden className={s.rowArrow} />
          ) : (
            <span className={s.tag}>{t("vote")}</span>
          )}
        </Link>
      </li>
    );
  };
  return (
    <>
      {live.length > 0 && (
        <section aria-label={t("liveGroup")}>
          <h3 className={s.groupLabel}>{t("liveGroup")}</h3>
          <ul className={s.list}>{live.map(row)}</ul>
        </section>
      )}
      {notLive.length > 0 && (
        <section aria-label={t("notLiveGroup")}>
          <h3 className={s.groupLabel}>{t("notLiveGroup")}</h3>
          <ul className={s.list}>{notLive.map(row)}</ul>
        </section>
      )}
    </>
  );
}

export interface DistrictFinderProps {
  mode: "district" | "search";
  /** The district page the visitor is on, if any. */
  current?: { stateSlug: string; districtSlug: string } | null;
  /** Close the sheet (after following a link). */
  onNavigate: () => void;
}

export default function DistrictFinder({ mode, current, onNavigate }: DistrictFinderProps) {
  const t = useTranslations("header");
  const tl = useTranslations("locate");
  const locale = useLocale();
  const place = usePlaceText();
  const mt = useModuleText();
  const loc = useLocate();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // The sheet focuses its title first (for screen readers); then the
  // search box takes focus so typing works straight away.
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  // ~150 registry districts: cheap enough to index on every render (the
  // React Compiler memoises it); state names follow the page language.
  const index: FinderDistrict[] = buildDistrictIndex((slug, name) => place.state(slug, name));
  const results = searchDistricts(index, query, { live: 10, notLive: 20 });

  const currentDistrict = current ? INDIA_STATES.find((x) => x.slug === current.stateSlug)?.districts.find((d) => d.slug === current.districtSlug) : undefined;
  const q = normaliseSearch(query);

  // Dashboards of the district you are on, matched by their name in the
  // page language or in English.
  const modules =
    q && current && currentDistrict
      ? SIDEBAR_MODULES.filter((m) => normaliseSearch(mt.label(m.slug)).includes(q) || normaliseSearch(m.label).includes(q)).slice(0, 6)
      : [];

  const indiaLabel = t("indiaDashboard");
  const indiaMatches = q.length > 1 && [indiaLabel, "india", "bharat", "भारत", "ಭಾರತ"].some((x) => normaliseSearch(x).includes(q));

  const liveDistricts = useMemo(
    () =>
      INDIA_STATES.flatMap((st) => st.districts.filter((d) => d.active).map((d) => ({ ...d, stateSlug: st.slug, stateName: st.name }))).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [],
  );
  const states = useMemo(
    () =>
      INDIA_STATES.map((st) => ({ ...st, live: st.districts.filter((d) => d.active).length })).sort(
        (a, b) => (b.live > 0 ? 1 : 0) - (a.live > 0 ? 1 : 0) || a.name.localeCompare(b.name),
      ),
    [],
  );

  const total = results.live.length + results.notLive.length + modules.length + (indiaMatches ? 1 : 0);

  function goFirst(e: React.FormEvent) {
    e.preventDefault();
    const first = e.currentTarget.parentElement?.querySelector<HTMLAnchorElement>("[data-results] a[href]");
    first?.click();
  }

  const statesList = (
    <section aria-label={t("statesGroup")}>
      <h3 className={s.groupLabel}>{t("statesGroup")}</h3>
      <ul className={s.stateList}>
        {states.map((st) => (
          <li key={st.slug}>
            <details className={s.state}>
              <summary className={s.stateSummary}>
                <span className={s.rowName}>{place.state(st.slug, st.name)}</span>
                <span className={st.live > 0 ? s.stateCountLive : s.rowMeta}>{t("stateCount", { live: st.live })}</span>
                <ChevronRight size={16} aria-hidden className={s.stateChevron} />
              </summary>
              <ul className={s.list}>
                {st.live > 0 && (
                  <li>
                    <Link href={`/${locale}/${st.slug}`} className={s.row} onClick={onNavigate}>
                      <span className={s.rowMain}>
                        <span className={s.rowName}>{t("stateOpen", { state: place.state(st.slug, st.name) })}</span>
                      </span>
                      <ChevronRight size={16} aria-hidden className={s.rowArrow} />
                    </Link>
                  </li>
                )}
                {[...st.districts]
                  .sort((a, b) => (a.active === b.active ? a.name.localeCompare(b.name) : a.active ? -1 : 1))
                  .map((d) => (
                    <li key={d.slug}>
                      <Link
                        href={districtHref(locale, { slug: d.slug, stateSlug: st.slug, active: d.active })}
                        className={`${s.row} ${d.active ? "" : s.rowMuted}`}
                        onClick={onNavigate}
                      >
                        <span className={d.active ? s.dotLive : s.dotOff} aria-hidden />
                        <span className={s.rowMain}>
                          <span className={s.rowName}>{placeName(d, locale)}</span>
                        </span>
                        {d.active ? <ChevronRight size={16} aria-hidden className={s.rowArrow} /> : <span className={s.tag}>{t("vote")}</span>}
                      </Link>
                    </li>
                  ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className={s.finder}>
      <form role="search" onSubmit={goFirst} className={s.searchForm}>
        <label htmlFor={inputId} className={s.searchLabel}>
          {mode === "search" ? t("searchHint") : t("finderLabel")}
        </label>
        <div className={s.searchField}>
          <Search size={18} aria-hidden className={s.searchIcon} />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                e.currentTarget.form?.parentElement?.querySelector<HTMLElement>("[data-results] a[href]")?.focus();
              }
            }}
            placeholder={t("finderPlaceholder")}
            autoComplete="off"
            enterKeyHint="go"
            className={s.searchInput}
          />
        </div>
      </form>
      <p className="sr-only" aria-live="polite">
        {q ? t("resultsCount", { n: total }) : ""}
      </p>

      {q ? (
        <div data-results className={s.results} onKeyDown={(e) => onListKeyDown(e, inputRef.current)}>
          {modules.length > 0 && currentDistrict && current && (
            <section aria-label={t("dashboardsIn", { name: placeName(currentDistrict, locale) })}>
              <h3 className={s.groupLabel}>{t("dashboardsIn", { name: placeName(currentDistrict, locale) })}</h3>
              <ul className={s.list}>
                {modules.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/${locale}/${current.stateSlug}/${current.districtSlug}${m.slug === "overview" ? "" : `/${m.slug}`}`}
                      className={s.row}
                      onClick={onNavigate}
                    >
                      <span className={s.rowEmoji} aria-hidden>
                        {m.emoji}
                      </span>
                      <span className={s.rowMain}>
                        <span className={s.rowName}>{mt.label(m.slug)}</span>
                        <span className={s.rowMeta}>{mt.description(m.slug)}</span>
                      </span>
                      <ChevronRight size={16} aria-hidden className={s.rowArrow} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {indiaMatches && (
            <ul className={s.list}>
              <li>
                <Link href={`/${locale}/india`} className={s.row} onClick={onNavigate}>
                  <Globe2 size={18} aria-hidden className={s.rowIcon} />
                  <span className={s.rowMain}>
                    <span className={s.rowName}>{indiaLabel}</span>
                    <span className={s.rowMeta}>{t("indiaHint")}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden className={s.rowArrow} />
                </Link>
              </li>
            </ul>
          )}
          <DistrictResultList live={results.live} notLive={results.notLive} onNavigate={onNavigate} currentSlug={current?.districtSlug} />
          {total === 0 && (
            <>
              <p className={s.empty}>{t("noMatch")}</p>
              {statesList}
            </>
          )}
        </div>
      ) : (
        <div data-results className={s.results} onKeyDown={(e) => onListKeyDown(e, inputRef.current)}>
          <div>
            <button type="button" className={s.btnOutlineWide} onClick={loc.locate} disabled={loc.busy}>
              <LocateFixed size={18} aria-hidden />
              {loc.busy ? tl("findingYou") : tl("useLocation")}
            </button>
            {loc.status.kind !== "idle" && loc.status.kind !== "locating" && (
              <div style={{ marginTop: 12 }}>
                <LocateResult
                  status={loc.status}
                  onClose={loc.reset}
                  onRetry={loc.locate}
                  onChooseInstead={() => {
                    loc.reset();
                    inputRef.current?.focus();
                  }}
                  onNavigate={onNavigate}
                />
              </div>
            )}
          </div>

          <section aria-label={t("liveGroup")}>
            <h3 className={s.groupLabel}>{t("liveGroup")}</h3>
            <ul className={s.liveGrid}>
              {liveDistricts.map((d) => {
                const here = d.slug === current?.districtSlug && d.stateSlug === current?.stateSlug;
                return (
                  <li key={`${d.stateSlug}/${d.slug}`}>
                    <Link
                      href={`/${locale}/${d.stateSlug}/${d.slug}`}
                      className={`${s.liveChip} ${here ? s.liveChipHere : ""}`}
                      onClick={onNavigate}
                      aria-current={here ? "page" : undefined}
                    >
                      <span className={s.rowName}>{placeName(d, locale)}</span>
                      <span className={s.rowMeta}>{here ? t("here") : place.state(d.stateSlug, d.stateName)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <ul className={s.list}>
            <li>
              <Link href={`/${locale}/india`} className={s.row} onClick={onNavigate}>
                <Globe2 size={18} aria-hidden className={s.rowIcon} />
                <span className={s.rowMain}>
                  <span className={s.rowName}>{indiaLabel}</span>
                  <span className={s.rowMeta}>{t("indiaHint")}</span>
                </span>
                <ChevronRight size={16} aria-hidden className={s.rowArrow} />
              </Link>
            </li>
          </ul>

          {statesList}
        </div>
      )}
    </div>
  );
}
