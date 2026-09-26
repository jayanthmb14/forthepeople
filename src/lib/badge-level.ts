/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

export function calculateBadgeLevel(activatedAt: Date | null, tier?: string): string | null {
  // Founding Builders get platinum immediately
  if (tier === "founder") return "platinum";
  if (!activatedAt) return null;
  const months = Math.floor(
    (Date.now() - activatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  if (months >= 24) return "platinum";
  if (months >= 12) return "gold";
  if (months >= 6) return "silver";
  if (months >= 3) return "bronze";
  return null;
}

export function getMonthsActive(activatedAt: Date | null): number {
  if (!activatedAt) return 0;
  return Math.floor(
    (Date.now() - activatedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
}

export const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "#FED7AA", text: "#9A3412", border: "#CD7F32" },
  silver: { bg: "#F1F5F9", text: "#475569", border: "#C0C0C0" },
  gold: { bg: "#FEF3C7", text: "#92400E", border: "#FFD700" },
  platinum: { bg: "#EDE9FE", text: "#5B21B6", border: "#E5E4E2" },
};
