/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Home page — pure choices (no database, no React; tests/home.test.ts)
// ═══════════════════════════════════════════════════════════════════════
//
//  The rules that decide WHICH figure the home page shows, kept apart from
//  the queries so they can be tested:
//    fuelFigures     petrol and diesel for the ticker and the price cards
//    buildMapStat    a live district's facts on the map card (the same
//                    order of sources as the district pages)
//    pickSupporters  which supporters' names the support band lists
import { isNonProject, projectStage } from "@/lib/civic/project-facts";
import { ageInDays as marketAgeDays, isStale } from "@/lib/markets/compute";
import { isFuelSnapshot, type FuelSnapshot } from "@/scraper/lib/fuel-prices";
import type { FuelFigure, MapDistrictStat } from "./home-types";

// ── Petrol and diesel ──────────────────────────────────────────────────

/**
 * The price cards' petrol and diesel from the stored PPAC snapshot: Delhi
 * as the headline (the national reference), the other metros beside it.
 * Nothing without a readable snapshot or without Delhi; the day's age uses
 * the markets' rule (a normal weekend / holiday gap is not "old").
 */
export function fuelFigures(snap: FuelSnapshot | null, nowMs: number = Date.now()): FuelFigure[] {
  if (!isFuelSnapshot(snap)) return [];
  const delhi = snap.cities.find((c) => c.city === "Delhi");
  if (!delhi) return [];
  const others = snap.cities.filter((c): c is typeof c & { city: "Mumbai" | "Chennai" | "Kolkata" } => c.city !== "Delhi");
  const ageDays = marketAgeDays(snap.asOf, nowMs);
  const old = isStale(snap.asOf, nowMs);
  return (["petrol", "diesel"] as const).map((fuel) => ({
    fuel,
    city: "Delhi" as const,
    value: delhi[fuel],
    check: delhi.check,
    others: others.map((c) => ({ city: c.city, value: c[fuel] })),
    day: snap.asOf,
    ageDays,
    old,
  }));
}

// ── A live district's facts on the map card ────────────────────────────

export interface MapStatInput {
  /** Newest DemographicProfile with a head count, if any. */
  profile: { totalPopulation: number | null; dataset: string } | null;
  /** Newest Census row in PopulationHistory, if any. */
  census: { year: number; population: number } | null;
  /** The District row's own population (treated as an estimate). */
  districtPopulation: number | null;
  /** The district's local projects (LOCAL_INFRA), or null when the query failed. */
  projects: ReadonlyArray<{ status: string | null; name: string | null }> | null;
  score: { grade: string; generatedAt: Date; expiresAt: Date } | null;
  newest: string | null;
}

/**
 * Same rules as the district pages, so the map card agrees with the page one
 * tap away: population from the census profile, then the Census row, then
 * the District row as an estimate (= /api/data/glance); "being built" =
 * projects at the "building" stage, renamings left out (= the Projects
 * page); the grade with its date and whether it has expired.
 */
export function buildMapStat(input: MapStatInput, nowMs: number = Date.now()): MapDistrictStat {
  const { profile, census, districtPopulation, projects, score, newest } = input;
  const population: MapDistrictStat["population"] = profile?.totalPopulation
    ? { value: profile.totalPopulation, dataset: profile.dataset, estimate: false }
    : census?.population
      ? { value: census.population, dataset: `Census ${census.year}`, estimate: false }
      : districtPopulation
        ? { value: districtPopulation, dataset: null, estimate: true }
        : null;
  const real = projects ? projects.filter((p) => !isNonProject({ name: p.name ?? "" })) : null;
  const building = real && real.length > 0 ? real.filter((p) => projectStage(p.status) === "building").length : null;
  return {
    population,
    building,
    grade: score ? { grade: score.grade, date: score.generatedAt.toISOString(), expired: score.expiresAt.getTime() < nowMs } : null,
    newest,
  };
}

// ── Supporters' names for the support band ─────────────────────────────

export interface PublicSupporter {
  id: string;
  name: string;
  tier: string;
  isRecurring: boolean;
  districtSlug: string | null;
  stateSlug: string | null;
  stateName: string | null;
}

/** Founding Builder first, then monthly supporters, then one-time gifts; anonymous left out; no repeats. */
export function pickSupporters(data: { subscribers?: PublicSupporter[]; oneTime?: PublicSupporter[] }, max = 6): PublicSupporter[] {
  const subs = data.subscribers ?? [];
  const once = data.oneTime ?? [];
  const all = [...once.filter((s) => s.tier === "founder"), ...subs, ...once.filter((s) => s.tier !== "founder")];
  const seen = new Set<string>();
  const out: PublicSupporter[] = [];
  for (const s of all) {
    if (!s || !s.name || !s.name.trim() || s.name === "Anonymous" || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}
