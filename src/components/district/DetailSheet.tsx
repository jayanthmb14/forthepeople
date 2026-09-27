/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// DetailSheet — "tap anything, see everything about it"
// ═══════════════════════════════════════════════════════════
// One shared panel for details on every module: a person on Leadership,
// a scheme, an exam, a project, an office. The visitor never leaves the
// page to see the full story.
//
//   phone / tablet (< 1024 px)  bottom sheet, up to 90 % of the screen
//   laptop / PC   (≥ 1024 px)  panel sliding in from the right, 480 px
//
// Accessible: role="dialog" + aria-modal, focus moves into the panel and
// back to the opener on close, Escape and the backdrop close it, the page
// behind does not scroll. Motion is off under prefers-reduced-motion.
//
// Design v5 "Calm": the header chip and the row labels show small
// monochrome Lucide icons, never emoji. Pass `icon={User}` / a row `icon`;
// old call sites that pass `emoji="👤"` get the matching icon
// (src/lib/design/emoji-icons.ts) or nothing.
//
//   const [open, setOpen] = useState<Leader | null>(null);
//   <button onClick={() => setOpen(leader)}>…</button>
//   <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.name} icon={User}>
//     <DetailList rows={[{ icon: Landmark, label: t("role"), value: open.role }]} />
//   </DetailSheet>
"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { KitIcon, emojiIcon } from "@/lib/design/emoji-icons";

export function DetailSheet({
  open,
  onClose,
  title,
  subtitle,
  emoji,
  icon,
  media,
  hueClassName,
  titleLang,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  /** One plain line under the title ("MLA for Mandya since 2023"). */
  subtitle?: React.ReactNode;
  /** v4 prop: mapped to its Lucide icon for the header chip, never drawn as an emoji. */
  emoji?: string;
  /** Lucide icon for the header chip (ignored when `media` is given). */
  icon?: LucideIcon;
  /** A photo or illustration instead of the emoji chip. */
  media?: React.ReactNode;
  /** e.g. "ftp-hue-violet" to colour the panel in a module hue. */
  hueClassName?: string;
  /** lang of the title text when it is not in the page language. */
  titleLang?: string;
  children: React.ReactNode;
  /** Sticky bottom area for the main action (Apply, Call, Open source). */
  footer?: React.ReactNode;
}) {
  const t = useTranslations("kit");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the panel heading so screen readers announce what opened.
    const focusTimer = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-sheet-title]")?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && panelRef.current) {
        // Keep Tab inside the panel.
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  const chipIcon = icon ?? emojiIcon(emoji);

  return createPortal(
    <div className={`ftp-sheet-root ${hueClassName ?? ""}`}>
      <div className="ftp-sheet-backdrop" onClick={onClose} aria-hidden />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="ftp-sheet">
        <div className="ftp-sheet-grip" aria-hidden />
        <header className="ftp-sheet-head">
          {media ?? (chipIcon ? <span className="ftp-sheet-emoji" aria-hidden><KitIcon icon={chipIcon} size={20} /></span> : null)}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 id={titleId} data-sheet-title tabIndex={-1} lang={titleLang} className="ftp-sheet-title">
              {title}
            </h2>
            {subtitle && <p className="ftp-sheet-sub">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="ftp-sheet-close" aria-label={t("close")}>
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="ftp-sheet-body">{children}</div>
        {footer && <footer className="ftp-sheet-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Label / value rows for a DetailSheet ("Role — MLA, Mandya"). Rows with no
 * value are skipped. v5: a row's `icon` (or its old `emoji`, mapped to an
 * icon) is drawn as a small monochrome icon; list rows never show emoji.
 */
export function DetailList({
  rows,
}: {
  rows: { icon?: LucideIcon; emoji?: string; label: React.ReactNode; value: React.ReactNode | null | undefined; lang?: string }[];
}) {
  const shown = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== "");
  if (shown.length === 0) return null;
  return (
    <dl className="ftp-detail-list">
      {shown.map((r, i) => {
        return (
          <div key={i} className="ftp-detail-row">
            <dt>
              <KitIcon icon={r.icon} emoji={r.emoji} size={14} />
              <span>{r.label}</span>
            </dt>
            <dd lang={r.lang}>{r.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
