/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

/** Response of GET /api/data/glance (src/app/api/data/glance/route.ts). */
export interface GlanceData {
  collector: { name: string; role: string } | null;
  /** The district's Lok Sabha MP; `count` > 1 when several constituencies cover it. */
  mp: { name: string; party: string | null; count: number; names: string[] } | null;
  population: { value: number; dataset: string | null; year: number | null; estimate: boolean } | null;
  projects: { active: number; total: number } | null;
  budget: { allocated: number; fiscalYear: string; estimate: boolean } | null;
  election: { type: string; label: string; date: string; approximate: boolean } | null;
  grade: { grade: string; score: number; generatedAt: string } | null;
  alerts: { active: number; topSeverity: string | null; topTitle: string | null };
  checkedAt: string;
}
