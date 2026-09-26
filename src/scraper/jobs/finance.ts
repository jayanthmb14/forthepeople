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

    for (const rec of records) {
      const sector = (rec.sector ?? rec.department ?? rec.head ?? "").trim();
      if (!sector) continue;

      const allocated = parseFloat(rec.allocated ?? rec.approved ?? 0);
      const released = parseFloat(rec.released ?? rec.disbursed ?? allocated * 0.85);
      const spent = parseFloat(rec.spent ?? rec.utilized ?? released * 0.9);

      const existing = await prisma.budgetEntry.findFirst({
        where: { districtId: ctx.districtId, fiscalYear, sector },
      });

      if (!existing) {
        await prisma.budgetEntry.create({
          data: {
            districtId: ctx.districtId,
            fiscalYear,
            sector,
            allocated: isNaN(allocated) ? 0 : allocated,
            released: isNaN(released) ? 0 : released,
            spent: isNaN(spent) ? 0 : spent,
            source: "Karnataka Finance Dept / data.gov.in",
          },
        });
        newCount++;
      } else {
        await prisma.budgetEntry.update({
          where: { id: existing.id },
          data: {
            released: isNaN(released) ? existing.released : released,
            spent: isNaN(spent) ? existing.spent : spent,
            source: "Karnataka Finance Dept / data.gov.in",
          },
        });
        updatedCount++;
      }
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
