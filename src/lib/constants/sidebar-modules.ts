// ── ForThePeople.in — District Dashboard Modules ─────────────
//
// Single source of truth for sidebar + mobile nav. Each module has a
// civic-priority number (1 = top). Ordering is deterministic — nav
// components render SIDEBAR_MODULES sorted by priority, grouped into
// the five v3 groups via `tierFromPriority()` (CONCEPT-v3 §5):
//
//   Civic duty · Money & resources · Daily services · Accountability ·
//   Community & people
//
// Priority slot 30 is intentionally vacant — reserved for "Compare
// Districts" which is a standalone header link, not a module.
//
// The `emoji` field is kept for the mobile drawers that still read it.
// The desktop Sidebar renders the Lucide `icon` only.

import {
  LayoutDashboard, Map, Users, Waves, Factory,
  PiggyBank, Wheat, BarChart3, Cloud, Shield,
  ScrollText, FileText, Vote, Bus, Droplets,
  Home, Zap, GraduationCap, Tractor,
  ClipboardList, FilePen, Building, Scale, Heart,
  AlertTriangle, Building2, Handshake, Newspaper,
  Database, Flame, Star, BookOpen, History, HardHat, Gavel,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarModule {
  slug: string;
  label: string;
  emoji: string;
  icon: LucideIcon;
  description: string;
  /** 1 = top of sidebar, 37 = bottom. Gaps allowed. */
  priority: number;
}

export const SIDEBAR_MODULES: SidebarModule[] = [
  // ── Civic duty (1–5) ───────────────────────────────────────
  { slug: "responsibility",   label: "My Responsibility",   emoji: "🌱", icon: Flame,            description: "What YOU can do to improve your district", priority: 1 },
  { slug: "overview",         label: "Overview",            emoji: "📊", icon: LayoutDashboard,  description: "District summary, stats, weather", priority: 2 },
  { slug: "leadership",       label: "Leadership",          emoji: "👥", icon: Users,            description: "MP, MLAs, DC, SP, judges", priority: 3 },
  { slug: "elections",        label: "Elections",           emoji: "📊", icon: Vote,             description: "Results, turnout, booth finder", priority: 4 },
  { slug: "citizen-corner",   label: "Citizen Corner",      emoji: "🤝", icon: Handshake,        description: "Responsibility tips, helplines", priority: 5 },

  // ── Money & resources (6–14) ───────────────────────────────
  { slug: "finance",          label: "Finance & Budget",    emoji: "💰", icon: PiggyBank,        description: "Budget breakdown, lapsed funds tracker", priority: 6 },
  { slug: "infrastructure",   label: "Infrastructure",      emoji: "🏗️", icon: HardHat,          description: "News-driven project tracker with timelines", priority: 7 },
  { slug: "tenders",          label: "Govt. Tenders",       emoji: "📑", icon: Gavel,            description: "Live tender tracker, red-flag indicators, apply guide", priority: 8 },
  { slug: "industries",       label: "Local Industries",    emoji: "🏭", icon: Factory,          description: "Sugar factories, arrears tracker", priority: 9 },
  { slug: "schemes",          label: "Gov. Schemes",        emoji: "📋", icon: ScrollText,       description: "Active schemes, eligibility, apply links", priority: 10 },
  { slug: "crops",            label: "Crop Prices",         emoji: "🌾", icon: Wheat,            description: "Live mandi prices from AGMARKNET", priority: 11 },
  { slug: "farm",             label: "Farm Advisory",       emoji: "🌾", icon: Tractor,          description: "Soil health, KVK crop advisory", priority: 12 },
  { slug: "water",            label: "Water & Dams",        emoji: "🚰", icon: Waves,            description: "Live dam levels, canal schedules", priority: 13 },
  { slug: "gram-panchayat",   label: "Gram Panchayat",      emoji: "🏘️", icon: Building,         description: "Village data, MGNREGA, funds", priority: 14 },

  // ── Daily services (15–24) ─────────────────────────────────
  { slug: "jjm",              label: "Water Supply (JJM)",  emoji: "💧", icon: Droplets,         description: "Jal Jeevan Mission tap connections", priority: 15 },
  { slug: "power",            label: "Power & Outages",     emoji: "⚡", icon: Zap,              description: "Scheduled cuts, DISCOM tracker", priority: 16 },
  { slug: "transport",        label: "Transport",           emoji: "🚌", icon: Bus,              description: "Bus routes, trains, auto fares", priority: 17 },
  { slug: "health",           label: "Health",              emoji: "🏥", icon: Heart,            description: "Hospitals, bed count, doctor ratio", priority: 18 },
  { slug: "schools",          label: "Schools",             emoji: "🎓", icon: GraduationCap,    description: "Board results, school directory", priority: 19 },
  { slug: "housing",          label: "Housing Schemes",     emoji: "🏠", icon: Home,             description: "PMAY tracker, completion rates", priority: 20 },
  { slug: "services",         label: "Services Guide",      emoji: "📋", icon: FileText,         description: "How to get certificates, land records", priority: 21 },
  { slug: "offices",          label: "Offices & Services",  emoji: "🏢", icon: Building2,        description: "Govt offices, hours, open now", priority: 22 },
  { slug: "weather",          label: "Weather & Rainfall",  emoji: "🌦️", icon: Cloud,            description: "Live weather, monsoon tracking", priority: 23 },
  { slug: "alerts",           label: "Local Alerts",        emoji: "⚠️", icon: AlertTriangle,    description: "Advisories and warnings for the district", priority: 24 },

  // ── Accountability (25–31; slot 30 reserved) ───────────────
  { slug: "police",           label: "Police & Traffic",    emoji: "👮", icon: Shield,           description: "Stations, traffic revenue, crime stats", priority: 25 },
  { slug: "courts",           label: "Courts",              emoji: "⚖️", icon: Scale,            description: "Case pendency, disposal rates", priority: 26 },
  { slug: "file-rti",         label: "File RTI",            emoji: "📜", icon: FilePen,          description: "Guided RTI wizard with templates", priority: 27 },
  { slug: "rti",              label: "RTI Tracker",         emoji: "🏛️", icon: ClipboardList,    description: "Filing trends, response times", priority: 28 },
  { slug: "data-sources",     label: "Data Sources",        emoji: "🔗", icon: Database,         description: "All official sources + data refresh status", priority: 29 },
  { slug: "update-log",       label: "Update Log",          emoji: "🕒", icon: History,          description: "Every data change, with its date", priority: 31 },

  // ── Community & people (32–37) ─────────────────────────────
  { slug: "news",             label: "News & Updates",      emoji: "📰", icon: Newspaper,        description: "Local news aggregated from RSS", priority: 32 },
  { slug: "exams",            label: "Exams & Jobs",        emoji: "📝", icon: BookOpen,         description: "Govt. exam notifications, eligibility, staffing data", priority: 33 },
  { slug: "contributors",     label: "Contributors",        emoji: "🤝", icon: Heart,            description: "People who support this district's data", priority: 34 },
  { slug: "famous-personalities", label: "Famous People",   emoji: "🌟", icon: Star,             description: "Notable people from this district", priority: 35 },
  { slug: "population",       label: "Population",          emoji: "📈", icon: BarChart3,        description: "Census trends, literacy, sex ratio", priority: 36 },
  { slug: "map",              label: "Interactive Map",     emoji: "🗺️", icon: Map,              description: "Drill-down map: state → district → taluk", priority: 37 },
];

export const TIER_LABELS = [
  "Civic duty",
  "Money & resources",
  "Daily services",
  "Accountability",
  "Community & people",
] as const;

export type TierLabel = (typeof TIER_LABELS)[number];

// Human-readable group label for a priority number. Used to render section
// headings in the sidebar and the mobile drawers. Keep boundaries in sync
// with the priority blocks above — any reassignment also shifts the group.
export function tierFromPriority(priority: number): TierLabel {
  if (priority <= 5) return "Civic duty";
  if (priority <= 14) return "Money & resources";
  if (priority <= 24) return "Daily services";
  if (priority <= 31) return "Accountability";
  return "Community & people";
}

/**
 * Icon accent per group (CONCEPT-v3 §3). Values are names of the
 * `--accent-<name>-700` ramps on :root and match the kit's ModuleAccent.
 * civic → purple · money → amber · services → teal · accountability → slate ·
 * community → pink. ("data → blue" is reserved for the India dashboard.)
 */
export const TIER_ACCENT: Record<TierLabel, "purple" | "amber" | "teal" | "slate" | "pink"> = {
  "Civic duty": "purple",
  "Money & resources": "amber",
  "Daily services": "teal",
  "Accountability": "slate",
  "Community & people": "pink",
};

/** Accent name for a module slug (falls back to the civic purple). */
export function getModuleAccent(slug: string): "purple" | "amber" | "teal" | "slate" | "pink" {
  const mod = SIDEBAR_MODULES.find((m) => m.slug === slug);
  return mod ? TIER_ACCENT[tierFromPriority(mod.priority)] : "purple";
}

/** Modules grouped by tier label, each group already sorted by priority. */
export function getTieredModules(): Array<{ label: TierLabel; modules: SidebarModule[] }> {
  // Plain Record instead of global Map — 'Map' is shadowed by the
  // lucide-react icon import at the top of this file.
  const sorted = [...SIDEBAR_MODULES].sort((a, b) => a.priority - b.priority);
  const byTier: Partial<Record<TierLabel, SidebarModule[]>> = {};
  for (const m of sorted) {
    const t = tierFromPriority(m.priority);
    (byTier[t] ??= []).push(m);
  }
  // Preserve the canonical tier order even if a tier is empty.
  return TIER_LABELS.filter((t) => byTier[t] !== undefined).map((label) => ({ label, modules: byTier[label]! }));
}

/** Flat list of module slugs in priority order. Used by collapsed sidebars. */
export function getOrderedSlugs(): string[] {
  return [...SIDEBAR_MODULES].sort((a, b) => a.priority - b.priority).map((m) => m.slug);
}

// The 4 fixed tabs on mobile bottom-nav. Bottom-nav priority is different
// from sidebar priority — citizens glance here most frequently.
export const MOBILE_TAB_MODULES = ["overview", "crops", "weather", "news"] as const;
