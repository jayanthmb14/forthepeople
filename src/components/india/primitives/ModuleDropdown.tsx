"use client";

/**
 * ModuleDropdown — breadcrumb pill that opens a searchable module list.
 *
 * Used on the super-category page and the data-module deep-dive.
 *
 * Scope:
 * - 'all-india'      — lists every module across all super-categories
 * - 'super-category' — lists only modules in the given super-category
 *
 * Modules are grouped by `subGroup`. The search matches the translated
 * title and tagline as well as the English ones, so a Kannada reader can
 * type in Kannada. Click a module → /<locale>/india/<slug>. Closes on
 * outside click and Escape.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Search } from "lucide-react";
import { INDIA_MODULES, type IndiaModuleDef } from "@/lib/india/india-modules";
import { INDIA_NS, indiaText } from "../i18n";

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

export function ModuleDropdown({ currentLabel, scope, superCategorySlug, locale, className }: ModuleDropdownProps) {
  const router = useRouter();
  const t = useTranslations(INDIA_NS);
  const ti = useTranslations("india");
  const x = indiaText(t, ti);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const scoped = filterModules(INDIA_MODULES, scope, superCategorySlug);

  const q = query.trim().toLowerCase();
  const matched = q
    ? scoped.filter((m) =>
        [m.title, m.tagline, m.slug, x.moduleTitle(m), x.moduleTagline(m)].some((s) => s.toLowerCase().includes(q)),
      )
    : scoped;

  // Group by subGroup, preserving displayOrder within each group.
  const groups = new Map<string, IndiaModuleDef[]>();
  for (const m of [...matched].sort((a, b) => a.displayOrder - b.displayOrder)) {
    const key = m.subGroup || "ALL";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const totalLive = scoped.filter((m) => m.status === "live").length;
  const totalSoon = scoped.filter((m) => m.status === "coming_soon" || m.status === "planned").length;

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
          minHeight: 32,
          padding: "5px 12px",
          fontSize: 13,
          background: "var(--ftp-surface)",
          border: "1px solid var(--ftp-border)",
          borderRadius: 999,
          color: "var(--ftp-text)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{currentLabel}</span>
        <ChevronDown size={13} aria-hidden />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineStart: 0,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 460,
            overflowY: "auto",
            background: "var(--ftp-surface)",
            border: "1px solid var(--ftp-border)",
            borderRadius: 14,
            boxShadow: "var(--ftp-shadow-2)",
            zIndex: 50,
            padding: 10,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: "1px solid var(--ftp-border)", borderRadius: 10, marginBottom: 10 }}>
            <Search size={14} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
            <span className="sr-only">{t("picker.search")}</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("picker.searchAny")}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--ftp-text)" }}
              autoFocus
            />
          </label>

          {matched.length === 0 && (
            <p style={{ padding: "12px 8px", fontSize: 13, color: "var(--ftp-text-2)", textAlign: "center", margin: 0 }}>
              {t("picker.noMatch", { q: query })}
            </p>
          )}

          <div role="listbox" aria-label={currentLabel}>
            {Array.from(groups.entries()).map(([groupLabel, modules]) => (
              <div key={groupLabel} style={{ marginBottom: 10 }}>
                {groupLabel !== "ALL" && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ftp-text-2)", margin: "0 0 4px 6px" }}>
                    {x.subGroup(groupLabel)}
                  </div>
                )}
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {modules.map((m) => (
                    <li key={m.slug}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => handleNavigate(m.slug)}
                        className="ftp-dt-row"
                        style={{
                          width: "100%",
                          textAlign: "start",
                          padding: "7px 8px",
                          fontSize: 13,
                          border: "none",
                          background: "transparent",
                          color: "var(--ftp-text)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 8,
                        }}
                      >
                        <span className="ftp-emoji" aria-hidden>
                          {m.icon}
                        </span>
                        <span style={{ flex: 1 }}>{x.moduleTitle(m)}</span>
                        {m.status === "planned" || m.status === "coming_soon" ? (
                          <span style={{ fontSize: 12, fontWeight: 600, background: "var(--ftp-warn-tint)", color: "var(--ftp-warn)", padding: "1px 7px", borderRadius: 999 }}>
                            {t("status.soon")}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--ftp-text-2)", borderTop: "1px solid var(--ftp-border)", paddingTop: 8, marginTop: 6 }}>
            {t("picker.summary", { total: scoped.length, live: totalLive, soon: totalSoon })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModuleDropdown;
