// ── ForThePeople.in — District Dashboard Modules ─────────────
//
// Single source of truth for the district sidebar, the phone/tablet
// "All modules" drawer, the overview tiles and the "See also" links.
// docs/MODULE-MAP.md is the plan this file follows:
//
//   🏠 Start here · 🙋 You can help · 👥 Who runs it · 💰 Money & projects ·
//   🤲 Help for you · 🚰 Daily needs · 🌾 Farming · 📚 Know your district ·
//   🔍 Check our work
//
// Each module names its `group`; the order inside a group is the order of
// this array. `priority` (1 = top) is derived from that order, so adding a
// module is one line in the right place. Routes (slugs) never change.
//
// `label`, `description` and the group `label` are the English fallback
// only. Every language reads them from the `moduleNames`,
// `moduleDescriptions` and `moduleGroups` messages (useModuleText /
// useModuleGroups).

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

// ── Groups ─────────────────────────────────────────────────

/** Message key of a module group (`moduleGroups.<key>`), in sidebar order. */
export type ModuleGroupKey =
  | "start"
  | "help"
  | "whoRuns"
  | "money"
  | "helpForYou"
  | "dailyNeeds"
  | "farming"
  | "know"
  | "checkWork";

export interface ModuleGroup {
  key: ModuleGroupKey;
  /** English fallback; the shown text comes from `moduleGroups.<key>`. */
  label: string;
  emoji: string;
  /** The question the group answers (docs/MODULE-MAP.md). English, for docs and tooling. */
  question: string;
}

export const MODULE_GROUPS: readonly ModuleGroup[] = [
  { key: "start",      label: "Start here",          emoji: "🏠", question: "What is happening in my district today?" },
  { key: "help",       label: "You can help",        emoji: "🙋", question: "What can I do, and who do I call?" },
  { key: "whoRuns",    label: "Who runs it",         emoji: "👥", question: "Who is in charge, and are they doing their job?" },
  { key: "money",      label: "Money & projects",    emoji: "💰", question: "Where does the money go?" },
  { key: "helpForYou", label: "Help for you",        emoji: "🤲", question: "What can I get, and how do I apply?" },
  { key: "dailyNeeds", label: "Daily needs",         emoji: "🚰", question: "Do I have water, power, a bus, a doctor, a school?" },
  { key: "farming",    label: "Farming",             emoji: "🌾", question: "What will my crop fetch, and how do I grow it better?" },
  { key: "know",       label: "Know your district",  emoji: "📚", question: "What is my district like?" },
  { key: "checkWork",  label: "Check our work",      emoji: "🔍", question: "Can I trust this?" },
];

// ── Modules ────────────────────────────────────────────────

export interface SidebarModule {
  slug: string;
  /** English fallback; the shown text comes from `moduleNames.<slug>`. */
  label: string;
  /** One emoji per module, unique across the registry. */
  emoji: string;
  icon: LucideIcon;
  /** English fallback; the shown text comes from `moduleDescriptions.<slug>`. */
  description: string;
  group: ModuleGroupKey;
  /**
   * Modules people mix up with this one (docs/MODULE-MAP.md "Pairs that
   * used to be confusing"). Rendered as "See also" at the end of the page.
   */
  related?: readonly string[];
  /** 1 = top of the sidebar. Derived from the array order below. */
  priority: number;
}

type ModuleEntry = Omit<SidebarModule, "priority">;

