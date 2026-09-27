/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  home-data — shared client-side fetches for the home page
// ═══════════════════════════════════════════════════════════════════════
//
//  Several home sections need the same two small payloads:
//
//    usePreview()   → GET /api/data/homepage-preview   (weather, grade per district)
//    useTopVotes()  → GET /api/district-request         (top requested districts)
//
//  Each URL is fetched ONCE per page load, no matter how many components
//  ask for it: the first caller starts the request and everyone else
//  awaits the same promise. Both endpoints are cached on the server
//  (Redis), so this is cheap. No polling.
//
"use client";

import { useEffect, useState } from "react";

// ── homepage-preview ──

/** One district's row from /api/data/homepage-preview (only the fields we use). */
export interface DistrictPreview {
  slug: string;
  /** Null when the latest reading is too old — the API drops stale weather. */
  weather: { temp: number | null; conditions?: string | null; recordedAt?: string | null } | null;
  news: { title: string; source?: string | null; publishedAt: string } | null;
  healthGrade: string | null;
  healthScore: number | null;
}

let previewPromise: Promise<Record<string, DistrictPreview>> | null = null;

function loadPreview(): Promise<Record<string, DistrictPreview>> {
  if (!previewPromise) {
    previewPromise = fetch("/api/data/homepage-preview")
      .then((r) => (r.ok ? r.json() : { districtPreviews: [] }))
      .then((data: { districtPreviews?: DistrictPreview[] }) => {
        const map: Record<string, DistrictPreview> = {};
        for (const row of data.districtPreviews ?? []) map[row.slug] = row;
        return map;
      })
      .catch(() => {
        previewPromise = null; // allow a retry on the next mount
        return {};
      });
  }
  return previewPromise;
}

/** Preview rows keyed by district slug. Empty object until loaded. */
export function usePreview(): Record<string, DistrictPreview> {
  const [data, setData] = useState<Record<string, DistrictPreview>>({});
  useEffect(() => {
    let cancelled = false;
    loadPreview().then((map) => {
      if (!cancelled) setData(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

// ── district-request (votes) ──

/** One row of the "which district next?" vote. */
export interface DistrictVote {
  stateName: string;
  districtName: string;
  requestCount: number;
}

let votesPromise: Promise<DistrictVote[]> | null = null;

function loadVotes(): Promise<DistrictVote[]> {
  if (!votesPromise) {
    votesPromise = fetch("/api/district-request")
      .then((r) => (r.ok ? r.json() : { top: [] }))
      .then((data: { top?: DistrictVote[] }) =>
        (data.top ?? []).filter((v) => v && typeof v.requestCount === "number"),
      )
      .catch(() => {
        votesPromise = null;
        return [];
      });
  }
  return votesPromise;
}

/**
 * Top requested districts, most votes first (the API returns up to 5).
 * `loaded` is false until the request finishes, so callers can avoid
 * printing an empty sentence while waiting.
 */
export function useTopVotes(): { votes: DistrictVote[]; loaded: boolean } {
  const [state, setState] = useState<{ votes: DistrictVote[]; loaded: boolean }>({ votes: [], loaded: false });
  useEffect(() => {
    let cancelled = false;
    loadVotes().then((votes) => {
      if (!cancelled) setState({ votes, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

/** "Kanpur Dehat" → "kanpur-dehat" — matches the registry's slug style. */
export function slugifyDistrictName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
