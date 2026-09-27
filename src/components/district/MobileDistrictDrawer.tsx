/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * MobileDistrictDrawer — the "All modules" bottom sheet on phones and
 * tablets (below 1024 px, where there is no sidebar).
 *
 * Lists every district module in the same nine groups as the sidebar
 * (docs/MODULE-MAP.md). v5: group headings are text only; each row is
 * 44 px tall with the module emoji (its one identity icon) in its own hue
 * and the translated name. The current module gets its hue. Modules with
 * no data for this district are muted and say "Coming soon".
 *
 * Phone: one column. Tablet: the rows flow into 2–3 columns inside a
 * group, so the whole list fits without long scrolling.
 *
 * Driven by the registry (getGroupedModules) — adding a module to
 * SIDEBAR_MODULES adds it here automatically. The component name is kept
 * from v2 (it used to be a left drawer) so imports keep working.
 */

"use client";

import { useTranslations } from "next-intl";
import { useModuleText } from "@/i18n/client";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getGroupedModules } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";
import { useModuleGroupName } from "@/components/layout/useModuleGroups";
import { useFreshness } from "@/hooks/useFreshness";

interface Props {
  open: boolean;
  onClose: () => void;
  locale: string;
  stateSlug: string;
  districtSlug: string;
  districtName: string;
  /** Active module slug (for highlighting). */
  activeSlug?: string;
}

const GROUPS = getGroupedModules();

export function MobileDistrictDrawer({
  open,
  onClose,
  locale,
  stateSlug,
  districtSlug,
  districtName,
  activeSlug,
}: Props) {
  const ts = useTranslations("sidebar");
  const tsh = useTranslations("page_shell");
  const mt = useModuleText();
  const groupName = useModuleGroupName();
  const fresh = useFreshness(stateSlug, districtSlug);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock page scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Move keyboard focus into the sheet when it opens.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Esc closes the sheet.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  const base = `/${locale}/${stateSlug}/${districtSlug}`;
  const current = activeSlug ?? "overview";

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={tsh("nav.allTopicsFor", { district: districtName })}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        background: "color-mix(in srgb, var(--ftp-text) 45%, transparent)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--ftp-surface)",
          borderTop: "1px solid var(--ftp-border)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -12px 40px -12px rgba(0,0,0,.35)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Grab handle, so the sheet reads as a sheet */}
        <div aria-hidden style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <span style={{ width: 40, height: 4, borderRadius: 999, background: "var(--ftp-border-strong)" }} />
        </div>

        {/* Sheet header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "4px 8px 8px 16px", borderBottom: "1px solid var(--ftp-border)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="ftp-label">{tsh("nav.allTopics")}</p>
            <p className="ftp-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{districtName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={ts("closeList")}
            style={{
              width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "none", background: "transparent", color: "var(--ftp-text)", cursor: "pointer",
              borderRadius: "var(--ftp-radius-tile)", flexShrink: 0,
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Groups */}
        <nav aria-label={ts("modules")} style={{ overflowY: "auto", padding: "4px 8px 8px" }}>
          {GROUPS.map((group) => {
            const name = groupName(group.key);
            return (
              <section key={group.key} aria-labelledby={`ftp-drawer-group-${group.key}`}>
                <h2
                  id={`ftp-drawer-group-${group.key}`}
                  className="ftp-label"
                  style={{ padding: "14px 8px 6px", margin: 0 }}
                >
                  {name}
                </h2>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
                  }}
                >
                  {group.modules.map((m) => {
                    const href = m.slug === "overview" ? base : `${base}/${m.slug}`;
                    const isActive = m.slug === current;
                    const soon = fresh.primary(m.slug)?.status === "not_collected";
                    return (
                      <li key={m.slug} className={hueClass(m.slug)}>
                        <Link
                          href={href}
                          onClick={onClose}
                          aria-current={isActive ? "page" : undefined}
                          data-active={isActive ? "true" : undefined}
                          className="ftp-rail-item"
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            minHeight: 44, padding: "6px 8px", textDecoration: "none",
                            borderRadius: 12,
                            fontSize: 14, lineHeight: "20px", fontWeight: 500,
                            color: soon ? "var(--ftp-text-2)" : "var(--ftp-text)",
                          }}
                        >
                          <span
                            aria-hidden
                            className="ftp-emoji"
                            style={{
                              width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                              background: soon ? "var(--ftp-surface-2)" : "var(--hue-tint)",
                              filter: soon ? "grayscale(1)" : undefined,
                              opacity: soon ? 0.6 : undefined,
                            }}
                          >
                            {m.emoji}
                          </span>
                          <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <span>{mt.label(m.slug)}</span>
                            {soon && <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 400 }}>{tsh("nav.comingSoon")}</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
