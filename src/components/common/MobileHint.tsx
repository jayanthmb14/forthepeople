/**
 * ForThePeople.in — Responsive hint widget.
 *
 * On desktop (>=768px wide) the hint is hidden until hover/focus on the
 * trigger, exactly like a tooltip. On touch / narrow screens the same
 * text renders inline below the trigger so users on mobile aren't shut
 * out of the explanation. Tap toggles visibility on mobile.
 *
 * Use it anywhere we previously relied on `title=""` for explanation.
 *
 * Note: this is intentionally CSS-free of `:hover` for the mobile path.
 * `useReducedMotion`-style listeners are not used — the breakpoint check
 * happens once at mount and on resize so the component stays cheap.
 */

"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [breakpointPx]);
  return isMobile;
}

export default function MobileHint({
  hint,
  children,
}: {
  hint: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            background: "transparent", border: "none", padding: 0, margin: 0,
            display: "inline-flex", alignItems: "center", gap: 4,
            cursor: "pointer", color: "inherit", font: "inherit", textAlign: "left",
          }}
          aria-expanded={open}
        >
          {children}
          {/* Design v3: Lucide chevrons + token colour instead of text glyphs/hex */}
          {open ? (
            <ChevronDown size={12} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
          ) : (
            <ChevronRight size={12} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
          )}
        </button>
        {open && (
          <span style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", maxWidth: 240 }}>
            {hint}
          </span>
        )}
      </span>
    );
  }

  return (
    <span title={hint} style={{ cursor: "help", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
      <Info size={12} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
    </span>
  );
}
