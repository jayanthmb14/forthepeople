/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Sidebar — the desktop left rail on district pages (CONCEPT-v3 §6)
// ═══════════════════════════════════════════════════════════════════════
//
//  • Shown from 1024 px (Tailwind `lg:`). Below that, district pages use
//    the 44 px module bar + "All modules" drawer (MobileDistrictChrome), so
//    a tablet gets its full width for content (docs/LAYOUT.md).
//  • 240 px wide, sticky under the 56 px header. Collapses to 56 px icons
//    with native title tooltips.
//  • Nine groups from the registry (docs/MODULE-MAP.md), each headed by its
//    translated name only (v5: text headings, no emoji).
//  • Items are at least 36 px tall (long names wrap, never cut off) with
//    the module emoji in a hue-tinted chip — the ONE icon per module.
//    Active = the module's hue tint.
//  • v5 freshness, from useFreshness (one request per district, cached
//    five minutes): nothing when the data is current; a small amber dot
//    when the module's main dataset is late; the name muted with "Coming
//    soon" when nothing is collected for this district yet.
//  • v5: no utility links here (compare, support, vote, "spot something
//    wrong") — they live in the header, the footer and the floating
//    "Report a problem" button on every page.
//  • Every colour is a `var(--ftp-…)` token. No hex in this file.
//
"use client";

import { useTranslations } from "next-intl";
import { useModuleText } from "@/i18n/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { hueClass } from "@/lib/design/hues";
import { SIDEBAR_MODULES, getGroupedModules, getOrderedSlugs } from "@/lib/constants/sidebar-modules";
import { useModuleGroupName } from "./useModuleGroups";
import { useFreshness } from "@/hooks/useFreshness";

interface SidebarProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Groups + flat order come from the registry (sidebar-modules.ts) — no
// hardcoded slug lists live in this file.
const SIDEBAR_GROUPS = getGroupedModules().map((g) => ({
  key: g.key,
  slugs: g.modules.map((m) => m.slug),
}));

const ALL_SLUGS = getOrderedSlugs();
const MODULE_MAP = Object.fromEntries(SIDEBAR_MODULES.map((m) => [m.slug, m]));

const COLLAPSED_KEY = "ftp.railCollapsed";
const ITEM_HEIGHT = 36;
const ICON_SIZE = 16;

// ── Collapsed flag, remembered per browser ─────────────────────────────
// Exposed through useSyncExternalStore so the server render (expanded)
// never mismatches on hydration and no setState runs inside an effect.
const collapsedListeners = new Set<() => void>();
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
  } catch {
    /* storage unavailable — the rail simply stays as rendered */
  }
  collapsedListeners.forEach((l) => l());
}
function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    collapsedListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Shared style for every rail row (module links and the utility links). */
function rowStyle(collapsed: boolean, active: boolean, color?: string): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: 10,
    // Collapsed: a fixed 36 px icon row. Expanded: at least 36 px, and a
    // long name ("Ask the government (RTI)", or longer in Kannada) wraps
    // onto a second line instead of being cut off (docs/I18N.md §4).
    height: collapsed ? ITEM_HEIGHT : undefined,
    minHeight: ITEM_HEIGHT,
    margin: "0 8px",
    padding: collapsed ? 0 : "6px 10px",
    borderRadius: "var(--ftp-radius-tile)",
    textDecoration: "none",
    background: active ? "var(--ftp-brand-tint)" : "transparent",
    color: active ? "var(--ftp-brand)" : (color ?? "var(--ftp-text-2)"),
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 13,
    lineHeight: "18px",
    fontWeight: active ? 500 : 400,
    whiteSpace: collapsed ? "nowrap" : "normal",
    overflow: "hidden",
  };
}

