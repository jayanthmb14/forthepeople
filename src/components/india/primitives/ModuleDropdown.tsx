"use client";

/**
 * ModuleDropdown — breadcrumb pill that opens a searchable module list.
 *
 * Used at all 3 navigation levels (file 38 hero, file 45 §4 Level 2 / 3).
 *
 * Scope:
 * - 'all-india'      — lists every module across all super-categories
 * - 'super-category' — lists only modules in the given super-category
 *
 * Modules are grouped by `subGroup` (ALL CAPS labels). Search input filters
 * live and hides empty groups. Click a module → navigate to /<locale>/india/<slug>.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { INDIA_MODULES, type IndiaModuleDef } from "@/lib/india/india-modules";

export interface ModuleDropdownProps {
  currentLabel: string;
  scope: "all-india" | "super-category";
  superCategorySlug?: string;
  locale: string;
  className?: string;
}

function filterModules(
  modules: IndiaModuleDef[],
  scope: "all-india" | "super-category",
  superCategorySlug?: string,
): IndiaModuleDef[] {
  if (scope === "super-category" && superCategorySlug) {
    return modules.filter((m) => m.superCategory === superCategorySlug);
  }
  return modules;
}

/** Registry sub-group keys are upper case ("JUSTICE"); show them in sentence case. */
function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function ModuleDropdown({
  currentLabel,
  scope,
  superCategorySlug,
  locale,
  className,
}: ModuleDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const scoped = filterModules(INDIA_MODULES, scope, superCategorySlug);

  const lowerQuery = query.trim().toLowerCase();
  const matched = lowerQuery
    ? scoped.filter(
        (m) =>
          m.title.toLowerCase().includes(lowerQuery) ||
          m.tagline.toLowerCase().includes(lowerQuery) ||
          m.slug.toLowerCase().includes(lowerQuery),
      )
    : scoped;

  // Group by subGroup, preserving displayOrder within each group.
  const groups = new Map<string, IndiaModuleDef[]>();
  for (const m of matched.sort((a, b) => a.displayOrder - b.displayOrder)) {
    const key = m.subGroup || "ALL";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const totalLive = scoped.filter((m) => m.status === "live").length;
  const totalSoon = scoped.filter(
    (m) => m.status === "coming_soon" || m.status === "planned",
  ).length;

  const handleNavigate = (slug: string) => {
    setOpen(false);
    router.push(`/${locale}/india/${slug}`);
  };

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          height: "32px",
          padding: "6px 12px",
          fontSize: "12px",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "999px",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{currentLabel}</span>
        <span style={{ fontSize: "10px" }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "320px",
            maxHeight: "440px",
            overflowY: "auto",
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            zIndex: 10,
            padding: "10px",
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any module — economy, tigers, health…"
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "12px",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              outline: "none",
              marginBottom: "10px",
            }}
            autoFocus
          />

          {Array.from(groups.entries()).map(([groupLabel, modules]) => (
            <div key={groupLabel} style={{ marginBottom: "10px" }}>
              {groupLabel !== "ALL" && (
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    marginBottom: "4px",
                  }}
                >
                  {sentenceCase(groupLabel)}
                </div>
              )}
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {modules.map((m) => (
                  <li key={m.slug}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(m.slug)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "none",
                        background: "transparent",
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "var(--color-hover-bg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <span>{m.icon}</span>
                      <span style={{ flex: 1 }}>{m.title}</span>
                      {m.status === "planned" || m.status === "coming_soon" ? (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            background: "#FAEEDA",
                            color: "#854F0B",
                            padding: "1px 5px",
                            borderRadius: "3px",
                          }}
                        >
                          Soon
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-tertiary)",
              borderTop: "0.5px solid var(--color-border-tertiary)",
              paddingTop: "8px",
              marginTop: "6px",
            }}
          >
            {scoped.length} modules · {totalLive} live · {totalSoon} activating soon
          </div>
        </div>
      )}
    </div>
  );
}

export default ModuleDropdown;
