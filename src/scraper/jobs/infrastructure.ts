/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Infrastructure Projects — PMGSY + state PWD portal
// Schedule: Every 12 hours
// Source: data.gov.in PMGSY dataset + pmgsy.nic.in
//
// A road already stored in the district (same canonical name — "NH-275
// Road" = "NH 275 road", src/lib/dedupe/keys.ts) is updated, never added
// twice. Only exact canonical names: PMGSY names differ by one village
// ("Road from A to B" / "A to C"), so near-misses are separate roads.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";
import { findSameNamed } from "@/lib/dedupe/match";

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
    const pool = await prisma.infraProject.findMany({
      where: { districtId: ctx.districtId },
      select: { id: true, name: true, shortName: true, progressPct: true },
      take: 5000,
    });

    for (const rec of records) {
      const name = (rec.road_name ?? rec.project_name ?? rec.Road_Name ?? "").trim();
      if (!name) continue;

      const category = "Roads";
      // Only what the source published: a missing amount stays null. (The
      // old code stored "funds released = 80% of the budget" when the field
      // was absent — an invented figure.)
      const budget = firstAmount(rec, ["sanctioned_amount", "budget"]);
      const fundsReleased = firstAmount(rec, ["funds_released", "amount_released", "expenditure"]);
      const rawProgress = firstAmount(rec, ["physical_progress", "progress_pct"]);
      const progressPct = rawProgress !== null && rawProgress <= 100 ? rawProgress : null;
      const status =
        (rec.status ?? rec.Status ?? "").trim() ||
        (progressPct === null ? null : progressPct >= 100 ? "Completed" : "In Progress");
      if (!status) continue; // no status and no progress → nothing trustworthy to store

      const existing = findSameNamed(pool, { name }, { exactOnly: true })?.row ?? null;

      if (!existing) {
        const row = await prisma.infraProject.create({
          data: {
            districtId: ctx.districtId,
            name,
            category,
            budget,
            fundsReleased,
            progressPct,
            status,
            source: "PMGSY / data.gov.in",
          },
          select: { id: true, name: true, shortName: true, progressPct: true },
        });
        pool.push(row);
        newCount++;
      } else if (progressPct !== null && Math.abs((existing.progressPct ?? 0) - progressPct) > 1) {
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
