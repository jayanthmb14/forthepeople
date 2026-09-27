/**
 * SubGroupedLeftRail — left navigation rail for /[locale]/india/category/<slug>.
 *
 * File 45 §4 Level 2. Modules grouped by their registry sub-group (shown
 * translated, sentence case); modules without one render flat. The count
 * line comes from the page (`summary`), computed once from the same module
 * list as the hero ring and the footer note, so the three always agree.
 *
 * Works as a server component (sync; useTranslations is allowed there).
 */

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { getModulesGroupedBySubGroup } from "@/lib/india/india-super-categories";
import { INDIA_NS, indiaText } from "../i18n";

export interface SubGroupedLeftRailProps {
  superCategorySlug: string;
  modules: IndiaModuleDef[];
  locale: string;
  /** "10 modules, 4 live, 6 coming soon" — already translated. */
  summary: string;
  ariaLabel: string;
  activeModuleSlug?: string;
  className?: string;
}

export function SubGroupedLeftRail({
  superCategorySlug,
  modules,
  locale,
  summary,
  ariaLabel,
  activeModuleSlug,
  className,
}: SubGroupedLeftRailProps) {
  const t = useTranslations(INDIA_NS);
  const ti = useTranslations("india");
  const x = indiaText(t, ti);
  const groups = getModulesGroupedBySubGroup(superCategorySlug, modules);

  return (
    <nav
      aria-label={ariaLabel}
      className={className}
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "16px 14px",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--ftp-text-2)", margin: "0 0 12px 4px", fontVariantNumeric: "tabular-nums" }}>{summary}</p>

      {Array.from(groups.entries()).map(([groupLabel, mods]) => (
        <div key={groupLabel} style={{ marginBottom: 14 }}>
          {groupLabel !== "UNGROUPED" && (
            <div
              style={{
                fontSize: 12,
                color: "var(--hue-deep)",
                fontWeight: 700,
                padding: "0 4px 4px",
                borderBottom: "1px solid var(--ftp-border)",
                marginBottom: 6,
              }}
            >
              {x.subGroup(groupLabel)}
            </div>
          )}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {mods.map((m) => {
              const isActive = m.slug === activeModuleSlug;
              const soon = m.status === "coming_soon" || m.status === "planned";
              return (
                <li key={m.slug}>
                  <Link
                    href={`/${locale}/india/${m.slug}`}
                    aria-current={isActive ? "page" : undefined}
                    className="ftp-dt-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 6px",
                      minHeight: 36,
                      fontSize: 13,
                      color: isActive ? "var(--hue-deep)" : "var(--ftp-text)",
                      background: isActive ? "var(--hue-tint)" : "transparent",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span className="ftp-emoji" aria-hidden>
                      {m.icon}
                    </span>
                    <span style={{ flex: 1 }}>{x.moduleTitle(m)}</span>
                    {soon && (
                      <span style={{ fontSize: 11, background: "#FAEEDA", color: "#854F0B", padding: "1px 7px", borderRadius: 999, fontWeight: 600 }}>
                        {t("status.soon")}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default SubGroupedLeftRail;
