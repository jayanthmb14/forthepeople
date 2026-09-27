/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * BreadcrumbBottomSheet — bottom-sheet version of the breadcrumb dropdowns
 * on phones ("switch state / district / taluk"). Portal-rendered to body so
 * it sits above the sticky header and status strip.
 *
 * Design v3: tokens only, inline styles (so the older mobile.css rules do
 * not apply), 44 px rows, a 6 px live dot or a Lucide lock for "coming
 * soon", no slide animation, no shadow. Esc or tapping outside closes it.
 */

"use client";

import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Lock } from "lucide-react";
import { Pill } from "@/components/district/ui";

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
  const tb = useTranslations("breadcrumb");
  const tshell = useTranslations("page_shell");
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while the sheet is open; move focus into the sheet.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
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
      // data-ftp-sheet lets DistrictBreadcrumb's click-outside handler ignore
      // taps inside this portal (otherwise the mousedown closes the sheet
      // before the link's click fires, and navigation is cancelled).
      data-ftp-sheet=""
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
          maxHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--ftp-surface)",
          borderTop: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-card) var(--ftp-radius-card) 0 0",
          padding: "12px 16px max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <h3 className="ftp-label" style={{ margin: "0 0 8px" }}>{title}</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px", flex: 1, overflowY: "auto" }}>
          {items.map((item, i) => (
            <li key={item.slug} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={item.isCurrent ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 44,
                  padding: "0 8px",
                  textDecoration: "none",
                  fontSize: 15,
                  lineHeight: "22px",
                  color: item.isLive ? "var(--ftp-text)" : "var(--ftp-text-2)",
                  background: item.isCurrent ? "var(--ftp-surface-2)" : "transparent",
                  borderRadius: "var(--ftp-radius-tile)",
                  pointerEvents: item.isCurrent ? "none" : undefined,
                }}
              >
                {item.isLive ? (
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ftp-live)", flexShrink: 0 }} />
                ) : (
                  <Lock size={12} aria-label={tb("comingSoon")} style={{ flexShrink: 0 }} />
                )}
                <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
                {item.nameLocal && item.nameLocal.trim() !== item.name.trim() && (
                  <span lang="und" style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>{item.nameLocal}</span>
                )}
                {item.isCurrent && <Pill tone="brand">{tb("current")}</Pill>}
              </Link>
            </li>
          ))}
        </ul>
        <button
          ref={cancelRef}
          type="button"
          onClick={onClose}
          className="ftp-btn-secondary"
          style={{
            minHeight: 44,
            border: "1px solid var(--ftp-border)",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-surface)",
            color: "var(--ftp-text)",
            fontFamily: "var(--ftp-font-sans)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {tshell("bar.cancel")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
