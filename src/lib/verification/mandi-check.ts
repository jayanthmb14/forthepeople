/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Mandi (crop price) check — CEDA mirror parsing and matching (pure)
//
// Second source: CEDA, Ashoka University's AGMARKNET mirror
// (agmarknet.ceda.ashoka.edu.in). Its public JSON endpoints, as used by
// its own site (Sept 2026):
//   GET  /api/states                      { data: [{ census_state_id, census_state_name }] }
//   GET  /api/districts?state_id=29       { data: [{ census_district_id, census_district_name }] }
//   GET  /api/commodities                 { data: [{ commodity_id, commodity_disp_name, category_id }] }
//   POST /api/prices  { state_id, district_id, commodity_id, calculation_type: "d",
//                       start_date: "YYYY-MM-DD", end_date }
//        → { data: [{ t: "2025-10-30", cmdty, district_id, district, p_min, p_max, p_modal }] }
// Prices are ₹ per quintal, one row per day for the whole district.
// CEDA re-publishes AGMARKNET, so it is the same original data through a
// different pipeline: agreement proves our copy (district mapping, units,
// dates) is right, not the mandi's own figure — hence "independent: false".
// Its daily series stopped on 30 Oct 2025 (checked 27 Sep 2026); newer
// days come back empty and are reported as "second-source-no-data".
// ═══════════════════════════════════════════════════════════
import { parseIsoDay } from "./compare";

export const CEDA_SOURCE = "CEDA Ashoka (AGMARKNET mirror)";
export const CEDA_BASE = "https://agmarknet.ceda.ashoka.edu.in";

export interface CedaPlace {
  id: number;
  name: string;
}

export interface CedaDayPrice {
  day: Date;
  min: number;
  max: number;
  modal: number;
}

const list = (json: unknown): Array<Record<string, unknown>> => {
  const d = (json as { data?: unknown } | null)?.data;
  return Array.isArray(d) ? (d.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>) : [];
};

export function parseCedaStates(json: unknown): CedaPlace[] {
  return list(json)
    .map((r) => ({ id: Number(r.census_state_id), name: String(r.census_state_name ?? "") }))
    .filter((p) => Number.isInteger(p.id) && p.name);
}

export function parseCedaDistricts(json: unknown): CedaPlace[] {
  return list(json)
    .map((r) => ({ id: Number(r.census_district_id), name: String(r.census_district_name ?? "") }))
    .filter((p) => Number.isInteger(p.id) && p.name);
}

export function parseCedaCommodities(json: unknown): CedaPlace[] {
  return list(json)
    .map((r) => ({ id: Number(r.commodity_id), name: String(r.commodity_disp_name ?? "") }))
    .filter((p) => Number.isInteger(p.id) && p.name);
}

/** Daily rows only ("t" = YYYY-MM-DD), with positive prices and min ≤ max. */
export function parseCedaPrices(json: unknown): CedaDayPrice[] {
  return list(json)
    .map((r) => ({
      day: parseIsoDay(typeof r.t === "string" ? r.t : null),
      min: Number(r.p_min),
      max: Number(r.p_max),
      modal: Number(r.p_modal),
    }))
    .filter((p): p is CedaDayPrice => p.day !== null && p.min > 0 && p.max >= p.min && p.modal > 0);
}

/** "NCT of Delhi" / "Delhi", "Tamil Nadu" … → comparable form. */
export function placeKey(name: string): string {
  return name.toLowerCase().replace(/^nct of\s+/, "").replace(/[^a-z]/g, "");
}

/** The CEDA place whose name equals any of our names (state or district aliases). */
export function matchPlace(places: readonly CedaPlace[], names: readonly string[]): CedaPlace | null {
  const wanted = new Set(names.map(placeKey).filter(Boolean));
  return places.find((p) => wanted.has(placeKey(p.name))) ?? null;
}

/** "Paddy(Dhan)(Common)" → ["paddy", "dhan", "common"]. */
function commodityTokens(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z]+/g, " ").split(" ").filter(Boolean);
}

/**
 * The CEDA commodity for an AGMARKNET commodity name: the same words
 * (order and brackets ignored), else the only one whose words include all
 * of ours ("Paddy(Common)" → "Paddy(Dhan)(Common)"). Null when unsure.
 */
export function matchCommodity(commodities: readonly CedaPlace[], ours: string): CedaPlace | null {
  const t = commodityTokens(ours);
  if (t.length === 0) return null;
  const key = [...t].sort().join(" ");
  const exact = commodities.find((c) => [...commodityTokens(c.name)].sort().join(" ") === key);
  if (exact) return exact;
  const supersets = commodities.filter((c) => {
    const ct = new Set(commodityTokens(c.name));
    return t.every((w) => ct.has(w));
  });
  return supersets.length === 1 ? supersets[0] : null;
}
