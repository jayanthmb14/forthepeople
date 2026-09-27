/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Courts — where each live district's figures come from (pure, no I/O)
//
// Source: the National Judicial Data Grid (NJDG), run by the eCourts
// project (NIC + the Supreme Court's e-Committee).
//   District & taluka courts  https://njdg.ecourts.gov.in/njdg_v3/
//   High Courts               https://njdg.ecourts.gov.in/hcnjdg_v2/
//
// What is machine-readable today (probed 27 Sep 2026, no captcha, no
// login, robots.txt absent):
//   • GET  ?p=home/index&state_code=S~N&dist_code=D   the district page,
//     server-rendered: pending civil/criminal, age of pending cases (civil
//     and criminal, 5 bands), cases instituted and disposed "in last month".
//   • POST ?p=home/newPendDashboard (active_tab=pending)   JSON: cases
//     instituted and disposed per calendar year since 2018, pending by age
//     (7 bands).
//   • POST ?p=home/newPendDashboard (active_tab=disposed, disp_year=Y)
//     JSON: every case disposed in year Y, by how long it took.
//   • GET  hcnjdg_v2/?p=home/index&state_code=S~N    the High Court page:
//     pending, age bands, instituted/disposed in the current year and last
//     month, for the whole High Court (all benches).
//   Case-level search (case status, cause lists, orders) IS behind a
//   captcha. We never touch it: every figure here is an aggregate that
//   NJDG shows on its public dashboards without one.
//
// NJDG sometimes splits one of our districts into several "districts" of
// its own (Mumbai has a City Civil Court, the CMM courts, a Small Causes
// Court and a Motor Accident Claims Tribunal). Each is a UNIT below; the
// district page adds them up and shows each one on its own card.
//
// Left out on purpose:
//   • "Mumbai (Suburban)" (27~1 / 22): NJDG shows 0 cases for it (empty).
//   • "Maharashtra Family Courts" (27~1 / 42) and the state tribunals
//     (40, 41, 43): they are state-wide, not Mumbai's.
//   • "Hyderabad MSJ" (36~29 / 11) and "Hyderabad CSCC" (36~29 / 36):
//     empty on NJDG; Hyderabad's cases are all under "Hyderabad CCC".
//   • "Hyderabad CBI" (36~29 / 79): the CBI courts sit in Hyderabad but
//     try cases from the whole state; shown nowhere rather than mixed in.
//   • Bengaluru Rural (29~3 / 21) is a separate district.
// ═══════════════════════════════════════════════════════════

export const NJDG_DISTRICT_BASE = "https://njdg.ecourts.gov.in/njdg_v3/";
export const NJDG_HIGH_COURT_BASE = "https://njdg.ecourts.gov.in/hcnjdg_v2/";

/** One NJDG "district" that belongs to one of our districts. */
export interface NjdgUnit {
  /** NJDG state code as its select box sends it, e.g. "29~3". */
  stateCode: string;
  /** NJDG district code inside that state. */
  distCode: number;
  /** The name NJDG shows (kept in English; it is a proper noun). */
  name: string;
}

export interface NjdgHighCourt {
  stateCode: string;
  name: string;
}

/** Our district slug → the NJDG units that together make its courts. */
export const NJDG_DISTRICT_UNITS: Readonly<Record<string, readonly NjdgUnit[]>> = {
  "bengaluru-urban": [{ stateCode: "29~3", distCode: 20, name: "Bengaluru" }],
  mandya: [{ stateCode: "29~3", distCode: 22, name: "Mandya" }],
  mysuru: [{ stateCode: "29~3", distCode: 26, name: "Mysuru" }],
  "new-delhi": [{ stateCode: "7~26", distCode: 7, name: "New Delhi" }],
  mumbai: [
    { stateCode: "27~1", distCode: 37, name: "Mumbai City Civil Court" },
    { stateCode: "27~1", distCode: 23, name: "Mumbai CMM Courts" },
    { stateCode: "27~1", distCode: 38, name: "Mumbai Small Causes Court" },
    { stateCode: "27~1", distCode: 39, name: "Mumbai Motor Accident Claims Tribunal" },
  ],
  pune: [{ stateCode: "27~1", distCode: 25, name: "Pune" }],
  chennai: [{ stateCode: "33~10", distCode: 13, name: "Chennai" }],
  // NJDG files all of Hyderabad's district courts, civil and criminal,
  // under "Hyderabad CCC"; its "Hyderabad MSJ" and "Hyderabad CSCC"
  // units showed 0 cases on 27 Sep 2026.
  hyderabad: [{ stateCode: "36~29", distCode: 2, name: "Hyderabad CCC" }],
  lucknow: [{ stateCode: "9~13", distCode: 24, name: "Lucknow" }],
  kolkata: [{ stateCode: "19~16", distCode: 3, name: "Calcutta" }],
};

/** Our state slug → its High Court on HC-NJDG (the whole court, all benches). */
export const NJDG_HIGH_COURTS: Readonly<Record<string, NjdgHighCourt>> = {
  karnataka: { stateCode: "29~3", name: "High Court of Karnataka" },
  delhi: { stateCode: "7~26", name: "High Court of Delhi" },
  maharashtra: { stateCode: "27~1", name: "Bombay High Court" },
  "tamil-nadu": { stateCode: "33~10", name: "Madras High Court" },
  telangana: { stateCode: "36~29", name: "High Court for the State of Telangana" },
  "uttar-pradesh": { stateCode: "9~13", name: "Allahabad High Court" },
  "west-bengal": { stateCode: "19~16", name: "Calcutta High Court" },
};

export function njdgUnitsFor(districtSlug: string): readonly NjdgUnit[] {
  return NJDG_DISTRICT_UNITS[districtSlug] ?? [];
}

export function highCourtFor(stateSlug: string): NjdgHighCourt | null {
  return NJDG_HIGH_COURTS[stateSlug] ?? null;
}

/** True when we know where this district's court figures live on NJDG. */
export function hasNjdgSource(districtSlug: string): boolean {
  return njdgUnitsFor(districtSlug).length > 0;
}

/** The NJDG district page a citizen can open to check a unit's figures. */
export function njdgUnitUrl(u: Pick<NjdgUnit, "stateCode" | "distCode">): string {
  return `${NJDG_DISTRICT_BASE}?p=home/index&state_code=${u.stateCode}&dist_code=${u.distCode}&app_token=`;
}

/** The HC-NJDG page for one High Court. */
export function njdgHighCourtUrl(hc: Pick<NjdgHighCourt, "stateCode">): string {
  return `${NJDG_HIGH_COURT_BASE}?p=home/index&state_code=${hc.stateCode}&app_token=`;
}
