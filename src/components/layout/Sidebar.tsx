/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules, getOrderedSlugs } from "@/lib/constants/sidebar-modules";

interface SidebarProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Categories + flat order are derived from the priority field in
// sidebar-modules.ts — no hardcoded slug lists live in this file.
const SIDEBAR_CATEGORIES = getTieredModules().map((g) => ({
  label: g.label.toUpperCase(),
  slugs: g.modules.map((m) => m.slug),
}));

const ALL_SLUGS = getOrderedSlugs();

const MODULE_MAP = Object.fromEntries(SIDEBAR_MODULES.map((m) => [m.slug, m]));

export default function Sidebar({ locale, stateSlug, districtSlug }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const baseUrl = `/${locale}/${stateSlug}/${districtSlug}`;
  const pathParts = pathname.split("/").filter(Boolean);
  const activeSlug = pathParts[3] ?? "overview";

  function renderLink(slug: string) {
    const mod = MODULE_MAP[slug];
    if (!mod) return null;
    const Icon = mod.icon;
    const isActive = activeSlug === slug;
    const href = slug === "overview" ? baseUrl : `${baseUrl}/${slug}`;

    return (
      <Link
        key={slug}
        href={href}
        title={collapsed ? mod.label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: collapsed ? "8px 14px" : "6px 12px",
          textDecoration: "none",
          background: isActive ? "#EFF6FF" : "transparent",
          borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
          color: isActive ? "#2563EB" : "#6B6B6B",
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          transition: "background 150ms ease, color 150ms ease",
          borderRadius: "0 6px 6px 0",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "#F5F5F0";
            (e.currentTarget as HTMLElement).style.color = "#1A1A1A";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#6B6B6B";
          }
        }}
      >
        {collapsed ? (
          <Icon size={15} style={{ flexShrink: 0, color: isActive ? "#2563EB" : "#9B9B9B" }} />
        ) : (
          <>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{mod.emoji}</span>
            <span style={{ flex: 1, lineHeight: 1.3 }}>{mod.label}</span>
          </>
        )}
      </Link>
    );
  }

  return (
    <aside
      style={{
        width: collapsed ? 52 : 240,
        minWidth: collapsed ? 52 : 240,
        height: "calc(100vh - 56px - 36px)",
        position: "sticky",
        top: 56,
        overflowY: "auto",
        overflowX: "hidden",
        background: "#FFFFFF",
        borderRight: "1px solid #E8E8E4",
        transition: "width 200ms ease, min-width 200ms ease",
        flexShrink: 0,
        scrollbarWidth: "thin",
        scrollbarColor: "#E8E8E4 transparent",
      }}
      className="hidden md:block"
    >
      {/* ◀ / ▶ Collapse toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          padding: "10px 10px 6px",
          borderBottom: "1px solid #E8E8E4",
        }}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            border: "1px solid #E8E8E4",
            borderRadius: 6,
            background: "#FAFAF8",
            cursor: "pointer",
            color: "#6B6B6B",
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {collapsed ? (
        /* Collapsed: icon-only list of all modules */
        <>
          <div style={{ paddingTop: 4 }}>
            {ALL_SLUGS.map(renderLink)}
          </div>
          <div style={{ borderTop: "1px solid #E8E8E4", marginTop: 4 }}>
            <Link
              href={`/${locale}/compare?a=${districtSlug}`}
              title="Compare Districts"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", textDecoration: "none", color: "#6B6B6B" }}
            >
              <span style={{ fontSize: 14 }}>⚖️</span>
            </Link>
            <Link
              href="/support"
              title="Support This Project"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", textDecoration: "none", color: "#DC2626" }}
            >
              <span style={{ fontSize: 14 }}>❤️</span>
            </Link>
            <Link
              href="/en/features"
              title="Vote on Features"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", textDecoration: "none", color: "#7C3AED" }}
            >
              <span style={{ fontSize: 14 }}>🗳️</span>
            </Link>
            <div style={{ height: 8 }} />
          </div>
        </>
      ) : (
        /* Expanded: full categorized list — always visible */
        <div style={{ paddingBottom: 8 }}>
          {SIDEBAR_CATEGORIES.map((cat, catIdx) => (
            <div key={cat.label}>
              {catIdx > 0 && (
                <div style={{ height: 1, background: "#F0F0EC", margin: "5px 0" }} />
              )}
              <div
                style={{
                  padding: catIdx === 0 ? "10px 12px 4px" : "7px 12px 3px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "#C0C0BA",
                }}
              >
                {cat.label}
              </div>
              {cat.slugs.map(renderLink)}
            </div>
          ))}

          {/* Bottom: Compare + Support */}
          <div style={{ height: 1, background: "#E8E8E4", margin: "10px 0 4px" }} />
          <Link
            href={`/${locale}/compare?a=${districtSlug}`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", textDecoration: "none",
              color: "#6B6B6B", fontSize: 13,
              borderLeft: "3px solid transparent",
              borderRadius: "0 6px 6px 0",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F5F5F0";
              (e.currentTarget as HTMLElement).style.color = "#1A1A1A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#6B6B6B";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚖️</span>
            <span>Compare Districts</span>
          </Link>
          <Link
            href="/support"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", textDecoration: "none",
              color: "#DC2626", fontSize: 13, fontWeight: 500,
              borderLeft: "3px solid transparent",
              borderRadius: "0 6px 6px 0",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FFF1F2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>❤️</span>
            <span>Support This Project</span>
          </Link>
          <Link
            href="/en/features"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", textDecoration: "none",
              color: "#7C3AED", fontSize: 13, fontWeight: 500,
              borderLeft: "3px solid transparent",
              borderRadius: "0 6px 6px 0",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F5F3FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>🗳️</span>
            <span>Vote on Features</span>
          </Link>
          <Link
            href={`/${locale}/features?tab=suggest`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", textDecoration: "none",
              color: "#16A34A", fontSize: 13, fontWeight: 500,
              borderLeft: "3px solid transparent",
              borderRadius: "0 6px 6px 0",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F0FDF4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
            <span>Spot something wrong? Tell us.</span>
          </Link>
          <div style={{ height: 12 }} />
        </div>
      )}
    </aside>
  );
}
