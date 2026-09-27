/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * MobileDistrictChrome — phone-only module bar for district pages
 * (Design v3, CONCEPT-v3 §6).
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ [icon] Crop Prices              All modules ▾ │   44 px, under the header
 *   └──────────────────────────────────────────────┘
 *
 * Tapping "All modules" opens MobileDistrictDrawer (a bottom sheet with
 * the 5 module groups). It also still listens for the window event
 * `ftp:open-modules-drawer`, which HeaderBar's mobile menu dispatches,
 * so that entry point keeps working.
 *
 * Hidden at ≥ 768 px (Tailwind `md:hidden`) — desktop has the left rail.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
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
  // /<locale>/<state>/<district>/<module or taluk>
  const segment = parts[3];
  const currentModule = SIDEBAR_MODULES.find((m) => m.slug === (segment ?? "overview"));
  const activeSlug = currentModule?.slug ?? (segment ? undefined : "overview");
  const CurrentIcon = currentModule?.icon ?? LayoutDashboard;
  // A taluk page (segment is not a module) shows the district name instead.
  const currentLabel = currentModule?.label ?? districtName;

  useEffect(() => {
    function onOpen() {
      setDrawerOpen(true);
    }
    window.addEventListener(OPEN_MODULES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MODULES_EVENT, onOpen);
  }, []);

  return (
    <>
      <nav
        aria-label="Current module"
        className="md:hidden"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          height: 44,
          padding: "0 8px 0 16px",
          background: "var(--ftp-surface)",
          borderBottom: "1px solid var(--ftp-border)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {currentModule?.emoji ? (
            <span
              aria-hidden
              className={`ftp-emoji ${hueClass(currentModule.slug)}`}
              style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: "var(--hue-tint)" }}
            >
              {currentModule.emoji}
            </span>
          ) : (
            <CurrentIcon size={16} aria-hidden style={{ color: "var(--ftp-brand)", flexShrink: 0 }} />
          )}
          <span
            className="ftp-title"
            style={{ fontSize: 13, lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {currentLabel}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            minHeight: 44,
            padding: "0 8px",
            border: "none",
            background: "transparent",
            color: "var(--ftp-brand)",
            fontFamily: "var(--ftp-font-sans)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          All modules
          <ChevronDown size={16} aria-hidden />
        </button>
      </nav>

      <MobileDistrictDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtName}
        activeSlug={activeSlug}
      />
    </>
  );
}
