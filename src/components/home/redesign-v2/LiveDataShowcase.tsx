/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 11 redesign — LiveDataShowcase. District chip tabs + module cards.
 *
 * Audit 2026-09 (finding 3.10) rewrite. What changed and why:
 *   - DATA CONTRACT. The cards read `d.items ?? d.schemes` etc., but
 *     /api/data/<module> returns `{ data: [...] }` (crops, schemes, news) and
 *     `{ data: { entries, allocations } }` (budget). Three of four cards were
 *     therefore permanently empty ("No active schemes listed") on the default
 *     tab. Every summariser now reads the real shape.
 *   - FRESHNESS GATE. A card renders only when its newest row is under
 *     MAX_AGE_DAYS (30) old. Stale or failed modules render NOTHING — never an
 *     empty-state card that says "Data syncing · refreshing every 5–30 min"
 *     over data from April. If nothing qualifies, one honest sentence shows.
 *   - CROPS. Rows are deduped by commodity (newest modal price wins) and show
 *     the market and an "as of <date>" stamp.
 *   - COPY. "Live data right now" → "Latest data"; the pulsing dot is gone.
 *   - The HEAD probe for /districts/<slug>.svg is gone (one request per tab
 *     that almost always 404'd). The icon registry + a generic pin cover it.
 */

"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { getDistrictIcon } from "@/components/district/icons";
import { ageInDays, asOfLabel } from "@/lib/utils/timeAgo";

interface ActiveDistrict {
  slug: string;
  name: string;
  nameLocal?: string | null;
  tagline?: string | null;
  stateSlug: string;
  stateName: string;
}

export interface LiveDataShowcaseProps {
  locale: string;
  districts: ActiveDistrict[];
}

/** Only rows newer than this many days earn a card. */
const MAX_AGE_DAYS = 30;

type ModuleKey = "crops" | "schemes" | "news" | "budget";
type AccentColor = "emerald" | "blue" | "amber" | "cyan";

/** One rendered card. `null` from a summariser means "do not render". */
interface ModuleCard {
  key: ModuleKey;
  accent: AccentColor;
  icon: string;
  title: string;
  /** Big first line, e.g. "Ragi ₹2,940 / quintal". */
  headline: string;
  /** Second line, e.g. "Mandya market · Beans ₹3,000". */
  support: string;
  /** ISO timestamp of the newest row — drives the "as of" stamp. */
  newestAt: string;
  /** Module page under the district. */
  path: string;
}

type DistrictCards =
  | { loading: true; cards: [] }
  | { loading: false; cards: ModuleCard[] };

const LOADING: DistrictCards = { loading: true, cards: [] };

// Fixed slot order; summarisers that return null simply drop out.
const MODULE_ORDER: ModuleKey[] = ["crops", "schemes", "news", "budget"];

export default function LiveDataShowcase({ locale, districts }: LiveDataShowcaseProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [byDistrict, setByDistrict] = useState<Record<string, DistrictCards>>({});

  const active = districts[activeIdx];

  // Fetch the 4 modules for the active district when the chip changes.
  // Results are cached per slug for the life of the page.
  useEffect(() => {
    if (!active) return;
    if (byDistrict[active.slug] && !byDistrict[active.slug].loading) return;

    let cancelled = false;
    const slug = active.slug;
    const stateSlug = active.stateSlug;

    async function fetchModule(path: string): Promise<unknown> {
      try {
        const res = await fetch(`/api/data/${path}?state=${stateSlug}&district=${slug}`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function loadAll() {
      const [crops, schemes, news, budget] = await Promise.all([
        fetchModule("crops"),
        fetchModule("schemes"),
        fetchModule("news"),
        fetchModule("budget"),
      ]);
      if (cancelled) return;

      const now = Date.now();
      const built: Record<ModuleKey, ModuleCard | null> = {
        crops: summarizeCrops(crops, now),
        schemes: summarizeSchemes(schemes, now),
        news: summarizeNews(news, now),
        budget: summarizeBudget(budget, now),
      };
      const cards = MODULE_ORDER.map((k) => built[k]).filter((c): c is ModuleCard => c !== null);
      setByDistrict((prev) => ({ ...prev, [slug]: { loading: false, cards } }));
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [active, byDistrict]);

  const state = useMemo<DistrictCards>(() => {
    if (!active) return LOADING;
    return byDistrict[active.slug] ?? LOADING;
  }, [active, byDistrict]);

  // Newest timestamp across the rendered cards → "Refreshed <as of>" in the
  // header. Undefined while loading or when nothing qualifies.
  const newestAsOf = useMemo(() => {
    if (state.loading || state.cards.length === 0) return "";
    const newest = state.cards
      .map((c) => new Date(c.newestAt).getTime())
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => b - a)[0];
    return newest ? asOfLabel(new Date(newest), { prefix: "Refreshed" }) : "";
  }, [state]);

  if (!active) return null;

  const districtPageBase = `/${locale}/${active.stateSlug}/${active.slug}`;
  const cardCount = state.loading ? 4 : state.cards.length;

  return (
    <section
      aria-labelledby="livedata-heading"
      className="ftp-section-wrap ftp-livedata-wrap"
      style={{ borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        /* Session 19.8 Phase F: tighten bottom padding so the gap to
           the next section (HowItWorks) shrinks. */
        .ftp-livedata-wrap { padding-bottom: 12px; }
        .ftp-livedata-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
          gap: 16px;
        }
        .ftp-livedata-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1A1A1A;
          line-height: 1.2;
        }
        .ftp-livedata-sub {
          font-size: 12px;
          color: #6B7280;
          margin: 4px 0 0;
        }
        .ftp-livedata-refreshed {
          font-size: 11px;
          color: #6B7280;
          margin: 2px 0 0;
          font-variant-numeric: tabular-nums;
        }
        .ftp-livedata-cta {
          font-size: 13px;
          font-weight: 600;
          color: #2563EB;
          text-decoration: none;
          white-space: nowrap;
        }
        .ftp-livedata-cta:hover { text-decoration: underline; text-underline-offset: 3px; }

        .ftp-livedata-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          padding-bottom: 4px;
        }
        .ftp-livedata-tabs::-webkit-scrollbar { height: 4px; }
        .ftp-livedata-tab {
          flex-shrink: 0;
          padding: 6px 14px;
          background: #F0F7FF;
          border: 1px solid #DBEAFE;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          color: #4B5563;
          cursor: pointer;
          white-space: nowrap;
          transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
        }
        .ftp-livedata-tab:hover {
          background: #DBEAFE;
          border-color: #2563EB;
        }
        .ftp-livedata-tab-active {
          background: #2563EB;
          border-color: #2563EB;
          color: #FFFFFF;
        }

        /* Grid width follows the number of qualifying cards (1–4). */
        .ftp-livedata-grid {
          display: grid;
          grid-template-columns: repeat(var(--ftp-card-count, 4), minmax(0, 1fr));
          gap: 8px;
          background: #F0F7FF;
          border: 1px solid #DBEAFE;
          border-radius: 14px;
          padding: 12px;
        }
        .ftp-data-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 12px 14px;
          text-decoration: none;
          color: #1A1A1A;
          transition: transform 150ms ease, box-shadow 150ms ease;
          position: relative;
          overflow: hidden;
          min-height: 120px;
        }
        .ftp-data-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px var(--card-shadow);
        }
        .ftp-data-card-emerald { --card-accent: #10B981; --card-shadow: rgba(16,185,129,0.15); }
        .ftp-data-card-blue    { --card-accent: #2563EB; --card-shadow: rgba(37,99,235,0.15); }
        .ftp-data-card-amber   { --card-accent: #EAB308; --card-shadow: rgba(234,179,8,0.15); }
        .ftp-data-card-cyan    { --card-accent: #06B6D4; --card-shadow: rgba(6,182,212,0.15); }

        .ftp-data-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }
        .ftp-data-card-icon { font-size: 18px; line-height: 1; }
        .ftp-data-card-title {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--card-accent);
        }
        .ftp-data-card-headline {
          font-size: 14px;
          font-weight: 700;
          color: #1A1A1A;
          line-height: 1.35;
          font-variant-numeric: tabular-nums;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .ftp-data-card-support {
          flex: 1;
          font-size: 12px;
          color: #4B5563;
          line-height: 1.5;
          margin-top: 4px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .ftp-data-card-asof {
          font-size: 10px;
          color: #6B7280;
          margin-top: 6px;
          font-variant-numeric: tabular-nums;
        }
        .ftp-data-card-loading {
          flex: 1;
          color: #9B9B9B;
          font-style: italic;
          font-size: 12px;
        }
        .ftp-data-card-footer {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #E5E7EB;
          font-size: 11px;
          font-weight: 700;
          color: var(--card-accent);
        }
        /* Shown instead of the grid when no module has rows under 30 days. */
        .ftp-livedata-none {
          font-size: 13px;
          color: #6B7280;
          background: #FAFAF8;
          border: 1px solid #E8E8E4;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .ftp-livedata-none a { color: #2563EB; font-weight: 600; text-decoration: none; }
        .ftp-livedata-none a:hover { text-decoration: underline; }

        .ftp-livedata-fade { animation: ftp-livedata-fade 250ms ease-out; }
        @keyframes ftp-livedata-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (max-width: 767px) {
          .ftp-livedata-grid { grid-template-columns: repeat(min(var(--ftp-card-count, 2), 2), minmax(0, 1fr)); gap: 6px; padding: 8px; }
          .ftp-livedata-header-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ftp-data-card { padding: 10px; min-height: 110px; }
          .ftp-data-card-title { font-size: 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-data-card { transition: none; }
          .ftp-data-card:hover { transform: none; }
          .ftp-livedata-fade { animation: none; }
        }
      `}</style>

      <div className="ftp-section-inner">
        {/* ── Header row ── */}
        <div className="ftp-livedata-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <DistrictAvatar slug={active.slug} />
            <div style={{ minWidth: 0 }}>
              <h2 id="livedata-heading" className="ftp-livedata-title">
                Latest data — {active.name}
              </h2>
              <p className="ftp-livedata-sub">
                {active.nameLocal && (
                  <span style={{ fontFamily: "var(--font-regional, var(--font-sans))" }}>
                    {active.nameLocal}
                  </span>
                )}
                {active.nameLocal && active.tagline && <span> · </span>}
                {active.tagline && <span>{active.tagline}</span>}
                {(active.nameLocal || active.tagline) && <span> · </span>}
                <span>{active.stateName}</span>
              </p>
              {newestAsOf && (
                <p className="ftp-livedata-refreshed">{newestAsOf} · every figure links to its source</p>
              )}
            </div>
          </div>
          <Link href={districtPageBase} className="ftp-livedata-cta">
            View full district →
          </Link>
        </div>

        {/* ── District tabs ── */}
        <div className="ftp-livedata-tabs" role="tablist" aria-label="Select district">
          {districts.map((d, i) => (
            <button
              key={d.slug}
              role="tab"
              aria-selected={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              className={`ftp-livedata-tab ${i === activeIdx ? "ftp-livedata-tab-active" : ""}`}
              type="button"
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* ── Module cards: only modules with rows under 30 days old ── */}
        {!state.loading && state.cards.length === 0 ? (
          <p className="ftp-livedata-none ftp-livedata-fade" key={`${active.slug}-none`}>
            Nothing new was published for {active.name} in the last {MAX_AGE_DAYS} days.
            Older records are still available on the{" "}
            <Link href={districtPageBase}>full district page →</Link>
          </p>
        ) : (
          <div
            className="ftp-livedata-grid ftp-livedata-fade"
            key={active.slug}
            style={{ "--ftp-card-count": cardCount } as React.CSSProperties}
          >
            {state.loading
              ? MODULE_ORDER.map((k) => <SkeletonCard key={k} moduleKey={k} />)
              : state.cards.map((c) => (
                  <DataCard key={c.key} card={c} href={`${districtPageBase}/${c.path}`} />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Session 19.2 Phase F: render the per-district registry icon via
// React.createElement to satisfy the React Compiler lint rule
// "no components during render" — JSX <Icon /> form with a runtime
// lookup gets flagged; createElement(Icon, props) doesn't.
function ActiveDistrictRegistryIcon({ slug }: { slug: string }) {
  const Icon = getDistrictIcon(slug);
  if (!Icon) return null;
  return React.createElement(Icon, {
    size: 36,
    className: "ftp-livedata-active-icon",
    "aria-label": `${slug} icon`,
  });
}

function DistrictAvatar({ slug }: { slug: string }) {
  const SIZE = 56;
  if (getDistrictIcon(slug)) {
    return (
      <div
        className="ftp-livedata-active-icon-wrap"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          background: "#FAFAF8",
          border: "1px solid #E8E8E4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 8,
        }}
      >
        <ActiveDistrictRegistryIcon slug={slug} />
      </div>
    );
  }
  // Fallback: generic location-pin SVG
  return (
    <div
      aria-hidden="true"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "1px solid #BFDBFE",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z" />
        <circle cx="12" cy="9" r="3" />
      </svg>
    </div>
  );
}

// Static per-module chrome (icon / colour / title / route), shared by the
// skeleton and the real card so both look identical while loading.
const MODULE_CHROME: Record<ModuleKey, { accent: AccentColor; icon: string; title: string; path: string }> = {
  crops:   { accent: "emerald", icon: "🌾", title: "Crop prices", path: "crops" },
  schemes: { accent: "blue",    icon: "🏛️", title: "Schemes",     path: "schemes" },
  news:    { accent: "amber",   icon: "📰", title: "Local news",  path: "news" },
  budget:  { accent: "cyan",    icon: "💰", title: "Budget",      path: "finance" },
};

function SkeletonCard({ moduleKey }: { moduleKey: ModuleKey }) {
  const chrome = MODULE_CHROME[moduleKey];
  return (
    <div className={`ftp-data-card ftp-data-card-${chrome.accent}`} aria-busy="true">
      <div className="ftp-data-card-header">
        <span className="ftp-data-card-icon" aria-hidden="true">{chrome.icon}</span>
        <h3 className="ftp-data-card-title">{chrome.title}</h3>
      </div>
      <div className="ftp-data-card-loading">Loading…</div>
    </div>
  );
}

function DataCard({ card, href }: { card: ModuleCard; href: string }) {
  return (
    <Link href={href} className={`ftp-data-card ftp-data-card-${card.accent}`}>
      <div className="ftp-data-card-header">
        <span className="ftp-data-card-icon" aria-hidden="true">{card.icon}</span>
        <h3 className="ftp-data-card-title">{card.title}</h3>
      </div>
      <div className="ftp-data-card-headline">{card.headline}</div>
      {card.support && <div className="ftp-data-card-support">{card.support}</div>}
      <div className="ftp-data-card-asof">{asOfLabel(card.newestAt)}</div>
      <div className="ftp-data-card-footer">View all →</div>
    </Link>
  );
}

// ── Summarisers ─────────────────────────────────────────────
// Each reads the REAL response shape of /api/data/<module> (see
// src/app/api/data/[module]/route.ts) and returns a card, or null when the
// request failed, the module is empty, or its newest row is older than
// MAX_AGE_DAYS. Null means "render nothing" — never an empty-state card.

/** ISO string of the newest timestamp in a list, or null. */
function newestOf(values: Array<string | null | undefined>): string | null {
  let best: number | null = null;
  for (const v of values) {
    if (!v) continue;
    const n = new Date(v).getTime();
    if (Number.isFinite(n) && (best === null || n > best)) best = n;
  }
  return best === null ? null : new Date(best).toISOString();
}

/** True when the timestamp is known and under MAX_AGE_DAYS old. */
function isFresh(iso: string | null, nowMs: number): iso is string {
  const days = ageInDays(iso, nowMs);
  return days !== null && days <= MAX_AGE_DAYS;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const clip = (t: string, max: number) => (t.length > max ? t.slice(0, max - 1) + "…" : t);

interface CropRow { commodity?: string; modalPrice?: number; market?: string; date?: string }

function summarizeCrops(raw: unknown, nowMs: number): ModuleCard | null {
  const list = (raw as { data?: CropRow[] } | null)?.data;
  if (!Array.isArray(list) || list.length === 0) return null;

  // Newest date first, then keep the FIRST row per commodity (= newest
  // modal price). Two markets reporting "Beans" no longer show twice.
  const sorted = [...list]
    .filter((c) => c.commodity && typeof c.modalPrice === "number")
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
  const seen = new Set<string>();
  const unique = sorted.filter((c) => {
    const key = (c.commodity ?? "").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (unique.length === 0) return null;

  const newestAt = newestOf(unique.map((c) => c.date));
  if (!isFresh(newestAt, nowMs)) return null;

  const [top, second] = unique;
  const support = [
    top.market ? `${top.market} market` : null,
    second ? `${second.commodity} ${inr(second.modalPrice as number)}` : null,
  ].filter(Boolean).join(" · ");

  return {
    key: "crops",
    ...MODULE_CHROME.crops,
    headline: `${top.commodity} ${inr(top.modalPrice as number)} / quintal`,
    support,
    newestAt,
  };
}

interface SchemeRow { name?: string; nameLocal?: string; category?: string; updatedAt?: string; active?: boolean }

function summarizeSchemes(raw: unknown, nowMs: number): ModuleCard | null {
  const list = (raw as { data?: SchemeRow[] } | null)?.data;
  if (!Array.isArray(list) || list.length === 0) return null;
  const activeRows = list.filter((s) => s.active !== false);
  if (activeRows.length === 0) return null;

  const newestAt = newestOf(activeRows.map((s) => s.updatedAt));
  if (!isFresh(newestAt, nowMs)) return null;

  const names = activeRows.map((s) => s.name).filter((n): n is string => !!n);
  const total = activeRows.length;
  return {
    key: "schemes",
    ...MODULE_CHROME.schemes,
    headline: `${total} active scheme${total === 1 ? "" : "s"}`,
    support: names.slice(0, 2).map((n) => clip(n, 40)).join(" · "),
    newestAt,
  };
}

interface NewsRow { title?: string; headline?: string; source?: string; publishedAt?: string }

function summarizeNews(raw: unknown, nowMs: number): ModuleCard | null {
  const list = (raw as { data?: NewsRow[] } | null)?.data;
  if (!Array.isArray(list) || list.length === 0) return null;

  const newestAt = newestOf(list.map((n) => n.publishedAt));
  if (!isFresh(newestAt, nowMs)) return null;

  const titles = list.map((n) => n.title ?? n.headline).filter((t): t is string => !!t);
  if (titles.length === 0) return null;
  const [first, second] = titles;
  return {
    key: "news",
    ...MODULE_CHROME.news,
    headline: clip(first, 70),
    support: [second ? clip(second, 60) : null, `${list.length} stor${list.length === 1 ? "y" : "ies"}`]
      .filter(Boolean)
      .join(" · "),
    newestAt,
  };
}

interface BudgetEntry { sector?: string; allocated?: number; spent?: number; fiscalYear?: string; fetchedAt?: string }

function summarizeBudget(raw: unknown, nowMs: number): ModuleCard | null {
  const entries = (raw as { data?: { entries?: BudgetEntry[] } } | null)?.data?.entries;
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const newestAt = newestOf(entries.map((e) => e.fetchedAt));
  if (!isFresh(newestAt, nowMs)) return null;

  // Budget values are stored in Rupees (CLAUDE.md) — format to Cr / L here.
  const fmt = (n: number) =>
    n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)} Cr` : n >= 100_000 ? `₹${(n / 100_000).toFixed(1)} L` : inr(n);
  const year = entries[0]?.fiscalYear;
  const rows = year ? entries.filter((e) => e.fiscalYear === year) : entries;
  const alloc = rows.reduce((s, e) => s + (e.allocated ?? 0), 0);
  const spent = rows.reduce((s, e) => s + (e.spent ?? 0), 0);
  if (alloc <= 0) return null;

  return {
    key: "budget",
    ...MODULE_CHROME.budget,
    headline: `${fmt(alloc)} allocated`,
    support: [`${fmt(spent)} spent`, year ? `FY ${year}` : null, `${rows.length} sector${rows.length === 1 ? "" : "s"}`]
      .filter(Boolean)
      .join(" · "),
    newestAt,
  };
}
