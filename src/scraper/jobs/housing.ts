/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Housing Schemes — PMAY-G AwaasSoft
// Schedule: Weekly
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

export async function scrapeHousing(ctx: JobContext): Promise<ScraperResult> {
  try {
    // Use data.gov.in PMAY dataset as a more accessible alternative
    const API_KEY = process.env.DATA_GOV_API_KEY;
    if (!API_KEY) {
      ctx.log("DATA_GOV_API_KEY not set — skipping housing");
      return { success: false, recordsNew: 0, recordsUpdated: 0, error: "No API key" };
    }

    // PMAY-G resource on data.gov.in
    const res = await fetch(
      `https://api.data.gov.in/resource/c17b2e27-3e85-4e82-9c15-5bde07e8e3a5?api-key=${API_KEY}&format=json&filters[district_name]=${ctx.districtSlug}&limit=20`,
      { signal: AbortSignal.timeout(20_000) },
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records = data.records ?? [];

    let newCount = 0;
    let updCount = 0;

    for (const r of records) {
      const schemeName = r.scheme_name ?? "PMAY-G"; // the dataset is PMAY-G
      // The row's own year and counts only: the old code assumed the current
      // FY for a missing year and 0 for a missing count.
      const fiscalYear: string | null = r.year ? String(r.year) : null;
      const targetHouses = firstAmount(r, ["target"]);
      const sanctioned = firstAmount(r, ["sanctioned"]);
      const completed = firstAmount(r, ["completed"]);
      const inProgress = firstAmount(r, ["in_progress"]);
      if (!fiscalYear || targetHouses === null || sanctioned === null || completed === null || inProgress === null) continue;

      const existing = await prisma.housingScheme.findFirst({
        where: { districtId: ctx.districtId, schemeName, fiscalYear },
      });

      const payload = {
        targetHouses: Math.round(targetHouses),
        sanctioned: Math.round(sanctioned),
        completed: Math.round(completed),
        inProgress: Math.round(inProgress),
        fundsAllocated: firstAmount(r, ["funds_allocated"]),
        fundsReleased: firstAmount(r, ["funds_released"]),
        fundsSpent: firstAmount(r, ["funds_spent"]),
        source: "AwaasSoft / data.gov.in",
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.housingScheme.update({ where: { id: existing.id }, data: payload });
        updCount++;
      } else {
        await prisma.housingScheme.create({
          data: { districtId: ctx.districtId, schemeName, fiscalYear, ...payload },
        });
        newCount++;
      }
    }

    ctx.log(`Housing: ${newCount} new, ${updCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
