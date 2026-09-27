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
 *   - Preselected district (from ?d=<slug>) gets a brand-tint row
 *
 * Design v3 (2026-09-27): PageHeader from the kit, token-only styles,
 * 44 px targets, Lucide icons, mono vote counts. Vote logic unchanged.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronUp, Lock, Search, Vote } from "lucide-react";
import { INDIA_STATES } from "@/lib/constants/districts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { EmptyState, PageHeader } from "@/components/district/ui";

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
  const allLocked = useMemo(() => flattenLocked(), []);

  // ── Augment with live vote counts (all districts, not just top 5) ──
  const [voteMap, setVoteMap] = useState<Record<string, number>>({});
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
          d.stateName.toLowerCase().includes(q),
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
  }, [allLocked, voteMap, bumps, search, stateFilter, sortBy]);

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
      .map((s) => ({ slug: s.slug, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);


  // How many districts are still waiting — from the registry, never typed.
  const { comingDistricts } = getPlatformFacts();

  return (
    <main className="ftp-vote-page" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      {/* Page-scoped styles. Colours are --ftp-* tokens only (Design v3). */}
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
          color: var(--ftp-text-2);
          pointer-events: none;
        }
        .ftp-vote-input,
        .ftp-vote-select {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 20px;
          border: 1px solid var(--ftp-border);
          border-radius: var(--ftp-radius-tile);
          background: var(--ftp-surface);
          color: var(--ftp-text);
          outline: none;
          box-sizing: border-box;
        }
        .ftp-vote-input { padding-left: 34px; }
        .ftp-vote-input:focus,
        .ftp-vote-select:focus { border-color: var(--ftp-brand); }
        .ftp-vote-list {
          list-style: none;
          margin: 0;
          padding: 0;
          background: var(--ftp-surface);
          border: 1px solid var(--ftp-border);
          border-radius: var(--ftp-radius-card);
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
        .ftp-vote-row-pre { background: var(--ftp-brand-tint); }
        .ftp-vote-row-info {
          flex: 1 1 180px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .ftp-vote-name { font-size: 15px; line-height: 22px; font-weight: 500; color: var(--ftp-text); }
        .ftp-vote-state { font-size: 13px; line-height: 20px; font-weight: 400; color: var(--ftp-text-2); }
        .ftp-vote-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          padding: 0 14px;
          background: var(--ftp-surface);
          border: 1px solid var(--ftp-brand);
          color: var(--ftp-brand);
          border-radius: var(--ftp-radius-pill);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 150ms ease;
        }
        .ftp-vote-btn:hover { background: var(--ftp-brand-tint); }
        .ftp-vote-error {
          flex-basis: 100%;
          font-size: 11px;
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
          <PageHeader
            icon={Vote}
            title="Vote for the next district"
            description={`${comingDistricts.toLocaleString("en-IN")} districts waiting. Your vote prioritises which goes live next.`}
            backHref={`/${locale}`}
            backLabel="Back to home"
          />

          <div className="ftp-vote-toolbar">
            <label className="ftp-vote-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                className="ftp-vote-input"
                placeholder="Search any locked district…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                aria-label="Search locked districts"
              />
            </label>
            <select
              className="ftp-vote-select"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(0);
              }}
              aria-label="Filter by state"
            >
              <option value="all">All states</option>
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
              aria-label="Sort by"
            >
              <option value="votes">Sort: most votes</option>
              <option value="alpha">Sort: alphabetical</option>
            </select>
          </div>

          {pageItems.length === 0 ? (
            <EmptyState title="No matching districts." body="Try a different search or state filter." />
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
                        <span className="ftp-vote-state">, {d.stateName}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ftp-vote-btn"
                      onClick={() => handleVote(d)}
                      aria-label={`Vote for ${d.name}, ${d.stateName}. ${d.voteCount} votes so far.`}
                    >
                      <ChevronUp size={16} aria-hidden="true" />
                      <span className="ftp-num">{d.voteCount.toLocaleString("en-IN")}</span>
                      Vote
                    </button>
                    {hadError && (
                      <span className="ftp-vote-error" role="alert">
                        {errorKind === "rate"
                          ? "slow down — try again in a minute"
                          : "could not save vote, try again"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <nav className="ftp-vote-pagination" aria-label="Pages">
            <button
              type="button"
              className="ftp-vote-page-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ArrowLeft size={14} aria-hidden="true" /> Previous
            </button>
            <span style={{ textAlign: "center" }}>
              Page <span className="ftp-num">{safePage + 1}</span> of <span className="ftp-num">{totalPages}</span> ·{" "}
              <span className="ftp-num">{filteredSorted.length.toLocaleString("en-IN")}</span> districts
            </span>
            <button
              type="button"
              className="ftp-vote-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              Next <ArrowRight size={14} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}
