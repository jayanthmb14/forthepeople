/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * MobileDistrictDrawer — the "All modules" bottom sheet on phones
 * (Design v3, CONCEPT-v3 §6).
 *
 * Slides up from the bottom (no animation — Design v3 has no decorative
 * motion) and lists every district module in the same 5 groups as the
 * desktop left rail: Civic duty · Money & resources · Daily services ·
 * Accountability · Community & people. Each row is 44 px tall with a
 * 16 px Lucide icon; the current module gets the brand tint.
 *
 * Driven by SIDEBAR_MODULES via getTieredModules() — adding a module to
 * the registry adds it here automatically. The component name is kept
 * from v2 (it used to be a left drawer) so imports keep working.
 */

"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getTieredModules } from "@/lib/constants/sidebar-modules";
import { hueClass } from "@/lib/design/hues";

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

const TIERS = getTieredModules();

export function MobileDistrictDrawer({
  open,
  onClose,
  locale,
  stateSlug,
  districtSlug,
  districtName,
  activeSlug,
}: Props) {
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
      aria-label={`${districtName}: all modules`}
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
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--ftp-surface)",
          borderTop: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-card) var(--ftp-radius-card) 0 0",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Sheet header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "8px 8px 8px 16px", borderBottom: "1px solid var(--ftp-border)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="ftp-label">All modules</p>
            <p className="ftp-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{districtName}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close module list"
            style={{
              width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "none", background: "transparent", color: "var(--ftp-text)", cursor: "pointer",
              borderRadius: "var(--ftp-radius-tile)",
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {/* Groups */}
        <nav aria-label="District modules" style={{ overflowY: "auto", padding: "4px 0 8px" }}>
          {TIERS.map((tier) => (
            <section key={tier.label} aria-label={tier.label}>
              <h2 className="ftp-label" style={{ padding: "12px 16px 4px" }}>{tier.label}</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {tier.modules.map((m) => {
                  const href = m.slug === "overview" ? base : `${base}/${m.slug}`;
                  const isActive = m.slug === current;
                  return (
                    <li key={m.slug}>
                      <Link
                        href={href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        data-active={isActive ? "true" : undefined}
                        className="ftp-rail-item"
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          minHeight: 44, padding: "0 16px", textDecoration: "none",
                          fontSize: 13, lineHeight: "20px", fontWeight: 500,
                          background: isActive ? "var(--ftp-brand-tint)" : "transparent",
                          color: isActive ? "var(--ftp-brand-deep)" : "var(--ftp-text)",
                        }}
                      >
                        <span
                          aria-hidden
                          className={`ftp-emoji ${hueClass(m.slug)}`}
                          style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: "var(--hue-tint)" }}
                        >
                          {m.emoji}
                        </span>
                        <span>{m.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
