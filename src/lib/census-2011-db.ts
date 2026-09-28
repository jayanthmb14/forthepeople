/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Server-only loader for the district's checked Census 2011 row. The pure
// rules (which row counts, how it overrides other figures) are in
// src/lib/census-2011.ts; this is the one query the overview, the report
// card, the population profile and the public API share.
import { prisma } from "@/lib/db";
import { pickCensus2011, type CensusHistoryRow } from "@/lib/census-2011";

/** The district's checked Census 2011 row from PopulationHistory, or null. */
export async function loadCensus2011(districtId: string): Promise<CensusHistoryRow | null> {
  const rows = await prisma.populationHistory.findMany({
    where: { districtId, year: 2011 },
    select: { year: true, population: true, sexRatio: true, literacy: true, urbanPct: true, density: true, source: true },
  });
  return pickCensus2011(rows);
}
