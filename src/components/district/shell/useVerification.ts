/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// useVerification — the double-check status of each dataset for a district,
// from GET /api/data/verification (v5.1). Feature-detected: while the API or
// its table does not exist (404 / 500 / network error / an unknown body) it
// returns null, and the verification panel keeps its old behaviour. One
// request per district, cached ten minutes, never retried.
"use client";

import { useQuery } from "@tanstack/react-query";
import { normaliseVerification, type VerificationMap } from "./verification";

export function useVerification(stateSlug: string, districtSlug: string): VerificationMap | null {
  const { data } = useQuery<VerificationMap | null>({
    queryKey: ["verification", stateSlug, districtSlug],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/data/verification?district=${encodeURIComponent(districtSlug)}&state=${encodeURIComponent(stateSlug)}`,
        );
        if (!res.ok) return null;
        return normaliseVerification(await res.json());
      } catch {
        return null;
      }
    },
    staleTime: 10 * 60_000,
    retry: false,
    enabled: Boolean(districtSlug),
  });
  return data ?? null;
}
