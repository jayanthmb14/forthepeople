/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  my-district.ts — the visitor's remembered district (CONCEPT-v3 §5)
// ═══════════════════════════════════════════════════════════════════════
//
//  A tiny store with no React in it. The strip writes to it after a
//  successful locate; the header reads it to show the "My district" pill.
//
//  Persistence rule: the district is written to localStorage under
//  `ftp.myDistrict` ONLY while the "Remember my district" switch is on.
//  With the switch off it lives in memory for this page session only.
//  Nothing is ever sent to a server; only a slug and a name are stored —
//  never coordinates.
//

export const MY_DISTRICT_KEY = "ftp.myDistrict";

export interface MyDistrict {
  slug: string;
  stateSlug: string;
  name: string;
  stateName: string;
  /** True when the district is live on the site. */
  active: boolean;
  /** ISO time the visitor located themselves. */
  savedAt: string;
}

export interface MyDistrictSnapshot {
  district: MyDistrict | null;
  remember: boolean;
}

const SERVER_SNAPSHOT: MyDistrictSnapshot = { district: null, remember: false };

let snapshot: MyDistrictSnapshot = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readStored(): MyDistrict | null {
  try {
    const raw = window.localStorage.getItem(MY_DISTRICT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<MyDistrict>;
    if (typeof v.slug !== "string" || typeof v.stateSlug !== "string" || typeof v.name !== "string") return null;
    return {
      slug: v.slug,
      stateSlug: v.stateSlug,
      name: v.name,
      stateName: typeof v.stateName === "string" ? v.stateName : "",
      active: v.active === true,
      savedAt: typeof v.savedAt === "string" ? v.savedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

function writeStored(d: MyDistrict | null) {
  try {
    if (d) window.localStorage.setItem(MY_DISTRICT_KEY, JSON.stringify(d));
    else window.localStorage.removeItem(MY_DISTRICT_KEY);
  } catch {
    /* storage unavailable (private mode, blocked) — memory only */
  }
}

/** Current value. Reads localStorage once on the first client call. */
export function getMyDistrictSnapshot(): MyDistrictSnapshot {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    const stored = readStored();
    if (stored) snapshot = { district: stored, remember: true };
  }
  return snapshot;
}

/** Value used during server rendering and hydration: nothing remembered. */
export function getMyDistrictServerSnapshot(): MyDistrictSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribeMyDistrict(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", listener);
  };
}

/** Save the located district. Persists only when `remember` is true. */
export function setMyDistrict(district: MyDistrict, remember: boolean): void {
  snapshot = { district, remember };
  writeStored(remember ? district : null);
  emit();
}

/** Flip the "Remember my district" switch. Persists or clears accordingly. */
export function setRememberMyDistrict(remember: boolean): void {
  snapshot = { district: snapshot.district, remember };
  writeStored(remember ? snapshot.district : null);
  emit();
}

/** Forget everything (the × on the header pill). */
export function forgetMyDistrict(): void {
  snapshot = { district: null, remember: false };
  writeStored(null);
  emit();
}

/** Where the district's page (live) or vote page (coming) lives. */
export function myDistrictHref(locale: string, d: MyDistrict): string {
  return d.active ? `/${locale}/${d.stateSlug}/${d.slug}` : `/${locale}/vote-district?d=${d.slug}`;
}
