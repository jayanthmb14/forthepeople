/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session M1 Phase I: full-height LEFT drawer that surfaces every
 * district module (My Responsibility / Overview / Leadership / Finance /
 * …) grouped by tier. Replaces the desktop sidebar at viewport ≤ 767px.
 *
 * Driven by SIDEBAR_MODULES (single source of truth).
 */

"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { getTieredModules } from "@/lib/constants/sidebar-modules";

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

  return createPortal(
    <div
      className="ftp-m-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${districtName} modules`}
    >
      <aside
        className="ftp-m-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ftp-m-drawer-head">
          <div>
            <div className="ftp-m-drawer-title">{districtName}</div>
            <div className="ftp-m-drawer-sub">All modules</div>
          </div>
          <button
            type="button"
            className="ftp-m-drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </header>
        <nav className="ftp-m-drawer-list" aria-label="District modules">
          {TIERS.map((tier) => (
            <div key={tier.label}>
              <div className="ftp-m-drawer-group-label">
                {tier.label.toUpperCase()}
              </div>
              {tier.modules.map((m) => {
                const href = m.slug === "overview" ? base : `${base}/${m.slug}`;
                const isActive = m.slug === (activeSlug ?? "overview");
                return (
                  <Link
                    key={m.slug}
                    href={href}
                    onClick={onClose}
                    className={`ftp-m-drawer-item${isActive ? " is-active" : ""}`}
                  >
                    <span className="ftp-m-drawer-item-icon" aria-hidden="true">
                      {m.emoji}
                    </span>
                    <span className="ftp-m-drawer-item-label">{m.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
