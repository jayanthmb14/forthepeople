/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 12 v7 — /vote-district client page.
 *
 * Flattens INDIA_STATES → all locked districts. Augments with vote
 * counts from /api/district-request?all=1 so every voted district shows
 * its true count, not just the top 5. Districts with no votes default to 0.
 *
 * Vote action: POST to /api/district-request with { stateName, districtName }.
 * Server upserts on (stateName, districtName) so re-votes simply increment.
 * No per-visitor cap — each click is one POST. The server returns the
 * authoritative new total which replaces the optimistic +1.
 * On 429: revert the +1 and surface "slow down" inline.
 * On other error: revert and surface a generic retry prompt.
 *
 * UI:
 *   - Search input (filters by district name)
 *   - State select (filters by state)
 *   - Sort select (votes desc · alphabetical)
 *   - Paginated list, 20 per page
 *   - Preselected district (from ?d=<slug>) gets a hue-tint row
 *
 * Design v4 "Rang" (amber — the vote colour, deep enough for white text):
 * SiteHeader band; two pictures from the same vote counts as the list,
 * shown once they have loaded:
 *   • one plain sentence and the five most-requested districts as bars;
 *   • a ring of all votes by state (the top six states, the rest as one
 *     slice), one colour per state;
 * hue-coloured vote buttons; 44 px targets; tabular vote counts. Vote
 * logic unchanged. Text: "page_vote" messages; state names via
 * usePlaceText; district names are proper nouns.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ChevronUp, Lock, Search, Vote } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { HUE_HEX, type Hue } from "@/lib/design/hues";
import { Card, EmptyState } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList, Donut, type DonutSlice } from "@/components/site/SiteVisuals";
import { useFormat, usePlaceText } from "@/i18n/client";

type LockedDistrict = {
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  voteCount: number;
};

interface DistrictRequestRow {
  id: string;
  stateName: string;
  districtName: string;
  requestCount: number;
}

const PAGE_SIZE = 20;

/** How many leaders the picture shows. */
const TOP_N = 5;

/** The votes-by-state ring shows this many states; the rest share one slice. */
const TOP_STATES = 6;

/** One colour per state slice in the ring (the "other" slice is grey). */
const STATE_SLICE_HUES: Hue[] = ["amber", "rose", "violet", "teal", "blue", "green"];

function flattenLocked(): LockedDistrict[] {
  const out: LockedDistrict[] = [];
  for (const s of INDIA_STATES) {
    for (const d of s.districts) {
      if (!d.active) {
        out.push({
          slug: d.slug,
          name: d.name,
          stateSlug: s.slug,
          stateName: s.name,
          voteCount: 0,
        });
      }
    }
  }
  return out;
}

export interface VoteDistrictPageProps {
  locale: string;
  preselected: string | null;
}

