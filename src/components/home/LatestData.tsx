/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LatestData — "Latest data — <district>" on the home page (CONCEPT §5)
// ═══════════════════════════════════════════════════════════════════════
//
//    Latest data — Mandya                          View full district →
//    [Mandya] [Mysuru] [Bengaluru Urban] …          ← Chips, one per live district
//    ┌ Crop prices ┐ ┌ Schemes ┐ ┌ Local news ┐ ┌ Budget ┐   ← up to 4 cards
//      headline · one supporting line · As of 12 Sep · SOURCE
//
//  Honesty rules (kept from the 2026-09 audit rewrite of LiveDataShowcase):
//    - Every summariser reads the REAL response shape of /api/data/<module>:
//      `{ data: [...] }` for crops / schemes / news and
//      `{ data: { entries, allocations } }` for budget.
//    - FRESHNESS GATE (crops, news): a card renders only when its newest row
//      is at most MAX_AGE_DAYS (30) old. Stale, empty or failed modules
//      render NOTHING. If no module qualifies, one honest sentence is shown.
//    - REFERENCE MODULES (schemes, budget) change once a year, so the 30-day
//      gate would hide them for eleven months. They skip the gate and carry
//      their period instead of a date: "For FY 2024-25", "Updated Mar 2026".
//    - Crops are deduped by commodity (newest modal price wins).
//    - Budget values are stored in whole rupees and formatted to Cr / L here.
//
//  The four module requests for a district are made when its chip is
//  selected, and cached for the life of the page.
//
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Landmark, Newspaper, Wallet, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AsOfText, Chips, Section, SourcePill } from "@/components/district/ui";
import { ageInDays } from "@/lib/utils/timeAgo";
import styles from "./home.module.css";

interface ActiveDistrict {
  slug: string;
  name: string;
  nameLocal?: string | null;
  tagline?: string | null;
  stateSlug: string;
  stateName: string;
}

export interface LatestDataProps {
  locale: string;
  districts: ActiveDistrict[];
}

/** Only rows newer than this many days earn a card. */
const MAX_AGE_DAYS = 30;

type ModuleKey = "crops" | "schemes" | "news" | "budget";

/** One rendered card. `null` from a summariser means "do not render". */
interface ModuleCard {
  key: ModuleKey;
  title: string;
  /** Big first line, e.g. "Ragi ₹2,940 / quintal". */
  headline: string;
  /** Second line, e.g. "Mandya market · Beans ₹3,000". */
  support: string;
  /** ISO timestamp of the newest row — drives the "As of" stamp. */
  newestAt: string;
  /** Reference data (schemes, budget): the period the figure belongs to,
   *  shown instead of a date, e.g. { prefix: "For", label: "FY 2024-25" }. */
  period?: { prefix: string; label: string };
  /** Module page under the district. */
  path: string;
  /** Where the figure comes from (SourcePill). */
  source: { label: string; href?: string };
}

type DistrictCards = { loading: true; cards: [] } | { loading: false; cards: ModuleCard[] };

const LOADING: DistrictCards = { loading: true, cards: [] };

// Fixed slot order; summarisers that return null simply drop out.
const MODULE_ORDER: ModuleKey[] = ["crops", "schemes", "news", "budget"];

// Static per-module chrome shared by the loading and the real card.
const MODULE_CHROME: Record<ModuleKey, { icon: LucideIcon; emoji: string; hue: string; title: string; path: string }> = {
  crops: { icon: Wheat, emoji: "🌾", hue: "green", title: "Crop prices", path: "crops" },
  schemes: { icon: Landmark, emoji: "📋", hue: "violet", title: "Schemes", path: "schemes" },
  news: { icon: Newspaper, emoji: "📰", hue: "blue", title: "Local news", path: "news" },
  budget: { icon: Wallet, emoji: "💰", hue: "amber", title: "Budget", path: "finance" },
};

