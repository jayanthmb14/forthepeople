/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Finance / Budget — Karnataka Finance Dept
// Schedule: Monthly (1st of month, 6 AM)
// Source: data.gov.in / kar.nic.in budget portal
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
// Karnataka district-wise plan expenditure
const BUDGET_RESOURCE = "b65f8b83-9a0c-4e34-8d5c-3a4b76fecc9e";

export async function scrapeFinance(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Finance: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;
    let updatedCount = 0;
    const today = new Date();
    const fiscalYear = today.getMonth() >= 3
      ? `${today.getFullYear()}-${(today.getFullYear() + 1).toString().slice(2)}`
      : `${today.getFullYear() - 1}-${today.getFullYear().toString().slice(2)}`;

    const url = `${DATA_GOV_BASE}/${BUDGET_RESOURCE}?api-key=${apiKey}&format=json&limit=100&filters[district]=${encodeURIComponent(ctx.districtSlug)}&filters[fiscal_year]=${fiscalYear}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from data.gov.in Budget`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    let skippedIncomplete = 0;
    for (const rec of records) {
      const sector = (rec.sector ?? rec.department ?? rec.head ?? "").trim();
      if (!sector) continue;

      // Only figures the source actually published. The old code filled a
      // missing "released" with allocated × 0.85 and a missing "spent" with
      // released × 0.9 — invented numbers shown as government data.
      const allocated = firstAmount(rec, ["allocated", "approved"]);
      const released = firstAmount(rec, ["released", "disbursed"]);
      const spent = firstAmount(rec, ["spent", "utilized"]);

      // Only a row this collector wrote is updated: patching a seeded row
      // would relabel its typed-in allocation as collected data (the API
      // shows only collector-labelled rows, data-filters.ts).
      const existing = await prisma.budgetEntry.findFirst({
        where: { districtId: ctx.districtId, fiscalYear, sector, source: "Karnataka Finance Dept / data.gov.in" },
      });

      if (!existing) {
        // BudgetEntry needs all three figures; a row with a gap is skipped.
        if (allocated === null || released === null || spent === null) {
          skippedIncomplete++;
          continue;
        }
        await prisma.budgetEntry.create({
          data: {
            districtId: ctx.districtId,
            fiscalYear,
            sector,
            allocated,
            released,
            spent,
            source: "Karnataka Finance Dept / data.gov.in",
          },
        });
        newCount++;
      } else {
        const patch: { released?: number; spent?: number } = {};
        if (released !== null) patch.released = released;
        if (spent !== null) patch.spent = spent;
        if (Object.keys(patch).length === 0) continue;
        await prisma.budgetEntry.update({
          where: { id: existing.id },
          data: { ...patch, source: "Karnataka Finance Dept / data.gov.in" },
        });
        updatedCount++;
      }
    }
    if (skippedIncomplete > 0) {
      ctx.log(`Finance: skipped ${skippedIncomplete} record(s) with a missing figure (nothing invented)`);
    }

    // If no results from API, sectors may not be in this resource yet
    if (newCount === 0 && updatedCount === 0 && records.length === 0) {
      ctx.log(`Finance: no records returned from API for ${fiscalYear}`);
    }

    ctx.log(`Finance: ${newCount} new, ${updatedCount} updated (FY ${fiscalYear})`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
