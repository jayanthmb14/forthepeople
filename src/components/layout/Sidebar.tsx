/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Sidebar — the desktop left rail on district pages (CONCEPT-v3 §6)
// ═══════════════════════════════════════════════════════════════════════
//
//  • 240 px wide, sticky under the 56 px header. Collapses to 56 px icons
//    with native title tooltips.
//  • Five groups (from sidebar-modules.ts) with 11 px uppercase labels.
//  • Items are 36 px tall with a 16 px Lucide icon. Active = brand-tint
//    background + brand text. No left border, no emoji, no shadows.
//  • A 6 px freshness dot on modules that have a live feed (weather,
//    crops, water, news), fed by useFreshness — one request per district,
//    cached for five minutes. Grey when unknown.
//  • Every colour is a `var(--ftp-…)` token. No hex in this file.
//
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import {
  GitCompareArrows,
  Heart,
  Lightbulb,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules, getOrderedSlugs } from "@/lib/constants/sidebar-modules";
import { useFreshness, MODULE_TO_FRESHNESS_KEY } from "@/hooks/useFreshness";
import type { FreshnessStatus } from "@/hooks/useFreshness";

interface SidebarProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Groups + flat order are derived from the priority field in
// sidebar-modules.ts — no hardcoded slug lists live in this file.
const SIDEBAR_GROUPS = getTieredModules().map((g) => ({
  label: g.label,
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

/** Dot colour for a freshness status. Unknown / no feed = grey. */
function dotColor(status: FreshnessStatus | null | undefined): string {
  switch (status) {
    case "green":
      return "var(--ftp-live)";
    case "amber":
      return "var(--ftp-warn)";
    case "red":
      return "var(--ftp-danger)";
    default:
      return "var(--ftp-border-strong)";
  }
}

/** Shared style for every rail row (module links and the utility links). */
function rowStyle(collapsed: boolean, active: boolean, color?: string): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: 10,
    height: ITEM_HEIGHT,
    margin: "0 8px",
    padding: collapsed ? 0 : "0 10px",
    borderRadius: "var(--ftp-radius-tile)",
    textDecoration: "none",
    background: active ? "var(--ftp-brand-tint)" : "transparent",
    color: active ? "var(--ftp-brand)" : (color ?? "var(--ftp-text-2)"),
    fontFamily: "var(--ftp-font-sans)",
    fontSize: 13,
    lineHeight: "20px",
    fontWeight: active ? 500 : 400,
    whiteSpace: "nowrap",
    overflow: "hidden",
  };
}

function UtilityLink({
  href,
  icon: Icon,
  label,
  collapsed,
  color,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  color?: string;
}) {
  return (
    <Link href={href} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className="ftp-rail-item" style={rowStyle(collapsed, false, color)}>
      <Icon size={ICON_SIZE} aria-hidden style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
    </Link>
  );
}

export default function Sidebar({ locale, stateSlug, districtSlug }: SidebarProps) {
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
    const Icon = mod.icon;
    const isActive = activeSlug === slug;
    const href = slug === "overview" ? baseUrl : `${baseUrl}/${slug}`;
    const hasFeed = slug in MODULE_TO_FRESHNESS_KEY;
    const fresh = hasFeed ? freshness.forModule(slug) : null;
    const dotTitle = hasFeed
      ? fresh?.age
        ? `Data ${fresh.age}`
        : freshness.loading
          ? "Checking data age"
          : "Data age unknown"
      : undefined;

    return (
      <Link
        key={slug}
        href={href}
        title={collapsed ? mod.label : undefined}
        aria-label={collapsed ? mod.label : undefined}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive ? "true" : "false"}
        className="ftp-rail-item"
        style={rowStyle(collapsed, isActive)}
      >
        <Icon size={ICON_SIZE} aria-hidden style={{ flexShrink: 0 }} />
        {!collapsed && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{mod.label}</span>}
        {hasFeed && (
          <span
            aria-hidden
            title={dotTitle}
            style={{
              position: collapsed ? "absolute" : "static",
              top: collapsed ? 8 : undefined,
              right: collapsed ? 10 : undefined,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dotColor(fresh?.status),
              flexShrink: 0,
            }}
          />
        )}
        {hasFeed && dotTitle && !collapsed && <span className="sr-only">{dotTitle}</span>}
      </Link>
    );
  }

  return (
    <aside
      aria-label="District navigation"
      style={{
        width: collapsed ? "var(--ftp-rail-collapsed)" : "var(--ftp-rail-width)",
        minWidth: collapsed ? "var(--ftp-rail-collapsed)" : "var(--ftp-rail-width)",
        height: "calc(100vh - 56px - 36px)",
        position: "sticky",
        top: 56,
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--ftp-surface)",
        borderRight: "1px solid var(--ftp-border)",
        flexShrink: 0,
        scrollbarWidth: "thin",
        scrollbarColor: "var(--ftp-border) transparent",
      }}
      className="hidden md:block"
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
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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

      <nav aria-label="District modules" style={{ paddingBottom: 12 }}>
        {collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 8 }}>{ALL_SLUGS.map(renderModule)}</div>
        ) : (
          SIDEBAR_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="ftp-label" style={{ padding: "14px 18px 4px" }}>
                {group.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{group.slugs.map(renderModule)}</div>
            </div>
          ))
        )}

        {/* Utility links */}
        <div style={{ height: 1, background: "var(--ftp-border)", margin: "12px 8px 8px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <UtilityLink href={`/${locale}/compare?a=${districtSlug}`} icon={GitCompareArrows} label="Compare districts" collapsed={collapsed} />
          <UtilityLink href="/support" icon={Heart} label="Support this project" collapsed={collapsed} color="var(--ftp-support)" />
          <UtilityLink href={`/${locale}/features`} icon={Lightbulb} label="Vote on features" collapsed={collapsed} color="var(--ftp-features)" />
          <UtilityLink href={`/${locale}/features?tab=suggest`} icon={MessageSquare} label="Spot something wrong? Tell us." collapsed={collapsed} />
        </div>
      </nav>
    </aside>
  );
}
