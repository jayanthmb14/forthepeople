/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Police / Traffic — NCRB + traffic challan data
// Schedule: Every 6 hours
// Source: NCRB data.gov.in resource, Karnataka Police portal
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

// data.gov.in: NCRB crime statistics (state/district-level)
const DATA_GOV_BASE = "https://api.data.gov.in/resource";
const CRIME_RESOURCE = "5b7ea7fd-c12b-4a8d-b7a3-05d4bc3c0e25"; // NCRB IPC crimes by district
const TRAFFIC_RESOURCE = "b0ab1bcd-4173-41b8-a86c-a73f9c24c8f2"; // Traffic challans Karnataka

export async function scrapePolice(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Police: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;
    let updatedCount = 0;

    // ── Crime stats from NCRB ────────────────────────────
    const crimeUrl = `${DATA_GOV_BASE}/${CRIME_RESOURCE}?api-key=${apiKey}&format=json&limit=50&filters[district]=${ctx.districtSlug}`;
    const crimeRes = await fetch(crimeUrl, {
      signal: AbortSignal.timeout(20_000),
    });

    if (crimeRes.ok) {
      const crimeData = await crimeRes.json();
      const records = crimeData?.records ?? [];

      for (const rec of records) {
        // Year, head and count must all be published: the old code assumed
        // the current year, "IPC" and 0 cases when a field was missing.
        const yearRaw = firstAmount(rec, ["year", "Year"]);
        const year = yearRaw === null ? null : Math.round(yearRaw);
        const category = String(rec.crime_head ?? rec.Category ?? "").trim();
        const countRaw = firstAmount(rec, ["cases_registered", "Count"]);
        const count = countRaw === null ? null : Math.round(countRaw);

        if (!category || year === null || count === null || year > new Date().getFullYear()) continue;

        const existing = await prisma.crimeStat.findFirst({
          where: { districtId: ctx.districtId, year, category },
        });

        if (!existing) {
          await prisma.crimeStat.create({
            data: {
              districtId: ctx.districtId,
              year,
              category,
              count,
              source: "NCRB / data.gov.in",
            },
          });
          newCount++;
        } else if (existing.count !== count) {
          await prisma.crimeStat.update({
            where: { id: existing.id },
            data: { count, source: "NCRB / data.gov.in" },
          });
          updatedCount++;
        }
      }
    }

    // ── Traffic challan data ─────────────────────────────
    const trafficUrl = `${DATA_GOV_BASE}/${TRAFFIC_RESOURCE}?api-key=${apiKey}&format=json&limit=30&filters[district]=${ctx.districtSlug}`;
    const trafficRes = await fetch(trafficUrl, {
      signal: AbortSignal.timeout(20_000),
    });

    if (trafficRes.ok) {
      const trafficData = await trafficRes.json();
      const records = trafficData?.records ?? [];

      for (const rec of records) {
        // A row needs its own date and both figures; the old code used
        // "today" for a missing date and 0 for a missing figure.
        const dateStr = rec.date ?? rec.Date ?? null;
        const challansRaw = firstAmount(rec, ["challans", "Challans"]);
        const amount = firstAmount(rec, ["fine_amount", "Amount"]);
        if (!dateStr || challansRaw === null || amount === null) continue;
        const challans = Math.round(challansRaw);

        const date = new Date(dateStr);
        if (isNaN(date.getTime()) || date.getTime() > Date.now()) continue;

        const existing = await prisma.trafficCollection.findFirst({
          where: { districtId: ctx.districtId, date },
        });

        if (!existing) {
          await prisma.trafficCollection.create({
            data: {
              districtId: ctx.districtId,
              date,
              challans,
              amount,
              source: "Karnataka Police / data.gov.in",
            },
          });
          newCount++;
        }
      }
    }

    ctx.log(`Police: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
