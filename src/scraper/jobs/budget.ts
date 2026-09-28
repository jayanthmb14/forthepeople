/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
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
// Strategy: when a state gets a data.gov.in dataset with district-level
// figures, add it to STATE_BUDGET_RESOURCES below. Until then every entry
// is null, the scrape-budget cron returns "skipped" and nothing is
// written. This job only ever writes rows it collected itself
// (source "data.gov.in (…)"); it never touches rows entered by hand.
//
// Schedule: Weekly (every Monday at 6 AM UTC)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { budgetRowFromRecord, type BudgetResource } from "../lib/budget-records";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";

// Known data.gov.in resource IDs for budget/expenditure data per state.
// Each needs, from the dataset itself (never guessed):
//   unit           what it publishes; stored amounts are whole rupees
//                  (CLAUDE.md), so crore figures are multiplied by 1,00,00,000
//   districtField  the field naming the district (the request filters on it)
//   yearField      the field holding the financial year
// Records without our district or a readable year are skipped
// (src/scraper/lib/budget-records.ts).
const STATE_BUDGET_RESOURCES: Record<string, BudgetResource | null> = {
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

  const stateSlug = ctx.stateSlug;

  try {
    let newCount = 0;
    let updatedCount = 0;

    // Check if we have a known data.gov.in resource for this state
    const resource = STATE_BUDGET_RESOURCES[stateSlug];

    if (resource) {
      ctx.log(`Budget: Fetching data from data.gov.in resource ${resource.resourceId} for ${stateSlug}`);

      // Filtered by DISTRICT (the old state filter stored the whole state's
      // rows on every district of that state).
      const url = `${DATA_GOV_BASE}/${resource.resourceId}?api-key=${apiKey}&format=json&limit=100&filters[${encodeURIComponent(resource.districtField)}]=${encodeURIComponent(ctx.districtName)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

      if (res.ok) {
        const json = await res.json();
        const records: Record<string, unknown>[] = json?.records ?? [];
        const source = `data.gov.in (${resource.description})`;

        for (const rec of records) {
          const row = budgetRowFromRecord(rec, resource, ctx.districtName);
          if (!row) continue;

          // Only a row this collector wrote, for the same year, is updated.
          const existing = await prisma.budgetEntry.findFirst({
            where: {
              districtId: ctx.districtId,
              fiscalYear: row.fiscalYear,
              sector: { contains: row.sector.slice(0, 30), mode: "insensitive" },
              source: { startsWith: "data.gov.in (" },
            },
            select: { id: true },
          });

          if (existing) {
            await prisma.budgetEntry.update({
              where: { id: existing.id },
              data: { allocated: row.allocated, released: row.released, spent: row.spent, source },
            });
            updatedCount++;
          } else {
            await prisma.budgetEntry.create({ data: { districtId: ctx.districtId, ...row, source } });
            newCount++;
          }
        }
      }
    } else {
      ctx.log(`Budget: no data.gov.in dataset configured for state "${stateSlug}" — nothing collected.`);
    }

    // DataRefresh records a refresh only when rows were actually written.
    // (It used to say "success" every week while collecting nothing.)
    if (newCount + updatedCount > 0) {
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
    }

    ctx.log(`Budget: ${newCount} new, ${updatedCount} updated for ${ctx.districtSlug}`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