export default function LatestData({ locale, districts }: LatestDataProps) {
  const [activeSlug, setActiveSlug] = useState<string>(districts[0]?.slug ?? "");
  const [byDistrict, setByDistrict] = useState<Record<string, DistrictCards>>({});
  const active = districts.find((d) => d.slug === activeSlug) ?? districts[0];

  // Fetch the 4 modules for the selected district (once per district).
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
        schemes: summarizeSchemes(schemes),
        news: summarizeNews(news, now),
        budget: summarizeBudget(budget),
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

  if (!active) return null;

  const districtPageBase = `/${locale}/${active.stateSlug}/${active.slug}`;

  return (
    <div className="ftp-container">
      <Section
        id="latest-data"
        title={`Latest data for ${active.name}`}
        emoji="⚡"
        titleLocal={active.nameLocal && active.nameLocal !== active.name ? active.nameLocal : undefined}
        action={
          <Link href={districtPageBase} className={styles.inlineLink}>
            View full district
            <ArrowRight size={14} aria-hidden />
          </Link>
        }
      >
        <Chips
          label="Choose a district"
          items={districts.map((d) => ({ value: d.slug, label: d.name }))}
          value={active.slug}
          onChange={setActiveSlug}
        />

        {!state.loading && state.cards.length === 0 ? (
          <p className={styles.latestNone}>
            Nothing new was published for {active.name} in the last {MAX_AGE_DAYS} days. Older records are still on
            the <Link href={districtPageBase}>full district page</Link>.
          </p>
        ) : (
          <div
            className={styles.latestGrid}
            data-count={state.loading ? MODULE_ORDER.length : state.cards.length}
            aria-busy={state.loading}
          >
            {state.loading
              ? MODULE_ORDER.map((k) => <LoadingCard key={k} moduleKey={k} />)
              : state.cards.map((c) => <DataCard key={c.key} card={c} href={`${districtPageBase}/${c.path}`} />)}
          </div>
        )}
      </Section>
    </div>
  );
}

/** Card header: 16 px Lucide icon + title. */
function CardTitle({ moduleKey, title, href }: { moduleKey: ModuleKey; title: string; href?: string }) {
  return (
    <h3 className={styles.latestTitle}>
      <span className={`${styles.latestEmoji} ftp-emoji`} aria-hidden>
        {MODULE_CHROME[moduleKey].emoji}
      </span>
      {href ? (
        <Link href={href} className={styles.latestTitleLink}>
          {title}
        </Link>
      ) : (
        title
      )}
    </h3>
  );
}

function LoadingCard({ moduleKey }: { moduleKey: ModuleKey }) {
  return (
    <article className={`${styles.latestCard} ftp-hue-${MODULE_CHROME[moduleKey].hue}`}>
      <CardTitle moduleKey={moduleKey} title={MODULE_CHROME[moduleKey].title} />
      <div className={`ftp-skeleton ${styles.latestSkeleton}`} aria-hidden />
      <span className="sr-only">Loading…</span>
    </article>
  );
}

function DataCard({ card, href }: { card: ModuleCard; href: string }) {
  return (
    <article className={`${styles.latestCard} ftp-hue-${MODULE_CHROME[card.key].hue}`}>
      <CardTitle moduleKey={card.key} title={card.title} href={href} />
      {/* Figures (price, count, rupees) are mono; a news headline is plain text. */}
      <p className={`${styles.latestHeadline} ${card.key === "news" ? "" : "ftp-num"}`}>{card.headline}</p>
      {card.support && <p className={styles.latestSupport}>{card.support}</p>}
      <div className={styles.latestMeta}>
        <AsOfText asOf={card.newestAt} period={card.period?.label} prefix={card.period?.prefix ?? "As of"} />
        <SourcePill label={card.source.label} href={card.source.href} />
      </div>
    </article>
  );
}

// ── Summarisers ─────────────────────────────────────────────
// Each reads the REAL response shape of /api/data/<module> (see
// src/app/api/data/[module]/route.ts) and returns a card, or null when the
// request failed, the module is empty, or (crops, news only) its newest row
// is older than MAX_AGE_DAYS. Null means "render nothing" — never an
// empty-state card.

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

