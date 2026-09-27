/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Client hook for /api/data/forecast (the weather page and the overview's
// TodayWeatherTile share it, so the forecast is fetched once per visit).
"use client";

import { useQuery } from "@tanstack/react-query";
import type { ForecastPayload } from "./forecast";

export type ForecastResponse = ForecastPayload & { fromCache?: boolean };

async function fetchForecast(state: string, district: string): Promise<ForecastResponse | null> {
  const qs = new URLSearchParams({ state, district });
  const res = await fetch(`/api/data/forecast?${qs.toString()}`);
  // 404 = no verified point for this district: not an error, just no forecast.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`forecast ${res.status}`);
  return (await res.json()) as ForecastResponse;
}

export function useForecast(state: string, district: string) {
  return useQuery<ForecastResponse | null, Error>({
    queryKey: ["forecast", state, district],
    queryFn: () => fetchForecast(state, district),
    enabled: Boolean(state && district),
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  });
}
