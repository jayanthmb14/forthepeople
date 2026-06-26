/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Search, Globe, ChevronDown, Menu, Lock, Users, Github, Heart } from "lucide-react";
import { INDIA_STATES, getState, getDistrict, PILOT_STATE, PILOT_DISTRICT } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import MobileSidebar from "./MobileSidebar";

// ── Static search index for modules + common queries ───────
const MODULE_INDEX = [
  { label: "Weather & Rainfall",    path: "weather",          emoji: "🌦️" },
  { label: "Crop Prices",           path: "crops",            emoji: "🌾" },
  { label: "Water & Dams",          path: "water",            emoji: "💧" },
  { label: "Finance & Budget",      path: "finance",          emoji: "💰" },
  { label: "Government Schemes",    path: "schemes",          emoji: "📋" },
  { label: "Schools & Education",   path: "schools",          emoji: "🎓" },
  { label: "Hospitals & Health",    path: "health",           emoji: "🏥" },
  { label: "Elections",             path: "elections",        emoji: "🗳️" },
  { label: "RTI",                   path: "rti",              emoji: "📄" },
  { label: "Police & Crime",        path: "police",           emoji: "🚔" },
  { label: "Housing",               path: "housing",          emoji: "🏠" },
  { label: "MGNREGA / Gram Panchayat", path: "gram-panchayat", emoji: "🏛️" },
  { label: "JJM Water Supply",      path: "jjm",              emoji: "🚿" },
  { label: "Power & Outages",       path: "power",            emoji: "⚡" },
  { label: "Transport & Roads",     path: "transport",        emoji: "🚌" },
  { label: "News & Updates",        path: "news",             emoji: "📰" },
  { label: "Leadership & Officials", path: "leadership",      emoji: "👥" },
  { label: "Local Alerts",          path: "alerts",           emoji: "🚨" },
  { label: "Citizen Corner",        path: "citizen-corner",   emoji: "🤝" },
  { label: "Famous Personalities",  path: "famous-personalities", emoji: "⭐" },
  { label: "Courts & Justice",      path: "courts",           emoji: "⚖️" },
  { label: "Industries",            path: "industries",       emoji: "🏭" },
  { label: "Infrastructure",        path: "infrastructure",   emoji: "🔧" },
  { label: "Soil & Agriculture",    path: "farm",             emoji: "🌱" },
  { label: "Population",            path: "population",       emoji: "👥" },
];

// ── All 22 scheduled languages + English ──────────────────
const LANGUAGES = [
  { code: "en", name: "English",   nameLocal: "English",        active: true },
  { code: "kn", name: "Kannada",   nameLocal: "ಕನ್ನಡ",          active: false },
  { code: "hi", name: "Hindi",     nameLocal: "हिन्दी",           active: false },
  { code: "te", name: "Telugu",    nameLocal: "తెలుగు",          active: false },
  { code: "ta", name: "Tamil",     nameLocal: "தமிழ்",            active: false },
  { code: "ml", name: "Malayalam", nameLocal: "മലയാളം",          active: false },
  { code: "mr", name: "Marathi",   nameLocal: "मराठी",           active: false },
  { code: "bn", name: "Bengali",   nameLocal: "বাংলা",           active: false },
  { code: "gu", name: "Gujarati",  nameLocal: "ગુજરાતી",         active: false },
  { code: "pa", name: "Punjabi",   nameLocal: "ਪੰਜਾਬੀ",         active: false },
  { code: "or", name: "Odia",      nameLocal: "ଓଡ଼ିଆ",           active: false },
  { code: "as", name: "Assamese",  nameLocal: "অসমীয়া",         active: false },
  { code: "ur", name: "Urdu",      nameLocal: "اردو",            active: false },
  { code: "sa", name: "Sanskrit",  nameLocal: "संस्कृतम्",        active: false },
  { code: "ne", name: "Nepali",    nameLocal: "नेपाली",          active: false },
  { code: "sd", name: "Sindhi",    nameLocal: "سنڌي",           active: false },
  { code: "ks", name: "Kashmiri",  nameLocal: "कॉशुर",           active: false },
  { code: "doi", name: "Dogri",    nameLocal: "डोगरी",           active: false },
  { code: "kok", name: "Konkani",  nameLocal: "कोंकणी",          active: false },
  { code: "mni", name: "Manipuri", nameLocal: "মৈতৈলোন্",        active: false },
  { code: "brx", name: "Bodo",     nameLocal: "बड़ो",             active: false },
  { code: "sat", name: "Santali",  nameLocal: "ᱥᱟᱱᱛᱟᱲᱤ",        active: false },
  { code: "mai", name: "Maithili", nameLocal: "मैथिली",          active: false },
];

