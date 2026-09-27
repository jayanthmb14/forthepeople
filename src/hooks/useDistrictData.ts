/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Base district data hook
// All module-specific hooks build on this
// ═══════════════════════════════════════════════════════════
"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useLocale } from "next-intl";

export interface ApiMeta {
  module: string;
  district: string;
  updatedAt: string;
  fromCache: boolean;
  error?: string;
  lastUpdated?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  /**
   * A collector's checked district snapshot, for modules that have one
   * (schools → UDISE+ totals, panchayats → MGNREGA). Pages narrow the type.
   */
  snapshot?: unknown;
}

async function fetchDistrictData<T>(
  module: string,
  district: string,
  state: string,
  taluk?: string,
  locale?: string
): Promise<ApiResponse<T>> {
  const params = new URLSearchParams({ district, state });
  if (taluk) params.set("taluk", taluk);
  // Modules with live text (news) return the STORED translation for this
  // language; the server ignores it for every other module.
  if (locale && locale !== "en") params.set("locale", locale);

  const res = await fetch(`/api/data/${module}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useDistrictData<T>(
  module: string,
  district: string,
  state: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>, Error>>,
  taluk?: string
) {
  const locale = useLocale();
  return useQuery<ApiResponse<T>, Error>({
    queryKey: ["district", district, module, taluk, locale],
    queryFn: () => fetchDistrictData<T>(module, district, state, taluk, locale),
    enabled: Boolean(district && state),
    staleTime: getStaleTime(module),
    refetchInterval: getRefetchInterval(module),
    ...options,
  });
}

// Keep in sync with getModuleTTL in src/lib/cache.ts
const LIVE_MODULES = ["crops", "weather", "water", "dam", "alerts", "news", "power"];

function getStaleTime(module: string): number {
  return LIVE_MODULES.includes(module) ? 30_000 : 120_000;
}

function getRefetchInterval(module: string): number | false {
  return LIVE_MODULES.includes(module) ? 60_000 : false;
}
