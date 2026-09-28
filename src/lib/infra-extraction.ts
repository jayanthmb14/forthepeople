/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// What an infrastructure extraction may contain — PURE (no DB), unit-tested
// in tests/infra-extraction.test.ts. src/lib/infra-sync.ts calls the model
// and writes; this file shapes what it writes.
//
//   sanitizeInfra()       model JSON → a typed extraction (wrong types
//                         dropped, progress clamped to 0–100, budget only
//                         as a number of rupees), or null without a name
//   applyScopeOverride()  the name / agency decides DISTRICT / STATE /
//                         NATIONAL when the model got it wrong
//
// Both run on the first extraction AND again after the verifier's
// corrections are merged in (Sept 2026 review: the corrections were raw
// model JSON that skipped every check and could undo the scope override).
// ═══════════════════════════════════════════════════════════
import {
  detectDistrictFromName,
  detectDistrictFromAgency,
  allDistrictsMentionedInName,
} from "./constants/infra-locations";

// ── Types ──────────────────────────────────────────────────

export type InfraCategory =
  | "ROAD" | "METRO" | "RAIL" | "BRIDGE" | "FLYOVER" | "WATER" | "SEWAGE"
  | "HOUSING" | "PORT" | "AIRPORT" | "POWER" | "TELECOM" | "HOSPITAL"
  | "SCHOOL" | "OTHER";

export type InfraStatus =
  | "PROPOSED" | "APPROVED" | "TENDER_ISSUED" | "UNDER_CONSTRUCTION"
  | "ON_TRACK" | "DELAYED" | "STALLED" | "CANCELLED" | "COMPLETED";

export type InfraUpdateType =
  | "ANNOUNCEMENT" | "APPROVAL" | "TENDER" | "CONSTRUCTION_START"
  | "BUDGET_INCREASE" | "BUDGET_DECREASE" | "DELAY" | "STALL"
  | "PROGRESS_UPDATE" | "CONTROVERSY" | "COMPLETION" | "CANCELLATION"
  | "PHASE_COMPLETE" | "INAUGURATION" | "REVIEW" | "SEED";

export type InfraScope = "DISTRICT" | "STATE" | "NATIONAL";

export interface KeyPerson {
  name: string;
  role: string | null;
  party: string | null;
  context: string | null;
}

export interface InfraExtraction {
  projectName: string;
  shortName: string;
  description: string | null;
  category: InfraCategory;
  updateType: InfraUpdateType;
  announcedBy: string | null;
  announcedByRole: string | null;
  party: string | null;
  keyPeople: KeyPerson[];
  executingAgency: string | null;
  budget: number | null; // rupees
  progressPct: number | null;
  status: InfraStatus;
  startDate: string | null;
  expectedEndDate: string | null;
  cancellationReason: string | null;
  scope: InfraScope;
  districtNames: string[];
  summary: string;
  confidence: number;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * The model's answer (or the answer with the verifier's corrections merged
 * in) as a typed extraction, or null when it names no project. Values of
 * the wrong type are dropped, never coerced: a budget given as text
 * ("₹120 crore") is not a number of rupees, so it is null.
 */
export function sanitizeInfra(raw: Record<string, unknown>, fallbackSummary: string): InfraExtraction | null {
  const projectName = str(raw.projectName);
  if (!projectName || projectName.length < 3) return null;
  const description = str(raw.description);
  const progress = num(raw.progressPct);
  const confidence = num(raw.confidence);
  return {
    projectName,
    shortName: str(raw.shortName) ?? projectName,
    description: description && description.length > 10 ? description.slice(0, 400) : null,
    category: (str(raw.category) as InfraCategory | null) ?? "OTHER",
    updateType: (str(raw.updateType) as InfraUpdateType | null) ?? "ANNOUNCEMENT",
    announcedBy: str(raw.announcedBy),
    announcedByRole: str(raw.announcedByRole),
    party: str(raw.party),
    keyPeople: Array.isArray(raw.keyPeople)
      ? raw.keyPeople
          .filter((p): p is KeyPerson => !!p && typeof p === "object" && typeof (p as KeyPerson).name === "string")
          .slice(0, 10)
      : [],
    executingAgency: str(raw.executingAgency),
    budget: num(raw.budget),
    progressPct: progress === null ? null : Math.min(100, Math.max(0, progress)),
    status: (str(raw.status) as InfraStatus | null) ?? "PROPOSED",
    startDate: str(raw.startDate),
    expectedEndDate: str(raw.expectedEndDate),
    cancellationReason: str(raw.cancellationReason),
    scope: (str(raw.scope) as InfraScope | null) ?? "DISTRICT",
    districtNames: Array.isArray(raw.districtNames) ? raw.districtNames.filter((s): s is string => typeof s === "string") : [],
    summary: str(raw.summary) ?? fallbackSummary,
    confidence: confidence === null ? 0.5 : Math.min(1, Math.max(0, confidence)),
  };
}

