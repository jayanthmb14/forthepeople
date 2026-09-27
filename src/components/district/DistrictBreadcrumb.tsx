/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19.3 Phase B — visual breadcrumb + peer switcher.
 *
 * Pattern: India › (dot) Karnataka [v] › (dot) Mandya [v] › Select sub-district [v]
 *
 * Each crumb is BOTH a clickable link (jump to that level) AND a caret
 * dropdown for switching to peer entities at the same level — so a user
 * on /en/karnataka/mandya can hop directly to Bengaluru Urban or Mysuru
 * without visiting the homepage.
 */

"use client";

import { useTranslations } from "next-intl";
import { usePlaceText } from "@/i18n/client";
import { scriptLang } from "@/lib/utils/script-lang";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { BreadcrumbBottomSheet, type SheetItem } from "./BreadcrumbBottomSheet";

interface Peer {
  slug: string;
  name: string;
  isLive?: boolean; // present on state/district peers; missing/true for sub-districts
  /** Native-script name (Kannada/Hindi/Marathi/Telugu/etc.) — optional. */
  nameLocal?: string | null;
}

export interface DistrictBreadcrumbProps {
  locale: string;
  stateSlug: string;
  stateName: string;
  districtSlug: string;
  districtName: string;
  /** All states (Session 19.8 restoration: live + coming-soon). Live ones get
   *  a green dot; coming-soon get a lock icon. Sorted live-first by caller. */
  peerLiveStates: Peer[];
  /** All districts in the current state (Session 19.5: live + coming-soon). */
  peerLiveDistricts: Peer[];
  /** Sub-districts (taluks/tehsils/mandals) of the current district. */
  taluks: Peer[];
  currentTalukSlug?: string; // when on a taluk page, the active taluk
  currentTalukName?: string;
  /** Session 19.8: per-state singular subdivision label (Taluk / Tehsil /
   *  Mandal / Block / Taluka). Used for the 4th crumb placeholder + aria-label. */
  subdivisionLabel?: string;
  /** Compact mode: strips wrapper chrome so the breadcrumb fits inline in the header row. */
  compact?: boolean;
}

type MenuKey = null | "india" | "state" | "district" | "taluk";

