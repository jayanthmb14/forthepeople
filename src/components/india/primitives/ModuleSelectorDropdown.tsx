"use client";

/**
 * ModuleSelectorDropdown — searchable, super-category-grouped module picker.
 *
 * Used as the trigger pill in the breadcrumb. Two modes:
 *  - global (default): all 10 super-categories with expand/collapse + flat search
 *  - scoped: pass `superCategorySlug` to skip grouping and list only that
 *    super-category's modules
 *
 * Closes on click-outside / Escape / module navigation.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building,
  BookOpenText,
  ChevronDown,
  ChevronRight,
  Globe2,
  PawPrint,
  Pickaxe,
  Rocket,
  Scale,
  Search,
  Theater,
  TrendingUp,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import {
  INDIA_MODULES,
  type IndiaModuleDef,
} from "@/lib/india/india-modules";
import {
  INDIA_SUPER_CATEGORIES,
  getModulesForSuperCategory,
  type IndiaSuperCategoryDef,
  type WatermarkIconKey,
} from "@/lib/india/india-super-categories";
import { SECTION_ACCENT_COLORS } from "@/lib/india/section-accents";
import { INDIA_NS, indiaText, type IndiaText } from "../i18n";

const SC_ICONS: Record<WatermarkIconKey, LucideIcon> = {
  "trending-up": TrendingUp,
  "book-open-text": BookOpenText,
  "globe-2": Globe2,
  "paw-print": PawPrint,
  wheat: Wheat,
  pickaxe: Pickaxe,
  building: Building,
  scale: Scale,
  rocket: Rocket,
  theater: Theater,
};

export interface ModuleSelectorDropdownProps {
  locale: string;
  superCategorySlug?: string;
  triggerLabel: string;
}

function StatusPill({ status, x }: { status: IndiaModuleDef["status"]; x: IndiaText }) {
  const isLive = status === "live";
  return (
    <span
      style={{
        fontSize: "12px",
        lineHeight: "16px",
        fontWeight: 600,
        padding: "1px 5px",
        borderRadius: "3px",
        background: isLive ? "#E1F5EE" : "#FAEEDA",
        color: isLive ? "#16A34A" : "#854F0B",
        flexShrink: 0,
      }}
    >
      {x.statusShort(status)}
    </span>
  );
}

function ModuleRow({
  module,
  onClick,
  indented,
  x,
}: {
  module: IndiaModuleDef;
  onClick: () => void;
  indented: boolean;
  x: IndiaText;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "start",
        paddingBlock: "6px",
        paddingInlineEnd: "12px",
        paddingInlineStart: indented ? "44px" : "12px",
        fontSize: "12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--color-text-primary)",
        borderRadius: "4px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--color-hover-bg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "14px" }} aria-hidden>
        {module.icon}
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{x.moduleTitle(module)}</span>
      <StatusPill status={module.status} x={x} />
    </button>
  );
}

export function ModuleSelectorDropdown({
  locale,
  superCategorySlug,
  triggerLabel,
}: ModuleSelectorDropdownProps) {
  const router = useRouter();
  const t = useTranslations(INDIA_NS);
  const ti = useTranslations("india");
  const x = indiaText(t, ti);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expandedSCs, setExpandedSCs] = React.useState<Set<string>>(new Set());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Click-outside + Escape to close
  React.useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Auto-focus search when opening
  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const goTo = (slug: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/${locale}/india/${slug}`);
  };

  const toggleSC = (slug: string) =>
    setExpandedSCs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const lower = query.trim().toLowerCase();
  const isFlatMode = lower.length > 0 || !!superCategorySlug;

  // Build filtered set
  const matchingModules: IndiaModuleDef[] = React.useMemo(() => {
    let pool: IndiaModuleDef[] = INDIA_MODULES;
    if (superCategorySlug) {
      pool = getModulesForSuperCategory(superCategorySlug, INDIA_MODULES);
    }
    if (!lower) return pool.slice().sort((a, b) => a.displayOrder - b.displayOrder);
    return pool
      .filter((m) =>
        [m.slug, m.title, m.tagline, x.moduleTitle(m), x.moduleTagline(m)].some((s) => s.toLowerCase().includes(lower)),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [lower, superCategorySlug, x]);

  // Group view (when no search and no scoping)
  const groupedSCs: IndiaSuperCategoryDef[] = React.useMemo(
    () => [...INDIA_SUPER_CATEGORIES].sort((a, b) => a.displayOrder - b.displayOrder),
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "999px",
          padding: "4px 10px",
          fontSize: "12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          color: "var(--color-text-secondary)",
        }}
      >
        {triggerLabel}
        <ChevronDown size={11} aria-hidden />
      </button>

      {open && (
        <div
          role="listbox"
          data-ftp-module-popover="1"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            // Anchor to the trigger pill's left edge so the panel expands
            // rightward into the viewport rather than off-screen left.
            // On mobile (< 768 px) india-mobile.css overrides left/width
            // so the popover centers in the viewport with 12 px gutters
            // instead of clipping past the right edge.
            left: 0,
            width: "480px",
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "520px",
            overflowY: "auto",
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)",
            zIndex: 50,
            padding: "10px",
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              marginBottom: "10px",
            }}
          >
            <Search size={14} aria-hidden style={{ color: "var(--color-text-tertiary)" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("picker.search")}
              aria-label={t("picker.search")}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "12px",
                background: "transparent",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {isFlatMode ? (
            // Flat: search results OR scoped super-category
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {matchingModules.length === 0 && (
                <li
                  style={{
                    padding: "16px 12px",
                    fontSize: "12px",
                    color: "var(--color-text-tertiary)",
                    textAlign: "center",
                  }}
                >
                  {t("picker.noMatch", { q: query })}
                </li>
              )}
              {matchingModules.map((m) => (
                <li key={m.slug}>
                  <ModuleRow module={m} onClick={() => goTo(m.slug)} indented={false} x={x} />
                </li>
              ))}
            </ul>
          ) : (
            // Grouped: 10 super-categories with expand/collapse
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {groupedSCs.map((sc, idx) => {
                const SCIcon = SC_ICONS[sc.watermarkIcon];
                const accentHex = SECTION_ACCENT_COLORS[sc.slug] ?? "#1A1A1A";
                const scModules = getModulesForSuperCategory(sc.slug, INDIA_MODULES);
                const isExpanded = expandedSCs.has(sc.slug);
                const sectionNumber = idx + 1;
                return (
                  <li key={sc.slug}>
                    <button
                      type="button"
                      onClick={() => toggleSC(sc.slug)}
                      aria-expanded={isExpanded}
                      style={{
                        width: "100%",
                        textAlign: "start",
                        padding: "8px 12px",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "var(--color-text-primary)",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          `color-mix(in srgb, ${accentHex} 8%, transparent)`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                      }}
                    >
                      {/* Color dot — section accent at full opacity */}
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: accentHex,
                          flexShrink: 0,
                        }}
                      />
                      {/* Plain section number — accent-coloured, bold, tabular */}
                      <span
                        style={{
                          fontFamily: "var(--ftp-font-sans)",
                          fontVariantNumeric: "tabular-nums",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: accentHex,
                          minWidth: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {sectionNumber}
                      </span>
                      <SCIcon size={14} style={{ color: accentHex, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{x.scTitle(sc)}</span>
                      <span
                        style={{
                          fontFamily: "var(--ftp-font-sans)",
                          fontVariantNumeric: "tabular-nums",
                          fontSize: "12px",
                          color: "var(--color-text-tertiary)",
                          background: "var(--color-background-secondary)",
                          padding: "1px 7px",
                          borderRadius: "999px",
                        }}
                      >
                        {t("picker.count", { n: scModules.length })}
                      </span>
                      <ChevronRight
                        size={11}
                        style={{
                          color: "var(--color-text-tertiary)",
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                          transition: "transform 150ms",
                        }}
                      />
                    </button>
                    {isExpanded && (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {scModules.map((m) => (
                          <li key={m.slug}>
                            <ModuleRow
                              module={m}
                              onClick={() => goTo(m.slug)}
                              indented
                              x={x}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleSelectorDropdown;