// ── Rule-based scope override ──────────────────────────────
// AI sometimes returns scope=STATE for a clearly city-level project
// (e.g. "Bengaluru Metro"), which then fans out to every Karnataka
// district. These rules force the correct scope from the project name
// before the sync engine ever sees it.
const NAMED_CITY_RX = /\b(bengaluru|bangalore|namma|mumbai|hyderabad|chennai|delhi|kolkata|lucknow|mysuru|mysore|mandya|pune|ahmedabad|surat|jaipur|nagpur|kanpur|thiruvananthapuram|kochi|bhubaneswar|patna|guwahati|chandigarh|coimbatore|indore|bhopal|vadodara|nashik|nagaland|gurgaon|gurugram|noida|ghaziabad)\b/i;
const CITY_PROJECT_MARKER_RX = /\b(metro|airport|flyover|depot|station|municipal|bmc|ndmc|mcd|smart\s*city|outer\s*ring\s*road|peripheral\s*ring\s*road|inner\s*ring\s*road|orbital|sub-?urban\s*rail)\b/i;
const STATE_HIGHWAY_RX = /\b(state\s*highway|sh-\d+|state\s*high\s*way)\b/i;
const NATIONAL_RX = /\b(national\s*highway|nh-?\d+|bharatmala|sagarmala|pmgsy|bullet\s*train|vande\s*bharat|namo\s*bharat|rrts|udan)\b/i;

export function applyScopeOverride(extraction: InfraExtraction): InfraExtraction {
  const name = extraction.projectName;

  // Pass 1 — AREA mapping (from shared infra-locations constants).
  // If the name references a single neighborhood/area that uniquely maps to
  // one district, force scope=DISTRICT + districtNames=[that district] so the
  // sync fan-out stays narrow.
  const mentioned = allDistrictsMentionedInName(name);
  if (mentioned.length === 1) {
    const target = mentioned[0];
    if (extraction.scope !== "DISTRICT" || !extraction.districtNames.includes(target)) {
      console.log(`[infra-sync] scope override: "${name.slice(0, 60)}" → DISTRICT (area maps to ${target})`);
      return { ...extraction, scope: "DISTRICT", districtNames: [target] };
    }
    return extraction;
  }
  // Area detected but maps to null (e.g. "Nagpur Metro Phase II") →
  // returning "NATIONAL" lets the caller decide to drop it via verification
  // gates; we also flag district=null so sync finds no target.
  const areaNullHit = detectDistrictFromName(name);
  if (areaNullHit === null) {
    console.log(`[infra-sync] scope override: "${name.slice(0, 60)}" references a city not served — marked NATIONAL w/ empty districtNames`);
    return { ...extraction, scope: "NATIONAL", districtNames: [] };
  }

  // Pass 2 — AGENCY mapping. BMRCL/CMRL/DMRC/… are city-locked, overriding
  // the scope even if the project name doesn't mention the city.
  if (extraction.executingAgency) {
    const agencyDistrict = detectDistrictFromAgency(extraction.executingAgency);
    if (agencyDistrict) {
      console.log(`[infra-sync] scope override: agency "${extraction.executingAgency}" → DISTRICT ${agencyDistrict}`);
      return { ...extraction, scope: "DISTRICT", districtNames: [agencyDistrict] };
    }
  }

  // Pass 3 — the original regex rules (two cities → STATE, NH-/Vande Bharat → NATIONAL)
  const namesTwo = (() => {
    let count = 0;
    const rx = new RegExp(NAMED_CITY_RX.source, "gi");
    while (rx.exec(name) && count < 3) count++;
    return count >= 2;
  })();

  let next: InfraScope | null = null;
  if (NATIONAL_RX.test(name)) next = "NATIONAL";
  else if (namesTwo) next = "STATE";
  else if (STATE_HIGHWAY_RX.test(name)) next = "STATE";
  else if (NAMED_CITY_RX.test(name) && CITY_PROJECT_MARKER_RX.test(name)) next = "DISTRICT";

  if (next && next !== extraction.scope) {
    console.log(`[infra-sync] scope override: AI said ${extraction.scope} but "${name.slice(0, 60)}" forced to ${next}`);
    return { ...extraction, scope: next };
  }
  return extraction;
}
