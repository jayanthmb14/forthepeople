/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Shared Prisma filters for what a district page may show or count.
// Use them everywhere public numbers are built (data API, report card,
// insights) so every screen agrees.

/**
 * Rows written straight from a news article carry the article URL as
 * `source` (Leader, CrimeStat, PowerOutage). The Sept 2026 audit found them
 * wrong far too often, so they are never shown or counted. Curated rows name
 * their source ("NCRB", "BESCOM", "manual-research").
 */
export const NOT_FROM_NEWS = { NOT: { source: { startsWith: "http" } } };

/** Same, for tables where `source` is optional (Leader). */
export const NOT_FROM_NEWS_OPTIONAL = { OR: [{ source: null }, NOT_FROM_NEWS] };

/**
 * Infrastructure that is actually IN the district. STATE and NATIONAL rows
 * were copied onto many districts by the old sync (one Delhi project was on
 * all ten), so district pages list DISTRICT and CITY projects only.
 */
export const LOCAL_INFRA = { OR: [{ scope: null }, { scope: { in: ["DISTRICT", "CITY"] } }] };

/**
 * Monthly rainfall rows that the seed scripts generated with Math.random()
 * (prisma/seed.ts — Mandya; seed-bengaluru-data.ts; seed-delhi-data.ts) or
 * typed by hand (seed-mysuru-data.ts, "IMD Mysuru" 2023–24),
 * labelled as KSNDMC / IMD. They are not measurements, so they are never
 * shown. Matched by the exact seed source labels AND the seeded years
 * (2020–2024), so a real collector writing current years is unaffected.
 */
export const NOT_SEEDED_RAINFALL = {
  NOT: {
    AND: [
      { source: { in: ["Karnataka State Natural Disaster Monitoring Centre (KSNDMC)", "KSNDMC / IMD", "IMD Delhi", "IMD Mysuru"] } },
      { year: { lte: 2024 } },
    ],
  },
};
