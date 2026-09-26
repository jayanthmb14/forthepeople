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

const CURRENT_FY = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;

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
      `https://api.data.gov.in/resource/c17b2e27-3e85-4e82-9c15-5bde07e8e3a5?api-key=${API_KEY}&format=json&filters[district_name]=${ctx.districtSlug}&limit=20`
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const records = data.records ?? [];

    let newCount = 0;
    let updCount = 0;

    for (const r of records) {
      const schemeName = r.scheme_name ?? "PMAY-G";
      const fiscalYear = r.year ?? CURRENT_FY;

      const existing = await prisma.housingScheme.findFirst({
        where: { districtId: ctx.districtId, schemeName, fiscalYear },
      });

      const payload = {
        targetHouses: parseInt(r.target ?? "0") || 0,
        sanctioned: parseInt(r.sanctioned ?? "0") || 0,
        completed: parseInt(r.completed ?? "0") || 0,
        inProgress: parseInt(r.in_progress ?? "0") || 0,
        fundsAllocated: parseFloat(r.funds_allocated ?? "0") || null,
        fundsReleased: parseFloat(r.funds_released ?? "0") || null,
        fundsSpent: parseFloat(r.funds_spent ?? "0") || null,
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