export default function DistrictBreadcrumb({
  locale,
  stateSlug,
  stateName,
  districtSlug,
  districtName,
  peerLiveStates,
  peerLiveDistricts,
  taluks,
  currentTalukSlug,
  currentTalukName,
  subdivisionLabel,
  compact = false,
}: DistrictBreadcrumbProps) {
  const tb = useTranslations("breadcrumb");
  const tsu = useTranslations("subUnitOne");
  const place = usePlaceText();
  const subEn = subdivisionLabel ?? "Sub-district";
  const subLabel = tsu.has(subEn) ? tsu(subEn) : subEn;
  // Names follow the language: a local-script name leads when it matches the UI.
  const localName = (name: string, nameLocal?: string | null) =>
    nameLocal && nameLocal !== name && scriptLang(nameLocal) === locale ? nameLocal : name;
  const stateLabel = place.state(stateSlug, stateName);
  // Phones and tablets (< 1024 px, no sidebar) switch state/district/taluk
  // in a bottom sheet; laptops and PCs in a floating dropdown.
  const isMobile = useIsMobile();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const navRef = useRef<HTMLElement>(null);

  // Build sheet items + title for whichever menu is currently open.
  // Must run AFTER openMenu state is declared (TDZ).
  function getSheetData(): { title: string; items: SheetItem[] } | null {
    if (!openMenu) return null;
    if (openMenu === "state") {
      return {
        title: tb("switchState", { name: stateLabel }),
        items: peerLiveStates.map((s) => ({
          slug: s.slug,
          href: `/${locale}/${s.slug}`,
          name: s.name,
          nameLocal: s.nameLocal ?? null,
          isLive: s.isLive !== false,
          isCurrent: s.slug === stateSlug,
        })),
      };
    }
    if (openMenu === "district") {
      return {
        title: tb("switchDistrict", { name: districtName }),
        items: peerLiveDistricts.map((d) => ({
          slug: d.slug,
          href: `/${locale}/${stateSlug}/${d.slug}`,
          name: d.name,
          nameLocal: d.nameLocal ?? null,
          isLive: d.isLive !== false,
          isCurrent: d.slug === districtSlug,
        })),
      };
    }
    if (openMenu === "taluk") {
      return {
        title: tb("chooseSub", { unit: subLabel, name: districtName }),
        items: taluks.map((t) => ({
          slug: t.slug,
          href: `/${locale}/${stateSlug}/${districtSlug}/${t.slug}`,
          name: t.name,
          nameLocal: t.nameLocal ?? null,
          isLive: true,
          isCurrent: t.slug === currentTalukSlug,
        })),
      };
    }
    return null;
  }
  const sheet = isMobile ? getSheetData() : null;

  useEffect(() => {
    if (!openMenu) return;
    function onClickOutside(e: MouseEvent) {
      // On mobile the sheet (BreadcrumbBottomSheet) is portaled to body
      // and handles its own close via backdrop click. Without this guard
      // the mousedown on a sheet item would close the sheet via setOpenMenu(null)
      // BEFORE the click event fires, cancelling the Link navigation.
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-ftp-sheet]")) return;
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [openMenu]);

  const close = () => setOpenMenu(null);

  return (
    <nav
      ref={navRef}
      className="ftp-district-breadcrumb"
      data-compact={compact ? "true" : "false"}
      aria-label={tb("nav")}
    >
      <style>{`
        .ftp-district-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 4px;
          padding: 10px 16px;
          background: var(--ftp-surface);
          border-bottom: 1px solid var(--ftp-border);
          font-size: 13px;
          color: var(--ftp-text);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ftp-district-breadcrumb::-webkit-scrollbar { display: none; }

        .ftp-breadcrumb-crumb {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .ftp-breadcrumb-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          color: inherit;
          text-decoration: none;
          font-weight: 500;
          line-height: 1;
          transition: background 150ms ease;
          /* Session 19.10: when the placeholder crumb renders as a <button>
             (so users can click "Select Taluka" to open the menu), reset
             native button styling so it looks identical to the link case. */
          font-family: inherit;
          font-size: inherit;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .ftp-breadcrumb-link:hover { background: var(--ftp-surface-2); }
        .ftp-breadcrumb-link[data-placeholder="true"] { cursor: pointer; }
        .ftp-breadcrumb-link[data-current="true"] {
          color: var(--ftp-brand-deep);
          font-weight: 500;
        }
        .ftp-breadcrumb-link[data-placeholder="true"] {
          color: var(--ftp-text-2);
          font-weight: 500;
        }
        .ftp-breadcrumb-emoji { font-size: 14px; line-height: 1; }
        .ftp-breadcrumb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ftp-live);
          flex-shrink: 0;
        }
        /* Session 19.8 Phase E: coming-soon items in dropdown menus
           render a Lucide lock icon instead of a grey dot. */
        .ftp-breadcrumb-lock {
          font-size: 11px;
          line-height: 1;
          flex-shrink: 0;
          opacity: 0.7;
        }

        .ftp-breadcrumb-caret {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          margin-left: -2px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--ftp-text-2);
          font-size: 10px;
          line-height: 1;
          cursor: pointer;
          transition: background 150ms ease, color 150ms ease;
        }
        .ftp-breadcrumb-caret:hover {
          background: var(--ftp-surface-2);
          color: var(--ftp-text);
        }
        .ftp-breadcrumb-caret[aria-expanded="true"] {
          background: var(--ftp-brand-tint);
          color: var(--ftp-brand-deep);
        }

        .ftp-breadcrumb-sep {
          color: var(--ftp-border-strong);
          font-size: 12px;
          padding: 0 2px;
          flex-shrink: 0;
          user-select: none;
        }

        .ftp-breadcrumb-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 40;
          min-width: 240px;
          /* Session 19.9: bumped 360 → 70vh (capped at 560) so districts
             with 14+ sub-districts (Pune 14, Hyderabad 16) show without
             needing to scroll inside the menu. The previous 360px cap
             clipped the bottom items so clicks at their absolute screen
             coords landed on the page content beneath. */
          max-height: min(70vh, 560px);
          overflow-y: auto;
          background: var(--ftp-surface);
          border: 1px solid var(--ftp-border);
          border-radius: 10px;
          padding: 4px;
          /* Always show scrollbar on long menus (e.g. all-states list at
             36 items) so users know they can scroll for more. */
          scrollbar-width: thin;
        }
        .ftp-breadcrumb-menu::-webkit-scrollbar { width: 6px; }
        .ftp-breadcrumb-menu::-webkit-scrollbar-thumb {
          background: var(--ftp-border-strong);
          border-radius: 3px;
        }
        .ftp-breadcrumb-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          color: var(--ftp-text);
          text-decoration: none;
          font-size: 13px;
          line-height: 1.2;
          white-space: nowrap;
          transition: background 120ms ease;
        }
        .ftp-breadcrumb-menu-item-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ftp-breadcrumb-menu-item:hover { background: var(--ftp-surface-2); }
        /* Session 19.5: coming-soon items render in the same list, muted.
           Click still routes to the locked-district preview page. */
        .ftp-breadcrumb-menu-item[data-live="false"] {
          color: var(--ftp-text-2);
        }
        /* Session 19.5/19.7: current item — muted with inline "Current" badge,
           no click. The ::after pseudo-element was replaced by an inline
           <span> so it composes with the new nameLocal label without
           fighting for the same margin-left:auto slot. */
        .ftp-breadcrumb-menu-item[data-current="true"] {
          background: var(--ftp-surface-2);
          color: var(--ftp-text-2);
          cursor: default;
          pointer-events: none;
        }
        /* Session 19.7: native-script label rendered alongside English. */
        .ftp-breadcrumb-menu-item-local {
          font-size: 11px;
          color: var(--ftp-text-2);
          font-weight: 400;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .ftp-breadcrumb-menu-item[data-current="true"] .ftp-breadcrumb-menu-item-local {
          color: var(--ftp-border-strong);
        }
        .ftp-breadcrumb-menu-item[data-live="false"] .ftp-breadcrumb-menu-item-local {
          color: var(--ftp-border-strong);
        }
        /* "Current" badge — replaces the old ::after rule so it composes
           with the optional nameLocal span. */
        .ftp-breadcrumb-menu-item-current {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ftp-brand);
          font-weight: 500;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .ftp-breadcrumb-menu-empty {
          padding: 10px 12px;
          color: var(--ftp-text-2);
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .ftp-district-breadcrumb {
            padding: 8px 12px;
            font-size: 12px;
          }
          .ftp-breadcrumb-menu { min-width: 160px; }
        }

        /* Compact mode — flattens chrome so the breadcrumb sits inline
           in the global header row instead of a separate strip. */
        .ftp-district-breadcrumb[data-compact="true"] {
          padding: 0;
          background: transparent;
          border-bottom: none;
          font-size: 12px;
          flex-wrap: nowrap;
          overflow-x: visible;
          flex: 0 1 auto;
          min-width: 0;
        }
        .ftp-district-breadcrumb[data-compact="true"] .ftp-breadcrumb-link {
          padding: 3px 6px;
        }
        .ftp-district-breadcrumb[data-compact="true"] .ftp-breadcrumb-caret {
          width: 18px;
          height: 18px;
          font-size: 9px;
        }
        .ftp-district-breadcrumb[data-compact="true"] .ftp-breadcrumb-sep {
          padding: 0 1px;
        }
        @media (max-width: 1024px) {
          .ftp-district-breadcrumb[data-compact="true"] .ftp-breadcrumb-emoji,
          .ftp-district-breadcrumb[data-compact="true"] .ftp-breadcrumb-link span:not(.ftp-breadcrumb-emoji) {
            /* On medium screens trim non-current crumb labels to dots-only */
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ftp-breadcrumb-link,
          .ftp-breadcrumb-caret,
          .ftp-breadcrumb-menu-item { transition: none; }
        }
      `}</style>

      {/* India crumb — plain link, no caret. The peer-state switcher lives
          on the State crumb below. Matches production parity (S19.7). */}
      <span className="ftp-breadcrumb-crumb ftp-breadcrumb-crumb-static">
        <Link href={`/${locale}`} className="ftp-breadcrumb-link">
          <span>{tb("india")}</span>
        </Link>
      </span>

      <span className="ftp-breadcrumb-sep" aria-hidden="true">›</span>

      {/* State crumb — caret opens the full state list (Session 19.8 fix:
          this used to incorrectly render districts of the current state,
          duplicating the District crumb's caret). */}
      <BreadcrumbCrumb
        dot
        label={stateLabel}
        href={`/${locale}/${stateSlug}`}
        isCurrent={false}
        menuOpen={openMenu === "state"}
        floating={!isMobile}
        onCaretClick={() => setOpenMenu(openMenu === "state" ? null : "state")}
        ariaCaretLabel={tb("switchState", { name: stateLabel })}
      >
        {peerLiveStates.length === 0 ? (
          <div className="ftp-breadcrumb-menu-empty">{tb("noStates")}</div>
        ) : (
          peerLiveStates.map((s) => (
            <PeerMenuItem
              key={s.slug}
              href={`/${locale}/${s.slug}`}
              isLive={s.isLive !== false}
              isCurrent={s.slug === stateSlug}
              nameLocal={s.nameLocal ?? undefined}
              onClick={close}
            >
              {place.state(s.slug, s.name)}
            </PeerMenuItem>
          ))
        )}
      </BreadcrumbCrumb>

      <span className="ftp-breadcrumb-sep" aria-hidden="true">›</span>

      {/* District crumb (current unless a taluk is selected) — caret shows
          all districts in the same state, current marked, coming-soon greyed. */}
      <BreadcrumbCrumb
        dot
        label={districtName}
        href={`/${locale}/${stateSlug}/${districtSlug}`}
        isCurrent={!currentTalukSlug}
        menuOpen={openMenu === "district"}
        floating={!isMobile}
        onCaretClick={() =>
          setOpenMenu(openMenu === "district" ? null : "district")
        }
        ariaCaretLabel={tb("switchDistrict", { name: districtName })}
      >
        {peerLiveDistricts.length === 0 ? (
          <div className="ftp-breadcrumb-menu-empty">{tb("noDistricts")}</div>
        ) : (
          peerLiveDistricts.map((d) => (
            <PeerMenuItem
              key={d.slug}
              href={`/${locale}/${stateSlug}/${d.slug}`}
              isLive={d.isLive !== false}
              isCurrent={d.slug === districtSlug}
              nameLocal={d.nameLocal ?? undefined}
              onClick={close}
            >
              {localName(d.name, d.nameLocal)}
            </PeerMenuItem>
          ))
        )}
      </BreadcrumbCrumb>

      <span className="ftp-breadcrumb-sep" aria-hidden="true">›</span>

      {/* Sub-district crumb — current when on a taluk page, placeholder otherwise.
          Session 19.8: placeholder + aria-label use the per-state subdivision
          label (Taluk / Tehsil / Mandal / Block / Taluka). */}
      <BreadcrumbCrumb
        dot={!!currentTalukSlug}
        label={currentTalukName ?? tb("selectSub", { unit: subLabel })}
        href={
          currentTalukSlug
            ? `/${locale}/${stateSlug}/${districtSlug}/${currentTalukSlug}`
            : null
        }
        placeholder={!currentTalukSlug}
        isCurrent={!!currentTalukSlug}
        menuOpen={openMenu === "taluk"}
        floating={!isMobile}
        onCaretClick={() => setOpenMenu(openMenu === "taluk" ? null : "taluk")}
        ariaCaretLabel={tb("chooseSub", { unit: subLabel, name: districtName })}
      >
        {taluks.length === 0 ? (
          <div className="ftp-breadcrumb-menu-empty">
            {tb("noSubs", { unit: subLabel })}
          </div>
        ) : (
          taluks.map((t) => (
            <PeerMenuItem
              key={t.slug}
              href={`/${locale}/${stateSlug}/${districtSlug}/${t.slug}`}
              isLive
              isCurrent={t.slug === currentTalukSlug}
              nameLocal={t.nameLocal ?? undefined}
              onClick={close}
            >
              {localName(t.name, t.nameLocal)}
            </PeerMenuItem>
          ))
        )}
      </BreadcrumbCrumb>
      {sheet && (
        <BreadcrumbBottomSheet
          title={sheet.title}
          items={sheet.items}
          onClose={close}
        />
      )}
    </nav>
  );
}

interface PeerMenuItemProps {
  href: string;
  isLive: boolean;
  isCurrent: boolean;
  onClick: () => void;
  /** Native-script label rendered alongside English (Session 19.7). */
  nameLocal?: string | null;
  children: React.ReactNode;
}

/** Session 19.5: shared menu-item renderer.
 *  - Coming-soon (isLive=false): muted text + grey dot, still clickable
 *    (target route already has a LockedDistrictPreview).
 *  - Current (isCurrent=true): muted with a "Current" badge, click does
 *    nothing (CSS pointer-events: none — kept as <a> for screen readers).
 *
 *  Session 19.7: optional `nameLocal` (Kannada/Hindi/Marathi/Telugu) shows
 *  in muted grey on the right edge. The "Current" badge is now an inline
 *  <span> instead of a CSS ::after, so it composes cleanly with nameLocal. */
function PeerMenuItem({
  href,
  isLive,
  isCurrent,
  onClick,
  nameLocal,
  children,
}: PeerMenuItemProps) {
  // Suppress nameLocal when it's just an English-fallback duplicate of the
  // primary name (e.g. some districts set nameLocal: "Nagpur" when no
  const tb = useTranslations("breadcrumb");
  // native-script entry exists yet).
  const showLocal =
    typeof nameLocal === "string" &&
    nameLocal.trim().length > 0 &&
    (typeof children !== "string" || nameLocal.trim() !== children.trim());

  return (
    <Link
      href={href}
      className="ftp-breadcrumb-menu-item"
      data-live={isLive ? "true" : "false"}
      data-current={isCurrent ? "true" : "false"}
      aria-current={isCurrent ? "true" : undefined}
      onClick={onClick}
    >
      {isLive ? (
        <span className="ftp-breadcrumb-dot" aria-hidden="true" />
      ) : (
        <Lock size={11} className="ftp-breadcrumb-lock" aria-label={tb("comingSoon")} />
      )}
      <span className="ftp-breadcrumb-menu-item-label">{children}</span>
      {showLocal && (
        <span className="ftp-breadcrumb-menu-item-local">{nameLocal}</span>
      )}
      {isCurrent && (
        <span className="ftp-breadcrumb-menu-item-current">{tb("current")}</span>
      )}
    </Link>
  );
}

interface CrumbProps {
  emoji?: string;
  dot?: boolean;
  label: string;
  href: string | null;
  isCurrent: boolean;
  placeholder?: boolean;
  menuOpen: boolean;
  /**
   * Show the open menu as a floating dropdown (laptop/PC). On phones and
   * tablets the parent shows a BreadcrumbBottomSheet instead, so the
   * dropdown must not render as well.
   */
  floating?: boolean;
  onCaretClick: () => void;
  ariaCaretLabel: string;
  children: React.ReactNode;
}

function BreadcrumbCrumb({
  emoji,
  dot,
  label,
  href,
  isCurrent,
  placeholder,
  menuOpen,
  floating = true,
  onCaretClick,
  ariaCaretLabel,
  children,
}: CrumbProps) {
  const labelContent = (
    <>
      {emoji && (
        <span className="ftp-breadcrumb-emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      {dot && <span className="ftp-breadcrumb-dot" aria-hidden="true" />}
      <span>{label}</span>
    </>
  );

  return (
    <span className="ftp-breadcrumb-crumb">
      {href ? (
        <Link
          href={href}
          className="ftp-breadcrumb-link"
          data-current={isCurrent ? "true" : "false"}
          aria-current={isCurrent ? "page" : undefined}
        >
          {labelContent}
        </Link>
      ) : (
        // Session 19.10: placeholder crumb (e.g. "Select Taluka") is now a
        // BUTTON that opens the menu when clicked anywhere on its label.
        // Previously the only hit-target was the 18×18 caret next to it,
        // which was almost impossible to hit precisely.
        <button
          type="button"
          className="ftp-breadcrumb-link"
          data-placeholder={placeholder ? "true" : undefined}
          aria-label={ariaCaretLabel}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={onCaretClick}
        >
          {labelContent}
        </button>
      )}
      <button
        type="button"
        className="ftp-breadcrumb-caret"
        aria-label={ariaCaretLabel}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={onCaretClick}
      >
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      {menuOpen && floating && (
        <div className="ftp-breadcrumb-menu" role="menu">
          {children}
        </div>
      )}
    </span>
  );
}