// Order = sidebar order. Keep each group's modules together.
const MODULES: readonly ModuleEntry[] = [
  // 🏠 Start here
  { group: "start", slug: "overview",   label: "Overview",          emoji: "📊", icon: LayoutDashboard, description: "Your district on one page" },
  { group: "start", slug: "news",       label: "News",              emoji: "📰", icon: Newspaper,       description: "What the local papers are saying", related: ["alerts"] },
  { group: "start", slug: "alerts",     label: "Alerts & warnings", emoji: "⚠️", icon: AlertTriangle,   description: "Official warnings to act on", related: ["news", "weather"] },
  { group: "start", slug: "weather",    label: "Weather & rain",    emoji: "🌦️", icon: Cloud,           description: "Today's weather and this year's rain" },

  // 🙋 You can help
  { group: "help", slug: "responsibility", label: "What you can do",           emoji: "🌱", icon: Flame,         description: "Small things you can do for your district", related: ["citizen-corner"] },
  { group: "help", slug: "citizen-corner", label: "Helplines & your rights",   emoji: "📞", icon: Handshake,     description: "Numbers to call and rights you have", related: ["responsibility", "file-rti"] },
  { group: "help", slug: "file-rti",       label: "Ask the government (RTI)",  emoji: "📜", icon: FilePen,       description: "Write an RTI request, step by step", related: ["rti"] },
  { group: "help", slug: "rti",            label: "RTI replies tracker",       emoji: "🏛️", icon: ClipboardList, description: "How many RTI requests get answered, and how fast", related: ["file-rti"] },

  // 👥 Who runs it
  { group: "whoRuns", slug: "leadership",     label: "Leaders & officers", emoji: "👥", icon: Users,    description: "Your MP, MLAs, district officers and judges", related: ["elections"] },
  { group: "whoRuns", slug: "elections",      label: "Elections",          emoji: "🗳️", icon: Vote,     description: "Who won, and how many people voted", related: ["leadership"] },
  { group: "whoRuns", slug: "gram-panchayat", label: "Village councils",   emoji: "🏘️", icon: Building, description: "Gram panchayats, their money and MGNREGA work" },
  { group: "whoRuns", slug: "courts",         label: "Courts",             emoji: "⚖️", icon: Scale,    description: "How many cases are waiting, and how fast they close" },
  { group: "whoRuns", slug: "police",         label: "Police & safety",    emoji: "👮", icon: Shield,   description: "Police stations, crime numbers and traffic fines" },

  // 💰 Money & projects
  { group: "money", slug: "finance",        label: "Budget",                   emoji: "💰", icon: PiggyBank, description: "Money given to the district, and how much was spent" },
  { group: "money", slug: "infrastructure", label: "Projects being built",     emoji: "🏗️", icon: HardHat,   description: "Roads, bridges and buildings, and how far along they are" },
  { group: "money", slug: "tenders",        label: "Govt contracts (tenders)", emoji: "📑", icon: Gavel,     description: "Work the government is paying for, and who can bid" },
  { group: "money", slug: "industries",     label: "Local industries",         emoji: "🏭", icon: Factory,   description: "Factories and big employers in the district" },

  // 🤲 Help for you
  { group: "helpForYou", slug: "schemes",  label: "Govt schemes",            emoji: "📋", icon: ScrollText, description: "Schemes you may get, and how to apply", related: ["housing", "services"] },
  { group: "helpForYou", slug: "housing",  label: "Housing schemes",         emoji: "🏠", icon: Home,       description: "Government homes (PMAY): how many are built", related: ["schemes"] },
  { group: "helpForYou", slug: "services", label: "How to get certificates", emoji: "🧾", icon: FileText,   description: "Steps and documents for certificates and land records", related: ["offices", "schemes"] },
  { group: "helpForYou", slug: "offices",  label: "Govt offices near you",   emoji: "🏢", icon: Building2,  description: "Where each office is, and when it is open", related: ["services"] },
  { group: "helpForYou", slug: "exams",    label: "Exams & jobs",            emoji: "📝", icon: BookOpen,   description: "Government exams and jobs you can apply for" },

  // 🚰 Daily needs
  { group: "dailyNeeds", slug: "jjm",       label: "Tap water (JJM)",    emoji: "🚰", icon: Droplets,      description: "How many homes have a tap connection", related: ["water"] },
  { group: "dailyNeeds", slug: "water",     label: "Dams & rivers",      emoji: "🌊", icon: Waves,        description: "How full the dams are, and canal water", related: ["jjm", "weather"] },
  { group: "dailyNeeds", slug: "power",     label: "Power cuts",         emoji: "⚡", icon: Zap,           description: "Planned power cuts and who to call" },
  { group: "dailyNeeds", slug: "transport", label: "Buses & trains",     emoji: "🚌", icon: Bus,           description: "Bus routes, trains and auto fares" },
  { group: "dailyNeeds", slug: "health",    label: "Hospitals & health", emoji: "🏥", icon: Heart,         description: "Hospitals, beds and doctors" },
  { group: "dailyNeeds", slug: "schools",   label: "Schools",            emoji: "🎓", icon: GraduationCap, description: "Schools, exam results and teachers" },

  // 🌾 Farming
  { group: "farming", slug: "crops", label: "Crop prices",         emoji: "🌾", icon: Wheat,   description: "Mandi prices for your crops, with dates", related: ["farm"] },
  { group: "farming", slug: "farm",  label: "Farm & soil advice",  emoji: "🚜", icon: Tractor, description: "Soil health and advice to grow better crops", related: ["crops", "weather"] },

  // 📚 Know your district
  { group: "know", slug: "population",           label: "People (census)", emoji: "📈", icon: BarChart3, description: "How many people live here, and who they are" },
  { group: "know", slug: "map",                  label: "Map",             emoji: "🗺️", icon: Map,       description: "The district, its taluks and villages on a map" },
  { group: "know", slug: "famous-personalities", label: "Famous people",   emoji: "🌟", icon: Star,      description: "Well-known people from this district" },
  { group: "know", slug: "contributors",         label: "Supporters",      emoji: "🤝", icon: Heart,     description: "People who support this district's page" },

  // 🔍 Check our work
  { group: "checkWork", slug: "data-sources", label: "Where our data comes from", emoji: "🔗", icon: Database, description: "Every official source, and when it was last updated" },
  { group: "checkWork", slug: "update-log",   label: "What changed and when",     emoji: "🕒", icon: History,  description: "Every data change, with its date" },
];

