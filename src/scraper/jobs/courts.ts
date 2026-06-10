/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Court Stats — National Judicial Data Grid (NJDG)
// Schedule: Daily at 3 AM
// Source: njdg.ecourts.gov.in
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// NJDG API endpoint for district court statistics
const NJDG_API = "https://njdg.ecourts.gov.in/njdgnew/api/index.php";

export async function scrapeCourts(ctx: JobContext): Promise<ScraperResult> {
  try {
    let newCount = 0;
    const today = new Date();
    const year = today.getFullYear();

    // NJDG requires state+district code. Try the public summary endpoint.
    const params = new URLSearchParams({
      action: "getDistrictSummary",
      state_code: "17", // Karnataka
      dist_code: ctx.districtSlug,
    });

    const res = await fetch(`${NJDG_API}?${params}`, {
      headers: {
        "User-Agent": "ForThePeople.in/1.0 (citizen transparency)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      const json = await res.json();
      const data = json?.data ?? json?.result ?? {};

      for (const [courtName, stats] of Object.entries(data)) {
        const s = stats as Record<string, number>;
        const filed = s.inst ?? s.filed ?? 0;
        const disposed = s.disp ?? s.disposed ?? 0;
        const pending = s.pend ?? s.pending ?? 0;

        if (!filed && !pending) continue;

        const existing = await prisma.courtStat.findFirst({
          where: { districtId: ctx.districtId, year, courtName },
        });

        if (!existing) {
          await prisma.courtStat.create({
            data: {
              districtId: ctx.districtId,
              year,
              courtName,
              filed,
              disposed,
              pending,
              source: "NJDG / eCourts",
            },
          });
          newCount++;
        }
      }
    } else {
      // Honest empty state: NJDG failed, so write NOTHING. The old fallback derived
      // pending = prevPending + filed - disposed (with filed/disposed guessed as a
      // fraction of the last known pending) and stored it as "NJDG (estimated)" — a
      // computed number presented as current case data, which violates the platform's
      // zero-fabrication rule. The last REAL rows stay untouched; the /courts page
      // degrades to its NoDataCard empty state when a district has no real rows.
      ctx.log(`Courts: NJDG returned HTTP ${res.status} — no data written (honest empty state)`);
      return { success: false, recordsNew: 0, recordsUpdated: 0, error: `NJDG HTTP ${res.status}` };
    }

    ctx.log(`Courts: ${newCount} new records`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
