/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  ProductSwitcher — the logo, and the small "ForThePeople apps" menu
// ═══════════════════════════════════════════════════════════════════════
//
//    [logo] ForThePeople.in [▾]
//            ┌───────────────────────────────────────────────┐
//            │ ForThePeople apps                             │
//            │ [mark] ForThePeople.in       ✓ You are here   │
//            │        District data                          │
//            │ [mark] ForThePeople Connect    Coming soon    │
//            │        Report local problems                  │
//            │ [mark] ForThePeople Jobs       Coming soon    │
//            │        Government jobs and exams              │
//            └───────────────────────────────────────────────┘
//
//  - Clicking the logo goes home (as everyone expects).
//  - Hovering the logo with a mouse opens the menu; the small ▾ button next
//    to it opens it with a click, a tap or the keyboard (Enter / Space /
//    ArrowDown). Arrow keys move between rows, Escape closes.
//  - Phones (< 640 px) hide the ▾: the header's "Menu" lists the apps.
//
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ProductList } from "./products";
import { focusFirstItem, onMenuKeyDown, usePopover } from "./use-popover";
import styles from "./chrome.module.css";

export default function ProductSwitcher({ logo }: { logo: React.ReactNode }) {
  const t = useTranslations("header");
  // How it was opened: a hover-opened menu closes when the mouse leaves;
  // one opened by a click, a tap or the keyboard stays until dismissed.
  const [openedBy, setOpenedBy] = useState<"hover" | "press" | null>(null);
  const open = openedBy !== null;
  const setOpen = (v: boolean) => setOpenedBy(v ? "press" : null);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const panelId = useId();

  const close = useCallback(() => setOpenedBy(null), []);
  usePopover(open, close, wrap, button);

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  // Hover only for a real mouse; touch and pen use the ▾ button.
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    timer.current = window.setTimeout(() => setOpenedBy((m) => m ?? "hover"), 120);
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    timer.current = window.setTimeout(() => {
      // A keyboard user already inside the list keeps it open.
      const a = document.activeElement;
      const keep = !!a && a !== button.current && !!wrap.current?.contains(a);
      setOpenedBy((m) => (m === "hover" ? (keep ? "press" : null) : m));
    }, 260);
  };

  return (
    <div ref={wrap} className={styles.brand} onPointerEnter={onEnter} onPointerLeave={onLeave}>
      {logo}
      <button
        ref={button}
        type="button"
        className={styles.switcherBtn}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("products.switcherAria")}
        onClick={() => {
          clearTimer();
          // A click on a hover-opened menu pins it open; otherwise it toggles.
          setOpenedBy((m) => (m === "press" ? null : "press"));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            focusFirstItem(panel);
          }
        }}
      >
        <ChevronDown size={15} aria-hidden className={open ? styles.caretOpen : undefined} />
      </button>
      {open && (
        <div
          ref={panel}
          id={panelId}
          className={styles.switcherPanel}
          role="group"
          aria-label={t("products.title")}
          onKeyDown={onMenuKeyDown}
        >
          <p className={styles.menuTitle}>{t("products.title")}</p>
          <ProductList onNavigate={close} />
        </div>
      )}
    </div>
  );
}
