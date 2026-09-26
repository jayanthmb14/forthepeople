/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Infrastructure Projects — PMGSY + state PWD portal
// Schedule: Every 12 hours
// Source: data.gov.in PMGSY dataset + pmgsy.nic.in
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
const PMGSY_RESOURCE = "9c6bfbde-23d9-4d1e-a1d4-c9c5b4f11a7e"; // PMGSY road projects

export async function scrapeInfrastructure(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Infrastructure: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;
    let updatedCount = 0;

    const url = `${DATA_GOV_BASE}/${PMGSY_RESOURCE}?api-key=${apiKey}&format=json&limit=100&filters[district_name]=${ctx.districtSlug.toUpperCase()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from data.gov.in`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    for (const rec of records) {
      const name = (rec.road_name ?? rec.project_name ?? rec.Road_Name ?? "").trim();
      if (!name) continue;

      const category = "Roads";
      const budget = parseFloat(rec.sanctioned_amount ?? rec.budget ?? 0);
      const progressPct = parseFloat(rec.physical_progress ?? rec.progress_pct ?? 0);
      const status = rec.status ?? rec.Status ?? (progressPct >= 100 ? "Completed" : "In Progress");

      const existing = await prisma.infraProject.findFirst({
        where: { districtId: ctx.districtId, name },
      });

      if (!existing) {
        await prisma.infraProject.create({
          data: {
            districtId: ctx.districtId,
            name,
            category,
            budget: isNaN(budget) ? null : budget,
            fundsReleased: isNaN(budget) ? null : budget * 0.8,
            progressPct: isNaN(progressPct) ? null : progressPct,
            status,
            source: "PMGSY / data.gov.in",
          },
        });
        newCount++;
      } else if (Math.abs((existing.progressPct ?? 0) - progressPct) > 1) {
        await prisma.infraProject.update({
          where: { id: existing.id },
          data: { progressPct, status, source: "PMGSY / data.gov.in" },
        });
        updatedCount++;
      }
    }

    ctx.log(`Infrastructure: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
