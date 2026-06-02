/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 12 v7 — major HeaderBar overhaul:
 *   - Logo with 👥 emoji prefix; mobile collapses to "👥 FTP.in"
 *   - Product dropdown items get emojis (👥/🤝/💼) + green/red status dots
 *   - District autocomplete search: live (green) + locked (lock icon)
 *     districts. Click live → district page. Click locked → /vote-district?d=slug
 *   - Theme toggle LOCKED (☀️🔒) with "Dark mode coming soon" tooltip;
 *     resets any prior dark-mode localStorage to be safe
 *   - Language dropdown: English active, others lock-prefixed + "Soon" badge
 *   - Desktop nav: Support text link, Vote on Features text link, ♥ Support btn
 *   - GitHub badge REMOVED from desktop header (moves to footer / mobile menu)
 *   - Mobile: 👥 FTP.in + search icon + ♥ + ☰ — full nav in hamburger panel
 *
 * Wire-up to [locale]/layout.tsx is already in place from Session 11.1.
 */

"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  Github,
  Languages,
  Heart,
  Lock,
  Network,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { INDIA_STATES, getState, getDistrict } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import DistrictBreadcrumb from "@/components/district/DistrictBreadcrumb";

// ── Product dropdown items ────────────────────────────────
// Session 13 v8 Fix #12, #13: Lucide icons in brand colors (no apple emoji),
// .jobs uses yellow (was amber/orange).
type Product = {
  key: "in" | "connect" | "jobs";
  Icon: LucideIcon;
  iconColor: string;
  name: string;
  suffix: string;
  suffixColor: string;
  href: string;
  status: "live" | "soon";
};

const PRODUCTS: Product[] = [
  { key: "in",      Icon: Users,     iconColor: "#2563EB", name: "ForThePeople", suffix: ".in",      suffixColor: "#2563EB", href: "/",            status: "live" },
  { key: "connect", Icon: Network,   iconColor: "#7C3AED", name: "ForThePeople", suffix: ".connect", suffixColor: "#7C3AED", href: "/coming-soon", status: "soon" },
  { key: "jobs",    Icon: Briefcase, iconColor: "#EAB308", name: "ForThePeople", suffix: ".jobs",    suffixColor: "#EAB308", href: "/coming-soon", status: "soon" },
];

// ── GitHub star tier ──────────────────────────────────────
// Color shifts as community grows (scalable per Jayanth's spec).
function githubTier(stars: number): "bronze" | "silver" | "gold" | "platinum" | "diamond" {
  if (stars >= 5000) return "diamond";
  if (stars >= 1000) return "platinum";
  if (stars >= 500) return "gold";
  if (stars >= 100) return "silver";
  return "bronze";
}

