/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  useFreshness — one fetch of /api/data/freshness per district page load
// ═══════════════════════════════════════════════════════════════════════
//
//  The left rail, the "Today in <district>" tiles and any FreshnessPill can
//  all ask "how old is the weather / crops / dam / news data?" without each
//  making its own request. Results live in a tiny module-level store,
//  cached per district for five minutes and shared between every component
//  that calls the hook (via React's useSyncExternalStore).
//
//  The response shape mirrors src/app/api/data/freshness/route.ts:
//    modules.weather   { status, age, lastUpdated }
//    modules.crops     { status, age, lastUpdated, dataDate }
//    modules.dam       { status, age, lastUpdated }
//    modules.news      { status, age, lastUpdated }
//    modules.alerts    { activeCount, status: "ok" }      ← no timestamp
//    modules.aiInsights{ status, age, lastUpdated }
//    summary           { green, amber, red, unknown }
//    datasets          v5: one row per dataset on the district's pages
//                      (src/lib/freshness.ts) — status current / late /
//                      unknown / not_collected / reference
//    live              v5: { current, total } of the five fast feeds
//
"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { DatasetFreshness } from "@/lib/freshness";

export type { DatasetFreshness, DatasetStatus } from "@/lib/freshness";

/** Traffic-light status as computed by the API. */
export type FreshnessStatus = "green" | "amber" | "red" | "unknown";

/** Keys the API reports on. */
export type FreshnessKey = "weather" | "crops" | "dam" | "news" | "alerts" | "aiInsights";

/** Normalised per-module freshness. */
export interface ModuleFreshness {
  /** ISO timestamp of the newest row, or null when there is no data. */
  asOf: string | null;
  status: FreshnessStatus;
  /** Human age from the API, e.g. "12 min ago" or "no data". */
  age: string | null;
  /** Only for alerts: number of active alerts right now. */
  activeCount?: number;
}

/** Raw shape returned by GET /api/data/freshness?district=<slug>. */
export interface FreshnessResponse {
  district: string;
  districtSlug: string;
  checkedAt: string;
  modules: {
    weather: { status: FreshnessStatus; age: string; lastUpdated: string | null };
    crops: { status: FreshnessStatus; age: string; lastUpdated: string | null; dataDate: string | null };
    dam: { status: FreshnessStatus; age: string; lastUpdated: string | null };
    news: { status: FreshnessStatus; age: string; lastUpdated: string | null };
    alerts: { activeCount: number; status: "ok" };
    aiInsights: { status: FreshnessStatus; age: string; lastUpdated: string | null };
  };
  summary: { green: number; amber: number; red: number; unknown: number };
  /** v5 — absent from a cached pre-v5 response. */
  datasets?: DatasetFreshness[];
  live?: { current: number; total: number };
}

export interface FreshnessResult {
  /** Per-module freshness, keyed by FreshnessKey. Empty until loaded. */
  modules: Partial<Record<FreshnessKey, ModuleFreshness>>;
  summary: FreshnessResponse["summary"] | null;
  /** When the API computed these numbers. */
  checkedAt: string | null;
  loading: boolean;
  error: string | null;
  /**
   * Freshness for a sidebar module slug (e.g. "water" → dam data).
   * Returns null when the module has no freshness feed.
   */
  forModule: (slug: string) => ModuleFreshness | null;
  /** v5: every dataset, in registry order (empty until loaded). */
  datasets: DatasetFreshness[];
  /** v5: the datasets a module page shows, main first. */
  datasetsFor: (slug: string) => DatasetFreshness[];
  /** v5: a module's main dataset, or null (meta pages, not loaded yet). */
  primary: (slug: string) => DatasetFreshness | null;
  /** v5: fast feeds that are current, e.g. { current: 3, total: 5 }. */
  live: { current: number; total: number } | null;
}

/**
 * Sidebar module slug → freshness key. Modules not listed here have no
 * live feed and show a grey dot in the rail.
 */
export const MODULE_TO_FRESHNESS_KEY: Record<string, FreshnessKey> = {
  weather: "weather",
  crops: "crops",
  water: "dam",
  news: "news",
};

const TTL_MS = 5 * 60 * 1000;

// ── Module-level store ─────────────────────────────────────────────────

interface Entry {
  status: "loading" | "ready" | "error";
  data: FreshnessResponse | null;
  error: string | null;
  fetchedAt: number;
}

const store = new Map<string, Entry>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function cacheKey(stateSlug: string, districtSlug: string): string {
  return `${stateSlug}/${districtSlug}`;
}