interface HeaderProps {
  locale: string;
}

// Parse route: /en/karnataka/mandya/srirangapatna → { state, district, taluk }
function parsePath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return {
    locale: parts[0] ?? "en",
    state: parts[1],
    district: parts[2],
    taluk: parts[3],
  };
}

export default function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state: stateSlug, district: districtSlug, taluk: talukSlug } = parsePath(pathname);

  const stateData = stateSlug ? getState(stateSlug) : undefined;
  const districtData = stateSlug && districtSlug ? getDistrict(stateSlug, districtSlug) : undefined;
  const talukData = districtData?.taluks.find((t) => t.slug === talukSlug);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K opens search overlay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Search results — districts + modules
  const q = searchQuery.toLowerCase();
  const districtResults = searchQuery.length >= 2
    ? INDIA_STATES.flatMap((s) =>
        s.active
          ? s.districts
              .filter((d) =>
                d.name.toLowerCase().includes(q) || d.nameLocal.includes(searchQuery)
              )
              .map((d) => ({ type: "district" as const, state: s, district: d, label: d.name, sub: s.name }))
          : []
      ).slice(0, 5)
    : [];

  const moduleResults = searchQuery.length >= 2
    ? MODULE_INDEX.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 4).map((m) => ({
        type: "module" as const,
        ...m,
        href: districtData
          ? `/${locale}/${stateSlug}/${districtSlug}/${m.path}`
          : `/${locale}/${PILOT_STATE}/${PILOT_DISTRICT}/${m.path}`,
      }))
    : [];

  const searchResults = [...districtResults, ...moduleResults];

  return (
    <>
    <header
      className="ftp-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#FFFFFF",
        borderBottom: "1px solid #E8E8E4",
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
      }}
    >
      {/* Left hamburger — mobile only, shows when on a district page */}
      {stateSlug && districtSlug && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="flex md:hidden items-center justify-center"
          style={{
            minWidth: 44,
            minHeight: 44,
            width: 44,
            height: 44,
            border: "none",
            borderRadius: 8,
            background: "transparent",
            cursor: "pointer",
            color: "#1A1A1A",
            flexShrink: 0,
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Logo */}
      <Link
        href={`/${locale}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(37,99,235,0.25)", flexShrink: 0 }}>
          <Users size={16} style={{ color: "white" }} strokeWidth={2.5} />
        </div>
        <span
          style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A", letterSpacing: "-0.3px" }}
          className="hidden sm:block"
        >
          ForThePeople<span style={{ color: "#2563EB" }}>.in</span>
        </span>
        <span
          style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A", letterSpacing: "-0.2px" }}
          className="sm:hidden"
        >
          FTP.in
        </span>
      </Link>

      {/* Breadcrumb — desktop only */}
      <nav
        style={{ alignItems: "center", gap: 4, flex: 1, minWidth: 0, overflow: "visible" }}
        className="hidden md:flex"
      >
        <BreadcrumbItem label="India" href={`/${locale}`} active={!stateSlug} isFirst />

        <BreadcrumbSep />
        <StateDropdown locale={locale} currentState={stateData} />

        {stateData && (
          <>
            <BreadcrumbSep />
            <DistrictDropdown locale={locale} state={stateData} currentDistrict={districtData} />
          </>
        )}

        {districtData && districtData.taluks.length > 0 && (
          <>
            <BreadcrumbSep />
            <TalukDropdown locale={locale} stateSlug={stateSlug!} district={districtData} currentTaluk={talukData} />
          </>
        )}
      </nav>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        {/* Search button */}
        <button
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Open search (Cmd+K)"
          aria-keyshortcuts="Meta+k Control+k"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            border: "1px solid #E8E8E4",
            borderRadius: 8,
            background: "#FAFAF8",
            color: "#6B6B6B",
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Search size={14} aria-hidden="true" />
          <span className="hidden sm:block">Search</span>
          <span className="hidden md:block" style={{ fontSize: 11, color: "#9B9B9B", background: "#F0F0EC", border: "1px solid #E8E8E4", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-mono)" }}>⌘K</span>
        </button>

        {/* Search overlay */}
        {searchOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 98 }}
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-label="Search"
              aria-modal="true"
              style={{
                position: "fixed",
                top: "72px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(560px, 96vw)",
                background: "#fff",
                border: "1px solid #E8E8E4",
                borderRadius: 14,
                boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                zIndex: 99,
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #E8E8E4" }}>
                <Search size={16} style={{ color: "#9B9B9B", flexShrink: 0 }} aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search districts, modules, data..."
                  aria-label="Search"
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#1A1A1A", background: "transparent" }}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9B9B9B", fontSize: 12, flexShrink: 0 }}
                  aria-label="Close search"
                >
                  ESC
                </button>
              </div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {searchResults.length > 0 ? (
                  <>
                    {districtResults.length > 0 && (
                      <>
                        <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Districts</div>
                        {districtResults.map(({ state, district }) => (
                          <button
                            key={district.slug}
                            onClick={() => { router.push(`/${locale}/${state.slug}/${district.slug}`); setSearchOpen(false); setSearchQuery(""); }}
                            style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", gap: 10 }}
                          >
                            <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
                            <span style={{ fontSize: 14, color: "#1A1A1A", flex: 1 }}>{district.name}</span>
                            <span style={{ fontSize: 12, color: "#9B9B9B" }}>{state.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {moduleResults.length > 0 && (
                      <>
                        <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B" }}>Modules</div>
                        {moduleResults.map((m) => (
                          <button
                            key={m.path}
                            onClick={() => { router.push(m.href); setSearchOpen(false); setSearchQuery(""); }}
                            style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", gap: 10 }}
                          >
                            <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">{m.emoji}</span>
                            <span style={{ fontSize: 14, color: "#1A1A1A" }}>{m.label}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                ) : searchQuery.length >= 2 ? (
                  <p style={{ padding: "20px 16px", fontSize: 14, color: "#9B9B9B", textAlign: "center" }}>No results for &ldquo;{searchQuery}&rdquo;</p>
                ) : (
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9B9B9B", marginBottom: 8 }}>Quick Links</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {MODULE_INDEX.slice(0, 8).map((m) => (
                        <button
                          key={m.path}
                          onClick={() => {
                            const href = districtData
                              ? `/${locale}/${stateSlug}/${districtSlug}/${m.path}`
                              : `/${locale}/${PILOT_STATE}/${PILOT_DISTRICT}/${m.path}`;
                            router.push(href);
                            setSearchOpen(false);
                          }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#F5F5F0", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 12, color: "#6B6B6B", cursor: "pointer" }}
                        >
                          <span aria-hidden="true">{m.emoji}</span> {m.label}
                        </button>
                      ))}
                    </div>
                    <p style={{ marginTop: 12, fontSize: 12, color: "#9B9B9B" }}>
                      Type to search 780+ districts and 25 data modules
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* GitHub link — visible on every viewport; flex-shrinks to stay in row */}
        <a
          href="https://github.com/jayanthmb14/forthepeople"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid #E8E8E4",
            background: "#FAFAF8",
            color: "#4B4B4B",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Github size={16} />
        </a>

        {/* Theme toggle (disabled — Phase 6+ ships the toggle wiring) */}
        <button
          type="button"
          disabled
          aria-label="Toggle dark mode (coming soon)"
          title="Dark mode coming soon"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid #E8E8E4",
            background: "#FAFAF8",
            color: "#9B9B9B",
            cursor: "not-allowed",
            opacity: 0.6,
            flexShrink: 0,
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          <span aria-hidden>🌙</span>
        </button>

        {/* Support — heart CTA */}
        <Link
          href={`/${locale}/support`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            background: "#FFF1F2",
            color: "#E11D48",
            border: "1px solid #FECDD3",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFE4E6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; }}
        >
          <Heart size={14} fill="#E11D48" />
          <span className="hidden sm:inline">Support</span>
        </Link>

        {/* Vote on Features — eye-catching CTA */}
        <Link
          href="/en/features"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "#FFF",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(124,58,237,0.3)",
            letterSpacing: "0.01em",
          }}
        >
          <span aria-hidden="true">🗳️</span>
          <span className="hidden sm:inline">Vote on Features</span>
          <span className="sm:hidden">Vote</span>
        </Link>

        {/* Language selector — all 22 languages */}
        <LanguageSelector locale={locale} pathname={pathname} />

      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
      />
    </header>

    {/* Mobile breadcrumb strip — sticky below header, visible on mobile only */}
    {stateSlug && (
      <nav
        className="flex md:hidden ftp-mobile-breadcrumb"
        aria-label="Location breadcrumb"
        style={{
          position: "sticky",
          top: 56,
          zIndex: 49,
          background: "#FAFAF8",
          borderBottom: "1px solid #F0F0EC",
          alignItems: "center",
          gap: 4,
          padding: "0 12px",
          height: 36,
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        <Link href={`/${locale}`} style={{ fontSize: 12, color: "#6B6B6B", whiteSpace: "nowrap", flexShrink: 0, padding: "0 2px" }}>
          🇮🇳
        </Link>
        <ChevronDown size={10} style={{ color: "#9B9B9B", transform: "rotate(-90deg)", flexShrink: 0 }} />
        <StateDropdown locale={locale} currentState={stateData} />
        {stateData && (
          <>
            <ChevronDown size={10} style={{ color: "#9B9B9B", transform: "rotate(-90deg)", flexShrink: 0 }} />
            <DistrictDropdown locale={locale} state={stateData} currentDistrict={districtData} />
          </>
        )}
        {districtData && districtData.taluks.length > 0 && (
          <>
            <ChevronDown size={10} style={{ color: "#9B9B9B", transform: "rotate(-90deg)", flexShrink: 0 }} />
            <TalukDropdown locale={locale} stateSlug={stateSlug!} district={districtData} currentTaluk={talukData} />
          </>
        )}
      </nav>
    )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────

function BreadcrumbItem({ label, href, active, isFirst }: {
  label: string; href: string; active?: boolean; isFirst?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "#1A1A1A" : "#6B6B6B",
        textDecoration: "none",
        whiteSpace: "nowrap",
        padding: "2px 4px",
        borderRadius: 4,
      }}
    >
      {isFirst ? "🇮🇳 India" : label}
    </Link>
  );
}

function BreadcrumbSep() {
  return (
    <ChevronDown
      size={12}
      style={{ color: "#9B9B9B", transform: "rotate(-90deg)", flexShrink: 0 }}
    />
  );
}

function StateDropdown({ locale, currentState }: {
  locale: string;
  currentState: ReturnType<typeof getState>;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = currentState ? currentState.name : "Select State";
  const filtered = INDIA_STATES.filter((s) =>
    !filter || s.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setFilter("");
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: 13,
          color: currentState ? "#1A1A1A" : "#6B6B6B",
          border: "none",
          background: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 4px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {currentState && <span style={{ width: 7, height: 7, borderRadius: "50%", background: currentState.active ? "#16A34A" : "#9B9B9B", flexShrink: 0 }} />}
        {label}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 59 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 240,
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 60,
              overflow: "hidden",
            }}
          >
            {/* Search */}
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #F0F0EC" }}>
              <input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search state…"
                style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, outline: "none", background: "#FAFAF8" }}
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {filtered.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => {
                    router.push(`/${locale}/${s.slug}`); setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 12px",
                    minHeight: 44,
                    border: "none",
                    background: s.slug === currentState?.slug ? "#EFF6FF" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    color: s.active ? "#1A1A1A" : "#9B9B9B",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.active ? "#16A34A" : "#D0D0CC", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  {!s.active && <Lock size={11} style={{ color: "#C0C0BA", flexShrink: 0 }} />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "12px 16px", fontSize: 12, color: "#9B9B9B" }}>No states found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DistrictDropdown({ locale, state, currentDistrict }: {
  locale: string;
  state: NonNullable<ReturnType<typeof getState>>;
  currentDistrict: ReturnType<typeof getDistrict>;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const label = currentDistrict ? currentDistrict.name : "Select District";
  const filtered = state.districts.filter((d) =>
    !filter || d.name.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setFilter("");
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: 13,
          color: currentDistrict ? "#1A1A1A" : "#6B6B6B",
          border: "none",
          background: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 4px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {currentDistrict && <span style={{ width: 7, height: 7, borderRadius: "50%", background: currentDistrict.active ? "#16A34A" : "#9B9B9B", flexShrink: 0 }} />}
        {label}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 59 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 240,
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 60,
              overflow: "hidden",
            }}
          >
            {/* Search + count */}
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #F0F0EC" }}>
              <input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search district…"
                style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E8E4", borderRadius: 6, fontSize: 12, outline: "none", background: "#FAFAF8" }}
              />
              <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 4, paddingLeft: 2 }}>
                {state.districts.length} districts · {state.districts.filter(d => d.active).length} active
              </div>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {filtered.map((d) => (
                <button
                  key={d.slug}
                  onClick={() => {
                    router.push(`/${locale}/${state.slug}/${d.slug}`); setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 12px",
                    minHeight: 44,
                    border: "none",
                    background: d.slug === currentDistrict?.slug ? "#EFF6FF" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    color: d.active ? "#1A1A1A" : "#9B9B9B",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.active ? "#16A34A" : "#D0D0CC", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  {!d.active && <Lock size={11} style={{ color: "#C0C0BA", flexShrink: 0 }} />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: "12px 16px", fontSize: 12, color: "#9B9B9B" }}>No districts found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TalukDropdown({ locale, stateSlug, district, currentTaluk }: {
  locale: string;
  stateSlug: string;
  district: NonNullable<ReturnType<typeof getDistrict>>;
  currentTaluk: NonNullable<ReturnType<typeof getDistrict>>["taluks"][number] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const sc = getStateConfig(stateSlug);
  const label = currentTaluk ? currentTaluk.name : `Select ${sc?.subDistrictUnit ?? "Taluk"}`;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          fontSize: 13,
          color: currentTaluk ? "#1A1A1A" : "#6B6B6B",
          border: "none",
          background: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 4px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {currentTaluk && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />}
        {label}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 59 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 220,
              maxHeight: 320,
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 60,
            }}
          >
            {district.taluks.map((t) => (
              <button
                key={t.slug}
                onClick={() => { router.push(`/${locale}/${stateSlug}/${district.slug}/${t.slug}`); setOpen(false); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                  padding: "10px 12px",
                  minHeight: 44,
                  border: "none",
                  background: t.slug === currentTaluk?.slug ? "#EFF6FF" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#1A1A1A",
                }}
              >
                <span>{t.name} <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: 4 }}>{t.nameLocal}</span></span>
                {t.tagline && <span style={{ fontSize: 10, color: "#9B9B9B", marginTop: 1 }}>{t.tagline}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LanguageSelector({ locale, pathname }: { locale: string; pathname: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  function handleSelect(code: string) {
    router.push(pathname.replace(`/${locale}`, `/${code}`));
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Select language"
        aria-label="Select language"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 10px",
          border: "1px solid #E8E8E4",
          borderRadius: 8,
          background: "#FAFAF8",
          color: "#6B6B6B",
          fontSize: 12,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        <Globe size={13} aria-hidden="true" />
        <span className="hidden sm:inline">{currentLang.code === "en" ? "EN" : currentLang.nameLocal}</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 59 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              width: 260,
              maxHeight: 360,
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 60,
              padding: "6px 0",
            }}
          >
            <div style={{ padding: "6px 12px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B9B9B" }}>
              Select Language
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { if (lang.active) handleSelect(lang.code); }}
                title={lang.active ? undefined : "Coming soon"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "7px 12px",
                  border: "none",
                  background: lang.code === locale ? "#EFF6FF" : "none",
                  cursor: lang.active ? "pointer" : "default",
                  textAlign: "left",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {lang.active
                    ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", flexShrink: 0 }} />
                    : <Lock size={10} style={{ color: "#C0C0BA", flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 14, color: lang.active ? "#1A1A1A" : "#9B9B9B", fontFamily: lang.code === "en" ? "inherit" : "var(--font-regional, system-ui)" }}>
                    {lang.nameLocal}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#9B9B9B" }}>
                  {lang.active ? lang.name : "Soon"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
