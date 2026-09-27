/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — shared helpers (status + category normalisation, formatting, predicates).
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

import type { ComponentType } from "react";
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

export const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PROPOSED:           { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB", label: "Proposed" },
  APPROVED:           { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "Approved" },
  TENDER_ISSUED:      { bg: "#F5F3FF", color: "#7C3AED", border: "#C4B5FD", label: "Tender Issued" },
  UNDER_CONSTRUCTION: { bg: "#FFF7ED", color: "#D97706", border: "#FDBA74", label: "Under Construction" },
  ON_TRACK:           { bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC", label: "On Track" },
  DELAYED:            { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5", label: "Delayed" },
  STALLED:            { bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5", label: "Stalled" },
  COMPLETED:          { bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC", label: "Completed" },
  CANCELLED:          { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB", label: "Cancelled" },
};

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

export function categoryIcon(raw: string | null | undefined): LucideCmp {
  return CATEGORY_ICON[normalizeCategory(raw)] ?? HardHat;
}

export const UPDATE_TYPE_LABEL: Record<string, string> = {
  ANNOUNCEMENT: "Announcement", APPROVAL: "Approval", TENDER: "Tender",
  CONSTRUCTION_START: "Construction Start", BUDGET_INCREASE: "Budget Increase",
  BUDGET_DECREASE: "Budget Decrease", DELAY: "Delay", STALL: "Stall",
  PROGRESS_UPDATE: "Progress Update", CONTROVERSY: "Concern Raised",
  COMPLETION: "Completion", CANCELLATION: "Cancellation",
  PHASE_COMPLETE: "Phase Complete", INAUGURATION: "Inauguration",
  REVIEW: "Review", SEED: "Initial Record", ADMIN_EDIT: "Admin Edit",
};

// ═══════════════════════════════════════════════════════════
// Format helpers
// ═══════════════════════════════════════════════════════════

export function formatINR(rupees: number | null | undefined): string {
  if (rupees == null) return "—";
  if (rupees >= 1_00_00_00_00_000) return `₹${(rupees / 1_00_00_00_00_000).toFixed(2)} Lakh Cr`;
  if (rupees >= 10_00_00_000) return `₹${(rupees / 10_00_00_000).toFixed(0)} Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(0)} Lakh`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); } catch { return "—"; }
}

export function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatMonthYear(iso);
}

export const AWAIT_STYLE: React.CSSProperties = { color: "#9CA3AF", fontStyle: "italic" };

export function Awaiting() {
  return <span style={AWAIT_STYLE}>Awaiting data</span>;
}

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

export const ANNOUNCER_TOOLTIP =
  "This attribution is based on news reports. It indicates who publicly announced this project, not who is responsible for its current status.";
export const PARTY_TOOLTIP =
  "Party affiliation shown as reported in news media at the time of announcement. Shown for transparency, not as political endorsement.";

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
