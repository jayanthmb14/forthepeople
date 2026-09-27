/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Viewport hook for components that need to swap behaviour (not just CSS)
 * between the touch shell and the desktop shell — e.g. DistrictBreadcrumb
 * opens its menus as bottom sheets on phones and tablets, floating menus
 * on laptops and PCs.
 *
 * Breakpoints (docs/LAYOUT.md):
 *   phone   < 640
 *   tablet  640–1023   top bar + drawer, bottom sheets (no sidebar)
 *   laptop  1024–1439  sidebar, floating menus, side panels
 *   PC      ≥ 1440
 *
 * The default breakpoint is SHELL_BREAKPOINT (1024): "mobile" means "no
 * sidebar", matching Tailwind's `lg:` used by Sidebar and
 * MobileDistrictChrome. Pass PHONE_BREAKPOINT (640) for phone-only logic.
 *
 * Returns false on the server (so SSR matches the initial desktop render),
 * then updates on the client after the first matchMedia tick.
 */

"use client";

import { useEffect, useState } from "react";

/** Below this width there is no sidebar: top bar + drawer + bottom sheets. */
export const SHELL_BREAKPOINT = 1024;
/** Below this width is a phone. */
export const PHONE_BREAKPOINT = 640;

export function useIsMobile(breakpoint: number = SHELL_BREAKPOINT): boolean {
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
