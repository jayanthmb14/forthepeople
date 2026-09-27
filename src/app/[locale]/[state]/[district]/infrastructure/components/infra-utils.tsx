/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — shared helpers: stage and kind (from
 * src/lib/civic/project-facts), their tones and fills, and the
 * predicates the page counts with. No hex colours, no emoji (v5). Each
 * kind's picture is a shared category glyph (src/components/graphics,
 * projectKindGlyph).
 */

import type { Tone } from "@/components/district/ui";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { projectKind, projectStage, type ProjectKind, type ProjectStage } from "@/lib/civic/project-facts";

// ═══════════════════════════════════════════════════════════
// Stage + kind (v5): the ~45 status spellings and ~90 category spellings
// in the database fold into two closed lists (src/lib/civic/project-facts).
// Each stage maps to a kit Pill tone (colours live in the --ftp-* tokens);
// each kind has a glyph and pastel hue (projectKindGlyph).
// ═══════════════════════════════════════════════════════════

export const STAGE_TONE: Record<ProjectStage, Tone> = {
  announced: "neutral",
  approved: "features",
  building: "brand",
  completed: "live",
  stalled: "warn",
  cancelled: "neutral",
};

/** Segment colours for the stage bar, calm and in stage order. */
export const STAGE_FILL: Record<ProjectStage, string> = {
  building: "var(--hue-deep)",
  stalled: "var(--ftp-warn)",
  approved: "var(--hue)",
  announced: "color-mix(in srgb, var(--hue) 45%, var(--ftp-surface))",
  completed: "var(--ftp-live)",
  cancelled: "var(--ftp-border-strong)",
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

/** The project's stage and kind in one call. */
export function stageOf(p: InfraProject): ProjectStage {
  return projectStage(p.status);
}
export function kindOf(p: InfraProject): ProjectKind {
  return projectKind(p.category, p.name);
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

// Stage predicates
export function isCancelled(p: InfraProject): boolean { return stageOf(p) === "cancelled"; }
export function isCompleted(p: InfraProject): boolean { return stageOf(p) === "completed"; }

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
