/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Mobile drawer host for district pages. Owns the open/close state for
 * MobileDistrictDrawer and listens for a window-level event so HeaderBar's
 * mobile hamburger panel can open the drawer without prop-drilling across
 * the layout tree.
 *
 * On mobile (≤767px) the desktop HeaderBar still renders; its hamburger
 * panel includes a "📋 All modules" item that dispatches
 * `ftp:open-modules-drawer`. This component listens and opens the drawer.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MobileDistrictDrawer } from "./MobileDistrictDrawer";

export const OPEN_MODULES_EVENT = "ftp:open-modules-drawer";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  districtName: string;
}

export function MobileDistrictChrome({
  locale,
  stateSlug,
  districtSlug,
  districtName,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  const activeSlug = parts[3] ?? "overview";

  useEffect(() => {
    function onOpen() {
      setDrawerOpen(true);
    }
    window.addEventListener(OPEN_MODULES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MODULES_EVENT, onOpen);
  }, []);

  return (
    <MobileDistrictDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      locale={locale}
      stateSlug={stateSlug}
      districtSlug={districtSlug}
      districtName={districtName}
      activeSlug={activeSlug}
    />
  );
}
