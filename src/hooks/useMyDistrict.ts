/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  useMyDistrict — read/write the visitor's remembered district
// ═══════════════════════════════════════════════════════════════════════
//
//  The header uses this to render a "My district: Mandya" pill with an ×
//  to forget. The "Your district" strip uses it to save what it found.
//
//    const { district, remember, setRemember, save, forget, href } = useMyDistrict();
//    if (district) <Pill>My district: {district.name}</Pill>
//
"use client";

import { useSyncExternalStore } from "react";
import {
  forgetMyDistrict,
  getMyDistrictServerSnapshot,
  getMyDistrictSnapshot,
  myDistrictHref,
  setMyDistrict,
  setRememberMyDistrict,
  subscribeMyDistrict,
} from "@/lib/geo/my-district";
import type { MyDistrict } from "@/lib/geo/my-district";

export type { MyDistrict } from "@/lib/geo/my-district";

export interface UseMyDistrict {
  /** The remembered district, or null. */
  district: MyDistrict | null;
  /** Whether it is persisted in localStorage (the switch state). */
  remember: boolean;
  setRemember: (on: boolean) => void;
  /** Save a newly located district (persisted only when remember is on). */
  save: (district: MyDistrict, remember?: boolean) => void;
  /** Clear the district and the stored value. */
  forget: () => void;
  /** Link to the district page (live) or its vote page (coming soon). */
  href: (locale: string) => string | null;
}

export function useMyDistrict(): UseMyDistrict {
  const snap = useSyncExternalStore(subscribeMyDistrict, getMyDistrictSnapshot, getMyDistrictServerSnapshot);
  return {
    district: snap.district,
    remember: snap.remember,
    setRemember: setRememberMyDistrict,
    save: (district, remember = snap.remember) => setMyDistrict(district, remember),
    forget: forgetMyDistrict,
    href: (locale) => (snap.district ? myDistrictHref(locale, snap.district) : null),
  };
}
