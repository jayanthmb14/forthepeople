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
  /**
   * v5: how old this module's main dataset may get before the page says so
   * (StaleDataNotice), how often its source publishes, and how the data
   * reaches us (VerifyPanel). Undefined for pages that show no dataset of
   * their own (overview, supporters, data sources, update log).
   */
  freshness?: FreshnessRule;
}

// ── Freshness rules (v5) ───────────────────────────────────
//
// One rule per module for its MAIN dataset. /api/data/freshness compares the
// newest date it finds in the database with `maxAgeHours`; when the data is
// older, the page shows a calm amber notice with the age in days and "we
// could not find newer data" (StaleDataNotice), and the verification panel
// at the bottom marks it "Late". Thresholds follow how often the SOURCE
// publishes, with some slack — not how often we would like it to.

/** How often the source publishes new data (VerifyPanel "Should update"). */
export type UpdateEvery =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "election"
  | "census"
  | "onChange";

/**
 * How the data reaches ForThePeople.in (VerifyPanel "How we get it"):
 *   auto      — an automatic feed from the source (weather, mandi, dams, news)
 *   manual    — entered by hand from a named document or portal
 *   news      — picked from news reports
 *   reference — written by our team (guides, templates, maps); no data date
 */
export type CollectMethod = "auto" | "manual" | "news" | "reference";

export interface FreshnessRule {
  /** Older than this = "late". null = reference content that never goes stale. */
  maxAgeHours: number | null;
  every: UpdateEvery;
  method: CollectMethod;
  /** An official portal where a visitor can check the figures themselves. */
  portal?: string;
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

const HOUR = 1;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

/**
 * Expected maximum age per module (main dataset). Periods are measured from
 * the START of a financial year (budget, housing) and from the END of a
 * calendar year (yearly statistics, the census), so "FY 2026-27" is current
 * until May 2027 and "2024 crime statistics" until the end of 2026.
 */
export const MODULE_FRESHNESS: Readonly<Record<string, FreshnessRule>> = {
  news:                   { maxAgeHours: 24 * HOUR, every: "daily",    method: "auto" },
  alerts:                 { maxAgeHours: 24 * HOUR, every: "onChange", method: "auto",      portal: "https://sachet.ndma.gov.in" },
  weather:                { maxAgeHours: 6 * HOUR,  every: "hourly",   method: "auto",      portal: "https://mausam.imd.gov.in" },
  // Written guidance; the news part of the page carries its own dates.
  responsibility:         { maxAgeHours: null,      every: "onChange", method: "reference" },
  "citizen-corner":       { maxAgeHours: null,      every: "onChange", method: "reference" },
  "file-rti":             { maxAgeHours: null,      every: "onChange", method: "reference", portal: "https://rtionline.gov.in" },
  rti:                    { maxAgeHours: 2 * YEAR,  every: "yearly",   method: "manual" },
  leadership:             { maxAgeHours: 90 * DAY,  every: "onChange", method: "manual" },
  elections:              { maxAgeHours: 6 * YEAR,  every: "election", method: "manual",    portal: "https://results.eci.gov.in" },
  // District MGNREGA figures, read daily by /api/cron/scrape-mgnrega (PORTAL_COLLECTORS).
  "gram-panchayat":       { maxAgeHours: 3 * DAY,   every: "daily",    method: "auto",      portal: "https://nrega.dord.gov.in/MGNREGA_new/Nrega_home.aspx" },
  // Read from NJDG twice a day by /api/cron/scrape-courts (each district at least daily).
  courts:                 { maxAgeHours: 3 * DAY,   every: "daily",    method: "auto",      portal: "https://njdg.ecourts.gov.in/njdg_v3/" },
  police:                 { maxAgeHours: 2 * YEAR,  every: "yearly",   method: "manual",    portal: "https://ncrb.gov.in" },
  finance:                { maxAgeHours: 400 * DAY, every: "yearly",   method: "manual" },
  infrastructure:         { maxAgeHours: 90 * DAY,  every: "monthly",  method: "news" },
  tenders:                { maxAgeHours: 7 * DAY,   every: "daily",    method: "auto",      portal: "https://eprocure.gov.in/cppp/" },
  industries:             { maxAgeHours: YEAR,      every: "yearly",   method: "manual" },
  schemes:                { maxAgeHours: 180 * DAY, every: "onChange", method: "manual",    portal: "https://www.myscheme.gov.in" },
  housing:                { maxAgeHours: 400 * DAY, every: "monthly",  method: "manual",    portal: "https://pmayg.nic.in" },
  services:               { maxAgeHours: YEAR,      every: "onChange", method: "manual" },
  offices:                { maxAgeHours: YEAR,      every: "onChange", method: "manual" },
  exams:                  { maxAgeHours: 14 * DAY,  every: "daily",    method: "auto" },
  // District total, read daily by /api/cron/scrape-jjm (PORTAL_COLLECTORS).
  jjm:                    { maxAgeHours: 3 * DAY,   every: "daily",    method: "auto",      portal: "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx" },
  water:                  { maxAgeHours: 3 * DAY,   every: "daily",    method: "auto" },
  power:                  { maxAgeHours: 7 * DAY,   every: "onChange", method: "auto" },
  transport:              { maxAgeHours: YEAR,      every: "onChange", method: "manual" },
  health:                 { maxAgeHours: YEAR,      every: "monthly",  method: "manual" },
  // UDISE+ district totals, read weekly by /api/cron/scrape-schools (PORTAL_COLLECTORS).
  schools:                { maxAgeHours: 15 * DAY,  every: "weekly",   method: "auto",      portal: "https://dashboard.udiseplus.gov.in/" },
  crops:                  { maxAgeHours: 7 * DAY,   every: "daily",    method: "auto",      portal: "https://agmarknet.gov.in" },
  farm:                   { maxAgeHours: 30 * DAY,  every: "weekly",   method: "manual",    portal: "https://soilhealth.dac.gov.in" },
  population:             { maxAgeHours: 20 * YEAR, every: "census",   method: "manual",    portal: "https://censusindia.gov.in" },
  map:                    { maxAgeHours: null,      every: "onChange", method: "reference" },
  "famous-personalities": { maxAgeHours: null,      every: "onChange", method: "reference" },
};

export const SIDEBAR_MODULES: SidebarModule[] = MODULES.map((m, i) => ({
  ...m,
  priority: i + 1,
  freshness: MODULE_FRESHNESS[m.slug],
}));

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

/** The freshness rule of a module's main dataset, or null (meta pages, unknown slugs). */
export function getFreshnessRule(slug: string | null | undefined): FreshnessRule | null {
  return (slug && MODULE_FRESHNESS[slug]) || null;
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
