/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session M1: viewport hook for components that need to swap behaviour
 * (not just CSS) at the mobile breakpoint — e.g. DistrictBreadcrumb opens
 * dropdowns as bottom sheets on mobile, floating menus on desktop.
 *
 * Returns false on the server (so SSR matches initial desktop render),
 * then updates on the client after the first matchMedia tick.
 */

"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}
