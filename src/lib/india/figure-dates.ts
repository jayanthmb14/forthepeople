/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * What the date on an India figure means, and when a figure is old.
 * Pure — no database, no React — so pages, loaders and tests share it
 * (tests/india-figure-dates.test.ts).
 *
 * 1. Standing facts (Sept 2026 audit). IndiaIndicator.asOfDate is meant to
 *    be the SOURCE's date. For facts with no release date — the number of
 *    states, Lok Sabha seats, a policy target, a UNESCO inscription year —
 *    the date stored is the day the fact was last checked (the Sept 2026
 *    fix wrote 27 Sep 2026). Those rows are not "new data": they are left
 *    out of the India page's "Data as of" pill and the latest-updates feeds,
 *    and a tile says "checked <date>", not "as of <date>".
 * 2. Old figures. A figure more than OLD_FIGURE_MONTHS old is shown with its
 *    year on the India page bands (R&D spending "0.65%" is for 2020).
 */

/** metricKeys whose asOfDate is a check date, not a publication date. */
export const STANDING_FACT_KEYS: readonly string[] = [
  // Counts fixed by the Constitution / law (change only by amendment or a new order)
  "states_count",
  "uts_count",
  "scheduled_languages",
  "scheduled_languages_count",
  "loksabha_seats_total",
  "rajyasabha_seats_total",
  "lok_sabha_seats",
  "rajya_sabha_seats",
  // Geography
  "area_total_million_km2",
  "world_rank_by_area",
  // Policy targets and report identifiers
  "forest_cover_target_pct",
  "isfr_year",
  "isfr_edition",
  // Totals that change only after the next Games
  "olympic_medals_total",
];

/** UNESCO inscription years (unesco_taj_mahal_year …). */
const STANDING_FACT_PATTERN = /^unesco_.+_year$/;

const STANDING = new Set(STANDING_FACT_KEYS);

export function isStandingFact(metricKey: string): boolean {
  return STANDING.has(metricKey) || STANDING_FACT_PATTERN.test(metricKey);
}

/** Prisma `where` for IndiaIndicator rows that are dated data, not standing facts. */
export const NOT_STANDING_FACT = {
  AND: [
    { metricKey: { notIn: [...STANDING_FACT_KEYS] } },
    { NOT: { metricKey: { startsWith: "unesco_", endsWith: "_year" } } },
  ],
};

/** A figure older than this many months shows its year beside the number. */
export const OLD_FIGURE_MONTHS = 18;

/**
 * The year (in India) of a figure's date when it is more than
 * OLD_FIGURE_MONTHS old, else null. Invalid or missing dates → null.
 */
export function oldFigureYear(asOf: Date | string | null | undefined, nowMs: number = Date.now()): string | null {
  if (!asOf) return null;
  const t = new Date(asOf).getTime();
  if (!Number.isFinite(t)) return null;
  const ageMonths = (nowMs - t) / (30.44 * 86_400_000);
  if (ageMonths <= OLD_FIGURE_MONTHS) return null;
  return String(new Date(t + 5.5 * 3_600_000).getUTCFullYear());
}
