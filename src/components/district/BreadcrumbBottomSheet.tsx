/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session M1 Phase H: bottom-sheet variant of the breadcrumb dropdown
 * for mobile. Portal-rendered to body so it sits above the sticky
 * header + status bar without z-index gymnastics.
 */

"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect } from "react";
import { Lock } from "lucide-react";

export interface SheetItem {
  slug: string;
  href: string;
  name: string;
  nameLocal?: string | null;
  isLive: boolean;
  isCurrent: boolean;
}

interface Props {
  title: string;
  items: SheetItem[];
  onClose: () => void;
}

export function BreadcrumbBottomSheet({ title, items, onClose }: Props) {
  // Lock body scroll while the sheet is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc closes the sheet
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ftp-m-sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="ftp-m-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ftp-m-sheet-handle" aria-hidden="true" />
        <h3 className="ftp-m-sheet-title">{title}</h3>
        <ul className="ftp-m-sheet-list">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`ftp-m-sheet-item${item.isCurrent ? " is-current" : ""}${!item.isLive ? " is-soon" : ""}`}
                aria-current={item.isCurrent ? "page" : undefined}
              >
                {item.isLive ? (
                  <span className="ftp-m-sheet-dot" aria-hidden="true" />
                ) : (
                  <Lock
                    size={12}
                    className="ftp-m-sheet-lock"
                    aria-hidden="true"
                  />
                )}
                <span className="ftp-m-sheet-name">{item.name}</span>
                {item.nameLocal &&
                  item.nameLocal.trim() !== item.name.trim() && (
                    <span className="ftp-m-sheet-local">{item.nameLocal}</span>
                  )}
                {item.isCurrent && (
                  <span className="ftp-m-sheet-current-badge">Current</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="ftp-m-sheet-cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
