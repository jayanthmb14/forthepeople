/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  usePopover — the behaviour every small header menu shares
// ═══════════════════════════════════════════════════════════════════════
//
//  Used by the product switcher, the header's "Menu" and the language menu:
//    - a click or tap outside closes it;
//    - Escape closes it and puts focus back on its button;
//    - tabbing out of it closes it;
//    - ArrowDown / ArrowUp / Home / End move between the items marked
//      `data-menu-item` inside the panel.
//
"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function usePopover(
  open: boolean,
  close: () => void,
  wrap: RefObject<HTMLElement | null>,
  button: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const inside = (n: EventTarget | null) => !!wrap.current && n instanceof Node && wrap.current.contains(n);
    const onDown = (e: PointerEvent) => {
      if (!inside(e.target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        button.current?.focus();
      }
    };
    const onFocus = (e: FocusEvent) => {
      if (!inside(e.target)) close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open, close, wrap, button]);
}

/** Arrow-key movement between `[data-menu-item]` elements of a panel. */
export function onMenuKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-menu-item]"));
  if (items.length === 0) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement as HTMLElement);
  let next = 0;
  if (e.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % items.length;
  else if (e.key === "ArrowUp") next = i <= 0 ? items.length - 1 : i - 1;
  else if (e.key === "End") next = items.length - 1;
  items[next]?.focus();
}

/** Focus the first `[data-menu-item]` inside `panel` (after it renders). */
export function focusFirstItem(panel: HTMLElement | null) {
  window.requestAnimationFrame(() => panel?.querySelector<HTMLElement>("[data-menu-item]")?.focus());
}