/** "Mar 2026" from an ISO timestamp. */
const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

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
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    key: "crops",
    title: MODULE_CHROME.crops.title,
    path: MODULE_CHROME.crops.path,
    headline: `${top.commodity} ${inr(top.modalPrice as number)} / quintal`,
    support,
    newestAt,
    source: { label: "AGMARKNET", href: "https://agmarknet.gov.in" },
  };
}

interface SchemeRow { name?: string; nameLocal?: string; category?: string; updatedAt?: string; active?: boolean }

// Reference data: no freshness gate. The card says when the list was last
// updated ("Updated Mar 2026") so an old list never passes as new.
function summarizeSchemes(raw: unknown): ModuleCard | null {
  const list = (raw as { data?: SchemeRow[] } | null)?.data;
  if (!Array.isArray(list) || list.length === 0) return null;
  const activeRows = list.filter((s) => s.active !== false);
  if (activeRows.length === 0) return null;
  const newestAt = newestOf(activeRows.map((s) => s.updatedAt));
  if (!newestAt) return null;
  const names = activeRows.map((s) => s.name).filter((n): n is string => !!n);
  const total = activeRows.length;
  return {
    key: "schemes",
    title: MODULE_CHROME.schemes.title,
    path: MODULE_CHROME.schemes.path,
    headline: `${total} active scheme${total === 1 ? "" : "s"}`,
    support: names.slice(0, 2).map((n) => clip(n, 40)).join(" · "),
    newestAt,
    period: { prefix: "Updated", label: monthYear(newestAt) },
    source: { label: "MyScheme", href: "https://www.myscheme.gov.in" },
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
  // The outlet of the first headline, when the feed names one.
  const outlet = list.find((n) => (n.title ?? n.headline) === first)?.source?.trim();
  return {
    key: "news",
    title: MODULE_CHROME.news.title,
    path: MODULE_CHROME.news.path,
    headline: clip(first, 70),
    support: [second ? clip(second, 60) : null, `${list.length} stor${list.length === 1 ? "y" : "ies"}`]
      .filter(Boolean)
      .join(" · "),
    newestAt,
    source: { label: outlet ? clip(outlet, 24) : "News feeds" },
  };
}

interface BudgetEntry { sector?: string; allocated?: number; spent?: number; fiscalYear?: string; fetchedAt?: string }

// Reference data: a budget belongs to a fiscal year, not to a day. No
// freshness gate; the card is labelled with its FY instead.
function summarizeBudget(raw: unknown): ModuleCard | null {
  const entries = (raw as { data?: { entries?: BudgetEntry[] } } | null)?.data?.entries;
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const newestAt = newestOf(entries.map((e) => e.fetchedAt));
  if (!newestAt) return null;
  // Budget values are stored in Rupees (CLAUDE.md) — format to Cr / L here.
  const oneDp = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const fmt = (n: number) =>
    n >= 10_000_000 ? `₹${oneDp(n / 10_000_000)} Cr` : n >= 100_000 ? `₹${oneDp(n / 100_000)} L` : inr(n);
  const year = entries[0]?.fiscalYear;
  const rows = year ? entries.filter((e) => e.fiscalYear === year) : entries;
  const alloc = rows.reduce((s, e) => s + (e.allocated ?? 0), 0);
  const spent = rows.reduce((s, e) => s + (e.spent ?? 0), 0);
  if (alloc <= 0) return null;
  return {
    key: "budget",
    title: MODULE_CHROME.budget.title,
    path: MODULE_CHROME.budget.path,
    headline: `${fmt(alloc)} allocated`,
    support: [`${fmt(spent)} spent`, `${rows.length} sector${rows.length === 1 ? "" : "s"}`].join(" · "),
    newestAt,
    period: year ? { prefix: "For", label: `FY ${year}` } : { prefix: "Updated", label: monthYear(newestAt) },
    source: { label: "PFMS", href: "https://pfms.nic.in" },
  };
}
