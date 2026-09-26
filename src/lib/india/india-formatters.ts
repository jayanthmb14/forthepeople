/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Display formatters for India dashboard values.
 *
 * Rule (CLAUDE.md): budget values are stored in Rupees in the DB.
 * Convert to Crore / Lakh Crore / Lakh ONLY at the UI layer here.
 */

const INR = "₹";

/**
 * Format a Decimal-as-number into Indian-style grouping (12,34,567).
 * Returns the string with no currency symbol.
 */
export function formatIndianNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * Format a Rupee amount into the most readable Indian unit.
 * 1 Crore  = 1e7
 * 1 Lakh Crore = 1e12
 * Crosses between units at sensible boundaries.
 */
export function formatRupees(rupees: number | null | undefined): string {
  if (rupees == null || !Number.isFinite(rupees)) return "—";
  const abs = Math.abs(rupees);
  if (abs >= 1e12) return `${INR}${(rupees / 1e12).toFixed(2)} lakh crore`;
  if (abs >= 1e7) return `${INR}${(rupees / 1e7).toFixed(2)} crore`;
  if (abs >= 1e5) return `${INR}${(rupees / 1e5).toFixed(2)} lakh`;
  return `${INR}${formatIndianNumber(rupees)}`;
}

/**
 * Format a percentage value.
 * Pass the value as the percentage itself (5.25 → "5.25%"), NOT as a fraction.
 */
export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/**
 * Format a count in human-readable Indian units (1.23 cr, 4.5 lakh, etc.).
 * Use for population, beneficiary counts, etc. — anything that's not money.
 */
export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)} cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)} lakh`;
  if (abs >= 1e3) return value.toLocaleString("en-IN");
  return formatIndianNumber(value);
}

/**
 * Format a date as "12 Jan 2026" — concise, source-citation style.
 * Used for asOfDate display under every metric tile.
 */
export function formatAsOfDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format an asOfDate as a relative interval ("3 days ago", "last month").
 * Used in stale-data warnings on tiles. Falls back to formatAsOfDate
 * for anything older than ~1 year.
 */
export function formatRelativeAge(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const ms = Date.now() - d.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "last month";
  if (months < 12) return `${months} months ago`;
  return formatAsOfDate(d);
}

/**
 * Format a unit string for display next to a value.
 * Strips and re-applies whitespace so values render uniformly.
 */
export function formatUnit(unit: string | null | undefined): string {
  if (!unit) return "";
  return unit.trim();
}
