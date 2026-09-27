/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — shared helpers (status + category normalisation, formatting, predicates).
 * Extracted from infrastructure/page.tsx. Design v3: statuses map to kit
 * Pill tones; no hex colours.
 */

import { createElement } from "react";
import type { ComponentType } from "react";
import type { Tone } from "@/components/district/ui";
import {
  HardHat,
  Route, Train, TramFront, Landmark, Droplets, Waves, Building2, Zap, Heart,
  GraduationCap, Trophy, Plane, Anchor, TreePine, TrafficCone, Leaf, Factory,
} from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";

// ═══════════════════════════════════════════════════════════
// Status config — case-insensitive via normalizeStatus
// ═══════════════════════════════════════════════════════════

export type LucideCmp = ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;

export function normalizeStatus(s: string | null | undefined): string {
  if (!s) return "PROPOSED";
  const cleaned = s.trim().toUpperCase().replace(/[\s-]+/g, "_");
  // Map legacy variants to the canonical lifecycle enum
  const MAP: Record<string, string> = {
    PLANNED: "PROPOSED", PROPOSED: "PROPOSED", ANNOUNCED: "PROPOSED",
    APPROVED: "APPROVED", SANCTIONED: "APPROVED",
    TENDERED: "TENDER_ISSUED", TENDER_ISSUED: "TENDER_ISSUED",
    ONGOING: "UNDER_CONSTRUCTION", IN_PROGRESS: "UNDER_CONSTRUCTION",
    UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION", ACTIVE: "UNDER_CONSTRUCTION",
    ON_TRACK: "ON_TRACK",
    DELAYED: "DELAYED", STALLED: "STALLED",
    COMPLETED: "COMPLETED", INAUGURATED: "COMPLETED", COMPLETE: "COMPLETED",
    CANCELLED: "CANCELLED", CANCELED: "CANCELLED", SCRAPPED: "CANCELLED", SHELVED: "CANCELLED",
  };
  return MAP[cleaned] ?? cleaned;
}

// Each status maps to a kit Pill tone (colours live in the --ftp-* tokens,
// never as hex here) and a message key: the label a reader sees is
// page_infrastructure.status.<key>, in their language.
export const STATUS_STYLE: Record<string, { tone: Tone; key: string }> = {
  PROPOSED:           { tone: "neutral",  key: "proposed" },
  APPROVED:           { tone: "brand",    key: "approved" },
  TENDER_ISSUED:      { tone: "features", key: "tenderIssued" },
  UNDER_CONSTRUCTION: { tone: "warn",     key: "underConstruction" },
  ON_TRACK:           { tone: "live",     key: "onTrack" },
  DELAYED:            { tone: "danger",   key: "delayed" },
  STALLED:            { tone: "danger",   key: "stalled" },
  COMPLETED:          { tone: "live",     key: "completed" },
  CANCELLED:          { tone: "neutral",  key: "cancelled" },
};

/** Solid token colour for a tone — used for 6–8 px timeline dots. */
export const TONE_SOLID: Record<Tone, string> = {
  brand: "var(--ftp-brand)",
  live: "var(--ftp-live)",
  warn: "var(--ftp-warn)",
  danger: "var(--ftp-danger)",
  features: "var(--ftp-features)",
  support: "var(--ftp-support)",
  neutral: "var(--ftp-border-strong)",
};

/** Tone for a timeline update type (budget → warn, delay → danger, …). */
export function updateTone(updateType: string): Tone {
  if (updateType.startsWith("BUDGET")) return "warn";
  if (updateType === "DELAY" || updateType === "STALL" || updateType === "CANCELLATION") return "danger";
  if (updateType === "COMPLETION" || updateType === "PHASE_COMPLETE" || updateType === "INAUGURATION") return "live";
  if (updateType === "CONTROVERSY") return "warn";
  if (updateType === "ADMIN_EDIT") return "features";
  return "brand";
}

export function statusStyle(raw: string | null | undefined) {
  const s = normalizeStatus(raw);
  return STATUS_STYLE[s] ?? STATUS_STYLE.PROPOSED;
}

// ═══════════════════════════════════════════════════════════
// Category normalization + icons
// ═══════════════════════════════════════════════════════════

export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const s = raw.trim().toLowerCase();
  // Merge known variants
  if (/\b(road|roads|national\s*highway|nh|pmgsy)\b/.test(s)) return "Roads";
  if (/\bmetro\b/.test(s) && !/rail/.test(s)) return "Metro";
  if (/\b(rail|railway|railways|train)\b/.test(s)) return "Rail";
  if (/\b(bridge|overbridge|rob|fob)\b/.test(s)) return "Bridge";
  if (/\bflyover\b/.test(s)) return "Flyover";
  if (/\b(sewage|sewer|drainage)\b/.test(s)) return "Sewage";
  if (/\b(water(\s*supply)?|jjm|tap)\b/.test(s)) return "Water";
  if (/\b(housing|pmay|flat|apartment|homes)\b/.test(s)) return "Housing";
  if (/\b(power|electricity|grid|substation)\b/.test(s)) return "Power";
  if (/\b(port|harbour|harbor)\b/.test(s)) return "Port";
  if (/\b(airport|runway|terminal)\b/.test(s)) return "Airport";
  if (/\b(hospital|health|medical)\b/.test(s)) return "Hospital";
  if (/\b(school|college|university|education)\b/.test(s)) return "Education";
  if (/\b(stadium|sports|sport)\b/.test(s)) return "Sports & Stadium";
  if (/\b(park|lake|garden|eco[-\s]?park|reservoir)\b/.test(s)) return "Parks & Lakes";
  if (/\b(traffic|junction|signal)\b/.test(s)) return "Traffic";
  if (/\b(environment|ghg|emission|pollution)\b/.test(s)) return "Environment";
  if (/\b(industry|industrial|factory|manufacturing)\b/.test(s)) return "Industry";
  if (/\b(telecom|fiber|5g|tower|network)\b/.test(s)) return "Telecom";
  // Title-case fallback
  return raw.replace(/\s+/g, " ").trim().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export const CATEGORY_ICON: Record<string, LucideCmp> = {
  Roads:             Route,
  Metro:             Train,
  Rail:              TramFront,
  Bridge:            Landmark,
  Flyover:           Landmark,
  Water:             Droplets,
  Sewage:            Waves,
  Housing:           Building2,
  Power:             Zap,
  Hospital:          Heart,
  Education:         GraduationCap,
  "Sports & Stadium": Trophy,
  Airport:           Plane,
  Port:              Anchor,
  "Parks & Lakes":   TreePine,
  Traffic:           TrafficCone,
  Environment:       Leaf,
  Industry:          Factory,
  Telecom:           Factory,
  Other:             HardHat,
};