export const SIDEBAR_MODULES: SidebarModule[] = MODULES.map((m, i) => ({ ...m, priority: i + 1 }));

const BY_SLUG: Record<string, SidebarModule> = Object.fromEntries(SIDEBAR_MODULES.map((m) => [m.slug, m]));
const GROUP_BY_KEY = Object.fromEntries(MODULE_GROUPS.map((g) => [g.key, g])) as Record<ModuleGroupKey, ModuleGroup>;

/** The registry entry for a slug, or null. */
export function getModule(slug: string | null | undefined): SidebarModule | null {
  return (slug && BY_SLUG[slug]) || null;
}

/** The group a module belongs to, or null for unknown slugs. */
export function getModuleGroup(slug: string | null | undefined): ModuleGroup | null {
  const m = getModule(slug);
  return m ? GROUP_BY_KEY[m.group] : null;
}

/** Related modules ("See also") for a slug, in the order listed. */
export function getRelatedModules(slug: string | null | undefined): SidebarModule[] {
  const m = getModule(slug);
  return (m?.related ?? []).map((s) => BY_SLUG[s]).filter((x): x is SidebarModule => Boolean(x));
}

export type GroupedModules = ModuleGroup & { modules: SidebarModule[] };

/** Modules grouped in MODULE_GROUPS order; empty groups are left out. */
export function getGroupedModules(): GroupedModules[] {
  return MODULE_GROUPS.map((g) => ({ ...g, modules: SIDEBAR_MODULES.filter((m) => m.group === g.key) })).filter(
    (g) => g.modules.length > 0,
  );
}

/** Flat list of module slugs in sidebar order. Used by the collapsed sidebar. */
export function getOrderedSlugs(): string[] {
  return SIDEBAR_MODULES.map((m) => m.slug);
}

// ── Older API, kept so existing callers compile ────────────
//
// `useModuleText().group()/groupOf()` (src/i18n/client.ts), OverviewClient
// and LockedDistrictPreview still speak "tier labels". A tier label is now
// the English label of the module's group. New code uses
// getGroupedModules() / getModuleGroup() and translates `moduleGroups.<key>`.

/** @deprecated English group label. Use ModuleGroupKey. */
export type TierLabel = string;

/** @deprecated English group labels in order. Use MODULE_GROUPS. */
export const TIER_LABELS: readonly TierLabel[] = MODULE_GROUPS.map((g) => g.label);

/** @deprecated English group label of the module at this priority. Use getModuleGroup(slug). */
export function tierFromPriority(priority: number): TierLabel {
  const m = SIDEBAR_MODULES.find((x) => x.priority === priority);
  return (m ? GROUP_BY_KEY[m.group] : MODULE_GROUPS[0]).label;
}

/** @deprecated Groups with `label` = English group label. Use getGroupedModules(). */
export function getTieredModules(): Array<GroupedModules & { label: TierLabel }> {
  return getGroupedModules();
}

/**
 * v3 icon accent per group; PageHeader ignores it in v4 (colours come from
 * the module hue) but ~35 pages still pass `accent={getModuleAccent(slug)}`.
 */
const GROUP_ACCENT: Record<ModuleGroupKey, "purple" | "amber" | "teal" | "slate" | "pink"> = {
  start: "purple",
  help: "purple",
  whoRuns: "slate",
  money: "amber",
  helpForYou: "teal",
  dailyNeeds: "teal",
  farming: "amber",
  know: "pink",
  checkWork: "slate",
};

/** Accent name for a module slug (falls back to purple). */
export function getModuleAccent(slug: string): "purple" | "amber" | "teal" | "slate" | "pink" {
  const m = getModule(slug);
  return m ? GROUP_ACCENT[m.group] : "purple";
}

// The 4 fixed tabs on the phone bottom nav. Bottom-nav priority is different
// from sidebar priority — citizens glance here most frequently.
export const MOBILE_TAB_MODULES = ["overview", "crops", "weather", "news"] as const;