export default function Sidebar({ locale, stateSlug, districtSlug }: SidebarProps) {
  const ts = useTranslations("sidebar");
  const tsh = useTranslations("page_shell");
  const mt = useModuleText();
  const groupName = useModuleGroupName();
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const freshness = useFreshness(stateSlug, districtSlug);

  function toggleCollapsed() {
    writeCollapsed(!collapsed);
  }

  const baseUrl = `/${locale}/${stateSlug}/${districtSlug}`;
  const pathParts = pathname.split("/").filter(Boolean);
  const activeSlug = pathParts[3] ?? "overview";

  function renderModule(slug: string) {
    const mod = MODULE_MAP[slug];
    if (!mod) return null;
    const isActive = activeSlug === slug;
    const href = slug === "overview" ? baseUrl : `${baseUrl}/${slug}`;
    const main = freshness.primary(slug);
    const soon = main?.status === "not_collected";
    const late = main?.status === "late";
    const name = mt.label(slug);

    return (
      <Link
        key={slug}
        href={href}
        title={collapsed ? (soon ? tsh("nav.comingSoonAria", { name }) : name) : undefined}
        aria-label={collapsed || soon ? (soon ? tsh("nav.comingSoonAria", { name }) : name) : undefined}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : "false"}
        data-soon={soon ? "true" : undefined}
        className="ftp-rail-item"
        style={rowStyle(collapsed, isActive, soon ? "var(--ftp-text-2)" : undefined)}
      >
        {/* The module's emoji in a small chip tinted with its own hue —
            its one identity icon (greyed when coming soon). */}
        <span
          aria-hidden
          className={`ftp-emoji ${hueClass(slug)}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            background: soon ? "var(--ftp-surface-2)" : "var(--hue-tint)",
            filter: soon ? "grayscale(1)" : undefined,
            opacity: soon ? 0.6 : undefined,
          }}
        >
          {mod.emoji}
        </span>
        {!collapsed && (
          <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <span>{name}</span>
            {soon && <span style={{ fontSize: 11, lineHeight: "14px", color: "var(--ftp-text-2)" }}>{tsh("nav.comingSoon")}</span>}
          </span>
        )}
        {late && (
          <>
            <span
              aria-hidden
              title={tsh("nav.late")}
              style={{
                position: collapsed ? "absolute" : "static",
                top: collapsed ? 8 : undefined,
                right: collapsed ? 10 : undefined,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ftp-warn)",
                flexShrink: 0,
              }}
            />
            <span className="sr-only">{tsh("nav.late")}</span>
          </>
        )}
      </Link>
    );
  }

  return (
    <aside
      aria-label={ts("navigation")}
      style={{
        width: collapsed ? "var(--ftp-rail-collapsed)" : "var(--ftp-rail-width)",
        minWidth: collapsed ? "var(--ftp-rail-collapsed)" : "var(--ftp-rail-width)",
        // Sticky under the site header + the 48 px district bar (v5).
        height: "calc(100vh - var(--ftp-shell-top, 104px))",
        position: "sticky",
        top: "var(--ftp-shell-top, 104px)",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--ftp-surface)",
        borderRight: "1px solid var(--ftp-border)",
        flexShrink: 0,
        scrollbarWidth: "thin",
        scrollbarColor: "var(--ftp-border) transparent",
      }}
      className="hidden lg:block"
      data-tour="district-topics"
    >
      {/* Collapse / expand toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          height: 44,
          padding: "0 8px",
          borderBottom: "1px solid var(--ftp-border)",
        }}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? ts("expand") : ts("collapse")}
          aria-label={collapsed ? ts("expand") : ts("collapse")}
          aria-expanded={!collapsed}
          className="ftp-btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            border: "1px solid var(--ftp-border)",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-surface)",
            color: "var(--ftp-text-2)",
            cursor: "pointer",
          }}
        >
          {collapsed ? <PanelLeftOpen size={ICON_SIZE} aria-hidden /> : <PanelLeftClose size={ICON_SIZE} aria-hidden />}
        </button>
      </div>

      <nav aria-label={ts("modules")} style={{ paddingBottom: 12 }}>
        {collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 8 }}>{ALL_SLUGS.map(renderModule)}</div>
        ) : (
          SIDEBAR_GROUPS.map((group) => (
            <div key={group.key} role="group" aria-labelledby={`ftp-rail-group-${group.key}`}>
              <div
                id={`ftp-rail-group-${group.key}`}
                className="ftp-label"
                style={{ padding: "14px 18px 4px" }}
              >
                {groupName(group.key)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{group.slugs.map(renderModule)}</div>
            </div>
          ))
        )}

      </nav>
    </aside>
  );
}