/** Canonical category (normalizeCategory) → message key page_infrastructure.cat.<key>. */
export const CATEGORY_KEY: Record<string, string> = {
  Roads: "roads", Metro: "metro", Rail: "rail", Bridge: "bridge", Flyover: "flyover",
  Water: "water", Sewage: "sewage", Housing: "housing", Power: "power", Hospital: "hospital",
  Education: "education", "Sports & Stadium": "sports", Airport: "airport", Port: "port",
  "Parks & Lakes": "parks", Traffic: "traffic", Environment: "environment", Industry: "industry",
  Telecom: "telecom", Other: "other",
};

/** One emoji per canonical category, for the v4 pictures and chips. */
export const CATEGORY_EMOJI: Record<string, string> = {
  Roads: "🛣️", Metro: "🚇", Rail: "🚆", Bridge: "🌉", Flyover: "🌉", Water: "💧", Sewage: "🚰",
  Housing: "🏘️", Power: "⚡", Hospital: "🏥", Education: "🎓", "Sports & Stadium": "🏟️",
  Airport: "✈️", Port: "⚓", "Parks & Lakes": "🌳", Traffic: "🚦", Environment: "🌿",
  Industry: "🏭", Telecom: "📡", Other: "🏗️",
};

export function categoryEmoji(raw: string | null | undefined): string {
  return CATEGORY_EMOJI[normalizeCategory(raw)] ?? "🏗️";
}

export function categoryIcon(raw: string | null | undefined): LucideCmp {
  return CATEGORY_ICON[normalizeCategory(raw)] ?? HardHat;
}

/**
 * The Lucide icon for a project category, as a real component so callers
 * don't create components during render (a React Compiler rule).
 * v4: drawn in the module hue (--hue), usually inside an .ftp-icon-chip.
 */
export function CategoryIcon({ category, size = 18 }: { category: string | null | undefined; size?: number }) {
  return createElement(categoryIcon(category), {
    size,
    "aria-hidden": true,
    style: { color: "var(--hue)", flexShrink: 0 },
  } as { size: number; style: React.CSSProperties });
}

/** Timeline update types that have a translated label (page_infrastructure.update.<TYPE>). */
export const UPDATE_TYPES = [
  "ANNOUNCEMENT", "APPROVAL", "TENDER", "CONSTRUCTION_START", "BUDGET_INCREASE", "BUDGET_DECREASE",
  "DELAY", "STALL", "PROGRESS_UPDATE", "CONTROVERSY", "COMPLETION", "CANCELLATION",
  "PHASE_COMPLETE", "INAUGURATION", "REVIEW", "SEED", "ADMIN_EDIT",
] as const;

// Formatting (rupees, dates, "5 hours ago") lives in useInfraText()
// (./infra-i18n.ts) so it follows the reader's language.

/** Quiet text style for "not yet known" placeholders. */
export const AWAIT_STYLE: React.CSSProperties = { color: "var(--ftp-text-2)" };

// Normalized status predicates
export function isCancelled(p: InfraProject): boolean { return normalizeStatus(p.status) === "CANCELLED"; }
export function isCompleted(p: InfraProject): boolean { return normalizeStatus(p.status) === "COMPLETED"; }
export function isDelayed(p: InfraProject): boolean {
  const s = normalizeStatus(p.status);
  return s === "DELAYED" || s === "STALLED" || (p.delayMonths ?? 0) > 0;
}
export function isActive(p: InfraProject): boolean { return !isCancelled(p) && !isCompleted(p); }

// ═══════════════════════════════════════════════════════════
// Project card
// ═══════════════════════════════════════════════════════════

/**
 * Truncate at a word boundary so the card never ends in mid-word.
 * Preserves the full value in the DB; only the visual surface is clipped.
 */
export function truncate(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const t = text.trim();
  if (t.length <= max) return t;
  const sliced = t.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return base + "…";
}

// Sub-judice / court-order detection. We only badge a card when the
// project's own text references a judicial proceeding — never inferred
// from category or status alone.
export const COURT_RE =
  /\b(supreme\s*court|high\s*court|tribunal|stay\s*order|sub[-\s]?judice|court\s*order|halted\s*by\s*court|injunction|writ\s*petition|nclat|ngt)\b/i;
export function hasCourtMention(p: InfraProject): boolean {
  const blob = [p.description, p.cancellationReason, p.name].filter(Boolean).join(" ");
  if (COURT_RE.test(blob)) return true;
  for (const u of p.updates ?? []) {
    if (COURT_RE.test(`${u.headline} ${u.summary ?? ""}`)) return true;
  }
  return false;
}