const GITHUB_STARS_FALLBACK = 149;
const GITHUB_STARS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function useGithubStars(): number {
  const [stars, setStars] = useState<number>(GITHUB_STARS_FALLBACK);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const cached = sessionStorage.getItem("ftp_gh_stars");
        const cachedAt = sessionStorage.getItem("ftp_gh_stars_at");
        if (cached && cachedAt && Date.now() - parseInt(cachedAt, 10) < GITHUB_STARS_CACHE_TTL_MS) {
          if (!cancelled) setStars(parseInt(cached, 10));
          return;
        }
        const res = await fetch("https://api.github.com/repos/jayanthmb14/forthepeople", {
          headers: { Accept: "application/vnd.github.v3+json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { stargazers_count?: number };
        const count = data.stargazers_count ?? GITHUB_STARS_FALLBACK;
        sessionStorage.setItem("ftp_gh_stars", String(count));
        sessionStorage.setItem("ftp_gh_stars_at", String(Date.now()));
        if (!cancelled) setStars(count);
      } catch {
        /* swallow — fallback already in state */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  return stars;
}

// ── Languages (en active, others production-style "Soon") ──
type Lang = { code: string; name: string; nameLocal: string; active: boolean };
const LANGUAGES: Lang[] = [
  { code: "en", name: "English",   nameLocal: "English",      active: true  },
  { code: "hi", name: "Hindi",     nameLocal: "हिन्दी",         active: false },
  { code: "kn", name: "Kannada",   nameLocal: "ಕನ್ನಡ",        active: false },
  { code: "ta", name: "Tamil",     nameLocal: "தமிழ்",        active: false },
  { code: "te", name: "Telugu",    nameLocal: "తెలుగు",       active: false },
  { code: "bn", name: "Bengali",   nameLocal: "বাংলা",         active: true  },
  { code: "mr", name: "Marathi",   nameLocal: "मराठी",         active: false },
  { code: "gu", name: "Gujarati",  nameLocal: "ગુજરાતી",       active: false },
  { code: "pa", name: "Punjabi",   nameLocal: "ਪੰਜਾਬੀ",        active: false },
  { code: "ml", name: "Malayalam", nameLocal: "മലയാളം",       active: false },
];

// ── Flatten INDIA_STATES into a single searchable list ──
type FlatDistrict = {
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  active: boolean;
};

function flattenDistricts(): FlatDistrict[] {
  const out: FlatDistrict[] = [];
  for (const s of INDIA_STATES) {
    for (const d of s.districts) {
      out.push({
        slug: d.slug,
        name: d.name,
        stateSlug: s.slug,
        stateName: s.name,
        active: d.active,
      });
    }
  }
  return out;
}

// Session 18 v12 Phase B: useUpdatedPill removed (the consuming pill moved
// to StatsBar's 5th tile; that tile sources its own timestamp via props).

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

export interface HeaderBarProps {
  locale: string;
}

export default function HeaderBar({ locale }: HeaderBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const githubStars = useGithubStars();
  const githubStarsTier = githubTier(githubStars);

  const [productOpen, setProductOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const productRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(productRef, () => setProductOpen(false));
  useClickOutside(langRef, () => setLangOpen(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  // Reset any stale dark-mode preference (theme is locked in v7)
  useEffect(() => {
    try {
      document.documentElement.classList.remove("dark");
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("ftp_theme");
      localStorage.removeItem("theme");
    } catch {
      /* ignore */
    }
  }, []);

  // Escape closes any open dropdown / panel.
  useEffect(() => {
    if (!productOpen && !langOpen && !searchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProductOpen(false);
        setLangOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [productOpen, langOpen, searchOpen]);

  const allDistricts = useMemo(() => flattenDistricts(), []);

  // Session 19.4: detect district context from pathname so the breadcrumb
  // can render inline in the header (replaces the old standalone breadcrumb
  // strip + DistrictStatusBar that wasted ~75px of vertical space).
  const routeParts = useMemo(
    () => (pathname ?? "").split("/").filter(Boolean),
    [pathname],
  );
  const routeStateSlug = routeParts[1];
  const routeDistrictSlug = routeParts[2];
  const routeTalukSlug = routeParts[3];
  const routeStateData = routeStateSlug ? getState(routeStateSlug) : undefined;
  const routeDistrictData =
    routeStateSlug && routeDistrictSlug
      ? getDistrict(routeStateSlug, routeDistrictSlug)
      : undefined;
  const routeTalukData = routeTalukSlug
    ? routeDistrictData?.taluks.find((t) => t.slug === routeTalukSlug)
    : undefined;
  const isDistrictPage = !!(
    routeStateSlug &&
    routeDistrictSlug &&
    routeStateData &&
    routeDistrictData
  );
  // Session 19.8: state caret needs the FULL state list (was incorrectly
  // wired to the district list in S19.5). Live ones first, then alphabetical.
  const peerLiveStates = useMemo(() => {
    const decorated = INDIA_STATES.map((s) => ({
      slug: s.slug,
      name: s.name,
      nameLocal: s.nameLocal,
      isLive: s.districts.some((d) => d.active),
    }));
    decorated.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return decorated;
  }, []);
  // Session 19.5: send the full list of districts (live + coming-soon) so the
  // breadcrumb dropdowns can render coming-soon items in muted grey. Sorted
  // live-first, then alphabetically within each group.
  // Session 19.7: include nameLocal so menus can show native script.
  const peerLiveDistricts = useMemo(() => {
    const decorated = (routeStateData?.districts ?? []).map((d) => ({
      slug: d.slug,
      name: d.name,
      nameLocal: d.nameLocal,
      isLive: d.active === true,
    }));
    decorated.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return decorated;
  }, [routeStateData]);
  const taluksForBreadcrumb = useMemo(
    () =>
      (routeDistrictData?.taluks ?? []).map((t) => ({
        slug: t.slug,
        name: t.name,
        nameLocal: t.nameLocal,
      })),
    [routeDistrictData],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { live: [] as FlatDistrict[], locked: [] as FlatDistrict[] };
    const matches = allDistricts.filter((d) =>
      d.name.toLowerCase().includes(q) || d.stateName.toLowerCase().includes(q),
    );
    return {
      live: matches.filter((d) => d.active).slice(0, 8),
      locked: matches.filter((d) => !d.active).slice(0, 12),
    };
  }, [search, allDistricts]);

  const activeLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const first = filtered.live[0] ?? filtered.locked[0];
    if (!first) return;
    const href = first.active
      ? `/${locale}/${first.stateSlug}/${first.slug}`
      : `/${locale}/vote-district?d=${first.slug}`;
    setSearchOpen(false);
    router.push(href);
  }

  return (
    <header
      className="ftp-header-bar"
      role="banner"
      style={{
        // Session 19.11: 30 → 50 so the breadcrumb dropdown menu (inside
        // header's stacking context) paints above the DistrictStatusBar
        // (which is also z:30 and tied with the header at the same level —
        // source order made the status bar cover the menu's top items).
        // Admin modals at z:60+ still sit above the header.
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#FFFFFF",
        borderBottom: "1px solid #E8E8E4",
        padding: "10px 32px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <style>{`
        /* Session 15 v9 Phase E (Fix #7): tighten on narrow viewports so 32px doesn't crowd the edges. */
        @media (max-width: 1280px) {
          .ftp-header-bar { padding: 10px 20px !important; }
        }
        @media (max-width: 767px) {
          /* Mobile-revert: tighter padding + gap so the single-row layout
             (logo + search + 5 icons) fits within 375px. */
          .ftp-header-bar { padding: 6px 6px !important; gap: 4px !important; }
          .ftp-header-bar .ftp-desktop-only { display: none !important; }
          /* Mobile-revert: keep the full "ForThePeople.in" wordmark on
             mobile too. The .ftp-logo-short abbreviation never renders
             now — kept in DOM for any callers that might unhide it. */
          .ftp-header-bar .ftp-logo-full { display: inline !important; }
          .ftp-header-bar .ftp-logo-short { display: none !important; }
        }
        @media (min-width: 768px) {
          .ftp-header-bar .ftp-mobile-only { display: none !important; }
          .ftp-header-bar .ftp-logo-short { display: none !important; }
        }
        .ftp-pill { font-size: 11px; padding: 4px 10px; border-radius: 999px; }
        .ftp-pulse-dot {
          display: inline-block;
          width: 6px; height: 6px; border-radius: 50%;
          background: #16A34A;
          margin-right: 6px;
          animation: ftp-pulse 2s ease-in-out infinite;
        }
        @keyframes ftp-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-pulse-dot { animation: none; }
        }
        .ftp-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: #1A1A1A; text-decoration: none;
          padding: 6px 10px; border-radius: 8px;
          background: transparent; border: none; cursor: pointer;
        }
        .ftp-link-btn:hover { background: #F5F5F0; }

        /* Session 19 v13 Phase B: logo link + caret button */
        .ftp-logo-group {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .ftp-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          color: #1A1A1A;
          letter-spacing: -0.01em;
          text-decoration: none;
          white-space: nowrap;
          transition: background 150ms ease;
        }
        .ftp-logo-link:hover { background: #F5F5F0; }
        .ftp-logo-icon { color: #2563EB; flex-shrink: 0; }
        .ftp-product-trigger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #6B7280;
          border-radius: 4px;
          transition: background 150ms ease, color 150ms ease;
        }
        .ftp-product-trigger:hover { background: #F5F5F0; color: #1A1A1A; }
        .ftp-product-trigger:focus-visible {
          outline: 2px solid #2563EB;
          outline-offset: 2px;
        }
        .ftp-product-caret { transition: transform 200ms ease; }
        .ftp-product-caret.ftp-rotated { transform: rotate(180deg); }

        /* Session 19 v13 Phase C (Fix #2): the product dropdown ALWAYS renders
           all 3 products (verified — there's no filter in PRODUCTS.map). The
           current page gets a subtle highlight via aria-current="page" so
           users can confirm where they are without the entry being hidden. */
        [role="menu"] [role="menuitem"][aria-current="page"] {
          background: #EFF6FF;
        }
        [role="menu"] [role="menuitem"][aria-current="page"]::after {
          content: "current";
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #2563EB;
          background: #DBEAFE;
          padding: 1px 5px;
          border-radius: 3px;
          margin-left: 4px;
          flex-shrink: 0;
        }
        .ftp-status-dot {
          display: inline-block;
          width: 7px; height: 7px; border-radius: 50%;
          flex-shrink: 0;
        }
        .ftp-status-dot-green { background: #10B981; }
        .ftp-status-dot-red   { background: #DC2626; }
        /* Session 16 v10 Phase B (Fix #1): blue-tinted search field */
        /* Session 18.1 Phase C (Fix #2): visible styling on the INPUT itself,
           not just the form wrapper. DOM inspection of <input> now sees real
           bg + border instead of transparent. !important wins over Tailwind
           preflight + reset cascades. */
        .ftp-search-shell {
          flex: 1;
          min-width: 0;
          max-width: 440px;
          margin-left: auto;
          position: relative;
        }
        /* Session 19.4 Phase B: on district pages the inline breadcrumb takes
           the elastic space, so the search caps narrower (was 440px → 240px). */
        .ftp-search-shell-compact {
          flex: 0 1 240px;
          max-width: 240px;
          margin-left: 8px;
        }
        @media (max-width: 1280px) {
          .ftp-search-shell-compact { flex: 0 1 200px; max-width: 200px; }
        }
        @media (max-width: 1024px) {
          .ftp-search-shell-compact { flex: 0 1 160px; max-width: 160px; }
        }
        /* Wrapper around the inline breadcrumb — takes up flex space so the
           search shell shrinks naturally to its own max-width.
           Session 19.6: overflow MUST be visible so the dropdown menu inside
           (position: absolute relative to a child crumb) can paint outside
           the slot's content rect. With overflow:hidden the menu was
           DOM-visible but pixel-clipped to the slot's height, so hit-testing
           below the header returned page content beneath. The breadcrumb
           itself uses flex-wrap:nowrap and min-width:0 to self-constrain. */
        .ftp-header-breadcrumb-slot {
          display: flex;
          align-items: center;
          flex: 1 1 auto;
          min-width: 0;
          margin-left: 4px;
          overflow: visible;
        }
        .ftp-search-form {
          position: relative;
          display: block;
          width: 100%;
        }
        .ftp-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: #6B7280 !important;
          pointer-events: none;
          z-index: 1;
        }
        .ftp-search-input {
          width: 100% !important;
          padding: 8px 38px 8px 36px !important;
          background: #F9FAFB !important;
          border: 1px solid #E5E7EB !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          color: #1A1A1A !important;
          font-family: inherit !important;
          outline: none !important;
          transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease !important;
        }
        .ftp-search-input::placeholder { color: #9CA3AF !important; }
        .ftp-search-input:hover {
          background: #F3F4F6 !important;
          border-color: #D1D5DB !important;
        }
        .ftp-search-input:focus {
          background: #FFFFFF !important;
          border-color: #2563EB !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
        }
        .ftp-search-kbd {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-family: inherit;
          font-size: 10px;
          color: #6B7280;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          padding: 1px 5px;
          border-radius: 3px;
          pointer-events: none;
          z-index: 1;
          line-height: 1;
        }
        .ftp-search-form:focus-within .ftp-search-kbd { display: none; }
        .ftp-search-results {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E8E8E4;
          border-radius: 10px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.10);
          padding: 6px;
          max-height: 380px;
          overflow-y: auto;
          z-index: 50;
        }
        .ftp-search-divider {
          padding: 6px 10px;
          font-size: 10px;
          color: #9B9B9B;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .ftp-search-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          color: #1A1A1A;
          text-decoration: none;
          cursor: pointer;
          min-height: 36px;
        }
        .ftp-search-row:hover { background: #F5F5F0; }
        .ftp-search-row .meta { color: #9B9B9B; font-size: 11px; margin-left: auto; }
        /* Session 14 v8.1 Phase B Fix #4: Theme toggle gets an outline */
        .ftp-theme-locked {
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid #E8E8E4;
          cursor: not-allowed;
          color: #6B7280;
          position: relative;
          font-size: 14px;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .ftp-theme-locked:hover {
          background: #FAFAF8;
          border-color: #D1D5DB;
        }
        .ftp-theme-locked .ftp-lock-overlay {
          position: absolute;
          right: 4px; bottom: 4px;
          font-size: 9px;
          color: #DC2626;
        }
        .ftp-mobile-panel {
          position: fixed;
          top: 56px; right: 12px;
          background: #FFFFFF;
          border: 1px solid #E8E8E4;
          border-radius: 12px;
          padding: 10px;
          min-width: 220px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.10);
          z-index: 40;
        }
        .ftp-mobile-panel a, .ftp-mobile-panel button {
          display: flex; align-items: center; gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #1A1A1A;
          font-size: 14px;
          text-decoration: none;
          text-align: left;
          min-height: 44px;
        }
        .ftp-mobile-panel a:hover, .ftp-mobile-panel button:hover { background: #F5F5F0; }

        /* Session 14 v8.1 Phase B: outlined header items + yellow GitHub star */
        /* Session 15 v9 Phase E (Fix #7): margin-left:auto pushes the right group to the corner. */
        .ftp-github-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          margin-left: auto;
          background: #FFFFFF;
          border: 1px solid #E8E8E4;
          border-radius: 6px;
          color: #4B5563;
          text-decoration: none;
          font-size: 12px;
          transition: background 150ms ease, color 150ms ease, border-color 150ms ease, transform 150ms ease;
          /* Session 19.9: when the inline breadcrumb takes flex space on
             district pages, this badge gets squeezed below 1024-1366px
             viewports and the "★ N" text wraps to a 2nd line. Pin width
             to its content. */
          flex-shrink: 0;
          white-space: nowrap;
        }
        .ftp-github-link:hover {
          background: #FAFAF8;
          border-color: #D1D5DB;
          color: #1A1A1A;
          transform: translateY(-1px);
        }
        .ftp-github-icon { width: 16px; height: 16px; }
        .ftp-github-stars {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #EAB308; /* default = gold/yellow */
        }
        .ftp-github-stars[data-tier="bronze"]   { color: #B45309; }
        .ftp-github-stars[data-tier="silver"]   { color: #94A3B8; }
        .ftp-github-stars[data-tier="gold"]     { color: #EAB308; }
        .ftp-github-stars[data-tier="platinum"] { color: #7C3AED; }
        .ftp-github-stars[data-tier="diamond"]  { color: #2563EB; }

        /* Session 14 v8.1 Phase B Fix #2: Vote on Features purple pill */
        .ftp-vote-features-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: #EEEDFE;
          color: #3C3489;
          border: 1px solid #DDD6FE;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .ftp-vote-features-link:hover {
          background: #DDD6FE;
          border-color: #6E59C0;
          transform: translateY(-1px);
        }
        .ftp-vote-features-emoji { font-size: 13px; line-height: 1; }

        /* Session 14 v8.1 Phase B Fix #3: Language button — Languages icon + outline */
        .ftp-language-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          background: #FFFFFF;
          border: 1px solid #E8E8E4;
          border-radius: 6px;
          color: #4B5563;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
        }
        .ftp-language-btn:hover {
          background: #FAFAF8;
          border-color: #D1D5DB;
        }
        .ftp-language-icon { width: 14px; height: 14px; color: #9B9B9B; }
        .ftp-language-chevron { width: 12px; height: 12px; opacity: 0.6; }

        /* Session 13 v8 Fix #18: Support button — layered red */
        .ftp-support-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: #FFF1F2;
          color: #E11D48;
          border: 1px solid #FECDD3;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          white-space: nowrap;
          transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
        }
        .ftp-support-btn:hover {
          background: #FFE4E6;
          border-color: #FDA4AF;
          transform: translateY(-1px);
        }
        .ftp-support-btn-heart {
          color: #E11D48;
          width: 14px;
          height: 14px;
        }
      `}</style>

      {/* ── Logo + product dropdown trigger ── */}
      {/* Session 19 v13 Phase B (Fix #1): logo TEXT navigates home; only the
          chevron caret button opens the product dropdown. Citizens were
          stuck before — clicking the logo only opened the product menu. */}
      <div ref={productRef} className="ftp-logo-group" style={{ position: "relative" }}>
        <Link
          href={`/${locale}`}
          className="ftp-logo-link"
          aria-label="ForThePeople.in home"
        >
          <Users size={18} aria-hidden="true" className="ftp-logo-icon" />
          <span className="ftp-logo-full">
            ForThePeople<span style={{ color: "#2563EB" }}>.in</span>
          </span>
          <span className="ftp-logo-short">
            FTP<span style={{ color: "#2563EB" }}>.in</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setProductOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={productOpen}
          aria-label="Open product menu"
          className="ftp-product-trigger"
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`ftp-product-caret${productOpen ? " ftp-rotated" : ""}`}
          />
        </button>
        {productOpen && (
          <ul
            role="menu"
            aria-label="Switch product"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              minWidth: 240,
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              padding: 4,
              listStyle: "none",
              margin: 0,
              zIndex: 40,
            }}
          >
            {PRODUCTS.map((p) => {
              const isLive = p.status === "live";
              const targetHref = isLive ? `/${locale}` : "/coming-soon";
              const ProductIcon = p.Icon;
              return (
                <li key={p.key} role="none">
                  <Link
                    role="menuitem"
                    href={targetHref}
                    onClick={() => setProductOpen(false)}
                    aria-current={isLive ? "page" : undefined}
                    title={isLive ? "Currently here" : "Not yet live"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#1A1A1A",
                      textDecoration: "none",
                    }}
                  >
                    <ProductIcon size={16} aria-hidden="true" style={{ color: p.iconColor, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>
                      {p.name}
                      <span style={{ color: p.suffixColor, fontWeight: 600 }}>{p.suffix}</span>
                    </span>
                    <span
                      className={`ftp-status-dot ${isLive ? "ftp-status-dot-green" : "ftp-status-dot-red"}`}
                      aria-label={isLive ? "Live" : "Not yet live"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Session 18 v12 Phase B: "Updated Xm ago" pill removed — moved to StatsBar 5th tile. */}

      {/* Session 19.4 Phase B: visual breadcrumb sits inline in the header on
          district pages — replaces the old standalone breadcrumb strip + the
          DistrictStatusBar (saved ~75px of vertical space). */}
      {isDistrictPage && routeStateData && routeDistrictData && (
        <div className="ftp-desktop-only ftp-header-breadcrumb-slot">
          <DistrictBreadcrumb
            compact
            locale={locale}
            stateSlug={routeStateSlug!}
            stateName={routeStateData.name}
            districtSlug={routeDistrictSlug!}
            districtName={routeDistrictData.name}
            peerLiveStates={peerLiveStates}
            peerLiveDistricts={peerLiveDistricts}
            taluks={taluksForBreadcrumb}
            currentTalukSlug={routeTalukData?.slug}
            currentTalukName={routeTalukData?.name}
            subdivisionLabel={
              getStateConfig(routeStateSlug ?? "")?.subDistrictUnit ??
              "Sub-district"
            }
          />
        </div>
      )}

      {/* ── Search — Session 16 v10 Phase B Fix #1: blue-tinted with affordance ── */}
      <div
        ref={searchRef}
        className={`ftp-search-shell${isDistrictPage ? " ftp-search-shell-compact" : ""}`}
      >
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="ftp-search-form"
        >
          <Search size={14} className="ftp-search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search any district…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            aria-label="Search any district"
            className="ftp-search-input"
          />
          <kbd className="ftp-search-kbd" aria-hidden="true">⌘K</kbd>
        </form>

        {searchOpen && search.trim().length > 0 && (
          <div className="ftp-search-results" role="listbox" aria-label="District search results">
            {filtered.live.length === 0 && filtered.locked.length === 0 ? (
              <div style={{ padding: 14, fontSize: 12, color: "#9B9B9B", textAlign: "center" }}>
                No matching districts. Try a different name.
              </div>
            ) : (
              <>
                {filtered.live.length > 0 && (
                  <>
                    <div className="ftp-search-divider">
                      ─── {filtered.live.length} live ───
                    </div>
                    {filtered.live.map((d) => (
                      <Link
                        key={`live-${d.stateSlug}-${d.slug}`}
                        href={`/${locale}/${d.stateSlug}/${d.slug}`}
                        className="ftp-search-row"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="ftp-status-dot ftp-status-dot-green" aria-hidden="true" />
                        <span>{d.name}</span>
                        <span className="meta">{d.stateName}</span>
                      </Link>
                    ))}
                  </>
                )}
                {filtered.locked.length > 0 && (
                  <>
                    <div className="ftp-search-divider">
                      ─── {filtered.locked.length} locked · vote to unlock ───
                    </div>
                    {filtered.locked.map((d) => (
                      <Link
                        key={`locked-${d.stateSlug}-${d.slug}`}
                        href={`/${locale}/vote-district?d=${d.slug}`}
                        className="ftp-search-row"
                        onClick={() => setSearchOpen(false)}
                      >
                        <Lock size={12} style={{ color: "#9B9B9B", flexShrink: 0 }} aria-hidden="true" />
                        <span style={{ color: "#6B7280" }}>{d.name}</span>
                        <span className="meta">{d.stateName}</span>
                      </Link>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── GitHub stars + Vote on features text link ── */}
      {/* Session mobile-revert Phase D: previously .ftp-desktop-only; now
          shows on mobile too as icon-only via .ftp-mobile-compact (CSS hides
          the text spans below 768px so just the icon renders). */}
      <a
        href="https://github.com/jayanthmb14/forthepeople"
        target="_blank"
        rel="noopener noreferrer"
        className="ftp-github-link ftp-mobile-compact"
        aria-label={`GitHub repository (${githubStars.toLocaleString("en-IN")} stars)`}
      >
        <Github className="ftp-github-icon" aria-hidden="true" />
        <span className="ftp-github-stars" data-tier={githubStarsTier}>
          ★ {githubStars.toLocaleString("en-IN")}
        </span>
      </a>
      <Link
        href={`/${locale}/features`}
        className="ftp-vote-features-link ftp-mobile-compact"
      >
        <span className="ftp-vote-features-emoji" aria-hidden="true">🗳️</span>
        <span>Vote on Features</span>
      </Link>

      {/* ── Language dropdown — also shown on mobile as icon-only ── */}
      <div ref={langRef} className="ftp-mobile-compact" style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={langOpen}
          className="ftp-language-btn"
        >
          <Languages className="ftp-language-icon" aria-hidden="true" />
          <span>{activeLang.code.toUpperCase()}</span>
          <ChevronDown className="ftp-language-chevron" aria-hidden="true" />
        </button>
        {langOpen && (
          <ul
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              minWidth: 240,
              maxHeight: 320,
              overflowY: "auto",
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              padding: 4,
              listStyle: "none",
              margin: 0,
            }}
          >
            {LANGUAGES.map((l) => {
              const isActive = l.code === locale;
              return (
                <li key={l.code} role="none">
                  {l.active ? (
                    <Link
                      role="menuitem"
                      href={`/${l.code}${pathname?.replace(/^\/[a-z]{2}/, "") ?? ""}`}
                      onClick={() => setLangOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 6,
                        textDecoration: "none",
                        color: "#1A1A1A",
                        fontSize: 13,
                        background: isActive ? "#EFF6FF" : "transparent",
                      }}
                    >
                      <span style={{ flex: 1 }}>{l.nameLocal}</span>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>{l.name}</span>
                    </Link>
                  ) : (
                    <span
                      role="menuitem"
                      title="Coming soon"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 6,
                        cursor: "not-allowed",
                        color: "#9B9B9B",
                        fontSize: 13,
                      }}
                    >
                      <Lock size={11} aria-hidden="true" />
                      <span style={{ flex: 1 }}>{l.nameLocal}</span>
                      <span
                        style={{
                          background: "#FFFBEB",
                          color: "#A16207",
                          border: "1px solid #FDE68A",
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 999,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Soon
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Theme toggle (LOCKED — dark mode coming soon) ── */}
      {/* Mobile-revert: shown on mobile too (compact 36×36 via .ftp-mobile-compact). */}
      <button
        type="button"
        className="ftp-theme-locked ftp-mobile-compact"
        aria-label="Theme toggle (dark mode coming soon)"
        title="Dark mode coming soon"
        onClick={() => {
          /* no-op — theme is locked in v7 */
        }}
      >
        <span aria-hidden="true">☀️</span>
        <span className="ftp-lock-overlay" aria-hidden="true">🔒</span>
      </button>

      {/* ── Support button — layered red (rose-50/600/200) ── */}
      {/* Session 13 v8 Fix #18: production-pattern layered red, not solid red. */}
      <Link
        href={`/${locale}/support`}
        className="ftp-support-btn"
        aria-label="Support — financial contribution"
      >
        <Heart className="ftp-support-btn-heart" aria-hidden="true" fill="currentColor" />
        <span className="ftp-desktop-only">Support</span>
      </Link>

    </header>
  );
}