export default function VoteDistrictPage({
  locale,
  preselected,
}: VoteDistrictPageProps) {
  const t = useTranslations("page_vote");
  const { number } = useFormat();
  const place = usePlaceText();
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const allLocked = useMemo(() => flattenLocked(), []);

  // ── Augment with live vote counts (all districts, not just top 5) ──
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
  // True once the counts arrived; the picture waits for it (never a fake 0).
  const [votesLoaded, setVotesLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/district-request?all=1");
        if (!res.ok) return;
        const data = (await res.json()) as { all?: DistrictRequestRow[] };
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const r of data.all ?? []) {
          next[`${r.stateName}::${r.districtName}`.toLowerCase()] = r.requestCount;
        }
        setVoteMap(next);
        setVotesLoaded(true);
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Filter / sort / paginate ──
  const [search, setSearch] = useState(preselected ?? "");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "alpha">("votes");
  const [page, setPage] = useState(0);

  // Local optimistic vote tracking (slug → bump applied on top of server count)
  const [bumps, setBumps] = useState<Record<string, number>>({});
  const [errorSlug, setErrorSlug] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<"rate" | "generic" | null>(null);
  // Per-slug debounce — last click time to drop accidental triple-fires.
  const lastClickRef = useRef<Record<string, number>>({});

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allLocked.map((d) => ({
      ...d,
      voteCount:
        (voteMap[`${d.stateName}::${d.name}`.toLowerCase()] ?? d.voteCount) +
        (bumps[d.slug] ?? 0),
    }));

    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.stateName.toLowerCase().includes(q) ||
          place.state(d.stateSlug, d.stateName).toLowerCase().includes(q),
      );
    }
    if (stateFilter !== "all") {
      list = list.filter((d) => d.stateSlug === stateFilter);
    }

    if (sortBy === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name));
    }
    return list;
  }, [allLocked, voteMap, bumps, search, stateFilter, sortBy, place]);

  // The picture: every locked district's count (ignoring search and filters),
  // the same numbers the list shows.
  const voteSummary = useMemo(() => {
    const counted = allLocked
      .map((d) => ({
        name: d.name,
        stateName: d.stateName,
        stateSlug: d.stateSlug,
        votes: (voteMap[`${d.stateName}::${d.name}`.toLowerCase()] ?? d.voteCount) + (bumps[d.slug] ?? 0),
      }))
      .filter((d) => d.votes > 0)
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
    // Votes added up per state, biggest first.
    const perState = new Map<string, { stateSlug: string; stateName: string; votes: number }>();
    for (const d of counted) {
      const row = perState.get(d.stateSlug) ?? { stateSlug: d.stateSlug, stateName: d.stateName, votes: 0 };
      row.votes += d.votes;
      perState.set(d.stateSlug, row);
    }
    return {
      voted: counted.length,
      total: counted.reduce((s, d) => s + d.votes, 0),
      top: counted.slice(0, TOP_N),
      byState: [...perState.values()].sort((a, b) => b.votes - a.votes),
    };
  }, [allLocked, voteMap, bumps]);

  // Picture 2: all votes by state, as a ring.
  const stateSlices: DonutSlice[] = useMemo(() => {
    const total = voteSummary.total;
    if (total <= 0) return [];
    const pct = (n: number) => `${number((n / total) * 100, { maximumFractionDigits: 0 })}%`;
    const slices: DonutSlice[] = voteSummary.byState.slice(0, TOP_STATES).map((s, i) => ({
      key: s.stateSlug,
      label: place.state(s.stateSlug, s.stateName),
      value: s.votes,
      display: pct(s.votes),
      color: HUE_HEX[STATE_SLICE_HUES[i % STATE_SLICE_HUES.length]].hue,
      sub: t("votes", { n: s.votes }),
    }));
    const rest = voteSummary.byState.slice(TOP_STATES);
    if (rest.length > 0) {
      const restVotes = rest.reduce((s, r) => s + r.votes, 0);
      slices.push({ key: "other", label: t("statesOther"), value: restVotes, display: pct(restVotes), color: "var(--ftp-text-2)", sub: t("votes", { n: restVotes }) });
    }
    return slices;
  }, [voteSummary, number, place, t]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filteredSorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Pre-select scroll: if preselected, scroll its row into view on mount
  useEffect(() => {
    if (!preselected) return;
    const el = document.getElementById(`vote-row-${preselected}`);
    if (el) {
      el.scrollIntoView({ block: "center" });
    }
  }, [preselected]);

  async function handleVote(d: LockedDistrict) {
    // 200ms debounce — prevents accidental triple-fires from latency,
    // not a vote cap. Each separate click is still one POST.
    const now = Date.now();
    if (now - (lastClickRef.current[d.slug] ?? 0) < 200) return;
    lastClickRef.current[d.slug] = now;

    setBumps((prev) => ({ ...prev, [d.slug]: (prev[d.slug] ?? 0) + 1 }));
    setErrorSlug(null);
    setErrorKind(null);

    try {
      const res = await fetch("/api/district-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateName: d.stateName, districtName: d.name }),
      });

      if (res.status === 429) {
        // Rate limited — revert optimistic bump and surface inline notice.
        setBumps((prev) => ({ ...prev, [d.slug]: (prev[d.slug] ?? 1) - 1 }));
        setErrorSlug(d.slug);
        setErrorKind("rate");
        return;
      }

      if (!res.ok) {
        setBumps((prev) => ({ ...prev, [d.slug]: (prev[d.slug] ?? 1) - 1 }));
        setErrorSlug(d.slug);
        setErrorKind("generic");
        return;
      }

      // Replace voteMap with the server's authoritative total so a refresh
      // (or a subsequent click) starts from the real DB count.
      const data = (await res.json()) as { requestCount?: number };
      if (typeof data.requestCount === "number") {
        const key = `${d.stateName}::${d.name}`.toLowerCase();
        setVoteMap((prev) => ({ ...prev, [key]: data.requestCount as number }));
        // Server count now includes our +1; clear the optimistic bump for this slug.
        setBumps((prev) => ({ ...prev, [d.slug]: (prev[d.slug] ?? 1) - 1 }));
      }
    } catch {
      setBumps((prev) => ({ ...prev, [d.slug]: (prev[d.slug] ?? 1) - 1 }));
      setErrorSlug(d.slug);
      setErrorKind("generic");
    }
  }

  // Sorted state list for filter dropdown
  const stateOptions = useMemo(() => {
    return [...INDIA_STATES]
      .filter((s) => s.districts.some((d) => !d.active))
      .map((s) => ({ slug: s.slug, name: place.state(s.slug, s.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [place]);


  // How many districts are still waiting — from the registry, never typed.
  const { comingDistricts } = getPlatformFacts();
  const leader = voteSummary.top[0];

  return (
    <main className="ftp-vote-page ftp-hue-amber" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      {/* Page-scoped styles. Colours are tokens and hue variables only. */}
      <style>{`
        .ftp-vote-inner { max-width: var(--ftp-reading-max); padding-top: 24px; padding-bottom: 56px; }
        .ftp-vote-toolbar {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 640px) {
          .ftp-vote-toolbar { grid-template-columns: 1fr; }
        }
        .ftp-vote-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ftp-vote-field svg {
          position: absolute;
          left: 12px;
          color: var(--hue);
          pointer-events: none;
        }
        .ftp-vote-input,
        .ftp-vote-select {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 20px;
          border: 1px solid var(--ftp-border);
          border-radius: var(--ftp-radius-tile);
          background: var(--ftp-surface);
          color: var(--ftp-text);
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
        }
        .ftp-vote-input { padding-left: 34px; }
        .ftp-vote-input:focus,
        .ftp-vote-select:focus { border-color: var(--hue); }
        .ftp-vote-list {
          list-style: none;
          margin: 0;
          padding: 0;
          background: var(--ftp-surface);
          border: 1px solid var(--ftp-border);
          border-radius: var(--ftp-radius-card);
          box-shadow: var(--ftp-shadow-1);
          overflow: hidden;
        }
        .ftp-vote-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px 12px;
          padding: 10px 16px;
          min-height: 56px;
          border-bottom: 1px solid var(--ftp-border);
        }
        .ftp-vote-row:last-child { border-bottom: none; }
        .ftp-vote-row-pre { background: var(--hue-tint); box-shadow: inset 3px 0 0 var(--hue); }
        .ftp-vote-row-info {
          flex: 1 1 180px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .ftp-vote-name { font-size: 15px; line-height: 22px; font-weight: 600; color: var(--ftp-text); }
        .ftp-vote-state { font-size: 13px; line-height: 20px; font-weight: 400; color: var(--ftp-text-2); }
        .ftp-vote-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          padding: 0 14px;
          background: var(--hue-tint);
          border: 1px solid color-mix(in srgb, var(--hue) 45%, transparent);
          color: var(--hue-deep);
          border-radius: var(--ftp-radius-pill);
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 150ms ease, color 150ms ease;
        }
        .ftp-vote-btn:hover { background: var(--hue); color: #fff; }
        .ftp-vote-error {
          flex-basis: 100%;
          font-size: 12px;
          line-height: 16px;
          color: var(--ftp-danger);
          text-align: right;
        }
        .ftp-vote-pagination {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 13px;
          color: var(--ftp-text-2);
        }
        .ftp-vote-page-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 44px;
          padding: 0 12px;
          background: var(--ftp-surface);
          border: 1px solid var(--ftp-border);
          border-radius: var(--ftp-radius-tile);
          font-size: 13px;
          font-family: inherit;
          color: var(--ftp-text);
          cursor: pointer;
        }
        .ftp-vote-page-btn:disabled { color: var(--ftp-text-2); opacity: 0.5; cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) {
          .ftp-vote-btn { transition: none; }
        }
      `}</style>

      <div className="ftp-container">
        <div className="ftp-vote-inner">
          <SiteHeader
            emoji="🗳️"
            icon={Vote}
            title={t("title")}
            description={t("description", { n: number(comingDistricts) })}
            backHref={`/${locale}`}
            backLabel={t("backHome")}
          />

          {/* The pictures — once the counts have loaded, and only if someone has voted */}
          {votesLoaded && leader && (
            <div className={stateSlices.length >= 2 ? "ftp-picture-row" : undefined} style={{ marginBottom: 20 }}>
              <Card tinted padding={18}>
                <Explainer>
                  {t.rich("simple", {
                    total: voteSummary.total,
                    voted: voteSummary.voted,
                    leader: leader.name,
                    votes: leader.votes,
                    b,
                  })}
                </Explainer>
                <p className="ftp-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="ftp-emoji" aria-hidden>🏆</span>
                  {t("topLabel")}
                </p>
                <BarList
                  rows={voteSummary.top.map((d) => ({
                    key: `${d.stateName}-${d.name}`,
                    label: (
                      <>
                        <span style={{ fontWeight: 600 }}>{d.name}</span>
                        <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>
                          {place.state(d.stateSlug, d.stateName)}
                        </span>
                      </>
                    ),
                    value: d.votes,
                    display: t("votes", { n: d.votes }),
                  }))}
                />
              </Card>
              {stateSlices.length >= 2 && voteSummary.byState[0] && (
                <ChartCard
                  title={t("statesTitle")}
                  emoji="🗺️"
                  units={t("statesUnits")}
                  simple={t.rich("statesSimple", {
                    state: stateSlices[0].label,
                    pct: number((voteSummary.byState[0].votes / voteSummary.total) * 100, { maximumFractionDigits: 0 }),
                    b,
                  })}
                  source={{ label: t("statesSource") }}
                  table={stateSlices.map((s) => ({ label: s.label, value: `${s.sub} (${s.display})` }))}
                >
                  <Donut
                    slices={stateSlices}
                    label={t("statesAria")}
                    center={stateSlices[0].display}
                    centerSub={stateSlices[0].label}
                  />
                </ChartCard>
              )}
            </div>
          )}

          <div className="ftp-vote-toolbar">
            <label className="ftp-vote-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="ftp-vote-input"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                aria-label={t("searchAria")}
              />
            </label>
            <select
              className="ftp-vote-select"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(0);
              }}
              aria-label={t("stateFilterAria")}
            >
              <option value="all">{t("allStates")}</option>
              {stateOptions.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="ftp-vote-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "votes" | "alpha");
                setPage(0);
              }}
              aria-label={t("sortAria")}
            >
              <option value="votes">{t("sortVotes")}</option>
              <option value="alpha">{t("sortAlpha")}</option>
            </select>
          </div>

          {pageItems.length === 0 ? (
            <EmptyState emoji="🔍" title={t("emptyTitle")} body={t("emptyBody")} />
          ) : (
            <ul className="ftp-vote-list">
              {pageItems.map((d) => {
                const isPre = preselected === d.slug;
                const hadError = errorSlug === d.slug;
                return (
                  <li
                    key={`${d.stateSlug}-${d.slug}`}
                    id={`vote-row-${d.slug}`}
                    className={`ftp-vote-row${isPre ? " ftp-vote-row-pre" : ""}`}
                    aria-current={isPre ? "true" : undefined}
                  >
                    <div className="ftp-vote-row-info">
                      <Lock size={14} aria-hidden="true" style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <span className="ftp-vote-name">{d.name}</span>
                        <span className="ftp-vote-state">, {place.state(d.stateSlug, d.stateName)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ftp-vote-btn"
                      onClick={() => handleVote(d)}
                      aria-label={t("voteAria", { district: d.name, state: place.state(d.stateSlug, d.stateName), n: d.voteCount })}
                    >
                      <ChevronUp size={16} aria-hidden="true" />
                      <span className="ftp-num">{number(d.voteCount)}</span>
                      {t("vote")}
                    </button>
                    {hadError && (
                      <span className="ftp-vote-error" role="alert">
                        {errorKind === "rate" ? t("errRate") : t("errGeneric")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <nav className="ftp-vote-pagination" aria-label={t("pagesAria")}>
            <button
              type="button"
              className="ftp-vote-page-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ArrowLeft size={14} aria-hidden="true" /> {t("prev")}
            </button>
            <span className="ftp-num" style={{ textAlign: "center" }}>
              {t("pageOf", { page: safePage + 1, pages: totalPages, n: filteredSorted.length })}
            </span>
            <button
              type="button"
              className="ftp-vote-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              {t("next")} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}
