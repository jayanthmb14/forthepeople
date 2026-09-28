/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Citizen tips — PURE helpers, unit-tested (tests/citizen-tips.test.ts).
// Used by the weekly cron /api/cron/generate-citizen-tips.
//
//   normalizeCitizenTips()  keep only complete tips, clean the fields
//   tipsToStore()           NEVER replace good tips with an empty list
//   citizenTipsKey()        the Redis key the cron writes and the page reads
// ═══════════════════════════════════════════════════════════
import { asArray } from "@/lib/ai-json";

/** Redis key of a district's stored tips (written by the cron, read by /api/ai/citizen-tips). */
export function citizenTipsKey(districtSlug: string): string {
  return `ftp:ai:citizen-tips:${districtSlug}`;
}

/**
 * How long stored tips live: two weekly runs. With a 7-day expiry (the
 * cron's own interval) last week's tips were usually gone by the time this
 * week's run reached a district, so "keep last week's tips when the AI
 * fails" found nothing and the Citizen Corner went empty for a week
 * (v5.5). The tips carry their own month and generatedAt.
 */
export const CITIZEN_TIPS_TTL_S = 14 * 24 * 60 * 60;

export type TipUrgency = "now" | "soon" | "general";

export interface CitizenTip {
  category: string;
  /** Kept for the stored shape; the page shows its own category icon. */
  icon: string;
  title: string;
  description: string;
  urgency: TipUrgency;
}

export interface StoredTips {
  tips: CitizenTip[];
  month: number;
  year: number;
  generatedAt: string;
  generatedBy: "cron";
}

/** The categories the Citizen Corner page has labels and icons for. */
export const TIP_CATEGORIES = ["Agriculture", "Health", "Finance", "Water", "Rights", "Safety", "Education", "Environment"] as const;

export const MAX_TIPS = 8;

/**
 * Accepts the model's answer ({"tips":[…]} or a bare list) and returns only
 * tips with a category, a title and a description; category is matched to
 * the known list (case-insensitive), urgency defaults to "general".
 */
export function normalizeCitizenTips(answer: unknown): CitizenTip[] {
  const out: CitizenTip[] = [];
  for (const raw of asArray<unknown>(answer, "tips")) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const description = typeof r.description === "string" ? r.description.trim() : "";
    if (!title || !description) continue;
    const catRaw = typeof r.category === "string" ? r.category.trim() : "";
    if (!catRaw) continue;
    const category = TIP_CATEGORIES.find((c) => c.toLowerCase() === catRaw.toLowerCase()) ?? catRaw.slice(0, 40);
    const urgency: TipUrgency = r.urgency === "now" || r.urgency === "soon" ? r.urgency : "general";
    out.push({ category, icon: "", title: title.slice(0, 120), description: description.slice(0, 600), urgency });
    if (out.length >= MAX_TIPS) break;
  }
  return out;
}

/**
 * What to write to the cache this week:
 *   new tips          → the new payload
 *   none, but old ones → the OLD payload unchanged (its generatedAt stays, so
 *                        the page shows their real date) — refreshed TTL
 *   none at all       → null (write nothing; the page shows its empty state)
 */
export function tipsToStore(fresh: StoredTips, previous: StoredTips | null | undefined): { payload: StoredTips; kept: boolean } | null {
  if (fresh.tips.length > 0) return { payload: fresh, kept: false };
  if (previous && Array.isArray(previous.tips) && previous.tips.length > 0) return { payload: previous, kept: true };
  return null;
}