function isFresh(entry: Entry | undefined): boolean {
  return !!entry && entry.status === "ready" && Date.now() - entry.fetchedAt < TTL_MS;
}

/**
 * Fetch (or reuse) the freshness payload for a district. Safe to call from
 * many components at once — only one request goes out per district per
 * five minutes. Exported so a page can warm the cache early.
 */
export function loadFreshness(stateSlug: string, districtSlug: string, force = false): void {
  if (!districtSlug) return;
  const key = cacheKey(stateSlug, districtSlug);
  const current = store.get(key);
  if (!force && (isFresh(current) || current?.status === "loading")) return;

  store.set(key, { status: "loading", data: current?.data ?? null, error: null, fetchedAt: current?.fetchedAt ?? 0 });
  emit();

  fetch(`/api/data/freshness?district=${encodeURIComponent(districtSlug)}`, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Freshness HTTP ${res.status}`);
      const data = (await res.json()) as FreshnessResponse;
      store.set(key, { status: "ready", data, error: null, fetchedAt: Date.now() });
    })
    .catch((e: unknown) => {
      const prev = store.get(key);
      store.set(key, {
        status: "error",
        data: prev?.data ?? null,
        error: e instanceof Error ? e.message : "Could not load freshness",
        fetchedAt: prev?.fetchedAt ?? 0,
      });
    })
    .finally(emit);
}

/** Turn the raw API payload into the flat ModuleFreshness map. */
export function normaliseFreshness(data: FreshnessResponse): Partial<Record<FreshnessKey, ModuleFreshness>> {
  const m = data.modules;
  const ts = (v: string | null | undefined) => (v ? new Date(v).toISOString() : null);
  return {
    weather: { asOf: ts(m.weather?.lastUpdated), status: m.weather?.status ?? "unknown", age: m.weather?.age ?? null },
    crops: { asOf: ts(m.crops?.lastUpdated), status: m.crops?.status ?? "unknown", age: m.crops?.age ?? null },
    dam: { asOf: ts(m.dam?.lastUpdated), status: m.dam?.status ?? "unknown", age: m.dam?.age ?? null },
    news: { asOf: ts(m.news?.lastUpdated), status: m.news?.status ?? "unknown", age: m.news?.age ?? null },
    // Alerts carry no timestamp; expose the count and leave the light unknown.
    alerts: { asOf: null, status: "unknown", age: null, activeCount: m.alerts?.activeCount ?? 0 },
    aiInsights: { asOf: ts(m.aiInsights?.lastUpdated), status: m.aiInsights?.status ?? "unknown", age: m.aiInsights?.age ?? null },
  };
}

const EMPTY_MODULES: Partial<Record<FreshnessKey, ModuleFreshness>> = {};
const EMPTY_DATASETS: DatasetFreshness[] = [];

/**
 * useFreshness(stateSlug, districtSlug)
 *
 * Returns { modules, summary, checkedAt, loading, error, forModule }.
 * Fetches once per district (5-minute in-memory cache shared across all
 * callers), so mounting it in the sidebar AND in a page costs one request.
 *
 * @example
 *   const fresh = useFreshness("karnataka", "mandya");
 *   const crops = fresh.forModule("crops");   // { asOf, status, age }
 */
export function useFreshness(stateSlug: string, districtSlug: string): FreshnessResult {
  const key = cacheKey(stateSlug, districtSlug);

  const entry = useSyncExternalStore(
    subscribe,
    () => store.get(key),
    () => undefined, // server snapshot: nothing loaded yet
  );

  // Kick off (or refresh) the fetch after mount. No setState here — the
  // store update flows back through useSyncExternalStore.
  useEffect(() => {
    loadFreshness(stateSlug, districtSlug);
  }, [stateSlug, districtSlug]);

  const data = entry?.data ?? null;
  const modules = useMemo(() => (data ? normaliseFreshness(data) : EMPTY_MODULES), [data]);
  const datasets = data?.datasets ?? EMPTY_DATASETS;

  return {
    modules,
    summary: data?.summary ?? null,
    checkedAt: data?.checkedAt ?? null,
    loading: !entry || entry.status === "loading",
    error: entry?.status === "error" ? entry.error : null,
    forModule: (slug: string) => {
      const k = MODULE_TO_FRESHNESS_KEY[slug];
      return k ? (modules[k] ?? null) : null;
    },
    datasets,
    datasetsFor: (slug: string) => datasets.filter((d) => d.module === slug),
    primary: (slug: string) => datasets.find((d) => d.module === slug && d.primary) ?? null,
    live: data?.live ?? null,
  };
}
