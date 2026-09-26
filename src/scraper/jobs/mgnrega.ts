/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: MGNREGA / Gram Panchayat — NREGASoft API
// Schedule: Daily at 4 AM
// Source: nreganet.nic.in / data.gov.in MGNREGA dataset
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// data.gov.in: MGNREGA GP-wise employment dataset
const DATA_GOV_BASE = "https://api.data.gov.in/resource";
const MGNREGA_RESOURCE = "01f42888-d63e-4e7d-9cac-4b0e17b72cc4"; // MGNREGA Karnataka GPs

export async function scrapeMGNREGA(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("MGNREGA: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let updatedCount = 0;

    const url = `${DATA_GOV_BASE}/${MGNREGA_RESOURCE}?api-key=${apiKey}&format=json&limit=200&filters[district_name]=${encodeURIComponent(ctx.districtSlug.toUpperCase())}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from data.gov.in MGNREGA`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    for (const rec of records) {
      const gpName = (rec.gp_name ?? rec.Gram_Panchayat ?? rec.village ?? "").trim();
      if (!gpName) continue;

      const mgnregaWorks = parseInt(rec.total_works ?? rec.works_completed ?? 0, 10);
      const totalFunds = parseFloat(rec.total_expenditure ?? rec.fund_utilised ?? 0);
      const fundsUtilized = parseFloat(rec.fund_utilised ?? rec.expenditure ?? totalFunds * 0.85);

      // Upsert by GP name within district
      const existing = await prisma.gramPanchayat.findFirst({
        where: { districtId: ctx.districtId, name: { contains: gpName.split(" ")[0], mode: "insensitive" } },
      });

      if (existing) {
        await prisma.gramPanchayat.update({
          where: { id: existing.id },
          data: {
            mgnregaWorks: isNaN(mgnregaWorks) ? existing.mgnregaWorks : mgnregaWorks,
            totalFunds: isNaN(totalFunds) || totalFunds === 0 ? existing.totalFunds : totalFunds,
            fundsUtilized: isNaN(fundsUtilized) || fundsUtilized === 0 ? existing.fundsUtilized : fundsUtilized,
            source: "NREGASoft / data.gov.in",
          },
        });
        updatedCount++;
      }
    }

    ctx.log(`MGNREGA: ${updatedCount} GPs updated`);
    return { success: true, recordsNew: 0, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
