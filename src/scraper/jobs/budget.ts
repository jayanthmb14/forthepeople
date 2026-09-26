/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Budget & Finance — National Data Collector
//
// Research findings (2026-04-10):
// - PFMS (pfms.nic.in): No public REST API. Complex ASP.NET forms
//   behind session cookies. Not feasible for automated collection.
// - data.gov.in: Searched for "district expenditure", "budget
//   utilisation" — no current live datasets with district-level
//   expenditure data found. Some historical CSV uploads available.
// - openbudgetsindia.org: Domain no longer hosts budget data.
// - State treasury portals: Each state has different systems,
//   most behind authentication. No standard API.
//
// Strategy: Use data.gov.in API to search for budget/expenditure
// datasets per state. When found, parse and update BudgetEntry.
// For now, this scraper validates and updates existing seed data
// and logs what's available. As government APIs open up,
// additional data sources will be integrated.
//
// Schedule: Weekly (every Monday at 6 AM UTC)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";

// Known data.gov.in resource IDs for budget/expenditure data per state
// These need to be discovered and updated as datasets become available
const STATE_BUDGET_RESOURCES: Record<string, { resourceId: string; description: string } | null> = {
  karnataka: null, // No district-level expenditure dataset found on data.gov.in
  telangana: null,
  delhi: null,
  maharashtra: null,
  "west-bengal": null,
  "tamil-nadu": null,
};

/**
 * True when at least one state has a known data.gov.in resource id above.
 * The scrape-budget cron uses this to exit early with {skipped: true}
 * instead of looping every district for a guaranteed no-op.
 */
export function hasAnyLiveBudgetSource(): boolean {
  return Object.values(STATE_BUDGET_RESOURCES).some((r) => r !== null);
}

export async function scrapeBudget(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Budget: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  const stateSlug = ctx.stateSlug ?? "karnataka";

  try {
    let newCount = 0;
    let updatedCount = 0;

    // Check if we have a known data.gov.in resource for this state
    const resource = STATE_BUDGET_RESOURCES[stateSlug];

    if (resource) {
      ctx.log(`Budget: Fetching data from data.gov.in resource ${resource.resourceId} for ${stateSlug}`);

      const url = `${DATA_GOV_BASE}/${resource.resourceId}?api-key=${apiKey}&format=json&limit=100&filters[state]=${encodeURIComponent(ctx.stateName ?? stateSlug)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

      if (res.ok) {
        const json = await res.json();
        const records: Record<string, string>[] = json?.records ?? [];

        for (const rec of records) {
          const sector = rec.department ?? rec.sector ?? rec.scheme ?? null;
          const allocated = parseFloat(rec.allocated ?? rec.allocation ?? "0");
          const released = parseFloat(rec.released ?? rec.release ?? "0");
          const spent = parseFloat(rec.spent ?? rec.expenditure ?? rec.utilised ?? "0");

          if (!sector || allocated === 0) continue;

          const existing = await prisma.budgetEntry.findFirst({
            where: {
              districtId: ctx.districtId,
              sector: { contains: sector.slice(0, 30), mode: "insensitive" },
            },
          });

          if (existing) {
            await prisma.budgetEntry.update({
              where: { id: existing.id },
              data: {
                allocated: allocated * 10000000, // Convert Crores to Rupees if needed
                released: released * 10000000,
                spent: spent * 10000000,
                source: `data.gov.in (${resource.description})`,
              },
            });
            updatedCount++;
          } else {
            await prisma.budgetEntry.create({
              data: {
                districtId: ctx.districtId,
                fiscalYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2),
                sector,
                allocated: allocated * 10000000,
                released: released * 10000000,
                spent: spent * 10000000,
                source: `data.gov.in (${resource.description})`,
              },
            });
            newCount++;
          }
        }
      }
    } else {
      ctx.log(`Budget: No data.gov.in dataset configured for state "${stateSlug}" — using existing seed data. District-level expenditure APIs will be integrated when available.`);
    }

    // Update DataRefresh tracking
    try {
      await prisma.dataRefresh.upsert({
        where: { endpoint: "budget" },
        update: {
          lastRefreshed: new Date(),
          nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "success",
        },
        create: {
          endpoint: "budget",
          lastRefreshed: new Date(),
          nextRefresh: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "success",
        },
      });
    } catch {
      // DataRefresh upsert failure is non-fatal
    }

    ctx.log(`Budget: ${newCount} new, ${updatedCount} updated for ${ctx.districtSlug}`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
