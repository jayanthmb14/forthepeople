/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate expiry date for one-time contributions based on amount.
 * Monthly subscriptions don't expire here (handled by Razorpay webhook).
 *
 * Tiers:
 *   ≥ ₹2000 → 90 days
 *   ≥ ₹500  → 60 days
 *   else    → 30 days
 */
export function calculateOneTimeExpiry(amount: number, from: Date = new Date()): Date {
  if (amount >= 2000) return new Date(from.getTime() + 90 * DAY_MS);
  if (amount >= 500) return new Date(from.getTime() + 60 * DAY_MS);
  return new Date(from.getTime() + 30 * DAY_MS);
}

/**
 * Founder grace period: 90 days after subscription cancellation.
 */
export function calculateFounderGrace(from: Date = new Date()): Date {
  return new Date(from.getTime() + 90 * DAY_MS);
}

/**
 * Standard subscription grace: 30 days after cancellation/expiry as fallback.
 */
export function calculateStandardGrace(from: Date = new Date()): Date {
  return new Date(from.getTime() + 30 * DAY_MS);
}

/**
 * Days between now and the given date (positive = future, negative = past).
 */
export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS);
}

/**
 * Format the "Active until {date}" / "Expires in X days" line for one-time cards.
 */
export function formatExpiryLabel(expiresAt: Date | string | null | undefined): string | null {
  const d = daysUntil(expiresAt);
  if (d === null) return null;
  if (d <= 0) return "Expired";
  if (d <= 14) return `Expires in ${d} day${d === 1 ? "" : "s"}`;
  const date = typeof expiresAt === "string" ? new Date(expiresAt!) : (expiresAt as Date);
  return `Active until ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}
