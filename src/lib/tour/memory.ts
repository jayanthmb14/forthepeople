/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  First-visit tour — what the browser remembers, and when to offer
// ═══════════════════════════════════════════════════════════════════════
//
//  WHY NOT COOKIES: a cookie is sent to the server with every request. The
//  tour's choice only matters in this browser, so it lives in localStorage
//  and is never sent anywhere. Nothing identifies the visitor, nothing
//  leaves the device, so no consent banner is needed.
//
//  localStorage["ftp.tour.v1"] = JSON
//    {
//      home?:     "done" | "skipped" | "offered-dismissed",
//      district?: "done" | "skipped" | "offered-dismissed",
//      at: "2026-09-28T10:15:00.000Z"      // when it was last written
//    }
//
//    done               finished every step ("Done — start exploring")
//    skipped            "Skip tour", ✕ or Esc during the tour
//    offered-dismissed  the "New here?" card was shown and not taken
//                       ("No thanks", ✕, or the visitor went elsewhere).
//                       It is written the moment the card appears, so
//                       closing the tab can never bring it back.
//
//  Any value means: never AUTO-offer that tour again in this browser. The
//  "Take the tour" link (footer, phone menu) still starts it on demand.
//
//  The ".v1" suffix: a future redesign can bump it to ".v2" to offer the
//  new tour once to everyone, old answers ignored.
//
//  If storage is blocked (private mode in some browsers, strict settings),
//  the tour is NEVER auto-offered — better no guide than a guide on every
//  page. See shouldAutoOffer.
//
//  Per browser session (sessionStorage, cleared when the tab closes):
//    "ftp.tour.firstSession" = "1"  a tour offer was shown in this session
//                                   (also read by other cards: see
//                                   coordination.ts)
//    "ftp.tour.accepted"     = "1"  the visitor pressed "Show me" in this
//                                   session
//  At most one offer card per session, unless the visitor accepted one:
//  someone who took the home tour may well want the district one next;
//  someone who said "No thanks" is not asked again until a later visit.
//
//  Pure except the three small read/write helpers at the bottom, which
//  take the Storage object as an argument (so tests pass a fake one).

export type TourKind = "home" | "district";
export type TourOutcome = "done" | "skipped" | "offered-dismissed";

export interface TourMemory {
  home?: TourOutcome;
  district?: TourOutcome;
  at?: string;
}

export const TOUR_STORAGE_KEY = "ftp.tour.v1";
export const TOUR_FIRST_SESSION_KEY = "ftp.tour.firstSession";
export const TOUR_ACCEPTED_KEY = "ftp.tour.accepted";

const OUTCOMES: readonly TourOutcome[] = ["done", "skipped", "offered-dismissed"];
const KINDS: readonly TourKind[] = ["home", "district"];

function isOutcome(v: unknown): v is TourOutcome {
  return typeof v === "string" && (OUTCOMES as readonly string[]).includes(v);
}

/** Read the stored JSON defensively: anything odd becomes "nothing stored". */
export function parseTourMemory(raw: string | null | undefined): TourMemory {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const obj = data as Record<string, unknown>;
  const out: TourMemory = {};
  for (const k of KINDS) if (isOutcome(obj[k])) out[k] = obj[k] as TourOutcome;
  if (typeof obj.at === "string") out.at = obj.at;
  return out;
}

/** The memory after one tour's outcome, stamped with the time. */
export function withOutcome(memory: TourMemory, kind: TourKind, outcome: TourOutcome, now: Date): TourMemory {
  return { ...memory, [kind]: outcome, at: now.toISOString() };
}

export interface OfferInput {
  kind: TourKind;
  memory: TourMemory;
  /** False when localStorage could not be read or written. */
  storageOk: boolean;
  /** An offer card was already shown in this browser session. */
  offeredThisSession: boolean;
  /** The visitor pressed "Show me" in this browser session. */
  acceptedThisSession: boolean;
}

/** Should this page offer its tour by itself (the "New here?" card)? */
export function shouldAutoOffer({ kind, memory, storageOk, offeredThisSession, acceptedThisSession }: OfferInput): boolean {
  if (!storageOk) return false;
  if (memory[kind]) return false;
  if (offeredThisSession && !acceptedThisSession) return false;
  return true;
}

// ── Storage helpers (every access wrapped: storage can throw) ──

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Reads the memory; `ok` is false when storage is missing or throws. */
export function readTourMemory(storage: StorageLike | null | undefined): { ok: boolean; memory: TourMemory } {
  if (!storage) return { ok: false, memory: {} };
  try {
    // A write-and-remove probe: some browsers allow reads but throw on writes.
    const probe = `${TOUR_STORAGE_KEY}.probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return { ok: true, memory: parseTourMemory(storage.getItem(TOUR_STORAGE_KEY)) };
  } catch {
    return { ok: false, memory: {} };
  }
}

/** Records one outcome. Returns false when it could not be saved. */
export function saveTourOutcome(storage: StorageLike | null | undefined, kind: TourKind, outcome: TourOutcome, now = new Date()): boolean {
  if (!storage) return false;
  try {
    const current = parseTourMemory(storage.getItem(TOUR_STORAGE_KEY));
    storage.setItem(TOUR_STORAGE_KEY, JSON.stringify(withOutcome(current, kind, outcome, now)));
    return true;
  } catch {
    return false;
  }
}

/** "1" flags in sessionStorage; false when unset or unreadable. */
export function readSessionFlag(storage: StorageLike | null | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function setSessionFlag(storage: StorageLike | null | undefined, key: string): void {
  try {
    storage?.setItem(key, "1");
  } catch {
    /* storage blocked: nothing to remember */
  }
}
