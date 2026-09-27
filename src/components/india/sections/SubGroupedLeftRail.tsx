/**
 * SubGroupedLeftRail — left navigation rail for /en/india/category/<slug>.
 *
 * File 45 §4 Level 2. Reads getModulesGroupedBySubGroup, renders ALL CAPS
 * sub-group labels with thin underline separators. Modules without
 * sub-groups render flat (super-cats with <8 modules per file 40).
 */

import * as React from "react";
import Link from "next/link";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { getModulesGroupedBySubGroup } from "@/lib/india/india-super-categories";
import { IndiaSuperCategoryAccents, type IndiaAccentColorKey } from "@/lib/india/design-tokens";

export interface SubGroupedLeftRailProps {
  superCategorySlug: string;
  modules: IndiaModuleDef[];
  accentColor: IndiaAccentColorKey;
  locale: string;
  activeModuleSlug?: string;
  className?: string;
}

/** Registry sub-group keys are upper case ("JUSTICE"); show them in sentence case. */
function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function SubGroupedLeftRail({
  superCategorySlug,
  modules,
  accentColor,
  locale,
  activeModuleSlug,
  className,
}: SubGroupedLeftRailProps) {
  const accent = IndiaSuperCategoryAccents[accentColor];
  const groups = getModulesGroupedBySubGroup(superCategorySlug, modules);
  const liveCount = modules.filter((m) => m.status === "live").length;
  const soonCount = modules.filter(
    (m) => m.status === "coming_soon" || m.status === "planned",
  ).length;

  return (
    <aside
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "var(--color-text-secondary)",
          marginBottom: "12px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {modules.length} modules, {liveCount} live, {soonCount} soon
      </div>

      {Array.from(groups.entries()).map(([groupLabel, mods]) => (
        <div key={groupLabel} style={{ marginBottom: "16px" }}>
          {groupLabel !== "UNGROUPED" && (
            <div
              style={{
                fontSize: "12px",
                color: accent.hex,
                fontWeight: 600,
                paddingBottom: "4px",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
                marginBottom: "6px",
              }}
            >
              {sentenceCase(groupLabel)}
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {mods.map((m) => {
              const isActive = m.slug === activeModuleSlug;
              return (
                <li key={m.slug}>
                  <Link
                    href={`/${locale}/india/${m.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "5px 6px",
                      fontSize: "13px",
                      color: isActive ? accent.hex : "var(--color-text-primary)",
                      background: isActive ? accent.bg : "transparent",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    <span aria-hidden>{m.icon}</span>
                    <span style={{ flex: 1 }}>{m.title}</span>
                    {(m.status === "coming_soon" || m.status === "planned") && (
                      <span
                        style={{
                          fontSize: "10px",
                          background: "#FAEEDA",
                          color: "#854F0B",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontWeight: 600,
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

export default SubGroupedLeftRail;
