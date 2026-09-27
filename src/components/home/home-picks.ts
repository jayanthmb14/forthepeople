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
//    pickCropTicks   which mandi prices the ticker shows
//    buildMapStat    a live district's facts on the map card (the same
//                    order of sources as the district pages)
//    pickSupporters  which supporters' names the support band lists
import { isNonProject, projectStage } from "@/lib/civic/project-facts";
import { dayOf, daysBetween, todayIST } from "@/lib/markets/compute";
import type { CropTick, MapDistrictStat } from "./home-types";

// ── Mandi prices for the ticker ────────────────────────────────────────

/** Staples a citizen recognises, in the order the ticker prefers them. */
export const STAPLES: ReadonlyArray<{ key: string; match: RegExp }> = [
  { key: "tomato", match: /^tomato$/i },
  { key: "onion", match: /^onion$/i },
  { key: "potato", match: /^potato$/i },
  { key: "rice", match: /^rice$/i },
  { key: "paddy", match: /^paddy/i },
  { key: "wheat", match: /^wheat$/i },
];

/** Crop prices older than this many days are marked old (DESIGN-SYSTEM §6: crop prices 7). */
export const CROP_MAX_AGE_DAYS = 7;
export const MAX_CROP_TICKS = 5;

export interface CropRow {
  districtId: string;
  commodity: string;
  market: string;
  modalPrice: number;
  date: Date;
}

/**
 * Up to five staple prices, each from a different district and, as far as
 * possible, a different crop, from each district's newest mandi day
 * (`rows` holds only those days). Districts with the newest day go first,
 * then the order of `districts`. Every tick keeps its market and date; one
 * older than a week is marked old.
 */
export function pickCropTicks(
  districts: ReadonlyArray<{ id: string; slug: string; stateSlug: string }>,
  rows: readonly CropRow[],
  nowMs: number = Date.now(),
): CropTick[] {
  const newest = new Map<string, number>();
  for (const r of rows) newest.set(r.districtId, Math.max(newest.get(r.districtId) ?? 0, r.date.getTime()));
  const order = new Map(districts.map((d, i) => [d.id, i]));
  const byDistrict = [...newest.entries()]
    .filter(([id]) => order.has(id))
    .sort((a, b) => b[1] - a[1] || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
    .map(([id]) => id);

  const today = todayIST(nowMs);
  const picked: CropTick[] = [];
  const used = new Set<string>();
  // Round-robin over the staples (one district per crop per round), so the
  // ticker shows different crops before it repeats one; stop when a round
  // finds nothing more.
  for (let progress = true; progress && picked.length < MAX_CROP_TICKS; ) {
    progress = false;
    for (const staple of STAPLES) {
      if (picked.length >= MAX_CROP_TICKS) break;
      const hit = byDistrict
        .filter((id) => !used.has(id))
        .map((id) => rows.find((r) => r.districtId === id && r.date.getTime() === newest.get(id) && staple.match.test(r.commodity.trim()) && r.modalPrice > 0))
        .find(Boolean);
      if (!hit) continue;
      const d = districts.find((x) => x.id === hit.districtId);
      if (!d) continue;
      used.add(hit.districtId);
      progress = true;
      const day = dayOf(Math.floor(hit.date.getTime() / 1000));
      const age = Math.max(0, daysBetween(day, today));
      picked.push({
        commodity: hit.commodity.trim(),
        cropKey: staple.key,
        market: hit.market.trim(),
        perQuintal: hit.modalPrice,
        day,
        ageDays: age,
        old: age > CROP_MAX_AGE_DAYS,
        stateSlug: d.stateSlug,
        districtSlug: d.slug,
      });
    }
  }
  return picked;
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
